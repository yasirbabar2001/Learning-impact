import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { regulatoryCatalog, type CatalogEntry } from "../courses/catalog";
import { all } from "../db";
import { OWNER_EMAILS } from "../portal/auth";
import { programByNo, PROGRAMS } from "./programs";
import { CLASSIFICATIONS, jurisdictionSchema, REGIONS, type Classification, type Jurisdiction, type Mapping } from "./schema";

let loaded: Map<string, Jurisdiction> | null = null;

/** Reads and validates content/regulatory/jurisdictions/*.json once per server process. */
function maps(): Map<string, Jurisdiction> {
  if (loaded && process.env.NODE_ENV === "production") return loaded;
  const map = new Map<string, Jurisdiction>();
  const dir = path.join(process.cwd(), "content", "regulatory", "jurisdictions");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  for (const f of files) {
    try {
      const parsed = jurisdictionSchema.safeParse(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
      if (parsed.success) map.set(parsed.data.code, parsed.data);
      else console.error(`Jurisdiction ${f} is invalid and was skipped:`, parsed.error.issues.slice(0, 3));
    } catch (err) {
      console.error(`Jurisdiction ${f} could not be read`, err);
    }
  }
  loaded = map;
  return map;
}

export const jurisdictions = () => [...maps().values()].sort((a, b) => a.name.localeCompare(b.name));
export const jurisdiction = (code: string) => maps().get(code) ?? null;

/** Regions in display order, each with its jurisdictions (regional bodies after countries). */
export function libraryTree() {
  const js = jurisdictions();
  return REGIONS.map((region) => ({
    region,
    items: js.filter((j) => j.region === region).sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "country" ? -1 : 1)),
  })).filter((r) => r.items.length);
}

export type QuestStatus = { entry: CatalogEntry; trial: number; enrolled: number; completedStages: number; certified: number; examTaken: number; examPassed: number };

const NOT_ADMIN = (col: string) =>
  `${col} NOT IN (SELECT id FROM users WHERE is_admin = 1 OR lower(email) IN (${OWNER_EMAILS.map((e) => `'${e.replace(/'/g, "")}'`).join(",") || "''"}))`;

/** Learning and assessment status of every regulatory quest, keyed by slug. */
export function questStatuses(): Map<string, QuestStatus> {
  const entries = regulatoryCatalog();
  if (!entries.length) return new Map();
  const count = (sql: string) => new Map(all<{ k: string; n: number }>(sql).map((r) => [r.k, r.n]));
  const enrolled = count("SELECT course_slug AS k, COUNT(*) AS n FROM enrollments GROUP BY course_slug");
  const certified = count("SELECT course_slug AS k, COUNT(*) AS n FROM certificates WHERE revoked_at IS NULL GROUP BY course_slug");
  const stages = count(`SELECT course_slug AS k, COUNT(*) AS n FROM session_progress WHERE quiz_passed_at IS NOT NULL AND ${NOT_ADMIN("user_id")} GROUP BY course_slug`);
  const trial = count(
    `SELECT p.course_slug AS k, COUNT(DISTINCT p.user_id) AS n FROM session_progress p
     WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = p.user_id AND e.course_slug = p.course_slug) AND ${NOT_ADMIN("p.user_id")}
     GROUP BY p.course_slug`,
  );
  const exams = new Map(
    all<{ k: string; t: number; p: number }>(
      `SELECT a.course_slug AS k, COUNT(*) AS t, SUM(CASE WHEN a.passed = 1 THEN 1 ELSE 0 END) AS p
       FROM exam_attempts a WHERE a.submitted_at IS NOT NULL AND ${NOT_ADMIN("a.user_id")} GROUP BY a.course_slug`,
    ).map((r) => [r.k, r]),
  );
  return new Map(
    entries.map((entry) => [
      entry.slug,
      {
        entry,
        trial: trial.get(entry.slug) ?? 0,
        enrolled: enrolled.get(entry.slug) ?? 0,
        completedStages: stages.get(entry.slug) ?? 0,
        certified: certified.get(entry.slug) ?? 0,
        examTaken: exams.get(entry.slug)?.t ?? 0,
        examPassed: exams.get(entry.slug)?.p ?? 0,
      },
    ]),
  );
}

/** A jurisdiction's assessed programs grouped by classification, with the program's master title. */
export function groupedPrograms(j: Jurisdiction) {
  const groups = Object.fromEntries(CLASSIFICATIONS.map((c) => [c, [] as (Mapping & { master: string; category: string })[]])) as Record<
    Classification,
    (Mapping & { master: string; category: string })[]
  >;
  for (const m of [...j.programs].sort((a, b) => a.program - b.program)) {
    const p = programByNo(m.program);
    groups[m.classification].push({ ...m, master: p.title, category: p.category });
  }
  return groups;
}

/** Programs of the master catalogue not yet assessed for this jurisdiction. */
export const unassessed = (j: Jurisdiction) => {
  const done = new Set(j.programs.map((m) => m.program));
  return PROGRAMS.filter((p) => !done.has(p.no));
};
