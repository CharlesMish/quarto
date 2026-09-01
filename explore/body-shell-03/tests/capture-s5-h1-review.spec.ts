import { expect, test } from "@playwright/test";

test("capture MT1-S5HR3R1 director H1 review sequence", async ({ page }) => {
  test.setTimeout(300_000);
  const shaderErrors: string[] = [];
  page.on("console", (message) => {
    if (/Unable to compile effect|SHADER ERROR|Offending line/.test(message.text())) shaderErrors.push(message.text());
  });

  await page.goto("/");
  await page.waitForFunction(() => window.__MT1?.getBuildInfo().candidateId === "MT1-S5HR3R1");
  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.86);
    window.__MT1!.setCamera("propStowed");
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "evidence/s5-h1-review-stowed.png" });

  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.94);
    window.__MT1!.setCamera("propMid");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/s5-h1-review-mid.png" });

  await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "evidence/s5-h1-review-mid-section.png" });
  await page.getByRole("button", { name: "PROP SECTION", exact: true }).click();

  await page.evaluate(() => {
    window.__MT1!.setMachineT(1);
    window.__MT1!.setCamera("propSeated");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/s5-h1-review-seated.png" });

  await page.getByRole("button", { name: "LOCK FOCUS", exact: true }).click();
  await page.evaluate(() => window.__MT1!.setCamera("lockPort"));
  await page.waitForTimeout(200);
  await page.screenshot({ path: "evidence/s5-h1-review-lock-port.png" });
  await page.getByRole("button", { name: "LOCK FOCUS", exact: true }).click();

  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.998);
    window.__MT1!.setCamera("propReleased");
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "evidence/s5-h1-review-reverse-released.png" });

  const state = await page.evaluate(() => window.__MT1!.getInspectionState());
  expect(state).toMatchObject({ candidateId: "MT1-S5HR3R1", machineT: 0.998, certificate: { state: "CURRENT", valid: true } });
  expect(shaderErrors).toEqual([]);
});
