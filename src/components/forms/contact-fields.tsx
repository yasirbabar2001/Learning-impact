"use client";

import { INDUSTRIES, INDUSTRY_GROUPS } from "@/lib/industries";
import { SelectField, TextField } from "./Fields";
import type { Ctx } from "./Wizard";

export const CONTACT_FIELDS = ["company", "industry", "contactName", "email", "phone", "city"];
export const CONTACT_REQUIRED = ["company", "contactName", "email"];

export function ContactFields({ values, set, errors }: Ctx) {
  return (
    <div className="grid-2">
      <TextField label="Company / organisation" name="company" value={values.company} onChange={(v) => set("company", v)} error={errors.company} required autoComplete="organization" />
      <SelectField label="Industry / sector" name="industry" value={values.industry ?? ""} onChange={(v) => set("industry", v)} error={errors.industry}>
        <option value="">Select your industry</option>
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
      </SelectField>
      <TextField label="Your name" name="contactName" value={values.contactName} onChange={(v) => set("contactName", v)} error={errors.contactName} required autoComplete="name" />
      <TextField label="Work e-mail" name="email" type="email" value={values.email} onChange={(v) => set("email", v)} error={errors.email} required autoComplete="email" inputMode="email" />
      <TextField label="Phone / WhatsApp" name="phone" type="tel" value={values.phone} onChange={(v) => set("phone", v)} error={errors.phone} autoComplete="tel" inputMode="tel" />
      <TextField label="City" name="city" value={values.city} onChange={(v) => set("city", v)} error={errors.city} autoComplete="address-level2" hint="e.g. Karachi, Lahore, Islamabad" />
    </div>
  );
}
