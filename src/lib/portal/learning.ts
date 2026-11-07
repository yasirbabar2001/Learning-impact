import "server-only";
import { all, now, one, run, tx } from "../db";
import { catalogEntry } from "../courses/catalog";
import type { Course, Session } from "../courses/schema";
import { hasAdminAccess, type User } from "./auth";
import { awardXp, grantBadge, XP } from "./game";

export const QUIZ_PASS = 7; // out of 10

export type Enrollment = {
  id: string;
  user_id: string;
  course_slug: string;
  source: "purchase" | "company" | "admin";
  extra_attempts: number;
  created_at: string;
  completed_at: string | null;
};

export type Progress = {
  session_id: string;
  cards_seen: number;
  lesson_done_at: string | null;
  quiz_attempts: number;
  quiz_best: number;
  quiz_last: number | null;
  quiz_passed_at: string | null;
};

export type StageStatus = "locked" | "open" | "lesson-done" | "passed";

/**
 * How a signed-in person may use a course:
 * - "full": enrolled (purchase, company seat or admin grant); stages unlock one after another;
 * - "trial": not enrolled yet; stage 1 is free for every learner on a published course, the rest needs payment;
 * - "preview": an administrator looking at any course; every stage is open and nothing is recorded.
 */
export type AccessMode = "full" | "trial" | "preview";
export type Access = { mode: AccessMode; enrollment: Enrollment | null };

/** Number of stages anyone can play for free. */
export const FREE_STAGES = 1;

export const enrollmentFor = (userId: string, slug: string) =>
  one<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? AND course_slug = ?", userId, slug) ?? null;

export const enrollmentsOf = (userId: string) => all<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC", userId);

/** Decides full / trial / preview access to a course, or null when the person may not open it. */
export function accessFor(user: User, slug: string): Access | null {
  const enrollment = enrollmentFor(user.id, slug);
  if (enrollment) return { mode: "full", enrollment };
  if (hasAdminAccess(user)) return { mode: "preview", enrollment: null };
  if (catalogEntry(slug)?.available) return { mode: "trial", enrollment: null };
  return null;
}

export function progressMap(userId: string, slug: string): Map<string, Progress> {
  return new Map(
    all<Progress>("SELECT session_id, cards_seen, lesson_done_at, quiz_attempts, quiz_best, quiz_last, quiz_passed_at FROM session_progress WHERE user_id = ? AND course_slug = ?", userId, slug).map(
      (p) => [p.session_id, p],
    ),
  );
}

/** Stages unlock one after another: a session opens when the previous session's test is passed. */
export function stages(course: Course, progress: Map<string, Progress>) {
  let previousPassed = true;
  return course.sessions.map((s) => {
    const p = progress.get(s.id);
    let status: StageStatus = "locked";
    if (previousPassed) status = p?.quiz_passed_at ? "passed" : p?.lesson_done_at ? "lesson-done" : "open";
    previousPassed = status === "passed";
    return { session: s, status, progress: p ?? null };
  });
}

export function courseProgress(course: Course, progress: Map<string, Progress>) {
  const st = stages(course, progress);
  const passed = st.filter((s) => s.status === "passed").length;
  const lessonsDone = st.filter((s) => s.status === "passed" || s.status === "lesson-done").length;
  // Each session counts as lesson (40%) + test (60%).
  const percent = Math.round(((lessonsDone * 0.4 + passed * 0.6) / course.sessions.length) * 100);
  return { stages: st, passed, total: course.sessions.length, percent, examUnlocked: passed === course.sessions.length };
}

export function stageOf(course: Course, userId: string, sessionId: string, mode: AccessMode = "full") {
  const st = stagesFor(course, userId, mode);
  return st.find((s) => s.session.id === sessionId) ?? null;
}

/** Stages as this person sees them: trial stages after the free one are behind the paywall; previews are all open. */
export function stagesFor(course: Course, userId: string, mode: AccessMode) {
  // Admin preview: every stage is open, but the admin's own place is remembered.
  if (mode === "preview")
    return stages(course, progressMap(userId, course.slug)).map((s) => ({ ...s, status: s.status === "locked" ? ("open" as StageStatus) : s.status, paywall: false }));
  return stages(course, progressMap(userId, course.slug)).map((s, i) => {
    const paywall = mode === "trial" && i >= FREE_STAGES;
    return { ...s, status: paywall ? ("locked" as StageStatus) : s.status, paywall };
  });
}

/** Courses a learner has started for free (progress recorded, not enrolled). */
export function trialsOf(userId: string): string[] {
  return all<{ course_slug: string }>(
    `SELECT DISTINCT p.course_slug FROM session_progress p
     WHERE p.user_id = ? AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = p.user_id AND e.course_slug = p.course_slug)
     ORDER BY p.updated_at DESC`,
    userId,
  ).map((r) => r.course_slug);
}

function ensureRow(userId: string, slug: string, sid: string) {
  run(
    "INSERT OR IGNORE INTO session_progress (user_id, course_slug, session_id, updated_at) VALUES (?, ?, ?, ?)",
    userId,
    slug,
    sid,
    now(),
  );
}

export function recordCardsSeen(userId: string, slug: string, sid: string, seen: number) {
  ensureRow(userId, slug, sid);
  run(
    "UPDATE session_progress SET cards_seen = MAX(cards_seen, ?), updated_at = ? WHERE user_id = ? AND course_slug = ? AND session_id = ?",
    seen,
    now(),
    userId,
    slug,
    sid,
  );
}

/** Marks a lesson complete. `rewards: false` (admin preview) saves the place but pays no XP or badges. */
export function completeLesson(userId: string, course: Course, session: Session, { rewards = true } = {}) {
  return tx(() => {
    ensureRow(userId, course.slug, session.id);
    run(
      "UPDATE session_progress SET cards_seen = ?, lesson_done_at = COALESCE(lesson_done_at, ?), updated_at = ? WHERE user_id = ? AND course_slug = ? AND session_id = ?",
      session.cards.length,
      now(),
      now(),
      userId,
      course.slug,
      session.id,
    );
    if (!rewards) return 0;
    const xp = awardXp(userId, `lesson:${course.slug}:${session.id}`, `Lesson: ${session.title}`, XP.lesson);
    grantBadge(userId, "first-steps");
    return xp;
  });
}

/** Records a knowledge-check answer. XP only if the first answer is right (practice cards; the browser shows feedback itself). */
export function answerCheck(userId: string, course: Course, session: Session, cardIndex: number, choice: number) {
  const card = session.cards[cardIndex];
  if (!card || card.type !== "check") return null;
  const correct = card.answer === choice;
  const xp = awardXp(userId, `check:${course.slug}:${session.id}:${cardIndex}`, `Knowledge check: ${session.title}`, correct ? XP.check : 0);
  return { correct, answer: card.answer, explanation: card.explanation, xp };
}

/** Grades a SCORM session test from the learner's choices (indexes per question, in order). Score is computed here, never trusted from the browser. */
export function gradeQuiz(userId: string, course: Course, session: Session, responses: (number | null)[], { rewards = true } = {}) {
  const score = session.quiz.reduce((n, q, i) => n + (responses[i] === q.answer ? 1 : 0), 0);
  const passed = score >= QUIZ_PASS;
  return tx(() => {
    ensureRow(userId, course.slug, session.id);
    run(
      `UPDATE session_progress SET quiz_attempts = quiz_attempts + 1, quiz_last = ?, quiz_best = MAX(quiz_best, ?),
         quiz_passed_at = CASE WHEN ? THEN COALESCE(quiz_passed_at, ?) ELSE quiz_passed_at END, updated_at = ?
       WHERE user_id = ? AND course_slug = ? AND session_id = ?`,
      score,
      score,
      passed ? 1 : 0,
      now(),
      now(),
      userId,
      course.slug,
      session.id,
    );
    let xp = 0;
    if (!rewards) return { score, total: session.quiz.length, passed, xp };
    if (passed) xp += awardXp(userId, `quiz-pass:${course.slug}:${session.id}`, `Passed test: ${session.stage}`, XP.quizPass);
    if (score === session.quiz.length) {
      xp += awardXp(userId, `quiz-perfect:${course.slug}:${session.id}`, `Perfect score: ${session.stage}`, XP.quizPerfect);
      grantBadge(userId, "quiz-ace");
    }
    return { score, total: session.quiz.length, passed, xp };
  });
}
