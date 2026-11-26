import type { Metadata } from "next";
import Link from "next/link";
import { FreeVsPremium } from "@/components/portal/FreeVsPremium";
import { notFound } from "next/navigation";
import { CourseCover } from "@/components/CourseCover";
import { RegulatoryBasis } from "@/components/portal/RegulatoryBasis";
import { Takeaways } from "@/components/Takeaways";
import { Reveal } from "@/components/Reveal";
import { SplitWords } from "@/components/Text";
import { catalogEntry, courseMinutes } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { priceIn, viewerCurrency } from "@/lib/portal/currency";
import { currentUser, hasAdminAccess, isTeamMember } from "@/lib/portal/auth";
import { enrollmentFor, progressMap, QUIZ_PASS } from "@/lib/portal/learning";
import { flagSvg } from "@/lib/regulatory/flags";
import { freeStagesOf, isFreePremium } from "@/lib/portal/completion";
import { coverUrl } from "@/lib/portal/covers";

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
  const currency = await viewerCurrency(user);
  const price = priceIn(e, currency);
  const enrolled = user ? enrollmentFor(user.id, slug) : null;
  const team = isTeamMember(user);
  const flag = e.jurisdiction ? flagSvg(e.jurisdiction) : null;
  // Free & Premium courses: the Basic level is free (with a Certificate of Completion); Premium unlocks the rest.
  const fp = isFreePremium(e.course);
  const freeCount = e.course ? freeStagesOf(e.course) : 1;
  const image = coverUrl(slug);
  const admin = hasAdminAccess(user);
  const firstStage = e.course ? `/learn/${slug}/${e.course.sessions[0].id}` : `/learn/${slug}`;
  const started = user && e.course && !enrolled ? progressMap(user.id, slug).get(e.course.sessions[0].id) : undefined;
  const startHref = user ? firstStage : `/register?next=${encodeURIComponent(firstStage)}`;
  const c = e.course;

  if (!c || !e.available) {
    return (
      <section className="container section cert-soon" style={{ ["--c" as string]: e.color }}>
        <CourseCover slug={slug} color={e.color} flag={flag} label={`${e.title} cover`} className="cover--hero cover--soon" image={image} priority />
        <p className="eyebrow">
          <span className="eyebrow__dot" /> {e.category} · coming soon
        </p>
        <h1 className="display">
          <SplitWords text={e.title} delay={0.3} />
        </h1>
        <Takeaways items={c?.takeaways} />
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
          <CourseCover slug={slug} color={c.quest.color} flag={flag} label={`${c.title} cover`} className="cover--hero cover--mobile" image={image} priority />
          <p className="eyebrow">
            <span className="eyebrow__dot" /> {c.category} · {c.level} certification
          </p>
          <h1 className={`display ${c.title.length > 38 ? "cert__title--long" : ""}`}>
            <SplitWords text={c.title} delay={0.3} />
          </h1>
          <Takeaways items={c.takeaways} />
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
          <CourseCover slug={slug} color={c.quest.color} flag={flag} label={`${c.title} cover`} className="cover--side" image={image} priority />
          <span className="cert__badge" aria-hidden="true">
            🏅
          </span>
          <p className="cert__badge-name">Badge: {c.quest.badge.name}</p>
          {fp ? (
            <>
              <p className="cert__price">Free</p>
              <p className="muted cert__price-note">
                Basic level ({freeCount} stages) free, with a Certificate of Completion
                <br />
                ⭐ Premium {formatMoney(price, currency)}: Advanced stages, final exam and verified certificate
              </p>
            </>
          ) : (
            <>
              <p className="cert__price">{formatMoney(price, currency)}</p>
              <p className="muted cert__price-note">
                One learner · lifetime access to the material · certificate included
                {c.sessions.length > 1 && (
                  <>
                    <br />
                    or pay as you go: {formatMoney(Math.round(price / (c.sessions.length - 1)), currency)} per stage after the free one
                  </>
                )}
              </p>
            </>
          )}
          {enrolled || team ? (
            <Link href={`/learn/${slug}`} className="btn btn--primary cert__cta">
              <span className="btn__label">{enrolled ? "Continue my quest" : "⭐ Start: free for the Learning Impact Team"}</span>
              <span className="btn__arrow">→</span>
            </Link>
          ) : (
            <>
              <Link href={started?.quiz_passed_at ? `/learn/${slug}` : startHref} className="btn btn--primary cert__cta cert__free">
                <span className="btn__label">{started?.quiz_passed_at ? "See my progress" : started ? "Continue my free stage" : "🎁 Start for free"}</span>
                <span className="btn__arrow">→</span>
              </Link>
              <p className="cert__free-note">
                {fp
                  ? `Stages 1 to ${freeCount} are free, with a Certificate of Completion. Upgrade to Premium any time for the Advanced level.`
                  : "Stage 1 is free, no payment needed. Then unlock the whole quest, or one stage at a time."}
              </p>
              <Link href={`/checkout/${slug}`} className={`btn ${fp ? "btn--primary cert__premium" : "btn--ghost"} cert__cta`}>
                <span className="btn__label">{fp ? `⭐ Upgrade to Premium · ${formatMoney(price, currency)}` : `Enrol now · ${formatMoney(price, currency)}`}</span>
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

      {fp && (
        <section className="container section section--tight" id="free-vs-premium">
          <Reveal>
            <FreeVsPremium
              freeCount={freeCount}
              total={c.sessions.length}
              price={formatMoney(price, currency)}
              examQuestions={c.exam.questionsPerAttempt}
              upgradeHref={enrolled ? null : `/checkout/${slug}`}
            />
          </Reveal>
        </section>
      )}

      <RegulatoryBasis course={c} />

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
                  <span className="stage-row__stage">
                    {s.stage}
                    {fp && (i < freeCount ? <span className="stage-tag stage-tag--free">🎁 Free</span> : <span className="stage-tag stage-tag--premium">⭐ Premium</span>)}
                  </span>
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
                <span className="stage-row__stage">
                  Final boss
                  {fp && <span className="stage-tag stage-tag--premium">⭐ Premium</span>}
                </span>
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
