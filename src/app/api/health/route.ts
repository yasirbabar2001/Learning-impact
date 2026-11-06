export const dynamic = "force-dynamic";

/** Tiny endpoint for an "every 5 minutes" cron job that keeps the app awake on shared hosting. */
export function GET() {
  return new Response("ok", { headers: { "Cache-Control": "no-store" } });
}
