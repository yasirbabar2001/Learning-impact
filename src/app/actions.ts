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

async function save(input: NewRequest): Promise<FormState> {
  try {
    const created = await store.createRequest(input);
    await notifyNewRequest(created);
    revalidatePath("/admin");
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
    details: d.timing ? { "Preferred timing": d.timing } : {},
  });
}

export async function submitTrainerRequest(_: FormState, fd: FormData): Promise<FormState> {
  const blocked = await guard(fd);
  if (blocked) return blocked;
  const parsed = trainerSchema.safeParse(read(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const details: Record<string, string> = { Topic: d.topic, Engagement: d.engagement };
  if (d.duration) details.Duration = d.duration;
  if (d.language) details.Language = d.language;
  if (d.budget) details.Budget = d.budget;
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
    details,
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
    details: {},
  });
}
