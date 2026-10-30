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
