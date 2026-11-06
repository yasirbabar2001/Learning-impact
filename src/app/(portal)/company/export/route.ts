import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { teamProgress } from "@/lib/portal/commerce";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const user = await currentUser();
  if (!user?.company_id || user.company_role !== "manager") return new Response("Unauthorized", { status: 401 });
  const rows = teamProgress(user.company_id).map((t) => [
    t.name,
    t.email,
    t.designation,
    getCourse(t.course_slug)?.title ?? t.course_slug,
    t.enrolled_at.slice(0, 10),
    `${t.stages_passed}/${getCourse(t.course_slug)?.sessions.length ?? ""}`,
    t.best_exam ?? "",
    t.attempts,
    t.cert_code ? "Certified" : "Not yet",
    t.cert_code ?? "",
    t.completed_at?.slice(0, 10) ?? "",
    t.last_active_day ?? "",
  ]);
  const head = ["Name", "E-mail", "Designation", "Certification", "Enrolled", "Stages cleared", "Best exam %", "Exam attempts", "Status", "Certificate code", "Certified on", "Last active"];
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="team-progress.csv"', "Cache-Control": "no-store" },
  });
}
