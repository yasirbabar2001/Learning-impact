import { z } from "zod";

/**
 * Format of a certification course ("quest"). Courses are written as JSON files in
 * content/courses/<slug>.json and checked with `pnpm content:check`.
 */

export const CATEGORIES = ["Leadership", "Technology", "People & HR", "Operations", "Banking & Compliance", "Professional Skills"] as const;
export const LEVELS = ["Foundation", "Intermediate", "Advanced"] as const;

const text = (min = 1, max = 400) => z.string().trim().min(min).max(max);
/** Markdown allowed: paragraphs, **bold**, lists, short tables. */
const md = (min = 40, max = 4000) => z.string().trim().min(min).max(max);

export const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  question: text(10, 600),
  options: z.array(text(1, 300)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: text(20, 800),
  difficulty: z.number().int().min(1).max(5),
});

export const cardSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("concept"), title: text(3, 120), body: md(120) }),
  z.object({ type: z.literal("example"), title: text(3, 120), body: md(120) }),
  z.object({ type: z.literal("tip"), title: text(3, 120), body: md(40, 1500) }),
  z.object({ type: z.literal("keypoints"), title: text(3, 120), items: z.array(text(10, 300)).min(3).max(7) }),
  z.object({ type: z.literal("reflect"), prompt: text(20, 500) }),
  z.object({
    type: z.literal("check"),
    question: text(10, 400),
    options: z.array(text(1, 200)).min(3).max(4),
    answer: z.number().int().min(0).max(3),
    explanation: text(20, 600),
  }),
]);

export const sessionSchema = z.object({
  id: z.string().regex(/^s[1-9]$/),
  title: text(5, 120),
  /** Quest stage name shown on the map, e.g. "The Mirror Room". */
  stage: text(3, 60),
  summary: text(40, 400),
  minutes: z.number().int().min(15).max(120),
  objectives: z.array(text(10, 200)).min(3).max(5),
  cards: z.array(cardSchema).min(10).max(22),
  /** Scored SCORM test at the end of the session. */
  quiz: z.array(questionSchema).length(10),
});

export const courseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: text(5, 90),
  tagline: text(20, 160),
  category: z.enum(CATEGORIES),
  level: z.enum(LEVELS),
  sectors: z.array(text(3, 60)).min(2).max(10),
  hours: z.number().min(3).max(40),
  description: md(200, 1500),
  audience: z.array(text(10, 200)).min(3).max(6),
  outcomes: z.array(text(10, 220)).min(4).max(7),
  quest: z.object({
    name: text(5, 60),
    premise: text(80, 600),
    /** Badge earned on passing the final exam. */
    badge: z.object({ name: text(3, 40), description: text(20, 200) }),
    /** Accent colour for the course, e.g. "#ff4d6d". */
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  sessions: z.array(sessionSchema).min(4).max(7),
  exam: z.object({
    questionsPerAttempt: z.number().int().min(30).max(50),
    passMark: z.number().int().min(60).max(90),
    minutes: z.number().int().min(30).max(120),
    bank: z.array(questionSchema).min(40).max(80),
  }),
});

export type Question = z.infer<typeof questionSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Course = z.infer<typeof courseSchema>;

/** Quality rules the schema alone cannot express. Returns a list of problems (empty = fine). */
export function qualityProblems(course: Course): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const seenText = new Set<string>();
  const all: Question[] = [...course.sessions.flatMap((s) => s.quiz), ...course.exam.bank];

  course.sessions.forEach((s, i) => {
    if (s.id !== `s${i + 1}`) problems.push(`Session ${i + 1} must have id "s${i + 1}".`);
    const checks = s.cards.filter((c) => c.type === "check").length;
    if (checks < 2) problems.push(`${s.id}: add at least 2 "check" cards (found ${checks}).`);
    if (!s.cards.some((c) => c.type === "example")) problems.push(`${s.id}: add at least one "example" card.`);
    if (!s.cards.some((c) => c.type === "keypoints")) problems.push(`${s.id}: add a "keypoints" card.`);
    s.cards.forEach((c, j) => {
      if (c.type === "check" && c.answer >= c.options.length) problems.push(`${s.id} card ${j + 1}: answer index out of range.`);
    });
  });

  for (const q of all) {
    if (seenIds.has(q.id)) problems.push(`Duplicate question id "${q.id}".`);
    seenIds.add(q.id);
    const key = q.question.toLowerCase().replace(/\s+/g, " ");
    if (seenText.has(key)) problems.push(`Duplicate question text: "${q.question.slice(0, 60)}…"`);
    seenText.add(key);
    if (new Set(q.options.map((o) => o.toLowerCase())).size !== 4) problems.push(`${q.id}: options must all be different.`);
    if (q.options.some((o) => /^(all|none) of the above$/i.test(o.trim()))) problems.push(`${q.id}: avoid "all/none of the above".`);
  }

  const { bank, questionsPerAttempt } = course.exam;
  if (bank.length < questionsPerAttempt + 10) problems.push(`Exam bank needs at least ${questionsPerAttempt + 10} questions so attempts differ (has ${bank.length}).`);
  const hard = bank.filter((q) => q.difficulty >= 3).length;
  if (hard / bank.length < 0.7) problems.push(`Final exam must be tough: at least 70% of bank questions need difficulty 3+ (now ${Math.round((hard / bank.length) * 100)}%).`);
  const veryHard = bank.filter((q) => q.difficulty >= 4).length;
  if (veryHard / bank.length < 0.35) problems.push(`At least 35% of bank questions need difficulty 4+ (now ${Math.round((veryHard / bank.length) * 100)}%).`);

  // Correct answers must be spread across A-D, so guessing a pattern does not work.
  const groups: [string, Question[]][] = [["exam bank", bank], ["all session quizzes", course.sessions.flatMap((s) => s.quiz)]];
  for (const [label, qs] of groups) {
    const counts = [0, 0, 0, 0];
    qs.forEach((q) => counts[q.answer]++);
    counts.forEach((c, i) => {
      if (c / qs.length < 0.15 || c / qs.length > 0.35) problems.push(`${label}: answer ${"ABCD"[i]} is correct in ${c} of ${qs.length}; keep each letter between 15% and 35%.`);
    });
  }
  // The right answer should not simply be the longest option.
  const longest = all.filter((q) => q.options[q.answer].length === Math.max(...q.options.map((o) => o.length))).length;
  if (longest / all.length > 0.45) problems.push(`The correct option is the longest in ${Math.round((longest / all.length) * 100)}% of questions; balance option lengths (max 45%).`);
  return problems;
}
