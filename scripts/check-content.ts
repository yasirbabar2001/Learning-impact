// Validates every course in content/courses (or the files given as arguments).
// Run: pnpm content:check [content/courses/x.json ...]
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { courseSchema, qualityProblems } from "../src/lib/courses/schema.ts";
import { jurisdictionProblems, jurisdictionSchema } from "../src/lib/regulatory/schema.ts";

const dir = path.join(process.cwd(), "content", "courses");
const files = process.argv.slice(2).length ? process.argv.slice(2).filter((f) => !f.includes("regulatory")) : readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
let failed = false;

for (const file of files) {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`✗ ${file}: not valid JSON (${(err as Error).message})`);
    failed = true;
    continue;
  }
  const parsed = courseSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`✗ ${file}:`);
    for (const issue of parsed.error.issues.slice(0, 30)) console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    failed = true;
    continue;
  }
  const c = parsed.data;
  const problems = qualityProblems(c);
  if (path.basename(file, ".json") !== c.slug) problems.push(`File name must be ${c.slug}.json`);
  if (problems.length) {
    console.error(`✗ ${file}:`);
    problems.forEach((p) => console.error(`   ${p}`));
    failed = true;
  } else {
    const cards = c.sessions.reduce((n, s) => n + s.cards.length, 0);
    const words = JSON.stringify(c.sessions.map((s) => s.cards)).split(/\s+/).length;
    console.log(`✓ ${c.slug}: ${c.sessions.length} sessions, ${cards} cards (~${words} words), ${c.sessions.length * 10} quiz + ${c.exam.bank.length} exam questions`);
  }
}
// Regulatory library maps (only when no specific files were given, or when a map file is given).
const jdir = path.join(process.cwd(), "content", "regulatory", "jurisdictions");
const courseSlugs = new Set(readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
const maps = process.argv.slice(2).length
  ? process.argv.slice(2).filter((f) => f.includes("regulatory"))
  : (() => {
      try {
        return readdirSync(jdir).filter((f) => f.endsWith(".json")).map((f) => path.join(jdir, f));
      } catch {
        return [];
      }
    })();
for (const file of maps) {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`✗ ${file}: not valid JSON (${(err as Error).message})`);
    failed = true;
    continue;
  }
  const parsed = jurisdictionSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`✗ ${file}:`);
    for (const issue of parsed.error.issues.slice(0, 30)) console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    failed = true;
    continue;
  }
  const j = parsed.data;
  const problems = jurisdictionProblems(j);
  if (path.basename(file, ".json") !== j.code) problems.push(`File name must be ${j.code}.json`);
  j.programs.forEach((m) => m.quest && !courseSlugs.has(m.quest) && problems.push(`program ${m.program}: quest "${m.quest}" does not exist yet.`));
  if (problems.length) {
    console.error(`✗ ${file}:`);
    problems.forEach((p) => console.error(`   ${p}`));
    failed = true;
  } else {
    const by = (c: string) => j.programs.filter((m) => m.classification === c).length;
    console.log(`✓ map ${j.code} (${j.name}): ${j.programs.length} programs assessed, ${by("mandatory-explicit")} explicit, ${by("mandatory-role")} role-based, ${by("competence")} competence, ${by("recommended")} recommended`);
  }
}
process.exit(failed ? 1 : 0);
