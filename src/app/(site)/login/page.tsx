import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { currentUser, homeFor, safeNext } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; type?: string }> }) {
  const { next, type } = await searchParams;
  const user = await currentUser();
  if (user) redirect(!user.email_verified_at ? "/verify-email" : type === "admin" && user.is_admin ? safeNext(next, "/admin") : homeFor(user, next));
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell title="Welcome back" subtitle="One login for everyone: learners, companies and administrators.">
      <LoginForm next={next} initialType={type === "company" ? "company" : type === "admin" ? "admin" : "individual"} />
      <p className="auth__switch">
        New to Learning Impact?{" "}
        <Link href={`/register${q}`} className="inline-link">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
