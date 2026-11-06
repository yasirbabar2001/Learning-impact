import "server-only";
import { all, now, one, run } from "../db";

/** Levels a learner climbs with XP. */
export const LEVELS = [
  { name: "Explorer", xp: 0 },
  { name: "Pathfinder", xp: 300 },
  { name: "Achiever", xp: 800 },
  { name: "Specialist", xp: 1600 },
  { name: "Expert", xp: 3000 },
  { name: "Master", xp: 5000 },
  { name: "Legend", xp: 8000 },
] as const;

export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i + 1, name: cur.name, next, progress, toNext: next ? next.xp - xp : 0 };
}

/** XP rules, in one place so the UI can explain them. */
export const XP = {
  lesson: 50,
  check: 10,
  quizPass: 100,
  quizPerfect: 50,
  examPass: 500,
  examDistinction: 250,
} as const;

export const BADGES: Record<string, { name: string; description: string; icon: string }> = {
  "first-steps": { name: "First Steps", description: "Completed your first lesson.", icon: "👣" },
  "quiz-ace": { name: "Quiz Ace", description: "Scored 10/10 on a session test.", icon: "🎯" },
  "streak-3": { name: "On Fire", description: "Learned 3 days in a row.", icon: "🔥" },
  "streak-7": { name: "Unstoppable", description: "Learned 7 days in a row.", icon: "⚡" },
  "streak-30": { name: "Iron Will", description: "Learned 30 days in a row.", icon: "🏔️" },
  "boss-slayer": { name: "Boss Slayer", description: "Passed your first final exam.", icon: "🐉" },
  distinction: { name: "Distinction", description: "Scored 90% or more in a final exam.", icon: "🏆" },
};

/** Pakistan time, so streak days roll over at local midnight. */
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

export function grantBadge(userId: string, badge: string): boolean {
  return run("INSERT OR IGNORE INTO badges (user_id, badge, earned_at) VALUES (?, ?, ?)", userId, badge, now()).changes > 0;
}

/** Records today's activity and maintains the streak. */
export function touchStreak(userId: string) {
  const u = one<{ streak: number; best_streak: number; last_active_day: string | null }>(
    "SELECT streak, best_streak, last_active_day FROM users WHERE id = ?",
    userId,
  );
  if (!u) return;
  const t = today();
  if (u.last_active_day === t) return;
  const streak = u.last_active_day === yesterday() ? u.streak + 1 : 1;
  run("UPDATE users SET streak = ?, best_streak = MAX(best_streak, ?), last_active_day = ? WHERE id = ?", streak, streak, t, userId);
  if (streak >= 3) grantBadge(userId, "streak-3");
  if (streak >= 7) grantBadge(userId, "streak-7");
  if (streak >= 30) grantBadge(userId, "streak-30");
}

/**
 * Awards XP once per ref (e.g. "quiz-pass:aml-cft:s2"). Pass xp = 0 to record that the
 * chance was used without paying out (e.g. a knowledge check answered wrongly first).
 * Returns the XP actually awarded.
 */
export function awardXp(userId: string, ref: string, label: string, xp: number): number {
  const inserted = run("INSERT OR IGNORE INTO xp_events (user_id, ref, label, xp, created_at) VALUES (?, ?, ?, ?, ?)", userId, ref, label, xp, now()).changes > 0;
  if (!inserted) return 0;
  if (xp > 0) run("UPDATE users SET xp = xp + ? WHERE id = ?", xp, userId);
  touchStreak(userId);
  return xp;
}

export function userBadges(userId: string) {
  return all<{ badge: string; earned_at: string }>("SELECT badge, earned_at FROM badges WHERE user_id = ? ORDER BY earned_at", userId);
}

export function recentXp(userId: string, limit = 8) {
  return all<{ label: string; xp: number; created_at: string }>(
    "SELECT label, xp, created_at FROM xp_events WHERE user_id = ? AND xp > 0 ORDER BY id DESC LIMIT ?",
    userId,
    limit,
  );
}

export type LeaderRow = { id: string; name: string; organisation: string; xp: number };

/** XP earned in the last 30 days (or all time), for learners who allow it. */
export function leaderboard(opts: { days?: number; companyId?: string; limit?: number } = {}): LeaderRow[] {
  const since = opts.days ? new Date(Date.now() - opts.days * 864e5).toISOString() : "";
  const params: (string | number)[] = [since];
  let where = "u.status = 'active' AND u.show_on_leaderboard = 1";
  if (opts.companyId) {
    where = "u.status = 'active' AND u.company_id = ?";
    params.push(opts.companyId);
  }
  params.push(opts.limit ?? 20);
  return all<Omit<LeaderRow, "xp"> & { points: number }>(
    `SELECT u.id, u.name, u.organisation, SUM(e.xp) AS points
     FROM users u JOIN xp_events e ON e.user_id = u.id AND e.created_at >= ?
     WHERE ${where}
     GROUP BY u.id HAVING points > 0 ORDER BY points DESC, u.name LIMIT ?`,
    ...params,
  ).map(({ points, ...r }) => ({ ...r, xp: points }));
}

/** "Ayesha Khan" -> "Ayesha K." for public boards. */
export const publicName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};
