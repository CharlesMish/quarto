import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");

test("capture MT1-S3A authority-repair evidence", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setDebug(true);
    api.setSection(false);
    api.setMachineT(1);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3a-drive-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setReadinessOverride({ frontNestReady: false });
    api.setDebug(true);
    api.setMachineT(0.95);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3a-drive-nc-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setReadinessOverride(undefined);
    api.setMachineT(1);
    api.setDebug(true);
    api.setSection(true);
    api.setCamera("side");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3a-waist-debug.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setDebug(false);
    api.setSection(false);
    api.setMachineT(0.42);
    api.previewCant(65);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3a-cant-preview.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(0.42);
    api.previewHaunch(55);
    api.setCamera("three");
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(outDir, "s3a-haunch-preview.png"), fullPage: true });

  await page.evaluate(() => {
    const api = window.__MT1!;
    api.setMachineT(0.42);
  });
});
