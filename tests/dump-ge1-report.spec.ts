import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-GE1 study json/svg/captures", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runGe1Study));
  const report = (await page.evaluate(() => window.__MT1!.runGe1Study!())) as {
    studyId: string;
    nextSlice: { id: string };
    livePoses: { spread: unknown; drive: unknown };
    svg: { side: string; top: string };
    historicalDriveWidthSketch: { usedAsTarget: boolean };
  };
  expect(report.studyId).toBe("MT1-GE1");
  expect(report.historicalDriveWidthSketch.usedAsTarget).toBe(false);
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  const { svg, ...json } = report;
  writeFileSync(resolve(ev, "ge1-results.json"), JSON.stringify(json, null, 2));
  writeFileSync(resolve(ev, "ge1-side.svg"), svg.side);
  writeFileSync(resolve(ev, "ge1-top.svg"), svg.top);

  await page.evaluate(() => {
    window.__MT1!.setBodyConcept?.(false);
    window.__MT1!.setMachineT(0);
    window.__MT1!.setCamera("side");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/ge1-spread-side.png" });
  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.84);
    window.__MT1!.setCamera("side");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/ge1-ready-side.png" });
  await page.evaluate(() => {
    window.__MT1!.setMachineT(1);
    window.__MT1!.setCamera("side");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/ge1-drive-side.png" });
  await page.evaluate(() => {
    window.__MT1!.setMachineT(0);
    window.__MT1!.setCamera("top");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/ge1-spread-top.png" });
  await page.evaluate(() => {
    window.__MT1!.setMachineT(1);
    window.__MT1!.setCamera("top");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/ge1-drive-top.png" });
});
