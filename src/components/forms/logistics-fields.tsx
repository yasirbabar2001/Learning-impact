"use client";

import { AUDIENCE_LEVELS, EXTRAS, PLATFORMS, VENUE_TYPES } from "@/lib/site";
import { Choices, MultiChoices, TextArea, TextField } from "./Fields";
import type { Ctx, Values } from "./Wizard";

export const VENUE_FIELDS = ["venueType", "venueCity", "venueAddress", "platform", "audienceLevel", "extras", "budget", "message"];

/** A proposed location is required whenever people meet in person. */
export const venueRequired = (v: Values) => (v.format && v.format !== "virtual" ? ["venueType", "venueCity"] : []);

export function VenueAndNeeds({ values, set, errors, messageLabel }: Ctx & { messageLabel: string }) {
  const inPerson = values.format !== "virtual";
  const online = values.format !== "onsite";
  return (
    <>
      {inPerson && (
        <>
          <Choices
            label="Proposed training location"
            name="venueType"
            required
            value={values.venueType}
            onChange={(v) => set("venueType", v)}
            error={errors.venueType}
            options={VENUE_TYPES.map((t) => ({ value: t.value, label: t.value, note: t.note }))}
          />
          <div className="grid-2">
            <TextField label="Training city" name="venueCity" required value={values.venueCity} onChange={(v) => set("venueCity", v)} error={errors.venueCity} hint="e.g. Dubai, London, Karachi" />
            <TextField
              label="Venue name / address (if known)"
              name="venueAddress"
              value={values.venueAddress}
              onChange={(v) => set("venueAddress", v)}
              error={errors.venueAddress}
              hint="Area or building is enough for now"
            />
          </div>
        </>
      )}
      {online && (
        <Choices
          label="Preferred online platform"
          name="platform"
          value={values.platform}
          onChange={(v) => set("platform", v)}
          options={PLATFORMS.map((p) => ({ value: p, label: p }))}
        />
      )}
      <Choices
        label="Who will attend?"
        name="audienceLevel"
        value={values.audienceLevel}
        onChange={(v) => set("audienceLevel", v)}
        options={AUDIENCE_LEVELS.map((a) => ({ value: a, label: a }))}
      />
      <MultiChoices
        label="Anything else you need?"
        name="extras"
        hint="Select all that apply"
        value={values.extras}
        onChange={(v) => set("extras", v)}
        options={EXTRAS.map((e) => ({ value: e, label: e }))}
      />
      <TextField label="Budget range (optional)" name="budget" value={values.budget} onChange={(v) => set("budget", v)} error={errors.budget} hint="Helps us propose the right option" />
      <TextArea label={messageLabel} name="message" value={values.message} onChange={(v) => set("message", v)} error={errors.message} />
    </>
  );
}

export const LOGISTICS_INITIAL: Values = {
  venueType: "",
  venueCity: "",
  venueAddress: "",
  platform: "",
  audienceLevel: "",
  extras: "",
  budget: "",
  message: "",
  designation: "",
};
