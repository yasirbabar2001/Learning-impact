"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { removeProgram, saveProgram, setProgramPublished, type AdminState } from "@/app/admin/actions";
import { FORMAT_LABELS, FORMATS, type Program } from "@/lib/types";
import { Drawer } from "./Drawer";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function ProgramsManager({ programs }: { programs: Program[] }) {
  const [editing, setEditing] = useState<Program | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Programs</h1>
          <p className="muted">The catalogue shown on the website. Unpublished programs are hidden from visitors.</p>
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing("new")}>
          <span className="btn__label">New program</span>
          <span className="btn__arrow">+</span>
        </button>
      </div>

      <ul className="req-list">
        <AnimatePresence initial={false}>
          {programs.map((p, i) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ delay: Math.min(i * 0.02, 0.2) }}>
              <div className={`req spot ${p.published ? "" : "is-muted"}`}>
                <button
                  className={`switch ${p.published ? "is-on" : ""}`}
                  role="switch"
                  aria-checked={p.published}
                  aria-label={`${p.published ? "Unpublish" : "Publish"} ${p.title}`}
                  disabled={pending}
                  onClick={() => startTransition(() => setProgramPublished(p.id, !p.published))}
                >
                  <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </button>
                <span className="req__main">
                  <strong>
                    {p.title} {p.featured && <span className="tag tag--gold">Popular</span>}
                  </strong>
                  <span className="muted">
                    {p.category} · {p.duration} · {p.formats.map((f) => FORMAT_LABELS[f]).join(", ")}
                  </span>
                </span>
                <span className="req__meta">
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}>
                    <span className="btn__label">Edit</span>
                  </button>
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New program" : editing ? `Edit: ${editing.title}` : ""}>
        {editing && (
          <ProgramForm
            key={editing === "new" ? "new" : editing.id}
            program={editing === "new" ? null : editing}
            categories={Array.from(new Set(programs.map((p) => p.category)))}
            onDone={() => setEditing(null)}
            onDelete={(id) => {
              setEditing(null);
              startTransition(() => removeProgram(id));
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function ProgramForm({ program, categories, onDone, onDelete }: { program: Program | null; categories: string[]; onDone: () => void; onDelete: (id: string) => void }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProgram, { ok: false });
  const [title, setTitle] = useState(program?.title ?? "");
  const [slug, setSlug] = useState(program?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(program));
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="admin-form">
      {program && <input type="hidden" name="id" value={program.id} />}
      <Field label="Title" error={e.title}>
        <input
          name="title"
          value={title}
          required
          onChange={(ev) => {
            setTitle(ev.target.value);
            if (!slugTouched) setSlug(slugify(ev.target.value));
          }}
        />
      </Field>
      <Field label="URL slug" error={e.slug} hint={`learningimpact.pk/book?program=${slug || "…"}`}>
        <input
          name="slug"
          value={slug}
          required
          onChange={(ev) => {
            setSlugTouched(true);
            setSlug(ev.target.value);
          }}
        />
      </Field>
      <div className="grid-2">
        <Field label="Category" error={e.category}>
          <input name="category" list="categories" defaultValue={program?.category} required />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Duration" error={e.duration}>
          <input name="duration" defaultValue={program?.duration} placeholder="e.g. 2 days" />
        </Field>
        <Field label="Level" error={e.level}>
          <input name="level" defaultValue={program?.level} placeholder="e.g. Foundation" />
        </Field>
        <Field label="Sort order" error={e.sort} hint="Lower numbers appear first">
          <input name="sort" type="number" min="0" defaultValue={program?.sort ?? 100} />
        </Field>
      </div>
      <Field label="Summary" error={e.summary}>
        <textarea name="summary" rows={3} defaultValue={program?.summary} required />
      </Field>
      <Field label="Outcomes" error={e.outcomes} hint="One per line">
        <textarea name="outcomes" rows={5} defaultValue={program?.outcomes.join("\n")} />
      </Field>
      <fieldset className="admin-checks">
        <legend>Formats {e.formats && <span className="field__error">{e.formats}</span>}</legend>
        {FORMATS.map((f) => (
          <label key={f}>
            <input type="checkbox" name="formats" value={f} defaultChecked={program ? program.formats.includes(f) : true} /> {FORMAT_LABELS[f]}
          </label>
        ))}
      </fieldset>
      <fieldset className="admin-checks">
        <legend>Visibility</legend>
        <label>
          <input type="checkbox" name="published" defaultChecked={program?.published ?? true} /> Published on website
        </label>
        <label>
          <input type="checkbox" name="featured" defaultChecked={program?.featured ?? false} /> Show on home page as popular
        </label>
      </fieldset>
      {state.message && <p className="form-alert">{state.message}</p>}
      <div className="detail__foot">
        {program ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--danger"
            onClick={() => confirm(`Delete "${program.title}"? This cannot be undone.`) && onDelete(program.id)}
          >
            <span className="btn__label">Delete</span>
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn--primary btn--sm" disabled={pending}>
          <span className="btn__label">{pending ? "Saving…" : "Save program"}</span>
        </button>
      </div>
    </form>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className={`admin-field ${error ? "has-error" : ""}`}>
      <span className="admin-field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}
