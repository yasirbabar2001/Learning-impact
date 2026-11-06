import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { currentUser, safeNext } from "@/lib/portal/auth";

export const metadata: Metadata = { title: "Create your account", description: "Create a free Learning Impact learner account to start professional certification quests." };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  if (await currentUser()) redirect(safeNext(next));
  return (
    <AuthShell title="Start your quest" subtitle="Free account. Pay only for the certifications you take.">
      <RegisterForm next={next} email={email?.slice(0, 160)} />
      <p className="auth__switch">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="inline-link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
