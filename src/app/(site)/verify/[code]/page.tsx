import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getCourse } from "@/lib/courses/catalog";
import { certificateByCode } from "@/lib/portal/exam";

export const metadata: Metadata = { title: "Certificate verification", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = certificateByCode(decodeURIComponent(code).toUpperCase());
  const course = cert ? getCourse(cert.course_slug) : null;
  const valid = cert && !cert.revoked_at;
  return (
    <section className="container section verify">
      <Reveal className={`verify__card glass ${valid ? "is-valid" : "is-invalid"}`}>
        <span className="verify__icon">{valid ? "✓" : "✕"}</span>
        {valid && cert ? (
          <>
            <p className="eyebrow">Verified certificate</p>
            <h1 className="h3">{cert.holder_name}</h1>
            <p className="muted">has earned the Learning Impact professional certification</p>
            <p className="verify__course" style={{ color: course?.quest.color }}>
              {course?.title ?? cert.course_slug}
            </p>
            <dl className="verify__facts">
              <div>
                <dt>Issued</dt>
                <dd>{new Date(cert.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              </div>
              <div>
                <dt>Final exam score</dt>
                <dd>{cert.percent}%</dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd>{cert.code}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="eyebrow">Not verified</p>
            <h1 className="h3">{cert?.revoked_at ? "This certificate has been revoked." : "No certificate matches this code."}</h1>
            <p className="muted">Check the code on the certificate and try again. Codes look like LI-ABCD-EFGH.</p>
          </>
        )}
        <Link href="/verify" className="inline-link">
          Verify another certificate
        </Link>
      </Reveal>
    </section>
  );
}
