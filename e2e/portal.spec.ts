import path from "node:path";
import { expect, test } from "@playwright/test";

test("learner buys a certification by bank transfer and starts the quest", async ({ page, browser }) => {
  const stamp = Date.now();
  const admin = await (await browser.newContext()).newPage();
  await admin.goto("/admin/login");
  await admin.getByLabel("Password").fill("e2e-password");
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/admin/certifications");
  const form = admin.locator('form:has(input[name=slug][value="customer-experience"])');
  await form.locator("input[name=price]").fill("20000");
  await form.locator("input[name=published]").check();
  await form.getByRole("button", { name: "Save" }).click();

  await page.goto("/certifications/customer-experience");
  await expect(page.getByText("PKR 20,000").first()).toBeVisible();
  await page.getByRole("link", { name: /Enrol now/ }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole("link", { name: /Create a free account/ }).click();
  await page.getByLabel(/Full name/).fill("Test Learner");
  await page.getByLabel("E-mail").fill(`learner${stamp}@example.com`);
  await page.locator("input[name=password]").fill("password123");
  await page.locator("input[name=terms]").check();
  await page.getByRole("button", { name: /Create my account/ }).click();
  await expect(page).toHaveURL(/\/checkout\/customer-experience/);
  await page.getByRole("button", { name: /Continue to payment/ }).click();
  await expect(page).toHaveURL(/\/orders\/LIC-/);
  const ref = page.url().split("/").pop()!;

  // Submitting without a receipt is refused.
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
  await expect(card.getByRole("link", { name: "View receipt" })).toBeVisible();
  await card.getByRole("button", { name: /Approve/ }).click();
  await expect(admin.locator(".order-admin", { hasText: ref })).toHaveCount(0);

  await page.goto("/learn/customer-experience");
  await expect(page.locator(".qnode").first()).toContainText("Stage 1");
  await expect(page.locator(".qnode__link.is-locked")).toHaveCount(5); // stages 2-5 and the final exam
  // The stage test is only served after the lesson.
  expect((await page.request.get("/scorm/customer-experience/s1/index.html")).status()).toBe(403);
  await page.locator(".qnode__link").first().click();
  await page.getByRole("button", { name: /Begin the stage/ }).click();
  await expect(page.locator(".lcard")).toBeVisible();
});

test("certificate verification rejects unknown codes", async ({ page }) => {
  await page.goto("/verify");
  await page.getByLabel(/Certificate code/).fill("LI-NOPE-NOPE");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { name: "No certificate matches this code." })).toBeVisible();
});
