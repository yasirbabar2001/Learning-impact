"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { catalogEntry } from "../courses/catalog";
import { currentUser, requireCompanyManager } from "../portal/auth";
import { acceptInvitation, companyById, createInvitation, invitationByToken, revokeInvitation, seatsFree } from "../portal/commerce";
import { button, esc, mailConfigured, sendMail } from "../portal/mail";
import { SITE_URL } from "../site";

export type InviteState = { ok?: boolean; message?: string; links?: { email: string; url: string }[]; emails?: string };

/** Invites one or more e-mail addresses (comma, space or new-line separated) to a course, one seat each. */
export async function inviteEmployees(_: InviteState, fd: FormData): Promise<InviteState> {
  const manager = await requireCompanyManager();
  const slug = String(fd.get("slug") ?? "");
  const entry = catalogEntry(slug);
  if (!entry) return { message: "Choose a certification." };
  const raw = String(fd.get("emails") ?? "")
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emails = [...new Set(raw)];
  const bad = emails.filter((e) => !z.email().safeParse(e).success);
  if (!emails.length) return { message: "Enter at least one e-mail address.", emails: String(fd.get("emails") ?? "") };
  if (bad.length) return { message: `These do not look like e-mail addresses: ${bad.join(", ")}`, emails: String(fd.get("emails") ?? "") };
  if (emails.length > seatsFree(manager.company_id, slug))
    return { message: `You have ${seatsFree(manager.company_id, slug)} free seat(s) for this certification. Buy more seats or invite fewer people.`, emails: String(fd.get("emails") ?? "") };

  const company = companyById(manager.company_id)!;
  const links: { email: string; url: string }[] = [];
  const skipped: string[] = [];
  for (const email of emails) {
    const token = createInvitation(manager.company_id, slug, email);
    if (!token) {
      skipped.push(email);
      continue;
    }
    const url = `${SITE_URL}/invite/${token}`;
    links.push({ email, url });
    void sendMail(
      email,
      `${company.name} has enrolled you in ${entry.title}`,
      `<p>Assalam-o-Alaikum,</p><p><b>${esc(manager.name)}</b> from <b>${esc(company.name)}</b> has reserved a seat for you in the <b>${esc(entry.title)}</b> certification on Learning Impact.</p>${button(url, "Accept and start my quest")}<p>Use this e-mail address (${esc(email)}) to log in or create your account.</p>`,
    );
  }
  revalidatePath("/company");
  const sent = mailConfigured() ? "Invitations e-mailed." : "E-mail is not set up yet, so share each person's link below with them.";
  return {
    ok: links.length > 0,
    message: `${links.length} invitation(s) created. ${links.length ? sent : ""}${skipped.length ? ` Skipped (already invited): ${skipped.join(", ")}.` : ""}`,
    links: mailConfigured() ? undefined : links,
  };
}

export async function revokeInvite(fd: FormData) {
  const manager = await requireCompanyManager();
  revokeInvitation(manager.company_id, String(fd.get("id") ?? ""));
  revalidatePath("/company");
}

export async function acceptInvite(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  const inv = invitationByToken(token);
  if (!inv || inv.status !== "pending" || inv.email.toLowerCase() !== user.email.toLowerCase()) redirect(`/invite/${token}`);
  if (user.company_id && user.company_id !== inv.company_id) redirect(`/invite/${token}?error=other-company`);
  acceptInvitation(inv, user.id);
  redirect(`/learn/${inv.course_slug}`);
}
