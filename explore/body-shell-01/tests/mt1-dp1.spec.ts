import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { S4A_SOURCE_SHA256 } from "../src/study/vb1/s4aSourceManifest";
import { S4A_SHA256 } from "../src/study/dp1/stations";
import { stationsFromParams, deployedBayEngagement } from "../src/study/dp1/stations";
import { derivePackaging, enumerateAllowanceCorners } from "../src/study/dp1/packaging";
import {
  overlapLength,
  modelFlowHandover,
  enumerateSpigotCandidates,
  SELECTED_SPIGOT_LENGTH,
  PUBLISHED_SPIGOT_LENGTH,
  NONDEGENERATE_INSERTION,
} from "../src/study/dp1/handover";

const here = dirname(fileURLToPath(import.meta.url));

type Gate = { id: string; pass: boolean | null; status: string; evidenceKind: string; detail: string };
type Closure = { id: string; pass: boolean | null; detail: string };

test.describe("MT1-DP1A flow/structural handover closure", () => {
  test("DP1-G1 S4A sources unchanged + station signs", () => {
    expect(S4A_SHA256).toBe("95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8");
    const root = resolve(here, "..");
    for (const [rel, want] of Object.entries(S4A_SOURCE_SHA256)) {
      const got = createHash("sha256").update(readFileSync(resolve(root, rel))).digest("hex");
      expect(got, rel).toBe(want);
    }
    const s = stationsFromParams();
    const e = deployedBayEngagement(s);
    expect(s.CAN_DEPLOYED_FORWARD_FACE).toBeCloseTo(-4.525, 8);
    expect(s.BAY_AFT_HOOP).toBeCloseTo(-4.8, 8);
    expect(s.BAY_AFT_STATION).toBeCloseTo(-4.8, 8);
    expect(s.CAN_DEPLOYED_FORWARD_FACE).toBeGreaterThan(s.BAY_AFT_HOOP);
    expect(e.value).toBeCloseTo(0.275, 8);
    expect(e.interpretation).toBe("mechanically_useful");
    expect(s.stroke).toBe(s.canLength);
  });

  test("allowance-range eight-corner core envelopes", () => {
    const s = stationsFromParams();
    const r = enumerateAllowanceCorners(s.outerCan.w, s.outerCan.h, { w: 0.7, h: 0.52 });
    expect(r.corners).toHaveLength(8);
    expect(r.favorable).toEqual({ w: 0.8, h: 0.62, id: "WLRLAL" });
    expect(r.nominalPublished).toEqual({ w: 0.74, h: 0.56 });
    expect(r.conservative).toEqual({ w: 0.66, h: 0.48, id: "WHRHAH" });
    expect(r.NOMINAL_CORE_PROXY).toEqual({ w: 0.7, h: 0.52 });
    expect(r.RANGE_ROBUST_CORE_PROXY).toEqual({ w: 0.66, h: 0.48 });
    expect(r.recommendedIsRangeRobust).toBe(false);
    const hhh = r.corners.find((c) => c.id === "WHRHAH");
    expect(hhh?.admitsNominalRecommended).toBe(false);
  });

  test("C1 flow insertion is interval overlap, not bay engagement", () => {
    const s = stationsFromParams();
    const pack = derivePackaging(s);
    const flow = modelFlowHandover(s, pack);
    expect(flow.CORE_BULK_AFT_FACE).toBeCloseTo(-4.405, 6);
    expect(flow.CAN_DEPLOYED_FORWARD_FACE).toBeCloseTo(-4.525, 6);
    expect(flow.coreToCanMouthGap).toBeCloseTo(0.12, 6);
    expect(flow.publishedInsertionIfUnchanged).toBeCloseTo(0.03, 6);
    expect(SELECTED_SPIGOT_LENGTH).toBeCloseTo(0.24, 8);
    expect(PUBLISHED_SPIGOT_LENGTH).toBeCloseTo(0.15, 8);
    expect(flow.selectedSpigotLength).toBeCloseTo(0.24, 8);
    expect(flow.FLOW_SPIGOT_AFT_TIP).toBeCloseTo(-4.645, 6);
    expect(flow.CAN_RECEIVER_AFT_EXTENT).toBeCloseTo(-4.705, 6);
    expect(flow.flowInsertion).toBeCloseTo(0.12, 6);
    expect(flow.flowInsertion).not.toBeCloseTo(pack.usableEngagement, 3);
    expect(
      overlapLength(flow.FLOW_SPIGOT_INTERVAL, flow.CAN_RECEIVER_INTERVAL),
    ).toBeCloseTo(flow.flowInsertion, 12);
    expect(flow.remainingReceiverAftOfTip).toBeCloseTo(0.06, 6);
    expect(flow.remainingBayAftOfTip).toBeGreaterThan(0.1);
    const cands = enumerateSpigotCandidates(s, pack);
    expect(cands.find((c) => c.id === "published_0.150")?.insertion).toBeCloseTo(0.03, 6);
    expect(cands.find((c) => c.id === "published_0.150")?.nondegenerate).toBe(false);
    expect(cands.find((c) => c.id === "selected_0.240")?.nondegenerate).toBe(true);
  });

  test("C9 README does not retain the pre-DP1 drive prohibition", () => {
    const readme = readFileSync(resolve(here, "../README.md"), "utf8");
    expect(readme).not.toMatch(/Do not begin S5 or drive\/cockpit architecture/);
    expect(readme).toMatch(/Do not begin S6, cockpit\/intake architecture/);
  });

  test("DP1-G1–G10 production study", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({}))) as {
      status: string;
      disposition: string;
      freezeId: string;
      gates: Gate[];
      closures: Closure[];
      engagementTruth: { value: number };
      packaging: { usableEngagement: number; canFullyLeavesBay: boolean; innerPassage: { w: number; h: number } };
      allowanceCorners: { recommendedIsRangeRobust: boolean; NOMINAL_CORE_PROXY: { w: number; h: number }; RANGE_ROBUST_CORE_PROXY: { w: number; h: number } };
      flowHandover: {
        flowInsertion: number;
        selectedSpigotLength: number;
        coreToCanMouthGap: number;
        nondegenerateInsertionThreshold: number;
        nondegenerate: boolean;
      };
      structuralHandover: {
        railBypassComplete: boolean;
        graphConnected: boolean;
        coexistenceOk: boolean;
        graph: Array<{ from: string; to: string; kind: string }>;
      };
    };
    const computedFail = r.gates.filter((g) => g.evidenceKind === "COMPUTED_STUDY_RESULT" && g.pass !== true);
    expect(computedFail, JSON.stringify(computedFail, null, 2)).toEqual([]);
    expect(r.gates.find((g) => g.id === "DP1-G1")?.evidenceKind).toBe("EXTERNAL_ATTESTATION");
    expect(r.gates.find((g) => g.id === "DP1-G9")?.evidenceKind).toBe("EXTERNAL_ATTESTATION");
    expect(r.gates.find((g) => g.id === "DP1-G1")?.status).toBe("EXTERNAL_ATTESTATION_REQUIRED");
    expect(r.gates.find((g) => g.id === "DP1-G9")?.status).toBe("EXTERNAL_ATTESTATION_REQUIRED");
    expect(r.status).toBe("DP1A_CANDIDATE_PENDING_DIRECTOR");
    expect(r.disposition).toBe("DP1A_BPRIME_SURVIVES_WITH_CAUTION");
    expect(r.freezeId).toBe("MT1-DP1A");
    expect(r.engagementTruth.value).toBeCloseTo(0.275, 6);
    expect(r.packaging.canFullyLeavesBay).toBe(false);
    expect(r.packaging.usableEngagement).toBeGreaterThan(0.12);
    expect(r.packaging.innerPassage.w).toBeGreaterThan(0.7);
    expect(r.allowanceCorners.recommendedIsRangeRobust).toBe(false);
    expect(r.allowanceCorners.NOMINAL_CORE_PROXY).toEqual({ w: 0.7, h: 0.52 });
    expect(r.allowanceCorners.RANGE_ROBUST_CORE_PROXY).toEqual({ w: 0.66, h: 0.48 });
    expect(r.flowHandover.flowInsertion).toBeCloseTo(0.12, 6);
    expect(r.flowHandover.selectedSpigotLength).toBeCloseTo(0.24, 6);
    expect(r.flowHandover.coreToCanMouthGap).toBeCloseTo(0.12, 6);
    expect(r.flowHandover.nondegenerateInsertionThreshold).toBeCloseTo(NONDEGENERATE_INSERTION, 8);
    expect(r.flowHandover.nondegenerate).toBe(true);
    expect(NONDEGENERATE_INSERTION).toBeCloseTo(0.05, 8);
    expect(r.structuralHandover.railBypassComplete).toBe(true);
    expect(r.structuralHandover.graphConnected).toBe(true);
    expect(r.structuralHandover.coexistenceOk).toBe(true);
    expect(r.structuralHandover.graph).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "AFT_POST_PAIR", to: "BAY_WALL_PORT/STBD", kind: "existing_s4a_physical_contact" }),
        expect.objectContaining({ from: "BAY_WALL_PORT/STBD", to: "BULKHEAD_Z-1p70", kind: "existing_s4a_physical_contact" }),
        expect.objectContaining({ from: "BULKHEAD_Z-1p70", to: "VENTRAL_KEEL", kind: "existing_s4a_physical_contact" }),
      ]),
    );
    const falseDirectKeelContacts = r.structuralHandover.graph.filter(
      (edge) =>
        edge.kind === "existing_s4a_physical_contact" &&
        /^(AFT_POST|BAY_WALL)/.test(edge.from) &&
        /^(SPANNING_KEEL|VENTRAL_KEEL)$/.test(edge.to),
    );
    expect(falseDirectKeelContacts).toEqual([]);
    const closureFail = r.closures.filter((c) => c.id !== "C2" && c.id !== "C9" && c.pass !== true);
    expect(closureFail, JSON.stringify(closureFail, null, 2)).toEqual([]);
  });

  test("NC1 inverted engagement sign fails G3", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ invertEngagementSign: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
    };
    expect(r.gates.find((g) => g.id === "DP1-G3")?.pass).toBe(false);
  });

  test("NC2 oversized core fails G4", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ oversizedCore: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
    };
    expect(r.gates.find((g) => g.id === "DP1-G4")?.pass).toBe(false);
  });

  test("NC3 solid can fails G5", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ solidCan: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
    };
    expect(r.gates.find((g) => g.id === "DP1-G5")?.pass).toBe(false);
  });

  test("NC4 / NC-STRUCT1 no seat fails G7 and G8", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ noSeat: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
    };
    expect(r.gates.find((g) => g.id === "DP1-G7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G8")?.pass).toBe(false);
  });

  test("NC-FLOW1 prior 0.150 m spigot fails G6 with marginal insertion", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ shortSpigot: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
      flowHandover: { flowInsertion: number; selectedSpigotLength: number; nondegenerate: boolean };
      closures: Closure[];
    };
    expect(r.flowHandover.selectedSpigotLength).toBeCloseTo(0.15, 8);
    expect(r.flowHandover.flowInsertion).toBeCloseTo(0.03, 8);
    expect(r.flowHandover.flowInsertion).toBeGreaterThan(0);
    expect(r.flowHandover.flowInsertion).toBeLessThanOrEqual(NONDEGENERATE_INSERTION);
    expect(r.flowHandover.nondegenerate).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G6")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C2")?.pass).toBeNull();
    expect(r.closures.find((c) => c.id === "C2")?.detail).toContain("prior 0.150 m spigot");
  });

  test("NC-FLOW2 receiver removed fails G6", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ noReceiver: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
      flowHandover: { receiverDepth: number; flowInsertion: number };
    };
    expect(r.flowHandover.receiverDepth).toBe(0);
    expect(r.flowHandover.flowInsertion).toBeCloseTo(0, 8);
    expect(r.gates.find((g) => g.id === "DP1-G6")?.pass).toBe(false);
  });

  test("NC-FLOW3 blocked passage fails G5 and G6", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ blockPassage: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
      flowHandover: { axialPassageContinuous: boolean };
    };
    expect(r.flowHandover.axialPassageContinuous).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G5")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G6")?.pass).toBe(false);
  });

  test("NC-STRUCT2 handover frame disconnected fails G7", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ noFrame: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
    };
    expect(r.gates.find((g) => g.id === "DP1-G7")?.pass).toBe(false);
  });

  test("NC-STRUCT3 rails-only path fails G8", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ railsOnly: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
      structuralHandover: { railBypassComplete: boolean };
    };
    expect(r.structuralHandover.railBypassComplete).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G8")?.pass).toBe(false);
  });

  test("NC-STRUCT4 lug intersects rail sector fails G7", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
    const r = (await page.evaluate(() => window.__MT1!.runDp1Study!({ lugHitsRail: true }))) as {
      gates: Array<{ id: string; pass: boolean | null }>;
      structuralHandover: { lugClearsRails: boolean };
    };
    expect(r.structuralHandover.lugClearsRails).toBe(false);
    expect(r.gates.find((g) => g.id === "DP1-G7")?.pass).toBe(false);
  });
});
