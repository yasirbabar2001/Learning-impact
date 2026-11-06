import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { all, now, one, run, tx } from "../db";
import type { Course } from "../courses/schema";
import { newId } from "./auth";
import { awardXp, grantBadge, XP } from "./game";

export const BASE_ATTEMPTS = 3;
const GRACE_MS = 90_000; // network delays when time runs out

export type Attempt = {
  id: string;
  user_id: string;
  course_slug: string;
  question_ids: string;
  option_orders: string;
  answers: string;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  correct: number | null;
  total: number;
  percent: number | null;
  passed: number | null;
};

export type Certificate = {
  id: string;
  code: string;
  user_id: string;
  course_slug: string;
  holder_name: string;
  percent: number;
  issued_at: string;
  revoked_at: string | null;
};

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const attemptsOf = (userId: string, slug: string) =>
  all<Attempt>("SELECT * FROM exam_attempts WHERE user_id = ? AND course_slug = ? ORDER BY started_at DESC", userId, slug);

export const openAttempt = (userId: string, slug: string) =>
  one<Attempt>("SELECT * FROM exam_attempts WHERE user_id = ? AND course_slug = ? AND submitted_at IS NULL ORDER BY started_at DESC LIMIT 1", userId, slug) ?? null;

export const certificateFor = (userId: string, slug: string) =>
  one<Certificate>("SELECT * FROM certificates WHERE user_id = ? AND course_slug = ? AND revoked_at IS NULL", userId, slug) ?? null;

export const certificateByCode = (code: string) => one<Certificate>("SELECT * FROM certificates WHERE code = ?", code) ?? null;

export const certificatesOf = (userId: string) =>
  all<Certificate>("SELECT * FROM certificates WHERE user_id = ? AND revoked_at IS NULL ORDER BY issued_at DESC", userId);

export function attemptsAllowed(extra: number) {
  return BASE_ATTEMPTS + extra;
}

/** Starts a timed attempt with a fresh random draw from the bank and shuffled options. */
export function startAttempt(userId: string, course: Course): Attempt {
  const { bank, questionsPerAttempt, minutes } = course.exam;
  const picked = shuffle(bank).slice(0, questionsPerAttempt);
  const id = newId();
  const started = new Date();
  run(
    `INSERT INTO exam_attempts (id, user_id, course_slug, question_ids, option_orders, started_at, deadline_at, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    course.slug,
    JSON.stringify(picked.map((q) => q.id)),
    JSON.stringify(picked.map(() => shuffle([0, 1, 2, 3]))),
    started.toISOString(),
    new Date(started.getTime() + minutes * 60_000).toISOString(),
    picked.length,
  );
  return one<Attempt>("SELECT * FROM exam_attempts WHERE id = ?", id)!;
}

/** Questions as the learner sees them: shuffled options, no answers. */
export function attemptPaper(course: Course, attempt: Attempt) {
  const ids: string[] = JSON.parse(attempt.question_ids);
  const orders: number[][] = JSON.parse(attempt.option_orders);
  const byId = new Map(course.exam.bank.map((q) => [q.id, q]));
  return ids.map((id, i) => {
    const q = byId.get(id)!;
    return { id, question: q.question, options: orders[i].map((o) => q.options[o]) };
  });
}

export function saveAnswer(attempt: Attempt, questionId: string, displayIndex: number) {
  if (attempt.submitted_at || Date.parse(attempt.deadline_at) + GRACE_MS < Date.now()) return false;
  const answers = JSON.parse(attempt.answers) as Record<string, number>;
  answers[questionId] = displayIndex;
  run("UPDATE exam_attempts SET answers = ? WHERE id = ? AND submitted_at IS NULL", JSON.stringify(answers), attempt.id);
  return true;
}

const certCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "LI-" + Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("").replace(/(.{4})/, "$1-");
};

/** Grades the attempt on the server. Answers given after the deadline (plus grace) are not counted. */
export function submitAttempt(attempt: Attempt, course: Course, holderName: string) {
  if (attempt.submitted_at) return one<Attempt>("SELECT * FROM exam_attempts WHERE id = ?", attempt.id)!;
  const ids: string[] = JSON.parse(attempt.question_ids);
  const orders: number[][] = JSON.parse(attempt.option_orders);
  const answers = JSON.parse(attempt.answers) as Record<string, number>;
  const byId = new Map(course.exam.bank.map((q) => [q.id, q]));
  let correct = 0;
  ids.forEach((id, i) => {
    const chosen = answers[id];
    if (chosen !== undefined && orders[i][chosen] === byId.get(id)?.answer) correct++;
  });
  const percent = Math.round((correct / ids.length) * 100);
  const passed = percent >= course.exam.passMark;

  return tx(() => {
    run(
      "UPDATE exam_attempts SET submitted_at = ?, correct = ?, percent = ?, passed = ? WHERE id = ? AND submitted_at IS NULL",
      now(),
      correct,
      percent,
      passed ? 1 : 0,
      attempt.id,
    );
    // A revoked certificate is not re-issued automatically (revocation is for misconduct).
    const anyCertificate = one<{ id: string }>("SELECT id FROM certificates WHERE user_id = ? AND course_slug = ?", attempt.user_id, course.slug);
    if (passed && !anyCertificate) {
      run(
        "INSERT INTO certificates (id, code, user_id, course_slug, attempt_id, holder_name, percent, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        newId(),
        certCode(),
        attempt.user_id,
        course.slug,
        attempt.id,
        holderName,
        percent,
        now(),
      );
      run("UPDATE enrollments SET completed_at = COALESCE(completed_at, ?) WHERE user_id = ? AND course_slug = ?", now(), attempt.user_id, course.slug);
      awardXp(attempt.user_id, `exam-pass:${course.slug}`, `Certified: ${course.title}`, XP.examPass);
      grantBadge(attempt.user_id, "boss-slayer");
      grantBadge(attempt.user_id, `course:${course.slug}`);
      if (percent >= 90) {
        awardXp(attempt.user_id, `exam-distinction:${course.slug}`, `Distinction: ${course.title}`, XP.examDistinction);
        grantBadge(attempt.user_id, "distinction");
      }
    }
    return one<Attempt>("SELECT * FROM exam_attempts WHERE id = ?", attempt.id)!;
  });
}

/** Per-session result, so learners know what to revise without revealing the answers. */
export function attemptBreakdown(course: Course, attempt: Attempt) {
  const ids: string[] = JSON.parse(attempt.question_ids);
  const orders: number[][] = JSON.parse(attempt.option_orders);
  const answers = JSON.parse(attempt.answers) as Record<string, number>;
  const byId = new Map(course.exam.bank.map((q) => [q.id, q]));
  // Exam ids carry no session, so assign each question to a session by its position in the bank (≈ equal blocks).
  const per = Math.ceil(course.exam.bank.length / course.sessions.length);
  const bankIndex = new Map(course.exam.bank.map((q, i) => [q.id, i]));
  const rows = course.sessions.map((s) => ({ session: s, correct: 0, total: 0 }));
  ids.forEach((id, i) => {
    const row = rows[Math.min(rows.length - 1, Math.floor((bankIndex.get(id) ?? 0) / per))];
    row.total++;
    if (answers[id] !== undefined && orders[i][answers[id]] === byId.get(id)?.answer) row.correct++;
  });
  return rows.filter((r) => r.total > 0);
}

/** Grades an attempt that ran out of time while the learner was away. */
export function closeExpired(userId: string, course: Course, holderName: string) {
  const open = openAttempt(userId, course.slug);
  if (open && Date.parse(open.deadline_at) + GRACE_MS < Date.now()) submitAttempt(open, course, holderName);
}
