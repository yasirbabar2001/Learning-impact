"use server";

import { revalidatePath } from "next/cache";
import { passwordMatches } from "../auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { now, one, run, tx } from "../db";
import { currentUser, endUserSession, hashPassword, homeFor, isOwnerEmail, newId, requireUser, safeNext, startUserSession, tokenHash, verifyPassword } from "../portal/auth";
import { button, esc, sendMail } from "../portal/mail";
import { CHECK_MESSAGES, checkCode, issueCode } from "../portal/otp";
import { REF_COOKIE, referrerByCode, rewardJoin } from "../portal/referrals";
import { rateLimited } from "../rate-limit";
import { SITE_URL } from "../site";
import { fieldErrors, type FieldErrors } from "../validation";

export type AuthState = { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string> };

const email = z.string().trim().toLowerCase().max(160).pipe(z.email("Enter a valid e-mail address."));
const password = z.string().min(8, "Use at least 8 characters.").max(200);
const read = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
/** Form values to show again after an error (never passwords). */
const keep = (fd: FormData) => Object.fromEntries(Object.entries(read(fd)).filter(([k]) => !/password|confirm|current|token/.test(k)));

const phone = z.string().trim().max(40).regex(/^[+()\d\s-]*$/, "Use digits, spaces, + or - only.");
const terms = z.literal("on", { message: "Please accept the terms to continue." });

const individualSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email,
  password,
  phone,
  organisation: z.string().trim().max(120),
  designation: z.string().trim().max(80),
  terms,
});

const companySchema = z.object({
  company: z.string().trim().min(2, "Enter the company's registered name.").max(120),
  industry: z.string().trim().min(2, "Choose the company's industry.").max(80),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  address: z.string().trim().max(200),
  employees: z.string().trim().min(1, "Choose the company size.").max(40),
  ntn: z.string().trim().max(40),
  name: z.string().trim().min(2, "Enter the contact person's full name.").max(80),
  designation: z.string().trim().min(2, "Enter the contact person's designation.").max(80),
  email,
  phone: phone.min(7, "Enter a contact number."),
  password,
  terms,
});

const companyNotice = async (company: string, contact: string, mail: string) => {
  const to = process.env.NOTIFY_EMAIL_TO;
  if (to)
    await sendMail(
      to,
      `New company to approve: ${company}`,
      `<p><b>${esc(company)}</b> (${esc(contact)}, ${esc(mail)}) verified its e-mail and is waiting for approval.</p>${button(`${SITE_URL}/admin/companies`, "Review the company")}`,
    );
};

/** Creates an individual or company account, then e-mails a 6-digit code to verify the address. */
export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("register", 10, 60 * 60_000)) return { message: "Too many sign-ups from your network. Please try again later.", values: keep(fd) };
  const isCompany = fd.get("type") === "company";
  const parsed = (isCompany ? companySchema : individualSchema).safeParse(read(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keep(fd) };
  const d = parsed.data;
  if (one("SELECT id FROM users WHERE email = ?", d.email)) return { errors: { email: "An account with this e-mail already exists. Log in instead." }, values: keep(fd) };

  const id = newId();
  const hashed = await hashPassword(d.password);
  tx(() => {
    if ("company" in d) {
      const companyId = newId();
      run(
        `INSERT INTO companies (id, name, status, industry, city, address, employees, ntn, phone, created_at)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
        companyId,
        d.company,
        d.industry,
        d.city,
        d.address,
        d.employees,
        d.ntn,
        d.phone,
        now(),
      );
      run(
        `INSERT INTO users (id, email, name, password_hash, phone, organisation, designation, account_type, company_id, company_role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'company', ?, 'manager', ?)`,
        id,
        d.email,
        d.name,
        hashed,
        d.phone,
        d.company,
        d.designation,
        companyId,
        now(),
      );
    } else {
      run(
        "INSERT INTO users (id, email, name, password_hash, phone, organisation, designation, account_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'individual', ?)",
        id,
        d.email,
        d.name,
        hashed,
        d.phone,
        d.organisation,
        d.designation,
        now(),
      );
    }
  });
  // Invited by a friend? Their code arrives in a cookie set by /r/CODE (or the form).
  const referrer = referrerByCode(String(fd.get("ref") ?? "") || (await cookies()).get(REF_COOKIE)?.value);
  if (referrer && referrer.id !== id) run("UPDATE users SET referred_by = ? WHERE id = ?", referrer.id, id);
  await startUserSession(id);
  await issueCode({ id, email: d.email, name: d.name }, "verify");
  redirect(`/verify-email?next=${encodeURIComponent(safeNext(fd.get("next"), ""))}`);
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("login-learner", 12, 15 * 60_000)) return { message: "Too many attempts. Please wait 15 minutes and try again.", values: keep(fd) };
  const e = email.safeParse(fd.get("email"));
  const pw = String(fd.get("password") ?? "");
  const type = fd.get("type") === "company" ? "company" : "individual";
  const user = e.success
    ? one<{ id: string; name: string; email: string; password_hash: string; status: string; account_type: "individual" | "company"; email_verified_at: string | null }>(
        "SELECT id, name, email, password_hash, status, account_type, email_verified_at FROM users WHERE email = ?",
        e.data,
      )
    : undefined;
  const ok = Boolean(user && (await verifyPassword(pw, user.password_hash)));
  // The owner (info@learningimpact.pk) can always get in with the server's admin password: the account is
  // created if it does not exist yet and counts as verified. Knowing ADMIN_PASSWORD already gives admin access.
  if (!ok && e.success && isOwnerEmail(e.data) && passwordMatches(pw)) {
    const id = user?.id ?? newId();
    if (!user)
      run(
        "INSERT INTO users (id, email, name, password_hash, phone, organisation, designation, account_type, email_verified_at, created_at) VALUES (?, ?, ?, ?, '', 'Learning Impact', '', 'individual', ?, ?)",
        id,
        e.data,
        "Learning Impact",
        await hashPassword(pw),
        now(),
        now(),
      );
    else run("UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), status = 'active' WHERE id = ?", now(), id);
    await startUserSession(id);
    redirect(safeNext(fd.get("next"), "/learn")); // land as an individual; "Admin" is one click away
  }
  // Same message whether the e-mail or the password is wrong.
  if (!user || !ok) return { message: "That e-mail and password do not match.", values: keep(fd) };
  if (user.status !== "active") return { message: "This account is disabled. Please contact us.", values: keep(fd) };
  if (user.account_type !== type && !isOwnerEmail(user.email))
    return {
      message: user.account_type === "company" ? "This e-mail belongs to a company account. Choose “Company” above and log in again." : "This e-mail belongs to an individual account. Choose “Individual” above and log in again.",
      values: keep(fd),
    };
  await startUserSession(user.id);
  if (!user.email_verified_at) {
    await issueCode(user, "verify");
    redirect(`/verify-email?next=${encodeURIComponent(safeNext(fd.get("next"), ""))}`);
  }
  redirect(homeFor(user, String(fd.get("next") ?? "") || undefined));
}

export async function logout(fd?: FormData) {
  await endUserSession();
  redirect(fd?.get("to") === "company" ? "/register?type=company" : "/login");
}

/** Step 2 of sign-up: the 6-digit code from the e-mail. */
export async function verifyEmail(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.email_verified_at) redirect(homeFor(user));
  const { result, triesLeft } = checkCode(user.id, "verify", String(fd.get("code") ?? ""));
  if (result !== "ok") return { errors: { code: result === "wrong" ? `${CHECK_MESSAGES.wrong} ${triesLeft} attempt(s) left.` : CHECK_MESSAGES[result] } };
  run("UPDATE users SET email_verified_at = ? WHERE id = ?", now(), user.id);
  rewardJoin(user);
  if (user.account_type === "company") {
    const company = one<{ name: string }>("SELECT name FROM companies WHERE id = ?", user.company_id ?? "");
    await companyNotice(company?.name ?? user.organisation, user.name, user.email);
    redirect("/company/pending");
  }
  void sendMail(
    user.email,
    "Welcome to Learning Impact",
    `<p>Assalam-o-Alaikum ${esc(user.name.split(" ")[0])},</p><p>Your learner account is ready. Pick a certification quest, earn XP and badges, and finish with a verified certificate.</p>${button(`${SITE_URL}/learn`, "Open my dashboard")}`,
  );
  redirect(homeFor(user, String(fd.get("next") ?? "") || undefined));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState passes the previous state
export async function resendVerification(_: AuthState): Promise<AuthState> {
  const user = await currentUser();
  if (!user || user.email_verified_at) return {};
  const r = await issueCode(user, "verify");
  if (!r.ok) return { message: r.message };
  if (!r.sent) return { message: "We could not send the e-mail just now. Please try again later or contact info@learningimpact.pk." };
  return { ok: true, message: `A new code is on its way to ${user.email}.` };
}

/** Forgot password, step 1: e-mail a reset code. */
export async function forgotPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("forgot", 6, 30 * 60_000)) return { message: "Too many requests. Please try again later." };
  const e = email.safeParse(fd.get("email"));
  if (!e.success) return { errors: { email: "Enter a valid e-mail address." }, values: keep(fd) };
  const user = one<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE email = ? AND status = 'active'", e.data);
  if (user) {
    const r = await issueCode(user, "reset");
    if (!r.ok && r.wait) return { message: r.message, values: keep(fd) };
    if (r.ok && !r.sent) return { message: "We could not send the e-mail just now. Please try again later or contact info@learningimpact.pk.", values: keep(fd) };
  }
  // The same answer whether or not the account exists.
  redirect(`/forgot-password?step=code&email=${encodeURIComponent(e.data)}`);
}

/** Forgot password, step 2: code + new password. */
export async function resetWithCode(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await rateLimited("reset-code", 15, 30 * 60_000)) return { message: "Too many attempts. Please try again later." };
  const e = email.safeParse(fd.get("email"));
  const pw = password.safeParse(fd.get("password"));
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  const user = e.success ? one<{ id: string; email_verified_at: string | null; account_type: "individual" | "company" }>("SELECT id, email_verified_at, account_type FROM users WHERE email = ? AND status = 'active'", e.data) : undefined;
  if (!user) return { errors: { code: CHECK_MESSAGES.wrong } };
  const { result, triesLeft } = checkCode(user.id, "reset", String(fd.get("code") ?? ""));
  if (result !== "ok") return { errors: { code: result === "wrong" ? `${CHECK_MESSAGES.wrong} ${triesLeft} attempt(s) left.` : CHECK_MESSAGES[result] } };
  run("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?", await hashPassword(pw.data), now(), user.id);
  run("DELETE FROM sessions WHERE user_id = ?", user.id);
  await startUserSession(user.id);
  redirect(homeFor(user));
}

/** Reset through a link an admin created (works without e-mail). */
export async function resetPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const token = String(fd.get("token") ?? "");
  const pw = password.safeParse(fd.get("password"));
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { errors: { confirm: "The passwords do not match." } };
  const row = one<{ user_id: string }>("SELECT user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash(token), now());
  if (!row) return { message: "This reset link has expired or was already used. Please request a new one." };
  // The link reached the account owner, so it also confirms their e-mail.
  run("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?", await hashPassword(pw.data), now(), row.user_id);
  run("UPDATE password_resets SET used_at = ? WHERE token_hash = ?", now(), tokenHash(token));
  run("DELETE FROM sessions WHERE user_id = ?", row.user_id);
  await startUserSession(row.user_id);
  const user = one<{ account_type: "individual" | "company" }>("SELECT account_type FROM users WHERE id = ?", row.user_id)!;
  redirect(homeFor(user));
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
    "UPDATE users SET name = ?, phone = ?, organisation = ?, designation = ?, show_on_leaderboard = ?, reminders = ? WHERE id = ?",
    d.name,
    d.phone,
    d.organisation,
    d.designation,
    fd.get("leaderboard") === "on" ? 1 : 0,
    fd.get("reminders") === "on" ? 1 : 0,
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
