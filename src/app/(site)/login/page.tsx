import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { currentUser, safeNext } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await currentUser()) redirect(safeNext(next));
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your certification quests.">
      <LoginForm next={next} />
      <p className="auth__switch">
        New to Learning Impact?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="inline-link">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
