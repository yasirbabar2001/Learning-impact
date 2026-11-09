import "server-only";
import { all } from "../db";
import { isOwnerEmail } from "./auth";
import { levelFor } from "./levels";

export type UserFilters = { q?: string; type?: string; gender?: string; status?: string };

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  account_type: string;
  organisation: string;
  company: string | null;
  company_status: string | null;
  designation: string;
  status: string;
  email_verified_at: string | null;
  is_admin: number;
  is_team: number;
  xp: number;
  streak: number;
  created_at: string;
  last_login_at: string | null;
  enrolments: number;
  free_stage: number;
  certificates: number;
  referrals: number;
};

/** Every user with the numbers an administrator needs, filtered like the Admin › Users page. */
export function adminUsers(f: UserFilters = {}): (UserRow & { level: string; admin: boolean })[] {
  const where: string[] = ["1 = 1"];
  const args: string[] = [];
  const q = f.q?.trim();
  if (q) {
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.organisation LIKE ? OR c.name LIKE ?)");
    args.push(...Array(5).fill(`%${q}%`));
  }
  if (f.type === "individual" || f.type === "company") {
    where.push("u.account_type = ?");
    args.push(f.type);
  }
  if (f.gender) {
    where.push(f.gender === "not set" ? "u.gender = ''" : "u.gender = ?");
    if (f.gender !== "not set") args.push(f.gender);
  }
  if (f.status === "active" || f.status === "disabled") {
    where.push("u.status = ?");
    args.push(f.status);
  } else if (f.status === "unverified") where.push("u.email_verified_at IS NULL");
  const rows = all<UserRow>(
    `SELECT u.id, u.name, u.email, u.phone, u.gender, u.account_type, u.organisation, c.name AS company, c.status AS company_status,
            u.designation, u.status, u.email_verified_at, u.is_admin, u.is_team, u.xp, u.streak, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrolments,
            (SELECT COUNT(DISTINCT p.course_slug) FROM session_progress p WHERE p.user_id = u.id
               AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = u.id AND e.course_slug = p.course_slug)) AS free_stage,
            (SELECT COUNT(*) FROM certificates x WHERE x.user_id = u.id AND x.revoked_at IS NULL) AS certificates,
            (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.id) AS referrals
     FROM users u LEFT JOIN companies c ON c.id = u.company_id
     WHERE ${where.join(" AND ")}
     ORDER BY u.created_at DESC`,
    ...args,
  );
  return rows.map((r) => ({ ...r, level: `L${levelFor(r.xp).index} ${levelFor(r.xp).name}`, admin: Boolean(r.is_admin) || isOwnerEmail(r.email) }));
}
