import "server-only";
import { REQUEST_TYPE_LABELS, FORMAT_LABELS, type TrainingRequest } from "./types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Optional e-mail alert to the team via Resend. Failures are logged, never shown to visitors. */
export async function notifyNewRequest(r: TrainingRequest) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!key || !to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learningimpact.pk";
  const rows: [string, string | null | undefined][] = [
    ["Reference", r.reference],
    ["Type", REQUEST_TYPE_LABELS[r.type]],
    ["Program", r.programTitle],
    ["Company", r.company],
    ["Contact", r.contactName],
    ["E-mail", r.email],
    ["Phone", r.phone],
    ["City", r.city],
    ["Participants", r.participants?.toString()],
    ["Format", r.format ? FORMAT_LABELS[r.format] : null],
    ["Preferred date", r.preferredDate],
    ...Object.entries(r.details),
    ["Message", r.message],
  ];
  const html = `<h2>New ${esc(REQUEST_TYPE_LABELS[r.type].toLowerCase())}</h2><table cellpadding="6">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table><p><a href="${site}/admin">Open the admin panel</a></p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_EMAIL_FROM || "Learning Impact <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        reply_to: r.email,
        subject: `[${r.reference}] ${REQUEST_TYPE_LABELS[r.type]} from ${r.company}`,
        html,
      }),
    });
    if (!res.ok) console.error("Resend notification failed", res.status, await res.text());
  } catch (err) {
    console.error("Resend notification failed", err);
  }
}
