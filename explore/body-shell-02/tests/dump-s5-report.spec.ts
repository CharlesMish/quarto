import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { S5Override } from "../src/machine/s5Propulsion";

const here = dirname(fileURLToPath(import.meta.url));
const evidenceFile = resolve(here, "../evidence/s5-negative-control-results.json");
const evidenceTempFile = resolve(here, "../evidence/.s5-negative-control-results.tmp.json");

interface ControlContract {
  id: string;
  opts: S5Override;
  expected: string[];
  allowed: string[];
}

const contract = (id: string, opts: S5Override, expected: string[], allowed: string[] = []): ControlContract => ({ id, opts, expected, allowed });

const controls: ControlContract[] = [
  contract("NC-SPIGOT", { shortSpigot: true }, ["S5-P5"]),
  contract("NC1", { blockPassage: true }, ["S5-P3", "S5-P5", "C2"]),
  contract("NC4", { blockReceiver: true }, ["S5-P5"], ["S5-P3", "C2"]),
  contract("NC-LOCK1", { removeLock: "PORT" }, ["S5-P7"], ["S5-P8", "S5-P9", "S5-P10", "S5-P14", "C4", "C6", "C8", "C13", "C14", "C17", "C18", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC6", { bottomDog: true }, ["S5-P8"]),
  contract("NC-SHOULDER-FLOAT", { floatShoulder: "PORT" }, ["S5-P9"], ["S5-P7", "S5-P10", "S5-P12", "S5-P14", "C6", "C8", "C13", "C14", "C17", "C18", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-TRACK-FLOAT", { trackFloat: true }, ["S5-P7"], ["S5-P12", "S5-P14", "C6", "C8", "C14", "C16", "C17", "C18", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-OPEN-CAM", { openCam: "PORT" }, ["S5-P7", "S5-P12", "C8", "C14", "C18"], ["S5-P14", "C6", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-SOLID-GUIDE", { solidGuide: true }, ["S5-P7"], ["S5-P12", "S5-P14", "C6", "C8", "C14", "C17", "C18", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-ZERO-RETAINED-MARGIN", { zeroMargin: true }, ["C17"], ["S5-P7", "S5-P12", "C8", "C14", "C18", "C21", "C23"]),
  contract("NC-CAM-GAP", { camGap: "PORT" }, ["S5-P7"], ["S5-P12", "S5-P14", "C6", "C8", "C14", "C16", "C17", "C18", "C21", "C22", "C25"]),
  contract("NC-NONCURRENT-RAIL-INTRUSION", { railIntrude: true }, ["S5-P7", "C14", "C18"], ["S5-P12", "C8", "C23"]),
  contract("NC-BACKING-PLUG", { backingPlug: true }, ["S5-P6", "S5-P7"], ["S5-P12", "C8", "C14", "C18", "C23"]),
  contract("NC-NAMED-TRACK-INTRUDER", { namedIntrude: true }, ["C18"], ["S5-P7", "S5-P12", "C8", "C14", "C23"]),
  contract("NC-UNCLASSIFIED-SOLID", { unclassifiedIntrude: true }, ["C18"], ["S5-P7", "S5-P12", "S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-ENTRY-BLOCK", { entryBlock: true }, ["S5-P7", "S5-P12", "C23"], ["C8", "C14", "C18"]),
  contract("NC-REVERSE-JAM", { reverseJam: true }, ["S5-P7", "S5-P12", "S5-P14", "C6", "C22", "C25"], ["C8", "C14", "C18", "C21", "C23"]),
  contract("NC-MISSING-TRACK-PIECE", { missingTrackPiece: true }, ["S5-P7", "S5-P12", "C18"], ["S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-MISSING-B-FACES", { missingBFaces: true }, ["S5-P7", "S5-P12", "C18"], ["S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-UNTAGGED-CORRIDOR-SOLID", { untaggedCorridorSolid: true }, ["S5-P7", "S5-P12", "C18"], ["S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-MIDDLE-PATH-INTRUDER", { middlePathIntruder: true }, ["S5-P7", "S5-P12", "C18"], ["C8", "C14", "C23"]),
  contract("NC-PATH-MOVING-UNTAGGED", { pathMovingUntagged: true }, ["S5-P7", "S5-P12", "C18"], ["S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-FORGED-SURROUNDING-FAMILY", { forgedSurroundingFamily: true }, ["S5-P7", "S5-P12", "C18"], ["S5-P14", "C6", "C8", "C14", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-MIDPATH-TRANSIENT-ROW", { midpathTransientRow: true }, ["C18"], ["S5-P7", "S5-P12", "S5-P14", "C6", "C8", "C14", "C15", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-DUPLICATE-AUTHORITY-NAME", { duplicateAuthorityName: true }, ["C18"], ["S5-P3", "S5-P4", "S5-P5", "S5-P7", "S5-P8", "S5-P9", "S5-P10", "S5-P11", "S5-P12", "S5-P14", "C2", "C3", "C4", "C6", "C7", "C8", "C9", "C13", "C14", "C15", "C16", "C17", "C19", "C21", "C22", "C23", "C25"]),
  contract("NC-DUPLICATE-MOVING-ROW", { duplicateMovingRow: true }, ["C18"], ["S5-P7", "S5-P12", "S5-P14", "C6", "C8", "C14", "C15", "C17", "C19", "C21", "C22", "C23", "C25"]),
];

test("@current-authority-writer dump MT1-S5HR3R1 authority report", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
  const report = await page.evaluate(() => window.__MT1!.runS5Authority!({}));
  const ev = resolve(here, "../evidence");
  mkdirSync(ev, { recursive: true });
  writeFileSync(resolve(ev, "s5-authority-report.json"), JSON.stringify(report, null, 2));
  expect(report.negativeControls.every((row) => row.status === "NOT_RUN")).toBe(true);
});

test("@evidence-writer dump strict S5HR3R1 negative-control ledger", async ({ page }) => {
  test.setTimeout(3_600_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
  const rows: Array<Record<string, unknown>> = [];
  rmSync(evidenceTempFile, { force: true });
  const persistRows = () => {
    mkdirSync(dirname(evidenceFile), { recursive: true });
    writeFileSync(evidenceTempFile, JSON.stringify({ schema: "MT1-S5HR3R1-negative-control-ledger-v1", complete: false, controls: rows }, null, 2));
  };

  const upstream = await page.evaluate(() => {
    window.__MT1!.setReadinessOverride!({ rearBookReady: false });
    window.__MT1!.setMachineT(1);
    const driveT = window.__MT1!.getDriveT();
    const ready = window.__MT1!.getDriveThrustReady!();
    window.__MT1!.setReadinessOverride!({});
    window.__MT1!.setMachineT(1);
    const restoredRaw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
    const restoredEvaluate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
    const restoredPublic = window.__MT1!.getDriveThrustReady!();
    const restoredCertificate = window.__MT1!.getS5PathCertificate!()?.valid === true;
    return { driveT, ready, restoredRaw, restoredEvaluate, restoredPublic, restoredCertificate };
  });
  const upstreamRestored = upstream.restoredRaw && upstream.restoredEvaluate && upstream.restoredPublic && upstream.restoredCertificate;
  rows.push({
    id: "NC-UPSTREAM", mutation: { rearBookReady: false }, mutationApplied: upstream.driveT === 0,
    expectedFailingGates: ["driveT==0", "publicReady==false"], allowedCascadeContract: [], allowedCascadeFailures: [],
    actualFailedGates: [upstream.driveT === 0 ? "driveT==0" : `driveT=${upstream.driveT}`, upstream.ready ? "publicReady==true" : "publicReady==false"],
    expectedFailedClosures: [], actualFailedClosures: [], publicReadyExpectation: false, actualPublicReady: upstream.ready,
    expectedAuthorityNcRowStatus: "NOT_APPLICABLE_EXTERNAL_UPSTREAM_CONTROL", authorityNcRowStatus: "NOT_APPLICABLE_EXTERNAL_UPSTREAM_CONTROL",
    unexpectedFailures: [], baselineRestorationVerified: upstreamRestored,
    restorationReadiness: { raw: upstream.restoredRaw, evaluate: upstream.restoredEvaluate, getter: upstream.restoredPublic, certificate: upstream.restoredCertificate },
    finalControlResult: upstream.driveT === 0 && !upstream.ready && upstreamRestored ? "PASS" : "FAIL",
  });
  persistRows();

  for (const c of controls) {
    const report = await page.evaluate((opts) => window.__MT1!.runS5Authority!(opts), c.opts);
    const live = await page.evaluate((opts) => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.applyS5Override!(opts);
      const evaluateImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const rawReady = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
      const publicReady = window.__MT1!.getDriveThrustReady!();
      window.__MT1!.applyS5Override!({});
      const overrideRestored = Object.keys(window.__MT1!.getS5Override!()).length === 0;
      const restoredRaw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
      const restoredEvaluate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const restoredPublic = window.__MT1!.getDriveThrustReady!();
      const restoredCertificate = window.__MT1!.getS5PathCertificate!()?.valid === true;
      return { evaluateImmediate, rawReady, publicReady, overrideRestored, restoredRaw, restoredEvaluate, restoredPublic, restoredCertificate };
    }, c.opts);
    const actualFailedGates = report.gates.filter((gate) => !gate.pass).map((gate) => gate.id);
    const actualFailedClosures = report.closures.filter((gate) => !gate.pass).map((gate) => gate.id);
    const actual = [...actualFailedGates, ...actualFailedClosures];
    const expectedMissing = c.expected.filter((id) => !actual.includes(id));
    const allowedCascadeFailures = actual.filter((id) => c.allowed.includes(id));
    const unexpected = actual.filter((id) => !c.expected.includes(id) && !c.allowed.includes(id));
    const unexpectedFailures = [...expectedMissing.map((id) => `MISSING_EXPECTED:${id}`), ...unexpected];
    const authorityRow = report.negativeControls.find((row) => row.id === c.id);
    const mutationApplied = authorityRow?.status !== "NOT_RUN";
    const baselineRestorationVerified = live.overrideRestored && live.restoredRaw && live.restoredEvaluate && live.restoredPublic && live.restoredCertificate;
    const pass = mutationApplied && authorityRow?.status === "PASS" && !live.evaluateImmediate && !live.rawReady && !live.publicReady && baselineRestorationVerified && unexpectedFailures.length === 0;
    rows.push({
      id: c.id, mutation: c.opts, mutationApplied,
      expectedFailingGates: c.expected.filter((id) => !id.startsWith("C")), allowedCascadeContract: c.allowed, allowedCascadeFailures,
      actualFailedGates, expectedFailedClosures: c.expected.filter((id) => id.startsWith("C")), actualFailedClosures,
      publicReadyExpectation: false, actualPublicReady: live.publicReady,
      expectedAuthorityNcRowStatus: "PASS", authorityNcRowStatus: authorityRow?.status ?? "MISSING",
      authorityNcDetail: authorityRow?.detail ?? "MISSING",
      unexpectedFailures, baselineRestorationVerified,
      restorationReadiness: { raw: live.restoredRaw, evaluate: live.restoredEvaluate, getter: live.restoredPublic, certificate: live.restoredCertificate },
      finalControlResult: pass ? "PASS" : "FAIL",
    });
    persistRows();
  }

  const absent = await page.evaluate(() => {
    window.__MT1!.setMachineT(1);
    window.__MT1!.invalidateS5PathCertificate!();
    const evaluateReady = window.__MT1!.evaluateS5Handover!().driveThrustReady;
    const rawReady = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
    const publicReady = window.__MT1!.getDriveThrustReady!();
    window.__MT1!.runS5CamTrack!();
    const restoredRaw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
    const restoredEvaluate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
    const restoredPublic = window.__MT1!.getDriveThrustReady!();
    const restoredCertificate = window.__MT1!.getS5PathCertificate!()?.valid === true;
    return { evaluateReady, rawReady, publicReady, restoredRaw, restoredEvaluate, restoredPublic, restoredCertificate };
  });
  const absentActual = [!absent.evaluateReady ? "evaluate==false" : "evaluate==true", !absent.rawReady ? "raw==false" : "raw==true", !absent.publicReady ? "getter==false" : "getter==true"];
  const absentRestored = absent.restoredRaw && absent.restoredEvaluate && absent.restoredPublic && absent.restoredCertificate;
  const absentPass = absentActual.every((value) => value.endsWith("==false")) && absentRestored;
  rows.push({
    id: "NC-CERTIFICATE-ABSENT", mutation: { certificate: "ABSENT" }, mutationApplied: true,
    expectedFailingGates: ["evaluate==false", "raw==false", "getter==false"], allowedCascadeContract: [], allowedCascadeFailures: [],
    actualFailedGates: absentActual, expectedFailedClosures: [], actualFailedClosures: [], publicReadyExpectation: false, actualPublicReady: absent.publicReady,
    expectedAuthorityNcRowStatus: "NOT_APPLICABLE_API_CONTROL", authorityNcRowStatus: "NOT_APPLICABLE_API_CONTROL",
    unexpectedFailures: [], baselineRestorationVerified: absentRestored,
    restorationReadiness: { raw: absent.restoredRaw, evaluate: absent.restoredEvaluate, getter: absent.restoredPublic, certificate: absent.restoredCertificate },
    finalControlResult: absentPass ? "PASS" : "FAIL",
  });
  persistRows();
  expect(rows.every((row) => row.finalControlResult === "PASS" && (row.unexpectedFailures as string[]).length === 0), JSON.stringify(rows.filter((row) => row.finalControlResult !== "PASS" || (row.unexpectedFailures as string[]).length), null, 2)).toBe(true);
  writeFileSync(evidenceTempFile, JSON.stringify({ schema: "MT1-S5HR3R1-negative-control-ledger-v1", complete: true, controls: rows }, null, 2));
  renameSync(evidenceTempFile, evidenceFile);
});

test("validate strict executed S5HR3R1 ledger", () => {
  const ledger = JSON.parse(readFileSync(evidenceFile, "utf8")) as {
    schema: string;
    complete: boolean;
    controls: Array<{ mutationApplied: boolean; publicReadyExpectation: boolean | "UNCHANGED"; actualPublicReady: boolean; unexpectedFailures: string[]; baselineRestorationVerified: boolean; restorationReadiness: { raw: boolean; evaluate: boolean; getter: boolean; certificate: boolean }; finalControlResult: string }>;
  };
  expect(ledger.schema).toBe("MT1-S5HR3R1-negative-control-ledger-v1");
  expect(ledger.complete).toBe(true);
  expect(existsSync(evidenceTempFile)).toBe(false);
  expect(ledger.controls).toHaveLength(28);
  for (const row of ledger.controls) {
    expect(row.finalControlResult).toBe("PASS");
    expect(row.unexpectedFailures).toEqual([]);
    expect(row.mutationApplied).toBe(true);
    expect(row.baselineRestorationVerified).toBe(true);
    expect(row.restorationReadiness).toEqual({ raw: true, evaluate: true, getter: true, certificate: true });
    if (row.publicReadyExpectation !== "UNCHANGED") expect(row.actualPublicReady).toBe(row.publicReadyExpectation);
  }
});
