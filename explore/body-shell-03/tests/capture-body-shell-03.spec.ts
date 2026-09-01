import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("capture MT1-BODY-SHELL-03 director views", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));

  const capture = async (name: string, setup: () => Promise<void>): Promise<void> => {
    await setup();
    await page.waitForTimeout(280);
    await page.screenshot({ path: `evidence/body-shell-03-${name}.png` });
  };

  await capture("spread-three", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(true);
      window.__MT1!.setBodySection?.(false);
      window.__MT1!.setMachineT(0);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("spread-side", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("side"));
  });
  await capture("mid-three", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(0.6);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("drive-three", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("driveBody");
    });
  });
  await capture("drive-side", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("side"));
  });
  await capture("drive-rear", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("rear"));
  });
  await capture("drive-top", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("top"));
  });
  await capture("prop", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("propSeated"));
  });
  await capture("prop-section", async () => {
    await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();
    await page.evaluate(() => window.__MT1!.setCamera("propSeated"));
  });
  await capture("section", async () => {
    await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();
    await page.getByRole("button", { name: "BODY SECTION", exact: true }).click();
    await page.evaluate(() => window.__MT1!.setCamera("driveBody"));
  });
  await capture("body-off", async () => {
    await page.getByRole("button", { name: "BODY SECTION", exact: true }).click();
    await page.getByRole("button", { name: "BODY ON", exact: true }).click();
    await page.evaluate(() => window.__MT1!.setCamera("driveBody"));
  });

  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);

  await page.getByRole("button", { name: "BODY OFF", exact: true }).click();
  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(true);
  const report = await page.evaluate(() => window.__MT1!.runBodyShellFit?.());
  expect(report?.method).toBe("triangle-obb");
  expect(report?.pass).toBe(true);
  expect(report?.defects).toEqual([]);
  writeFileSync("evidence/body-shell-03-fit-report.json", JSON.stringify(report, null, 2));
});

