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

/** A recurring character in a course's story cards (drawn as an illustrated avatar). */
export const castSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: text(2, 40),
  role: text(3, 60),
  look: z.object({
    skin: z.number().int().min(1).max(5),
    hair: z.enum(["short", "long", "hijab", "bun", "curly", "bald", "beard"]),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});

const short = (min = 20, max = 900) => z.string().trim().min(min).max(max);

export const DIAGRAM_KINDS = ["cycle", "steps", "pyramid", "matrix", "funnel", "compare", "timeline", "stats"] as const;

export const cardSchema = z.discriminatedUnion("type", [
  /* Reading cards: keep them short; the visual and interactive cards carry most of the teaching. */
  z.object({ type: z.literal("concept"), title: text(3, 120), body: md(80, 1100) }),
  z.object({ type: z.literal("example"), title: text(3, 120), body: md(80, 1100) }),
  z.object({ type: z.literal("tip"), title: text(3, 120), body: md(40, 700) }),
  z.object({ type: z.literal("keypoints"), title: text(3, 120), items: z.array(text(10, 220)).min(3).max(7) }),
  z.object({ type: z.literal("reflect"), prompt: text(20, 400) }),
  z.object({
    type: z.literal("check"),
    question: text(10, 400),
    options: z.array(text(1, 200)).min(3).max(4),
    answer: z.number().int().min(0).max(3),
    explanation: text(20, 600),
  }),
  /* A short chat-style scene between cast members (or the narrator). */
  z.object({
    type: z.literal("story"),
    title: text(3, 100),
    setting: text(5, 160),
    lines: z
      .array(z.object({ who: z.string(), text: text(2, 320), mood: z.enum(["neutral", "happy", "worried", "angry", "thinking", "proud"]).default("neutral") }))
      .min(3)
      .max(12),
  }),
  /* Animated diagram. matrix: exactly 4 items (top-left, top-right, bottom-left, bottom-right) + axes;
     compare: items are rows with left/right + headers; stats: items with value; others: ordered items. */
  z.object({
    type: z.literal("diagram"),
    kind: z.enum(DIAGRAM_KINDS),
    title: text(3, 100),
    caption: short(10, 400).optional(),
    headers: z.tuple([text(1, 40), text(1, 40)]).optional(),
    axes: z.object({ x: text(1, 40), y: text(1, 40) }).optional(),
    items: z
      .array(
        z.object({
          label: text(1, 80),
          detail: text(1, 220).optional(),
          value: text(1, 24).optional(),
          left: text(1, 120).optional(),
          right: text(1, 120).optional(),
        }),
      )
      .min(2)
      .max(8),
  }),
  /* Branching "what would you do?" decision. score: 2 best, 1 acceptable, 0 poor. */
  z.object({
    type: z.literal("scenario"),
    title: text(3, 100),
    situation: short(40, 900),
    choices: z.array(z.object({ text: text(5, 220), outcome: short(20, 600), score: z.number().int().min(0).max(2) })).min(3).max(4),
  }),
  z.object({ type: z.literal("flip"), title: text(3, 100), cards: z.array(z.object({ front: text(2, 120), back: text(5, 300) })).min(3).max(8) }),
  z.object({
    type: z.literal("sort"),
    title: text(3, 100),
    prompt: text(10, 240),
    buckets: z.array(text(2, 40)).min(2).max(3),
    items: z.array(z.object({ text: text(2, 140), bucket: z.number().int().min(0).max(2) })).min(4).max(10),
  }),
  z.object({ type: z.literal("match"), title: text(3, 100), prompt: text(10, 240), pairs: z.array(z.object({ left: text(1, 80), right: text(2, 160) })).min(3).max(6) }),
  z.object({ type: z.literal("order"), title: text(3, 100), prompt: text(10, 240), steps: z.array(text(2, 160)).min(3).max(7) }),
  /* A narrated mini-movie: animated scenes with captions, read aloud. */
  z.object({
    type: z.literal("explainer"),
    title: text(3, 100),
    scenes: z.array(z.object({ icon: z.string().min(1).max(8), heading: text(2, 80), narration: text(20, 400) })).min(3).max(7),
  }),
  /* A real video (YouTube, Vimeo or an .mp4 link), added when available. */
  z.object({ type: z.literal("video"), title: text(3, 100), url: z.url(), caption: text(5, 300).optional() }),
]);

export const sessionSchema = z.object({
  id: z.string().regex(/^s[1-9]$/),
  title: text(5, 120),
  /** Quest stage name shown on the map, e.g. "The Mirror Room". */
  stage: text(3, 60),
  summary: text(40, 400),
  minutes: z.number().int().min(15).max(120),
  objectives: z.array(text(10, 200)).min(3).max(5),
  cards: z.array(cardSchema).min(10).max(30),
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
    /** Recurring characters used in story cards. */
    cast: z.array(castSchema).max(6).default([]),
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
export type CastMember = z.infer<typeof castSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Course = z.infer<typeof courseSchema>;

/** Quality rules the schema alone cannot express. Returns a list of problems (empty = fine). */
export function qualityProblems(course: Course): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const seenText = new Set<string>();
  const all: Question[] = [...course.sessions.flatMap((s) => s.quiz), ...course.exam.bank];

  const castIds = new Set(course.quest.cast.map((c) => c.id));
  const interactive = ["flip", "sort", "match", "order"];
  course.sessions.forEach((s, i) => {
    if (s.id !== `s${i + 1}`) problems.push(`Session ${i + 1} must have id "s${i + 1}".`);
    const count = (t: string) => s.cards.filter((c) => c.type === t).length;
    if (count("check") < 2) problems.push(`${s.id}: add at least 2 "check" cards (found ${count("check")}).`);
    if (!count("keypoints")) problems.push(`${s.id}: add a "keypoints" card.`);
    if (!count("story")) problems.push(`${s.id}: open with a "story" card (a short scene with the cast).`);
    if (count("diagram") < 2) problems.push(`${s.id}: add at least 2 "diagram" cards (found ${count("diagram")}).`);
    if (!count("scenario")) problems.push(`${s.id}: add a "scenario" decision card.`);
    if (!count("explainer")) problems.push(`${s.id}: add an "explainer" mini-movie card.`);
    const games = new Set(s.cards.filter((c) => interactive.includes(c.type)).map((c) => c.type));
    if (games.size < 2) problems.push(`${s.id}: use at least 2 different interactive cards (flip, sort, match, order); found ${games.size}.`);
    const reading = s.cards.filter((c) => c.type === "concept" || c.type === "example" || c.type === "tip").length;
    if (reading / s.cards.length > 0.4) problems.push(`${s.id}: too much reading: ${reading} of ${s.cards.length} cards are concept/example/tip (max 40%).`);
    s.cards.forEach((c, j) => {
      const at = `${s.id} card ${j + 1}`;
      if (c.type === "check" && c.answer >= c.options.length) problems.push(`${at}: answer index out of range.`);
      if (c.type === "story") c.lines.forEach((l) => l.who !== "narrator" && !castIds.has(l.who) && problems.push(`${at}: "${l.who}" is not in quest.cast.`));
      if (c.type === "scenario" && !c.choices.some((x) => x.score === 2)) problems.push(`${at}: one choice must have score 2 (best).`);
      if (c.type === "sort") c.items.forEach((it) => it.bucket >= c.buckets.length && problems.push(`${at}: bucket index out of range.`));
      if (c.type === "diagram") {
        if (c.kind === "matrix" && (c.items.length !== 4 || !c.axes)) problems.push(`${at}: matrix needs exactly 4 items and axes.`);
        if (c.kind === "compare" && (!c.headers || c.items.some((it) => !it.left || !it.right))) problems.push(`${at}: compare needs headers and left/right on every item.`);
        if (c.kind === "stats" && c.items.some((it) => !it.value)) problems.push(`${at}: stats items need a value.`);
        if (c.kind === "cycle" && c.items.length > 6) problems.push(`${at}: a cycle reads best with 3-6 items.`);
      }
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
