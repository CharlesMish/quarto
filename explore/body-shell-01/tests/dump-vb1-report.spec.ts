import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

test("dump MT1-VB1 study json/csv/svg", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
  const report = (await page.evaluate(() => window.__MT1!.runVb1Study!({}))) as {
    drive: unknown;
    cockpit: unknown;
    waist: unknown;
    planform: unknown;
    familyLocationsSpread: unknown;
    envelopes: unknown;
    bookLeavesSpread: unknown;
    assumptions: unknown;
    named: unknown;
    spreadCgs: unknown;
    scenarioOrder: unknown;
    traces: unknown;
    sensitivity: unknown;
    corners: unknown;
    readyDrive: unknown;
    bands: unknown;
    reds: unknown;
    computed_disposition: unknown;
    status: unknown;
    conclusion: unknown;
    nextSlice: unknown;
    gates: unknown;
    csv: string;
    svg: { top: string; side: string; trace: string };
    leafSplitDelta: unknown;
    cockpitLocationSensitivity: unknown;
    waistLocationSensitivity: unknown;
    solidBilletAbsurdity: unknown;
    sourceS4aSha256: unknown;
    coordinate: unknown;
  };
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  // Frozen VB1 identity files are AR1 inputs. S5 must not rewrite them.
  writeFileSync(
    resolve(ev, "vb1-live-geometry-facts.json"),
    JSON.stringify(
      {
        tag: "GEOMETRY_FACT",
        sourceS4aSha256: report.sourceS4aSha256,
        coordinate: report.coordinate,
        drive: report.drive,
        cockpit: report.cockpit,
        waist: report.waist,
        planform: report.planform,
        familyLocationsSpread: report.familyLocationsSpread,
        envelopes: report.envelopes,
        bookLeavesSpread: report.bookLeavesSpread,
      },
      null,
      2,
    ),
  );
  writeFileSync(resolve(ev, "vb1-live-assumptions.json"), JSON.stringify(report.assumptions, null, 2));
  writeFileSync(
    resolve(ev, "vb1-live-results.json"),
    JSON.stringify(
      {
        tag: "DERIVED_ESTIMATE",
        status: report.status,
        computed_disposition: report.computed_disposition,
        conclusion: report.conclusion,
        nextSlice: report.nextSlice,
        named: report.named,
        spreadCgs: report.spreadCgs,
        scenarioOrder: report.scenarioOrder,
        traces: report.traces,
        sensitivity: report.sensitivity,
        corners: report.corners,
        readyDrive: report.readyDrive,
        bands: report.bands,
        reds: report.reds,
        leafSplitDelta: report.leafSplitDelta,
        cockpitLocationSensitivity: report.cockpitLocationSensitivity,
        waistLocationSensitivity: report.waistLocationSensitivity,
        solidBilletAbsurdity: report.solidBilletAbsurdity,
        gates: report.gates,
      },
      null,
      2,
    ),
  );
  writeFileSync(resolve(ev, "vb1-live-scenario-table.csv"), report.csv);
  writeFileSync(resolve(ev, "vb1-top-map.svg"), report.svg.top);
  writeFileSync(resolve(ev, "vb1-side-map.svg"), report.svg.side);
  writeFileSync(resolve(ev, "vb1-cg-trace.svg"), report.svg.trace);
});
