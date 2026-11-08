import { notFound, redirect } from "next/navigation";
import { LessonPlayer, type PublicCard } from "@/components/portal/LessonPlayer";
import { catalogEntry, formatPkr, getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { unlockOffer } from "@/lib/portal/commerce";
import { accessFor, QUIZ_PASS, stagesFor } from "@/lib/portal/learning";
import { SITE_URL } from "@/lib/site";

export default async function StagePage({ params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const user = await requireUser(`/learn/${slug}/${sid}`);
  const course = getCourse(slug);
  if (!course) notFound();
  const access = accessFor(user, slug);
  if (!access) redirect(`/certifications/${slug}`);
  const all = stagesFor(course, user.id, access.mode);
  const idx = all.findIndex((s) => s.session.id === sid);
  if (idx < 0) notFound();
  const st = all[idx];
  if (st.status === "locked") redirect(st.paywall ? `/checkout/${slug}` : `/learn/${slug}`);
  const s = st.session;

  // Knowledge checks are practice (not graded), so their answers travel with the card for instant feedback.
  const cards: PublicCard[] = s.cards;
  const next = course.sessions[idx + 1];
  const nextLocked = access.mode === "trial" && Boolean(next && all[idx + 1]?.paywall);
  const price = catalogEntry(slug)?.pricePkr ?? 0;
  const offer = nextLocked ? unlockOffer(user.id, slug, price) : null;

  return (
    <div className="container" style={{ ["--c" as string]: course.quest.color }}>
      <LessonPlayer
        slug={slug}
        sid={sid}
        courseTitle={course.title}
        cast={course.quest.cast}
        xp={user.xp}
        shareUrl={`${SITE_URL}/certifications/${slug}`}
        stageLabel={`Stage ${idx + 1} of ${course.sessions.length}`}
        stage={s.stage}
        title={s.title}
        objectives={s.objectives}
        cards={cards}
        startAt={st.progress?.lesson_done_at ? 0 : (st.progress?.cards_seen ?? 0)}
        lessonDone={Boolean(st.progress?.lesson_done_at)}
        quiz={{ passed: Boolean(st.progress?.quiz_passed_at), best: st.progress?.quiz_best ?? 0, attempts: st.progress?.quiz_attempts ?? 0, pass: QUIZ_PASS }}
        nextHref={next && !nextLocked ? `/learn/${slug}/${next.id}` : null}
        examHref={next || access.mode === "trial" ? null : `/learn/${slug}/exam`}
        mapHref={`/learn/${slug}`}
        mode={access.mode}
        unlock={
          nextLocked && offer
            ? {
                href: `/checkout/${slug}`,
                price: formatPkr(offer.full),
                stages: offer.remainingStages,
                stagePrice: offer.next && offer.remainingStages > 1 ? formatPkr(offer.next.price) : null,
                stageNumber: offer.next?.number,
              }
            : null
        }
        paidStage={access.mode === "trial" && idx > 0}
      />
    </div>
  );
}
