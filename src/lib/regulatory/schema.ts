import { z } from "zod";

/**
 * Global Banking Regulatory Training library: one JSON map per country or regional jurisdiction in
 * content/regulatory/jurisdictions/<code>.json, checked by `pnpm content:check`.
 *
 * A map records, for each of the 202 master programs that has been assessed for that jurisdiction, how strongly
 * the regulator requires the training and the official sources behind that view. Programs that are not listed
 * have not been assessed yet; nothing is labelled mandatory without an official reference.
 */

export const REGIONS = ["Asia", "Middle East", "Europe", "North America", "South America", "Africa", "Oceania"] as const;

export const CLASSIFICATIONS = ["mandatory-explicit", "mandatory-role", "competence", "recommended"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  "mandatory-explicit": "Mandatory – Explicit",
  "mandatory-role": "Mandatory – Role-Based",
  competence: "Regulatory Competence Requirement",
  recommended: "Recommended",
};
export const CLASSIFICATION_HELP: Record<Classification, string> = {
  "mandatory-explicit": "The law or regulation expressly requires training or awareness.",
  "mandatory-role": "Training is required for particular job roles or regulated functions.",
  competence: "The regulator requires competence or knowledge but does not prescribe a separate course.",
  recommended: "Good banking practice; no specific training obligation has been verified.",
};

export const FREQUENCIES = ["annual", "induction", "periodic", "role", "unspecified"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  annual: "Annual",
  induction: "Initial / induction",
  periodic: "Periodic / ongoing",
  role: "Role-based",
  unspecified: "No frequency specified",
};

const text = (min = 1, max = 400) => z.string().trim().min(min).max(max);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const referenceSchema = z.object({
  /** Official name of the law, regulation, notice, circular or guidance, exactly as the issuer names it. */
  title: text(5, 240),
  issuer: text(2, 120),
  /** Official source (regulator, government gazette or legislation portal). */
  url: z.url(),
  /** The section, paragraph or regulation number that carries the obligation, when known. */
  provision: text(2, 160).optional(),
  /** In our own words: what the provision requires. Never a copied passage. */
  note: text(10, 500).optional(),
  /** Date it took effect, if relevant (YYYY-MM-DD or YYYY). */
  effective: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/).optional(),
});

export const regulatorSchema = z.object({
  name: text(3, 140),
  abbr: text(2, 20).optional(),
  role: text(10, 300),
  url: z.url(),
});

export const mappingSchema = z.object({
  /** Number in the master catalogue (1-202). */
  program: z.number().int().min(1).max(202),
  /** Country-specific title, e.g. "Pakistan | AML/CFT/CPF Regulatory Compliance". */
  title: text(5, 120),
  classification: z.enum(CLASSIFICATIONS),
  frequency: z.array(z.enum(FREQUENCIES)).min(1).max(3),
  audience: z.array(text(3, 120)).min(1).max(6),
  /** Why the training is needed here, in our own words. */
  why: text(30, 700),
  references: z.array(referenceSchema).max(6),
  /** Slug of the quest that teaches it, when one exists. */
  quest: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
});

export const jurisdictionSchema = z.object({
  /** ISO 3166-1 alpha-2 in lower case, or a short code for regional bodies (eu, bceao, beac). */
  code: z.string().regex(/^[a-z]{2,6}$/),
  name: text(2, 60),
  region: z.enum(REGIONS),
  kind: z.enum(["country", "regional"]).default("country"),
  /** For regional jurisdictions: the member countries it covers. */
  members: z.array(text(2, 60)).max(40).optional(),
  summary: text(60, 900),
  regulators: z.array(regulatorSchema).min(1).max(10),
  /** When the map was last checked against official sources. */
  reviewed: isoDate,
  programs: z.array(mappingSchema).max(202),
  /** Recent or upcoming changes worth knowing (own words). */
  notes: z.array(text(10, 500)).max(10).default([]),
});

export type Reference = z.infer<typeof referenceSchema>;
export type Regulator = z.infer<typeof regulatorSchema>;
export type Mapping = z.infer<typeof mappingSchema>;
export type Jurisdiction = z.infer<typeof jurisdictionSchema>;

/** Rules the schema cannot express. */
export function jurisdictionProblems(j: Jurisdiction): string[] {
  const problems: string[] = [];
  const seen = new Set<number>();
  for (const m of j.programs) {
    if (seen.has(m.program)) problems.push(`${j.code}: program ${m.program} is listed twice.`);
    seen.add(m.program);
    if (m.classification !== "recommended" && m.references.length === 0)
      problems.push(`${j.code}: program ${m.program} is "${m.classification}" but has no official reference.`);
  }
  if (j.kind === "regional" && !j.members?.length) problems.push(`${j.code}: a regional jurisdiction must list its member countries.`);
  return problems;
}
