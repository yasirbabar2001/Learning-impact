"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";

type Base = { label: string; name: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; required?: boolean };

const Err = ({ id, error }: { id: string; error?: string }) =>
  error ? (
    <motion.span id={id} className="field__error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert">
      {error}
    </motion.span>
  ) : null;

export function TextField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  autoComplete,
  inputMode,
  min,
  placeholder = " ",
}: Base & { type?: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "email" | "text"; min?: string; placeholder?: string }) {
  const id = useId();
  return (
    <label className={`field ${error ? "has-error" : ""} ${type === "date" ? "field--date" : ""}`}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="field__label">
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      <span className="field__glow" aria-hidden="true" />
      {hint && !error && <span className="field__hint">{hint}</span>}
      <Err id={`${id}-err`} error={error} />
    </label>
  );
}

export function TextArea({ label, name, value, onChange, error, hint, required, rows = 4 }: Base & { rows?: number }) {
  const id = useId();
  return (
    <label className={`field field--area ${error ? "has-error" : ""}`}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder=" "
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="field__label">
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      <span className="field__glow" aria-hidden="true" />
      {hint && !error && <span className="field__hint">{hint}</span>}
      <Err id={`${id}-err`} error={error} />
    </label>
  );
}

/** Native select styled like the floating-label inputs (label always raised). */
export function SelectField({ label, name, value, onChange, error, hint, required, children }: Base & { children: ReactNode }) {
  const id = useId();
  return (
    <label className={`field field--select ${error ? "has-error" : ""}`}>
      <select id={id} name={name} value={value} aria-invalid={Boolean(error)} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <span className="field__label">
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      <span className="field__glow" aria-hidden="true" />
      {hint && !error && <span className="field__hint">{hint}</span>}
      <Err id={`${id}-err`} error={error} />
    </label>
  );
}

export type Option = { value: string; label: string; note?: string; icon?: ReactNode };

/** Radio group rendered as chips; the selection highlight glides between options. */
export function Choices({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
  columns,
}: Omit<Base, "hint"> & { options: Option[]; columns?: number }) {
  const id = useId();
  return (
    <fieldset className={`choices ${error ? "has-error" : ""}`} aria-describedby={error ? `${id}-err` : undefined}>
      <legend>
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </legend>
      <div className="choices__grid" style={columns ? { gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(100 / columns) * 2}px, 1fr))` } : undefined}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={o.value} className={`choice spot ${checked ? "is-checked" : ""}`}>
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} />
              {checked && <motion.span layoutId={`${id}-sel`} className="choice__sel" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              {o.icon && <span className="choice__icon">{o.icon}</span>}
              <span className="choice__label">{o.label}</span>
              {o.note && <span className="choice__note">{o.note}</span>}
            </label>
          );
        })}
      </div>
      <Err id={`${id}-err`} error={error} />
    </fieldset>
  );
}

/** Checkbox group shown as chips; the value is the selected labels joined with "; ". */
export function MultiChoices({ label, name, options, value, onChange, hint }: Omit<Base, "error" | "required"> & { options: Option[] }) {
  const selected = value ? value.split("; ") : [];
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    onChange(options.map((o) => o.value).filter((o) => next.includes(o)).join("; "));
  };
  return (
    <fieldset className="choices">
      <legend>{label}</legend>
      {hint && <p className="field__hint choices__hint">{hint}</p>}
      <div className="choices__grid">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label key={o.value} className={`choice choice--multi spot ${checked ? "is-checked" : ""}`}>
              <input type="checkbox" name={name} value={o.value} checked={checked} onChange={() => toggle(o.value)} />
              <span className="choice__tick" aria-hidden="true">
                {checked ? "✓" : "+"}
              </span>
              <span className="choice__label">{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
