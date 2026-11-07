import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { now, run } from "@/lib/db";

export const dynamic = "force-dynamic";

const COOKIE = "li_vid";
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|bingpreview|curl|wget|python|monitor/i;

/**
 * Counts a page view for the admin visitor charts. Anonymous: a random visitor id in a first-party cookie,
 * the page path and the referring site. No names, IP addresses or third-party trackers.
 */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { path?: unknown; ref?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path.slice(0, 200) : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
  let ref = "";
  try {
    const host = typeof body?.ref === "string" && body.ref ? new URL(body.ref).host : "";
    if (host && host !== req.headers.get("host")) ref = host.slice(0, 120);
  } catch {
    /* not a URL */
  }
  let visitor = req.cookies.get(COOKIE)?.value ?? "";
  const fresh = !/^[A-Za-z0-9_-]{16,40}$/.test(visitor);
  if (fresh) visitor = randomBytes(16).toString("base64url");
  run("INSERT INTO visits (visitor, path, referrer, created_at) VALUES (?, ?, ?, ?)", visitor, path, ref, now());
  const res = new NextResponse(null, { status: 204 });
  if (fresh) res.cookies.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 365 * 864e2, path: "/" });
  return res;
}
