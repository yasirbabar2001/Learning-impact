import { isAdmin } from "@/lib/auth";
import { certificatePdf } from "@/lib/certificates/pdf";
import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { certificateByCode } from "@/lib/portal/exam";

export const dynamic = "force-dynamic";

/** Certificate PDF for its holder (or an admin). */
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = certificateByCode(code);
  const user = await currentUser();
  if (!cert || cert.revoked_at || (cert.user_id !== user?.id && !(await isAdmin()))) return new Response("Not found", { status: 404 });
  const course = getCourse(cert.course_slug);
  const pdf = await certificatePdf({
    code: cert.code,
    holder: cert.holder_name,
    course: course?.title ?? cert.course_slug,
    badge: course?.quest.badge.name ?? "",
    color: course?.quest.color ?? "#0d2c66",
    percent: cert.percent,
    issuedAt: cert.issued_at,
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Learning-Impact-${cert.code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
