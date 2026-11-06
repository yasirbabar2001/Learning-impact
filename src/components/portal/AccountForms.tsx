"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "@/lib/actions/account";
import { Field } from "./AuthForms";

type Profile = { name: string; email: string; phone: string; organisation: string; designation: string; leaderboard: boolean; reminders: boolean };

export function ProfileForm({ p }: { p: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const e = state.errors ?? {};
  const v = { ...p, leaderboard: p.leaderboard ? "on" : "", ...state.values } as Record<string, string | boolean>;
  return (
    <form action={action} className="auth__form">
      <Field label="Full name (printed on certificates)" name="name" required defaultValue={String(v.name ?? "")} error={e.name} />
      <p className="muted">E-mail: {p.email}</p>
      <div className="grid-2">
        <Field label="Organisation" name="organisation" defaultValue={String(v.organisation ?? "")} error={e.organisation} />
        <Field label="Designation" name="designation" defaultValue={String(v.designation ?? "")} error={e.designation} />
      </div>
      <Field label="Phone / WhatsApp" name="phone" type="tel" defaultValue={String(v.phone ?? "")} error={e.phone} />
      <label className="check-row">
        <input type="checkbox" name="leaderboard" defaultChecked={state.values ? state.values.leaderboard === "on" : p.leaderboard} />
        <span>Show me on the public leaderboard (first name and initial only)</span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="reminders" defaultChecked={state.values ? state.values.reminders === "on" : p.reminders} />
        <span>E-mail me streak reminders and a nudge when my quest is waiting</span>
      </label>
      {state.message && <p className={state.ok ? "form-ok" : "form-alert"}>{state.message}</p>}
      <button className="btn btn--primary auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Saving…" : "Save profile"}</span>
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="auth__form">
      <Field label="Current password" name="current" type="password" required autoComplete="current-password" error={e.current} />
      <Field label="New password" name="password" type="password" required autoComplete="new-password" error={e.password} hint="At least 8 characters" />
      {state.message && <p className={state.ok ? "form-ok" : "form-alert"}>{state.message}</p>}
      <button className="btn btn--ghost auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Saving…" : "Change password"}</span>
      </button>
    </form>
  );
}
