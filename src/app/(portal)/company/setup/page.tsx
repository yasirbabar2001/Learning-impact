import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/account";
import { requireUser } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Company accounts" };

/** Company features need a separate company account (its own e-mail), reviewed by our team. */
export default async function CompanySetup() {
  const user = await requireUser("/company/setup");
  if (user.account_type === "company") redirect("/company");
  return (
    <section className="container section checkout">
      <div className="glass checkout__card company-setup">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> For employers
        </p>
        <h1 className="h3">Buying for your team? Create a company account</h1>
        <p className="muted">
          Company accounts buy certification seats in bulk, invite employees by e-mail and follow their progress, scores and certificates. Each company account uses its own e-mail
          address and is activated after a short review by our team.
        </p>
        <p className="muted">You are logged in as an individual ({user.email}). Log out, then register your company.</p>
        <form action={logout}>
          <input type="hidden" name="to" value="company" />
          <button className="btn btn--primary">
            <span className="btn__label">Log out and register a company</span>
            <span className="btn__arrow">→</span>
          </button>
        </form>
        <Link href="/learn" className="inline-link">
          Back to my quests
        </Link>
      </div>
    </section>
  );
}
