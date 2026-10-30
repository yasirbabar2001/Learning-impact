import { expect, test } from "@playwright/test";

test("a company books a program and the admin sees it", async ({ page }) => {
  const company = `E2E Co ${Date.now()}`;

  await page.goto("/programs");
  await page.locator(".program-card").first().click();
  await page.getByRole("link", { name: "Book this program" }).click();
  await expect(page).toHaveURL(/\/book\?program=/);

  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("This is required.")).toBeVisible();
  await page.locator("label.choice", { hasText: "On-site" }).click();
  await page.getByLabel("Number of participants").fill("12");
  await page.getByRole("button", { name: /Continue/ }).click();

  await page.getByLabel(/Company/).fill(company);
  await page.getByLabel(/Your name/).fill("Test Person");
  await page.getByLabel(/Work e-mail/).fill("test@example.com");
  await page.getByRole("button", { name: /Send booking request/ }).click();
  await expect(page.locator(".success__ref strong")).toHaveText(/^LI-\d{4}-[A-Z0-9]{4}$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.locator("button.req", { hasText: company }).click();
  await page.getByRole("button", { name: "Confirmed", exact: true }).click();
  await expect(page.locator(".req", { hasText: company }).locator(".badge")).toHaveText("Confirmed");
});

test("a company requests a trainer", async ({ page }) => {
  await page.goto("/trainers?topic=Negotiation%20skills");
  await expect(page.getByLabel(/What should the trainer cover/)).toHaveValue("Negotiation skills");
  await page.locator("label.choice", { hasText: "Workshop" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("label.choice", { hasText: "Hybrid" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel(/Company/).fill("Trainer Co");
  await page.getByLabel(/Your name/).fill("Test Person");
  await page.getByLabel(/Work e-mail/).fill("not-an-email");
  await page.getByRole("button", { name: /Request a trainer/ }).click();
  await expect(page.getByText("Enter a valid work e-mail.")).toBeVisible();
  await page.getByLabel(/Work e-mail/).fill("test@example.com");
  await page.getByRole("button", { name: /Request a trainer/ }).click();
  await expect(page.getByText("Trainer request received")).toBeVisible();
});

test("admin pages and export require sign-in", async ({ page, request }) => {
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await request.get("/admin/export")).status()).toBe(401);
});
