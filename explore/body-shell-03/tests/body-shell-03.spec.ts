import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

test("body shell 03 is separate, toggleable, and non-authoritative", async ({ page }) => {
  const shaderErrors: string[] = [];
  page.on("console", (message) => {
    if (/Unable to compile effect|SHADER ERROR|Offending line/.test(message.text())) shaderErrors.push(message.text());
  });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));
  await expect(page).toHaveTitle("Quarto / Mechanism viewer");
  await page.locator('[data-panel="details"]').click();
  await expect(page.locator(".eyebrow")).toContainText("MT1-BODY-SHELL-03 / NON-AUTHORITATIVE CONCEPT");
  await page.locator('[data-panel="inspection"]').click();
  await expect(page.getByRole("button", { name: "BODY ON", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "BODY SECTION", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PROP SECTION", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "SECTION", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "INSPECT PICK", exact: true })).toBeVisible();
  await page.locator('[data-panel="cameras"]').click();
  await expect(page.getByRole("button", { name: "DRIVE 3/4", exact: true })).toBeVisible();
  await page.locator('[data-panel="inspection"]').click();

  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  const inventory = await page.evaluate(() => window.__MT1!.getRenderInventory().filter((row) => row.semanticName.startsWith("BODY_")));
  expect(inventory.length).toBeGreaterThanOrEqual(14);
  expect(inventory.every((row) => row.objectClass === "presentation-only" && row.registrationId === null)).toBe(true);
  expect(inventory.every((row) => row.family === "body-shell-concept")).toBe(true);

  const state = await page.evaluate(() => window.__MT1!.getBodyConceptState?.());
  expect(state?.conceptId).toBe("MT1-BODY-SHELL-03");
  expect(state?.surfaceRevision).toBe("BODY-SHELL-03.2");
  expect(state?.enabled).toBe(true);
  expect(state?.section).toBe(false);
  expect(state?.masses).toEqual([
    "wedge prow",
    "ventral hull",
    "chine walls",
    "dorsal deck",
    "forward book-pocket haunches",
    "rear book-pocket haunches",
    "open stern collar",
  ]);
  expect(inventory.some((row) => row.semanticName.includes("CHINE_"))).toBe(true);
  expect(inventory.some((row) => row.semanticName.includes("_FACE_"))).toBe(true);
  expect(inventory.some((row) => row.semanticName.includes("_LIP_"))).toBe(true);
  expect(inventory.some((row) => row.semanticName.includes("COLLAR_"))).toBe(true);
  expect(inventory.some((row) => row.semanticName.includes("FWD_POST"))).toBe(false);
  expect(inventory.some((row) => row.semanticName.includes("AFT_POST"))).toBe(false);

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
  await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();
  await expect(page.locator("#propSectionBtn")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
  await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();
  await expect(page.locator("#propSectionBtn")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "SECTION", exact: true }).click();
  await expect(page.locator("#sectionBtn")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
  expect(shaderErrors).toEqual([]);
});

test("body shell 03 presentation-fit does not participate in authority", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.runBodyShellFit));
  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  const report = await page.evaluate(() => window.__MT1!.runBodyShellFit?.());
  const reportPath = testInfo.outputPath("body-shell-03.2-fit-report.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  await testInfo.attach("body-shell-03.2-fit-report", { path: reportPath, contentType: "application/json" });
  expect(report?.kind).toBe("presentation-fit");
  expect(report?.participatesInAuthority).toBe(false);
  expect(report?.method).toBe("triangle-obb");
  expect(report?.samples).toBe(101);
  if (report && report.defects.length) {
    const summary = report.defects
      .slice(0, 40)
      .map((d) => `${d.t.toFixed(2)} ${d.body} x ${d.solid} sep=${d.separation.toFixed(3)}`)
      .join("\n");
    throw new Error(`presentation-fit defects (${report.defects.length}):\n${summary}`);
  }
  expect(report?.pass).toBe(true);
  expect(report?.defects).toEqual([]);
  const after = await page.evaluate(() => window.__MT1!.getInspectionState());
  expect(after.machineT).toBe(before.machineT);
  expect(after.driveT).toBe(before.driveT);
  expect(after.mode).toBe(before.mode);
  expect(after.preview).toBe(before.preview);
});
