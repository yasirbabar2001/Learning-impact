import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { all, now, one, run } from "../db";
import { courseSchema, type Course } from "./schema";

/** The 14 certifications on the roadmap. A topic becomes available once its content file exists and it is published. */
export const TOPICS = [
  { slug: "advanced-leadership", title: "Advanced Leadership", category: "Leadership", color: "#ff4d6d", tagline: "Lead leaders, strategy and change with confidence." },
  { slug: "agentic-ai", title: "Agentic AI for Business", category: "Technology", color: "#00c2ff", tagline: "Plan, govern and deploy AI agents that do real work." },
  { slug: "database-management", title: "Database Management & SQL", category: "Technology", color: "#7b61ff", tagline: "Design, query and protect the data your business runs on." },
  { slug: "it-infrastructure", title: "IT Infrastructure Management", category: "Technology", color: "#3d8bff", tagline: "Networks, cloud, resilience and operations, end to end." },
  { slug: "hr-operations", title: "HR Operations Excellence", category: "People & HR", color: "#ff9f1c", tagline: "Run payroll, policy, compliance and employee services flawlessly." },
  { slug: "talent-management", title: "Talent Management", category: "People & HR", color: "#ff4dd8", tagline: "Attract, grow and keep the people who make the difference." },
  { slug: "procurement-management", title: "Procurement Management", category: "Operations", color: "#9be15d", tagline: "Buy smarter: sourcing, negotiation, contracts and control." },
  { slug: "cxo-leadership-styles", title: "CXO Leadership Styles", category: "Leadership", color: "#f72585", tagline: "How top executives lead, decide and shape organisations." },
  { slug: "communication-skills", title: "Communication Skills for Professionals", category: "Professional Skills", color: "#ffbe0b", tagline: "Speak, write and present so people listen and act." },
  { slug: "aml-cft", title: "AML/CFT Compliance Professional", category: "Banking & Compliance", color: "#ffd23f", tagline: "Detect, report and prevent financial crime the right way." },
  { slug: "gender-sensitization", title: "Gender Sensitisation at Work", category: "People & HR", color: "#c77dff", tagline: "Build a fair, respectful and harassment-free workplace." },
  { slug: "customer-experience", title: "Customer Experience (CX) Professional", category: "Professional Skills", color: "#2ee59d", tagline: "Design and deliver experiences customers come back for." },
  { slug: "green-banking", title: "Green Banking & Sustainable Finance", category: "Banking & Compliance", color: "#38b000", tagline: "Climate risk, green products and sustainable finance in banking." },
  { slug: "conflict-management", title: "Conflict Management", category: "Professional Skills", color: "#fb5607", tagline: "Turn disagreement into better decisions and stronger teams." },
] as const;

export type Topic = { slug: string; title: string; category: string; color: string; tagline: string };
export type CatalogEntry = Topic & {
  /** Jurisdiction code for Global Banking Regulatory Training quests; null for the general certifications. */
  jurisdiction: string | null;
  course: Course | null;
  pricePkr: number;
  published: boolean;
  /** Available = content ready, published and priced. */
  available: boolean;
};

let loaded: Map<string, Course> | null = null;

/** Reads and validates content/courses/*.json once per server process. */
function courses(): Map<string, Course> {
  if (loaded && process.env.NODE_ENV === "production") return loaded;
  const map = new Map<string, Course>();
  const dir = path.join(process.cwd(), "content", "courses");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  for (const f of files) {
    try {
      const parsed = courseSchema.safeParse(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
      if (parsed.success) map.set(parsed.data.slug, parsed.data);
      else console.error(`Course ${f} is invalid and was skipped:`, parsed.error.issues.slice(0, 3));
    } catch (err) {
      console.error(`Course ${f} could not be read`, err);
    }
  }
  loaded = map;
  return map;
}

export function getCourse(slug: string): Course | null {
  return courses().get(slug) ?? null;
}

type SettingsRow = { slug: string; price_pkr: number; published: number };

const settingsMap = () => new Map(all<SettingsRow>("SELECT slug, price_pkr, published FROM course_settings").map((r) => [r.slug, r]));

function entry(t: Topic, jurisdiction: string | null, settings: Map<string, SettingsRow>): CatalogEntry {
  const course = getCourse(t.slug);
  const s = settings.get(t.slug);
  const pricePkr = s?.price_pkr ?? 0;
  const published = Boolean(s?.published);
  return { ...t, jurisdiction, course, pricePkr, published, available: Boolean(course && published && pricePkr > 0) };
}

/** The general professional certifications (the original roadmap). */
export function catalog(): CatalogEntry[] {
  const settings = settingsMap();
  return TOPICS.map((t) => entry(t, null, settings));
}

/**
 * Global Banking Regulatory Training quests: every course file that carries jurisdiction metadata.
 * New files appear here as drafts (unpublished, no price) until an administrator publishes them.
 */
export function regulatoryCatalog(): CatalogEntry[] {
  const settings = settingsMap();
  return [...courses().values()]
    .filter((c) => c.jurisdiction)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((c) => entry({ slug: c.slug, title: c.title, category: c.category, color: c.quest.color, tagline: c.tagline }, c.jurisdiction!.code, settings));
}

export function catalogEntry(slug: string): CatalogEntry | null {
  return catalog().find((c) => c.slug === slug) ?? regulatoryCatalog().find((c) => c.slug === slug) ?? null;
}

/** True for any certification slug (general or regulatory). */
export const isTopic = (slug: string) => TOPICS.some((t) => t.slug === slug) || Boolean(getCourse(slug)?.jurisdiction);

/** Every certification (for admin pickers). */
export const allTopics = (): { slug: string; title: string }[] => [
  ...TOPICS.map((t) => ({ slug: t.slug, title: t.title })),
  ...regulatoryCatalog().map((t) => ({ slug: t.slug, title: t.title })),
];

export function saveCourseSettings(slug: string, pricePkr: number, published: boolean) {
  const exists = one<{ slug: string }>("SELECT slug FROM course_settings WHERE slug = ?", slug);
  if (exists) run("UPDATE course_settings SET price_pkr = ?, published = ?, updated_at = ? WHERE slug = ?", pricePkr, published ? 1 : 0, now(), slug);
  else run("INSERT INTO course_settings (slug, price_pkr, published, updated_at) VALUES (?, ?, ?, ?)", slug, pricePkr, published ? 1 : 0, now());
}

export const formatPkr = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

export const courseMinutes = (c: Course) => c.sessions.reduce((n, s) => n + s.minutes, 0);
