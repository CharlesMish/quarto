import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: {
    baseURL: process.env.MT1_BASE_URL ?? "http://127.0.0.1:5184",
    viewport: { width: 1600, height: 900 },
    screenshot: "only-on-failure",
  },
  webServer: process.env.MT1_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5184 --strictPort",
        url: "http://127.0.0.1:5184",
        reuseExistingServer: false,
      },
  reporter: "line",
});
