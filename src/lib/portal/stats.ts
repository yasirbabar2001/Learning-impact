import "server-only";
import { all, one } from "../db";
import { OWNER_EMAILS } from "./auth";

const n = (sql: string, ...args: (string | number)[]) => one<{ n: number }>(sql, ...args)?.n ?? 0;
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

/** Admin previews are saved too; leave admins out of learner numbers. */
const NOT_ADMIN = `p.user_id NOT IN (SELECT id FROM users WHERE is_admin = 1 OR lower(email) IN (${OWNER_EMAILS.map((e) => `'${e.replace(/'/g, "")}'`).join(",") || "''"}))`;

/** Numbers for the admin dashboard (all from the portal database). */
export function dashboardStats() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const starters = n(`SELECT COUNT(*) AS n FROM (SELECT DISTINCT p.user_id, p.course_slug FROM session_progress p WHERE ${NOT_ADMIN})`);
  const converted = n(
    `SELECT COUNT(*) AS n FROM (SELECT DISTINCT p.user_id, p.course_slug FROM session_progress p
       JOIN enrollments e ON e.user_id = p.user_id AND e.course_slug = p.course_slug WHERE ${NOT_ADMIN})`,
  );
  const examsTaken = n("SELECT COUNT(*) AS n FROM exam_attempts WHERE submitted_at IS NOT NULL");
  const examsPassed = n("SELECT COUNT(*) AS n FROM exam_attempts WHERE submitted_at IS NOT NULL AND passed = 1");

  // Sign-ups per day for the last 14 days (oldest first).
  const signupRows = all<{ day: string; n: number }>(
    "SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n FROM users WHERE created_at >= ? GROUP BY day",
    daysAgo(14),
  );
  const signups = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { day, n: signupRows.find((r) => r.day === day)?.n ?? 0 };
  });

  return {
    revenueTotal: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved' AND currency = 'PKR'"),
    revenueMonth: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved' AND currency = 'PKR' AND decided_at >= ?", monthStart),
    revenueTotalUsd: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved' AND currency = 'USD'"),
    revenueMonthUsd: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved' AND currency = 'USD' AND decided_at >= ?", monthStart),
    paymentsToReview: n("SELECT COUNT(*) AS n FROM orders WHERE status = 'submitted'"),
    awaitingPayment: n("SELECT COUNT(*) AS n FROM orders WHERE status = 'awaiting_payment'"),
    learners: n("SELECT COUNT(*) AS n FROM users WHERE account_type = 'individual'"),
    newLearners7: n("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", daysAgo(7)),
    unverified: n("SELECT COUNT(*) AS n FROM users WHERE email_verified_at IS NULL"),
    companiesPending: n("SELECT COUNT(*) AS n FROM companies WHERE status = 'pending'"),
    companiesApproved: n("SELECT COUNT(*) AS n FROM companies WHERE status = 'approved'"),
    enrolments: n("SELECT COUNT(*) AS n FROM enrollments"),
    freeStage: n(
      `SELECT COUNT(*) AS n FROM (SELECT DISTINCT p.user_id, p.course_slug FROM session_progress p
         WHERE ${NOT_ADMIN} AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = p.user_id AND e.course_slug = p.course_slug))`,
    ),
    conversion: starters ? Math.round((converted / starters) * 100) : 0,
    stagesCleared: n(`SELECT COUNT(*) AS n FROM session_progress p WHERE quiz_passed_at IS NOT NULL AND ${NOT_ADMIN}`),
    certificates: n("SELECT COUNT(*) AS n FROM certificates WHERE revoked_at IS NULL"),
    examsTaken,
    examPassRate: examsTaken ? Math.round((examsPassed / examsTaken) * 100) : 0,
    activeToday: n("SELECT COUNT(DISTINCT user_id) AS n FROM xp_events WHERE created_at >= ?", daysAgo(1)),
    seatsPending: n("SELECT COUNT(*) AS n FROM invitations WHERE status = 'pending'"),
    signups,
    topCourses: all<{ course_slug: string; n: number }>("SELECT course_slug, COUNT(*) AS n FROM enrollments GROUP BY course_slug ORDER BY n DESC LIMIT 6"),
    recentOrders: all<{ reference: string; status: string; amount_pkr: number; currency: string; course_slug: string; name: string; created_at: string }>(
      `SELECT o.reference, o.status, o.amount_pkr, o.currency, o.course_slug, u.name, o.created_at
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 6`,
    ),
    recentUsers: all<{ name: string; email: string; account_type: string; created_at: string }>(
      "SELECT name, email, account_type, created_at FROM users ORDER BY created_at DESC LIMIT 6",
    ),
  };
}

/* ---------- Website visitors ---------- */

export type VisitBucket = { label: string; visitors: number; views: number };
export type VisitPeriod = { key: "day" | "month" | "year" | "all"; title: string; visitors: number; views: number; buckets: VisitBucket[] };

const PKT = 5 * 36e5; // Pakistan time, UTC+5 all year
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Unique visitors and page views today (by hour), this month (by day), this year (by month) and all time (by month). */
export function visitorStats(at = Date.now()): VisitPeriod[] {
  const pk = new Date(at + PKT);
  const y = pk.getUTCFullYear();
  const m = pk.getUTCMonth();
  const d = pk.getUTCDate();
  const iso = (utcMs: number) => new Date(utcMs - PKT).toISOString();
  const dayStart = iso(Date.UTC(y, m, d));
  const monthStart = iso(Date.UTC(y, m, 1));
  const yearStart = iso(Date.UTC(y, 0, 1));
  const totals = (since: string) => one<{ v: number; p: number }>("SELECT COUNT(DISTINCT visitor) AS v, COUNT(*) AS p FROM visits WHERE created_at >= ?", since) ?? { v: 0, p: 0 };
  // Buckets are computed in Pakistan time with SQLite's date modifiers.
  const grouped = (fmt: string, since: string) =>
    new Map(
      all<{ k: string; v: number; p: number }>(
        `SELECT strftime('${fmt}', created_at, '+5 hours') AS k, COUNT(DISTINCT visitor) AS v, COUNT(*) AS p FROM visits WHERE created_at >= ? GROUP BY k`,
        since,
      ).map((r) => [r.k, r]),
    );

  const hours = grouped("%H", dayStart);
  const days = grouped("%d", monthStart);
  const months = grouped("%m", yearStart);
  const allMonths = all<{ k: string; v: number; p: number }>(
    "SELECT strftime('%Y-%m', created_at, '+5 hours') AS k, COUNT(DISTINCT visitor) AS v, COUNT(*) AS p FROM visits GROUP BY k ORDER BY k",
  );
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const t = { day: totals(dayStart), month: totals(monthStart), year: totals(yearStart), all: totals("") };
  const b = (map: Map<string, { v: number; p: number }>, key: string, label: string): VisitBucket => ({ label, visitors: map.get(key)?.v ?? 0, views: map.get(key)?.p ?? 0 });

  // All time: every month from the first visit (or this month) to now.
  const first = allMonths[0]?.k ?? `${y}-${String(m + 1).padStart(2, "0")}`;
  const allMap = new Map(allMonths.map((r) => [r.k, r]));
  const allBuckets: VisitBucket[] = [];
  for (let yy = Number(first.slice(0, 4)), mm = Number(first.slice(5, 7)) - 1; yy < y || (yy === y && mm <= m); mm === 11 ? (yy++, (mm = 0)) : mm++) {
    const k = `${yy}-${String(mm + 1).padStart(2, "0")}`;
    allBuckets.push(b(allMap, k, `${MONTHS[mm]} ${String(yy).slice(2)}`));
  }

  return [
    { key: "day", title: "Today", visitors: t.day.v, views: t.day.p, buckets: Array.from({ length: 24 }, (_, h) => b(hours, String(h).padStart(2, "0"), `${String(h).padStart(2, "0")}:00`)) },
    { key: "month", title: `${MONTHS[m]} ${y}`, visitors: t.month.v, views: t.month.p, buckets: Array.from({ length: daysInMonth }, (_, i) => b(days, String(i + 1).padStart(2, "0"), String(i + 1))) },
    { key: "year", title: String(y), visitors: t.year.v, views: t.year.p, buckets: MONTHS.map((name, i) => b(months, String(i + 1).padStart(2, "0"), name)) },
    { key: "all", title: "All time", visitors: t.all.v, views: t.all.p, buckets: allBuckets },
  ];
}

/** The most visited pages and referring sites over the last 30 days. */
export function visitorTop() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  return {
    pages: all<{ path: string; n: number }>("SELECT path, COUNT(*) AS n FROM visits WHERE created_at >= ? GROUP BY path ORDER BY n DESC LIMIT 6", since),
    referrers: all<{ referrer: string; n: number }>("SELECT referrer, COUNT(*) AS n FROM visits WHERE created_at >= ? AND referrer <> '' GROUP BY referrer ORDER BY n DESC LIMIT 6", since),
  };
}
