import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { beginExam } from "@/lib/actions/learning";
import { getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { attemptsAllowed, attemptsOf, certificateFor, closeExpired, openAttempt } from "@/lib/portal/exam";
import { courseProgress, enrollmentFor, progressMap } from "@/lib/portal/learning";

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}/exam`);
  const course = getCourse(slug);
  if (!course) notFound();
  const enrollment = enrollmentFor(user.id, slug);
  if (!enrollment) redirect(`/certifications/${slug}`);
  closeExpired(user.id, course, user.name);
  const p = courseProgress(course, progressMap(user.id, slug));
  const cert = certificateFor(user.id, slug);
  const done = attemptsOf(user.id, slug).filter((a) => a.submitted_at);
  const allowed = attemptsAllowed(enrollment.extra_attempts);
  const left = allowed - done.length;
  const open = openAttempt(user.id, slug);
  const { exam } = course;

  return (
    <div className="container boss" style={{ ["--c" as string]: course.quest.color }}>
      <Reveal className="boss__card glass">
        <Link href={`/learn/${slug}`} className="link-arrow">
          <span>←</span> Quest map
        </Link>
        <span className="boss__icon" aria-hidden="true">
          {cert ? "🏆" : "🐉"}
        </span>
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Final boss · {course.title}
        </p>
        <h1 className="h2">{cert ? "You defeated the final boss!" : "The certification exam"}</h1>

        {cert ? (
          <>
            <p className="muted">
              Certified with {cert.percent}%. Your certificate code is <strong>{cert.code}</strong>.
            </p>
            <Link href="/learn/certificates" className="btn btn--primary">
              <span className="btn__label">Get my certificate</span>
              <span className="btn__arrow">→</span>
            </Link>
          </>
        ) : !p.examUnlocked ? (
          <p className="muted">Clear all {course.sessions.length} stages to unlock the final exam. You have cleared {p.passed} so far.</p>
        ) : (
          <>
            <ul className="boss__rules">
              <li>
                <strong>{exam.questionsPerAttempt}</strong> questions drawn at random from {exam.bank.length}
              </li>
              <li>
                <strong>{exam.minutes} minutes</strong>, the timer keeps running if you leave
              </li>
              <li>
                Pass mark <strong>{exam.passMark}%</strong>
              </li>
              <li>
                <strong>{left > 0 ? left : 0}</strong> of {allowed} attempts left
              </li>
            </ul>
            {done.length > 0 && (
              <p className="muted">
                Previous attempts:{" "}
                {done.map((a, k) => (
                  <Link key={a.id} href={`/learn/${slug}/exam/result/${a.id}`} className="inline-link boss__prev">
                    #{done.length - k}: {a.percent}%
                  </Link>
                ))}
              </p>
            )}
            {open ? (
              <form action={beginExam}>
                <input type="hidden" name="slug" value={slug} />
                <button className="btn btn--primary">
                  <span className="btn__label">Resume my exam</span>
                  <span className="btn__arrow">→</span>
                </button>
              </form>
            ) : left > 0 ? (
              <form action={beginExam} className="boss__start">
                <input type="hidden" name="slug" value={slug} />
                <label className="check-row">
                  <input type="checkbox" required />
                  <span>I will take this exam on my own, without help, notes from others or shared answers.</span>
                </label>
                <button className="btn btn--primary">
                  <span className="btn__label">Start the exam now</span>
                  <span className="btn__arrow">→</span>
                </button>
              </form>
            ) : (
              <p className="form-alert">You have used all your attempts. Contact us to request another attempt after revising the stages.</p>
            )}
          </>
        )}
      </Reveal>
    </div>
  );
}
