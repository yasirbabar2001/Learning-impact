# Writing a Free & Premium course

These courses are free to start: the first three stages (Basic) are free and end with a free Certificate of
Completion. Learners who want more upgrade to Premium for PKR 5,000, which unlocks three Advanced stages, the final
exam and the verified Learning Impact certificate.

## Format

- One file: `content/courses/<slug>.json`, in exactly the format of the existing courses
  (read `content/courses/communication-skills.json` as the model and `src/lib/courses/schema.ts` for every field
  and limit). Check it with `pnpm -s content:check content/courses/<slug>.json` until it passes with no problems.
- Top level, besides the usual fields: `"freeStages": 3`, `"defaultPricePkr": 5000`, `"level": "Foundation"`,
  `"hours"` 6 to 8, and `"takeaways"`: exactly 5 items, 2 to 6 words each, at most 38 characters, no full stop,
  concrete skills the learner gains (e.g. "Write prompts that get results").
- **Six sessions** (`s1` to `s6`):
  - s1–s3 are **Basic (free)**: absolute beginners, practical, confidence-building, one clear win per stage.
  - s4–s6 are **Advanced (Premium)**: deeper, job-ready skills that are clearly worth paying for (workflows,
    portfolios, automation, professional standards). Make the step up visible.
- Each session: 14 to 18 cards and 10 quiz questions, meeting every rule `content:check` enforces (story opener,
  keypoints, 2+ diagrams, scenario, explainer, 2+ checks, 2+ different interactive cards, etc.).
- Exam: `questionsPerAttempt` 30, `passMark` 75, `minutes` 45, a bank of 40 to 44 questions covering all six
  stages, mostly difficulty 3+, answers spread over A–D, the correct option not usually the longest.
- `quest`: a friendly story set in Pakistan (Lahore, Karachi, Islamabad, Faisalabad, Peshawar…) with a cast of
  3 to 5 named characters, e.g. a student, a fresh graduate or a small-business owner and a mentor.

## Audience and tone

Students, fresh graduates, job seekers, small-business owners and office staff in Pakistan. Simple, warm English
(short sentences, everyday words), practical steps, local examples (rupees, local businesses and jobs), no jargon
without a plain explanation.

## Accuracy

- Teach skills, not fast-changing details. Do not state prices, fees, plan limits, user numbers or market statistics
  of any product or platform. Where something varies by plan, country or version, say so ("check the current
  terms on the platform").
- Product features: describe only well-established features in general terms, and say menus can move between
  versions. Keyboard shortcuts and formulas must be correct.
- Real cases only if they are well known and you are sure of the facts; otherwise use clearly fictional examples.
  Never invent statistics, quotes, studies or laws.
- Safety and ethics where relevant (privacy of data put into AI tools, copyright and licences, scams aimed at
  freelancers, honest reviews).
- Original wording only; no copying from any website or book. No Islamic finance content.

Do not edit any other file in the repository.
