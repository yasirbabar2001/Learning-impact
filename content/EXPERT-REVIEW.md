# Content review checklist (batch 1)

All four courses were written in original wording and pass `pnpm content:check`. Before selling a certification,
ask a subject-matter expert to confirm the points below (they are the statements most likely to change over time or
to depend on local regulation). Edit `content/courses/<slug>.json`, run `pnpm content:check`, rebuild and upload.

## AML/CFT Compliance Professional (`aml-cft`) — needs a compliance officer's review
1. FATF background: set up by the G7 in 1989; 40 Recommendations (revised 2012); 11 Immediate Outcomes; Pakistan assessed via the APG.
2. Pakistan grey-list history: 2012–2015 and June 2018 to October 2022; 27-item (TF) plan and the 2021 7-item (ML) plan; on-site visit before removal.
3. 2019–2022 reforms: DNFBP supervision (real estate agents, jewellers); 2020 AMLA amendments (penalties, DNFBP supervision, enforcement).
4. AMLA 2010: ML offence, FMU, reporting-entity duties (CDD, record keeping, STR/CTR, no tipping off), good-faith protection; tax offences as predicates; self-laundering.
5. ATA 1997: TF offence; First Schedule (organisations) and Fourth Schedule (persons) published by NACTA; freezing duties.
6. UNSC designations implemented through orders under the United Nations (Security Council) Act 1948; list changes via the Ministry of Foreign Affairs.
7. Supervisors: SBP (banks, MFBs, DFIs, exchange companies, PSOs/EMIs), SECP (securities, insurance, NBFCs, modarabas; beneficial ownership), FBR (real estate, precious metals and stones), professional bodies for accountants.
8. STRs "promptly" via goAML, including attempted transactions, no minimum amount.
9. Record retention of at least 10 years (quiz `aml-s3-q10` depends on this) — confirm the exact starting points.
10. CDD: biometric/Verisys at onboarding, expired-CNIC instructions, simplified due diligence for tiered basic accounts; PEP treatment (foreign always EDD, domestic risk-based) — confirm whether SBP/SECP require EDD for all PEPs.
11. Frozen funds: profit credited stays frozen; basic-expense access only with competent-authority authorisation.
12. Freezing "without delay"; proliferation-financing risk assessment (FATF R.1, 2020 amendment).
13. Raast described as SBP's instant payment system; Export Control Act 2004 via the Strategic Export Control Division.
14. AML/CFT penalties imposed and often published by supervisors.
Deliberately general (learners are told to check current circulars): CTR threshold, beneficial-ownership percentage, freeze-report timelines, review periods, UN regime status, virtual-asset rules.

## Agentic AI for Business (`agentic-ai`)
1. Pakistan's National Artificial Intelligence Policy described as approved in 2025 — confirm.
2. Personal data protection bill described as not yet enacted — if enacted, update the s4 regulatory card and exam question `ai-x37`.
3. SBP technology-risk, cybersecurity and outsourcing/cloud frameworks named generally; check for any AI-specific SBP guidance or sandbox.
4. SECP/PTA data obligations stated generally.
5. General cost statements (output tokens cost more than input; caching and batch discounts) and the tokens-per-character rule of thumb (`ai-x1`).

## Customer Experience (CX) Professional (`customer-experience`)
1. SBP complaint-handling and Fair Treatment of Customers expectations (s5) — described generally, no timelines.
2. Escalation routes: Banking Mohtasib after the bank's own process (exam `cx-x44` relies on this), Federal Insurance Ombudsman, PTA after the operator.
3. Dormant-account example (s3, pension credits) — check against current SBP dormancy rules.
4. Measurement conventions: CSAT as top-two-box, CES on the 7-point "made it easy" scale.

## Advanced Leadership (`advanced-leadership`)
1. Descriptions of named frameworks: Cynefin (incl. "clear"/"confusion"), Kotter, ADKAR, Heifetz, Maister's trust equation, Cohen & Bradford's currencies, Cialdini's seven principles, Schein.
2. Research claims: Edmondson's hospital-teams finding; Hackman on team conditions vs leader style.
3. WHO burnout definition (occupational phenomenon, three dimensions).
4. Judgement-call exam items `al-x2`, `al-x20`, `al-x33`: confirm each has one defensible answer.
