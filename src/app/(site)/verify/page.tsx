import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Verify a certificate", description: "Check that a Learning Impact certificate is genuine.", alternates: { canonical: "/verify" } };

async function lookup(fd: FormData) {
  "use server";
  const code = String(fd.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (code) redirect(`/verify/${encodeURIComponent(code)}`);
}

export default function VerifyIndex() {
  return (
    <>
      <PageHero eyebrow="Certificate verification" title="Is this certificate" highlight="genuine?">
        <p>Enter the code printed on the certificate (for example LI-ABCD-EFGH), or scan its QR code.</p>
      </PageHero>
      <section className="container section section--tight">
        <form action={lookup} className="verify-form glass">
          <label className="field">
            <input name="code" placeholder=" " required maxLength={20} autoComplete="off" />
            <span className="field__label">Certificate code</span>
            <span className="field__glow" aria-hidden="true" />
          </label>
          <button className="btn btn--primary">
            <span className="btn__label">Verify</span>
            <span className="btn__arrow">→</span>
          </button>
        </form>
      </section>
    </>
  );
}
