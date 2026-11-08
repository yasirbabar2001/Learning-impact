# Phase 2 brief: research AND verify one jurisdiction map in a single pass

Read first: `content/regulatory/RESEARCH-BRIEF.md` (output shape, classification and frequency rules, scope and
priorities, conventional banking only) and `content/regulatory/VERIFY-BRIEF.md` (how to fetch with curl, what
`checked` means, what to do with blocked hosts). Both apply in full. Look at an existing verified map such as
`content/regulatory/jurisdictions/au.json` for the expected quality.

Workflow:
1. Use WebSearch (mode "standard") to find official URLs (regulator, FIU, gazette, legislation portal).
   WebFetch does NOT work in this session; open pages only with curl as VERIFY-BRIEF describes (honest user agent,
   no browser impersonation, no mirrors/caches/archive sites).
2. For each obligation, open the official text and confirm it. Only then set `"checked": "2026-11-08"` on the
   reference. Prefer laws and regulator instruments over news or summaries.
3. A program may be classified `mandatory-explicit` or `mandatory-role` only if at least one of its references is
   checked and the opened text expressly supports the training/role duty. If the only support is a page you could
   not open, classify it at most `competence` and say in `why` that the official text could not be opened.
4. Check whether laws have been replaced or amended recently (2024-2026) and record that in `notes`.
5. Assess 25-45 programs (priorities as in RESEARCH-BRIEF). Do not set any `quest` field.

Write only `content/regulatory/jurisdictions/<code>.json`, validate with
`pnpm -s content:check content/regulatory/jurisdictions/<code>.json` (run from /home/user/learning-impact), and
report briefly: counts per classification, references checked / not checked, hosts that block automated access,
the 5-8 key checked references (title + URL), recent changes, and what you could not verify.
