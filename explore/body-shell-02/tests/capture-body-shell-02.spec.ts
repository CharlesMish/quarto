import { expect, test } from "@playwright/test";

test("capture MT1-BODY-SHELL-02 director views", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.getBodyConceptState));

  const capture = async (name: string, setup: () => Promise<void>): Promise<void> => {
    await setup();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `evidence/body-shell-02-${name}.png` });
  };

  await capture("spread", async () => {
    await page.evaluate(() => {
      window.__MT1!.setBodyConcept?.(true);
      window.__MT1!.setBodySection?.(false);
      window.__MT1!.setMachineT(0);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("mid", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(0.6);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("drive", async () => {
    await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.setCamera("body");
    });
  });
  await capture("top", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("top"));
  });
  await capture("side", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("side"));
  });
  await capture("front", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("front"));
  });
  await capture("rear", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("rear"));
  });
  await capture("prop", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("propSeated"));
  });
  await capture("section", async () => {
    await page.evaluate(() => window.__MT1!.setCamera("body"));
    await page.getByRole("button", { name: "BODY SECTION", exact: true }).click();
  });
  await capture("body-off", async () => {
    await page.getByRole("button", { name: "BODY SECTION", exact: true }).click();
    await page.getByRole("button", { name: "BODY ON", exact: true }).click();
    await page.evaluate(() => window.__MT1!.setCamera("body"));
  });

  expect(await page.evaluate(() => window.__MT1!.getBodyConceptState?.().enabled)).toBe(false);
});
