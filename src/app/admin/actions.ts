"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, passwordMatches, requireAdmin, startSession, adminConfigured } from "@/lib/auth";
import { endUserSession } from "@/lib/portal/auth";
import { rateLimited } from "@/lib/rate-limit";
import { store } from "@/lib/store";
import { FORMATS } from "@/lib/types";
import { fieldErrors, programSchema, settingsSchema, statusSchema, type FieldErrors } from "@/lib/validation";

export type AdminState = { ok: boolean; message?: string; errors?: FieldErrors; savedAt?: number };

const refreshSite = () => revalidatePath("/", "layout");

export async function login(_: AdminState, fd: FormData): Promise<AdminState> {
  if (!adminConfigured()) return { ok: false, message: "Admin access is not configured. Set ADMIN_PASSWORD on the server." };
  if (await rateLimited("login", 8, 15 * 60_000)) return { ok: false, message: "Too many attempts. Please wait 15 minutes." };
  if (!passwordMatches(String(fd.get("password") ?? ""))) return { ok: false, message: "That password is not correct." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  await endUserSession();
  redirect("/login");
}

export async function setRequestStatus(id: string, status: string) {
  await requireAdmin();
  await store.updateRequest(id, { status: statusSchema.parse(status) });
  revalidatePath("/admin", "layout");
}

export async function saveRequestNotes(id: string, notes: string) {
  await requireAdmin();
  await store.updateRequest(id, { notes: notes.slice(0, 5000) });
  revalidatePath("/admin", "layout");
}

export async function removeRequest(id: string) {
  await requireAdmin();
  await store.deleteRequest(id);
  revalidatePath("/admin", "layout");
}

export async function saveProgram(_: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = programSchema.safeParse({
    id: String(fd.get("id") ?? "") || undefined,
    title: fd.get("title") ?? "",
    slug: fd.get("slug") ?? "",
    category: fd.get("category") ?? "",
    summary: fd.get("summary") ?? "",
    outcomes: String(fd.get("outcomes") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    duration: fd.get("duration") ?? "",
    level: fd.get("level") ?? "",
    formats: fd.getAll("formats").filter((f) => FORMATS.includes(f as never)),
    featured: fd.get("featured") === "on",
    published: fd.get("published") === "on",
    sort: fd.get("sort") || "100",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await store.saveProgram(parsed.data);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not save the program." };
  }
  refreshSite();
  return { ok: true, savedAt: Date.now() };
}

export async function setProgramPublished(id: string, published: boolean) {
  await requireAdmin();
  const program = (await store.listPrograms()).find((p) => p.id === id);
  if (!program) return;
  await store.saveProgram({ ...program, published });
  refreshSite();
}

export async function removeProgram(id: string) {
  await requireAdmin();
  await store.deleteProgram(id);
  refreshSite();
}

export async function saveSettings(_: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await store.saveSettings(parsed.data);
  refreshSite();
  return { ok: true, savedAt: Date.now() };
}
