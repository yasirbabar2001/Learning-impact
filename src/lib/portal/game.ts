import "server-only";
import { all, now, one, run } from "../db";

export { LEVELS, levelFor } from "./levels";

/** XP rules, in one place so the UI can explain them. */
export const XP = {
  lesson: 50,
  check: 10,
  quizPass: 100,
  quizPerfect: 50,
  /** Games and scenarios: 5 XP for taking part plus up to 10 for accuracy. */
  activity: 15,
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
  connector: { name: "Connector", description: "Three friends joined through your invite link.", icon: "🤝" },
  ambassador: { name: "Ambassador", description: "A friend you invited enrolled in a certification.", icon: "📣" },
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

/** Monday 00:00 Pakistan time of the current week, as an ISO timestamp: the weekly league resets then. */
export function weekStart(at = Date.now()): string {
  const pk = new Date(at + 5 * 36e5); // PKT is UTC+5 all year
  const daysSinceMonday = (pk.getUTCDay() + 6) % 7;
  const monday = Date.UTC(pk.getUTCFullYear(), pk.getUTCMonth(), pk.getUTCDate() - daysSinceMonday) - 5 * 36e5;
  return new Date(monday).toISOString();
}

/** XP earned since a moment (or in the last N days, or all time), for learners who allow it. */
export function leaderboard(opts: { days?: number; since?: string; companyId?: string; limit?: number } = {}): LeaderRow[] {
  const since = opts.since ?? (opts.days ? new Date(Date.now() - opts.days * 864e5).toISOString() : "");
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

/** The learner's place in this week's league (null before they earn XP this week). */
export function weeklyRank(userId: string): { rank: number; xp: number; players: number } | null {
  const since = weekStart();
  const rows = all<{ user_id: string; points: number }>(
    `SELECT e.user_id, SUM(e.xp) AS points FROM xp_events e JOIN users u ON u.id = e.user_id
     WHERE e.created_at >= ? AND u.status = 'active' GROUP BY e.user_id HAVING points > 0 ORDER BY points DESC`,
    since,
  );
  const i = rows.findIndex((r) => r.user_id === userId);
  return i < 0 ? null : { rank: i + 1, xp: rows[i].points, players: rows.length };
}

/** Whole days until the weekly league resets (at least 1). */
export const daysUntilReset = () => Math.max(1, Math.ceil((Date.parse(weekStart()) + 7 * 864e5 - Date.now()) / 864e5));
