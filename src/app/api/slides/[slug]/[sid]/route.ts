import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { accessFor, stageOf } from "@/lib/portal/learning";
import { stageSlidesPdf } from "@/lib/slides/pdf";

export const dynamic = "force-dynamic";

/** Downloads a stage's presentation as PDF, for anyone who may open that stage (free stage, enrolled, admin preview). */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const user = await currentUser();
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  const access = user && course && session ? accessFor(user, slug) : null;
  if (!user || !course || !session || !access) return new Response("Not found", { status: 404 });
  const stage = stageOf(course, user.id, sid, access.mode);
  if (!stage || stage.status === "locked") return new Response("This stage is locked.", { status: 403 });
  const pdf = await stageSlidesPdf(course, session);
  const n = course.sessions.indexOf(session) + 1;
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-stage-${n}-slides.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
