# Writing a Learning Impact certification course

Each course is a **quest**: a short story frame, 5 sessions ("stages" on the quest map), a scored SCORM test of
10 questions after each session, and a tough timed final exam ("the final boss") drawn from a question bank.

- File: `content/courses/<slug>.json`, matching `src/lib/courses/schema.ts`. Check with `pnpm content:check`.
- Audience: **international**. Working professionals anywhere in the world (banks, telecoms, consumer goods,
  healthcare, technology, public sector, services). Learning Impact is based in Pakistan but the portal serves a
  global audience: see "International scope (v3)" below.
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
mission) in story cards. International workplace realism (see below). Original wording only.


---

# International scope (v3) — required

The portal is an **international** site. Content must work for a learner in London, Dubai, Singapore, Nairobi,
Toronto, São Paulo, Kuala Lumpur, Riyadh or Karachi alike.

- **Story world:** a fictional organisation that operates internationally (several countries or a regional hub).
  Cast of 4–5 people with names from different regions (e.g. a mix of South Asian, Arab, East Asian, African,
  European, Latin American names). Settings move between cities around the world. Pakistan may appear as one of
  several locations, never as the default frame.
- **Money:** USD by default (`USD 2.4m`), or the local currency of the city a scene is set in (GBP, EUR, AED, SGD…).
  No PKR unless a scene is explicitly set in Pakistan.
- **Laws and regulation:** teach the **international standard or principle first** (FATF Recommendations, Basel
  Committee, ILO conventions, OECD guidelines, UN Guiding Principles, ISO standards, IFRS/ISSB, GHG Protocol,
  NIST/ISO 27001, GDPR as a widely copied model, etc.), then illustrate with **examples from several
  jurisdictions** (e.g. US, UK, EU, UAE, Singapore, India, Pakistan, Saudi Arabia, Kenya). Always tell learners to
  check the rules where they work. Do not invent precise thresholds, rates or deadlines; state only what is
  certain and widely documented.
- **Real-world examples are required:** every session includes **at least two real, well-documented cases**
  (companies, institutions or events), as `example` cards titled `Real case: …`, as the basis of a `scenario`, or in
  `stats` diagrams. Use only facts that are widely reported and settled (regulator findings, court outcomes,
  official reports, company statements), give the year, round figures ("about USD 2bn"), and describe them in
  your own words. No speculation, no allegations presented as fact, nothing defamatory. Good sources of cases:
  enforcement actions, public inquiries, well-known business-school-style turnarounds and failures.
- Real company names are allowed **only** in real cases. The story world stays fictional.
- Quiz and exam questions test international principles and practice; a question may use a named jurisdiction
  when the course teaches that jurisdiction's example.
