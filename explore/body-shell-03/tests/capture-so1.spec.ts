import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * MT1-SO1 matched evidence. Set SO1_PHASE=before|after (default after).
 * Writes into explore/body-shell-03/evidence/so1/<phase>/.
 */
test("capture MT1-SO1 stern-ownership views", async ({ page }) => {
  test.setTimeout(300_000);
  const phase = process.env.SO1_PHASE === "before" ? "before" : "after";
  const dir = `evidence/so1/${phase}`;
  mkdirSync(dir, { recursive: true });

  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));

  const capture = async (name: string, setup: () => Promise<void>): Promise<void> => {
    await setup();
    await page.waitForTimeout(320);
    await page.screenshot({ path: `${dir}/so1-${phase}-${name}.png` });
  };

  await capture("spread-three", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(true);
      window.__MT1!.setBodySection?.(false);
      window.__MT1!.setPropSection?.(false);
      window.__MT1!.setMachineT(0);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("spread-rear", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("rear"));
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
  await capture("throat", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("so1Throat"));
  });
  await capture("prop-stowed", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(0.86);
      window.__MT1!.setCamera("propStowed");
    });
  });
  await capture("prop-mid", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(0.94);
      window.__MT1!.setCamera("propMid");
    });
  });
  await capture("prop-seated", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("propSeated");
    });
  });
  await capture("prop-released", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(0.998);
      window.__MT1!.setCamera("propReleased");
    });
  });
  await capture("prop-section", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.setPropSection?.(true);
      window.__MT1!.setCamera("propSeated");
    });
  });
  await capture("body-off-drive", async () => {
    await page.evaluate(() => {
      window.__MT1!.setPropSection?.(false);
      window.__MT1!.setBodyConcept?.(false);
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("driveBody");
    });
  });
  await capture("body-off-rear", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(false);
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("rear");
    });
  });

  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);
});
