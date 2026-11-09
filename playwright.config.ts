import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  // Browsers default to Pakistan time, so prices show in PKR unless a test chooses another time zone.
  use: { baseURL: "http://localhost:3200", timezoneId: "Asia/Karachi" },
  webServer: [
    // Catches the site's e-mails (verification codes) in .data-e2e-mail/.
    { command: "node scripts/smtp-sink.mjs", port: 2525, reuseExistingServer: false },
    {
      // Runs the same standalone server that is uploaded to the hosting.
      command: "pnpm build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && node .next/standalone/server.js",
      url: "http://localhost:3200",
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        PORT: "3200",
        DATA_DIR: ".data-e2e",
        ADMIN_PASSWORD: "e2e-password",
        SESSION_SECRET: "e2e-secret",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "2525",
        SMTP_USER: "test@learningimpact.pk",
        SMTP_PASS: "test",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
    },
  ],
});
