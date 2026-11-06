"use client";

import { useActionState, useState } from "react";
import { inviteEmployees } from "@/lib/actions/company";

export function InviteForm({ courses }: { courses: { slug: string; title: string; free: number }[] }) {
  const [state, action, pending] = useActionState(inviteEmployees, {});
  const [copied, setCopied] = useState<string | null>(null);
  if (!courses.length) return <p className="muted">Buy seats for a certification first; then you can invite your team here.</p>;
  return (
    <form action={action} className="auth__form">
      <label className="field field--select">
        <select name="slug" defaultValue={courses[0].slug}>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug} disabled={c.free < 1}>
              {c.title} ({c.free} free seat{c.free === 1 ? "" : "s"})
            </option>
          ))}
        </select>
        <span className="field__label">Certification</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
      <label className="field field--area">
        <textarea name="emails" rows={4} placeholder=" " required defaultValue={state.emails} />
        <span className="field__label">Employee e-mails (one per line, or separated by commas)</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
      {state.message && <p className={state.ok ? "form-ok" : "form-alert"}>{state.message}</p>}
      {state.links && state.links.length > 0 && (
        <ul className="invite-links">
          {state.links.map((l) => (
            <li key={l.url}>
              <span>{l.email}</span>
              <input className="invite-links__url" readOnly value={l.url} onFocus={(e) => e.target.select()} aria-label={`Invitation link for ${l.email}`} />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  navigator.clipboard?.writeText(l.url).then(
                    () => setCopied(l.url),
                    () => setCopied(null),
                  );
                }}
              >
                <span className="btn__label">{copied === l.url ? "Copied ✓" : "Copy invite link"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="btn btn--primary auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Inviting…" : "Send invitations"}</span>
        <span className="btn__arrow">→</span>
      </button>
    </form>
  );
}
