import { expect, test } from "@playwright/test";
import { mapDrive } from "../src/machine/machineMap";

test.describe("MT1-S3A authority repair", () => {
  test("maps unchanged from frozen S3", () => {
    expect(mapDrive(0.87)).toBe(0);
    expect(mapDrive(0.88)).toBe(0);
    expect(mapDrive(0.95)).toBeCloseTo(0.5833333333, 6);
    expect(mapDrive(1)).toBeCloseTo(1, 8);
  });

  test("C1 NC1/NC2/NC3 production gate leaves drive stowed", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      const stowedZ = (api.getParams() as { drive: { stowedZ: number } }).drive.stowedZ;
      const run = (key: "frontNestReady" | "rearNestReady" | "frontPassivePickupReady") => {
        api.setReadinessOverride({ [key]: false });
        api.setMachineT(0.95);
        const drive = api.machinePoseSnapshot(0.95).nodes.DRIVE_CARRIAGE;
        const out = {
          requested: api.getRequestedDriveT(),
          applied: api.getAppliedDriveT(),
          ready: api.getReadiness().driveStructuralReady,
          mode: api.getAuthorityMode(),
          z: drive.p.z,
        };
        api.setReadinessOverride(undefined);
        api.setMachineT(0.95);
        return { ...out, restoredApplied: api.getAppliedDriveT(), restoredZ: api.machinePoseSnapshot(0.95).nodes.DRIVE_CARRIAGE.p.z };
      };
      return { stowedZ, nc1: run("frontNestReady"), nc2: run("rearNestReady"), nc3: run("frontPassivePickupReady") };
    });
    for (const nc of [result.nc1, result.nc2, result.nc3]) {
      expect(nc.requested).toBeCloseTo(0.5833333333, 6);
      expect(nc.ready).toBe(false);
      expect(nc.applied).toBe(0);
      expect(nc.z).toBeCloseTo(result.stowedZ, 6);
      expect(nc.restoredApplied).toBeCloseTo(0.5833333333, 6);
      expect(nc.restoredZ).not.toBeCloseTo(result.stowedZ, 3);
    }
  });

  test("bypass of production clamp fails GI6", async ({ page }) => {
    test.setTimeout(600_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => {
      const api = window.__MT1!;
      const gated = api.runMachineAuthority({ frontNestReady: false });
      const bypass = api.runMachineAuthority({ readiness: { frontNestReady: false }, bypassDriveGate: true });
      return {
        gatedGi6: gated.gates.find((g) => g.id === "GI6")?.pass,
        gatedC1: gated.closures.find((g) => g.id === "C1")?.pass,
        gatedStatus: gated.status,
        bypassGi6: bypass.gates.find((g) => g.id === "GI6")?.pass,
        bypassStatus: bypass.status,
      };
    });
    expect(r.gatedGi6).toBe(false);
    expect(r.gatedC1).toBe(true);
    expect(r.gatedStatus).toBe("STOP");
    expect(r.bypassGi6).toBe(false);
    expect(r.bypassStatus).toBe("STOP");
  });

  test("GI1–GI11 C1–C8 GREEN_CANDIDATE", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runMachineAuthority());
    const auto = r.gates.filter((g) => g.id !== "GI12" && !g.pass);
    const closures = r.closures.filter((g) => g.id !== "C7" && !g.pass);
    expect(auto, JSON.stringify(r.gates, null, 2)).toEqual([]);
    expect(closures, JSON.stringify(r.closures, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN_CANDIDATE");
    expect(r.gi12).toBe("DIRECTOR_PASS");
    expect(r.findings.every((f) => f.disposition === "CLOSED")).toBe(true);
    expect(r.authorityBoundAudit.physicalCount).toBeGreaterThanOrEqual(114);
    expect(r.authorityBoundAudit.pass).toBe(true);
    expect(r.firstRequestedDriveMachineT).toBeCloseTo(0.89, 2);
    expect(r.firstReadyMachineT).toBeLessThan(r.firstRequestedDriveMachineT + 1e-9);
    expect(r.driveWaist.hits).toEqual([]);
    expect(r.driveWaist.principal.length).toBeGreaterThan(0.5);
    expect(r.driveWaist.principal.volume).toBeGreaterThan(1);
    expect(r.envelopes.e2MovingSwept.width).toBeGreaterThan(7.182584);
    expect(r.envelopes.coarseStep).toBeLessThanOrEqual(0.001);
    expect(r.envelopes.refineStep).toBeLessThanOrEqual(0.0001);
  });

  test("waist negative control detects occupancy", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runMachineAuthority({ injectWaistOccupant: true }));
    const gi8 = r.gates.find((g) => g.id === "GI8");
    expect(gi8?.pass, gi8?.detail).toBe(false);
    expect(r.driveWaist.hits.some((h) => h.solid === "AUDIT_WAIST_PROBE")).toBe(true);
    expect(r.status).toBe("STOP");
  });

  test("cant and haunch preview disclose and restore", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      api.setMachineT(0.42);
      const before = api.machinePoseSnapshot(0.42);
      api.previewCant(65);
      const cantMode = api.getAuthorityMode();
      const cantPreview = api.isPreview();
      api.setMachineT(0.42);
      const afterCant = api.machinePoseSnapshot(0.42);
      const afterCantMode = api.getAuthorityMode();
      api.previewHaunch(55);
      const haunchMode = api.getAuthorityMode();
      api.setMachineT(0.42);
      const afterHaunch = api.machinePoseSnapshot(0.42);
      return {
        cantMode,
        cantPreview,
        afterCantMode,
        haunchMode,
        afterHaunchMode: api.getAuthorityMode(),
        cantRestored: JSON.stringify(before.nodes) === JSON.stringify(afterCant.nodes),
        haunchRestored: JSON.stringify(before.nodes) === JSON.stringify(afterHaunch.nodes),
      };
    });
    expect(result.cantMode).toBe("CANT_PREVIEW");
    expect(result.cantPreview).toBe(true);
    expect(result.haunchMode).toBe("HAUNCH_PREVIEW");
    expect(result.afterCantMode).toBe("MACHINE");
    expect(result.afterHaunchMode).toBe("MACHINE");
    expect(result.cantRestored).toBe(true);
    expect(result.haunchRestored).toBe(true);
  });
});
