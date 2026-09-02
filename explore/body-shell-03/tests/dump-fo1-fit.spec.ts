import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("dump MT1-FO1 presentation-fit report", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runBodyShellFit));
  const report = await page.evaluate(() => window.__MT1!.runBodyShellFit?.());
  expect(report?.participatesInAuthority).toBe(false);
  expect(report?.method).toBe("triangle-obb");
  expect(report?.pass).toBe(true);
  expect(report?.defects).toEqual([]);
  mkdirSync("evidence/fo1", { recursive: true });
  writeFileSync("evidence/fo1/fo1-fit-report.json", JSON.stringify(report, null, 2));
});
