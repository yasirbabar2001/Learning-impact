import "server-only";
import { randomBytes } from "node:crypto";
import { all, one, run } from "../db";
import { awardXp, grantBadge } from "./game";

/** XP paid to the person who shared their link. */
export const REFERRAL_XP = { joined: 100, enrolled: 250, welcome: 50 } as const;

export const REF_COOKIE = "li_ref";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from(randomBytes(6))
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");

/** The learner's personal invite code, created on first use. */
export function refCodeFor(userId: string): string {
  const u = one<{ ref_code: string | null }>("SELECT ref_code FROM users WHERE id = ?", userId);
  if (u?.ref_code) return u.ref_code;
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    try {
      run("UPDATE users SET ref_code = ? WHERE id = ? AND ref_code IS NULL", code, userId);
      break;
    } catch {
      /* code clash: try another */
    }
  }
  return one<{ ref_code: string }>("SELECT ref_code FROM users WHERE id = ?", userId)!.ref_code;
}

export function referrerByCode(code: string | undefined | null) {
  if (!code || !/^[A-Z0-9]{4,12}$/.test(code.toUpperCase())) return null;
  return one<{ id: string; name: string }>("SELECT id, name FROM users WHERE ref_code = ? AND status = 'active'", code.toUpperCase()) ?? null;
}

/** Called once the new learner has verified their e-mail. */
export function rewardJoin(user: { id: string; name: string; referred_by: string | null }) {
  if (!user.referred_by) return;
  awardXp(user.id, "welcome-bonus", "Welcome bonus: joined through a friend", REFERRAL_XP.welcome);
  awardXp(user.referred_by, `ref-join:${user.id}`, `Friend joined: ${user.name.split(" ")[0]}`, REFERRAL_XP.joined);
  const joined = one<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE referred_by = ? AND email_verified_at IS NOT NULL", user.referred_by)?.n ?? 0;
  if (joined >= 3) grantBadge(user.referred_by, "connector");
}

/** Called when a referred learner's first purchase is approved. */
export function rewardEnrolment(userId: string) {
  const u = one<{ name: string; referred_by: string | null }>("SELECT name, referred_by FROM users WHERE id = ?", userId);
  if (!u?.referred_by) return;
  awardXp(u.referred_by, `ref-enrol:${userId}`, `Friend enrolled: ${u.name.split(" ")[0]}`, REFERRAL_XP.enrolled);
  grantBadge(u.referred_by, "ambassador");
}

export function referralStats(userId: string) {
  const rows = all<{ verified: string | null; enrolled: number }>(
    `SELECT u.email_verified_at AS verified, EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = u.id) AS enrolled
     FROM users u WHERE u.referred_by = ?`,
    userId,
  );
  const xp = one<{ n: number }>("SELECT COALESCE(SUM(xp), 0) AS n FROM xp_events WHERE user_id = ? AND ref LIKE 'ref-%'", userId)?.n ?? 0;
  return { joined: rows.filter((r) => r.verified).length, enrolled: rows.filter((r) => r.enrolled).length, xp };
}
