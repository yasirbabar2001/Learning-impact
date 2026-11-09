import "server-only";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { now, one, run } from "../db";

const COOKIE = "li_session";
const SESSION_DAYS = 30;

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  designation: string;
  organisation: string;
  company_id: string | null;
  company_role: "manager" | "member" | null;
  status: "active" | "disabled";
  account_type: "individual" | "company";
  email_verified_at: string | null;
  referred_by: string | null;
  xp: number;
  streak: number;
  best_streak: number;
  last_active_day: string | null;
  show_on_leaderboard: number;
  reminders: number;
  is_admin: number;
  is_team: number;
  gender: string;
  created_at: string;
};

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const tokenHash = sha256;
export const newId = () => randomUUID();

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return ["scrypt", salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function startUserSession(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  run("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", sha256(token), userId, now(), expires.toISOString());
  run("UPDATE users SET last_login_at = ? WHERE id = ?", now(), userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endUserSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  jar.delete(COOKIE);
}

/** The signed-in learner for this request, or null. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const user = one<User>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'`,
    sha256(token),
    now(),
  );
  return user ?? null;
});

/** Page/action guard: sends visitors to the login page and brings them back afterwards, and unverified accounts to the code page. */
export async function requireUser(next = "/learn"): Promise<User> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.email_verified_at) redirect(`/verify-email?next=${encodeURIComponent(next)}`);
  return user;
}

export type Company = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  industry: string;
  city: string;
  address: string;
  employees: string;
  ntn: string;
  phone: string;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
};

export const companyOf = (user: User) => (user.company_id ? (one<Company>("SELECT * FROM companies WHERE id = ?", user.company_id) ?? null) : null);

/** Company features need a verified company account whose profile an admin has approved. */
export async function requireCompanyManager(): Promise<User & { company_id: string }> {
  const user = await requireUser("/company");
  if (user.account_type !== "company" || !user.company_id || user.company_role !== "manager") redirect("/company/setup");
  if (companyOf(user)?.status !== "approved") redirect("/company/pending");
  return user as User & { company_id: string };
}

/** Where to send someone right after they sign in or verify. */
/**
 * Owner e-mails are always administrators (no setup needed). Override with ADMIN_EMAILS (comma-separated).
 * Other accounts get admin access from an administrator in Admin → Learners.
 */
export const OWNER_EMAILS = (process.env.ADMIN_EMAILS || "info@learningimpact.pk")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
export const isOwnerEmail = (email: string) => OWNER_EMAILS.includes(email.trim().toLowerCase());

/** Whether this signed-in account may switch to the admin panel. */
export function hasAdminAccess(user: Pick<User, "email" | "is_admin" | "status" | "email_verified_at"> | null | undefined): boolean {
  return Boolean(user && user.status === "active" && user.email_verified_at && (user.is_admin || isOwnerEmail(user.email)));
}

/** Learning Impact Team: every published certification for free and a read-only view of the admin dashboard. */
export function isTeamMember(user: Pick<User, "is_team" | "status" | "email_verified_at"> | null | undefined): boolean {
  return Boolean(user && user.status === "active" && user.email_verified_at && user.is_team);
}

/** Who may open the read-only team dashboard: team members and administrators. */
export const canSeeTeamDashboard = (user: User | null | undefined) => isTeamMember(user) || hasAdminAccess(user);

export function homeFor(user: Pick<User, "account_type">, next?: string) {
  return safeNext(next, user.account_type === "company" ? "/company" : "/learn");
}

/** Only allows relative in-site paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/learn") {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

export function createPasswordReset(userId: string, hours = 2): string {
  const token = newToken();
  run(
    "INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    sha256(token),
    userId,
    now(),
    new Date(Date.now() + hours * 36e5).toISOString(),
  );
  return token;
}
