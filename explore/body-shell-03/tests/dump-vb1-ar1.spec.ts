import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import { svgF5LocationPlot } from "../src/study/vb1/ar1F5";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-VB1-AR1 F5 location addendum", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Ar1Study));
  const report = (await page.evaluate(() => window.__MT1!.runVb1Ar1Study!({}))) as {
    csv: string;
    plot: Record<string, Array<{ machineT: number; z_long: number }>>;
  } & Record<string, unknown>;
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  const { csv, plot, ...rest } = report;
  writeFileSync(resolve(ev, "vb1-f5-location-sensitivity.json"), JSON.stringify(rest, null, 2));
  writeFileSync(resolve(ev, "vb1-f5-location-sensitivity.csv"), csv);
  writeFileSync(resolve(ev, "vb1-f5-location-plot.svg"), svgF5LocationPlot(plot));
});
