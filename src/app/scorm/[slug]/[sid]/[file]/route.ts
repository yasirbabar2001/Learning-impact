import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { accessFor, QUIZ_PASS, stageOf } from "@/lib/portal/learning";
import { manifest, quizHtml } from "@/lib/scorm/package";

export const dynamic = "force-dynamic";

/** Serves a session's SCORM package files to an enrolled learner whose lesson for that stage is complete. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string; sid: string; file: string }> }) {
  const { slug, sid, file } = await params;
  const user = await currentUser();
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  const access = user && course && session ? accessFor(user, slug) : null;
  if (!user || !course || !session || !access) return new Response("Not found", { status: 404 });
  const stage = stageOf(course, user.id, sid, access.mode);
  const preview = access.mode === "preview";
  if (!stage || stage.status === "locked" || (stage.status === "open" && !preview)) return new Response("Finish the lesson first.", { status: 403 });
  const headers = { "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN" };
  if (file === "index.html") return new Response(quizHtml(course, session, QUIZ_PASS), { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  if (file === "imsmanifest.xml") return new Response(manifest(course, session), { headers: { ...headers, "Content-Type": "application/xml" } });
  return new Response("Not found", { status: 404 });
}
