import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { currentUser, homeFor } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Create your account", description: "Create a Learning Impact account as an individual learner or as a company buying certifications for its team." };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string; type?: string }> }) {
  const { next, email, type } = await searchParams;
  const user = await currentUser();
  if (user) redirect(user.email_verified_at ? homeFor(user, next) : "/verify-email");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell title="Create your account" subtitle="Individuals start learning right after verifying their e-mail. Companies are activated once we approve the company profile.">
      <RegisterForm next={next} email={email?.slice(0, 160)} initialType={type === "company" ? "company" : "individual"} />
      <p className="auth__switch">
        Already have an account?{" "}
        <Link href={`/login${q}`} className="inline-link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
