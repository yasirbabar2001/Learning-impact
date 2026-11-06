import { notFound, redirect } from "next/navigation";
import { LessonPlayer, type PublicCard } from "@/components/portal/LessonPlayer";
import { getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { courseProgress, enrollmentFor, progressMap, QUIZ_PASS } from "@/lib/portal/learning";

export default async function StagePage({ params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const user = await requireUser(`/learn/${slug}/${sid}`);
  const course = getCourse(slug);
  if (!course) notFound();
  if (!enrollmentFor(user.id, slug)) redirect(`/certifications/${slug}`);
  const p = courseProgress(course, progressMap(user.id, slug));
  const idx = p.stages.findIndex((s) => s.session.id === sid);
  if (idx < 0) notFound();
  const st = p.stages[idx];
  if (st.status === "locked") redirect(`/learn/${slug}`);
  const s = st.session;

  // Strip answers from knowledge checks before they reach the browser.
  const cards: PublicCard[] = s.cards.map((c) => (c.type === "check" ? { type: "check", question: c.question, options: c.options } : c));
  const next = course.sessions[idx + 1];

  return (
    <div className="container" style={{ ["--c" as string]: course.quest.color }}>
      <LessonPlayer
        slug={slug}
        sid={sid}
        stageLabel={`Stage ${idx + 1} of ${course.sessions.length}`}
        stage={s.stage}
        title={s.title}
        objectives={s.objectives}
        cards={cards}
        startAt={st.progress?.lesson_done_at ? 0 : (st.progress?.cards_seen ?? 0)}
        lessonDone={Boolean(st.progress?.lesson_done_at)}
        quiz={{ passed: Boolean(st.progress?.quiz_passed_at), best: st.progress?.quiz_best ?? 0, attempts: st.progress?.quiz_attempts ?? 0, pass: QUIZ_PASS }}
        nextHref={next ? `/learn/${slug}/${next.id}` : null}
        examHref={next ? null : `/learn/${slug}/exam`}
        mapHref={`/learn/${slug}`}
      />
    </div>
  );
}
