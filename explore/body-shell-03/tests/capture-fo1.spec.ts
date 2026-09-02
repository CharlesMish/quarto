import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * MT1-FO1 matched evidence. Set FO1_PHASE=before|after (default after).
 * Writes into explore/body-shell-03/evidence/fo1/<phase>/.
 */
test("capture MT1-FO1 station-ownership views", async ({ page }) => {
  test.setTimeout(300_000);
  const phase = process.env.FO1_PHASE === "before" ? "before" : "after";
  const dir = `evidence/fo1/${phase}`;
  mkdirSync(dir, { recursive: true });

  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));

  const capture = async (name: string, setup: () => Promise<void>): Promise<void> => {
    await setup();
    await page.waitForTimeout(320);
    await page.screenshot({ path: `${dir}/fo1-${phase}-${name}.png` });
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
  await capture("spread-fwd-root", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("fo1FwdRoot"));
  });
  await capture("spread-aft-root", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("fo1AftRoot"));
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
  await capture("drive-fwd-root", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("fo1FwdRoot"));
  });
  await capture("drive-aft-root", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("fo1AftRoot"));
  });
  await capture("body-off-drive", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(false);
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("driveBody");
    });
  });
  await capture("body-off-spread", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(false);
      window.__MT1!.setMachineT(0);
      window.__MT1!.setCamera("body");
    });
  });

  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);
});
