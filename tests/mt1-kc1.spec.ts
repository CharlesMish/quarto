import { expect, test } from "@playwright/test";

test("MT1-KC1 does not invent a hollow spine or authorize penetrations", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runKc1Study));
  const r = (await page.evaluate(() => window.__MT1!.runKc1Study!())) as {
    studyId: string;
    addsVehicleGeometry: boolean;
    mutatesUs1: boolean;
    professionsAssigned: unknown[];
    outcome: { code: string; name: string };
    nextSlice: { requiredCrossings: string[] };
    crossings: Array<{ station: string; selectedForSkeleton: string }>;
    lanes: unknown[];
  };
  expect(r.studyId).toBe("MT1-KC1");
  expect(r.addsVehicleGeometry).toBe(false);
  expect(r.mutatesUs1).toBe(false);
  expect(r.professionsAssigned).toEqual([]);
  expect(r.lanes).toHaveLength(2);
  expect(r.outcome.code).toBe("B");
  expect(r.outcome.name).toBe("CONTINUOUS_ROUTE_REQUIRES_DECLARED_CROSSINGS");
  expect(r.nextSlice.requiredCrossings).toEqual(["BULKHEAD_Z3.35", "BULKHEAD_Z1.15", "BULKHEAD_Z-1.70"]);
  expect(r.crossings).toHaveLength(3);
});
