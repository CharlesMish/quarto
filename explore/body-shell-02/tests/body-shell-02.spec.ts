import { expect, test } from "@playwright/test";

test("body shell 02 is separate, toggleable, and non-authoritative", async ({ page }) => {
  const shaderErrors: string[] = [];
  page.on("console", (message) => {
    if (/Unable to compile effect|SHADER ERROR|Offending line/.test(message.text())) shaderErrors.push(message.text());
  });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));
  await expect(page).toHaveTitle("MT1-BODY-SHELL-02 / NON-AUTHORITATIVE CONCEPT");
  await expect(page.locator(".eyebrow")).toContainText("MT1-BODY-SHELL-02 / NON-AUTHORITATIVE CONCEPT");
  await expect(page.getByRole("button", { name: "BODY ON", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "BODY SECTION", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PROP SECTION", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "SECTION", exact: true })).toBeVisible();

  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  const inventory = await page.evaluate(() => window.__MT1!.getRenderInventory().filter((row) => row.semanticName.startsWith("BODY_")));
  expect(inventory).toHaveLength(32);
  expect(inventory.every((row) => row.objectClass === "presentation-only" && row.registrationId === null)).toBe(true);
  expect(inventory.every((row) => row.family === "body-shell-concept")).toBe(true);

  const state = await page.evaluate(() => window.__MT1!.getBodyConceptState?.());
  expect(state?.conceptId).toBe("MT1-BODY-SHELL-02");
  expect(state?.enabled).toBe(true);
  expect(state?.section).toBe(false);
  expect(state?.sectionMeshes).toHaveLength(15);
  expect(state?.propGhostMeshes.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "BODY ON", exact: true }).click();
  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);

  await page.getByRole("button", { name: "BODY OFF", exact: true }).click();
  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(true);

  await page.getByRole("button", { name: "BODY SECTION", exact: true }).click();
  const sectioned = await page.evaluate(() => {
    const rows = window.__MT1!.getRenderInventory().filter((row) => row.semanticName.startsWith("BODY_"));
    return {
      section: window.__MT1!.getBodyConceptState?.().section,
      stbdEnabled: rows.filter((row) => row.semanticName.includes("_STBD_")).map((row) => row.enabled),
      portEnabled: rows.filter((row) => row.semanticName.includes("_PORT_")).map((row) => row.enabled),
    };
  });
  expect(sectioned.section).toBe(true);
  expect(sectioned.stbdEnabled.every((on) => on === false)).toBe(true);
  expect(sectioned.portEnabled.every((on) => on === true)).toBe(true);
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
  expect(shaderErrors).toEqual([]);
});
