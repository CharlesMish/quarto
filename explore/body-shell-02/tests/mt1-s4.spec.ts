import { expect, test } from "@playwright/test";
import { mapDrive, mapFront, mapRear } from "../src/machine/machineMap";
import { STBD } from "../src/machine/side";
import { P } from "../src/design/parameters";

test.describe("MT1-S4 bilateral completion", () => {
  test("frozen maps and mirrored stations", () => {
    expect(mapFront(0.42)).toBeCloseTo(mapFront(0.42), 12);
    expect(mapRear(1)).toBeCloseTo(0.9, 8);
    expect(mapDrive(0.95)).toBeCloseTo(0.5833333333, 6);
    expect(STBD.rear.spreadX).toBeCloseTo(-P.rl.spreadX, 12);
    expect(STBD.rear.nestX).toBeCloseTo(-P.rl.nestX, 12);
    expect(STBD.front.yawDeg).toBe(90);
    expect(STBD.rear.foldDeg).toBe(-P.rl.foldDeg);
    expect(STBD.front.foldDeg).toBe(-P.fl.foldDeg);
    expect(STBD.rear.spreadX - STBD.rear.nestX).toBeCloseTo(P.rl.nestX - P.rl.spreadX, 12);
  });

  test("B1–B13 GREEN_PENDING_DIRECTOR", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runS4Authority());
    const auto = r.gates.filter((g) => g.id !== "B14" && !g.pass);
    expect(auto, JSON.stringify(r.gates, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN_PENDING_DIRECTOR");
    expect(r.b14).toBe("AWAITING_DIRECTOR_DISPOSITION");
    expect(r.authorityBoundAudit.pass).toBe(true);
    expect(r.authorityBoundAudit.physicalCount).toBeGreaterThan(114);
    expect(r.minPortStbd).toBeGreaterThan(0.5);
    expect(r.endpoints.spread.width).toBeGreaterThan(10);
    expect(r.prediction.rearContained).toBe(true);
    expect(r.prediction.frontContained).toBe(true);
    expect(r.path.rearSelf.sep).toBeGreaterThan(-1e-3);
    expect(r.path.frontSelf.sep).toBeGreaterThan(-1e-3);
    expect(r.path.rearHomology.pass).toBe(true);
    expect(r.path.frontHomology.pass).toBe(true);
    const cFail = r.closures.filter((g) => !g.pass);
    expect(cFail, JSON.stringify(r.closures, null, 2)).toEqual([]);
  });

  test("wrong-fold sign fails B2/C3", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runS4Authority({ wrongFoldSign: true }));
    expect(r.path.wrongFoldFails).toBe(true);
    expect(r.path.rearSelf.sep).toBeLessThan(-0.05);
    expect(r.gates.find((g) => g.id === "B2")?.pass).toBe(false);
    expect(r.closures.find((g) => g.id === "C8")?.pass).toBe(true);
    expect(r.status).toBe("STOP");
  });

  test("four-capture NC and bypass", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      const stowedZ = (api.getParams() as { drive: { stowedZ: number } }).drive.stowedZ;
      const keys = [
        "rearNestReady",
        "frontNestReady",
        "rearStbdNestReady",
        "frontStbdNestReady",
        "frontStbdPassivePickupReady",
      ] as const;
      const ncs = keys.map((key) => {
        api.setReadinessOverride({ [key]: false });
        api.setMachineT(0.95);
        return {
          key,
          requested: api.getRequestedDriveT(),
          applied: api.getAppliedDriveT(),
          ready: api.getReadiness().driveStructuralReady,
          z: api.machinePoseSnapshot(0.95).nodes.DRIVE_CARRIAGE.p.z,
        };
      });
      api.setReadinessOverride(undefined);
      const bypass = api.runMachineAuthority({ readiness: { rearStbdNestReady: false }, bypassDriveGate: true });
      return { stowedZ, ncs, bypassGi6: bypass.gates.find((g) => g.id === "GI6")?.pass };
    });
    for (const nc of result.ncs) {
      expect(nc.requested, nc.key).toBeCloseTo(0.5833333333, 6);
      expect(nc.ready, nc.key).toBe(false);
      expect(nc.applied, nc.key).toBe(0);
      expect(nc.z, nc.key).toBeCloseTo(result.stowedZ, 6);
    }
    expect(result.bypassGi6).toBe(false);
  });

  test("starboard preview restores", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => {
      const api = window.__MT1!;
      api.setMachineT(0.42);
      const before = api.machinePoseSnapshot(0.42);
      api.setFrontStbdT(0.1);
      const frontMode = api.getAuthorityMode();
      api.setMachineT(0.42);
      const afterFront = api.machinePoseSnapshot(0.42);
      api.setRearStbdT(0.2);
      const rearMode = api.getAuthorityMode();
      api.setMachineT(0.42);
      const afterRear = api.machinePoseSnapshot(0.42);
      return {
        frontMode,
        rearMode,
        restored: api.getAuthorityMode(),
        sameF: JSON.stringify(before.nodes) === JSON.stringify(afterFront.nodes),
        sameR: JSON.stringify(before.nodes) === JSON.stringify(afterRear.nodes),
      };
    });
    expect(r.frontMode).toBe("FRONT_STBD_PREVIEW");
    expect(r.rearMode).toBe("REAR_STBD_PREVIEW");
    expect(r.restored).toBe("MACHINE");
    expect(r.sameF).toBe(true);
    expect(r.sameR).toBe(true);
  });

  test("symmetry negative controls", () => {
    expect(STBD.rear.yawDeg).not.toBe(P.rl.yawDeg);
    expect(STBD.front.nestPinExtendX).toBeLessThan(0);
    expect(P.fl.nestPinExtendX).toBeGreaterThan(0);
    const fakeOutboard = STBD.rear.nestX > STBD.rear.spreadX;
    expect(fakeOutboard).toBe(false);
  });
});
