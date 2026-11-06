import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your account e-mail and we will send you a link to choose a new one.">
      <ForgotForm />
      <p className="auth__switch">
        <Link href="/login" className="inline-link">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
