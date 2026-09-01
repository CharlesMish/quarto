import { expect, test } from "@playwright/test";

test("capture MT1-BODY-SHELL-01 director views", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));

  const capture = async (name: string, t: number, camera: string): Promise<void> => {
    await page.evaluate(({ t, camera }) => {
      window.__MT1!.setMachineT(t);
      window.__MT1!.setCamera(camera);
      window.__MT1!.setBodyConcept?.(true);
    }, { t, camera });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `evidence/body-shell-01-${name}.png` });
  };

  await capture("spread", 0, "three");
  await capture("mid", 0.6, "three");
  await capture("drive", 1, "three");
  await capture("top", 1, "top");
  await capture("side", 1, "side");
  await capture("front", 1, "front");
  await capture("rear", 1, "rear");
  await capture("prop", 1, "propSeated");

  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(true);
});
