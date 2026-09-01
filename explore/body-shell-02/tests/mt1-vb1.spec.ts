import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
import { S4A_SHA256 } from "../src/study/vb1/constants";
import { S4A_SOURCE_SHA256 } from "../src/study/vb1/s4aSourceManifest";
import { NOMINAL_TOTAL_RMU } from "../src/study/vb1/assumptions";

test.describe("MT1-VB1 bounded vehicle balance study", () => {
  test("VB1-G1 S4A mechanism sources unchanged", () => {
    expect(S4A_SHA256).toBe("95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8");
    expect(NOMINAL_TOTAL_RMU).toBe(100);
    const root = resolve(here, "..");
    for (const [rel, want] of Object.entries(S4A_SOURCE_SHA256)) {
      const got = createHash("sha256").update(readFileSync(resolve(root, rel))).digest("hex");
      expect(got, rel).toBe(want);
    }
  });

  test("VB1-G1–G12 production study", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Study!({}))) as {
      status: string;
      computed_disposition: string;
      gates: Array<{ id: string; pass: boolean; detail: string }>;
      named: Record<string, Record<string, { cg: { x_lat: number; z_long: number; y_vert: number } }>>;
      readyDrive: { cgShift: { z_long: number }; envelopeSame: boolean };
      planform: { rearTotal: number; frontTotal: number };
      drive: { deploymentDirection: string };
      integrityPass: boolean;
    };
    const fail = r.gates.filter((g) => !g.pass);
    expect(fail, JSON.stringify(fail, null, 2)).toEqual([]);
    expect(r.status).toBe("VB1_CANDIDATE_PENDING_DIRECTOR_ASSUMPTION_REVIEW");
    expect(r.integrityPass).toBe(true);
    expect(Math.abs(r.named.NOMINAL.SPREAD.cg.x_lat)).toBeLessThan(0.02);
    expect(r.readyDrive.envelopeSame).toBe(true);
    expect(Math.abs(r.readyDrive.cgShift.z_long)).toBeGreaterThan(0.05);
    expect(r.drive.deploymentDirection).toBe("−Z_aft");
    expect(r.planform.rearTotal).toBeGreaterThan(15);
    expect(["BALANCE_CONCEPT_SURVIVES", "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION", "ARCHITECTURAL_REBALANCE_REQUIRED", "BALANCE_STUDY_INCONCLUSIVE"]).toContain(
      r.computed_disposition,
    );
  });

  test("NC1 lateral symmetry fails G7", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Study!({ wrongSideMass: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
      named: Record<string, Record<string, { cg: { x_lat: number } }>>;
    };
    expect(r.named.NOMINAL.SPREAD.cg.x_lat).not.toBeCloseTo(0, 2);
    expect(r.gates.find((g) => g.id === "VB1-G7")?.pass).toBe(false);
  });

  test("NC2 frozen drive fails G9", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Study!({ freezeDriveCentroid: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
      readyDrive: { cgShift: { z_long: number } };
    };
    expect(Math.abs(r.readyDrive.cgShift.z_long)).toBeLessThan(0.02);
    expect(r.gates.find((g) => g.id === "VB1-G9")?.pass).toBe(false);
  });

  test("NC3 duplicate planform fails G10", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Study!({ duplicatePlanform: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
      planformDuplicate: { combined: number };
      planform: { combined: number };
    };
    expect(r.planformDuplicate.combined).toBeGreaterThan(r.planform.combined * 1.05);
    expect(r.gates.find((g) => g.id === "VB1-G10")?.pass).toBe(false);
  });

  test("NC4 volume mass model fails G4", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Study!({ useVolumeMass: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "VB1-G4")?.pass).toBe(false);
  });
});
