import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuestMap, type MapNode } from "@/components/portal/QuestMap";
import { Ring } from "@/components/portal/Ring";
import { Reveal } from "@/components/Reveal";
import { getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { attemptsAllowed, attemptsOf, certificateFor } from "@/lib/portal/exam";
import { courseProgress, enrollmentFor, progressMap, QUIZ_PASS } from "@/lib/portal/learning";

export default async function QuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}`);
  const course = getCourse(slug);
  if (!course) notFound();
  const enrollment = enrollmentFor(user.id, slug);
  if (!enrollment) redirect(`/certifications/${slug}`);
  const p = courseProgress(course, progressMap(user.id, slug));
  const cert = certificateFor(user.id, slug);
  const attempts = attemptsOf(user.id, slug).filter((a) => a.submitted_at);
  const best = attempts.reduce((m, a) => Math.max(m, a.percent ?? 0), 0);

  const nodes: MapNode[] = p.stages.map((s, i) => ({
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
            ? `${s.session.minutes} min · ${s.session.cards.length} cards`
            : "Clear the previous stage to unlock",
  }));
  nodes.push({
    key: "boss",
    href: p.examUnlocked ? `/learn/${slug}/exam` : null,
    n: "Final boss",
    stage: "Certification exam",
    title: `${course.exam.questionsPerAttempt} questions · ${course.exam.minutes} min · pass ${course.exam.passMark}%`,
    status: cert ? "boss-done" : p.examUnlocked ? "boss-open" : "boss-locked",
    note: cert
      ? `Certified with ${cert.percent}%`
      : p.examUnlocked
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
      <section className="container quest__map">
        <QuestMap nodes={nodes} />
      </section>
    </div>
  );
}
