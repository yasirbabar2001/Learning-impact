import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200" },
  webServer: {
    command: "pnpm build && pnpm start -p 3200",
    url: "http://localhost:3200",
    timeout: 240_000,
    reuseExistingServer: false,
    env: { ADMIN_PASSWORD: "e2e-password", SESSION_SECRET: "e2e-secret", SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
  },
});
