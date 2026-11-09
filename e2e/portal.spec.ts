import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Waits for the newest e-mail to an address (written by scripts/smtp-sink.mjs) and returns its 6-digit code. */
async function codeFor(email: string, after = 0): Promise<string> {
  const file = path.join(process.cwd(), ".data-e2e-mail", `${email.toLowerCase()}.eml`);
  for (let i = 0; i < 50; i++) {
    try {
      if (statSync(file).mtimeMs > after) {
        const m = readFileSync(file, "utf8").match(/Subject: (\d{6}) is your/);
        if (m) return m[1];
      }
    } catch {
      /* not delivered yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No code e-mailed to ${email}`);
}

/** Mobile number and gender are required at sign-up. */
async function fillMobileAndGender(page: Page, gender = "Female", mobile = "+92 300 1234567") {
  await page.getByLabel(/Mobile number/).fill(mobile);
  await page.locator(".gender-pick__opt", { hasText: new RegExp(`^${gender}$`) }).click();
}

async function typeCode(page: Page, code: string) {
  await page.getByLabel("Digit 1").fill(code); // filling the first box spreads the digits
  await expect(page.getByLabel("Digit 6")).toHaveValue(code[5]);
}

async function adminPage(browser: import("@playwright/test").Browser) {
  // Each admin session comes from its own address so the suite stays under the login rate limit.
  const ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const admin = await (await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip } })).newPage();
  await admin.goto("/admin/login");
  await admin.getByLabel("Password").fill("e2e-password");
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin).toHaveURL(/\/admin$/);
  return admin;
}

test("individual verifies their e-mail with a code, buys a certification and starts the quest", async ({ page, browser }) => {
  const email = `learner${Date.now()}@example.com`;
  const admin = await adminPage(browser);
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="customer-experience"])');
  await form.locator("input[name=price]").fill("20000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  await page.goto("/certifications/customer-experience");
  await page.getByRole("link", { name: /Enrol now/ }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole("link", { name: /Create a free account/ }).click();
  await expect(page.getByRole("radio", { name: /Individual/ })).toHaveAttribute("aria-checked", "true");
  await page.getByLabel(/Full name/).fill("Test Learner");
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page);
  await page.getByRole("button", { name: /Create my account/ }).click();

  // Unverified accounts cannot reach the portal yet.
  await expect(page).toHaveURL(/\/verify-email/);
  const other = await page.context().newPage();
  await other.goto("/learn");
  await expect(other).toHaveURL(/\/verify-email/);
  await other.close();

  const code = await codeFor(email);
  await typeCode(page, code === "000000" ? "111111" : "000000"); // a wrong code first
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/That code is not correct/)).toBeVisible();
  await typeCode(page, code);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/checkout\/customer-experience/);

  await expect(page.getByText("Unlock the next stage only")).toBeVisible(); // pay-as-you-go is offered too
  await page.getByRole("button", { name: /Unlock everything · PKR 20,000/ }).click();
  await expect(page).toHaveURL(/\/orders\/LIC-/);
  const ref = page.url().split("/").pop()!;
  await page.locator("label.choice", { hasText: "Easypaisa" }).click();
  await page.getByLabel(/Transaction ID/).fill("EP-998877");
  await page.getByRole("button", { name: /Submit payment details/ }).click();
  await expect(page.getByText(/Attach a screenshot or PDF/)).toBeVisible();
  await expect(page.getByLabel(/Transaction ID/)).toHaveValue("EP-998877"); // kept after the error
  await page.locator("input[name=proof]").setInputFiles(path.join(__dirname, "fixtures", "receipt.png"));
  await page.getByRole("button", { name: /Submit payment details/ }).click();
  await expect(page.getByText(/We have your payment details/).first()).toBeVisible();

  await admin.goto("/admin/orders");
  const card = admin.locator(".order-admin", { hasText: ref });
  await card.getByRole("button", { name: /Approve/ }).click();
  await expect(admin.locator(".order-admin", { hasText: ref })).toHaveCount(0);

  await page.goto("/learn/customer-experience");
  await expect(page.locator(".qnode__link.is-locked")).toHaveCount(5); // stages 2-5 and the final exam
  expect((await page.request.get("/scorm/customer-experience/s1/index.html")).status()).toBe(403);
  await page.locator(".qnode__link").first().click();
  await page.getByRole("button", { name: /Begin the stage/ }).click();
  await expect(page.locator(".lcard")).toBeVisible();

  // Play through stage 1: checks give instant feedback, completing shows the celebration at once.
  const course = JSON.parse(readFileSync(path.join(process.cwd(), "content/courses/customer-experience.json"), "utf8"));
  const s1 = course.sessions[0];
  for (let i = 0; i < s1.cards.length; i++) {
    await expect(page.locator(".lesson__count")).toHaveText(`${i + 1} / ${s1.cards.length}`);
    if (s1.cards[i].type === "check") {
      await page.locator(".check-opt").nth(s1.cards[i].answer).click();
      await expect(page.locator(".check-fb.is-right")).toBeVisible();
    }
    if (i < s1.cards.length - 1) await page.locator(".lesson__nav .btn--primary").click();
  }
  await page.getByRole("button", { name: "Complete lesson" }).click();
  await expect(page.getByRole("dialog", { name: "Lesson complete!" })).toBeVisible();
  await page.getByRole("button", { name: /Start the stage test/ }).click();
  const quiz = page.frameLocator(".scorm__frame");
  for (const [n, q] of s1.quiz.entries()) {
    await quiz.locator(".opt", { has: quiz.locator("span", { hasText: q.options[q.answer] }) }).first().click();
    await quiz.locator("#next").click();
    if (n === s1.quiz.length - 1) break;
  }
  const cleared = page.getByRole("dialog", { name: /Stage cleared/ });
  await expect(cleared).toBeVisible();
  await cleared.getByRole("link", { name: /Next stage/ }).click(); // enabled once the server has recorded the pass
  await expect(page).toHaveURL(/\/learn\/customer-experience\/s2$/);
  await expect(page.getByRole("button", { name: /Begin the stage/ })).toBeVisible();

  // Logging in with the wrong account type is explained.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("radio", { name: /Company/ }).click();
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.getByRole("button", { name: /Log in to company account/ }).click();
  await expect(page.getByText(/belongs to an individual account/)).toBeVisible();
});

test("company verifies its e-mail, waits for approval, then manages its team", async ({ page, browser }) => {
  const email = `hr${Date.now()}@company.pk`;
  await page.goto("/register?type=company");
  await expect(page.getByRole("radio", { name: /Company/ })).toHaveAttribute("aria-checked", "true");
  await page.getByLabel(/Registered company name/).fill("Test Bank Limited");
  await page.locator("select[name=industry]").selectOption("Commercial Banking");
  await page.locator("select[name=employees]").selectOption("201–500");
  await page.getByLabel(/^City/).fill("Karachi");
  await page.getByLabel(/Full name/).fill("Hina Raza");
  await page.getByLabel(/^Designation/).fill("Head of L&D");
  await page.getByLabel(/Work e-mail/).fill(email);
  await fillMobileAndGender(page, "Male");
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await page.getByRole("button", { name: /Register my company/ }).click();
  await expect(page).toHaveURL(/\/verify-email/);
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page).toHaveURL(/\/company\/pending/);
  await expect(page.getByRole("heading", { name: /under review/ })).toBeVisible();
  await page.goto("/company");
  await expect(page).toHaveURL(/\/company\/pending/); // no company features before approval

  const admin = await adminPage(browser);
  await admin.goto("/admin/companies");
  const card = admin.locator(".order-admin", { hasText: "Test Bank Limited" });
  await expect(card).toContainText("Hina Raza");
  await card.getByRole("button", { name: "Approve company" }).click();
  await expect(admin.locator(".order-admin", { hasText: "Test Bank Limited" })).toHaveCount(0);

  await page.goto("/company");
  await expect(page.getByRole("heading", { name: "Test Bank Limited" })).toBeVisible();

  // Password reset by e-mailed code.
  await page.context().clearCookies();
  await page.goto("/forgot-password");
  const before = Date.now();
  await page.locator("input[name=email]").fill(email);
  await page.getByRole("button", { name: /Send me a code/ }).click();
  await expect(page).toHaveURL(/step=code/);
  await typeCode(page, await codeFor(email, before));
  await page.locator("input[name=password]").fill("newpassword456");
  await page.getByRole("button", { name: /Save new password/ }).click();
  await expect(page).toHaveURL(/\/company$/);
});

test("certificate verification rejects unknown codes", async ({ page }) => {
  await page.goto("/verify");
  await page.getByLabel(/Certificate code/).fill("LI-NOPE-NOPE");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { name: "No certificate matches this code." })).toBeVisible();
});

async function signUpIndividual(page: Page, name: string, email: string, from = "/register") {
  await page.goto(from);
  await page.getByLabel(/Full name/).fill(name);
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page);
  await page.getByRole("button", { name: /Create my account/ }).click();
  await expect(page).toHaveURL(/\/verify-email/);
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/learn/);
}

test("a learner's invite link brings a friend and pays both of them XP", async ({ page, browser }) => {
  const stamp = Date.now();
  await signUpIndividual(page, "Ayesha Inviter", `inviter${stamp}@example.com`);
  const link = await page.getByLabel("Your invite link").inputValue();
  expect(link).toMatch(/\/r\/[A-Z0-9]{6}$/);

  const friend = await (await browser.newContext()).newPage();
  await friend.goto(new URL(link).pathname);
  await expect(friend).toHaveURL(/\/certifications\?invited=1/);
  await expect(friend.getByText(/Ayesha.*invited you/)).toBeVisible();
  await signUpIndividual(friend, "Bilal Friend", `friend${stamp}@example.com`);
  await expect(friend.locator(".xp-feed")).toContainText("Welcome bonus");

  await page.reload();
  await expect(page.locator(".invite-panel__stats dd").first()).toHaveText("1");
  await expect(page.locator(".xp-feed")).toContainText("Friend joined: Bilal");

  // The weekly league counts this week's XP.
  await page.goto("/learn/leaderboard");
  await expect(page.locator(".league-card")).toContainText(/You are #\d+ of \d+/);

  // Reminder cron is closed without the secret; forged unsubscribe links are refused.
  expect((await page.request.get("/api/cron/reminders")).status()).toBe(404);
  await friend.goto("/api/unsubscribe?u=x&t=forged");
  await expect(friend.getByText("Link not valid")).toBeVisible();
});

/** Signs up (or, if the account already exists from an earlier run, logs in) as an individual. */
async function individual(page: Page, name: string, email: string) {
  await page.goto("/register");
  await page.getByLabel(/Full name/).fill(name);
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page);
  await page.getByRole("button", { name: /Create my account/ }).click();
  if (await page.getByText(/already exists/).isVisible().catch(() => false)) {
    await page.goto("/login");
    await page.locator("input[name=email]").fill(email);
    await page.locator("input[name=password]").fill("password123");
    await page.getByRole("button", { name: /^Log in/ }).click();
    await expect(page).toHaveURL(/\/learn/);
    return;
  }
  await expect(page).toHaveURL(/\/verify-email/);
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/learn/);
}

test("one login: the owner logs in as an individual and switches to admin", async ({ page, browser }) => {
  // The header offers Log in and Create account; the ifSPACE window is on the page.
  await page.goto("/");
  await expect(page.locator(".nav").getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.locator(".nav").getByRole("link", { name: "Create account" })).toBeVisible();
  await expect(page.locator(".ifspace")).toBeVisible();

  // A normal learner has no admin access: /admin sends them back to their dashboard.
  const learner = `staff${Date.now()}@example.com`;
  const other = await (await browser.newContext()).newPage();
  await individual(other, "Saad Staff", learner);
  await other.goto("/admin");
  await expect(other).toHaveURL(/\/learn$/);

  // info@learningimpact.pk is always an admin: log in as Individual, then switch.
  await individual(page, "Learning Impact", "info@learningimpact.pk");
  await expect(page.locator(".pnav")).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("link", { name: /Switch to Admin/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: /Switch to my learner account/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.goto("/");
  await page.locator(".nav").getByRole("link", { name: /Admin/ }).click(); // header button on the public site
  await expect(page).toHaveURL(/\/admin$/);

  // The owner gives the learner admin access; they can now switch too. Owners cannot be removed.
  await page.goto(`/admin/learners?q=${encodeURIComponent(learner)}`);
  await page.locator(".order-admin", { hasText: learner }).getByRole("button", { name: "Give admin access" }).click();
  await expect(page.locator(".order-admin", { hasText: learner }).getByRole("button", { name: "Remove admin access" })).toBeVisible();
  await page.goto("/admin/learners?q=info%40learningimpact.pk");
  await expect(page.locator(".order-admin", { hasText: "info@learningimpact.pk" }).getByText("Owner · Admin")).toBeVisible();
  await other.goto("/admin");
  await expect(other).toHaveURL(/\/admin$/);

  // The owner can always log in with the server's admin password (even with the wrong tab chosen).
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("radio", { name: /Company/ }).click();
  await page.locator("input[name=email]").fill("info@learningimpact.pk");
  await page.locator("input[name=password]").fill("e2e-password");
  await page.getByRole("button", { name: /Log in/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("link", { name: /Switch to Admin/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

/** Plays a whole stage (cards, then the SCORM stage test with the right answers). */
async function playStage(page: Page, s: { cards: { type: string; answer?: number }[]; quiz: { options: string[]; answer: number }[] }) {
  await page.getByRole("button", { name: /Begin the stage/ }).click();
  for (let i = 0; i < s.cards.length; i++) {
    await expect(page.locator(".lesson__count")).toHaveText(`${i + 1} / ${s.cards.length}`);
    if (s.cards[i].type === "check") {
      await page.locator(".check-opt").nth(s.cards[i].answer!).click();
      await expect(page.locator(".check-fb")).toBeVisible();
    }
    if (i < s.cards.length - 1) await page.locator(".lesson__nav .btn--primary").click();
  }
  await page.getByRole("button", { name: "Complete lesson" }).click();
  await page.getByRole("button", { name: /Start the stage test/ }).click();
  const quiz = page.frameLocator(".scorm__frame");
  for (const q of s.quiz) {
    await quiz.locator(".opt", { has: quiz.locator("span", { hasText: q.options[q.answer] }) }).first().click();
    await quiz.locator("#next").click();
  }
}

test("stage 1 is free for every learner; the rest asks for payment; admins preview everything", async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="conflict-management"])');
  await form.locator("input[name=price]").fill("18000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  // Catalogue and course page say "Start for free".
  await page.goto("/certifications");
  await expect(page.locator(".cert-card", { hasText: "Conflict Management" }).getByText(/Start for free/)).toBeVisible();
  await page.goto("/certifications/conflict-management");
  await page.getByRole("link", { name: /Start for free/ }).click();
  await expect(page).toHaveURL(/\/register\?next=/);

  const email = `trial${Date.now()}@example.com`;
  await page.getByLabel(/Full name/).fill("Tara Trial");
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page);
  await page.getByRole("button", { name: /Create my account/ }).click();
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/learn\/conflict-management\/s1$/); // straight into the free stage
  await expect(page.getByText(/Free stage\./)).toBeVisible();

  const course = JSON.parse(readFileSync(path.join(process.cwd(), "content/courses/conflict-management.json"), "utf8"));
  await playStage(page, course.sessions[0]);
  const cleared = page.getByRole("dialog", { name: /Stage cleared/ });
  await expect(cleared).toContainText("Your free stage is done");
  await cleared.getByRole("link", { name: /Unlock the full certification · PKR 18,000/ }).click();
  await expect(page).toHaveURL(/\/checkout\/conflict-management/);

  // Stage 2 is behind the paywall; the map and dashboard explain it.
  await page.goto("/learn/conflict-management/s2");
  await expect(page).toHaveURL(/\/checkout\/conflict-management/);
  await page.goto("/learn/conflict-management");
  await expect(page.getByText("You cleared your free stage!")).toBeVisible();
  await page.goto("/learn");
  await expect(page.locator(".quest-card", { hasText: "Conflict Management" })).toContainText("Free stage");

  // Admin preview: any stage and the exam bank, nothing recorded.
  const owner = await (await browser.newContext()).newPage();
  await owner.goto("/login");
  await owner.locator("input[name=email]").fill("info@learningimpact.pk");
  await owner.locator("input[name=password]").fill("e2e-password");
  await owner.getByRole("button", { name: /^Log in/ }).click();
  await expect(owner).toHaveURL(/\/learn$/);
  await owner.goto("/learn/green-banking/s4"); // not published, stage 4
  await expect(owner.getByText(/Admin preview\./)).toBeVisible();
  await owner.getByRole("button", { name: /Begin the stage/ }).click();
  await expect(owner.locator(".lcard")).toBeVisible();
  // The admin's place is remembered in preview too (without XP).
  for (let i = 0; i < 3; i++) await owner.locator(".lesson__nav .btn--primary").click({ force: true }).catch(() => {});
  const at = await owner.locator(".lesson__count").innerText();
  await owner.waitForTimeout(500);
  await owner.reload();
  await expect(owner.locator(".lesson__count")).toHaveText(at);
  await owner.goto("/learn/green-banking/exam");
  await expect(owner.getByText(/Admin preview of the final exam/)).toBeVisible();
  await expect(owner.locator(".exam-preview .is-answer")).toHaveCount(50);
});

test("each stage offers its presentation as a PDF; the admin dashboard links to every section", async ({ page, browser }) => {
  await page.goto("/login");
  await page.locator("input[name=email]").fill("info@learningimpact.pk");
  await page.locator("input[name=password]").fill("e2e-password");
  await page.getByRole("button", { name: /^Log in/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.goto("/learn/it-infrastructure/s2"); // admin preview
  const link = page.locator(".slides-link");
  await expect(link).toHaveAttribute("href", "/api/slides/it-infrastructure/s2");
  const pdf = await page.request.get("/api/slides/it-infrastructure/s2");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  // a signed-out visitor cannot download slides
  const anon = await browser.newContext();
  expect((await anon.request.get("http://localhost:3200/api/slides/it-infrastructure/s2")).status()).toBe(404);
  await anon.close();

  await page.goto("/admin");
  await expect(page.locator(".tile")).toHaveCount(15);
  await page.locator(".tile", { hasText: "Companies to approve" }).click();
  await expect(page).toHaveURL(/\/admin\/companies$/);
});

test("a learner who leaves part-way comes back to the same card; a finished free stage stays finished", async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="talent-management"])');
  await form.locator("input[name=price]").fill("15000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  const email = `resume${Date.now()}@example.com`;
  await signUpIndividual(page, "Rita Resume", email);
  const course = JSON.parse(readFileSync(path.join(process.cwd(), "content/courses/talent-management.json"), "utf8"));
  const s1 = course.sessions[0];
  await page.goto("/learn/talent-management/s1");
  await page.getByRole("button", { name: /Begin the stage/ }).click();
  for (let i = 0; i < 6; i++) {
    if (s1.cards[i].type === "check") await page.locator(".check-opt").first().click();
    await page.locator(".lesson__nav .btn--primary").click();
  }
  await expect(page.locator(".lesson__count")).toHaveText(`7 / ${s1.cards.length}`);
  await page.waitForTimeout(500); // the place is saved in the background
  const cookies = await page.context().cookies();
  await page.context().close(); // the learner closes the browser

  // Comes back later in a new window: the stage, the map and the dashboard all pick up where they left off.
  const back = await (await browser.newContext()).newPage();
  await back.context().addCookies(cookies);
  await back.goto("/learn/talent-management");
  await expect(back.locator(".qnode", { hasText: "Stage 1" })).toContainText(`In progress · card 7 of ${s1.cards.length}`);
  await back.goto("/learn");
  await expect(back.locator(".quest-card", { hasText: "Talent" })).toContainText(`card 7 of ${s1.cards.length}`);
  await back.goto("/certifications/talent-management");
  await back.getByRole("link", { name: /Continue my free stage/ }).click();
  await expect(back.getByText("Welcome back!")).toBeVisible();
  await expect(back.locator(".lesson__count")).toHaveText(`7 / ${s1.cards.length}`);

  // Finishes the stage, closes, comes back: stage 1 shows as cleared.
  for (let i = 6; i < s1.cards.length; i++) {
    if (s1.cards[i].type === "check") await back.locator(".check-opt").nth(s1.cards[i].answer).click();
    if (i < s1.cards.length - 1) await back.locator(".lesson__nav .btn--primary").click();
  }
  await back.getByRole("button", { name: "Complete lesson" }).click();
  await back.getByRole("button", { name: /Start the stage test/ }).click();
  const quiz = back.frameLocator(".scorm__frame");
  for (const q of s1.quiz) {
    await quiz.locator(".opt", { has: quiz.locator("span", { hasText: q.options[q.answer] }) }).first().click();
    await quiz.locator("#next").click();
  }
  await expect(back.getByRole("dialog", { name: /Stage cleared/ })).toBeVisible();
  const cookies2 = await back.context().cookies();
  await back.context().close();
  const later = await (await browser.newContext()).newPage();
  await later.context().addCookies(cookies2);
  await later.goto("/learn/talent-management");
  await expect(later.locator(".qnode", { hasText: "Stage 1" })).toContainText("Cleared");
  await expect(later.getByText("You cleared your free stage!")).toBeVisible();
  await later.goto("/learn/talent-management/s1");
  await expect(later.getByRole("heading", { name: "Stage cleared!" })).toBeVisible();
});

test("sign-up requires mobile and gender; Admin › Users lists them and exports Excel; visitors are charted", async ({ page, browser }) => {
  const email = `gender${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel(/Full name/).fill("Gita Gender");
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  // the browser itself blocks an empty required field; bypass it to check the server rules too
  await page.locator("form.auth__form").evaluate((f) => f.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: /Create my account/ }).click();
  await expect(page.getByText(/Enter your mobile number/)).toBeVisible();
  await expect(page.getByText("Please choose an option.")).toBeVisible();
  await page.getByLabel(/Mobile number/).fill("+44 7700 900123");
  await page.locator(".gender-pick__opt", { hasText: /^Female$/ }).click();
  await page.locator("input[name=password]").fill("password123");
  await page.getByRole("button", { name: /Create my account/ }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const admin = await adminPage(browser);
  await admin.goto("/admin/users");
  const row = admin.locator(".users-table tbody tr", { hasText: email });
  await expect(row).toContainText("+44 7700 900123");
  await expect(row).toContainText("Female");
  await admin.locator("select[name=gender]").selectOption("Male");
  await admin.getByRole("button", { name: "Apply" }).click();
  await expect(admin.locator(".users-table tbody tr", { hasText: email })).toHaveCount(0);

  const xls = await admin.request.get(`/admin/users-export?q=${encodeURIComponent(email)}`);
  expect(xls.status()).toBe(200);
  expect(xls.headers()["content-type"]).toContain("spreadsheetml");
  const { unzipSync, strFromU8 } = await import("fflate");
  const sheet = strFromU8(unzipSync(new Uint8Array(await xls.body()))["xl/worksheets/sheet1.xml"]);
  expect(sheet).toContain(email);
  expect(sheet).toContain("+44 7700 900123");
  expect((await page.request.get("/admin/users-export")).status()).toBe(401); // not for learners

  // Visits from real browsers are counted (headless test browsers are ignored as bots).
  const ua = { "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537.36", "content-type": "application/json" };
  expect((await admin.request.post("/api/track", { headers: ua, data: { path: "/certifications" } })).status()).toBe(204);
  await admin.request.post("/api/track", { headers: { ...ua, "user-agent": "Googlebot/2.1" }, data: { path: "/" } });
  await admin.goto("/admin");
  await admin.getByRole("tab", { name: "Today" }).click();
  await expect(admin.locator(".visitors__totals strong").first()).not.toHaveText("0");
  await admin.getByRole("button", { name: "Show as table" }).click();
  await expect(admin.locator(".visitors__table tbody tr")).toHaveCount(24);
});

test("regulatory library: admin reviews a country map, publishes a draft quest, and the public library lists it with its sources", async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await admin.goto("/admin/library");
  await expect(admin.getByRole("heading", { name: "Global Banking Regulatory Training" })).toBeVisible();
  // a researched country opens; a planned one is not a link yet
  await admin.locator("a.tile", { hasText: "Pakistan" }).click();
  await expect(admin).toHaveURL(/\/admin\/library\/pk$/);
  await expect(admin.getByRole("heading", { name: "Pakistan", level: 1 })).toBeVisible();
  await expect(admin.locator(".cls--mandatory-explicit").first()).toBeVisible();
  await expect(admin.locator(".lib__ok").first()).toBeAttached();
  // the draft quest is not public yet
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/regulatory");
  await expect(anon.locator(".reg-quest")).toHaveCount(0);
  // publish it
  const form = admin.locator("form.admin-inline", { has: admin.locator("input[value=pk-sbp-aml-cft-cpf]") });
  await form.locator("input[name=price]").fill("15000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();
  await expect(admin.locator(".badge", { hasText: "Live" }).first()).toBeVisible();
  // the public library and sales page show it with its regulatory basis
  await anon.goto("/regulatory");
  await anon.locator(".reg-quest", { hasText: "Pakistan | AML/CFT/CPF Regulatory Compliance" }).click();
  await expect(anon).toHaveURL(/\/certifications\/pk-sbp-aml-cft-cpf$/);
  await expect(anon.locator(".reg-basis")).toContainText("Mandatory – Explicit");
  await expect(anon.locator(".reg-basis a").first()).toHaveAttribute("href", /^https:\/\//);
  // the certifications page features the library with country flags and lists the quest as a certification
  await page.goto("/certifications");
  await expect(page.locator(".reg-feature")).toBeVisible();
  await expect(page.locator(".reg-flag", { hasText: "Pakistan" }).locator(".flag svg")).toBeVisible();
  await page.getByRole("tab", { name: "Banking Regulation" }).click();
  await expect(page.locator(".cert-card", { hasText: "AML/CFT/CPF Regulatory Compliance" })).toBeVisible();
  await page.locator(".reg-flag", { hasText: "Pakistan" }).click();
  await expect(page).toHaveURL(/\/regulatory#pk$/);
});

test("after the free stage a learner can unlock the whole quest or pay stage by stage; paid stages are deducted", async ({ browser }) => {
  const admin = await adminPage(browser);
  // A separate address keeps this sign-up under the per-network registration limit.
  const page = await (await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.8.1.1" } })).newPage();
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="hr-operations"])');
  await form.locator("input[name=price]").fill("8000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  const email = `stagewise${Date.now()}@example.com`;
  await page.goto("/register?next=/checkout/hr-operations");
  await page.getByLabel(/Full name/).fill("Stage Buyer");
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page, "Male");
  await page.getByRole("button", { name: /Create my account/ }).click();
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/checkout\/hr-operations/);

  // 5 stages for PKR 8,000: stage 1 free, then PKR 2,000 per stage, or PKR 8,000 for everything.
  await expect(page.locator(".unlock-choice__price").first()).toHaveText("PKR 8,000");
  await expect(page.locator(".unlock-choice__price").nth(1)).toHaveText("PKR 2,000");
  await page.getByRole("button", { name: /Unlock stage 2 · PKR 2,000/ }).click();
  await expect(page).toHaveURL(/\/orders\/LIC-/);
  const ref = page.url().split("/").pop()!;
  await expect(page.locator(".checkout__summary")).toContainText("Single stage · Stage 2");
  await page.locator("label.choice", { hasText: "JazzCash" }).click();
  await page.getByLabel(/Transaction ID/).fill("JC-2000");
  await page.locator("input[name=proof]").setInputFiles(path.join(__dirname, "fixtures", "receipt.png"));
  await page.getByRole("button", { name: /Submit payment details/ }).click();
  await expect(page.getByText(/We have your payment details/).first()).toBeVisible();

  await admin.goto("/admin/orders");
  const card = admin.locator(".order-admin", { hasText: ref });
  await expect(card).toContainText("Stage 2");
  await card.getByRole("button", { name: /Approve/ }).click();
  await expect(admin.locator(".order-admin", { hasText: ref })).toHaveCount(0);

  // Stage 2 is no longer behind the paywall (it opens once stage 1 is cleared); stage 3 is offered next.
  await page.goto("/learn/hr-operations");
  await expect(page.locator(".unlock-banner")).toContainText("PKR 6,000");
  await expect(page.locator(".unlock-banner")).toContainText("stage 3");
  await expect(page.locator(".qnode__note").nth(1)).toContainText("Clear the previous stage to unlock");
  await expect(page.locator(".qnode__note").nth(2)).toContainText("Unlock this stage for PKR 2,000");

  // The whole quest now costs the remaining PKR 6,000.
  await page.goto("/checkout/hr-operations");
  await expect(page.locator(".unlock-choice__price").first()).toHaveText("PKR 6,000");
  await expect(page.getByText(/You already paid PKR 2,000/)).toBeVisible();
  await page.getByRole("button", { name: /Unlock everything · PKR 6,000/ }).click();
  await expect(page).toHaveURL(/\/orders\/LIC-/);
  await expect(page.locator(".checkout__summary")).toContainText("PKR 6,000");
});

test("learners outside Pakistan see prices in US dollars and get international payment options", async ({ browser }) => {
  const admin = await adminPage(browser);
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="hr-operations"])');
  await form.locator("input[name=price]").fill("8000");
  await form.locator("input[name=price_usd]").fill("40");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  // A visitor in Pakistan (by time zone) sees rupees; elsewhere, dollars.
  const pk = await (await browser.newContext({ timezoneId: "Asia/Karachi" })).newPage();
  await pk.goto("/certifications/hr-operations");
  await expect(pk.getByText(/PKR 8,000/).first()).toBeVisible();

  const page = await (await browser.newContext({ timezoneId: "Europe/London", extraHTTPHeaders: { "x-forwarded-for": "10.8.2.2" } })).newPage();
  const email = `usd${Date.now()}@example.com`;
  await page.goto("/register?next=/checkout/hr-operations");
  await page.getByLabel(/Full name/).fill("Dollar Buyer");
  await page.getByLabel("E-mail", { exact: false }).first().fill(email);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await fillMobileAndGender(page, "Male", "+44 7700 900123");
  await page.getByRole("button", { name: /Create my account/ }).click();
  await typeCode(page, await codeFor(email));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/checkout\/hr-operations/);

  // 5 stages for $40: $40 for everything or $10 per stage.
  await expect(page.locator(".unlock-choice__price").first()).toHaveText("$40");
  await expect(page.locator(".unlock-choice__price").nth(1)).toHaveText("$10");
  await page.getByRole("button", { name: /Unlock stage 2 · \$10/ }).click();
  await expect(page).toHaveURL(/\/orders\/LIC-/);
  await expect(page.locator(".checkout__summary")).toContainText("$10");
  await expect(page.locator("label.choice", { hasText: "International bank transfer" })).toBeVisible();
  await expect(page.locator("label.choice", { hasText: "JazzCash" })).toHaveCount(0);
});
