import { z } from "zod";
import { FORMATS, REQUEST_STATUSES } from "./types";

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const required = (label: string, max = 120) => text(max).min(1, `${label} is required.`);

const optionalNumber = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number of participants." });
      return z.NEVER;
    }
    return n;
  });

const optionalDate = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
      ctx.addIssue({ code: "custom", message: "Choose a valid date." });
      return z.NEVER;
    }
    return v;
  });

const contact = {
  company: required("Company name"),
  contactName: required("Your name"),
  email: z.string().trim().max(160).pipe(z.email("Enter a valid work e-mail.")),
  phone: text(40).regex(/^[+()\d\s-]*$/, "Use digits, spaces, + or - only."),
  city: text(80),
  message: text(3000),
};

export const bookingSchema = z.object({
  ...contact,
  programSlug: required("Program", 120),
  participants: optionalNumber,
  format: z.enum(FORMATS, { message: "Choose a delivery format." }),
  preferredDate: optionalDate,
  timing: text(80),
});

export const trainerSchema = z.object({
  ...contact,
  topic: required("Training topic", 200),
  engagement: required("Engagement type", 60),
  participants: optionalNumber,
  format: z.enum(FORMATS, { message: "Choose a delivery format." }),
  preferredDate: optionalDate,
  duration: text(80),
  language: text(60),
  budget: text(80),
});

export const enquirySchema = z.object({
  ...contact,
  message: required("Message", 3000),
});

export const programSchema = z.object({
  id: z.string().optional(),
  title: required("Title", 140),
  slug: text(120)
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  category: required("Category", 60),
  summary: required("Summary", 600),
  outcomes: z.array(text(200)).max(12),
  duration: text(60),
  level: text(60),
  formats: z.array(z.enum(FORMATS)).min(1, "Pick at least one format."),
  featured: z.boolean(),
  published: z.boolean(),
  sort: z.coerce.number().int().min(0).max(100000),
});

export const settingsSchema = z.object({
  heroEyebrow: text(120),
  heroTitle: required("Headline", 120),
  heroHighlight: text(60),
  heroSubtitle: text(400),
  announcement: text(200),
  email: z.union([z.literal(""), z.email("Enter a valid e-mail.")]),
  phone: text(40),
  whatsapp: text(40),
  address: text(200),
  linkedin: z.union([z.literal(""), z.url("Enter a full URL starting with https://")]),
  instagram: z.union([z.literal(""), z.url("Enter a full URL starting with https://")]),
  facebook: z.union([z.literal(""), z.url("Enter a full URL starting with https://")]),
});

export const statusSchema = z.enum(REQUEST_STATUSES);

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
