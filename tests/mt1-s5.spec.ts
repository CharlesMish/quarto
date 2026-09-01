import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { S4A_SOURCE_SHA256 } from "../src/study/vb1/s4aSourceManifest";
import { s5Insertion, S5P, HIST_S3A_REPORT_SHA256, HIST_S4_REPORT_SHA256 } from "../src/design/s5Parameters";

const here = dirname(fileURLToPath(import.meta.url));

test.describe("MT1-S5H captive cam shoe", () => {
  test("S4A sources unchanged + insertion arithmetic + historical evidence", () => {
    const root = resolve(here, "..");
    for (const [rel, want] of Object.entries(S4A_SOURCE_SHA256)) {
      const got = createHash("sha256").update(readFileSync(resolve(root, rel))).digest("hex");
      expect(got, rel).toBe(want);
    }
    expect(s5Insertion(0)).toBeCloseTo(0, 8);
    expect(s5Insertion(1)).toBeCloseTo(0.12, 6);
    expect(s5Insertion(1, 0.15)).toBeCloseTo(0.03, 6);
    expect(S5P.coreW).toBeCloseTo(0.7, 8);
    expect(createHash("sha256").update(readFileSync(resolve(root, "evidence/s3a-authority-report.json"))).digest("hex")).toBe(HIST_S3A_REPORT_SHA256);
    expect(createHash("sha256").update(readFileSync(resolve(root, "evidence/s4-authority-report.json"))).digest("hex")).toBe(HIST_S4_REPORT_SHA256);
    expect(existsSync(resolve(root, "evidence/s5-regression-s4.json"))).toBe(true);
  });

  test("S5-P1–P16 production", async ({ page }) => {
    test.setTimeout(600_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({}))) as {
      status: string;
      h1: string;
      gates: Array<{ id: string; pass: boolean; detail: string }>;
      closures: Array<{ id: string; pass: boolean }>;
      flow: { finalInsertion: number; minCoreCanClearance: number };
      firstThrustReady: { machineT: number; driveT: number };
      census: { LIVE_MATERIAL_PHYSICAL: number; LEGACY_SUPERSEDED_REFERENCE: number };
      supersession: { envelope: string; faceAft: string };
      envelopes: { e1: { width: number }; e2: { width: number }; e3: { width: number }; e4: { width: number } };
      negativeControls: Array<{ id: string; pass: boolean; status?: string }>;
    };
    const fail = r.gates.filter((g) => !g.pass);
    if (fail.length) console.log(JSON.stringify({ fail, closures: r.closures.filter((c) => !c.pass), camTrack: (r as unknown as { camTrack: unknown }).camTrack }, null, 2));
    expect(fail, JSON.stringify(fail, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN_PENDING_DIRECTOR");
    expect(r.h1).toBe("AWAITING_DIRECTOR_DISPOSITION");
    expect(r.negativeControls.every((n) => n.status === "NOT_RUN"), JSON.stringify(r.negativeControls.map((n) => `${n.id}:${n.status}`))).toBe(true);
    expect(r.flow.finalInsertion).toBeCloseTo(0.12, 2);
    expect(r.census.LEGACY_SUPERSEDED_REFERENCE).toBeGreaterThanOrEqual(2);
    expect(r.supersession.envelope).toMatch(/enabled=false/);
    const cFail = r.closures.filter((c) => !c.pass);
    expect(cFail, JSON.stringify(cFail)).toEqual([]);
    expect(r.envelopes.e4.width).toBeGreaterThanOrEqual(13.367149);
    expect(r.envelopes.e1.width).toBeGreaterThanOrEqual(13.367149);
    expect(r.envelopes.e2.width).toBeGreaterThanOrEqual(13.367149);
    expect(r.envelopes.e3.width).toBeGreaterThanOrEqual(13.367149);
  });

  test("legacy brick is actually disabled", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.evaluateS5Handover));
    const r = await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      const h = window.__MT1!.evaluateS5Handover!();
      return { passage: h.passageOpen, ready: window.__MT1!.getDriveThrustReady!() };
    });
    expect(r.passage).toBe(true);
    expect(r.ready).toBe(true);
  });

  test("NC-MAT1 re-enable envelope fails P3", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ enableLegacyEnvelope: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P3")?.pass).toBe(false);
  });

  test("NC-SPIGOT live 0.150 uses production readiness", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.applyS5Override));
    const r = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ shortSpigot: true });
      window.__MT1!.setMachineT(1);
      const h = window.__MT1!.evaluateS5Handover!();
      return {
        insertion: h.insertion,
        ready: window.__MT1!.getDriveThrustReady!(),
        liveL: h.liveSpigotLength,
        nondeg: h.insertionNondegenerate,
      };
    });
    expect(r.insertion).toBeCloseTo(0.03, 2);
    expect(r.nondeg).toBe(false);
    expect(r.ready).toBe(false);
    expect(r.liveL).toBeCloseTo(0.15, 2);
  });

  test("NC1 blocked passage fails P3", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ blockPassage: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P3")?.pass).toBe(false);
  });

  test("NC-LOCK1 one lock removed fails P7", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ removeLock: "PORT" }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
  });

  test("NC-LOCK2 engaged escape is blocked by shoulders", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.probeLockEscape));
    const r = await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      const h = window.__MT1!.evaluateS5Handover!();
      const probe = window.__MT1!.probeLockEscape!(true);
      return {
        retained: h.allLocksRetained,
        locks: h.locks,
        graph: h.seatGraph.pass,
        railBypass: h.railBypass,
        probe,
      };
    });
    expect(r.retained).toBe(true);
    expect(r.graph).toBe(true);
    expect(r.probe.blocked).toBe(true);
    expect(r.probe.hits).toEqual(
      expect.arrayContaining([
        "S5_LOCK_PIN_PORT ↔ S5_LOCK_SHOULDER_PORT",
        "S5_LOCK_PIN_STARBOARD ↔ S5_LOCK_SHOULDER_STARBOARD",
        "S5_LOCK_PIN_TOP_PORT ↔ S5_LOCK_SHOULDER_TOP_PORT",
        "S5_LOCK_PIN_TOP_STARBOARD ↔ S5_LOCK_SHOULDER_TOP_STARBOARD",
      ]),
    );
    for (const lock of r.locks) {
      expect(lock.lockTransverseInsertion, lock.id).toBeGreaterThan(0);
      expect(lock.cavityWallClearance, lock.id).toBeGreaterThan(0);
      expect(lock.lockAxialFreePlay, lock.id).toBeGreaterThanOrEqual(0);
      expect(lock.lockAxialFreePlay, lock.id).toBeLessThan(0.02);
      expect(lock.retained, lock.id).toBe(true);
    }
  });

  test("NC-LOCK3 retracted escape is clear", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.probeLockEscape));
    const r = await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      return window.__MT1!.probeLockEscape!(false);
    });
    expect(r.blocked).toBe(false);
    expect(r.hits).toEqual([]);
  });

  test("NC-LOCK-GAP S5A proximity is not a lock", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ lockGap: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
      locks: Array<{ lockTransverseInsertion: number; retained: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P9")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    for (const lock of r.locks) {
      expect(lock.lockTransverseInsertion).toBeLessThanOrEqual(0);
      expect(lock.retained).toBe(false);
    }
    const probe = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ lockGap: true });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.probeLockEscape!();
    });
    expect(probe.blocked).toBe(false);
  });

  test("NC-REGISTER mismatched scalar does not seat", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.setMachineT));
    const r = await page.evaluate(() => {
      window.__MT1!.setMachineT(0.94);
      const mid = window.__MT1!.evaluateS5Handover!();
      window.__MT1!.setMachineT(1);
      const end = window.__MT1!.evaluateS5Handover!();
      return { midSeated: mid.registerSeated, midMouth: mid.canMouthZ, endSeated: end.registerSeated, endMouth: end.canMouthZ };
    });
    expect(r.midSeated).toBe(false);
    expect(r.endSeated).toBe(true);
  });

  test("NC-FRAME old top frame fails P6", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ oldTopFrame: true }))) as {
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P6")?.pass).toBe(false);
  });

  test("NC-UPSTREAM lateral false keeps can stowed", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.setReadinessOverride));
    const r = await page.evaluate(() => {
      window.__MT1!.setReadinessOverride!({ rearBookReady: false });
      window.__MT1!.setMachineT(1);
      return { driveT: window.__MT1!.getDriveT(), ready: window.__MT1!.getDriveThrustReady?.() };
    });
    expect(r.driveT).toBe(0);
    expect(r.ready).toBe(false);
  });

  test("NC-HIST does not overwrite historical S4 evidence", () => {
    const hist = createHash("sha256").update(readFileSync(resolve(here, "../evidence/s4-authority-report.json"))).digest("hex");
    expect(hist).toBe(HIST_S4_REPORT_SHA256);
  });

  test("NC-SHOULDER-FLOAT local lock without structural splice", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ floatShoulder: "PORT" }))) as {
      gates: Array<{ id: string; pass: boolean }>;
      closures: Array<{ id: string; pass: boolean }>;
      locks: Array<{ id: string; retained: boolean; shoulderSpliced: boolean }>;
    };
    expect(r.locks.find((l) => l.id === "PORT")?.retained).toBe(true);
    expect(r.locks.find((l) => l.id === "PORT")?.shoulderSpliced).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P9")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P10")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C13")?.pass).toBe(false);
    const probe = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ floatShoulder: "PORT" });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.probeLockEscape!(true);
    });
    expect(probe.blocked).toBe(true);
  });

  test("NC-CAM-GAP displaced track fails production readiness", async ({ page }) => {
    // Measured live-prism authority work can exceed 180 s under the supported
    // two-worker regression load; keep the assertion intact with a local bound.
    test.setTimeout(360_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ camGap: "PORT" }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean };
      locks: Array<{ driverValid: boolean }>;
    };
    expect(r.camTrack.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C15")?.pass).toBe(true);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ camGap: "PORT" });
      window.__MT1!.setMachineT(1);
      return {
        evalReady: window.__MT1!.evaluateS5Handover!().driveThrustReady,
        publicReady: window.__MT1!.getDriveThrustReady!(),
      };
    });
    expect(live.evalReady).toBe(false);
    expect(live.publicReady).toBe(false);
  });

  test("NC-OPEN-CAM one-sided ramp fails retraction constraint", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ openCam: "PORT" }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean; drivers?: Array<{ retractBlocked: boolean }> };
    };
    expect(r.camTrack.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ openCam: "PORT" });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-SOLID-GUIDE unsliced wall fails pin path", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ solidGuide: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean; internal: { pass: boolean; hits: string[] } };
    };
    expect(r.camTrack.internal.pass).toBe(false);
    expect(r.camTrack.internal.hits.some((h) => h.includes("LOCK_PIN_PORT") && h.includes("CAN_PORT"))).toBe(true);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ solidGuide: true });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-TRACK-FLOAT floating track fails production readiness", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ trackFloat: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean; trackSupport: { pass: boolean } };
      locks: Array<{ retained: boolean }>;
    };
    expect(r.locks.every((l) => l.retained)).toBe(true);
    expect(r.camTrack.trackSupport.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C16")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ trackFloat: true });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-ZERO-RETAINED-MARGIN stop at disengagement fails C17", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ zeroMargin: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean; margins: { PORT: { margin: number } } };
      locks: Array<{ retained: boolean; lockTransverseInsertion: number }>;
    };
    expect(r.locks.find((l) => l.lockTransverseInsertion > 0)).toBeTruthy();
    expect(r.camTrack.margins.PORT.margin).toBeLessThan(0.002);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C17")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ zeroMargin: true });
      window.__MT1!.setMachineT(1);
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-NONCURRENT-RAIL-INTRUSION all-rail sweep catches extra corridor solid", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ railIntrude: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { pass: boolean; firstHit: string; pairsEvaluated: number };
    };
    expect(r.camTrack.pass).toBe(false);
    expect(r.camTrack.pairsEvaluated).toBeGreaterThan(0);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C18")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ railIntrude: true });
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-BACKING-PLUG pin sweep hits restored backing", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ backingPlug: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
    };
    expect(r.gates.find((g) => g.id === "S5-P6")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P7")?.pass).toBe(false);
    expect(r.closures.find((c) => c.id === "C14")?.pass).toBe(false);
    const live = await page.evaluate(() => {
      window.__MT1!.applyS5Override!({ backingPlug: true });
      return window.__MT1!.getDriveThrustReady!();
    });
    expect(live).toBe(false);
  });

  test("NC-NAMED-TRACK-INTRUDER arbitrary registered name fails C18", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const r = (await page.evaluate(() => window.__MT1!.runS5Authority!({ namedIntrude: true }))) as {
      closures: Array<{ id: string; pass: boolean }>;
      gates: Array<{ id: string; pass: boolean }>;
      camTrack: { firstHit: string; pathCertificate: { inventory: { fixed: string[] } } };
    };
    expect(r.camTrack.pathCertificate.inventory.fixed.some((n) => n.includes("TRACK_WEDGE"))).toBe(true);
    expect(r.closures.find((c) => c.id === "C18")?.pass).toBe(false);
    expect(r.gates.find((g) => g.id === "S5-P12")?.pass).toBe(false);
  });

  test("override cache is live without extra applyMachine", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.applyS5Override));
    const r = await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      const before = window.__MT1!.getDriveThrustReady!();
      window.__MT1!.applyS5Override!({ shortSpigot: true });
      const mid = window.__MT1!.getDriveThrustReady!();
      window.__MT1!.applyS5Override!({});
      const after = window.__MT1!.getDriveThrustReady!();
      return { before, mid, after };
    });
    expect(r.before).toBe(true);
    expect(r.mid).toBe(false);
    expect(r.after).toBe(true);
  });
});
