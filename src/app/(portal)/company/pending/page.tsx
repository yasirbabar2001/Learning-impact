import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/account";
import { companyOf, requireUser } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Company under review" };

export default async function CompanyPending() {
  const user = await requireUser("/company");
  const company = companyOf(user);
  if (user.account_type !== "company" || !company) redirect("/learn");
  if (company.status === "approved") redirect("/company");
  const rejected = company.status === "rejected";
  return (
    <section className="container section checkout">
      <div className="glass checkout__card company-setup pending">
        <span className="lesson__intro-icon">{rejected ? "📝" : "⏳"}</span>
        <p className="eyebrow">
          <span className="eyebrow__dot" /> {company.name}
        </p>
        <h1 className="h3">{rejected ? "We could not approve this company profile" : "Your company profile is under review"}</h1>
        {rejected ? (
          <>
            {company.review_note && <p className="form-alert">{company.review_note}</p>}
            <p className="muted">Please contact us at info@learningimpact.pk or +92 334 9990778 so we can help.</p>
          </>
        ) : (
          <>
            <p className="muted">Thank you for verifying your e-mail. Our team checks every company account before it can buy seats and invite staff, normally within one working day. We will e-mail {user.email} as soon as it is approved.</p>
            <ol className="pending__steps">
              <li className="is-done">Account created</li>
              <li className="is-done">E-mail verified</li>
              <li className="is-now">Company approval</li>
              <li>Buy seats and invite your team</li>
            </ol>
          </>
        )}
        <div className="lesson__actions">
          <Link href="/certifications" className="btn btn--ghost btn--sm">
            <span className="btn__label">Browse certifications</span>
          </Link>
          <form action={logout}>
            <button className="btn btn--ghost btn--sm">
              <span className="btn__label">Log out</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
