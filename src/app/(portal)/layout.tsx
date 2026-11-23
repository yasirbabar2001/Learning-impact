import type { Metadata } from "next";
import Link from "next/link";
import { LiveChat } from "@/components/LiveChat";
import { PortalNav } from "@/components/portal/PortalNav";
import { currentUser, hasAdminAccess, isTeamMember } from "@/lib/portal/auth";
import { levelFor } from "@/lib/portal/game";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const level = user ? levelFor(user.xp) : null;
  return (
    <>
      <PortalNav
        user={
          user && level
            ? {
                name: user.name,
                xp: user.xp,
                streak: user.streak,
                level: level.index,
                levelName: level.name,
                progress: level.progress,
                manager: user.company_role === "manager",
                admin: hasAdminAccess(user),
                team: isTeamMember(user),
              }
            : null
        }
      />
      {children}
      <LiveChat signedIn={user && user.email_verified_at ? { name: user.name, email: user.email } : null} />
      <footer className="portal-foot">
        <span>© {new Date().getFullYear()} Learning Impact (SMC-Private) Limited</span>
        <span>
          {/* No prefetch: on shared hosting, prefetching these on every page competed with the page being opened. */}
          <Link href="/terms" prefetch={false}>
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/contact" prefetch={false}>
            Help
          </Link>{" "}
          ·{" "}
          <Link href="/" prefetch={false}>
            learningimpact.pk
          </Link>
        </span>
      </footer>
    </>
  );
}
