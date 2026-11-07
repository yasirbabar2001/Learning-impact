import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser, hasAdminAccess, homeFor } from "./portal/auth";

const COOKIE = "li_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

function secret() {
  return process.env.SESSION_SECRET || sha256(`learning-impact:${process.env.ADMIN_PASSWORD ?? ""}`).toString("hex");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(sha256(candidate), sha256(expected));
}

export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/**
 * Admin access comes from either:
 * - a signed-in account with admin access (owner e-mails, or granted in Admin → Learners), the normal way; or
 * - the owner's ADMIN_PASSWORD sign-in at /admin/login, kept as a fallback (e.g. to grant the first admin).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (hasAdminAccess(user)) return true;
  return ownerSession();
}

/** True when signed in with the owner password (ADMIN_PASSWORD). */
export async function ownerSession(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(exp) * 1000 > Date.now();
}

/** Guard for admin pages, route handlers and server actions. */
export async function requireAdmin() {
  if (await isAdmin()) return;
  // Signed in without admin access: back to their own dashboard (not the login page, which would loop).
  const user = await currentUser();
  redirect(user ? homeFor(user) : "/login?next=/admin");
}

/** Signed tokens for links in e-mails (e.g. unsubscribe), so they cannot be forged. */
export const signFor = (purpose: string, value: string) => sign(`${purpose}:${value}`);
export function checkSigned(purpose: string, value: string, token: string): boolean {
  const a = Buffer.from(signFor(purpose, value));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
