"use client";

import { submitBooking } from "@/app/actions";
import { FORMAT_ICONS } from "@/components/Icons";
import { LANGUAGES, TIMINGS } from "@/lib/site";
import { FORMAT_LABELS, FORMATS, type Program } from "@/lib/types";
import { Choices, TextField } from "./Fields";
import { ContactFields, CONTACT_FIELDS, CONTACT_REQUIRED } from "./contact-fields";
import { LOGISTICS_INITIAL, VenueAndNeeds, VENUE_FIELDS, venueRequired } from "./logistics-fields";
import { Wizard, type StepDef } from "./Wizard";

type Lite = Pick<Program, "slug" | "title" | "duration" | "category">;

export function BookingForm({ programs, preselect, industry = "" }: { programs: Lite[]; preselect?: string; industry?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const valid = programs.some((p) => p.slug === preselect);

  const steps: StepDef[] = [
    {
      title: "Program",
      subtitle: "Pick a program from our catalogue, or tell us you need something tailored.",
      fields: ["programSlug"],
      required: ["programSlug"],
      render: ({ values, set, errors }) => (
        <Choices
          label="Which program would you like to book?"
          name="programSlug"
          required
          value={values.programSlug}
          onChange={(v) => set("programSlug", v)}
          error={errors.programSlug}
          options={[
            ...programs.map((p) => ({ value: p.slug, label: p.title, note: `${p.category} · ${p.duration}` })),
            { value: "custom", label: "Something tailored", note: "Not sure yet, or a custom program" },
          ]}
        />
      ),
    },
    {
      title: "Session",
      subtitle: "Rough numbers are fine; we will confirm the details with you.",
      fields: ["format", "participants", "batches", "preferredDate", "timing", "language"],
      required: ["format"],
      render: ({ values, set, errors }) => (
        <>
          <Choices
            label="Delivery format"
            name="format"
            required
            value={values.format}
            onChange={(v) => set("format", v)}
            error={errors.format}
            options={FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f], icon: FORMAT_ICONS[f] }))}
          />
          <div className="grid-2">
            <TextField label="Number of participants" name="participants" type="number" inputMode="numeric" min="1" value={values.participants} onChange={(v) => set("participants", v)} error={errors.participants} />
            <TextField label="Number of batches" name="batches" type="number" inputMode="numeric" min="1" value={values.batches} onChange={(v) => set("batches", v)} error={errors.batches} hint="Groups of participants trained separately" />
            <TextField label="Preferred start date" name="preferredDate" type="date" min={today} value={values.preferredDate} onChange={(v) => set("preferredDate", v)} error={errors.preferredDate} />
          </div>
          <Choices label="Preferred timing" name="timing" value={values.timing} onChange={(v) => set("timing", v)} options={TIMINGS.map((t) => ({ value: t, label: t }))} />
          <Choices label="Delivery language" name="language" value={values.language} onChange={(v) => set("language", v)} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
        </>
      ),
    },
    {
      title: "Venue & needs",
      subtitle: "Where the training happens, who attends and what else would help.",
      fields: VENUE_FIELDS,
      required: venueRequired,
      render: (ctx) => <VenueAndNeeds {...ctx} messageLabel="Training objectives (what should change after the training?)" />,
    },
    {
      title: "Your details",
      subtitle: "So we can send you a proposal and confirm availability.",
      fields: CONTACT_FIELDS,
      required: CONTACT_REQUIRED,
      render: (ctx) => <ContactFields {...ctx} />,
    },
  ];

  return (
    <Wizard
      action={submitBooking}
      steps={steps}
      initial={{
        ...LOGISTICS_INITIAL,
        programSlug: valid ? preselect! : "",
        format: "",
        participants: "",
        batches: "",
        preferredDate: "",
        timing: "",
        language: "",
        company: "",
        industry,
        contactName: "",
        email: "",
        phone: "",
        city: "",
      }}
      submitLabel="Send booking request"
      successTitle="Booking request received"
      successBody="Thank you. Our team will review your request and get back to you within one working day with availability and a proposal."
    />
  );
}
