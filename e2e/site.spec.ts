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

  // On-site training cannot continue without a proposed location.
  await expect(page.getByRole("heading", { name: "Venue & needs" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("This is required.").first()).toBeVisible();
  await page.locator("label.choice", { hasText: "At our premises" }).click();
  await page.getByLabel(/Training city/).fill("Lahore");
  await page.getByLabel(/Venue name/).fill("Gulberg III head office");
  await page.locator("label.choice", { hasText: "Middle management" }).click();
  await page.locator("label.choice", { hasText: "Participant certificates" }).click();
  await page.locator("label.choice", { hasText: "Refreshments & lunch" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();

  await page.getByLabel(/Company/).fill(company);
  await page.getByLabel(/Your name/).fill("Test Person");
  await page.getByLabel(/Work e-mail/).fill("test@example.com");
  await page.getByRole("button", { name: /Send booking request/ }).click();
  await expect(page.locator(".success__ref strong")).toHaveText(/^LI-\d{4}-[A-Z0-9]{4}$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/admin/login"); // owner password sign-in (backup)
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.locator("button.req", { hasText: company }).click();
  const detail = page.locator(".detail__list");
  await expect(detail).toContainText("At our premises");
  await expect(detail).toContainText("Lahore");
  await expect(detail).toContainText("Gulberg III head office");
  await expect(detail).toContainText("Participant certificates; Refreshments & lunch");
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
  await page.locator("label.choice", { hasText: "Learning Impact to arrange" }).click();
  await page.getByLabel(/Training city/).fill("Karachi");
  await page.locator("label.choice", { hasText: "Microsoft Teams" }).click();
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
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/); // one login for everyone
  await expect(page.getByRole("radio", { name: /Admin/ })).toHaveCount(0); // no separate admin choice
  expect((await request.get("/admin/export")).status()).toBe(401);
});

test("a company books training from its industry and the admin sees the industry", async ({ page }) => {
  const company = `Industry Co ${Date.now()}`;
  await page.goto("/industries");
  await page.getByRole("tab", { name: "Specialised sectors" }).click();
  await page.getByPlaceholder(/Search an industry/).fill("payment");
  const card = page.locator(".industry-card", { hasText: "Payment Service Providers" });
  await expect(card).toContainText("Fraud prevention");
  await card.getByRole("link", { name: /Book training/ }).click();
  await expect(page).toHaveURL(/\/book\?industry=payment-service-providers/);

  await page.locator("label.choice", { hasText: "Something tailored" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("label.choice", { hasText: "Live virtual" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  // Virtual training asks for a platform instead of a venue.
  await expect(page.getByText("Proposed training location")).toHaveCount(0);
  await page.locator("label.choice", { hasText: "Zoom" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByLabel("Industry / sector")).toHaveValue("Payment Service Providers");
  await page.getByLabel(/Company/).fill(company);
  await page.getByLabel(/Your name/).fill("Test Person");
  await page.getByLabel(/Work e-mail/).fill("test@example.com");
  await page.getByRole("button", { name: /Send booking request/ }).click();
  await expect(page.getByText("Booking request received")).toBeVisible();

  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.locator("button.req", { hasText: company }).click();
  await expect(page.locator(".detail__list")).toContainText("Payment Service Providers");
});
