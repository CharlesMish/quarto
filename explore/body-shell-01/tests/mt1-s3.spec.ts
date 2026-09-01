import { expect, test } from "@playwright/test";
import { mapDrive, mapFront, mapRear, mapsMonotonic } from "../src/machine/machineMap";

test.describe("MT1-S3 machine authority", () => {
  test("maps are deterministic and monotonic", () => {
    expect(mapFront(0)).toBe(0);
    expect(mapRear(0)).toBe(0);
    expect(mapDrive(0)).toBe(0);
    expect(mapDrive(0.87)).toBe(0);
    expect(mapDrive(1)).toBeCloseTo(1, 8);
    expect(mapFront(0.2)).toBeGreaterThan(mapRear(0.2));
    expect(mapRear(1)).toBeCloseTo(0.9, 8);
    const m = mapsMonotonic();
    expect(m.front && m.rear && m.drive).toBe(true);
    expect(mapFront(0.42)).toBeCloseTo(mapFront(0.42), 12);
  });

  test("machineT reversibility and scene matches maps", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      const checks = [0.17, 0.37, 0.63, 0.84].map((t) => {
        api.setMachineT(t);
        const a = api.machinePoseSnapshot(t);
        api.setMachineT(1);
        const b = api.machinePoseSnapshot(t);
        api.setMachineT(0);
        const c = api.machinePoseSnapshot(t);
        return {
          t,
          mode: api.getAuthorityMode(),
          sameAB: JSON.stringify(a.nodes) === JSON.stringify(b.nodes),
          sameAC: JSON.stringify(a.nodes) === JSON.stringify(c.nodes),
        };
      });
      api.setMachineT(0.5);
      return { checks, mode: api.getAuthorityMode(), m: api.getMachineT() };
    });
    expect(result.mode).toBe("MACHINE");
    for (const c of result.checks) {
      expect(c.sameAB, `rev 1 at ${c.t}`).toBe(true);
      expect(c.sameAC, `rev 0 at ${c.t}`).toBe(true);
    }
  });

  test("S1C and S2A still GREEN under machine authority", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => {
      const api = window.__MT1!;
      return { rear: api.runClearance(), front: api.runFrontClearance() };
    });
    expect(r.rear.status).toBe("GREEN");
    expect(r.front.status).toBe("GREEN");
    expect(r.rear.minCritical).toBeGreaterThan(0.049);
  });

  test("GI1–GI11 and drive barrier", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runMachineAuthority());
    const auto = r.gates.filter((g) => g.id !== "GI12" && !g.pass);
    expect(auto, JSON.stringify(r.gates, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN_CANDIDATE");
    expect(r.gi12).toBe("DIRECTOR_PASS");
    expect(r.firstDriveExitMachineT).toBeGreaterThanOrEqual(r.firstReadyMachineT - 1e-6);
    expect(r.minFrontRear).toBeGreaterThan(0.5);
    expect(r.envelopes.e2MovingSwept.length).toBeCloseTo(
      r.envelopes.e2MovingSwept.maxZ - r.envelopes.e2MovingSwept.minZ,
      6,
    );
    expect(r.authorityBoundAudit.pass).toBe(true);
  });

  test("negative-control drive barrier", async ({ page }) => {
    test.setTimeout(600_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runMachineAuthority({ frontNestReady: false }));
    const gi6 = r.gates.find((g) => g.id === "GI6");
    expect(gi6?.pass, gi6?.detail).toBe(false);
    expect(r.status).toBe("STOP");
    const c1 = r.closures.find((g) => g.id === "C1");
    expect(c1?.pass, c1?.detail).toBe(true);
  });

  test("preview mode restores on setMachineT", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      api.setMachineT(0.42);
      const before = api.machinePoseSnapshot(0.42);
      api.setFrontT(0.1);
      const previewMode = api.getAuthorityMode();
      api.setMachineT(0.42);
      const after = api.machinePoseSnapshot(0.42);
      const modeAfter = api.getAuthorityMode();
      api.setT(0.2);
      const rearPreview = api.getAuthorityMode();
      api.setMachineT(0.42);
      return {
        previewMode,
        modeAfter,
        rearPreview,
        same: JSON.stringify(before.nodes) === JSON.stringify(after.nodes),
      };
    });
    expect(result.previewMode).toBe("FRONT_PREVIEW");
    expect(result.rearPreview).toBe("REAR_PREVIEW");
    expect(result.modeAfter).toBe("MACHINE");
    expect(result.same).toBe(true);
  });

  test("certified parameters immutable", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const p = await page.evaluate(() => window.__MT1!.getParams() as {
      haunchDeg: number;
      rl: { nestX: number; innerSpan: number };
      fl: { y: number; cantDeg: number; innerSpan: number };
    });
    expect(p.haunchDeg).toBe(70);
    expect(p.rl.nestX).toBe(-1.5);
    expect(p.rl.innerSpan).toBe(2.52);
    expect(p.fl.y).toBe(2.22);
    expect(p.fl.cantDeg).toBe(70);
    expect(p.fl.innerSpan).toBe(1.7);
  });
});
