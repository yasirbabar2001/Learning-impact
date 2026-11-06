"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { forgotPassword, login, register, resetPassword, type AuthState } from "@/lib/actions/account";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
};

export function Field({ label, name, type = "text", error, hint, required, autoComplete, defaultValue }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const field = (
    <label className={`field ${error ? "has-error" : ""} ${isPw ? "field--pw" : ""}`}>
      <input name={name} type={isPw && show ? "text" : type} placeholder=" " required={required} autoComplete={autoComplete} defaultValue={defaultValue} aria-invalid={Boolean(error)} />
      <span className="field__label">
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      <span className="field__glow" aria-hidden="true" />
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  );
  if (!isPw) return field;
  // The show/hide toggle sits outside the label so the input keeps a single accessible name.
  return (
    <div className="field-pw">
      {field}
      <button type="button" className="field__eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

const Alert = ({ state }: { state: AuthState }) =>
  state.message ? (
    <p className={state.ok ? "form-ok" : "form-alert"} role="status">
      {state.message}
    </p>
  ) : null;

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button className="btn btn--primary auth__submit" disabled={pending}>
      <span className="btn__label">{pending ? "Please wait…" : label}</span>
      <span className="btn__arrow">→</span>
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="auth__form">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-mail" name="email" type="email" required autoComplete="email" defaultValue={v.email} />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <Alert state={state} />
      <Submit pending={pending} label="Log in" />
      <p className="auth__alt">
        <Link href="/forgot-password" className="inline-link">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next, email }: { next?: string; email?: string }) {
  const [state, action, pending] = useActionState(register, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="auth__form">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Full name (as it should appear on certificates)" name="name" required autoComplete="name" error={e.name} defaultValue={v.name} />
      <Field label="E-mail" name="email" type="email" required autoComplete="email" error={e.email} defaultValue={v.email ?? email} />
      <Field label="Password" name="password" type="password" required autoComplete="new-password" error={e.password} hint="At least 8 characters" />
      <div className="grid-2">
        <Field label="Organisation" name="organisation" autoComplete="organization" error={e.organisation} defaultValue={v.organisation} />
        <Field label="Designation" name="designation" autoComplete="organization-title" error={e.designation} defaultValue={v.designation} />
      </div>
      <Field label="Phone / WhatsApp" name="phone" type="tel" autoComplete="tel" error={e.phone} defaultValue={v.phone} />
      <label className={`check-row ${e.terms ? "has-error" : ""}`}>
        <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} />
        <span>
          I agree to the <Link href="/terms" className="inline-link">terms of use</Link> and certification rules.
        </span>
      </label>
      {e.terms && <span className="field__error">{e.terms}</span>}
      <Alert state={state} />
      <Submit pending={pending} label="Create my account" />
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="auth__form">
      <Field label="E-mail" name="email" type="email" required autoComplete="email" error={state.errors?.email} defaultValue={state.values?.email} />
      <Alert state={state} />
      <Submit pending={pending} label="Send reset link" />
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="auth__form">
      <input type="hidden" name="token" value={token} />
      <Field label="New password" name="password" type="password" required autoComplete="new-password" error={e.password} hint="At least 8 characters" />
      <Field label="Confirm new password" name="confirm" type="password" required autoComplete="new-password" error={e.confirm} />
      <Alert state={state} />
      <Submit pending={pending} label="Save new password" />
    </form>
  );
}
