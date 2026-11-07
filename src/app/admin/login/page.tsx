import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="main" className="login">
      <div className="login__card glass">
        <Logo className="login__logo" />
        <h1>Owner sign-in</h1>
        <p className="muted">
          Administrators normally log in on the <a href="/login?type=admin" className="inline-link">main login page</a> and choose <b>Admin</b>. This
          page uses the server&apos;s owner password, for example to give the first account admin access.
        </p>
        {!adminConfigured() && <p className="form-alert">ADMIN_PASSWORD is not set on the server, so sign-in is disabled.</p>}
        <LoginForm />
      </div>
    </main>
  );
}
