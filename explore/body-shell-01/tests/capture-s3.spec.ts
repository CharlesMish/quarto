import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");
const STATES = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86, 1];

test("capture MT1-S3 choreography evidence", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  for (const cam of ["top", "three"] as const) {
    for (const t of STATES) {
      await page.evaluate(({ t, cam }) => {
        const api = window.__MT1!;
        api.setDebug(false);
        api.setSection(false);
        api.setMachineT(t);
        api.setCamera(cam);
      }, { t, cam });
      await page.waitForTimeout(150);
      const tag = String(t).replace(".", "p");
      await page.screenshot({ path: resolve(outDir, `s3-${cam}-${tag}.png`), fullPage: true });
    }
  }

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setDebug(true);
    api.setSection(false);
    api.setMachineT(0.72);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3-debug-authority.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setDebug(true);
    api.setSection(true);
    api.setMachineT(1);
    api.setCamera("side");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3-waist-debug.png"), fullPage: true });
});
