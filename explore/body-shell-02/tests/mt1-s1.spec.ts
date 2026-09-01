import { expect, test } from "@playwright/test";

test.describe("MT1-S1C authority closure", () => {
  test("loads without page errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    expect(errors).toEqual([]);
  });

  test("latch capture is throat/jaw, not solid interpenetration", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const latch = await page.evaluate(() => window.__MT1!.runClearance().latch);
    expect(latch.intersections, latch.detail).toBe(0);
    expect(latch.minSolidClearance).toBeGreaterThan(0);
    expect(latch.firstCapturedT).toBeLessThanOrEqual(0.27 + 1e-6);
    expect(latch.lostCapture).toEqual([]);
    expect(latch.pass).toBe(true);
  });

  test("nest pin uses a real bore and stays captured", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const nest = await page.evaluate(() => window.__MT1!.runClearance().nest);
    expect(nest.intersections, nest.detail).toBe(0);
    expect(nest.minSolidClearance).toBeGreaterThan(0);
    expect(nest.minBoreClearance).toBeGreaterThan(0);
    expect(nest.sidewaysEntry).toBe(false);
    expect(nest.lostCapture).toEqual([]);
    expect(nest.pass).toBe(true);
  });

  test("authority volumes do not underbound physical meshes", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const audit = await page.evaluate(() => window.__MT1!.auditAuthority());
    expect(audit.physicalCount).toBeGreaterThan(10);
    expect(audit.rows.length).toBe(audit.physicalCount);
    expect(audit.unregisteredPhysical, JSON.stringify(audit.unregisteredPhysical)).toEqual([]);
    expect(audit.underbound, JSON.stringify(audit.underbound)).toEqual([]);
    expect(audit.pass).toBe(true);
    expect(audit.rows.some((r) => r.source === "mesh-derived-conservative")).toBe(true);
    expect(audit.rows.some((r) => r.source === "mesh-exact")).toBe(true);
    for (const row of audit.rows) {
      expect(row.registered).toBe(true);
      expect(row.conservativeOrExact).toBe(true);
      expect(row.authorityHalf.x).toBeGreaterThanOrEqual(row.meshHalf.x - 1e-6);
      expect(row.authorityHalf.y).toBeGreaterThanOrEqual(row.meshHalf.y - 1e-6);
      expect(row.authorityHalf.z).toBeGreaterThanOrEqual(row.meshHalf.z - 1e-6);
    }
  });

  test("envelopes exclude keep-outs and contain sampled solids", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runClearance());
    const e2 = r.envelopes.e2MovingSwept;
    const e4 = r.envelopes.e4WholeSwept;
    expect(r.envelopes.e1MovingInstant.width).toBeGreaterThan(1);
    expect(e2.width).toBeCloseTo(e2.maxX - e2.minX, 9);
    expect(e2.height).toBeCloseTo(e2.maxY - e2.minY, 9);
    expect(e2.length).toBeCloseTo(e2.maxZ - e2.minZ, 9);
    expect(e4.width).toBeCloseTo(e4.maxX - e4.minX, 9);
    expect(e4.height).toBeCloseTo(e4.maxY - e4.minY, 9);
    expect(e4.length).toBeCloseTo(e4.maxZ - e4.minZ, 9);
    expect(e2.length).toBeGreaterThan(r.envelopes.e1MovingInstant.length + 0.5);
    expect(e2.length).toBeGreaterThan(7.3);
    expect(e4.length).toBeGreaterThan(e2.length - 1e-6);
    expect(e4.maxX).toBeLessThan(3.5);
    const g9 = r.gates.find((g) => g.id === "G9");
    expect(g9?.pass, g9?.detail).toBe(true);
    expect(g9?.detail).toContain("keepoutsExcluded=true");
    expect(g9?.detail).toContain("boundsMatch=true");
  });

  test("diagnostics restore canonical transformT", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      api.setT(0.37);
      const before = api.poseSnapshot(0.37);
      api.runClearance();
      api.runHaunchStudy();
      const afterT = api.getT();
      const after = api.poseSnapshot(0.37);
      return {
        afterT,
        preview: api.isPreview(),
        xBefore: before.nodes.RL_CARRIAGE.p.x,
        xAfter: after.nodes.RL_CARRIAGE.p.x,
        yawBefore: before.nodes.RL_YAW.r.y,
        yawAfter: after.nodes.RL_YAW.r.y,
      };
    });
    expect(result.afterT).toBeCloseTo(0.37, 8);
    // S3A: local setT is explicit REAR_PREVIEW. Diagnostics still restore local pose/T.
    expect(result.preview).toBe(true);
    expect(result.xAfter).toBeCloseTo(result.xBefore, 8);
    expect(result.yawAfter).toBeCloseTo(result.yawBefore, 8);
  });

  test("canonical poses, reverse, and G1–G12", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const report = await page.evaluate(() => {
      const api = window.__MT1!;
      const poses = [0, 0.25, 0.5, 0.75, 0.9, 1].map((t) => {
        api.setT(t);
        return { t, stages: api.getStages(), pose: api.poseSnapshot(t) };
      });
      const a = api.poseSnapshot(0.37);
      api.setT(1);
      const b = api.poseSnapshot(0.37);
      const clearance = api.runClearance();
      return { poses, a, b, clearance };
    });

    expect(report.poses[1].stages.bookFold).toBeGreaterThan(0.9);
    expect(report.poses[1].stages.yaw).toBeLessThan(0.05);
    expect(report.a.nodes.RL_CARRIAGE.p.x).toBeCloseTo(report.b.nodes.RL_CARRIAGE.p.x, 8);
    expect(report.clearance.keepRearStbd.cx).toBeCloseTo(
      -((report.clearance.seatedRearPort.min.x + report.clearance.seatedRearPort.max.x) / 2),
      5,
    );
    expect(report.clearance.driveMargins.zAft).toBeCloseTo(0.275, 2);
    expect(report.clearance.driveMargins.zFwd).toBeCloseTo(0.275, 2);
    const failed = report.clearance.gates.filter((g) => !g.pass);
    expect(failed, JSON.stringify(report.clearance.gates, null, 2)).toEqual([]);
    expect(report.clearance.status).toBe("GREEN");
    expect(report.clearance.gates.map((g) => g.id)).toEqual([
      "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12",
    ]);
  });

  test("socket remains a real +X stroke", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const motion = await page.evaluate(() => {
      const api = window.__MT1!;
      const s0 = api.poseSnapshot(0);
      const s1 = api.poseSnapshot(1);
      return {
        dx: s1.nodes.RL_CARRIAGE.p.x - s0.nodes.RL_CARRIAGE.p.x,
        dy: s1.nodes.RL_CARRIAGE.p.y - s0.nodes.RL_CARRIAGE.p.y,
        dz: s1.nodes.RL_CARRIAGE.p.z - s0.nodes.RL_CARRIAGE.p.z,
      };
    });
    expect(motion.dx).toBeGreaterThan(0.35);
    expect(Math.abs(motion.dy)).toBeLessThan(1e-6);
    expect(Math.abs(motion.dz)).toBeLessThan(1e-6);
  });
});
