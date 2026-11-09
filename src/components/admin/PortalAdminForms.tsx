"use client";

import { useActionState } from "react";
import { adminEnrollAction, resetLinkAction, savePaymentSettingsAction, testEmailAction } from "@/app/admin/portal-actions";
import type { PaymentSettings } from "@/lib/portal/commerce";
import { Field } from "./ProgramsManager";

export function EnrollForm({ courses }: { courses: { slug: string; title: string }[] }) {
  const [state, action, pending] = useActionState(adminEnrollAction, {});
  return (
    <form action={action} className="admin-form admin-inline">
      <Field label="Learner e-mail">
        <input name="email" type="email" required />
      </Field>
      <Field label="Certification">
        <select name="slug" className="admin-select">
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>
      <button className="btn btn--primary btn--sm" disabled={pending}>
        <span className="btn__label">Enrol free of charge</span>
      </button>
      {state.message && <p className={state.ok ? "form-ok" : "form-alert"}>{state.message}</p>}
    </form>
  );
}

export function ResetLinkButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetLinkAction, {});
  return (
    <form action={action} className="reset-link">
      <input type="hidden" name="id" value={id} />
      <button className="btn btn--ghost btn--sm" disabled={pending}>
        <span className="btn__label">Password reset link</span>
      </button>
      {state.message && (
        <span className="muted">
          {state.message} {state.link && <code className="mono">{state.link}</code>}
        </span>
      )}
    </form>
  );
}

export function PaymentSettingsForm({ s, usdRate }: { s: PaymentSettings; usdRate: number }) {
  const [state, action, pending] = useActionState(savePaymentSettingsAction, {});
  const rows: [keyof PaymentSettings, string, string?][] = [
    ["accountTitle", "Account title"],
    ["bankName", "Bank name"],
    ["accountNumber", "Account number"],
    ["iban", "IBAN", "PK00XXXX0000000000000000"],
    ["branch", "Branch"],
    ["wallets", "Easypaisa / JazzCash numbers", "e.g. Easypaisa 0334 9990778 (Learning Impact)"],
  ];
  return (
    <form action={action} className="admin-form">
      <div className="grid-2">
        {rows.map(([k, label, ph]) => (
          <Field key={k} label={label}>
            <input name={k} defaultValue={s[k]} placeholder={ph} />
          </Field>
        ))}
      </div>
      <Field label="Instructions shown to buyers">
        <textarea name="instructions" rows={3} defaultValue={s.instructions} />
      </Field>
      <h3 className="admin-sub">Learners outside Pakistan (US dollars)</h3>
      <Field label="How to pay in US dollars (international bank / SWIFT details, payment link)">
        <textarea name="international" rows={4} defaultValue={s.international} placeholder="e.g. Bank: ... SWIFT: ... IBAN: ... or pay by card at https://..." />
      </Field>
      <Field label="Exchange rate used when a course has no dollar price (PKR per US$1)">
        <input name="usd_rate" type="number" min={1} step="0.01" defaultValue={usdRate} />
      </Field>
      {state.message && <p className={state.ok ? "form-ok" : "form-alert"}>{state.message}</p>}
      <button className="btn btn--primary btn--sm" disabled={pending}>
        <span className="btn__label">Save payment details</span>
      </button>
    </form>
  );
}

export function TestEmailForm({ configured, host }: { configured: boolean; host: string }) {
  const [state, action, pending] = useActionState(testEmailAction, {});
  return (
    <form action={action} className="admin-form admin-inline">
      <p className="muted admin-full">
        {configured ? `E-mail is set up (server: ${host}). Send yourself a test to confirm codes are delivered.` : "E-mail is not set up yet: add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in Setup Node.js App, then restart the app."}
      </p>
      <Field label="Send a test to">
        <input name="to" type="email" required placeholder="you@example.com" />
      </Field>
      <button className="btn btn--primary btn--sm" disabled={pending}>
        <span className="btn__label">{pending ? "Sending…" : "Send test e-mail"}</span>
      </button>
      {state.message && <p className={`${state.ok ? "form-ok" : "form-alert"} admin-full`}>{state.message}</p>}
    </form>
  );
}
