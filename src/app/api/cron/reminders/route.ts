import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendReminders } from "@/lib/portal/reminders";

export const dynamic = "force-dynamic";

/**
 * Daily reminder e-mails. Call from a cPanel cron job once a day (about 6 pm Pakistan time):
 *   curl -s "https://learningimpact.pk/api/cron/reminders?key=YOUR_CRON_SECRET"
 * Disabled unless CRON_SECRET is set.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-cron-key") ?? "";
  if (!secret || key.length !== secret.length || !timingSafeEqual(Buffer.from(key), Buffer.from(secret))) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(await sendReminders());
}

export const GET = handle;
export const POST = handle;
