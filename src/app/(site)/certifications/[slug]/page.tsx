import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { SplitWords } from "@/components/Text";
import { catalogEntry, courseMinutes, formatPkr } from "@/lib/courses/catalog";
import { currentUser, hasAdminAccess } from "@/lib/portal/auth";
import { enrollmentFor, progressMap, QUIZ_PASS } from "@/lib/portal/learning";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = catalogEntry(slug);
  if (!e) return {};
  return { title: `${e.title} Certification`, description: e.course?.tagline ?? e.tagline, alternates: { canonical: `/certifications/${slug}` } };
}

export default async function CertificationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = catalogEntry(slug);
  if (!e) notFound();
  const user = await currentUser();
  const enrolled = user ? enrollmentFor(user.id, slug) : null;
  const admin = hasAdminAccess(user);
  const firstStage = e.course ? `/learn/${slug}/${e.course.sessions[0].id}` : `/learn/${slug}`;
  const started = user && e.course && !enrolled ? progressMap(user.id, slug).get(e.course.sessions[0].id) : undefined;
  const startHref = user ? firstStage : `/register?next=${encodeURIComponent(firstStage)}`;
  const c = e.course;

  if (!c || !e.available) {
    return (
      <section className="container section cert-soon" style={{ ["--c" as string]: e.color }}>
        <p className="eyebrow">
          <span className="eyebrow__dot" /> {e.category} · coming soon
        </p>
        <h1 className="display">
          <SplitWords text={e.title} delay={0.3} />
        </h1>
        <p className="page-hero__lead">{e.tagline} This certification quest is being prepared. Companies can reserve seats for their teams now.</p>
        <div className="hero__ctas cert-soon__ctas">
          {admin && c && (
            <Link href={`/learn/${slug}`} className="btn btn--primary">
              <span className="btn__label">👁️ Preview as admin</span>
              <span className="btn__arrow">→</span>
            </Link>
          )}
          <Link href={`/contact`} className="btn btn--primary">
            <span className="btn__label">Notify me / reserve seats</span>
            <span className="btn__arrow">→</span>
          </Link>
          <Link href="/certifications" className="btn btn--ghost">
            <span className="btn__label">See available certifications</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      </section>
    );
  }

  const questions = c.sessions.length * 10;
  const hours = Math.round(courseMinutes(c) / 60);
  return (
    <div className="cert" style={{ ["--c" as string]: c.quest.color }}>
      <section className="container cert__hero">
        <div>
          <p className="eyebrow">
            <span className="eyebrow__dot" /> {c.category} · {c.level} certification
          </p>
          <h1 className="display">
            <SplitWords text={c.title} delay={0.3} />
          </h1>
          <p className="cert__tagline">{c.tagline}</p>
          <div className="cert__quest glass">
            <span className="cert__quest-label">⚔️ The quest: {c.quest.name}</span>
            <p>{c.quest.premise}</p>
          </div>
          <ul className="cert__stats">
            <li>
              <strong>{c.sessions.length}</strong> stages
            </li>
            <li>
              <strong>~{Math.max(hours, c.hours)}</strong> hours
            </li>
            <li>
              <strong>{questions}</strong> stage-test questions
            </li>
            <li>
              <strong>{c.exam.questionsPerAttempt}</strong>-question final exam
            </li>
            <li>
              <strong>{c.exam.passMark}%</strong> to pass
            </li>
          </ul>
        </div>
        <Reveal delay={0.4} className="cert__buy glass">
          <span className="cert__badge" aria-hidden="true">
            🏅
          </span>
          <p className="cert__badge-name">Badge: {c.quest.badge.name}</p>
          <p className="cert__price">{formatPkr(e.pricePkr)}</p>
          <p className="muted cert__price-note">One learner · lifetime access to the material · certificate included</p>
          {enrolled ? (
            <Link href={`/learn/${slug}`} className="btn btn--primary cert__cta">
              <span className="btn__label">Continue my quest</span>
              <span className="btn__arrow">→</span>
            </Link>
          ) : (
            <>
              <Link href={started?.quiz_passed_at ? `/learn/${slug}` : startHref} className="btn btn--primary cert__cta cert__free">
                <span className="btn__label">{started?.quiz_passed_at ? "See my progress" : started ? "Continue my free stage" : "🎁 Start for free"}</span>
                <span className="btn__arrow">→</span>
              </Link>
              <p className="cert__free-note">Stage 1 is free, no payment needed. Unlock the rest when you are ready.</p>
              <Link href={`/checkout/${slug}`} className="btn btn--ghost cert__cta">
                <span className="btn__label">Enrol now · {formatPkr(e.pricePkr)}</span>
                <span className="btn__arrow">→</span>
              </Link>
            </>
          )}
          <Link
            href={user ? `/checkout/${slug}?team=1` : `/login?type=company&next=${encodeURIComponent(`/checkout/${slug}?team=1`)}`}
            className="btn btn--ghost cert__cta"
          >
            <span className="btn__label">Buy seats for my team</span>
            <span className="btn__arrow">→</span>
          </Link>
          <p className="cert__pay muted">Pay by bank transfer, Easypaisa or JazzCash. Access within one working day.</p>
          {admin && (
            <Link href={`/learn/${slug}`} className="role-switch cert__preview">
              👁️ Preview as admin
            </Link>
          )}
        </Reveal>
      </section>

      <section className="container section section--tight cert__cols">
        <Reveal>
          <h2 className="h3">What you will be able to do</h2>
          <ul className="ticks">
            {c.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="h3">Who it is for</h2>
          <ul className="ticks">
            {c.audience.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="muted cert__sectors">Relevant for: {c.sectors.join(" · ")}</p>
        </Reveal>
      </section>

      <section className="container section section--tight">
        <Reveal>
          <p className="eyebrow">The quest map</p>
          <h2 className="h2">
            {c.sessions.length} stages to <span className="rainbow-text">certification.</span>
          </h2>
        </Reveal>
        <ol className="stage-list">
          {c.sessions.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06}>
              <li className="stage-row spot">
                <span className="stage-row__n">{i + 1}</span>
                <div>
                  <span className="stage-row__stage">{s.stage}</span>
                  <h3>{s.title}</h3>
                  <p className="muted">{s.summary}</p>
                  <span className="stage-row__meta">
                    {s.minutes} min · {s.cards.length} lesson cards · 10-question SCORM test (pass {QUIZ_PASS}/10)
                  </span>
                </div>
              </li>
            </Reveal>
          ))}
          <Reveal delay={0.3}>
            <li className="stage-row stage-row--boss spot">
              <span className="stage-row__n">🐉</span>
              <div>
                <span className="stage-row__stage">Final boss</span>
                <h3>Certification exam</h3>
                <p className="muted">
                  {c.exam.questionsPerAttempt} questions drawn at random from a bank of {c.exam.bank.length}, {c.exam.minutes} minutes, pass mark {c.exam.passMark}%. Up
                  to 3 attempts, each with a different paper.
                </p>
              </div>
            </li>
          </Reveal>
        </ol>
      </section>

      <section className="container section section--tight">
        <Reveal className="cert__description glass">
          <h2 className="h3">About this certification</h2>
          {c.description.split(/\n\n+/).map((p) => (
            <p key={p} className="muted">
              {p}
            </p>
          ))}
        </Reveal>
      </section>
    </div>
  );
}
