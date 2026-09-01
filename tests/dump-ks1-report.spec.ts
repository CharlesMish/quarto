import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-KS1 study json/svg", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runKs1Study));
  const report = (await page.evaluate(() => window.__MT1!.runKs1Study!())) as {
    studyId: string;
    professionsAssigned: unknown[];
    outcome: { code: string };
    svg: { long: string; top: string; stations: string };
  };
  expect(report.studyId).toBe("MT1-KS1");
  expect(report.professionsAssigned).toEqual([]);
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  const { svg, ...json } = report;
  writeFileSync(resolve(ev, "ks1-results.json"), JSON.stringify(json, null, 2));
  writeFileSync(resolve(ev, "ks1-long.svg"), svg.long);
  writeFileSync(resolve(ev, "ks1-top.svg"), svg.top);
  writeFileSync(resolve(ev, "ks1-stations.svg"), svg.stations);
});
