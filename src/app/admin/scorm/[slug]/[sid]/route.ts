import { isAdmin } from "@/lib/auth";
import { getCourse } from "@/lib/courses/catalog";
import { QUIZ_PASS } from "@/lib/portal/learning";
import { scormZip } from "@/lib/scorm/package";

export const dynamic = "force-dynamic";

/** SCORM 1.2 zip of a session test, for a corporate client's own LMS. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string; sid: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { slug, sid } = await params;
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  if (!course || !session) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(scormZip(course, session, QUIZ_PASS)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${course.slug}-${session.id}-scorm12.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
