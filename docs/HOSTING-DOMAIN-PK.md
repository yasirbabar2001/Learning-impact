# Hosting learningimpact.pk on domain.pk (cPanel)

The site is a Node.js application. It runs on cPanel hosting that offers **Setup Node.js App** (also called
"Node.js Selector" or "Application Manager"). Data such as requests, programs and settings is saved as a file on your
hosting account, so no external database is needed.

## 0. Check your plan first

Log in to cPanel and search for **Node.js**. If you see *Setup Node.js App* and it offers **Node.js 20 or newer**,
continue. If it is missing, ask domain.pk support to enable Node.js (version 20 or 22) on your plan, or move to
one of their plans or a VPS that includes it. Ordinary PHP-only hosting cannot run this site.

## 1. Get the upload package

Pick one:

- **From GitHub (recommended):** open the repository → **Actions** → latest *Build hosting package* run →
  download **learning-impact-hosting** under *Artifacts*. GitHub delivers it zipped; unzip once and you get
  `learning-impact-hosting.zip`.
- **On your own computer:** with Node.js 22 and pnpm installed, run `pnpm install`, `pnpm build`, then `pnpm package`.

## 2. Point the domain at the hosting

If you bought the domain and the hosting together at domain.pk, this is usually already done. Otherwise, in the
domain.pk client area set the domain's nameservers to the ones in your hosting welcome e-mail. Changes to .pk
domains can take up to 24–48 hours.

## 3. Upload the files

1. cPanel → **File Manager** → in your home folder (the one that contains `public_html`) create a folder named
   `learning-impact`. Do **not** put it inside `public_html`.
2. Open the folder, click **Upload**, upload `learning-impact-hosting.zip`.
3. Right-click the zip → **Extract** into `/home/YOURUSER/learning-impact`. You should now see `server.js`,
   `package.json`, `.next`, `node_modules` and `public` (enable *Show Hidden Files* in Settings to see `.next`).
4. Delete the zip.
5. Create a second folder `learning-impact-data` next to it (also outside `public_html`). Your requests are stored
   here, so it survives every future update.

## 4. Create the Node.js application

cPanel → **Setup Node.js App** → **Create Application**:

| Setting | Value |
| --- | --- |
| Node.js version | 22.x (or 20.x, at least 20.9) |
| Application mode | Production |
| Application root | `learning-impact` |
| Application URL | `learningimpact.pk` (leave the path empty) |
| Application startup file | `server.js` |

Under **Environment variables** add:

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD` | a long password you will use at learningimpact.pk/admin |
| `SESSION_SECRET` | any long random text (40+ characters) |
| `DATA_DIR` | `/home/YOURUSER/learning-impact-data` (replace YOURUSER with your cPanel username) |
| `NEXT_PUBLIC_SITE_URL` | `https://learningimpact.pk` |

Optional, to receive an e-mail for each new request: `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM`
(see the README).

Click **Create**, then **Start App** (or **Restart**). Do **not** click *Run NPM Install*: the package already
contains everything it needs.

## 5. Turn on HTTPS

cPanel → **SSL/TLS Status** → select `learningimpact.pk` and `www.learningimpact.pk` → **Run AutoSSL**.
Then cPanel → **Domains** → turn on **Force HTTPS Redirect** for the domain.

## 6. Check it works

- Open https://learningimpact.pk: you should see the black and rainbow home page.
- Open https://learningimpact.pk/admin, sign in with `ADMIN_PASSWORD`, and go to **Site settings** to enter your
  phone, WhatsApp, e-mail and social links.
- Submit a test booking on the site and confirm it appears in the admin panel, then delete it.

## Certification portal: first steps after uploading

The portal (learner accounts, quests, exams, certificates, company seats) needs no extra hosting setup. Its database
is a file, `portal.db`, created automatically in your `DATA_DIR` folder next to `db.json`. Payment receipts are
stored in `DATA_DIR/uploads`.

0. **Your admin login (do this once):** everyone, admins included, now uses the one login page
   (`/login`), which offers **Individual**, **Company** or **Admin**. To make your own account an admin:
   1. Create a normal account at `/register` (Individual) with your e-mail, and verify it with the code.
   2. Open `learningimpact.pk/admin/login` and sign in with the owner password (`ADMIN_PASSWORD`).
   3. Go to **Learners**, find your account, click **Give admin access**, then **Sign out**.
   4. From now on, log in at `/login`, choose **Admin**, and use your own e-mail and password. In the admin panel,
      **Switch to my learner account** takes you to your own dashboard; the account menu there has **Switch to
      Admin**. Give or remove admin access for colleagues in the same way. Nobody can remove their own access, and
      the owner password page stays available as a backup.

1. **Payment details:** sign in at `/admin` → **Certifications** → fill in *Payment details shown to buyers*
   (account title, bank, account number, IBAN, Easypaisa/JazzCash numbers) → Save.
2. **Prices:** on the same page, enter a price per learner for each ready certification, tick **Published**, Save.
   Certifications without content or without a price show as "Coming soon".
3. **E-mail (required for sign-up codes):** every new account must enter a 6-digit code sent by e-mail, so set
   this up first. In *Setup Node.js App* add these environment variables, then **SAVE** and **RESTART**:

   | Name | Value |
   | --- | --- |
   | `SMTP_HOST` | your server's own name from the hosting page, e.g. `server29.hndservers.net` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `info@learningimpact.pk` |
   | `SMTP_PASS` | that mailbox's password |
   | `MAIL_FROM` | `Learning Impact <info@learningimpact.pk>` |
   | `NOTIFY_EMAIL_TO` | who should hear about new payments and companies, e.g. `sales@learningimpact.pk` |

   Then go to **Admin → Learners → E-mail check**, send a test to yourself and read the result on screen.
   - "certificate" / "altnames" error: use the server name above as `SMTP_HOST` (not `mail.learningimpact.pk`).
     As a last resort add `SMTP_ALLOW_INVALID_CERT` = `1`.
   - "Invalid login" / "535": the mailbox password in `SMTP_PASS` is wrong.
   - Timeout: ask domain.pk whether outgoing SMTP on port 465 is allowed (or try `SMTP_PORT` = `587`).

   If someone cannot receive their code, open **Admin → Learners**, find them and click **Mark e-mail verified**.
4. **Companies:** company accounts appear in **Admin → Companies** once they verify their e-mail. Check the
   details and click **Approve company** (or **Reject** with a reason). Only approved companies can buy seats and
   invite staff; both outcomes are e-mailed to the company.
5. **Daily work:** **Payments** shows submitted receipts; check each against your statement and click
   **Approve & unlock** (or **Reject** with a reason). **Learners** lets you enrol someone free, grant an extra
   exam attempt, create a password-reset link, disable an account or revoke a certificate.

6. **Reminder e-mails (keeps learners coming back):** the portal can e-mail a learner whose streak is about to
   break ("your 5-day streak ends at midnight") and, once a week, anyone who has not opened their quest for 4 days.
   Each learner gets at most one a day and can switch them off from the e-mail or their profile.
   - In *Setup Node.js App* add `CRON_SECRET` = a long random password of your own (letters and digits only, for
     example 30 characters). **SAVE** and **RESTART**.
   - In cPanel open **Cron Jobs**. Under *Add New Cron Job* choose **Once Per Day**, then change *Hour* to **13**
     (13:00 server time is about 6 pm in Pakistan; if your server runs on Pakistan time choose **18**).
   - In *Command* paste this, with your own secret in place of `YOUR_CRON_SECRET`:

     ```
     curl -s "https://learningimpact.pk/api/cron/reminders?key=YOUR_CRON_SECRET" > /dev/null
     ```

   - Click **Add New Cron Job**. To test it at once, open that address in your browser: it shows how many
     reminders were sent, e.g. `{"streak":0,"comeback":0,"failed":0,"checked":0}`.
7. **Keep the site awake (recommended, makes the first click fast):** shared hosting puts a Node.js app to sleep
   after a few idle minutes, and the next visitor then waits several seconds while it starts again. In cPanel →
   **Cron Jobs**, add one more job with *Common Settings* = **Once Per Five Minutes** and this command:

   ```
   curl -s https://learningimpact.pk/api/health > /dev/null
   ```

8. **Invite links:** every learner's dashboard shows a personal link (`learningimpact.pk/r/CODE`). When a friend
   signs up with it and verifies their e-mail, the friend gets 50 XP and the learner 100 XP. When the friend's
   first payment is approved, the learner gets 250 XP and the Ambassador badge. Nothing to set up.

**Back up `learning-impact-data` regularly** (download it from File Manager, or use your host's backup tool). It
holds every learner, payment, result and certificate.

## Updating the site later

1. Download the newest package (step 1).
2. In *Setup Node.js App*, **Stop** the app.
3. In File Manager, delete everything inside `learning-impact` (not `learning-impact-data`), upload and extract
   the new zip there.
4. **Start** the app again.

## Troubleshooting

- **"Incomplete response" / 503 error:** open *Setup Node.js App*, check the Node.js version is 20.9 or newer and
  the startup file is `server.js`, then restart. The log file `stderr.log` inside `learning-impact` shows the
  exact error.
- **Admin says sign-in is disabled:** `ADMIN_PASSWORD` is missing; add it and restart the app.
- **Requests disappear after an update:** `DATA_DIR` is not set, so data was being saved inside the app folder.
  Set it as in step 4.
- **Page shows the cPanel default page:** remove `index.html` / `index.php` from `public_html` and make sure the
  application URL is the bare domain.
