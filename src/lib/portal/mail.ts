import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { SITE_URL } from "../site";

/**
 * Sends portal e-mail through the hosting mailbox when SMTP is configured
 * (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM). Returns false if it is not configured,
 * so callers can fall back (e.g. show a reset link to the admin instead).
 */
export const mailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;

/**
 * Shared hosting often serves a mail certificate for the server's own name (e.g. server29.example.net),
 * not mail.yourdomain. Prefer SMTP_HOST = that server name; SMTP_ALLOW_INVALID_CERT=1 is a last resort.
 */
function getTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: process.env.SMTP_ALLOW_INVALID_CERT === "1" ? { rejectUnauthorized: false } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
  return transport;
}

/** Sends and reports what happened, so the admin can see why e-mail fails. */
export async function sendMailDetailed(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!mailConfigured()) return { ok: false, error: "E-mail is not set up: add SMTP_HOST, SMTP_USER and SMTP_PASS to the app's environment variables." };
  try {
    await getTransport().sendMail({ from: process.env.MAIL_FROM || `Learning Impact <${process.env.SMTP_USER}>`, to, subject, html: layout(subject, html) });
    return { ok: true };
  } catch (err) {
    transport = null; // rebuild with fresh settings next time
    const e = err as Error & { code?: string; response?: string };
    console.error("Sending e-mail failed", e);
    return { ok: false, error: [e.code, e.response ?? e.message].filter(Boolean).join(": ") };
  }
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  return (await sendMailDetailed(to, subject, html)).ok;
}

const layout = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="height:4px;border-radius:4px;background:linear-gradient(90deg,#ff4d6d,#ff9f1c,#ffd23f,#2ee59d,#00c2ff,#7b61ff,#ff4dd8)"></div>
<div style="background:#fff;border-radius:14px;padding:28px;margin-top:14px">
<p style="margin:0 0 18px;font-size:20px;color:#0d2c66"><span style="font-weight:300">learning</span> <b>IMPACT</b></p>
<h1 style="font-size:20px;margin:0 0 14px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#6b7280;text-align:center;margin-top:16px">Learning Impact (SMC-Private) Limited · <a href="${SITE_URL}" style="color:#6b7280">learningimpact.pk</a></p>
</div></body></html>`;

export const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${href}" style="background:#0d2c66;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
