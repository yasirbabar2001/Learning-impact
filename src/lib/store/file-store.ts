import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS, STARTER_PROGRAMS } from "../defaults";
import type { Program, SiteSettings, TrainingRequest } from "../types";
import { byProgramOrder, makeReference } from "./shared";
import type { Store } from "./types";

/**
 * File store: a single JSON file. Used for local development and on traditional hosting
 * (e.g. cPanel) where the disk is persistent; set DATA_DIR to a folder outside the app so
 * redeploys never touch it. Serverless hosts need the Supabase store instead.
 */
type Db = { programs: Program[]; requests: TrainingRequest[]; settings: SiteSettings };

const DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

let queue: Promise<unknown> = Promise.resolve();

let seeding: Promise<void> | null = null;

/** Creates the data file with the starter catalogue the first time it is needed. */
function ensureFile() {
  seeding ??= readFile(FILE, "utf8").then(
    () => undefined,
    () =>
      persist({
        programs: STARTER_PROGRAMS.map((p) => ({ ...p, id: randomUUID() })),
        requests: [],
        settings: DEFAULT_SETTINGS,
      }),
  );
  return seeding;
}

async function load(): Promise<Db> {
  await ensureFile();
  let raw: string;
  try {
    raw = await readFile(FILE, "utf8");
  } catch (err) {
    // The file was removed while the site was running: recreate it instead of failing every page.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    seeding = null;
    await ensureFile();
    raw = await readFile(FILE, "utf8");
  }
  const db = JSON.parse(raw) as Db;
  return { ...db, settings: { ...DEFAULT_SETTINGS, ...db.settings } };
}

async function persist(db: Db) {
  await mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, FILE);
}

/** Serialises read-modify-write cycles so concurrent requests cannot lose updates. */
function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const fileStore: Store = {
  async listPrograms(opts) {
    const { programs } = await load();
    return programs.filter((p) => !opts?.publishedOnly || p.published).sort(byProgramOrder);
  },
  async getProgram(slug) {
    const { programs } = await load();
    return programs.find((p) => p.slug === slug) ?? null;
  },
  saveProgram(input) {
    return mutate((db) => {
      const clash = db.programs.find((p) => p.slug === input.slug && p.id !== input.id);
      if (clash) throw new Error("Another program already uses this URL slug.");
      const existing = input.id ? db.programs.find((p) => p.id === input.id) : undefined;
      if (existing) {
        Object.assign(existing, input);
        return existing;
      }
      const created: Program = { ...input, id: randomUUID() };
      db.programs.push(created);
      return created;
    });
  },
  async deleteProgram(id) {
    await mutate((db) => {
      db.programs = db.programs.filter((p) => p.id !== id);
    });
  },

  createRequest(input) {
    return mutate((db) => {
      const created: TrainingRequest = {
        ...input,
        id: randomUUID(),
        reference: makeReference(),
        status: "new",
        notes: "",
        createdAt: new Date().toISOString(),
      };
      db.requests.push(created);
      return created;
    });
  },
  async listRequests() {
    const { requests } = await load();
    return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getRequest(id) {
    const { requests } = await load();
    return requests.find((r) => r.id === id) ?? null;
  },
  async updateRequest(id, patch) {
    await mutate((db) => {
      const found = db.requests.find((r) => r.id === id);
      if (found) Object.assign(found, patch);
    });
  },
  async deleteRequest(id) {
    await mutate((db) => {
      db.requests = db.requests.filter((r) => r.id !== id);
    });
  },

  async getSettings() {
    return (await load()).settings;
  },
  async saveSettings(settings) {
    await mutate((db) => {
      db.settings = settings;
    });
  },
};
