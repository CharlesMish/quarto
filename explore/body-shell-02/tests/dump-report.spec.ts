import { test } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

test("dump clearance report json", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));
  const report = await page.evaluate(() => window.__MT1!.runClearance());
  const dir = resolve(here, "../evidence");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "s5-regression-s1.json"), JSON.stringify(report, null, 2));
});
