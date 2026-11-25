import "server-only";
import { all, now, one, run } from "../db";
import type { Course } from "../courses/schema";
import { newId } from "./auth";
import { certCode } from "./exam";
import { awardXp, grantBadge, XP } from "./game";

/** How many opening stages of a course are free (1 for most; the Basic level of a Free & Premium course). */
export const freeStagesOf = (course: Pick<Course, "freeStages">) => course.freeStages ?? 1;

/** True for courses whose Basic level is free with a certificate, and whose Advanced level is the Premium upgrade. */
export const isFreePremium = (course: Pick<Course, "freeStages"> | null | undefined) => Boolean(course?.freeStages);

/**
 * Issues the free Certificate of Completion once every Basic stage test of a Free & Premium course is passed.
 * Its score is the average of the learner's best stage-test results. Returns the certificate code when one is new.
 */
export function issueCompletionIfDone(userId: string, course: Course): string | null {
  if (!course.freeStages) return null;
  const basic = course.sessions.slice(0, course.freeStages).map((s) => s.id);
  const rows = all<{ session_id: string; quiz_best: number; quiz_passed_at: string | null }>(
    "SELECT session_id, quiz_best, quiz_passed_at FROM session_progress WHERE user_id = ? AND course_slug = ?",
    userId,
    course.slug,
  ).filter((r) => basic.includes(r.session_id));
  if (rows.length < basic.length || rows.some((r) => !r.quiz_passed_at)) return null;
  if (one<{ id: string }>("SELECT id FROM certificates WHERE user_id = ? AND course_slug = ? AND kind = 'completion'", userId, course.slug)) return null;
  const holder = one<{ name: string }>("SELECT name FROM users WHERE id = ?", userId)?.name ?? "";
  const totals = course.sessions.slice(0, course.freeStages).map((s) => s.quiz.length);
  const percent = Math.round((rows.reduce((n, r) => n + r.quiz_best, 0) / totals.reduce((n, t) => n + t, 0)) * 100);
  const code = certCode();
  run(
    "INSERT INTO certificates (id, code, user_id, course_slug, attempt_id, holder_name, percent, issued_at, kind) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'completion')",
    newId(),
    code,
    userId,
    course.slug,
    holder,
    percent,
    now(),
  );
  awardXp(userId, `completion:${course.slug}`, `Certificate of Completion: ${course.title}`, XP.quizPass);
  grantBadge(userId, "boss-slayer");
  return code;
}
