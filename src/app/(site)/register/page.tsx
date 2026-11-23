import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";
import { cookies } from "next/headers";
import { currentUser, homeFor } from "@/lib/portal/auth";
import { REF_COOKIE, REFERRAL_XP, referrerByCode } from "@/lib/portal/referrals";

export const metadata: Metadata = { title: "Create your account", description: "Create a Learning Impact account as an individual learner or as a company buying certifications for its team." };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string; type?: string; ref?: string; chat?: string }> }) {
  const { next, email, type, ref, chat } = await searchParams;
  const user = await currentUser();
  if (user) redirect(user.email_verified_at ? homeFor(user, next) : "/verify-email");
  const referrer = referrerByCode(ref || (await cookies()).get(REF_COOKIE)?.value);
  const q = next ? `?next=${encodeURIComponent(next)}${chat ? "&chat=1" : ""}` : chat ? "?chat=1" : "";
  return (
    <AuthShell title="Create your account" subtitle="Individuals start learning right after verifying their e-mail. Companies are activated once we approve the company profile.">
      {chat && (
        <p className="form-alert livechat-note" role="status">
          💬 <strong>Sign up first in order to avail this service.</strong> Live chat on WhatsApp is available to signed-in members. Already have an
          account? Log in below.
        </p>
      )}
      {referrer && (
        <p className="auth__invite">
          🎁 <strong>{referrer.name.split(" ")[0]}</strong> invited you. Verify your e-mail and you both earn XP: {REFERRAL_XP.welcome} XP welcome bonus for you!
        </p>
      )}
      <RegisterForm next={next} refCode={ref?.slice(0, 12)} email={email?.slice(0, 160)} initialType={type === "company" ? "company" : "individual"} />
      <p className="auth__switch">
        Already have an account?{" "}
        <Link href={`/login${q}`} className="inline-link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
