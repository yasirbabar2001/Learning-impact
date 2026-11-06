import { NextResponse, type NextRequest } from "next/server";
import { checkSigned } from "@/lib/auth";
import { run } from "@/lib/db";

export const dynamic = "force-dynamic";

const page = (title: string, body: string) =>
  new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:system-ui,sans-serif;background:#050507;color:#f6f6f8;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px"><div style="max-width:440px;text-align:center"><h1 style="font-size:24px">${title}</h1><p style="color:#aaa">${body}</p><p><a style="color:#ffd23f" href="/learn">Back to my dashboard</a></p></div></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

/** One-click opt-out from reminder e-mails (signed link from the e-mail footer). */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  if (!u || !checkSigned("unsubscribe", u, t)) return page("Link not valid", "This unsubscribe link is incomplete or has been changed.");
  run("UPDATE users SET reminders = 0 WHERE id = ?", u);
  return page("You're unsubscribed", "You will no longer get streak and reminder e-mails. Account e-mails such as codes and receipts still arrive. You can switch reminders back on in your profile.");
}
