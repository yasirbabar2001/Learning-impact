import "server-only";
import { all, now, one, run, tx } from "../db";
import type { Course, Session } from "../courses/schema";
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

export const enrollmentFor = (userId: string, slug: string) =>
  one<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? AND course_slug = ?", userId, slug) ?? null;

export const enrollmentsOf = (userId: string) => all<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC", userId);

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

export function stageOf(course: Course, userId: string, sessionId: string) {
  const st = stages(course, progressMap(userId, course.slug));
  return st.find((s) => s.session.id === sessionId) ?? null;
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

export function completeLesson(userId: string, course: Course, session: Session) {
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
    const xp = awardXp(userId, `lesson:${course.slug}:${session.id}`, `Lesson: ${session.title}`, XP.lesson);
    grantBadge(userId, "first-steps");
    return xp;
  });
}

/** Marks a knowledge-check card. XP only if the first answer is right. Never sends the answer before the learner chooses. */
export function answerCheck(userId: string, course: Course, session: Session, cardIndex: number, choice: number) {
  const card = session.cards[cardIndex];
  if (!card || card.type !== "check") return null;
  const correct = card.answer === choice;
  const xp = awardXp(userId, `check:${course.slug}:${session.id}:${cardIndex}`, `Knowledge check: ${session.title}`, correct ? XP.check : 0);
  return { correct, answer: card.answer, explanation: card.explanation, xp };
}

/** Grades a SCORM session test from the learner's choices (indexes per question, in order). Score is computed here, never trusted from the browser. */
export function gradeQuiz(userId: string, course: Course, session: Session, responses: (number | null)[]) {
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
    if (passed) xp += awardXp(userId, `quiz-pass:${course.slug}:${session.id}`, `Passed test: ${session.stage}`, XP.quizPass);
    if (score === session.quiz.length) {
      xp += awardXp(userId, `quiz-perfect:${course.slug}:${session.id}`, `Perfect score: ${session.stage}`, XP.quizPerfect);
      grantBadge(userId, "quiz-ace");
    }
    return { score, total: session.quiz.length, passed, xp };
  });
}
