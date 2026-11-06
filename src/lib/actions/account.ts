"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { now, one, run } from "../db";
import {
  createPasswordReset,
  currentUser,
  endUserSession,
  hashPassword,
  newId,
  requireUser,
  safeNext,
  startUserSession,
  tokenHash,
  verifyPassword,
} from "../portal/auth";
import { button, esc, mailConfigured, sendMail } from "../portal/mail";
import { rateLimited } from "../rate-limit";
import { SITE_URL } from "../site";
import { fieldErrors, type FieldErrors } from "../validation";

export type AuthState = { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string> };

const email = z.string().trim().toLowerCase().max(160).pipe(z.email("Enter a valid e-mail address."));
const password = z.string().min(8, "Use at least 8 characters.").max(200);
const read = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
/** Form values to show again after an error (never passwords). */
const keep = (fd: FormData) => Object.fromEntries(Object.entries(read(fd)).filter(([k]) => !/password|confirm|current|token/.test(k)));

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email,
  password,
  phone: z.string().trim().max(40).regex(/^[+()\d\s-]*$/, "Use digits, spaces, + or - only."),
  organisation: z.string().trim().max(120),
  designation: z.string().trim().max(80),
  terms: z.literal("on", { message: "Please accept the terms to continue." }),
});

export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("register", 10, 60 * 60_000)) return { message: "Too many sign-ups from your network. Please try again later.", values: keep(fd) };
  const parsed = registerSchema.safeParse(read(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keep(fd) };
  const d = parsed.data;
  if (one("SELECT id FROM users WHERE email = ?", d.email)) return { errors: { email: "An account with this e-mail already exists. Log in instead." }, values: keep(fd) };
  const id = newId();
  run(
    "INSERT INTO users (id, email, name, password_hash, phone, organisation, designation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    d.email,
    d.name,
    await hashPassword(d.password),
    d.phone,
    d.organisation,
    d.designation,
    now(),
  );
  await startUserSession(id);
  void sendMail(
    d.email,
    "Welcome to Learning Impact",
    `<p>Assalam-o-Alaikum ${esc(d.name.split(" ")[0])},</p><p>Your learner account is ready. Pick a certification quest, earn XP and badges, and finish with a verified certificate.</p>${button(`${SITE_URL}/learn`, "Open my dashboard")}`,
  );
  redirect(safeNext(fd.get("next")));
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("login-learner", 12, 15 * 60_000)) return { message: "Too many attempts. Please wait 15 minutes and try again.", values: keep(fd) };
  const e = email.safeParse(fd.get("email"));
  const pw = String(fd.get("password") ?? "");
  const user = e.success ? one<{ id: string; password_hash: string; status: string }>("SELECT id, password_hash, status FROM users WHERE email = ?", e.data) : undefined;
  // Same message whether the e-mail or the password is wrong.
  if (!user || !(await verifyPassword(pw, user.password_hash))) return { message: "That e-mail and password do not match.", values: keep(fd) };
  if (user.status !== "active") return { message: "This account is disabled. Please contact us.", values: keep(fd) };
  await startUserSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function logout() {
  await endUserSession();
  redirect("/login");
}

export async function forgotPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("forgot", 5, 30 * 60_000)) return { message: "Too many requests. Please try again later." };
  const e = email.safeParse(fd.get("email"));
  if (!e.success) return { errors: { email: "Enter a valid e-mail address." }, values: keep(fd) };
  if (!mailConfigured()) return { ok: true, message: "Please e-mail info@learningimpact.pk from this address and we will send you a reset link." };
  const user = one<{ id: string; name: string }>("SELECT id, name FROM users WHERE email = ? AND status = 'active'", e.data);
  if (user) {
    const token = createPasswordReset(user.id);
    await sendMail(
      e.data,
      "Reset your Learning Impact password",
      `<p>We received a request to reset your password. This link works for 2 hours.</p>${button(`${SITE_URL}/reset-password/${token}`, "Choose a new password")}<p>If you did not ask for this, you can ignore this e-mail.</p>`,
    );
  }
  return { ok: true, message: "If an account exists for that e-mail, a reset link is on its way." };
}

export async function resetPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const token = String(fd.get("token") ?? "");
  const pw = password.safeParse(fd.get("password"));
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { errors: { confirm: "The passwords do not match." } };
  const row = one<{ user_id: string }>("SELECT user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash(token), now());
  if (!row) return { message: "This reset link has expired or was already used. Please request a new one." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(pw.data), row.user_id);
  run("UPDATE password_resets SET used_at = ? WHERE token_hash = ?", now(), tokenHash(token));
  run("DELETE FROM sessions WHERE user_id = ?", row.user_id);
  await startUserSession(row.user_id);
  redirect("/learn");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone: z.string().trim().max(40).regex(/^[+()\d\s-]*$/, "Use digits, spaces, + or - only."),
  organisation: z.string().trim().max(120),
  designation: z.string().trim().max(80),
});

export async function updateProfile(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await requireUser("/learn/account");
  const parsed = profileSchema.safeParse(read(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keep(fd) };
  const d = parsed.data;
  run(
    "UPDATE users SET name = ?, phone = ?, organisation = ?, designation = ?, show_on_leaderboard = ? WHERE id = ?",
    d.name,
    d.phone,
    d.organisation,
    d.designation,
    fd.get("leaderboard") === "on" ? 1 : 0,
    user.id,
  );
  revalidatePath("/learn", "layout");
  return { ok: true, message: "Profile saved.", values: keep(fd) };
}

export async function changePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await currentUser();
  if (!user) return { message: "Please log in again." };
  const row = one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", user.id)!;
  if (!(await verifyPassword(String(fd.get("current") ?? ""), row.password_hash))) return { errors: { current: "Your current password is not correct." } };
  const pw = password.safeParse(fd.get("password"));
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(pw.data), user.id);
  return { ok: true, message: "Password changed." };
}
