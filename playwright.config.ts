import { defineConfig, devices } from "@playwright/test";

// End-to-end checks against the production build (`npm run build` first).
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts", // keeps vitest (*.test/*.spec) and Playwright apart
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3200", trace: "retain-on-failure" },
  webServer: {
    command: "npx next start -p 3200",
    url: "http://localhost:3200/play",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
});
