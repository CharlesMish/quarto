import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-US1 study json/svg", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runUs1Study));
  const report = (await page.evaluate(() => window.__MT1!.runUs1Study!())) as {
    studyId: string;
    coherentLongitudinalVoid: boolean;
    nextSlice: { id: string };
    svg: { long: string; top: string };
    professionsAssigned: unknown[];
  };
  expect(report.studyId).toBe("MT1-US1");
  expect(report.coherentLongitudinalVoid).toBe(false);
  expect(report.professionsAssigned).toEqual([]);
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  const { svg, ...json } = report;
  writeFileSync(resolve(ev, "us1-results.json"), JSON.stringify(json, null, 2));
  writeFileSync(resolve(ev, "us1-long.svg"), svg.long);
  writeFileSync(resolve(ev, "us1-top.svg"), svg.top);
});
