"use client";

import { useActionState } from "react";
import { login, type AdminState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(login, { ok: false });
  return (
    <form action={action} className="login__form">
      <label className="field">
        <input type="password" name="password" placeholder=" " autoComplete="current-password" required autoFocus />
        <span className="field__label">Password</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
      {state.message && (
        <p className="form-alert" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn btn--primary" disabled={pending}>
        <span className="btn__label">{pending ? "Signing in…" : "Sign in"}</span>
        <span className="btn__arrow">→</span>
      </button>
    </form>
  );
}
