// Validates every course in content/courses (or the files given as arguments).
// Run: pnpm content:check [content/courses/x.json ...]
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { courseSchema, qualityProblems } from "../src/lib/courses/schema.ts";

const dir = path.join(process.cwd(), "content", "courses");
const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
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
process.exit(failed ? 1 : 0);
