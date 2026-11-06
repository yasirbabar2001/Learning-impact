import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { all, now, one, run } from "../db";
import { esc, sendMailDetailed } from "./mail";

export type CodePurpose = "verify" | "reset";

const TTL_MIN = 10;
const MAX_TRIES = 5;
const RESEND_SECONDS = 60;
const MAX_PER_HOUR = 6;

const hash = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

type Row = { id: number; code_hash: string; attempts: number; created_at: string; expires_at: string };

/** Seconds until another code may be sent (0 = now). */
export function resendWait(userId: string, purpose: CodePurpose): number {
  const last = one<{ created_at: string }>("SELECT created_at FROM email_codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1", userId, purpose);
  if (!last) return 0;
  return Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - Date.parse(last.created_at)) / 1000));
}

export type IssueResult = { ok: true; sent: boolean; error?: string } | { ok: false; wait?: number; message: string };

/** Creates a 6-digit code (replacing earlier unused ones) and e-mails it. */
export async function issueCode(user: { id: string; email: string; name: string }, purpose: CodePurpose): Promise<IssueResult> {
  const wait = resendWait(user.id, purpose);
  if (wait > 0) return { ok: false, wait, message: `Please wait ${wait} seconds before asking for a new code.` };
  const hourAgo = new Date(Date.now() - 36e5).toISOString();
  const recent = all<{ id: number }>("SELECT id FROM email_codes WHERE user_id = ? AND purpose = ? AND created_at > ?", user.id, purpose, hourAgo).length;
  if (recent >= MAX_PER_HOUR) return { ok: false, message: "Too many codes requested. Please try again in an hour." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  run("UPDATE email_codes SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL", now(), user.id, purpose);
  run(
    "INSERT INTO email_codes (user_id, purpose, code_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    user.id,
    purpose,
    hash(user.id, code),
    now(),
    new Date(Date.now() + TTL_MIN * 60_000).toISOString(),
  );
  const subject = purpose === "verify" ? `${code} is your Learning Impact verification code` : `${code} is your Learning Impact password reset code`;
  const intro = purpose === "verify" ? "Use this code to verify your e-mail address and activate your account:" : "Use this code to choose a new password:";
  const html = `<p>Assalam-o-Alaikum ${esc(user.name.split(" ")[0])},</p><p>${intro}</p>
<p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#0d2c66;margin:22px 0">${code}</p>
<p>The code expires in ${TTL_MIN} minutes. If you did not request it, you can ignore this e-mail.</p>`;
  const r = await sendMailDetailed(user.email, subject, html);
  return { ok: true, sent: r.ok, error: r.error };
}

export type CheckResult = "ok" | "wrong" | "expired" | "locked";

/** Checks a code; each wrong guess counts towards the limit. */
export function checkCode(userId: string, purpose: CodePurpose, code: string): { result: CheckResult; triesLeft: number } {
  const row = one<Row>(
    "SELECT id, code_hash, attempts, created_at, expires_at FROM email_codes WHERE user_id = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
    userId,
    purpose,
  );
  if (!row || Date.parse(row.expires_at) < Date.now()) return { result: "expired", triesLeft: 0 };
  if (row.attempts >= MAX_TRIES) return { result: "locked", triesLeft: 0 };
  const clean = code.replace(/\D/g, "");
  const a = Buffer.from(hash(userId, clean));
  const b = Buffer.from(row.code_hash);
  if (clean.length !== 6 || !timingSafeEqual(a, b)) {
    run("UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?", row.id);
    const left = MAX_TRIES - row.attempts - 1;
    return { result: left > 0 ? "wrong" : "locked", triesLeft: Math.max(0, left) };
  }
  run("UPDATE email_codes SET used_at = ? WHERE id = ?", now(), row.id);
  return { result: "ok", triesLeft: MAX_TRIES };
}

export const CHECK_MESSAGES: Record<Exclude<CheckResult, "ok">, string> = {
  wrong: "That code is not correct.",
  expired: "This code has expired. Ask for a new one.",
  locked: "Too many wrong attempts. Ask for a new code.",
};
