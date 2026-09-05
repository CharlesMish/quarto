import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_ROWS = [
  "folio faces",
  "folio roots",
  "FO1 shoulder",
  "chine",
  "keel",
  "dorsal member",
  "mid-body",
  "prow/front reservation",
  "bay",
  "stern opening",
  "can",
] as const;

const REQUIRED_COLUMNS = [
  "physicalReality",
  "currentPresentationClaim",
  "ba1Class",
  "spreadObligation",
  "driveObligation",
  "futureArchitectureImplication",
  "doNotTouch",
] as const;

const LEGAL_CLASSES = [
  "ALREADY_REAL_BODY_ARCHITECTURE",
  "PRESENTATION_SUFFICIENT",
  "PRESENTATION_LANGUAGE_ONLY",
  "REAL_ARCHITECTURE_REQUIRED_FOR_STRONG_OWNERSHIP",
  "INTENTIONALLY_EXPOSED",
  "INTENTIONALLY_UNASSIGNED",
  "UNKNOWN",
] as const;

test("MT1-BA1 decision map is complete, non-authoritative, and does not start a body slice", async () => {
  const map = JSON.parse(readFileSync(resolve("evidence/ba1-body-map.json"), "utf8")) as {
    studyId: string;
    status: string;
    freezeId: string;
    participatesInAuthority: boolean;
    addsVehicleGeometry: boolean;
    authorityParticipation: string;
    professionsAssigned: unknown[];
    reopensS5: boolean;
    startsBodyShell04: boolean;
    retriesSo1: boolean;
    so1GeometryPromoted: boolean;
    fo1Status: string;
    so1Status: string;
    promotionCandidates: unknown[];
    regionsRequiringRealArchitectureForStrongOwnership: unknown[];
    unknownRegions: unknown[];
    topLevelInterpretation: { code: string; name: string };
    nextSlice: { id: string; explicitlyNot: string[] };
    decisionMap: Array<Record<string, string>>;
    doNotPromotePresentationLanguage: string[];
    remainExposed: string[];
  };

  expect(map.studyId).toBe("MT1-BA1");
  expect(map.status).toBe("STUDY_ONLY");
  expect(map.freezeId).toBe("MT1-S5HR3R1");
  expect(map.participatesInAuthority).toBe(false);
  expect(map.addsVehicleGeometry).toBe(false);
  expect(map.authorityParticipation).toBe("none");
  expect(map.professionsAssigned).toEqual([]);
  expect(map.reopensS5).toBe(false);
  expect(map.startsBodyShell04).toBe(false);
  expect(map.retriesSo1).toBe(false);
  expect(map.so1GeometryPromoted).toBe(false);
  expect(map.fo1Status).toBe("ACCEPTED");
  expect(map.so1Status).toBe("NEGATIVE_PRESENTATION_RESULT");
  expect(map.topLevelInterpretation.code).toBe("A");
  expect(map.topLevelInterpretation.name).toBe("EXPOSED-CARRIER VEHICLE");
  expect(map.promotionCandidates).toEqual([]);
  expect(map.regionsRequiringRealArchitectureForStrongOwnership).toEqual([]);
  expect(map.unknownRegions).toEqual([]);
  expect(map.nextSlice.id).toBe("none-yet-wait-for-functional-requirements");
  for (const forbidden of [
    "BODY-SHELL-04",
    "SO1.1",
    "SR1",
    "cockpit",
    "ground-gear",
    "folio-profession",
    "engine-internals",
  ]) {
    expect(map.nextSlice.explicitlyNot).toContain(forbidden);
    expect(map.nextSlice.id).not.toContain(forbidden);
  }

  expect(map.decisionMap.map((row) => row.row)).toEqual([...REQUIRED_ROWS]);
  for (const row of map.decisionMap) {
    for (const col of REQUIRED_COLUMNS) {
      expect(row[col], `${row.row}.${col}`).toBeTruthy();
    }
    expect(LEGAL_CLASSES, row.row).toContain(row.ba1Class);
    expect(row.ba1Class).not.toBe("REAL_ARCHITECTURE_REQUIRED_FOR_STRONG_OWNERSHIP");
  }

  expect(map.doNotPromotePresentationLanguage.length).toBeGreaterThanOrEqual(8);
  expect(map.remainExposed.length).toBeGreaterThanOrEqual(6);
  expect(map.doNotPromotePresentationLanguage.join(" ")).toMatch(/chine/i);
  expect(map.remainExposed.join(" ")).toMatch(/open stern/i);
});

test("handoff docs record FO1 live hero, park SR1, and keep the SO1 negative note", async () => {
  const readme = readFileSync(resolve("README.md"), "utf8");
  const current = readFileSync(resolve("docs/CURRENT_STATE.md"), "utf8");
  const so1 = readFileSync(resolve("explore/body-shell-03/MT1_SO1_NEGATIVE_RESULT.md"), "utf8");
  expect(readme).toContain("explore/body-shell-03/evidence/fo1/after/fo1-after-drive-three.png");
  expect(readme).not.toMatch(/Next planned slice\s*\|\s*\*\*MT1-SR1/);
  expect(current).toMatch(/EXPOSED-CARRIER VEHICLE/);
  expect(current).toContain("SR1 is parked, not invalidated");
  expect(current).toContain("None yet — wait for a functional requirement that creates a new physical relationship");
  expect(current).toContain("MT1_SO1_NEGATIVE_RESULT.md");
  expect(so1).toMatch(/CLOSED NEGATIVE PRESENTATION RESULT/);
  expect(existsSync(resolve("explore/body-shell-03/evidence/README.md"))).toBe(true);
  expect(existsSync(resolve("explore/body-shell-03/evidence/fo1/after/fo1-after-drive-three.png"))).toBe(true);
  expect(existsSync(resolve("explore/body-shell-03/evidence/body-shell-03-drive-three.png"))).toBe(true);
});
