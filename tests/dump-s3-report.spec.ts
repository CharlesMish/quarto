import { test } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

test("dump S3 machine authority json", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));
  const report = await page.evaluate(() => window.__MT1!.runMachineAuthority());
  const dir = resolve(here, "../evidence");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "s5-regression-s3.json"), JSON.stringify(report, null, 2));
});
