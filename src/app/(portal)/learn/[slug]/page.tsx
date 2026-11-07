import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuestMap, type MapNode } from "@/components/portal/QuestMap";
import { Ring } from "@/components/portal/Ring";
import { Reveal } from "@/components/Reveal";
import { catalogEntry, formatPkr, getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { attemptsAllowed, attemptsOf, certificateFor } from "@/lib/portal/exam";
import { accessFor, courseProgress, progressMap, QUIZ_PASS, stagesFor } from "@/lib/portal/learning";

export default async function QuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}`);
  const course = getCourse(slug);
  if (!course) notFound();
  const access = accessFor(user, slug);
  if (!access) redirect(`/certifications/${slug}`);
  const { mode, enrollment } = access;
  const p = courseProgress(course, progressMap(user.id, slug));
  const shown = stagesFor(course, user.id, mode);
  const price = formatPkr(catalogEntry(slug)?.pricePkr ?? 0);
  const freeDone = mode === "trial" && p.stages[0]?.status === "passed";
  const cert = certificateFor(user.id, slug);
  const attempts = attemptsOf(user.id, slug).filter((a) => a.submitted_at);
  const best = attempts.reduce((m, a) => Math.max(m, a.percent ?? 0), 0);

  const nodes: MapNode[] = shown.map((s, i) => ({
    key: s.session.id,
    href: s.status === "locked" ? null : `/learn/${slug}/${s.session.id}`,
    n: `Stage ${i + 1}`,
    stage: s.session.stage,
    title: s.session.title,
    status: s.status,
    note:
      s.status === "passed"
        ? `Cleared · best ${s.progress?.quiz_best}/10`
        : s.status === "lesson-done"
          ? `Lesson done · take the test (${QUIZ_PASS}/10 to pass)`
          : s.status === "open"
            ? `${mode === "trial" ? "Free · " : ""}${s.session.minutes} min · ${s.session.cards.length} cards`
            : s.paywall
              ? `🔒 Included in the full certification (${price})`
              : "Clear the previous stage to unlock",
  }));
  nodes.push({
    key: "boss",
    href: mode === "preview" || (mode === "full" && p.examUnlocked) ? `/learn/${slug}/exam` : null,
    n: "Final boss",
    stage: "Certification exam",
    title: `${course.exam.questionsPerAttempt} questions · ${course.exam.minutes} min · pass ${course.exam.passMark}%`,
    status: cert ? "boss-done" : mode === "preview" || (mode === "full" && p.examUnlocked) ? "boss-open" : "boss-locked",
    note: cert
      ? `Certified with ${cert.percent}%`
      : mode === "preview"
        ? "Preview the question bank"
        : mode === "trial"
          ? "🔒 Included in the full certification"
          : p.examUnlocked && enrollment
            ? `${attemptsAllowed(enrollment.extra_attempts) - attempts.length} attempt(s) left${attempts.length ? ` · best ${best}%` : ""}`
            : "Unlocks when every stage is cleared",
  });

  return (
    <div className="quest" style={{ ["--c" as string]: course.quest.color }}>
      <section className="container quest__head">
        <Reveal className="quest__intro">
          <Link href="/learn" className="link-arrow quest__back">
            <span>←</span> My quests
          </Link>
          <p className="eyebrow">
            <span className="eyebrow__dot" /> {course.title}
          </p>
          <h1 className="h2">⚔️ {course.quest.name}</h1>
          <p className="muted quest__premise">{course.quest.premise}</p>
        </Reveal>
        <Reveal delay={0.1} className="quest__progress glass">
          <Ring percent={cert ? 100 : p.percent} size={96} stroke={8} label={cert ? "🏆" : undefined} />
          <div>
            <strong>{cert ? "Quest complete" : `${p.passed} of ${p.total} stages cleared`}</strong>
            <p className="muted">
              Badge to win: <b>{course.quest.badge.name}</b>
            </p>
            {cert && (
              <Link href="/learn/certificates" className="inline-link">
                View certificate
              </Link>
            )}
          </div>
        </Reveal>
      </section>
      {mode === "preview" && (
        <section className="container">
          <p className="mode-banner mode-banner--preview">
            👁️ <strong>Admin preview.</strong> All stages are open so you can review the content. Nothing you do here is saved.
          </p>
        </section>
      )}
      {mode === "trial" && (
        <section className="container">
          <div className="unlock-banner glass">
            <span className="unlock-banner__icon" aria-hidden="true">
              {freeDone ? "🔓" : "🎁"}
            </span>
            <div>
              <strong>{freeDone ? "You cleared your free stage!" : "Stage 1 is free. Try it now."}</strong>
              <p className="muted">
                {freeDone
                  ? `Unlock the other ${course.sessions.length - 1} stages, the final exam and your verified certificate. Your progress is kept.`
                  : `No payment needed to start. When you are ready, unlock the full certification for ${price}.`}
              </p>
            </div>
            <Link href={`/checkout/${slug}`} className={`btn ${freeDone ? "btn--primary" : "btn--ghost"}`}>
              <span className="btn__label">Unlock full certification · {price}</span>
              <span className="btn__arrow">→</span>
            </Link>
          </div>
        </section>
      )}
      <section className="container quest__map">
        <QuestMap nodes={nodes} />
      </section>
    </div>
  );
}
