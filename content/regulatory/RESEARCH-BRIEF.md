# Research brief: jurisdiction maps for the Global Banking Regulatory Training library

You are building the regulatory map for ONE jurisdiction of the learningimpact.pk library of conventional banking
compliance training. Accuracy matters more than volume.

## Output

Write `content/regulatory/jurisdictions/<code>.json` (code = ISO 3166-1 alpha-2, lower case). It must pass
`pnpm -s content:check content/regulatory/jurisdictions/<code>.json` (run from /home/user/learning-impact).
The schema is in `src/lib/regulatory/schema.ts`; the 202 master programs are in `content/regulatory/PROGRAMS.md`.

Shape:

```json
{
  "code": "sg", "name": "Singapore", "region": "Asia", "kind": "country",
  "summary": "Who regulates banks and what the training landscape looks like (own words, 60-900 chars).",
  "regulators": [{ "name": "Monetary Authority of Singapore", "abbr": "MAS", "role": "...", "url": "https://www.mas.gov.sg/" }],
  "reviewed": "2026-11-08",
  "programs": [
    {
      "program": 1,
      "title": "Singapore | MAS Notice 626 AML/CFT Compliance",
      "classification": "mandatory-explicit",
      "frequency": ["induction", "periodic"],
      "audience": ["All bank employees", "..."],
      "why": "Own words: what the rule requires and why this training exists.",
      "references": [{ "title": "...", "issuer": "MAS", "url": "https://...", "provision": "Paragraph ...", "note": "own words", "effective": "2024-..." }]
    }
  ],
  "notes": ["Recent or upcoming changes, own words."]
}
```

## Classification rules (strict)

- `mandatory-explicit`: the law/regulation/notice/directive itself expressly requires training or awareness for staff.
- `mandatory-role`: an express training or qualification requirement that applies only to certain roles/functions
  (e.g. board members, MLRO, certified staff, sales staff).
- `competence`: the regulator requires staff/management to be competent, knowledgeable, fit and proper, or
  requires a framework (e.g. a cyber or conduct framework) whose effective operation implies awareness,
  but no separate training is prescribed.
- `recommended`: good practice; no specific obligation verified. References may be empty or point to guidance.

Frequency: `annual` only if a source states yearly/annual; `induction` if training on joining/before starting
a role is stated; `periodic` if "ongoing", "regular" or "periodic" is stated; `role` for role-specific; otherwise
`unspecified`. Several are allowed (max 3).

## Verification rules (critical)

1. Use official sources only for references: the regulator's own site, the government gazette or legislation portal
   (e.g. legislation.gov.uk, ecfr.gov, legislation.gov.au, sso.agc.gov.sg, uaelegislation.gov.ae), or the FIU.
2. Every reference URL must be one you actually opened with WebFetch or saw in a search result from that official
   domain. Prefer stable landing pages over deep PDF links if the PDF link is uncertain.
3. Never invent circular numbers, section numbers or dates. If you cannot confirm a provision number, leave
   `provision` out. If you cannot verify a training obligation, do not classify it as mandatory.
4. Use the latest effective position as of November 2026. Laws get replaced (e.g. new AML laws); check for
   repeal/replacement and mention in `notes`.
5. Write `why`, `note` and `summary` in your own words. Do not copy regulator text.
6. Conventional banking only: exclude Islamic banking, Islamic finance, Shari'ah governance, AAOIFI, Takaful.

## Scope

Assess 25-45 of the 202 programs, prioritising, in this order:
1. Financial crime: 1-17, 22-26, 28, 29 (AML/CFT/CPF, CDD/EDD, PEPs, sanctions, STR, record keeping, roles, bribery, fraud).
2. Conduct and customer protection: 38, 51-61, 64, 66, 67, 70 and any qualification regime for staff.
3. Governance/accountability: 34-37, 40, 50.
4. Data, cyber and resilience: 71-74, 77, 83, 84, 90, 91, 112, 114.
5. Workplace: 159, 160 (where a statute requires employer training/awareness), 163.
6. Tax reporting: 180, 181 where banks have obligations.

Several programs may share the same references. One program per entry; don't list a program twice.
Titles: "<Country> | <regulator/law-specific title>"; don't use generic titles where a specific regime exists.

When finished, report back: the file path, the number of programs per classification, the 5-8 most important
references (title + URL), anything you could not verify, and recent changes you found. Keep the report short.
