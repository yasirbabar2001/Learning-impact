import { isAdmin } from "@/lib/auth";
import { adminUsers } from "@/lib/portal/users";
import { xlsx } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

/** Excel download of Admin › Users (same filters as the page). */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const p = new URL(req.url).searchParams;
  const users = adminUsers({ q: p.get("q") ?? "", type: p.get("type") ?? "", gender: p.get("gender") ?? "", status: p.get("status") ?? "" });
  const d = (iso: string | null) => (iso ? new Date(iso) : null);
  const header = [
    "Name", "E-mail", "Mobile", "Gender", "Account type", "Organisation / company", "Company approval", "Designation", "Status",
    "E-mail verified", "Admin", "Enrolments", "Courses on free stage", "Certificates", "XP", "Level", "Streak (days)", "Friends referred", "Joined", "Last login",
  ];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone,
    u.gender,
    u.account_type === "company" ? "Company" : "Individual",
    u.company ?? u.organisation,
    u.company_status ?? "",
    u.designation,
    u.status === "active" ? "Active" : "Disabled",
    d(u.email_verified_at),
    u.admin ? "Yes" : "No",
    u.enrolments,
    u.free_stage,
    u.certificates,
    u.xp,
    u.level,
    u.streak,
    u.referrals,
    d(u.created_at),
    d(u.last_login_at),
  ]);
  const file = xlsx("Users", header, rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(Buffer.from(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="learning-impact-users-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
