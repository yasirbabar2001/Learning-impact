# Writing a Global Banking Regulatory Training quest

These quests are country-specific compliance training for conventional bank staff. They use exactly the same
course format as every other quest (`src/lib/courses/schema.ts`), so read `content/WRITING-GUIDE.md` in full first
(structure, interactive format v2, required cards per session, tone). This guide adds the regulatory rules.

## Accuracy first (non-negotiable)

1. Your only sources of regulatory fact are the jurisdiction map you are given
   (`content/regulatory/jurisdictions/<code>.json`) and official pages you open yourself with WebFetch/WebSearch
   on official domains (regulator, FIU, gazette, legislation portal). If a fact is not in either, leave it out.
2. Never invent section numbers, circular numbers, thresholds, deadlines, penalty amounts, form names or dates.
   When you state a number (e.g. a record-keeping period, a reporting deadline, a threshold), it must come from a
   source you checked. If unsure, describe the duty without the number ("within the time the regulation sets").
3. Do not label anything "mandatory" unless the map classifies it so. Use the map's classification and frequency.
4. Write everything in your own words. Never copy regulator, law, AAOIFI or bank text (short names of laws and
   official terms such as "suspicious transaction report" are fine).
5. Conventional banking only: no Islamic banking, Islamic finance, Shari'ah governance, AAOIFI or Takaful content.
6. Real cases: use only well-documented public enforcement actions or court cases (regulator press releases,
   court judgments). Name the regulator and year; keep amounts only if you verified them. Fictional scenes are
   clearly the quest's own story with its own cast.
7. Do not duplicate the existing general quest `content/courses/aml-cft.json` (international FATF-level
   AML/CFT). Your quest must be about the country's own laws, regulators, reporting channels, sanctions lists,
   roles and enforcement, with FATF only as brief context.

## Format for regulatory quests

- `category`: "Banking & Compliance". `level`: usually "Intermediate". `hours`: 4-8.
- `title`: the country-specific title, e.g. "Singapore | MAS Notice 626 AML/CFT Compliance" (max 90 chars).
- `slug`: `<code>-<topic>`, e.g. `sg-mas-aml-cft`.
- 4 or 5 sessions (stages); each session follows every rule of the writing guide (story first, 2+ diagrams,
  scenario, explainer, 2+ different interactive games, 2+ checks, keypoints, max 40% reading cards, 10-question quiz).
- Exam: `questionsPerAttempt` 30, `passMark` 75, `minutes` 45, bank of 40-45 questions (difficulty rules as in the
  checker: ≥70% difficulty 3+, ≥35% difficulty 4+). Spread correct answers across A-D (15-35% each, also across all
  session quizzes combined) and don't make the right answer the longest option more than 45% of the time.
- Question ids: prefix with the slug's country code and topic, e.g. `sg-aml-s1-q1`, `sg-aml-x1` (globally unique).
- `quest.cast`: 3-5 characters who work at a fictional bank in that country (names and settings that fit the
  country; avoid real bank names for the fictional bank).
- Last session: assessment readiness — the institution's programme, roles (e.g. compliance officer/MLRO), audit,
  record keeping, and a recap of the regulator's expectations, so the final exam has something to test.
- `jurisdiction` block (required):

```json
"jurisdiction": {
  "code": "sg",
  "programs": [1, 2, 4, 5, 15],
  "classification": "mandatory-explicit",
  "frequency": ["induction", "periodic"],
  "regulators": ["Monetary Authority of Singapore (MAS)", "Suspicious Transaction Reporting Office (STRO)"],
  "references": [ { "title": "...", "issuer": "MAS", "url": "https://...", "provision": "..." } ],
  "reviewed": "2026-11-08"
}
```

  `programs` lists the master program numbers (content/regulatory/PROGRAMS.md) the quest genuinely covers.
  `classification`/`frequency` come from the map entry of the main program. `references` are copied from the map
  (plus any official source you verified yourself).

- In `description`, say which regulator and laws it is based on, who must take it and why, and include one
  sentence that it builds knowledge and does not replace the institution's own policies.

## Check

Run `pnpm -s content:check content/courses/<slug>.json` from /home/user/learning-impact until it passes.
Then add `"quest": "<slug>"` to each program entry in the jurisdiction map that the quest covers, and run
`pnpm -s content:check` (no arguments) to confirm the map still passes.
