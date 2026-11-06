# Writing a Learning Impact certification course

Each course is a **quest**: a short story frame, 5 sessions ("stages" on the quest map), a scored SCORM test of
10 questions after each session, and a tough timed final exam ("the final boss") drawn from a question bank.

- File: `content/courses/<slug>.json`, matching `src/lib/courses/schema.ts`. Check with `pnpm content:check`.
- Audience: working professionals in Pakistan's corporate sector (banks, telecoms, FMCG, pharma, public sector,
  services). Use local, realistic examples: Pakistani organisations described generically (never real company
  names), PKR amounts, cities, and diverse Pakistani names for people in scenarios.
- **Original wording only.** Never copy text from books, standards bodies, regulators or websites. Paraphrase and
  explain. Regulatory facts must be accurate; where details change often (thresholds, deadlines, circular numbers)
  either state them only if certain or describe them generally and tell learners to check the current circular.
- Plain, confident English. Short paragraphs. Markdown in `body` fields: **bold**, bullet lists, short tables.

## Structure (per course)
- 5 sessions (`s1`…`s5`), each 30–60 minutes, 12–18 cards, in a logical teaching order:
  `concept` (teach), `example` (realistic case), `tip` (practical advice or common mistake), `check`
  (ungraded knowledge check, 3–4 options, with explanation), `keypoints` (3–7 take-aways), `reflect` (prompt).
  Every session: ≥2 `check`, ≥1 `example`, 1 `keypoints` (usually last), 1 `reflect`.
  Concept/example bodies: substantive, 120–350 words each. Teach real, usable knowledge and frameworks.
- `quiz`: exactly 10 questions per session testing that session (difficulty mix 2–4; at least 4 scenario-based).
- `exam.bank`: 50 questions, **ordered by session**: questions 1–10 test s1, 11–20 s2 and so on (the results page uses
  this order to tell learners which stage to revise), `questionsPerAttempt` 40, `passMark` 75,
  `minutes` 60. TOUGH: ≥70% difficulty 3+, ≥35% difficulty 4–5; mostly scenario/application questions where
  every distractor is plausible. No trick wording, no "all/none of the above".
- Every question: exactly 4 options, one correct (`answer` = index 0–3), an `explanation` that says why the
  right answer is right and the best distractor is wrong. Vary which letter is correct (each of A–D 15–35%),
  and do NOT make the correct option the longest one most of the time (balance lengths).
- Question ids: `<slug-prefix>-s<N>-q<M>` for quizzes, `<slug-prefix>-x<M>` for the exam bank; all unique.
  Exam questions must not repeat quiz questions.

---

# Interactive format (v2) — required for every course

Learners must feel they are *playing* through a story, not reading a textbook. Every session is a sequence of
14–24 cards where **at most 40% are reading cards** (concept / example / tip) and those are short
(concept/example ≤ 1,100 characters ≈ 150–180 words, tip ≤ 700). Teach through the visual and interactive cards.

## The cast (`quest.cast`, 3–5 characters)
Recurring people who appear in story cards across all sessions, e.g. the learner's mentor, a colleague, a
difficult customer, a senior manager. Diverse Pakistani names, varied roles, genders and ages.
`look.skin` 1 (lightest) – 5 (darkest); `look.hair`: short | long | hijab | bun | curly | bald | beard;
`look.color`: clothing colour (hex). Use `"narrator"` as `who` for narration lines.

## Card types and when to use them
| type | use for | notes |
|---|---|---|
| `story` | opening hook of every session, plus turning points | 4–10 chat lines; realistic dialogue; end on a question or tension the session answers. `mood`: neutral, happy, worried, angry, thinking, proud |
| `explainer` | the core idea as a narrated mini-movie | 3–6 scenes; `icon` = one emoji; `narration` 1–3 spoken sentences (it is read aloud, so write for the ear) |
| `diagram` | any model, process, framework, comparison or number | kinds: `cycle` (3–6 steps that loop), `steps` (linear process), `pyramid` (top = first item), `matrix` (exactly 4 items TL,TR,BL,BR + `axes`), `funnel` (wide → narrow), `compare` (`headers` + rows with `left`/`right`), `timeline` (dated items, `value` = date/year), `stats` (big numbers: `value` like "68%" or "PKR 2.4m", with label + detail). Labels short (≤ 6 words), details ≤ 25 words |
| `scenario` | applying judgement | realistic dilemma; 3–4 choices; each `outcome` says what happens next and why; scores 2 (best) / 1 (partly right) / 0 (poor); exactly one 2 |
| `flip` | terms, definitions, myths vs facts | 4–8 cards; front = term/question, back = crisp answer |
| `sort` | classifying (e.g. red flag vs normal, high vs low risk) | 2–3 buckets, 6–10 items |
| `match` | linking concepts to examples/definitions | 4–6 pairs; right side ≤ 160 chars |
| `order` | sequences and procedures | 4–7 steps in the correct order (shuffled for the learner) |
| `check` | quick recall check with explanation | ≥ 2 per session |
| `concept` / `example` / `tip` | short reading where needed | punchy, bulleted, ≤ 180 words |
| `keypoints` | session summary, near the end | 3–6 items |
| `reflect` | personal application | last or second-to-last card |

## Required per session
≥1 `story` (first card), ≥1 `explainer`, ≥2 `diagram` (different kinds preferred), ≥1 `scenario`,
≥2 different interactive cards from `flip` / `sort` / `match` / `order`, ≥2 `check`, 1 `keypoints`, 1 `reflect`.
A good rhythm: story → explainer → diagram → check → concept → sort/match → story (turn) → scenario → diagram →
flip/order → check → example → keypoints → reflect. Vary it between sessions.

## Tone
Energetic, warm and motivating. Second person ("you"). Celebrate progress, use the quest frame (stages, the
mission) in story cards. Pakistani workplace realism (Karachi/Lahore/Islamabad offices, branches, WhatsApp, Raast,
CNIC, PKR), no real company names. Original wording only.
