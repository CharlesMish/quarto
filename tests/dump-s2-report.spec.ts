import { test } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

test("dump S2 clearance report json", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));
  const report = await page.evaluate(() => window.__MT1!.runFrontClearance());
  const dir = resolve(here, "../evidence");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "s5-regression-s2.json"), JSON.stringify(report, null, 2));
});
