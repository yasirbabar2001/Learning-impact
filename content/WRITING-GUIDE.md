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
