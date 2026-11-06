import type { Metadata } from "next";
import Link from "next/link";
import { PortalNav } from "@/components/portal/PortalNav";
import { currentUser } from "@/lib/portal/auth";
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
              }
            : null
        }
      />
      {children}
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
