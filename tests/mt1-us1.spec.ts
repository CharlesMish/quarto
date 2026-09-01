import { expect, test } from "@playwright/test";

test("MT1-US1 zones the frozen spine without assigning occupants", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runUs1Study));
  const r = (await page.evaluate(() => window.__MT1!.runUs1Study!())) as {
    studyId: string;
    addsVehicleGeometry: boolean;
    mutatesGe1: boolean;
    coherentLongitudinalVoid: boolean;
    professionsAssigned: string[];
    nextSlice: { id: string };
    regions: Array<{ id: string; cls: string }>;
  };
  expect(r.studyId).toBe("MT1-US1");
  expect(r.addsVehicleGeometry).toBe(false);
  expect(r.mutatesGe1).toBe(false);
  expect(r.coherentLongitudinalVoid).toBe(false);
  expect(r.professionsAssigned).toEqual([]);
  const byId = Object.fromEntries(r.regions.map((row) => [row.id, row.cls]));
  expect(byId["front-reserved-box"]).toBe("UNCLAIMED_BUT_PROTECTED");
  expect(byId["dorsal-keep"]).toBe("MUST_REMAIN_CLEAR");
  expect(byId["drive-waist"]).toBe("MUST_REMAIN_CLEAR");
  expect(byId["can-corridor"]).toBe("OCCUPIED_MECHANISM");
  expect(byId["open-stern"]).toBe("MUST_REMAIN_CLEAR");
  expect(byId["ventral-keel"]).toBe("OCCUPIED_STRUCTURE");
  expect(r.nextSlice.id).toBe("keel-carrier-crossing");
  expect(r.nextSlice.id).not.toContain("cockpit");
});
