import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");
const STATES = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86, 1];

test("capture MT1-S4 bilateral evidence", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  for (const [t, name] of [
    [0, "s4-spread-top"],
    [0.86, "s4-ready-top"],
    [1, "s4-drive-top"],
  ] as const) {
    await page.evaluate(({ t }) => {
      const api = window.__MT1!;
      api.setDebug(false);
      api.setSection(false);
      api.setMachineT(t);
      api.setCamera("top");
    }, { t });
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(outDir, `${name}.png`), fullPage: true });
  }

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(0.72);
    api.setDebug(true);
    api.setCamera("rear");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s4-rear-stbd-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(0.72);
    api.setDebug(true);
    api.setCamera("front");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s4-front-stbd-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(1);
    api.setDebug(true);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s4-four-capture-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(1);
    api.setDebug(true);
    api.setSection(true);
    api.setCamera("side");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s4-waist-debug.png"), fullPage: true });

  for (const cam of ["top", "three"] as const) {
    for (const t of STATES) {
      await page.evaluate(({ t, cam }) => {
        const api = window.__MT1!;
        api.setDebug(false);
        api.setSection(false);
        api.setMachineT(t);
        api.setCamera(cam);
      }, { t, cam });
      await page.waitForTimeout(120);
      const tag = String(t).replace(".", "p");
      await page.screenshot({ path: resolve(outDir, `s4-${cam}-${tag}.png`), fullPage: true });
    }
  }
});
