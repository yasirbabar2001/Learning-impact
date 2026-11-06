import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, referrerByCode } from "@/lib/portal/referrals";

export const dynamic = "force-dynamic";

/** Invite links: learningimpact.pk/r/CODE remembers who shared it, then opens the catalogue. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = referrerByCode(code);
  const res = NextResponse.redirect(new URL(referrer ? "/certifications?invited=1" : "/certifications", `${req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")}://${req.headers.get("host") ?? req.nextUrl.host}`));
  if (referrer) res.cookies.set(REF_COOKIE, code.toUpperCase(), { maxAge: 30 * 864e2, httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
