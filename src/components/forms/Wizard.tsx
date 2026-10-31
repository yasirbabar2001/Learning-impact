"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useTransition, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { Success } from "./Success";

export type Values = Record<string, string>;
export type Ctx = { values: Values; set: (name: string, value: string) => void; errors: Record<string, string> };
export type StepDef = {
  title: string;
  subtitle?: string;
  fields: string[];
  /** Fields that must be filled before continuing; may depend on earlier answers. */
  required: string[] | ((values: Values) => string[]);
  render: (ctx: Ctx) => ReactNode;
};

type Props = {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  steps: StepDef[];
  initial: Values;
  submitLabel: string;
  successTitle: string;
  successBody: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Multi-step form: client-side checks per step, server validation on submit, animated step changes. */
export function Wizard({ action, steps, initial, submitLabel, successTitle, successBody }: Props) {
  const [state, setState] = useState<FormState>({ ok: false });
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(initial);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  };

  const check = (i: number) => {
    const found: Record<string, string> = {};
    const req = steps[i].required;
    for (const f of typeof req === "function" ? req(values) : req) if (!values[f]?.trim()) found[f] = "This is required.";
    if (steps[i].fields.includes("email") && values.email && !EMAIL.test(values.email.trim())) found.email = "Enter a valid work e-mail.";
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const go = (to: number) => {
    if (to > step && !check(step)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < steps.length - 1) return go(step + 1);
    if (!check(step)) return;
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v));
    fd.set("website", honeypot.current?.value ?? "");
    startTransition(async () => {
      const result = await action(state, fd);
      setState(result);
      if (!result.errors) return;
      // Server-side validation failed: show the errors and jump to the first step that has one.
      setErrors(result.errors);
      const first = steps.findIndex((s) => s.fields.some((f) => result.errors?.[f]));
      if (first >= 0 && first !== step) {
        setDir(first > step ? 1 : -1);
        setStep(first);
      }
    });
  };

  if (state.ok) return <Success title={successTitle} reference={state.reference} body={successBody} />;

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="wizard glass" ref={top}>
      {steps.length > 1 && (
        <div className="wizard__progress">
          <div className="wizard__bar">
            <motion.span animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
          <ol className="wizard__steps">
            {steps.map((s, i) => (
              <li key={s.title} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
                <button type="button" onClick={() => i < step && go(i)} disabled={i >= step} aria-current={i === step ? "step" : undefined}>
                  <span className="wizard__num">{i < step ? "✓" : i + 1}</span>
                  <span className="wizard__name">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            className="wizard__panel"
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0, filter: "blur(8px)" }),
              center: { x: 0, opacity: 1, filter: "blur(0px)" },
              exit: (d: number) => ({ x: d * -60, opacity: 0, filter: "blur(8px)" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="wizard__head">
              <h2>{current.title}</h2>
              {current.subtitle && <p className="muted">{current.subtitle}</p>}
            </div>
            <div className="wizard__fields">{current.render({ values, set, errors })}</div>
          </motion.div>
        </AnimatePresence>

        {state.message && (
          <p className="form-alert" role="alert">
            {state.message}
          </p>
        )}

        <div className="wizard__nav">
          {step > 0 ? (
            <button type="button" className="btn btn--ghost btn--back" onClick={() => go(step - 1)}>
              <span className="btn__arrow">←</span>
              <span className="btn__label">Back</span>
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className={`btn btn--primary ${pending ? "is-loading" : ""}`} disabled={pending}>
            <span className="btn__label">{pending ? "Sending…" : last ? submitLabel : "Continue"}</span>
            <span className="btn__arrow">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
