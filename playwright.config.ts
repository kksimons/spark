import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: process.env.CI ? "http://localhost:3001" : "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev",
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
