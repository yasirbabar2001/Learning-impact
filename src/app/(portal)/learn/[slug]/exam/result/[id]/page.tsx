import Link from "next/link";
import { notFound } from "next/navigation";
import { Ring } from "@/components/portal/Ring";
import { Reveal } from "@/components/Reveal";
import { Success } from "@/components/forms/Success";
import { getCourse } from "@/lib/courses/catalog";
import { one } from "@/lib/db";
import { requireUser } from "@/lib/portal/auth";
import { attemptBreakdown, attemptsAllowed, attemptsOf, certificateFor, type Attempt } from "@/lib/portal/exam";
import { enrollmentFor } from "@/lib/portal/learning";

export default async function ExamResult({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const user = await requireUser(`/learn/${slug}/exam`);
  const course = getCourse(slug);
  const attempt = one<Attempt>("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?", id, user.id);
  if (!course || !attempt || !attempt.submitted_at) notFound();
  const passed = Boolean(attempt.passed);
  const cert = certificateFor(user.id, slug);
  const enrollment = enrollmentFor(user.id, slug);
  const left = attemptsAllowed(enrollment?.extra_attempts ?? 0) - attemptsOf(user.id, slug).filter((a) => a.submitted_at).length;
  const rows = attemptBreakdown(course, attempt);

  return (
    <div className="container boss" style={{ ["--c" as string]: course.quest.color }}>
      {passed && cert ? (
        <Success title="Final boss defeated! You are certified." referenceLabel="Certificate code" actions={[{ href: `/learn/${slug}`, label: "Quest map" }, { href: "/learn/certificates", label: "Get my certificate", primary: true }]} reference={cert.code} body={`You scored ${attempt.percent}% (${attempt.correct}/${attempt.total}). Your ${course.quest.badge.name} badge and certificate are ready.`} />
      ) : (
        <Reveal className="boss__card glass">
          <Ring percent={attempt.percent ?? 0} size={120} stroke={10} color={passed ? "#2ee59d" : "#ff4d6d"} />
          <h1 className="h2">{passed ? "Passed!" : "Not this time."}</h1>
          <p className="muted">
            You scored {attempt.percent}% ({attempt.correct}/{attempt.total}). The pass mark is {course.exam.passMark}%.
            {!passed && (left > 0 ? ` You have ${left} attempt(s) left, each with a new set of questions.` : " You have used all your attempts; contact us to request another.")}
          </p>
        </Reveal>
      )}
      <Reveal delay={0.15} className="glass boss__breakdown">
        <h2 className="h3">How you did, stage by stage</h2>
        <ul>
          {rows.map((r) => {
            const pct = Math.round((r.correct / r.total) * 100);
            return (
              <li key={r.session.id}>
                <span>{r.session.stage}</span>
                <span className="boss__meter">
                  <span style={{ width: `${pct}%`, background: pct >= course.exam.passMark ? "#2ee59d" : pct >= 50 ? "#ffd23f" : "#ff4d6d" }} />
                </span>
                <span className="muted">
                  {r.correct}/{r.total}
                </span>
                {pct < course.exam.passMark && (
                  <Link href={`/learn/${slug}/${r.session.id}`} className="inline-link">
                    Revise
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="lesson__actions">
          {cert ? (
            <Link href="/learn/certificates" className="btn btn--primary">
              <span className="btn__label">My certificates</span>
              <span className="btn__arrow">→</span>
            </Link>
          ) : (
            <Link href={`/learn/${slug}/exam`} className="btn btn--primary">
              <span className="btn__label">Back to the exam</span>
              <span className="btn__arrow">→</span>
            </Link>
          )}
          <Link href={`/learn/${slug}`} className="btn btn--ghost">
            <span className="btn__label">Quest map</span>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
