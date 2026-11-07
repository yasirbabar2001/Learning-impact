"use server";

import { revalidatePath } from "next/cache";
import { notifyNewRequest } from "@/lib/notify";
import { rateLimited } from "@/lib/rate-limit";
import { store } from "@/lib/store";
import type { NewRequest } from "@/lib/types";
import { bookingSchema, enquirySchema, fieldErrors, trainerSchema, type FieldErrors } from "@/lib/validation";

export type FormState = { ok: boolean; reference?: string; errors?: FieldErrors; message?: string };

const read = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

async function guard(fd: FormData): Promise<FormState | null> {
  // Honeypot: real visitors never see or fill the "website" field.
  if (String(fd.get("website") ?? "")) return { ok: true, reference: "LI-RECEIVED" };
  if (await rateLimited("request", 8, 10 * 60_000)) {
    return { ok: false, message: "Too many requests from your network. Please try again in a few minutes." };
  }
  return null;
}

type DetailSource = {
  industry: string;
  designation: string;
  venueType?: string;
  venueCity?: string;
  venueAddress?: string;
  platform?: string;
  audienceLevel?: string;
  language?: string;
  timing?: string;
  batches?: number | null;
  budget?: string;
  extras?: string;
  format?: string;
};

/** Collects the optional answers into the labelled details shown to the admin, in a sensible order. */
function buildDetails(d: DetailSource, first: Record<string, string> = {}): Record<string, string> {
  const onsite = d.format && d.format !== "virtual";
  const online = d.format && d.format !== "onsite";
  const rows: [string, string | number | null | undefined][] = [
    ["Industry", d.industry],
    ...Object.entries(first),
    ["Venue", onsite ? d.venueType : ""],
    ["Training city", onsite ? d.venueCity : ""],
    ["Venue address", onsite ? d.venueAddress : ""],
    ["Online platform", online ? d.platform : ""],
    ["Audience level", d.audienceLevel],
    ["Language", d.language],
    ["Preferred timing", d.timing],
    ["Batches", d.batches],
    ["Budget", d.budget],
    ["Also needed", d.extras],
    ["Contact designation", d.designation],
  ];
  return Object.fromEntries(rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]));
}

async function save(input: NewRequest): Promise<FormState> {
  try {
    const created = await store.createRequest(input);
    await notifyNewRequest(created);
    revalidatePath("/admin", "layout");
    return { ok: true, reference: created.reference };
  } catch (err) {
    console.error("Saving request failed", err);
    return { ok: false, message: "We could not save your request just now. Please try again or e-mail us directly." };
  }
}

export async function submitBooking(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd);
  if (blocked) return blocked;
  const parsed = bookingSchema.safeParse(read(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const program = d.programSlug === "custom" ? null : await store.getProgram(d.programSlug);
  return save({
    type: "program_booking",
    company: d.company,
    contactName: d.contactName,
    email: d.email,
    phone: d.phone,
    city: d.city,
    participants: d.participants,
    format: d.format,
    preferredDate: d.preferredDate,
    programSlug: program?.slug ?? null,
    programTitle: program?.title ?? "Custom / not sure yet",
    message: d.message,
    details: buildDetails(d),
  });
}

export async function submitTrainerRequest(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd);
  if (blocked) return blocked;
  const parsed = trainerSchema.safeParse(read(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const first: Record<string, string> = { Topic: d.topic, Engagement: d.engagement };
  if (d.duration) first.Duration = d.duration;
  return save({
    type: "trainer_request",
    company: d.company,
    contactName: d.contactName,
    email: d.email,
    phone: d.phone,
    city: d.city,
    participants: d.participants,
    format: d.format,
    preferredDate: d.preferredDate,
    programSlug: null,
    programTitle: null,
    message: d.message,
    details: buildDetails(d, first),
  });
}

export async function submitEnquiry(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd);
  if (blocked) return blocked;
  const parsed = enquirySchema.safeParse(read(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  return save({
    type: "enquiry",
    company: d.company,
    contactName: d.contactName,
    email: d.email,
    phone: d.phone,
    city: d.city,
    participants: null,
    format: null,
    preferredDate: null,
    programSlug: null,
    programTitle: null,
    message: d.message,
    details: buildDetails(d),
  });
}
