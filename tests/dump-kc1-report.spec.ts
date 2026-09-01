import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-KC1 study json/svg", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runKc1Study));
  const report = (await page.evaluate(() => window.__MT1!.runKc1Study!())) as {
    studyId: string;
    outcome: { code: string };
    professionsAssigned: unknown[];
    svg: { long: string; top: string };
  };
  expect(report.studyId).toBe("MT1-KC1");
  expect(report.professionsAssigned).toEqual([]);
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  const { svg, ...json } = report;
  writeFileSync(resolve(ev, "kc1-results.json"), JSON.stringify(json, null, 2));
  writeFileSync(resolve(ev, "kc1-long.svg"), svg.long);
  writeFileSync(resolve(ev, "kc1-top.svg"), svg.top);
});
