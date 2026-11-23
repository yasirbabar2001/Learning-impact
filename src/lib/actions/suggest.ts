"use server";

import { z } from "zod";
import { addSuggestion } from "@/lib/portal/suggestions";
import { currentUser, OWNER_EMAILS } from "@/lib/portal/auth";
import { mailConfigured, sendMail } from "@/lib/portal/mail";
import { rateLimited } from "@/lib/rate-limit";

export type SuggestState = { ok?: boolean; message?: string; errors?: Partial<Record<"title" | "name" | "email" | "details" | "phone", string>> };

const schema = z.object({
  title: z.string().trim().min(3, "Tell us the training you would like (at least 3 characters).").max(160, "Please keep the title under 160 characters."),
  details: z.string().trim().max(1500, "Please keep the details under 1,500 characters."),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid e-mail address.").max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s-]*$/, "Use digits, spaces, + or - only."),
  organisation: z.string().trim().max(160),
  page: z.string().trim().max(200),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** "Suggest a training": stores the suggestion for Admin › Suggestions and e-mails the team when e-mail is set up. */
export async function suggestTrainingAction(_: SuggestState, fd: FormData): Promise<SuggestState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thank you! Your suggestion has been sent." }; // bots fill hidden fields
  if (await rateLimited("suggest", 6, 60 * 60_000)) return { message: "Thank you, we have your suggestions. Please try again a little later." };
  const user = await currentUser();
  const parsed = schema.safeParse({
    title: fd.get("title") ?? "",
    details: fd.get("details") ?? "",
    name: user?.name || fd.get("name") || "",
    email: user?.email || fd.get("email") || "",
    phone: fd.get("phone") || user?.phone || "",
    organisation: fd.get("organisation") || user?.organisation || "",
    page: fd.get("page") ?? "",
  });
  if (!parsed.success) {
    const errors: SuggestState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof NonNullable<SuggestState["errors"]>;
      errors[k] ??= issue.message;
    }
    return { message: "Please check the highlighted fields.", errors };
  }
  const s = addSuggestion({ ...parsed.data, page: parsed.data.page.startsWith("/") ? parsed.data.page : "", user_id: user?.id ?? null });

  if (mailConfigured()) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learningimpact.pk";
    const rows: [string, string][] = [
      ["Training", s.title],
      ["Details", s.details],
      ["From", s.name],
      ["E-mail", s.email],
      ["Phone", s.phone],
      ["Organisation", s.organisation],
      ["Sent from page", s.page],
    ];
    const html = `<h2>New training suggestion</h2><table cellpadding="6">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table><p><a href="${site}/admin/suggestions">Open Suggestions in the admin panel</a></p>`;
    void sendMail(OWNER_EMAILS[0], `Training suggestion: ${s.title.slice(0, 80)}`, html).catch(() => {});
  }
  return { ok: true, message: "Thank you! Your suggestion has reached the Learning Impact team." };
}
