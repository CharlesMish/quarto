import { expect, test } from "@playwright/test";

test.describe("MT1-S2A receiving-lane & capture authority", () => {
  test("C1–C7 and GF1–GF12 close F01–F07", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runFrontClearance());
    expect(r.freezeId).toBe("MT1-S2A");
    expect(r.sweeps.movingVsCarry.pass, JSON.stringify(r.sweeps.movingVsCarry.hits.slice(0, 12), null, 2)).toBe(true);
    expect(r.sweeps.bookPinPath.pass, JSON.stringify(r.sweeps.bookPinPath.hits.slice(0, 8), null, 2)).toBe(true);
    expect(r.sweeps.nestPinPath.pass, JSON.stringify(r.sweeps.nestPinPath.hits.slice(0, 8), null, 2)).toBe(true);
    expect(r.sweeps.catchPath.pass, JSON.stringify(r.sweeps.catchPath.hits.slice(0, 8), null, 2)).toBe(true);
    expect(r.sweeps.foldPath.pass, r.sweeps.foldPath.detail).toBe(true);
    expect(r.sweeps.movingVsProtected.pass, r.sweeps.movingVsProtected.detail).toBe(true);
    expect(r.reservations.occupancySource).toContain("FL_CARRIAGE_BODY");
    expect(r.reservations.occupancySource).toContain("FL_SHOE_TOP");
    expect(r.reservations.occupancySource).toContain("FL_NEST_PIN_BODY");
    expect(r.carryGraph.detail).toContain("declared interfaces");
    const failed = [...r.gates, ...r.closures].filter((g) => !g.pass);
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
    expect(r.status).toBe("GREEN");
    expect(r.frontMinZ).toBeGreaterThan(1.0);
    expect(r.minFloor).toBeGreaterThan(0.4);
    expect(r.minCockpit).toBeGreaterThan(0.18);
  });

  test("rear S1C still GREEN after S2A carry repair", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1));
    const r = await page.evaluate(() => window.__MT1!.runClearance());
    expect(r.gates.filter((g) => !g.pass)).toEqual([]);
    expect(r.status).toBe("GREEN");
    expect(r.minCritical).toBeGreaterThan(0.049);
  });
});
