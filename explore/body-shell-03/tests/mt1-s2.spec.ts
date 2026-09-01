import { expect, test } from "@playwright/test";

test.describe("MT1-S2 front-left carry + strake", () => {
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

  test("rear S1C parameters remain frozen", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const p = await page.evaluate(() => window.__MT1!.getParams() as {
      haunchDeg: number;
      rl: { nestX: number; spreadX: number; innerSpan: number; chord: number };
      keep: { fwdPortNest?: unknown };
    });
    expect(p.haunchDeg).toBe(70);
    expect(p.rl.nestX).toBe(-1.5);
    expect(p.rl.spreadX).toBe(-1.98);
    expect(p.rl.innerSpan).toBe(2.52);
    expect(p.rl.chord).toBe(2.16);
    expect(p.keep.fwdPortNest).toBeUndefined();
  });

  test("front book pin captures before yaw and nest is a separate +X bore", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runFrontClearance());
    expect(r.bookPin.intersections, r.bookPin.detail).toBe(0);
    expect(r.bookPin.pass, r.bookPin.detail).toBe(true);
    expect(r.bookPin.firstCapturedT).toBeLessThanOrEqual(0.28 + 1e-6);
    expect(r.nest.intersections, r.nest.detail).toBe(0);
    expect(r.nest.pass, r.nest.detail).toBe(true);
    expect(r.nest.sidewaysEntry).toBe(false);
  });

  test("passive catch engages without an actuator", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const catchM = await page.evaluate(() => window.__MT1!.runFrontClearance().catch);
    expect(catchM.intersections, catchM.detail).toBe(0);
    expect(catchM.pass, catchM.detail).toBe(true);
    expect(catchM.minSolidClearance).toBeGreaterThan(0);
  });

  test("front yaw is aft and socket is pure +X", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const motion = await page.evaluate(() => {
      const api = window.__MT1!;
      const s0 = api.frontPoseSnapshot(0);
      const s1 = api.frontPoseSnapshot(1);
      const mid = api.frontPoseSnapshot(0.45);
      return {
        dx: s1.nodes.FL_CARRIAGE.p.x - s0.nodes.FL_CARRIAGE.p.x,
        dy: s1.nodes.FL_CARRIAGE.p.y - s0.nodes.FL_CARRIAGE.p.y,
        dz: s1.nodes.FL_CARRIAGE.p.z - s0.nodes.FL_CARRIAGE.p.z,
        yawMid: mid.nodes.FL_YAW.r.y,
        yawEnd: s1.nodes.FL_YAW.r.y,
      };
    });
    expect(motion.dx).toBeGreaterThan(0.35);
    expect(Math.abs(motion.dy)).toBeLessThan(1e-6);
    expect(Math.abs(motion.dz)).toBeLessThan(1e-6);
    expect(motion.yawEnd).toBeLessThan(-1.4);
    expect(motion.yawMid).toBeLessThan(-0.2);
  });

  test("front envelopes and GF1–GF12", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runFrontClearance());
    expect(r.envelopes.e2MovingSwept.length).toBeCloseTo(
      r.envelopes.e2MovingSwept.maxZ - r.envelopes.e2MovingSwept.minZ,
      9,
    );
    expect(r.frontMinZ).toBeGreaterThanOrEqual(0.34);
    expect(r.seatedHalfWidth).toBeLessThanOrEqual(2.239 + 1e-6);
    expect(r.minFloor).toBeGreaterThanOrEqual(0.06);
    expect(r.rearRegression.parametersIntact).toBe(true);
    expect(r.authorityBoundAudit.pass).toBe(true);
    const failed = r.gates.filter((g) => !g.pass);
    expect(failed, JSON.stringify(r.gates, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN");
  });

  test("frontT is reversible and diagnostics restore it", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const result = await page.evaluate(() => {
      const api = window.__MT1!;
      api.setFrontT(0.37);
      const before = api.frontPoseSnapshot(0.37);
      api.runFrontClearance();
      api.runCantStudy();
      const afterT = api.getFrontT();
      const after = api.frontPoseSnapshot(0.37);
      return {
        afterT,
        preview: api.isPreview(),
        xBefore: before.nodes.FL_CARRIAGE.p.x,
        xAfter: after.nodes.FL_CARRIAGE.p.x,
        yawBefore: before.nodes.FL_YAW.r.y,
        yawAfter: after.nodes.FL_YAW.r.y,
      };
    });
    expect(result.afterT).toBeCloseTo(0.37, 8);
    // S3A: local setFrontT is explicit FRONT_PREVIEW. Diagnostics still restore local pose/T.
    expect(result.preview).toBe(true);
    expect(result.xAfter).toBeCloseTo(result.xBefore, 8);
    expect(result.yawAfter).toBeCloseTo(result.yawBefore, 8);
  });

  test("rear G1–G12 still pass on frozen mechanism", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runClearance());
    const failed = r.gates.filter((g) => !g.pass);
    expect(failed, JSON.stringify(r.gates, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN");
    expect(r.minCritical).toBeGreaterThan(0.049);
  });
});
