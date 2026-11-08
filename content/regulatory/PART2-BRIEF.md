# Part 2 quest brief (common to every writer)

Write ONE new quest in /home/user/learning-impact (file `content/courses/<slug>.json`).

Read first, in this order:
1. content/regulatory/QUEST-GUIDE.md (rules for regulatory quests; accuracy rules are non-negotiable)
2. content/WRITING-GUIDE.md (course format, interactive card rules, tone)
3. src/lib/courses/schema.ts (exact JSON schema and the quality checker)
4. The country map named in your task (content/regulatory/jurisdictions/<code>.json). Specific provisions,
   numbers, deadlines and thresholds may come only from references marked `"checked"` or from official texts you
   open yourself with curl as described in content/regulatory/VERIFY-BRIEF.md (WebFetch does not work here).
5. The existing quests for the same country (content/courses/<code>-*.json) and the general quests
   (content/courses/customer-experience.json, it-infrastructure.json, aml-cft.json) — do not duplicate their
   content; your quest is about the country's own rules for your topic.

Format: 5 stages, exam per guide (30 per attempt, pass 75, 45 min, bank of 40-45, difficulty mix as the checker
requires). Correct answers spread A-D; the correct option must NOT be the longest in more than 45% of questions
(write distractors of similar length from the start). Question ids prefixed with your quest's short prefix (given
below), globally unique. Fictional bank and a cast that fits the country. Real cases only when confirmed on an
official site you open (regulator press releases, enforcement notices, court judgments); otherwise fictional.
Conventional banking only; no Islamic banking/finance content.

`jurisdiction` block: code, the master programs (max 15) the quest genuinely covers, classification and
frequency taken from the map entry of the quest's main program, regulators, references (copied from the map plus
official texts you checked yourself, each with `checked` only if you or the map opened it), reviewed "2026-11-08".

Build the JSON with Python scripts in /tmp/claude-0/<slug>/ (not in the repo). Iterate until
`pnpm -s content:check content/courses/<slug>.json` passes. **Do not edit any jurisdiction map or any other file**
(other writers work in parallel); instead list in your report the program numbers that should link to your quest.

Report briefly: stages (one line each), card/question counts, references used (checked or not), real cases with
URLs, program numbers to link, and facts you deliberately kept general.
