"use client";

import { submitTrainerRequest } from "@/app/actions";
import { FORMAT_ICONS } from "@/components/Icons";
import { ENGAGEMENTS, LANGUAGES } from "@/lib/site";
import { FORMAT_LABELS, FORMATS } from "@/lib/types";
import { Choices, TextArea, TextField } from "./Fields";
import { ContactFields, CONTACT_FIELDS, CONTACT_REQUIRED } from "./contact-fields";
import { Wizard, type StepDef } from "./Wizard";

export function TrainerForm({ topic = "", industry = "" }: { topic?: string; industry?: string }) {
  const today = new Date().toISOString().slice(0, 10);

  const steps: StepDef[] = [
    {
      title: "Expertise",
      subtitle: "Tell us the subject and the kind of engagement you have in mind.",
      fields: ["topic", "engagement", "language"],
      required: ["topic", "engagement"],
      render: ({ values, set, errors }) => (
        <>
          <TextField
            label="What should the trainer cover?"
            name="topic"
            required
            value={values.topic}
            onChange={(v) => set("topic", v)}
            error={errors.topic}
            hint="e.g. negotiation for procurement teams, Power BI, leadership coaching"
          />
          <Choices label="Type of engagement" name="engagement" required value={values.engagement} onChange={(v) => set("engagement", v)} error={errors.engagement} options={ENGAGEMENTS.map((e) => ({ value: e, label: e }))} />
          <Choices label="Delivery language" name="language" value={values.language} onChange={(v) => set("language", v)} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
        </>
      ),
    },
    {
      title: "Logistics",
      subtitle: "Approximate is perfect at this stage.",
      fields: ["format", "participants", "preferredDate", "duration", "budget", "message"],
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
            <TextField label="Preferred start date" name="preferredDate" type="date" min={today} value={values.preferredDate} onChange={(v) => set("preferredDate", v)} error={errors.preferredDate} />
            <TextField label="Duration" name="duration" value={values.duration} onChange={(v) => set("duration", v)} error={errors.duration} hint="e.g. 2 days, 6 weekly sessions" />
            <TextField label="Budget range (optional)" name="budget" value={values.budget} onChange={(v) => set("budget", v)} error={errors.budget} hint="Helps us match the right trainer" />
          </div>
          <TextArea label="Describe the audience and the outcome you want" name="message" value={values.message} onChange={(v) => set("message", v)} error={errors.message} />
        </>
      ),
    },
    {
      title: "Your details",
      subtitle: "We will come back with trainer profiles that fit.",
      fields: CONTACT_FIELDS,
      required: CONTACT_REQUIRED,
      render: (ctx) => <ContactFields {...ctx} />,
    },
  ];

  return (
    <Wizard
      action={submitTrainerRequest}
      steps={steps}
      initial={{ topic, engagement: "", language: "", format: "", participants: "", preferredDate: "", duration: "", budget: "", message: "", company: "", industry, contactName: "", email: "", phone: "", city: "" }}
      submitLabel="Request a trainer"
      successTitle="Trainer request received"
      successBody="Thank you. We will shortlist suitable trainers and share their profiles with you, usually within two working days."
    />
  );
}
