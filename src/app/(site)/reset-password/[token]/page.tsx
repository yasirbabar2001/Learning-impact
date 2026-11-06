import type { Metadata } from "next";
import { ResetForm } from "@/components/portal/AuthForms";
import { AuthShell } from "@/components/portal/AuthShell";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Choose a new password" subtitle="You will be logged in straight after.">
      <ResetForm token={token} />
    </AuthShell>
  );
}
