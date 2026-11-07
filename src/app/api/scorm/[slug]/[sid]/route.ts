import { revalidatePath } from "next/cache";
import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { accessFor, gradeQuiz, stageOf } from "@/lib/portal/learning";

export const dynamic = "force-dynamic";

/**
 * SCORM commit from the portal's runtime. The browser sends the learner's choices (cmi.interactions
 * student_response); the score is recalculated here against the course content.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const user = await currentUser();
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  const access = user && course && session ? accessFor(user, slug) : null;
  if (!user || !course || !session || !access) return Response.json({ error: "not-allowed" }, { status: 403 });
  const stage = stageOf(course, user.id, sid, access.mode);
  const preview = access.mode === "preview";
  if (!stage || stage.status === "locked" || (stage.status === "open" && !preview)) return Response.json({ error: "lesson-first" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { responses?: unknown } | null;
  const raw = Array.isArray(body?.responses) ? body.responses : [];
  if (raw.length !== session.quiz.length) return Response.json({ error: "incomplete" }, { status: 400 });
  const responses = raw.map((r) => (Number.isInteger(r) && (r as number) >= 0 && (r as number) <= 3 ? (r as number) : null));
  // Admin preview: the result is saved so the place is remembered, but pays no XP.
  const result = gradeQuiz(user.id, course, session, responses, { rewards: !preview });
  revalidatePath(`/learn/${slug}`);
  return Response.json(result);
}
