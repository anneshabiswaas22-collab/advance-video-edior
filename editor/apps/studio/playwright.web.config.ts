import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-web",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://127.0.0.1:5180",
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    // Studio already depends on Playwright. Launch the separate main web app
    // without adding another testing dependency or editing the pnpm lockfile.
    command: "pnpm --dir ../web exec vite --host 127.0.0.1 --port 5180 --strictPort",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
