# Content review checklist

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

---

# Batch 2 (written by the course writers; please confirm before publishing)

## Communication Skills for Professionals (`communication-skills`)

1. **Mehrabian "7-38-55" (s1).** Taught as a misreading: the original studies looked at single words expressing feelings/attitudes with contradictory tone and facial expression. Please confirm the wording of the correction is accurate and fair.
2. **Five levels of listening (s1).** The pyramid (pretend, selective, attentive, active, empathic) is a commonly used teaching model, not a single authoritative standard. Check that it is presented acceptably.
3. **Cross-gender handshakes and eye contact in Pakistan (s1, exam x7).** Advice to let the other person offer a hand first and use a hand on the heart as an alternative; some staff lowering eyes with seniors as respect. These are generalisations; please confirm they suit the target audience.
4. **Plain-language guidance (s2).** "Average about 15–20 words per sentence" is a rule of thumb, not an official standard.
5. **Data and WhatsApp (s2, exam x15–x17).** The course deliberately avoids citing specific Pakistani data-protection or cybercrime provisions (the data-protection law's status may change). It teaches general good practice and "follow your company policy". An expert may wish to add a current legal reference.
6. **Numbering systems (s2).** 1 lakh = 100,000; 1 crore = 10 million; 1 arab = 100 crore = 1 billion. Please confirm "arab" is appropriate for the audience.
7. **Presentation planning figures (s3).** About 130 words a minute (typical range 120–150) and filling about 90% of the slot are planning heuristics taught as such, not research findings. "24pt or more" for slide text is a guide only. Quiz s3-q2 and exam x21 depend on these figures as given in the question.
8. **Nerves (s3).** Slow breathing with a longer exhale and "reframing anxiety as excitement" are presented as practical techniques. "Power posing" was deliberately left out because its research is contested.
9. **Meeting cost (s4).** PKR 2,000–3,000 average loaded hourly cost figures are stated as assumptions inside each question, not as market data.
10. **Feedback and conflict models (s4).** Situation–behaviour–impact and DESC (describe, express, specify, consequences) are explained in original wording. The four-style matrix (aggressive, assertive, passive-aggressive, passive) is a simplified teaching model.
11. **Influence principles (s5).** Reciprocity, commitment/consistency, social proof, authority, liking and scarcity are taught in original wording without attribution to a specific book. Ethos/logos/pathos are the classical appeals.
12. **High-context culture and Pakistani phrases (s5).** Descriptions of "dekhte hain", "InshAllah" and "ji, ji" are framed as tendencies, not rules. Please check that the tone is respectful, especially around "InshAllah".
13. **Time zones (s5, exam x46, s5-q7).** Pakistan UTC+5 with no daylight saving under current practice (it was briefly used around 2008–2009); Dubai UTC+4 all year; UK GMT/BST. Confirm Pakistan has not reintroduced daylight saving before publishing.
14. **Friday prayer timing (s5 stats card).** "Avoid Friday about 1–2:30 p.m." is approximate and varies by city and season.
15. **RAG definitions (s5).** Green/Amber/Red definitions (Amber = at risk but recoverable within the team's control; Red = off track or needs a leadership decision) are one common convention; organisations differ.

## Conflict Management (`conflict-management`)

1. **Five modes model (s2).** Attributed to Kenneth Thomas and Ralph Kilmann and described in original wording only. The instrument name (TKI) is not used. Please confirm the attribution wording is acceptable, given that the instrument is commercial.
2. **Escalation (s1).** The five-step "escalation ladder" is our own simplified teaching model. The reference to Friedrich Glasl (nine stages in three phases: win-win, win-lose, lose-lose) is from memory. Quiz s1-q9 tests it.
3. **Threat response and cooling time (s3).** "A meaningful break, often twenty minutes or more" is a commonly cited rule of thumb from relationship and physiology research, not a precise figure. Exam x30 relies on it. "Naming an emotion tends to reduce its intensity" (affect labelling) is stated as a tendency.
4. **"Three conversations" (s3).** The what happened / feelings / identity layers, the "third story", intent versus impact and contribution versus blame follow a well-known difficult-conversations framework, which the cards don't name. The wording is original. Please check this is acceptable without a citation.
5. **Interest-based negotiation (s4).** The four elements are credited to the Harvard Negotiation Project. BATNA, the reservation point and ZOPA are taught as standard. Note that the BATNA and walk-away figures (12% and 13%) are simplified for teaching.
6. **Workplace harassment law (s5).** The cards say Pakistan's 2010 Act (as amended, plus provincial versions) requires an inquiry committee and a code of conduct and lets complainants go to an Ombudsperson. They also tell learners to check the current federal or provincial law. Please confirm this is accurate after the 2022 amendments and the provincial acts, and that "Ombudsperson" is the right term.
7. **Formal grievance (s5).** The fair-process steps are general principles. There are no statutory time limits or section numbers on purpose, because grievance rights for "workmen" under the provincial standing-orders and industrial-relations laws differ by province. An expert may want to add one line on the statutory grievance route for workmen.
8. **Dispute clauses (s5).** "Negotiation, then mediation, then arbitration or court" is presented as typical practice, not a legal requirement.
9. **Cultural content (s5).** The cards treat hierarchy, "ji sir", izzat or face-saving, go-betweens and family-business dynamics as general tendencies. Please check that the tone avoids stereotyping, including the Lahore and Karachi banter in the story.
10. **All figures in the story are fictional:** the PKR 40m distributor sales, the margins, the penalty clause and the management-time costs. Noor Mithaas Foods and Shahrah Traders are invented names. Please confirm they don't match a real company.

## CXO Leadership Styles (`cxo-leadership-styles`)

#### Pakistan corporate governance (s4, quiz s4-q2/q3/q4/q6, exam x32/x33/x34/x40)
- The course describes the SECP Listed Companies (Code of Corporate Governance) Regulations only in general terms
  (2019 version as amended; learners are told to check the current version). Please confirm against the version in force:
  - minimum independent directors (taught only as "a minimum share"; x32 assumes 3 of 7 independents and 2 of 7 executives comply);
  - at least one female director (tested directly in s4-q6 and x32);
  - limit on executive directors; chair and CEO must be different people (s4-q2; also in Companies Act 2017);
  - audit committee of non-executive directors chaired by an independent director (s4-q3, check card);
  - an HR and remuneration committee is required;
  - board involvement in appointing and removing the CFO, company secretary and head of internal audit, and internal audit
    reporting functionally to the audit committee (s4-q4, x33);
  - director training, annual board evaluation, statement of compliance reviewed by the external auditor.
- Related-party transactions (steps diagram, x34): taught as declaration, arm's-length benchmarking, audit committee review,
  board decision without the interested director, disclosure, with "some cases need shareholders' approval". Please confirm
  this matches current Companies Act 2017 and code requirements.

#### Market disclosure (s5, quiz s5-q3, exam x43, check card)
- Taught generally: price-sensitive information disclosed promptly to PSX through its formal system before analysts or
  investors; insider trading prohibited; closed periods; corporate briefing sessions expected by the PSX rulebook (learners told
  to check the current rulebook). Please confirm the corporate-briefing requirement and wording.

#### Leadership models (s1, s2, s3)
- Six emotional-intelligence styles, situational leadership (directing/coaching/supporting/delegating mapped to competence and
  commitment), the full-range model (four I's, contingent reward, active/passive management by exception, laissez-faire),
  servant leadership and the "humility plus professional will" research are paraphrased without naming books or authors.
- The five-layer executive-team model (trust, conflict, commitment, accountability, results) and the decision-rights roles
  (recommend, input, agree, decide, execute) are described generically to avoid trademarked names.
- The clear/complicated/complex/chaotic framing (s3 explainer, s3-q8, x27) follows a well-known sense-making framework,
  described in original words.
- "Many acquisitions fail to create value for the buyer" is stated without a figure on purpose.

#### Calculations (all re-checked)
- s3 stats card: acquire EV = 0.25×8 + 0.5×2 + 0.25×(−6) = PKR 1.5bn; staged build EV = 1.25 + 1 − 0.25 = PKR 2.0bn.
- s3 check card: 0.4×500 + 0.6×(−200) = PKR +80m. s3-q5: 270 + 100 − 200 = PKR +170m.
- x24: A = 3 + 1.2 − 2.4 = PKR 1.8bn; B = 2.1 + 1.0 − 0.3 = PKR 2.8bn.

#### Story and examples
- Zarfeen Foods, Sunbloom Juices, Khyber Haulage and every case example (Lahore pharma, Karachi bank, cement producer,
  electronics distributor) are fictional. Please check no name collides with a real Pakistani company.

## Database Management & SQL (`database-management`)

#### Pakistan legal and regulatory context (s5)
- Timeline card and concept card describe the Constitution of 1973 (privacy and dignity provision, Article 14, paraphrased and not numbered in the card), PECA 2016 (unauthorised access offences) and "draft personal data protection bills, 2018 onward". Please confirm whether a personal data protection law has been enacted since; if it has, the s5 concept card, timeline card and exam questions db-x49 and db-x50 should name it.
- SBP, SECP and PTA rules are described only generally (technology governance, cyber security, outsourcing and cloud, confidentiality). No circular numbers or dates are given on purpose. Check that the wording "check current SBP rules on outsourcing and cloud, obtain the required approvals" in db-x49 matches current SBP practice.
- "Banking secrecy duties to customers" is stated generally, without citing a section.
- The CNIC record-retention point in db-x50 says "keep data for the retention period that rules require"; no period is stated.

#### Engine-specific technical points
- UNIQUE with several NULLs (s1 example card, db-s1-q8): most engines allow many NULLs in a UNIQUE column; SQL Server allows only one, so it needs a filtered unique index. The card carries a note to this effect.
- GROUP BY rule (s2 concept, db-s2-q10): some engines (for example PostgreSQL and MySQL with functional-dependency detection) accept a non-grouped column when it depends on a grouped primary key. The question therefore says "Falak's database engine rejects this query".
- Window functions cannot be filtered in WHERE (s3, db-s3-q5): true in standard SQL; a few platforms offer a QUALIFY clause. Not mentioned in the course.
- Leftmost-prefix rule (s4, db-s4-q2, db-x31): stated as "generally"/"in most engines"; some engines have skip-scan optimisations.
- Implicit conversion example (s4 sort card, db-x34): comparing a VARCHAR column with a number. The exact behaviour depends on data-type precedence in each engine. The course says it "typically" blocks a seek.
- Isolation levels (s4): "several engines default to read committed, others to repeatable read"; "phantoms possible under repeatable read in the standard" (InnoDB largely prevents them with gap locks). Snapshot or MVCC naming differs between engines (db-x37 uses the generic term).
- The s4 compare card on clustered and non-clustered indexes follows SQL Server and InnoDB terms, with a caption noting that some engines store tables as heaps.
- `INCLUDE` columns for covering indexes and `LIMIT` syntax are marked "where supported" or "syntax varies".
- TDE is described as also protecting backup files (true for common implementations; worth confirming for the engine Zarnigar's audience mostly uses).

#### Normalisation simplifications
- s1 concept: "a table whose key is a single column cannot have a partial dependency, so in 1NF it is automatically in 2NF". This is true for the primary key; strictly, 2NF considers all candidate keys. Simplified for an intermediate audience.
- db-x8 asks for the "highest normal form" and expects 1NF only, because of a partial dependency.

#### Figures in the story
- All numbers in the story and the stats cards (PKR 4.8bn report against a PKR 3.1bn ledger, 900 million transactions, 38 s down to 0.04 s, 1.3 million salary credits, 3.2 million customers) are fictional and belong to the fictional Zarnigar Bank. RPO 15 minutes and RTO 2 hours are presented as Falak's agreed targets, not as regulatory requirements.

#### Calculations (re-checked)
- s2 check: 10,000 x 3 + 40,000 x 2 = 110,000. s2 concept table: 50,000 x 4 + 20,000 = 220,000. db-x11: 60,000 / 3 = 20,000. db-x12: 3 + 1 + 1 + 2 + 1 = 8. db-x13: 500,000 x 2 + 300,000 = 1,300,000. db-x15: 100 - 40 - 15 = 45. db-x18: 48,213 - 4,812 = 43,401.
- s3 stats: 902 - 820 = 82, and 82 / 820 = 10%. db-s3-q2: DENSE_RANK of 900, 800, 800, 800, 700 gives 1, 2, 2, 2, 3. db-x21: running totals 5,000, 3,000, 6,000. db-x25: 0 rows (998 with NOT EXISTS). db-x26: 1,000 + 800 - 150 = 1,650.
- s4 story: 3,700 - 2 x 2,500 = -1,300. s5 check: 10:45 to 10:52 = 7 minutes. db-x41: 20 minutes. db-x42: log backups at 23:30 and 00:30 to 09:30 = 11 files. db-x44: 2,000 / 400 = 5 h, plus 1 h = 6 h. s5 story: 2:10 to 4:02 = 1 h 52 min.

## Gender Sensitisation at Work (`gender-sensitization`)

Course file: `content/courses/gender-sensitization.json`. The items below are taught (and in some cases tested) in general terms. Please confirm them against the current law and sources.

#### Harassment law (Session 3, exam x21–x30)
1. **Protection against Harassment of Women at the Workplace Act 2010:** the course says the complainant has never been limited to women ("a woman or man"), that a three-member inquiry committee with at least one woman is required (usually including senior management and an employees' representative), that a competent authority acts on findings, and that employers must adopt the Schedule's code of conduct and display it prominently. Please confirm the display-language wording. The course says "English and a language most staff understand (usually Urdu)".
2. **Inquiry time limits** are taught only as approximate figures: written charges "within a few days" (the 2010 text says 3 days, I believe), written defence "within about a week" (7 days), findings "within about a month" of starting (30 days), the competent authority's decision "within about a week", and the appeal to the ombudsperson "within the appeal period" (30 days, I believe). Please confirm these for the Act as amended in 2022, and check whether the provincial Acts differ.
3. **2022 amendment:** the course says it (a) widened "harassment" beyond sexual conduct to include discrimination on the basis of gender, (b) widened "employee" to more categories of working people (contract, temporary, some unpaid or non-traditional workers), and (c) widened "workplace" to places where work-related activity happens. Exam x22 and x30 and quiz s3-q3 test (a) and (c). Please check the exact amended definitions, and whether the amendment also changed who counts as a complainant.
4. **Penalties:** minor penalties are taught as censure, withholding promotion or increment for a period, and recovering compensation from the accused's pay. Major penalties are demotion, compulsory retirement, removal, dismissal and a fine. Exam x26 tests "recovery of compensation is a minor penalty". The course also says that action can be recommended against a complainant whose complaint is found false and made with bad intent, and that a non-compliant employer can be fined. No amounts are given.
5. **Routes:** the course says a complainant can go to the inquiry committee or directly to the ombudsperson (federal or provincial, depending on jurisdiction), and that either party can appeal the competent authority's decision to the ombudsperson. It does not mention further representation to the President or Governor. Please confirm the provincial picture for Punjab, Sindh, KP and Balochistan.
6. **Interim measures:** "move the accused, not the complainant, with her agreement" is presented as good practice, not as a statutory provision. Please check whether the amended Act provides for specific interim measures.

#### Other laws
7. **Penal Code:** the course says that since 2010 the Penal Code has specifically covered sexual harassment (the s.509 amendment). No section number or punishment is given.
8. **PECA 2016:** cyberstalking and misuse of intimate or edited images are cited as examples. Complaints are said to go to "the federal cybercrime investigation agency (this function has moved between agencies in recent years; check the current channel)". Please confirm the current agency name and reporting channel, and whether the 2025 PECA amendments affect this.
9. **Transgender Persons (Protection of Rights) Act 2018:** the course says it includes protection against discrimination in employment, that in 2023 the Federal Shariat Court found parts of it (mainly on determining gender identity) contrary to Islamic injunctions, and that appeals were filed. Quiz s5-q10 tests this. Please confirm the current status of the appeal and whether the employment non-discrimination provision is unaffected.
10. **Constitution:** Article 25 (equality; no discrimination on the basis of sex alone; special provision for women and children), Article 27 (no discrimination including on grounds of sex in appointments to the service of Pakistan), Article 34 (women's full participation in national life) and Article 37(e) (just and humane conditions of work and maternity benefits) are all paraphrased, and quiz/exam questions test them (s2-q4, s2-q5, x13, x14).

#### Leave, day-care and sector policy (Session 2)
11. **Maternity and paternity leave:** the course says only that labour law requires paid maternity benefits (now largely provincial after the 18th Amendment), and that recent federal legislation for Islamabad extended maternity leave and introduced paid paternity leave, with some provinces moving the same way. No durations are given. Please confirm the general statement.
12. **Day-care:** the course says "some older factory laws already require a room for young children where many women work", and exam x18 tests this. Please confirm (Factories Act 1934 and its provincial successors) and add the threshold if wanted.
13. **The banking regulator's gender policy** (Banking on Equality) is described as having set targets for women's representation and encouraged measures such as day-care. Please confirm the wording and whether day-care is required or only encouraged.

#### Statistics (Session 2 stats diagram, exam x15)
14. **Women's labour force participation in Pakistan:** "around 1 in 4", attributed generally to labour force surveys and international estimates (the national survey figure has been nearer 21–23%; ILO/World Bank modelled estimates are about 24–25%). Please confirm the wording is fair.
15. **Global gender gap index:** "Bottom 5" in recent editions. Please confirm against the latest WEF report.
16. **"Gender-diverse executive teams are more likely to have above-average profitability"** is attributed to "large global consultancy studies" and framed explicitly as correlation, not cause.
17. **"Women are almost half of Pakistan's population":** the 2023 census puts the figure just under half.

#### Other
18. **"Broken rung"** and **"under-sponsored women"** are attributed generally to global workplace research.
19. **The five Ds of bystander intervention** (Direct, Distract, Delegate, Delay, Document) are taught as a widely used model and described in original wording.
20. **All calculations were re-checked:** pay gap 15% and 20%, promotion-rate ratios 0.75 and 0.5, attrition 25% vs 10%, and pipeline drops of 19 and 26 points.

## Green Banking & Sustainable Finance (`green-banking`)

Facts I was not fully sure of, or that change over time:

1. **2022 floods figures (s1 stats card):** "about one-third of Pakistan under water", "33 million people affected", "~USD 30bn damage and losses" (the post-disaster needs assessment total of roughly USD 14.9bn damage plus USD 15.2bn losses), and "Pakistan under 1% of global emissions". All rounded and labelled as estimates. Please confirm they are acceptable.
2. **Timeline (s1):** the 1997 federal environmental protection act, the 18th Amendment in 2010, Paris 2015, the Climate Change Act and SBP Green Banking Guidelines both in 2017, the updated NDC in 2021, and **SBP's more detailed ESRM guidance in 2022**. Please check the year and wording of the ESRM manual and its phased implementation.
3. **SBP Green Banking Guidelines:** described as three pillars (E&S risk management, green business facilitation, own-impact reduction) plus a board-approved policy, a green banking function or office, training and periodic reporting to SBP. No thresholds, circular numbers or reporting formats are given, and learners are told to check current circulars.
4. **IEE and EIA (s2):** "EIA generally requires a public hearing, IEE generally does not", and approvals now come mostly from provincial EPAs after the 18th Amendment. Please check against the current provincial regulations and project schedules.
5. **EU carbon border mechanism (s1, s3):** described as covering carbon-intensive imports such as cement, steel, aluminium and fertilisers, and textiles are not named as covered. The cement carbon-cost exercise uses assumed figures (0.8 t CO₂ per tonne of cement, PKR 15,000 to 20,000 per t CO₂ absorbed by the exporter). These are teaching assumptions, not forecasts.
6. **Scenario families (s3):** orderly, disorderly, hot house world, and too little, too late, on a physical-versus-transition matrix, modelled on the central-bank network framing. The network is not named, and the course does not say whether SBP is a member.
7. **SBP refinance schemes (s4):** the mechanism only (cheap refinance, capped end-user rate, bank keeps the credit risk, categories for households, businesses and larger projects). No rates or limits are given. Please confirm which renewable-energy schemes are currently open.
8. **NEPRA net metering (s4):** described only as "revised; check current rules", because the rules changed recently.
9. **Pakistan green taxonomy (s4 flip):** "Pakistan has been developing one; check its current status." Please update if it has been formally adopted.
10. **Emission factors (s5):** diesel about 2.7 kg CO₂ per litre, petrol about 2.3 kg per litre, and a grid factor of 0.45 kg per kWh assumed for practice. All are labelled illustrative. Pakistan's real grid factor depends on the year and source, so please confirm 0.45 is a reasonable teaching figure.
11. **Financed emissions (s5):** a simplified attribution of outstanding amount ÷ (total equity + debt), modelled on industry methods (EVIC is used for listed companies) and applied to scope 1 and 2 only. Data-quality scoring is mentioned in general terms.
12. **Sustainability disclosure in Pakistan (s5):** "regulators and the accounting profession have been moving towards formal sustainability disclosure on a phased basis; check what applies". This refers to SECP and ICAP and the ISSB standards, which are not named. Please consider adding specifics if they are now settled.
13. **Green sukuk underlying assets (s4, exam x39):** the course says market practice expects the underlying assets of a green sukuk to be eligible as well. Please confirm this framing with a Shariah or sukuk structuring specialist.
14. **Islamic concepts (s5):** khilafah, amanah, mizan, la darar wa la dirar, israf and the maqasid (life, intellect, lineage, wealth, faith) are given in my own short wording. A Shariah scholar should check the phrasing.

## HR Operations Excellence (`hr-operations`)

All figures below are taught as "traditional baselines" or "common practice" with a "check the current provincial law / Finance Act" caution, but they are tested in quizzes and the exam, so please confirm them.

1. **Standing Orders classification** (permanent, probationer, badli, temporary, apprentice, contract) and definitions of probationer (provisional, permanent vacancy) and badli (covering a temporarily absent permanent worker). Tested in s1-q8, x4 and a check card. Also the claim that covered workers must get written terms at appointment.
2. **Gratuity rule**: 30 days' wages per completed year, final part-year counted only if *more than* six months (x13 says exactly six months does not count). Base taught as "last-drawn basic, as policy states". Confirm the current provincial wording and whether an employer-contributory PF can replace gratuity.
3. **EOBI contributions**: taught as commonly 5% employer and 1% employee, on a wage linked to the notified minimum wage. Calculations use an illustrative PKR 40,000 wage (x11, x12, s2 concept).
4. **Provincial social security**: taught as employer-funded for covered workers below a wage ceiling, with no employee contribution. No rate is given.
5. **Overtime**: twice the ordinary rate, with traditional limits of 9 hours a day and 48 a week for adult factory workers (x29: 6 × 9 = 54 hours gives 6 overtime hours).
6. **Leave baselines**: annual 14 days after 12 months' continuous service, casual 10 days with full pay, sick 16 days on half pay (s3-q7 and a check card). Provinces may have updated these.
7. **Maternity**: taught only as "differs by province, from 12 weeks under older law to longer under newer laws". No specific figure is tested.
8. **Wage payment deadline**: mentioned only generally ("traditionally a few days after the wage period, depending on establishment size"). Not tested.
9. **Salary tax withholding**: the projection method and the recalculation on a pay change ((annual tax − tax deducted) ÷ remaining months), the July–June tax year, and new slabs normally applying from the July payroll (x20). All tax amounts are illustrative.
10. **Recognised provident fund**: taught generally as giving tax advantages within limits. No caps are stated.
11. **Federal IRA 2012 / NIRC** for trans-provincial establishments (x21, a bank with branches in all provinces).
12. **Harassment law** (2010 Act, amended 2022): three-member committee with at least one woman; code of conduct displayed in English and Urdu; the complainant may go directly to the Ombudsperson instead of the internal committee (x39). No time limits are stated.
13. **Parallel police case**: the course says an internal inquiry can usually go ahead alongside a criminal case, with legal advice (x33). Please confirm this matches current Pakistani case law.
14. **Personal data protection**: described as a dedicated law "in draft for years; check its status". Please update this if a law has since been enacted.
15. **Minimum wage**: no figure is stated as official. PKR 37,000 and 40,000 appear only as labelled assumptions or illustrations.
16. **Principal-employer liability for contract labour**: described generally ("can be pulled into the liability"). Please confirm the wording is appropriate for Punjab.

## IT Infrastructure Management (`it-infrastructure`)

1. **SBP cloud/outsourcing rules (s2 tip, s2-q10, s2 scenario, x19).** Described only in general terms: board-approved policy, risk assessment, data classification and location rules, audit/regulator access, exit strategy, and "approval from or notification to SBP for material workloads, as current rules require". Please confirm this still matches SBP's current cloud outsourcing framework and whether any data-location wording should be firmer.
2. **SBP technology governance and cyber expectations (s5 tip, x49, x50).** Stated generally: board ownership of technology/cyber risk, board committee plus management IT steering committee, an information security head independent of IT operations, tested BCP/DR, timely incident reporting to the regulator, independent IT audit. No circular numbers, deadlines or reporting hours are given. Confirm the general picture is accurate and current.
3. **Cloud prices and discounts (s2 stats, example, q7, x15, x18).** All PKR prices and the 35%/40% commitment discounts are made up for teaching and labelled as illustrative. Check they are plausible for the Pakistani market.
4. **Overcommit ratios (s2 concept).** "Many teams use 3:1 to 4:1 for general workloads and close to 1:1 for heavy databases" is a common rule of thumb, not a standard.
5. **RAID write penalties (s3 example, x22).** Uses the textbook figures of about 2 (RAID 1/10), 4 (RAID 5) and 6 (RAID 6) back-end I/Os per small random write. Modern arrays with write caching can behave differently.
6. **3-2-1-1-0 (s3 flip).** Presented as a common industry extension of 3-2-1 (one immutable/offline copy, zero restore errors), not a formal standard.
7. **ITIL-style terms (s4).** Wording is original. ITIL 4 calls change management "change enablement" and uses "change authority"; the course uses the familiar "change management" and "CAB". The priority matrix (P1 to P4 from impact × urgency, with low impact/high urgency = P3) is Chenab's own example; organisations vary.
8. **"Four golden signals" (s4 match).** Latency, traffic, errors and saturation, taught without attribution.
9. **Hot/warm/cold recovery times (s5 concept)** are typical ranges, not fixed definitions.
10. **Replication distance (s5 q4, x43).** The course says synchronous replication suits short distances and Karachi–Lahore (over 1,000 km) normally uses asynchronous. Practical synchronous limits depend on the application's latency tolerance; no km figure is given.
11. **Windows containers (x13).** The answer says Windows workloads need a Windows container host or a VM. Correct in principle; an expert may want to note edge cases such as Linux VMs on Windows hosts.

## Procurement Management (`procurement-management`)

#### Pakistan public procurement (session 3; questions pm-s3-q1 to q10, pm-x21 to x30)
- Framework stated as: federal PPRA created by an ordinance in 2002, federal Public Procurement Rules made in 2004, and separate provincial laws and authorities. Please confirm wording is still accurate.
- Taught as general principles (no thresholds, rule numbers or day counts given): open competitive bidding as the default method; other methods (quotations, direct contracting, etc.) only in defined cases with recorded reasons; no splitting to avoid a method; written pre-bid clarifications shared with all bidders; public bid opening; evaluation only on criteria in the bidding documents; evaluation result made public before award; grievance redressal committee in the procuring agency; blacklisting/debarment; bid security capped by the rules; performance guarantee; integrity pact "usually for larger contracts".
- "Negotiation with bidders after opening is generally not permitted" in public procurement. Confirm this still holds federally and in each province after recent amendments.
- The school-milk tender story says "lowest evaluated responsive bid". Amendments have introduced "most advantageous bid" language in some frameworks; check whether the course should mention it.
- e-PADS described as Pakistan's national e-procurement system that agencies "increasingly must" use, with a "check which agencies it now covers" caution. Confirm current coverage and whether provinces use separate systems.
- pm-x29: direct contracting for a proprietary spare available from one authorised agent. Confirm this matches a permitted direct-contracting case.

#### Contracts and law (session 4)
- LDs: the course says that under the Contract Act 1872 courts generally award reasonable compensation up to the stated amount, not automatically the full sum (the section 74 position). Please confirm the wording (pm-x40, s4 example card).
- Arbitration appears only as a clause example ("arbitration in Lahore"); no statute is named.

#### Incoterms 2020 (session 4)
- Statements used: FOB, CFR and CIF are for sea and inland waterway only; risk under FOB and CIF passes when goods are on board at the port of shipment; under CIF the seller buys minimum insurance; DDP is the only rule where the seller pays import duties; Incoterms do not deal with title, price or payment; FCA, CPT or CIP fit containers handed over at an inland terminal better (pm-x35). Please confirm.

#### Competition law (session 5)
- Collusive tendering / bid rigging is said to be a prohibited anti-competitive agreement under the Competition Act 2010, enforced by the Competition Commission of Pakistan, and buyers are told to "consider reporting" to it. No section number or leniency details are given.

#### Illustrative figures (not official)
- pm-x25 uses an 18% duty-and-tax rate on the CIF value, flagged in the question as illustrative. Real duty rates on packaging film differ and change.
- pm-x16 refers to the "legal minimum wage" without a figure; provincial minimum wages differ.
- All company, supplier and price figures (film PKR 500 to 550/kg, 2.6 million kg, PKR 4.2bn spend, etc.) are invented for the story.

#### Practice conventions to sanity-check
- Price scoring formula "lowest price / bid price x maximum score" is taught as a common method, not the only one.
- Service-credit example counts only full percentage points below target (pm-x38); this is a drafting choice stated in the clause.
- Kraljic axes are drawn with supply risk vertical and profit impact horizontal (bottleneck top-left, strategic top-right, non-critical bottom-left, leverage bottom-right).

## Talent Management (`talent-management`)

1. **Pakistani legal references (s2 tip, s5 tip, s5-q10, x20, x47).** Stated only in general terms; please confirm the current position:
   - Protection against Harassment of Women at the Workplace Act 2010 (as amended, incl. 2022): employer duty to adopt and display a code of conduct and to constitute an inquiry committee with at least one woman member.
   - Standing orders: the course says workmen's terms (probation, show-cause, inquiry before penalty) are now set by provincial laws; check each province's current Act.
   - Disability employment quotas: described only as "federal and provincial quotas; check your province's figure" (no percentage given on purpose).
   - Transgender Persons (Protection of Rights) Act 2018: described as addressing employment discrimination, with parts under court challenge; please confirm the current status.
   - Maternity and paternity leave: noted only as differing federally and by province.
   - Onboarding compliance mentions EOBI and provincial social security registration as examples.
2. **Four-fifths (80%) rule.** Presented as a US-origin rule of thumb for spotting adverse impact, not a Pakistani legal test.
3. **Research-based claims stated qualitatively, without figures:** structured interviews predict better than unstructured ones; manager involvement drives training transfer; forgetting is fast without reinforcement; 70-20-10 comes from what successful managers recalled (described as approximate).
4. **OKR convention.** "About 0.6 to 0.7 is healthy for stretch OKRs" is presented as a common practice, not a universal rule.
5. **Potential model.** "Aspiration, ability, engagement" is presented as "a widely used view", not the only model.
6. **Turnover cost range.** The s5 caption says commonly quoted estimates run from "about half to twice annual salary". This is a rough range, not a sourced figure. All worked PKR examples (turnover cost, ROI, ramp-up, compa-ratio) are invented illustrations.
7. **Minimum reporting group size** for surveys/analytics is given as "often 5 to 10". This is common practice, not a legal standard. Pakistan's data-protection law is not cited (it was not enacted as far as the writer knew); consider adding a note if the position has changed.
8. **Compa-ratio "below about 0.90 often flags underpayment"** for an experienced performer is a rule of thumb.
9. **Kirkpatrick plus Phillips ROI conventions** (counting only first-year benefits for short programmes, confidence-adjusted estimates) follow common ROI-methodology practice; worth a quick review by an L&D evaluation specialist.
