import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { ORIGINAL_VB1_FILE_SHA256, ORIGINAL_VB1_RESULTS_MD_SHA256, ORIGINAL_VB1_ZIP_SHA256 } from "../src/study/vb1/ar1F5";
import { S4A_SHA256 as S4A } from "../src/study/vb1/constants";

const here = dirname(fileURLToPath(import.meta.url));

test.describe("MT1-VB1-AR1 F5 location addendum", () => {
  test("AR1-G1/G2 frozen identities", () => {
    expect(S4A).toBe("95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8");
    const root = resolve(here, "..");
    for (const [rel, want] of Object.entries(ORIGINAL_VB1_FILE_SHA256)) {
      const got = createHash("sha256").update(readFileSync(resolve(root, rel))).digest("hex");
      expect(got, rel).toBe(want);
    }
    const zip = resolve(here, "../../MT1-VB1.zip");
    try {
      const zipHash = createHash("sha256").update(readFileSync(zip)).digest("hex");
      expect(zipHash).toBe(ORIGINAL_VB1_ZIP_SHA256);
      const archived = execFileSync("unzip", ["-p", zip, "MT1/MT1_VB1_RESULTS.md"]);
      expect(createHash("sha256").update(archived).digest("hex")).toBe(ORIGINAL_VB1_RESULTS_MD_SHA256);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      expect(ORIGINAL_VB1_ZIP_SHA256.length).toBe(64);
    }
  });

  test("AR1-G1–G10 production addendum", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Ar1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Ar1Study!({}))) as {
      status: string;
      computed_disposition_after_F5: string;
      gates: Array<{ id: string; pass: boolean; detail: string }>;
      baselineReproduction: Record<string, number>;
      inventory: { names: string[]; foreign: string[] };
      F5_LOCATION_EFFECT: { forward_vs_aft: number };
    };
    const fail = r.gates.filter((g) => !g.pass);
    expect(fail, JSON.stringify(fail, null, 2)).toEqual([]);
    expect(r.status).toBe("PENDING_DIRECTOR_ASSUMPTION_DISPOSITION");
    expect(r.computed_disposition_after_F5).toBe("BALANCE_CONCEPT_SURVIVES_WITH_CAUTION");
    expect((r as { analyst_disposition?: string }).analyst_disposition).toBe("BALANCE_CONCEPT_SURVIVES_WITH_CAUTION");
    expect((r as { externally_adjudicated_disposition?: string }).externally_adjudicated_disposition).toBe(
      "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION",
    );
    expect((r as { disposition_provenance?: { computed_from_internal_robust_red_predicate?: boolean } }).disposition_provenance?.computed_from_internal_robust_red_predicate).toBe(
      false,
    );
    expect(r.inventory.foreign).toEqual([]);
    expect(r.inventory.names).toContain("VENTRAL_KEEL");
    expect(Math.max(...Object.values(r.baselineReproduction))).toBeLessThan(0.002);
  });

  test("NC-AR1-1 mass invariant fails G5", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Ar1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Ar1Study!({ brokenF5Mass: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "AR1-G5")?.pass).toBe(false);
  });

  test("NC-AR1-2 out-of-geometry fails G6", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Ar1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Ar1Study!({ outOfGeometry: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "AR1-G6")?.pass).toBe(false);
  });

  test("NC-AR1-3 volume-weighted split fails G7", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runVb1Ar1Study));
    const r = (await page.evaluate(() => window.__MT1!.runVb1Ar1Study!({ volumeWeighted: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "AR1-G7")?.pass).toBe(false);
  });
});
