"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { forgotPassword, login, register, resendVerification, resetPassword, resetWithCode, verifyEmail, type AuthState } from "@/lib/actions/account";
import { INDUSTRIES, INDUSTRY_GROUPS } from "@/lib/industries";

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

export type AccountType = "individual" | "company";

/** "Individual or company?" switch shown before logging in or signing up. */
export function TypeSwitch({ value, onChange }: { value: AccountType; onChange: (t: AccountType) => void }) {
  const opts: { v: AccountType; icon: string; label: string; note: string }[] = [
    { v: "individual", icon: "🧑‍💼", label: "Individual", note: "Learn and get certified" },
    { v: "company", icon: "🏢", label: "Company", note: "Buy seats, manage a team" },
  ];
  return (
    <div className="type-switch" role="radiogroup" aria-label="Account type">
      {opts.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={`type-switch__opt ${value === o.v ? "is-on" : ""}`} onClick={() => onChange(o.v)}>
          {value === o.v && <motion.span layoutId="type-pill" className="type-switch__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="type-switch__icon" aria-hidden="true">
            {o.icon}
          </span>
          <span className="type-switch__text">
            <strong>{o.label}</strong>
            <small>{o.note}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function LoginForm({ next, initialType = "individual" }: { next?: string; initialType?: AccountType }) {
  const [state, action, pending] = useActionState(login, {});
  const v = state.values ?? {};
  const [type, setType] = useState<AccountType>((v.type as AccountType) || initialType);
  return (
    <form action={action} className="auth__form">
      <p className="auth__ask">Log in as</p>
      <TypeSwitch value={type} onChange={setType} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={type === "company" ? "Company account e-mail" : "E-mail"} name="email" type="email" required autoComplete="email" defaultValue={v.email} />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <Alert state={state} />
      <Submit pending={pending} label={type === "company" ? "Log in to company account" : "Log in"} />
      <p className="auth__alt">
        <Link href="/forgot-password" className="inline-link">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

const SIZES = ["1–50", "51–200", "201–500", "501–1,000", "1,000+"];

export function RegisterForm({ next, email, initialType = "individual" }: { next?: string; email?: string; initialType?: AccountType }) {
  const [state, action, pending] = useActionState(register, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const [type, setType] = useState<AccountType>((v.type as AccountType) || initialType);
  const company = type === "company";
  return (
    <form action={action} className="auth__form">
      <p className="auth__ask">I am signing up as</p>
      <TypeSwitch value={type} onChange={setType} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next ?? ""} />
      {company ? (
        <>
          <p className="auth__note">Company accounts are activated after we review your company profile, usually within one working day.</p>
          <h3 className="auth__group">Company</h3>
          <Field label="Registered company name" name="company" required autoComplete="organization" error={e.company} defaultValue={v.company} />
          <div className="grid-2">
            <label className={`field field--select ${e.industry ? "has-error" : ""}`}>
              <select name="industry" defaultValue={v.industry ?? ""} required>
                <option value="" disabled>
                  Select industry
                </option>
                {INDUSTRY_GROUPS.map((g) => (
                  <optgroup key={g.id} label={g.title}>
                    {INDUSTRIES.filter((i) => i.group === g.id).map((i) => (
                      <option key={i.slug} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="Other">Other</option>
              </select>
              <span className="field__label">
                Industry<i aria-hidden="true"> *</i>
              </span>
              <span className="field__glow" aria-hidden="true" />
              {e.industry && <span className="field__error">{e.industry}</span>}
            </label>
            <label className={`field field--select ${e.employees ? "has-error" : ""}`}>
              <select name="employees" defaultValue={v.employees ?? ""} required>
                <option value="" disabled>
                  Select size
                </option>
                {SIZES.map((x) => (
                  <option key={x} value={x}>
                    {x} employees
                  </option>
                ))}
              </select>
              <span className="field__label">
                Company size<i aria-hidden="true"> *</i>
              </span>
              <span className="field__glow" aria-hidden="true" />
              {e.employees && <span className="field__error">{e.employees}</span>}
            </label>
            <Field label="City" name="city" required autoComplete="address-level2" error={e.city} defaultValue={v.city} />
            <Field label="NTN (optional)" name="ntn" error={e.ntn} defaultValue={v.ntn} />
          </div>
          <Field label="Office address" name="address" autoComplete="street-address" error={e.address} defaultValue={v.address} />
          <h3 className="auth__group">Contact person (account manager)</h3>
          <div className="grid-2">
            <Field label="Full name" name="name" required autoComplete="name" error={e.name} defaultValue={v.name} />
            <Field label="Designation" name="designation" required autoComplete="organization-title" error={e.designation} defaultValue={v.designation} hint="e.g. Head of L&D, HR Manager" />
          </div>
          <Field label="Work e-mail" name="email" type="email" required autoComplete="email" error={e.email} defaultValue={v.email ?? email} hint="We send a verification code here" />
          <Field label="Phone / WhatsApp" name="phone" type="tel" required autoComplete="tel" error={e.phone} defaultValue={v.phone} />
        </>
      ) : (
        <>
          <Field label="Full name (as it should appear on certificates)" name="name" required autoComplete="name" error={e.name} defaultValue={v.name} />
          <Field label="E-mail" name="email" type="email" required autoComplete="email" error={e.email} defaultValue={v.email ?? email} hint="We send a verification code here" />
          <div className="grid-2">
            <Field label="Organisation" name="organisation" autoComplete="organization" error={e.organisation} defaultValue={v.organisation} />
            <Field label="Designation" name="designation" autoComplete="organization-title" error={e.designation} defaultValue={v.designation} />
          </div>
          <Field label="Phone / WhatsApp" name="phone" type="tel" autoComplete="tel" error={e.phone} defaultValue={v.phone} />
        </>
      )}
      <Field label="Password" name="password" type="password" required autoComplete="new-password" error={e.password} hint="At least 8 characters" />
      <label className={`check-row ${e.terms ? "has-error" : ""}`}>
        <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} />
        <span>
          I agree to the <Link href="/terms" className="inline-link">terms of use</Link>
          {company ? " and confirm I am authorised to register this company." : " and certification rules."}
        </span>
      </label>
      {e.terms && <span className="field__error">{e.terms}</span>}
      <Alert state={state} />
      <Submit pending={pending} label={company ? "Register my company" : "Create my account"} />
    </form>
  );
}

/** Six boxes that behave like one code field (typing, backspace and pasting all work). */
export function CodeInput({ name = "code", error }: { name?: string; error?: string }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, "").split("");
    if (!chars.length) {
      setDigits((d) => d.map((x, k) => (k === i ? "" : x)));
      return;
    }
    setDigits((d) => {
      const next = [...d];
      chars.slice(0, 6 - i).forEach((c, k) => (next[i + k] = c));
      return next;
    });
    refs.current[Math.min(5, i + chars.length)]?.focus();
  };
  return (
    <div className={`code-input ${error ? "has-error" : ""}`}>
      <input type="hidden" name={name} value={digits.join("")} />
      <div className="code-input__boxes" role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={i === 0 ? 6 : 1}
            aria-label={`Digit ${i + 1}`}
            autoFocus={i === 0}
            onChange={(ev) => set(i, ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            onPaste={(ev) => {
              ev.preventDefault();
              set(i, ev.clipboardData.getData("text"));
            }}
          />
        ))}
      </div>
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function VerifyForm({ next, waitSeconds }: { next?: string; waitSeconds: number }) {
  const [state, action, pending] = useActionState(verifyEmail, {});
  const [resend, resendAction, resending] = useActionState(resendVerification, {});
  const [wait, setWait] = useState(waitSeconds);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  return (
    <>
      <form action={action} className="auth__form">
        <input type="hidden" name="next" value={next ?? ""} />
        <CodeInput error={state.errors?.code} />
        <Alert state={state} />
        <Submit pending={pending} label="Verify" />
      </form>
      <form action={resendAction} onSubmit={() => setWait(60)} className="auth__resend">
        {resend.message && <p className={resend.ok ? "form-ok" : "form-alert"}>{resend.message}</p>}
        <button className="inline-link" disabled={wait > 0 || resending}>
          {wait > 0 ? `Resend code in ${wait}s` : resending ? "Sending…" : "Didn't get it? Send a new code"}
        </button>
      </form>
    </>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="auth__form">
      <Field label="E-mail" name="email" type="email" required autoComplete="email" error={state.errors?.email} defaultValue={state.values?.email} />
      <Alert state={state} />
      <Submit pending={pending} label="Send me a code" />
    </form>
  );
}

export function ResetCodeForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resetWithCode, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="auth__form">
      <input type="hidden" name="email" value={email} />
      <CodeInput error={e.code} />
      <Field label="New password" name="password" type="password" required autoComplete="new-password" error={e.password} hint="At least 8 characters" />
      <Alert state={state} />
      <Submit pending={pending} label="Save new password" />
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
