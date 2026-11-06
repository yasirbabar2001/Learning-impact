import { notFound, redirect } from "next/navigation";
import { ExamRunner } from "@/components/portal/ExamRunner";
import { getCourse } from "@/lib/courses/catalog";
import { requireUser } from "@/lib/portal/auth";
import { attemptPaper, closeExpired, openAttempt } from "@/lib/portal/exam";

export default async function SitExam({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}/exam`);
  const course = getCourse(slug);
  if (!course) notFound();
  closeExpired(user.id, course, user.name);
  const attempt = openAttempt(user.id, slug);
  if (!attempt) redirect(`/learn/${slug}/exam`);
  return (
    <div className="container" style={{ ["--c" as string]: course.quest.color }}>
      <ExamRunner slug={slug} title={course.title} questions={attemptPaper(course, attempt)} deadline={attempt.deadline_at} initialAnswers={JSON.parse(attempt.answers)} />
    </div>
  );
}
