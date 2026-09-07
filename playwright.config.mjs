import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests/e2e",
  outputDir: "./output/playwright/test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright/report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run start --prefix apps/api",
      url: "http://127.0.0.1:8790/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: "8790",
        CHALLAN_NYAY_WHATSAPP_APP_SECRET: "challan-nyay-synthetic-whatsapp-app-secret-v1",
        CHALLAN_NYAY_WHATSAPP_IDENTITY_SECRET: "challan-nyay-synthetic-whatsapp-identity-v1",
        CHALLAN_NYAY_WHATSAPP_HANDOFF_SECRET: "challan-nyay-synthetic-whatsapp-handoff-v1",
        CHALLAN_NYAY_WHATSAPP_VERIFY_TOKEN: "challan-nyay-synthetic-whatsapp-verify-v1",
        CHALLAN_NYAY_PUBLIC_WEB_URL: "http://127.0.0.1:4174/",
        CHALLAN_NYAY_WHATSAPP_ACCESS_TOKEN: "",
        CHALLAN_NYAY_WHATSAPP_PHONE_NUMBER_ID: "",
      },
    },
    {
      command: "npm run dev --prefix apps/web -- --host 127.0.0.1 --port 4174",
      url: "http://127.0.0.1:4174/",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        CHALLAN_NYAY_API_TARGET: "http://127.0.0.1:8790",
      },
    },
  ],
});
