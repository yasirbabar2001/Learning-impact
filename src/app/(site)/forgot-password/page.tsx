import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm, ResetCodeForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ step?: string; email?: string }> }) {
  const { step, email } = await searchParams;
  const codeStep = step === "code" && email;
  return (
    <AuthShell
      title={codeStep ? "Enter your code" : "Forgot your password?"}
      subtitle={codeStep ? `If an account exists for ${email}, we have e-mailed it a 6-digit code. Enter it with your new password.` : "Enter your account e-mail and we will send you a 6-digit code."}
    >
      {codeStep ? <ResetCodeForm email={email.slice(0, 160)} /> : <ForgotForm />}
      <p className="auth__switch">
        {codeStep ? (
          <Link href="/forgot-password" className="inline-link">
            Send a new code
          </Link>
        ) : (
          <Link href="/login" className="inline-link">
            Back to log in
          </Link>
        )}
      </p>
    </AuthShell>
  );
}
