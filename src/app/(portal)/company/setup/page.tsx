import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanySetupForm } from "@/components/portal/CompanySetupForm";
import { requireUser } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Set up a company account" };

export default async function CompanySetup() {
  const user = await requireUser("/company/setup");
  if (user.company_id && user.company_role === "manager") redirect("/company");
  return (
    <section className="container section checkout">
      <div className="glass checkout__card company-setup">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> For employers
        </p>
        <h1 className="h3">Set up your company account</h1>
        <p className="muted">Buy certification seats in bulk, invite employees by e-mail and follow their progress, scores and certificates in one dashboard.</p>
        {user.company_id ? (
          <p className="form-alert">Your account is a member of another company&apos;s team. Use a different account to manage your company.</p>
        ) : (
          <CompanySetupForm />
        )}
      </div>
    </section>
  );
}
