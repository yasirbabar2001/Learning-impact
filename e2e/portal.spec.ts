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

async function typeCode(page: Page, code: string) {
  await page.getByLabel("Digit 1").fill(code); // filling the first box spreads the digits
  await expect(page.getByLabel("Digit 6")).toHaveValue(code[5]);
}

async function adminPage(browser: import("@playwright/test").Browser) {
  const admin = await (await browser.newContext()).newPage();
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

  await page.getByRole("button", { name: /Continue to payment/ }).click();
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
  await page.getByLabel(/Phone/).fill("0300 1234567");
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
  await owner.goto("/learn/green-banking/exam");
  await expect(owner.getByText(/Admin preview of the final exam/)).toBeVisible();
  await expect(owner.locator(".exam-preview .is-answer")).toHaveCount(50);
});
