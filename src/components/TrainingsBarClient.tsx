"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { suggestTrainingAction, type SuggestState } from "@/lib/actions/suggest";

export type TrainingItem = { title: string; href: string; note: string };
export type TrainingGroup = { id: string; title: string; icon: string; href: string; sections: { heading?: string; items: TrainingItem[] }[] };

const QUICK = [
  { href: "/certifications?view=skills#quests", label: "⚔️ Skills quests" },
  { href: "/regulatory", label: "🌍 Regulatory quests" },
  { href: "/programs", label: "🏢 Corporate programs" },
  { href: "/trainers", label: "🎯 Hire a trainer" },
];

export function TrainingsBarClient({ groups, signedIn }: { groups: TrainingGroup[]; signedIn: { name: string; email: string } | null }) {
  const [open, setOpen] = useState(false);
  const [suggest, setSuggest] = useState(false);
  const [query, setQuery] = useState("");
  const path = usePathname();
  const total = groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0);

  useEffect(() => {
    if (!open && !suggest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSuggest(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, suggest]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        sections: g.sections
          .map((s) => ({ ...s, items: q ? s.items.filter((i) => `${i.title} ${i.note} ${s.heading ?? ""}`.toLowerCase().includes(q)) : s.items }))
          .filter((s) => s.items.length),
      })),
    [groups, q],
  );
  const found = filtered.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0);

  return (
    <div className="tbar">
      <div className="tbar__inner">
        <button className={`tbar__all ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="all-trainings">
          <span aria-hidden="true">☰</span> All trainings <span className="tbar__count">{total}</span>
        </button>
        <nav className="tbar__quick" aria-label="Training categories">
          {QUICK.map((l) => (
            <Link key={l.href} href={l.href} className="tbar__chip" prefetch={false} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="tbar__suggest" onClick={() => setSuggest(true)}>
          <span aria-hidden="true">💡</span> Suggest a training
        </button>
      </div>

      {open && (
        <div id="all-trainings" className="tbar__panel" role="region" aria-label="All trainings">
          <div className="tbar__panel-head">
            <input
              type="search"
              className="tbar__search"
              placeholder="Search all trainings, e.g. leadership, AML, Pakistan, cyber"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label="Search trainings"
            />
            <span className="muted tbar__found">{q ? `${found} found` : `${total} trainings`}</span>
            <button className="tbar__close" onClick={() => setOpen(false)} aria-label="Close the list">
              ✕
            </button>
          </div>
          <div className="tbar__cols">
            {filtered.map((g) => (
              <section key={g.id} className="tbar__col">
                <h3>
                  <Link href={g.href} prefetch={false} onClick={() => setOpen(false)}>
                    {g.icon} {g.title} →
                  </Link>
                </h3>
                {g.sections.length === 0 ? (
                  <p className="muted tbar__none">No match here.</p>
                ) : (
                  g.sections.map((s, k) => (
                    <div key={s.heading ?? k} className="tbar__section">
                      {s.heading && <h4>{s.heading}</h4>}
                      <ul>
                        {s.items.map((i) => (
                          <li key={i.href}>
                            <Link href={i.href} prefetch={false} onClick={() => setOpen(false)}>
                              {i.title}
                              {!s.heading && <small>{i.note}</small>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </section>
            ))}
          </div>
          <p className="tbar__missing">
            Can&apos;t find what you need?{" "}
            <button className="inline-link" onClick={() => setSuggest(true)}>
              Suggest a training
            </button>{" "}
            and we will look at adding it.
          </p>
        </div>
      )}

      {suggest && <SuggestDialog onClose={() => setSuggest(false)} signedIn={signedIn} initialTitle={query.trim()} page={path} />}
    </div>
  );
}

function SuggestDialog({ onClose, signedIn, initialTitle, page }: { onClose: () => void; signedIn: { name: string; email: string } | null; initialTitle: string; page: string }) {
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
        <button className="tbar__close tsuggest__x" onClick={onClose} aria-label="Close">
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
