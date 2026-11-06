import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { logout } from "@/lib/actions/account";
import { currentUser, homeFor } from "@/lib/portal/auth";
import { mailConfigured } from "@/lib/portal/mail";
import { resendWait } from "@/lib/portal/otp";

export const metadata: Metadata = { title: "Verify your e-mail", robots: { index: false } };
export const dynamic = "force-dynamic";

const mask = (email: string) => {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.email_verified_at) redirect(homeFor(user, next));
  return (
    <AuthShell title="Check your e-mail" subtitle={`We sent a 6-digit code to ${mask(user.email)}. Enter it below to verify your account. Check your spam folder too.`}>
      {!mailConfigured() && (
        <p className="form-alert">Our e-mail service is being set up. If no code arrives, contact info@learningimpact.pk or +92 334 9990778 and we will verify your account.</p>
      )}
      <VerifyForm next={next} waitSeconds={resendWait(user.id, "verify")} />
      <form action={logout} className="auth__switch">
        Wrong e-mail address? <button className="inline-link">Log out and sign up again</button>
      </form>
    </AuthShell>
  );
}
