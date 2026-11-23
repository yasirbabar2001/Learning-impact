import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { currentUser, homeFor } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; type?: string; chat?: string }> }) {
  const { next, type, chat } = await searchParams;
  const user = await currentUser();
  if (user) redirect(!user.email_verified_at ? "/verify-email" : homeFor(user, next));
  const q = next ? `?next=${encodeURIComponent(next)}${chat ? "&chat=1" : ""}` : chat ? "?chat=1" : "";
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your certification quests or manage your team.">
      {chat && (
        <p className="form-alert livechat-note" role="status">
          💬 <strong>Log in first in order to use live chat.</strong> New here? Create a free account below.
        </p>
      )}
      <LoginForm next={next} initialType={type === "company" ? "company" : "individual"} />
      <p className="auth__switch">
        New to Learning Impact?{" "}
        <Link href={`/register${q}`} className="inline-link">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
