"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { catalogEntry, isTopic, saveCourseSettings } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { saveUsdRate } from "@/lib/portal/currency";
import { now, one, run } from "@/lib/db";
import { createPasswordReset, currentUser } from "@/lib/portal/auth";
import { approveOrder, orderStageLabel, enroll, paymentSettings, rejectOrder, savePaymentSettings, type Order } from "@/lib/portal/commerce";
import { button, esc, sendMail, sendMailDetailed } from "@/lib/portal/mail";
import { SITE_URL } from "@/lib/site";

export async function approveOrderAction(fd: FormData) {
  await requireAdmin();
  const order = approveOrder(String(fd.get("id")), String(fd.get("note") ?? "").slice(0, 500));
  if (order) {
    const buyer = one<{ email: string; name: string }>("SELECT email, name FROM users WHERE id = ?", order.user_id);
    const entry = catalogEntry(order.course_slug);
    if (buyer && entry) {
      const individual = order.kind === "individual";
      void sendMail(
        buyer.email,
        individual ? `You're in: ${entry.title}` : `${order.seats} seats ready: ${entry.title}`,
        `<p>Assalam-o-Alaikum ${esc(buyer.name.split(" ")[0])},</p><p>We have confirmed your payment of <b>${formatMoney(order.amount_pkr, order.currency)}</b> (order ${order.reference}).</p>${
          individual
            ? `<p>${order.stage_id ? `${esc(orderStageLabel(order) ?? "Your stage")} of <b>${esc(entry.title)}</b> is unlocked.` : `Your quest <b>${esc(entry.title)}</b> is unlocked.`}</p>${button(`${SITE_URL}/learn/${order.course_slug}`, order.stage_id ? "Continue the quest" : "Start the quest")}`
            : `<p>${order.seats} seats for <b>${esc(entry.title)}</b> are now in your company account. Invite your team from the company dashboard.</p>${button(`${SITE_URL}/company`, "Invite my team")}`
        }`,
      );
    }
  }
  revalidatePath("/admin/orders");
}

export async function rejectOrderAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 500) || "We could not match this payment to our bank or wallet statement.";
  rejectOrder(id, note);
  const order = one<Order>("SELECT * FROM orders WHERE id = ?", id);
  const buyer = order && one<{ email: string }>("SELECT email FROM users WHERE id = ?", order.user_id);
  if (order && buyer) {
    void sendMail(
      buyer.email,
      `About your payment for order ${order.reference}`,
      `<p>We could not confirm the payment for order <b>${order.reference}</b>.</p>${note ? `<p><b>Reason:</b> ${esc(note)}</p>` : ""}<p>You can submit the payment details again from your order page.</p>${button(`${SITE_URL}/orders/${order.reference}`, "Open my order")}`,
    );
  }
  revalidatePath("/admin/orders");
}

export async function saveCourseSettingsAction(fd: FormData) {
  await requireAdmin();
  const slug = String(fd.get("slug"));
  if (!isTopic(slug)) return;
  const price = Math.max(0, Math.min(10_000_000, Math.round(Number(fd.get("price")) || 0)));
  const priceUsd = Math.max(0, Math.min(100_000, Math.round(Number(fd.get("price_usd")) || 0)));
  saveCourseSettings(slug, price, fd.get("published") === "on" && price > 0, priceUsd);
  revalidatePath("/", "layout");
}

export type AdminFormState = { ok?: boolean; message?: string; link?: string };

export async function savePaymentSettingsAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const s = paymentSettings();
  const keys = Object.keys(s) as (keyof typeof s)[];
  const next = Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "").trim().slice(0, 600)])) as typeof s;
  savePaymentSettings(next);
  const rate = Number(fd.get("usd_rate"));
  if (Number.isFinite(rate) && rate >= 1 && rate <= 10_000) saveUsdRate(rate);
  return { ok: true, message: "Payment details saved." };
}

export async function adminEnrollAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const email = z.email().safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  const slug = String(fd.get("slug"));
  if (!email.success) return { message: "Enter the learner's account e-mail." };
  if (!isTopic(slug)) return { message: "Choose a certification." };
  const user = one<{ id: string }>("SELECT id FROM users WHERE email = ?", email.data);
  if (!user) return { message: "No learner account uses that e-mail. Ask them to register first." };
  enroll(user.id, slug, "admin", null, null);
  revalidatePath("/admin/learners");
  return { ok: true, message: `Enrolled ${email.data}.` };
}

export async function grantAttemptAction(fd: FormData) {
  await requireAdmin();
  run("UPDATE enrollments SET extra_attempts = extra_attempts + 1 WHERE id = ?", String(fd.get("id")));
  revalidatePath("/admin/learners");
}

export async function resetLinkAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = String(fd.get("id"));
  const user = one<{ id: string; email: string }>("SELECT id, email FROM users WHERE id = ?", id);
  if (!user) return { message: "Learner not found." };
  const token = createPasswordReset(user.id, 48);
  const link = `${SITE_URL}/reset-password/${token}`;
  const sent = await sendMail(user.email, "Set a new Learning Impact password", `<p>Use this link to choose a new password. It works for 48 hours.</p>${button(link, "Choose a new password")}`);
  return { ok: true, message: sent ? `Reset link e-mailed to ${user.email}. You can also share it:` : "Share this link with the learner (valid 48 hours):", link };
}

export async function setUserStatusAction(fd: FormData) {
  await requireAdmin();
  const status = fd.get("status") === "disabled" ? "disabled" : "active";
  const id = String(fd.get("id"));
  run("UPDATE users SET status = ? WHERE id = ?", status, id);
  if (status === "disabled") run("DELETE FROM sessions WHERE user_id = ?", id);
  revalidatePath("/admin/learners");
}

/** Gives or removes admin access for an account. You cannot remove your own (so nobody locks themselves out). */
export async function setAdminAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const grant = fd.get("admin") === "1";
  const me = await currentUser();
  if (!grant && me?.id === id) return;
  run("UPDATE users SET is_admin = ? WHERE id = ? AND status = 'active'", grant ? 1 : 0, id);
  revalidatePath("/admin/learners");
}

/** Marks an account as Learning Impact Team (free certifications, read-only dashboard) or removes the mark. */
export async function setTeamAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  run("UPDATE users SET is_team = ? WHERE id = ? AND status = 'active'", fd.get("team") === "1" ? 1 : 0, id);
  revalidatePath("/admin/learners");
  revalidatePath("/admin/users");
}

export async function revokeCertificateAction(fd: FormData) {
  await requireAdmin();
  run("UPDATE certificates SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL", now(), String(fd.get("id")));
  revalidatePath("/admin/learners");
}

export async function approveCompanyAction(fd: FormData) {
  await reviewCompany(fd, true);
}

export async function rejectCompanyAction(fd: FormData) {
  await reviewCompany(fd, false);
}

async function reviewCompany(fd: FormData, approve: boolean) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 500) || (approve ? "" : "We could not confirm the company details provided.");
  run("UPDATE companies SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?", approve ? "approved" : "rejected", note, now(), id);
  const company = one<{ name: string }>("SELECT name FROM companies WHERE id = ?", id);
  const manager = one<{ email: string; name: string }>("SELECT email, name FROM users WHERE company_id = ? AND company_role = 'manager' ORDER BY created_at LIMIT 1", id);
  if (company && manager) {
    void sendMail(
      manager.email,
      approve ? `${company.name} is approved on Learning Impact` : `About your company account: ${company.name}`,
      approve
        ? `<p>Assalam-o-Alaikum ${esc(manager.name.split(" ")[0])},</p><p>Your company account for <b>${esc(company.name)}</b> is approved. You can now buy certification seats and invite your team.</p>${button(`${SITE_URL}/company`, "Open my company dashboard")}`
        : `<p>We could not approve the company account for <b>${esc(company.name)}</b>.</p><p><b>Reason:</b> ${esc(note)}</p><p>Reply to this e-mail or call +92 334 9990778 and we will help.</p>`,
    );
  }
  revalidatePath("/admin/companies");
}

export async function markVerifiedAction(fd: FormData) {
  await requireAdmin();
  run("UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?", now(), String(fd.get("id")));
  revalidatePath("/admin/learners");
}

export async function testEmailAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const to = z.email().safeParse(String(fd.get("to") ?? "").trim());
  if (!to.success) return { message: "Enter the address to send the test to." };
  const r = await sendMailDetailed(to.data, "Learning Impact e-mail test", "<p>E-mail from the website is working. Learners will receive their verification codes.</p>");
  return r.ok ? { ok: true, message: `Sent to ${to.data}. Check the inbox (and spam folder).` } : { message: `Sending failed: ${r.error}` };
}
