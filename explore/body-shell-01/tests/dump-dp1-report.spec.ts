import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import { S4A_SOURCE_SHA256 } from "../src/study/vb1/s4aSourceManifest";

const here = dirname(fileURLToPath(import.meta.url));

function attestReadmeScope(): {
  evidenceKind: "EXTERNAL_ATTESTATION";
  status: "PASS" | "FAIL";
  source: "Playwright/release README test";
  staleProhibitionPresent: boolean;
  correctedSentencePresent: boolean;
} {
  const readme = readFileSync(resolve(here, "../README.md"), "utf8");
  const stale = /Do not begin S5 or drive\/cockpit architecture/.test(readme);
  const corrected = /Do not begin S6, cockpit\/intake architecture/.test(readme);
  return {
    evidenceKind: "EXTERNAL_ATTESTATION",
    status: !stale && corrected ? "PASS" : "FAIL",
    source: "Playwright/release README test",
    staleProhibitionPresent: stale,
    correctedSentencePresent: corrected,
  };
}

function attestS4aSources(): {
  evidenceKind: "EXTERNAL_ATTESTATION";
  status: "PASS" | "FAIL";
  source: "Playwright/release hash test";
  sourceCount: number;
  mismatches: string[];
} {
  const root = resolve(here, "..");
  const mismatches: string[] = [];
  for (const [rel, want] of Object.entries(S4A_SOURCE_SHA256)) {
    const got = createHash("sha256").update(readFileSync(resolve(root, rel))).digest("hex");
    if (got !== want) mismatches.push(rel);
  }
  return {
    evidenceKind: "EXTERNAL_ATTESTATION",
    status: mismatches.length === 0 ? "PASS" : "FAIL",
    source: "Playwright/release hash test",
    sourceCount: Object.keys(S4A_SOURCE_SHA256).length,
    mismatches,
  };
}

test("dump MT1-DP1A architecture study", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runDp1Study));
  const report = (await page.evaluate(() => window.__MT1!.runDp1Study!({}))) as {
    stations: unknown;
    live: unknown;
    engagementTruth: unknown;
    assumptions: unknown;
    packaging: unknown;
    allowanceCorners: unknown;
    flowInterface: unknown;
    flowHandover: unknown;
    structuralSeat: unknown;
    structuralHandover: unknown;
    loadPaths: unknown;
    spreadAssumption: unknown;
    waistInterfaces: unknown;
    families: unknown;
    comparison: unknown;
    disposition: unknown;
    status: unknown;
    gates: Array<Record<string, unknown>>;
    closures: Array<Record<string, unknown>>;
    sentence: unknown;
    CORE_CAN_HANDOVER_STATION: unknown;
    killConditionsEncountered: unknown;
    spigotCandidates: unknown;
    svg: { longitudinal: string; crossSection: string; loadPath: string; motion: string; handover: string };
    sourceS4aSha256: unknown;
    sourceDp1Sha256: unknown;
    freezeId: unknown;
  };
  const attestation = attestS4aSources();
  const readmeAttestation = attestReadmeScope();
  const flowNegativeControl = (await page.evaluate(() => window.__MT1!.runDp1Study!({ shortSpigot: true }))) as {
    flowHandover: { selectedSpigotLength: number; flowInsertion: number; nondegenerate: boolean };
    gates: Array<{ id: string; pass: boolean | null }>;
  };
  const flowNegativeControlPass =
    Math.abs(flowNegativeControl.flowHandover.selectedSpigotLength - 0.15) < 1e-9 &&
    Math.abs(flowNegativeControl.flowHandover.flowInsertion - 0.03) < 1e-9 &&
    flowNegativeControl.flowHandover.nondegenerate === false &&
    flowNegativeControl.gates.find((g) => g.id === "DP1-G6")?.pass === false;
  const attestedGates = report.gates.map((g) => {
    if (g.id === "DP1-G1" || g.id === "DP1-G9") {
      return {
        ...g,
        pass: attestation.status === "PASS",
        status: attestation.status,
        source: attestation.source,
        attestedSourceCount: attestation.sourceCount,
        mismatches: attestation.mismatches,
      };
    }
    return g;
  });
  const attestedClosures = report.closures.map((c) => {
    if (c.id === "C2") {
      return {
        ...c,
        pass: flowNegativeControlPass,
        status: flowNegativeControlPass ? "PASS" : "FAIL",
        source: "Playwright/release prior-spigot regression",
        detail: `NC-FLOW1: prior 0.150 m spigot; insertion=${flowNegativeControl.flowHandover.flowInsertion.toFixed(3)}; nondegenerate=${flowNegativeControl.flowHandover.nondegenerate}; G6 ${flowNegativeControl.gates.find((g) => g.id === "DP1-G6")?.pass === false ? "FAIL" : "PASS"}`,
      };
    }
    if (c.id === "C9") {
      return {
        ...c,
        pass: readmeAttestation.status === "PASS",
        status: readmeAttestation.status,
        source: readmeAttestation.source,
        staleProhibitionPresent: readmeAttestation.staleProhibitionPresent,
        correctedSentencePresent: readmeAttestation.correctedSentencePresent,
      };
    }
    return c;
  });
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  writeFileSync(
    resolve(ev, "dp1-geometry-facts.json"),
    JSON.stringify(
      {
        tag: "S4A_GEOMETRY_FACT",
        sourceS4aSha256: report.sourceS4aSha256,
        stations: report.stations,
        live: report.live,
        engagementTruth: report.engagementTruth,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(ev, "dp1-assumptions.json"),
    JSON.stringify(
      {
        tag: "DP1_ARCHITECTURE_ASSUMPTION",
        assumptions: report.assumptions,
        handover: report.CORE_CAN_HANDOVER_STATION,
        flowInterface: report.flowInterface,
        structuralSeat: report.structuralSeat,
        spreadAssumption: report.spreadAssumption,
        waistInterfaces: report.waistInterfaces,
        families: report.families,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(ev, "dp1-results.json"),
    JSON.stringify(
      {
        tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
        freezeId: report.freezeId,
        sourceDp1Sha256: report.sourceDp1Sha256,
        status: report.status,
        disposition: report.disposition,
        packaging: report.packaging,
        allowanceCorners: report.allowanceCorners,
        loadPaths: report.loadPaths,
        comparison: report.comparison,
        killConditionsEncountered: report.killConditionsEncountered,
        sentence: report.sentence,
        gates: attestedGates,
        closures: attestedClosures,
        s4aAttestation: attestation,
        readmeAttestation,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(ev, "dp1-handover-model.json"),
    JSON.stringify(
      {
        tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
        flowHandover: report.flowHandover,
        structuralHandover: report.structuralHandover,
        spigotCandidates: report.spigotCandidates,
      },
      null,
      2,
    ),
  );
  writeFileSync(resolve(ev, "dp1-longitudinal.svg"), report.svg.longitudinal);
  writeFileSync(resolve(ev, "dp1-cross-section.svg"), report.svg.crossSection);
  writeFileSync(resolve(ev, "dp1-load-path.svg"), report.svg.loadPath);
  writeFileSync(resolve(ev, "dp1-motion.svg"), report.svg.motion);
  writeFileSync(resolve(ev, "dp1-handover-detail.svg"), report.svg.handover);
});
