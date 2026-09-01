import { expect, test } from "@playwright/test";

test("body shell concept is separate, toggleable, and non-authoritative", async ({ page }) => {
  const shaderErrors: string[] = [];
  page.on("console", (message) => {
    if (/Unable to compile effect|SHADER ERROR|Offending line/.test(message.text())) shaderErrors.push(message.text());
  });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));
  await expect(page).toHaveTitle("MT1-BODY-SHELL-01 / NON-AUTHORITATIVE CONCEPT");
  await expect(page.locator(".eyebrow")).toContainText("MT1-BODY-SHELL-01 / NON-AUTHORITATIVE CONCEPT");

  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  const inventory = await page.evaluate(() => window.__MT1!.getRenderInventory().filter((row) => row.semanticName.startsWith("BODY_")));
  expect(inventory).toHaveLength(15);
  expect(inventory.every((row) => row.objectClass === "presentation-only" && row.registrationId === null)).toBe(true);

  await page.getByRole("button", { name: "BODY ON", exact: true }).click();
  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);
  await page.getByRole("button", { name: "BODY OFF", exact: true }).click();
  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(true);
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
  expect(shaderErrors).toEqual([]);
});
