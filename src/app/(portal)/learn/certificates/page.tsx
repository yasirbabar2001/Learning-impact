import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { certificatesOf } from "@/lib/portal/exam";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "My certificates" };

export default async function CertificatesPage() {
  const user = await requireUser("/learn/certificates");
  const certs = certificatesOf(user.id);
  return (
    <div className="container dash">
      <Reveal>
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Trophy room
        </p>
        <h1 className="h2">My certificates</h1>
      </Reveal>
      {certs.length === 0 ? (
        <div className="empty glass">
          <h3>No certificates yet</h3>
          <p className="muted">Clear every stage of a quest and pass the final exam to earn your first certificate.</p>
          <Link href="/learn" className="btn btn--primary">
            <span className="btn__label">Back to my quests</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      ) : (
        <div className="trophies">
          {certs.map((c, i) => {
            const course = getCourse(c.course_slug);
            const issued = new Date(c.issued_at);
            const verifyUrl = `${SITE_URL}/verify/${c.code}`;
            const linkedin = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(course?.title ?? "")}&organizationName=${encodeURIComponent("Learning Impact")}&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(c.code)}`;
            return (
              <Reveal key={c.id} delay={i * 0.08}>
                <article className="trophy glass spot" style={{ ["--c" as string]: course?.quest.color ?? "#ffd23f" }}>
                  <span className="trophy__icon">🏆</span>
                  <div>
                    <h2>{course?.title}</h2>
                    <p className="muted">
                      {issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · score {c.percent}% · code <strong>{c.code}</strong>
                    </p>
                    <div className="lesson__actions">
                      <a href={`/api/certificates/${c.code}`} target="_blank" rel="noopener" className="btn btn--primary btn--sm">
                        <span className="btn__label">Download PDF</span>
                        <span className="btn__arrow">↓</span>
                      </a>
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                        <span className="btn__label">Add to LinkedIn</span>
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`I just earned my ${course?.title ?? ""} certification on Learning Impact! 🏆 Verify it here: ${verifyUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-btn share-btn--wa"
                      >
                        Share on WhatsApp
                      </a>
                      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`} target="_blank" rel="noopener noreferrer" className="share-btn share-btn--li">
                        Post on LinkedIn
                      </a>
                      <Link href={`/verify/${c.code}`} className="btn btn--ghost btn--sm">
                        <span className="btn__label">Public verification page</span>
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
