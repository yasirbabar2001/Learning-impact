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
