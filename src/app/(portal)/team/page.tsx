import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/admin/DashboardView";
import { canSeeTeamDashboard, homeFor, requireUser } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Team dashboard" };
export const dynamic = "force-dynamic";

/** Read-only dashboard for the Learning Impact Team (and administrators). Nothing on this page can change data. */
export default async function TeamDashboard() {
  const user = await requireUser("/team");
  if (!canSeeTeamDashboard(user)) redirect(homeFor(user));
  return (
    <section className="container section team-dash">
      <DashboardView readOnly />
    </section>
  );
}
