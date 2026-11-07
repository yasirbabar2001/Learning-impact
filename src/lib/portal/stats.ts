import "server-only";
import { all, one } from "../db";

const n = (sql: string, ...args: (string | number)[]) => one<{ n: number }>(sql, ...args)?.n ?? 0;
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

/** Numbers for the admin dashboard (all from the portal database). */
export function dashboardStats() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const starters = n(`SELECT COUNT(*) AS n FROM (SELECT DISTINCT user_id, course_slug FROM session_progress)`);
  const converted = n(
    `SELECT COUNT(*) AS n FROM (SELECT DISTINCT p.user_id, p.course_slug FROM session_progress p
       JOIN enrollments e ON e.user_id = p.user_id AND e.course_slug = p.course_slug)`,
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
    revenueTotal: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved'"),
    revenueMonth: n("SELECT COALESCE(SUM(amount_pkr), 0) AS n FROM orders WHERE status = 'approved' AND decided_at >= ?", monthStart),
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
         WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = p.user_id AND e.course_slug = p.course_slug))`,
    ),
    conversion: starters ? Math.round((converted / starters) * 100) : 0,
    stagesCleared: n("SELECT COUNT(*) AS n FROM session_progress WHERE quiz_passed_at IS NOT NULL"),
    certificates: n("SELECT COUNT(*) AS n FROM certificates WHERE revoked_at IS NULL"),
    examsTaken,
    examPassRate: examsTaken ? Math.round((examsPassed / examsTaken) * 100) : 0,
    activeToday: n("SELECT COUNT(DISTINCT user_id) AS n FROM xp_events WHERE created_at >= ?", daysAgo(1)),
    seatsPending: n("SELECT COUNT(*) AS n FROM invitations WHERE status = 'pending'"),
    signups,
    topCourses: all<{ course_slug: string; n: number }>("SELECT course_slug, COUNT(*) AS n FROM enrollments GROUP BY course_slug ORDER BY n DESC LIMIT 6"),
    recentOrders: all<{ reference: string; status: string; amount_pkr: number; course_slug: string; name: string; created_at: string }>(
      `SELECT o.reference, o.status, o.amount_pkr, o.course_slug, u.name, o.created_at
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 6`,
    ),
    recentUsers: all<{ name: string; email: string; account_type: string; created_at: string }>(
      "SELECT name, email, account_type, created_at FROM users ORDER BY created_at DESC LIMIT 6",
    ),
  };
}
