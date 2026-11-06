"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCourse } from "../courses/catalog";
import { currentUser, requireUser } from "../portal/auth";
import { attemptsAllowed, attemptsOf, certificateFor, openAttempt, saveAnswer, startAttempt, submitAttempt } from "../portal/exam";
import { answerCheck, completeLesson, courseProgress, enrollmentFor, progressMap, recordCardsSeen, stageOf } from "../portal/learning";

/** Loads course, session and stage, and confirms the learner may open it. */
async function access(slug: string, sid: string) {
  const user = await currentUser();
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  if (!user || !course || !session || !enrollmentFor(user.id, slug)) return null;
  const stage = stageOf(course, user.id, sid);
  if (!stage || stage.status === "locked") return null;
  return { user, course, session };
}

export async function saveCardProgress(slug: string, sid: string, seen: number) {
  const a = await access(slug, sid);
  if (!a || !Number.isInteger(seen) || seen < 0) return;
  recordCardsSeen(a.user.id, slug, sid, Math.min(seen, a.session.cards.length));
}

export async function checkAnswer(slug: string, sid: string, cardIndex: number, choice: number) {
  const a = await access(slug, sid);
  if (!a || !Number.isInteger(cardIndex) || !Number.isInteger(choice)) return null;
  return answerCheck(a.user.id, a.course, a.session, cardIndex, choice);
}

export async function finishLesson(slug: string, sid: string) {
  const a = await access(slug, sid);
  if (!a) return null;
  const xp = completeLesson(a.user.id, a.course, a.session);
  revalidatePath(`/learn/${slug}`);
  return { xp };
}

/* ---------- Final exam ---------- */

export async function beginExam(fd: FormData) {
  const slug = String(fd.get("slug") ?? "");
  const user = await requireUser(`/learn/${slug}/exam`);
  const course = getCourse(slug);
  const enrollment = course ? enrollmentFor(user.id, slug) : null;
  if (!course || !enrollment) redirect("/learn");
  if (certificateFor(user.id, slug)) redirect(`/learn/${slug}/exam`);
  if (!courseProgress(course, progressMap(user.id, slug)).examUnlocked) redirect(`/learn/${slug}`);
  if (!openAttempt(user.id, slug)) {
    const used = attemptsOf(user.id, slug).length;
    if (used >= attemptsAllowed(enrollment.extra_attempts)) redirect(`/learn/${slug}/exam`);
    startAttempt(user.id, course);
  }
  redirect(`/learn/${slug}/exam/sit`);
}

export async function recordExamAnswer(slug: string, questionId: string, choice: number) {
  const user = await currentUser();
  if (!user || !Number.isInteger(choice) || choice < 0 || choice > 3) return false;
  const attempt = openAttempt(user.id, slug);
  if (!attempt || !(JSON.parse(attempt.question_ids) as string[]).includes(questionId)) return false;
  return saveAnswer(attempt, questionId, choice);
}

export async function finishExam(fd: FormData) {
  const slug = String(fd.get("slug") ?? "");
  const user = await requireUser(`/learn/${slug}/exam`);
  const course = getCourse(slug);
  const attempt = openAttempt(user.id, slug);
  if (course && attempt) {
    const done = submitAttempt(attempt, course, user.name);
    revalidatePath("/learn");
    redirect(`/learn/${slug}/exam/result/${done.id}`);
  }
  redirect(`/learn/${slug}/exam`);
}
