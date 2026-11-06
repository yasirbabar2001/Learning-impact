import type { Metadata } from "next";
import Link from "next/link";
import { acceptInvite } from "@/lib/actions/company";
import { catalogEntry } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { companyById, invitationByToken } from "@/lib/portal/commerce";

export const metadata: Metadata = { title: "Your invitation", robots: { index: false } };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const inv = invitationByToken(token);
  const user = await currentUser();
  const company = inv ? companyById(inv.company_id) : null;
  const entry = inv ? catalogEntry(inv.course_slug) : null;
  const here = `/invite/${token}`;

  let body: React.ReactNode;
  if (!inv || !company || !entry) body = <p className="form-alert">This invitation link is not valid. Ask your company to send a new one.</p>;
  else if (inv.status === "revoked") body = <p className="form-alert">This invitation was cancelled by {company.name}.</p>;
  else if (inv.status === "accepted")
    body = (
      <>
        <p className="form-ok">This invitation has already been accepted.</p>
        <Link href={`/learn/${inv.course_slug}`} className="btn btn--primary">
          <span className="btn__label">Open the quest</span>
          <span className="btn__arrow">→</span>
        </Link>
      </>
    );
  else if (!user)
    body = (
      <>
        <p className="muted">
          Log in or create your free account with <strong>{inv.email}</strong> to accept.
        </p>
        <div className="lesson__actions">
          <Link href={`/register?next=${encodeURIComponent(here)}&email=${encodeURIComponent(inv.email)}`} className="btn btn--primary">
            <span className="btn__label">Create my account</span>
            <span className="btn__arrow">→</span>
          </Link>
          <Link href={`/login?next=${encodeURIComponent(here)}`} className="btn btn--ghost">
            <span className="btn__label">I already have an account</span>
          </Link>
        </div>
      </>
    );
  else if (user.email.toLowerCase() !== inv.email.toLowerCase())
    body = (
      <p className="form-alert">
        This invitation is for {inv.email}, but you are logged in as {user.email}. Log out and use the invited e-mail address.
      </p>
    );
  else
    body = (
      <>
        {error === "other-company" && <p className="form-alert">Your account already belongs to another company&apos;s team.</p>}
        <form action={acceptInvite}>
          <input type="hidden" name="token" value={token} />
          <button className="btn btn--primary">
            <span className="btn__label">Accept and start my quest</span>
            <span className="btn__arrow">→</span>
          </button>
        </form>
      </>
    );

  return (
    <section className="container section checkout" style={{ ["--c" as string]: entry?.color ?? "#ffd23f" }}>
      <div className="glass checkout__card company-setup">
        <span className="lesson__intro-icon">🎟️</span>
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Company invitation
        </p>
        <h1 className="h3">{company && entry ? `${company.name} has reserved a seat for you in ${entry.title}` : "Invitation"}</h1>
        {body}
      </div>
    </section>
  );
}
