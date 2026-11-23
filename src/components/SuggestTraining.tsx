"use client";

import { useActionState, useEffect, useRef } from "react";
import { suggestTrainingAction, type SuggestState } from "@/lib/actions/suggest";

export type SignedIn = { name: string; email: string } | null;

/** The "Suggest a training" form (opened from the header). Suggestions land in Admin › Suggestions. */
export function SuggestDialog({ onClose, signedIn, initialTitle = "" }: { onClose: () => void; signedIn: SignedIn; initialTitle?: string }) {
  const page = typeof window === "undefined" ? "" : window.location.pathname;
  const [state, action, pending] = useActionState<SuggestState, FormData>(suggestTrainingAction, {});
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  const err = (k: keyof NonNullable<SuggestState["errors"]>) =>
    state.errors?.[k] ? (
      <span className="field__error" role="alert">
        {state.errors[k]}
      </span>
    ) : null;

  return (
    <dialog ref={ref} className="tsuggest" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="suggest-title">
      <div className="tsuggest__box">
        <button className="tsuggest__x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 id="suggest-title" className="h3">
          💡 Suggest a training
        </h2>
        {state.ok ? (
          <div className="tsuggest__done">
            <p>{state.message}</p>
            <p className="muted">We read every suggestion and will contact you if we add it.</p>
            <button className="btn btn--primary" onClick={onClose}>
              <span className="btn__label">Close</span>
            </button>
          </div>
        ) : (
          <form action={action} className="tsuggest__form">
            <p className="muted">Tell us which training you would like us to offer. Our team sees every suggestion.</p>
            <input type="hidden" name="page" value={page} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <label className="admin-field">
              <span className="admin-field__label">Training you would like *</span>
              <input name="title" required maxLength={160} defaultValue={initialTitle} placeholder="e.g. Trade-based money laundering for trade finance staff" />
              {err("title")}
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Details (optional)</span>
              <textarea name="details" rows={3} maxLength={1500} placeholder="Who is it for, what should it cover, online or on-site, how many people…" />
              {err("details")}
            </label>
            {signedIn ? (
              <p className="muted tsuggest__as">
                Sending as <b>{signedIn.name}</b> ({signedIn.email}).
              </p>
            ) : (
              <div className="tsuggest__grid">
                <label className="admin-field">
                  <span className="admin-field__label">Your name *</span>
                  <input name="name" required maxLength={100} autoComplete="name" />
                  {err("name")}
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">E-mail *</span>
                  <input name="email" type="email" required maxLength={160} autoComplete="email" />
                  {err("email")}
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Mobile (optional)</span>
                  <input name="phone" maxLength={40} autoComplete="tel" />
                  {err("phone")}
                </label>
                <label className="admin-field">
                  <span className="admin-field__label">Organisation (optional)</span>
                  <input name="organisation" maxLength={160} autoComplete="organization" />
                </label>
              </div>
            )}
            {state.message && !state.ok && <p className="form-alert">{state.message}</p>}
            <button className="btn btn--primary" disabled={pending}>
              <span className="btn__label">{pending ? "Sending…" : "Send suggestion"}</span>
              <span className="btn__arrow">→</span>
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
