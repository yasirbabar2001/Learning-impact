import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, STARTER_PROGRAMS } from "../defaults";
import type { Format, Program, RequestStatus, RequestType, SiteSettings, TrainingRequest } from "../types";
import { makeReference } from "./shared";
import type { Store } from "./types";

/**
 * Production store. Uses the service-role key on the server only; the tables have RLS
 * enabled with no policies, so the public anon key can never read requests.
 */
type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  outcomes: string[];
  duration: string;
  formats: string[];
  level: string;
  featured: boolean;
  published: boolean;
  sort: number;
};

type RequestRow = {
  id: string;
  reference: string;
  type: string;
  status: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  participants: number | null;
  format: string | null;
  preferred_date: string | null;
  program_slug: string | null;
  program_title: string | null;
  message: string;
  details: Record<string, string> | null;
  notes: string;
  created_at: string;
};

let client: SupabaseClient | null = null;
function db() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const toProgram = (r: ProgramRow): Program => ({ ...r, formats: r.formats as Format[] });

const toRequest = (r: RequestRow): TrainingRequest => ({
  id: r.id,
  reference: r.reference,
  type: r.type as RequestType,
  status: r.status as RequestStatus,
  company: r.company,
  contactName: r.contact_name,
  email: r.email,
  phone: r.phone,
  city: r.city,
  participants: r.participants,
  format: r.format as Format | null,
  preferredDate: r.preferred_date,
  programSlug: r.program_slug,
  programTitle: r.program_title,
  message: r.message,
  details: r.details ?? {},
  notes: r.notes,
  createdAt: r.created_at,
});

/** A fresh database has no settings row: seed the starter catalogue once. */
let seeded: Promise<void> | null = null;
function ensureSeeded() {
  seeded ??= (async () => {
    const existing = check(await db().from("settings").select("id").eq("id", 1).maybeSingle());
    if (existing) return;
    check(await db().from("programs").upsert(STARTER_PROGRAMS, { onConflict: "slug", ignoreDuplicates: true }));
    check(await db().from("settings").upsert({ id: 1, data: DEFAULT_SETTINGS }, { onConflict: "id", ignoreDuplicates: true }));
  })().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

export const supabaseStore: Store = {
  async listPrograms(opts) {
    await ensureSeeded();
    let q = db().from("programs").select("*").order("sort").order("title");
    if (opts?.publishedOnly) q = q.eq("published", true);
    return (check(await q) as ProgramRow[]).map(toProgram);
  },
  async getProgram(slug) {
    await ensureSeeded();
    const row = check(await db().from("programs").select("*").eq("slug", slug).maybeSingle()) as ProgramRow | null;
    return row ? toProgram(row) : null;
  },
  async saveProgram(input) {
    const { id, ...fields } = input;
    const res = id
      ? await db().from("programs").update(fields).eq("id", id).select().single()
      : await db().from("programs").insert(fields).select().single();
    if (res.error?.code === "23505") throw new Error("Another program already uses this URL slug.");
    return toProgram(check(res) as ProgramRow);
  },
  async deleteProgram(id) {
    check(await db().from("programs").delete().eq("id", id));
  },

  async createRequest(input) {
    const row = {
      reference: makeReference(),
      type: input.type,
      company: input.company,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      participants: input.participants,
      format: input.format,
      preferred_date: input.preferredDate,
      program_slug: input.programSlug,
      program_title: input.programTitle,
      message: input.message,
      details: input.details,
    };
    return toRequest(check(await db().from("requests").insert(row).select().single()) as RequestRow);
  },
  async listRequests() {
    const rows = check(await db().from("requests").select("*").order("created_at", { ascending: false }).limit(2000));
    return (rows as RequestRow[]).map(toRequest);
  },
  async getRequest(id) {
    const row = check(await db().from("requests").select("*").eq("id", id).maybeSingle()) as RequestRow | null;
    return row ? toRequest(row) : null;
  },
  async updateRequest(id, patch) {
    check(await db().from("requests").update(patch).eq("id", id));
  },
  async deleteRequest(id) {
    check(await db().from("requests").delete().eq("id", id));
  },

  async getSettings() {
    await ensureSeeded();
    const row = check(await db().from("settings").select("data").eq("id", 1).maybeSingle()) as { data: SiteSettings } | null;
    return { ...DEFAULT_SETTINGS, ...row?.data };
  },
  async saveSettings(settings) {
    check(await db().from("settings").upsert({ id: 1, data: settings, updated_at: new Date().toISOString() }));
  },
};
