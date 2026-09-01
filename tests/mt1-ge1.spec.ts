import { expect, test } from "@playwright/test";

test("MT1-GE1 is a study, not a contact architecture", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runGe1Study));
  const r = (await page.evaluate(() => window.__MT1!.runGe1Study!())) as {
    studyId: string;
    addsVehicleGeometry: boolean;
    participatesInAuthority: boolean;
    historicalDriveWidthSketch: { usedAsTarget: boolean };
    groundAware: { conclusion: boolean; doesNotSelect: string };
    nextSlice: { id: string };
    floor: { finalContactPlane: boolean };
    livePoses: { spread: { whole: { width: number }; floorClearanceWhole: number }; drive: { whole: { width: number } } };
  };
  expect(r.studyId).toBe("MT1-GE1");
  expect(r.addsVehicleGeometry).toBe(false);
  expect(r.participatesInAuthority).toBe(false);
  expect(r.historicalDriveWidthSketch.usedAsTarget).toBe(false);
  expect(r.floor.finalContactPlane).toBe(false);
  expect(r.groundAware.conclusion).toBe(true);
  expect(r.groundAware.doesNotSelect).toBe("ground-contact mechanism");
  expect(r.nextSlice.id).toBe("MT1-US1");
  expect(r.livePoses.spread.whole.width).toBeGreaterThan(10);
  expect(r.livePoses.drive.whole.width).toBeLessThan(6);
  expect(r.livePoses.drive.whole.width).toBeGreaterThan(4);
});
