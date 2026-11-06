"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCourse } from "../courses/catalog";
import { currentUser, requireUser } from "../portal/auth";
import { attemptsAllowed, attemptsOf, certificateFor, openAttempt, saveAnswer, startAttempt, submitAttempt } from "../portal/exam";
import { courseProgress, enrollmentFor, progressMap } from "../portal/learning";

/* Lesson events (cards seen, checks, games, completion) go through /api/learn/[slug]/[sid]. */

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
