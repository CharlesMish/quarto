import { expect, test } from "@playwright/test";

test("MT1-KS1 screens crossings without authorizing cuts", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runKs1Study));
  const r = (await page.evaluate(() => window.__MT1!.runKs1Study!())) as {
    studyId: string;
    addsVehicleGeometry: boolean;
    mutatesKc1: boolean;
    professionsAssigned: unknown[];
    stations: Array<{ name: string; selected: string }>;
    outcome: { code: string };
    nextSlice: { id: string };
  };
  expect(r.studyId).toBe("MT1-KS1");
  expect(r.addsVehicleGeometry).toBe(false);
  expect(r.mutatesKc1).toBe(false);
  expect(r.professionsAssigned).toEqual([]);
  expect(r.stations).toHaveLength(3);
  expect(["A", "B", "C", "D", "E", "F"]).toContain(r.outcome.code);
  expect(r.nextSlice.id.length).toBeGreaterThan(0);
});
