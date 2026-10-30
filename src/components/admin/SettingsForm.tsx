"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState } from "react";
import { saveSettings, type AdminState } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";
import { Field } from "./ProgramsManager";

type Key = keyof SiteSettings;

const GROUPS: { title: string; fields: { key: Key; label: string; hint?: string; area?: boolean }[] }[] = [
  {
    title: "Home page",
    fields: [
      { key: "heroEyebrow", label: "Small line above the headline" },
      { key: "heroTitle", label: "Headline" },
      { key: "heroHighlight", label: "Rainbow highlight word(s)", hint: "Shown after the headline with the gold underline" },
      { key: "heroSubtitle", label: "Sub-headline", area: true },
      { key: "announcement", label: "Announcement bar", hint: "Leave empty to hide the bar at the top of every page" },
    ],
  },
  {
    title: "Contact details",
    fields: [
      { key: "email", label: "E-mail" },
      { key: "phone", label: "Phone", hint: "e.g. +92 300 1234567" },
      { key: "whatsapp", label: "WhatsApp number", hint: "International format, e.g. +92 300 1234567" },
      { key: "address", label: "Address / city" },
    ],
  },
  {
    title: "Social links",
    fields: [
      { key: "linkedin", label: "LinkedIn URL" },
      { key: "instagram", label: "Instagram URL" },
      { key: "facebook", label: "Facebook URL" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveSettings, { ok: false });
  const e = state.errors ?? {};
  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Site settings</h1>
          <p className="muted">Text and contact details shown across the website. Changes go live immediately.</p>
        </div>
      </div>
      <form action={action} className="admin-form settings">
        {GROUPS.map((g) => (
          <section key={g.title} className="settings__group glass">
            <h2>{g.title}</h2>
            <div className="grid-2">
              {g.fields.map((f) => (
                <div key={f.key} className={f.area ? "span-2" : undefined}>
                  <Field label={f.label} error={e[f.key]} hint={f.hint}>
                    {f.area ? <textarea name={f.key} rows={3} defaultValue={settings[f.key]} /> : <input name={f.key} defaultValue={settings[f.key]} />}
                  </Field>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="settings__save">
          <AnimatePresence mode="wait">
            {state.ok && (
              <motion.span key={state.savedAt} className="saved" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                ✓ Saved
              </motion.span>
            )}
          </AnimatePresence>
          <button className="btn btn--primary" disabled={pending}>
            <span className="btn__label">{pending ? "Saving…" : "Save settings"}</span>
            <span className="btn__arrow">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
