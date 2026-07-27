import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  reporter: [["list"]],
  outputDir: "test-results",
  preserveOutput: "failures-only",
  use: {
    baseURL: process.env.HOMEOPS_E2E_BASE_URL ?? "http://127.0.0.1:5273",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
