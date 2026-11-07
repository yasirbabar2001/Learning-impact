# Learning Impact: learningimpact.pk

Website for **Learning Impact**. Companies can book corporate training programs for their employees or request a
trainer. Administrators manage the website and work through incoming requests in a private admin panel.

## What's inside

**Public site** (black canvas, floating rainbow light, gold logo swoosh):

| Page | Purpose |
| --- | --- |
| `/` | Hero, the two ways to work with us, popular programs, how it works, formats, FAQ |
| `/programs` | Filterable, searchable catalogue; each program opens into a detail view |
| `/book` | 3-step booking wizard (program → session → company details). `?program=slug` preselects a program |
| `/trainers` | 3-step "request a trainer" wizard. `?topic=…` prefills the topic |
| `/about`, `/contact` | Company story and a contact form |

Interaction design: a rainbow curtain sweep on every page change, a rainbow ring and sparks on every click, magnetic
buttons, 3D tilt cards, pointer-following light on cards, word-by-word headline reveals, and confetti when a request is
sent. All motion respects the visitor's "reduce motion" setting.

**Certification portal** (log in at `/login`):

- One login for everyone (`/login`): **Individual**, **Company** or **Admin**. Admin is a permission on a normal
  account, given or removed in **Admin → Learners**; admins switch between the admin panel and their own account
  with one click. The owner password page (`/admin/login`, `ADMIN_PASSWORD`) remains as a backup and to make the
  first admin.
- The header shows **Log in** and **Create account** (or **My dashboard**), and every page has a small ifSPACE
  window pointing to islamicfinancespace.com for Islamic finance training (visitors can shrink it to a badge).
- Sign-up asks first: **Individual** or **Company**. Every new account verifies its e-mail with a
  6-digit code (10-minute expiry, 5 tries, resend after 60 s). Individuals are active straight away; company
  profiles (name, industry, size, city, NTN, contact person) wait for admin approval in **Admin → Companies**.
  Forgotten passwords are reset with an e-mailed code.

- 14 professional certifications (`/certifications`); each is a gamified **quest**: 5 stages of short lesson cards
  with knowledge checks, a scored **SCORM 1.2** test after every stage (7/10 unlocks the next), and a tough timed
  **final exam** (40 questions drawn from a 50-question bank, 60 minutes, 75% to pass, 3 attempts).
- Interactive lessons: chat-style **story scenes** with an illustrated cast, narrated **mini-movies**
  (browser text-to-speech), 8 kinds of animated **diagrams**, **decision scenarios**, **flip cards**, **sort**,
  **match** and **order** games, optional video, synthesized **sound effects**, auto-narration, combo counter,
  the guide mascot **Ilmi**, and full-screen celebrations with level-ups and share buttons. The final exam is a
  boss battle with a health bar.
- Retention and word of mouth: personal **invite links** (`/r/CODE`, XP for both sides, Connector and
  Ambassador badges), a **weekly league** that resets every Monday, streak-at-risk alerts, daily **reminder
  e-mails** (`/api/cron/reminders`, protected by `CRON_SECRET`, one-click unsubscribe), WhatsApp/LinkedIn sharing
  and rich link previews for certificates.
- XP, 7 levels, daily streaks, badges, a leaderboard (opt-out), and PDF certificates with a QR code that anyone can
  check at `/verify`.
- Buying: individuals or companies (team seats) order online and pay by bank transfer / Easypaisa / JazzCash,
  upload a receipt, and an admin approves. Company managers invite employees by e-mail and follow progress, scores
  and certificates on `/company` (CSV report).
- Course content lives in `content/courses/*.json` (format: `src/lib/courses/schema.ts`, guide:
  `content/WRITING-GUIDE.md`, checked by `pnpm content:check`). All 14 certifications have full
  interactive content (5 stages, about 100 cards, 50 stage-test and 50 exam questions each). Facts to confirm
  with subject experts before publishing a course: `content/EXPERT-REVIEW.md`.
- Data: SQLite (`portal.db`, Node's built-in `node:sqlite`) in `DATA_DIR`; receipts in `DATA_DIR/uploads`.

**Admin panel** (`/admin`, password protected):

- **Payments**, **Learners**, **Certifications**: approve receipts, manage learners (free enrolment, extra exam
  attempts, reset links, revoke certificates), set prices and publish certifications, bank details, and download any
  stage test as a SCORM 1.2 zip for a client's own LMS.
- **Requests**: every booking, trainer request and enquiry, with counters, filters, search, a detail drawer,
  status pipeline (New → Contacted → Proposal sent → Confirmed → Closed), internal notes, one-click e-mail / call /
  WhatsApp, delete, and CSV export.
- **Programs**: add, edit, publish/unpublish, feature on the home page, reorder and delete catalogue programs.
- **Site settings**: home page headline text, announcement bar, contact details and social links.

New requests can also be e-mailed to the team (optional, via [Resend](https://resend.com)).

## Tech

Next.js 16 (App Router, server actions), React 19, TypeScript, Motion for animation, Zod for validation and
either a JSON file on disk (cPanel / any server with a persistent disk; set `DATA_DIR`) or Supabase (Postgres) for
serverless hosting such as Vercel.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
pnpm dev                     # http://localhost:3000, admin at /admin
```

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e` (Playwright).

## Go live on learningimpact.pk

**Option A: domain.pk cPanel hosting (Node.js).** Follow [docs/HOSTING-DOMAIN-PK.md](docs/HOSTING-DOMAIN-PK.md).
Every push to `main` builds a ready-to-upload `learning-impact-hosting.zip` (GitHub → Actions → *Build hosting
package* → Artifacts). Data is kept in a JSON file in the folder named by `DATA_DIR`, so no database is required.

**Option B: Vercel + Supabase.** Serverless hosting has no persistent disk, so it needs the Supabase database.

#### 1. Database (Supabase, free tier is enough)

1. Create a project at [supabase.com](https://supabase.com) (choose a region near Pakistan, for example Mumbai or Singapore).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.
3. From **Project Settings → API**, copy the project URL and the `service_role` key (keep this key secret).

The starter program catalogue and default settings are added automatically the first time the site loads.

#### 2. Hosting (Vercel)

1. At [vercel.com](https://vercel.com) choose **Add New → Project** and import the `learning-impact` GitHub repository.
2. Add these **Environment Variables** before the first deploy:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://learningimpact.pk` |
   | `ADMIN_PASSWORD` | a long password for the admin panel |
   | `SESSION_SECRET` | a random string (`openssl rand -hex 32`) |
   | `SUPABASE_URL` | from step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1 |
   | `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` | optional, for e-mail alerts on new requests |

3. Deploy. Every push to `main` redeploys automatically.

#### 3. Domain (domain.pk)

1. In Vercel: **Project → Settings → Domains**, add `learningimpact.pk` and `www.learningimpact.pk`.
2. In your domain.pk control panel, open DNS management for `learningimpact.pk` and add the records Vercel shows.
   They are normally:

   | Type | Host | Value |
   | --- | --- | --- |
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   (Alternatively, change the domain's nameservers to `ns1.vercel-dns.com` and `ns2.vercel-dns.com` and let Vercel
   manage DNS.)
3. Wait for the records to propagate (usually minutes, up to 48 hours for .pk). Vercel issues the HTTPS certificate
   automatically. `www` redirects to the bare domain.

#### 4. E-mail alerts (optional)

Create a free Resend account, verify `learningimpact.pk` there (it gives you DNS records to add at domain.pk), then
set `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` (comma-separated addresses) and `NOTIFY_EMAIL_FROM`.

## Project layout

```
src/app/(site)/        public pages (shared nav, footer and page transition)
src/app/admin/         login, admin panel pages, server actions, CSV export
src/app/actions.ts     public form submissions (validation, honeypot, rate limiting)
src/components/        UI: Aurora background, click effects, nav, forms, program explorer, admin views
src/lib/store/         storage: Supabase in production, JSON file in development
src/lib/defaults.ts    starter programs and default site text
supabase/schema.sql    database schema
brand/                 original logo files
```

## Security notes

- Requests are written and read only on the server with the Supabase service-role key; row-level security is on and
  the public API key has no access.
- The admin session is a signed, HTTP-only, same-site cookie that expires after 12 hours.
- Public forms use server-side validation, a honeypot field and per-IP rate limiting.
