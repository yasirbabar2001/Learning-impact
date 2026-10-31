"use client";

import { submitEnquiry } from "@/app/actions";
import { TextArea } from "./Fields";
import { ContactFields, CONTACT_FIELDS, CONTACT_REQUIRED } from "./contact-fields";
import { Wizard } from "./Wizard";

export function ContactForm() {
  return (
    <Wizard
      action={submitEnquiry}
      steps={[
        {
          title: "Send us a message",
          subtitle: "Questions, partnerships or anything else. We reply within one working day.",
          fields: [...CONTACT_FIELDS, "message"],
          required: [...CONTACT_REQUIRED, "message"],
          render: (ctx) => (
            <>
              <ContactFields {...ctx} />
              <TextArea label="Your message" name="message" required rows={5} value={ctx.values.message} onChange={(v) => ctx.set("message", v)} error={ctx.errors.message} />
            </>
          ),
        },
      ]}
      initial={{ company: "", industry: "", contactName: "", email: "", phone: "", city: "", message: "" }}
      submitLabel="Send message"
      successTitle="Message sent"
      successBody="Thank you for getting in touch. A member of our team will reply shortly."
    />
  );
}
