import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200" },
  webServer: {
    // Runs the same standalone server that is uploaded to the hosting.
    command: "pnpm build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ && node .next/standalone/server.js",
    url: "http://localhost:3200",
    timeout: 240_000,
    reuseExistingServer: false,
    env: { PORT: "3200", DATA_DIR: ".data-e2e", ADMIN_PASSWORD: "e2e-password", SESSION_SECRET: "e2e-secret", SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
  },
});
