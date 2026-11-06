"use client";

import { startTransition, useActionState, useState } from "react";
import { startCheckout, submitPaymentProof } from "@/lib/actions/commerce";
import { Field } from "./AuthForms";

export function CheckoutForm({ slug, team, unitPrice, companyName }: { slug: string; team: boolean; unitPrice: number; companyName: string | null }) {
  const [state, action, pending] = useActionState(startCheckout, {});
  const [seats, setSeats] = useState(10);
  const e = state.errors ?? {};
  return (
    <form action={action} className="auth__form">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="kind" value={team ? "seats" : "individual"} />
      {team && (
        <>
          <p className="muted">
            Buying for <strong>{companyName}</strong>
          </p>
          <label className={`field ${e.seats ? "has-error" : ""}`}>
            <input name="seats" type="number" min={2} max={1000} value={seats} onChange={(ev) => setSeats(Number(ev.target.value))} placeholder=" " />
            <span className="field__label">Number of seats (learners)</span>
            <span className="field__glow" aria-hidden="true" />
            {e.seats ? <span className="field__error">{e.seats}</span> : <span className="field__hint">Each seat lets one employee take the full certification.</span>}
          </label>
          <p className="checkout__total">
            Total <strong>PKR {(unitPrice * (Number.isFinite(seats) && seats > 0 ? seats : 0)).toLocaleString("en-PK")}</strong>
          </p>
        </>
      )}
      {state.message && <p className="form-alert">{state.message}</p>}
      <button className="btn btn--primary auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Creating your order…" : "Continue to payment"}</span>
        <span className="btn__arrow">→</span>
      </button>
      <p className="field__hint">No payment is taken online. You will see our bank and wallet details next.</p>
    </form>
  );
}

export function PaymentForm({ reference, methods, resubmit }: { reference: string; methods: readonly string[]; resubmit: boolean }) {
  const [state, action, pending] = useActionState(submitPaymentProof, {});
  const [method, setMethod] = useState("");
  const e = state.errors ?? {};
  if (state.ok)
    return (
      <p className="form-ok" role="status">
        {state.message}
      </p>
    );
  return (
    <form
      className="auth__form"
      onSubmit={(e) => {
        // Submit manually so React does not reset the form: the chosen method and file stay if there is an error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="reference" value={reference} />
      <fieldset className={`choices ${e.method ? "has-error" : ""}`}>
        <legend>How did you pay?</legend>
        <div className="choices__grid">
          {methods.map((m) => (
            <label key={m} className={`choice ${method === m ? "is-checked choice--solid" : ""}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
              <span className="choice__label">{m}</span>
            </label>
          ))}
        </div>
        {e.method && <span className="field__error">{e.method}</span>}
      </fieldset>
      <Field label="Transaction ID / reference" name="transaction" required error={e.transaction} defaultValue={state.values?.transaction} hint="From your bank or wallet receipt" />
      <label className={`upload ${e.proof ? "has-error" : ""}`}>
        <span className="upload__label">{resubmit ? "Upload a new receipt (optional)" : "Upload payment receipt"}</span>
        <input type="file" name="proof" accept="image/jpeg,image/png,image/webp,application/pdf" />
        <span className="field__hint">Screenshot or PDF, up to 5 MB</span>
        {e.proof && <span className="field__error">{e.proof}</span>}
      </label>
      <label className="field field--area">
        <textarea name="note" rows={3} placeholder=" " defaultValue={state.values?.note} />
        <span className="field__label">Note for our team (optional)</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
      {state.message && <p className="form-alert">{state.message}</p>}
      <button className="btn btn--primary auth__submit" disabled={pending}>
        <span className="btn__label">{pending ? "Sending…" : "Submit payment details"}</span>
        <span className="btn__arrow">→</span>
      </button>
    </form>
  );
}
