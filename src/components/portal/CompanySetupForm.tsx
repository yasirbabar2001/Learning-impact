"use client";

import { useActionState } from "react";
import { setupCompany } from "@/lib/actions/company";
import { Field } from "./AuthForms";

export function CompanySetupForm() {
  const [state, action, pending] = useActionState(setupCompany, {});
  return (
    <form action={action} className="auth__form">
      <Field label="Company name" name="company" required autoComplete="organization" />
      {state.message && <p className="form-alert">{state.message}</p>}
      <button className="btn btn--primary auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Creating…" : "Create company account"}</span>
        <span className="btn__arrow">→</span>
      </button>
    </form>
  );
}
