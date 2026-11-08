# Breadth pass: extend one jurisdiction map to the remaining categories

The map `content/regulatory/jurisdictions/<code>.json` already covers financial crime, conduct, governance, cyber/data
and workplace programs. Extend it to the categories that were left out, following every rule in
`content/regulatory/RESEARCH-BRIEF.md`, `content/regulatory/VERIFY-BRIEF.md` and `content/regulatory/PHASE2-BRIEF.md`
(official sources only, fetch with curl and an honest user agent, mandatory only when an opened official text
expressly supports a training/competence duty, own words, conventional banking only, no `quest` fields).

Assess 15-25 NEW programs (do not change existing entries, except to fix an error you can prove from an official
text — say so in your report), choosing the most relevant for banks in that country from:

- E. Risk and prudential (95-116): ERM, operational, credit, market, liquidity, IRRBB, capital/Basel, stress testing,
  risk appetite, model risk, outsourcing/third-party, BCM, recovery and resolution.
- F. Lending and credit (117-135): credit policy, classification and provisioning (IFRS 9 / local rules), NPLs,
  restructuring, collateral, credit bureau reporting, consumer/mortgage/SME/agri/microfinance/digital lending,
  collections.
- G. Operations and payments (136-158): account opening documentation, dormant accounts, wire transfers, payment
  systems, cards, ATMs, agent banking, mobile money, remittances, foreign exchange rules, cheques, payment fraud.
- I. Reporting and tax (171-184): IFRS/IFRS 9/7/13, regulatory/prudential reporting, FATCA, CRS, audit readiness.
- J. Specialised (185-202): correspondent banking, trade finance, securities/market abuse, custody, open banking,
  e-KYC/digital ID, fintech partnerships/sandbox, AI governance/model risk, consumer data rights.

Many of these will be `competence` (a framework or competence duty without an express course) or `recommended`.
Only classify mandatory where the opened text expressly requires training, certification or competence for staff
or a role (e.g. a credit officer certification, a foreign exchange dealer qualification, a regulatory reporting
staff training rule, a market-abuse training rule).

Keep the whole file valid: `pnpm -s content:check content/regulatory/jurisdictions/<code>.json` (from
/home/user/learning-impact). Edit only that one file. The file may keep at most 10 `notes`.

Report briefly: programs added per category and classification, every NEW mandatory entry (program, title, checked
source URL and provision), hosts that blocked, and recent changes you found.
