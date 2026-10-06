import { writeFileSync } from "node:fs";
import { test } from "@playwright/test";
import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera } from "./helpers/cameraGestures";

test("@evidence-writer touch orbit gain and cutoff probe", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enableTwoTouch(page);
  await page.goto(baseURL!);
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const url = await cameraModule(page);
  const rows = [];
  for (const divisor of [1000, 1100, 1200, 1250, 1500]) {
    for (const framesPerStep of [1, 3]) {
      await page.reload();
      await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      await resetGesture(page, url, "show");
      await page.evaluate(async ({ url, divisor }) => {
        const { Engine } = await import(url);
        const camera = Engine.LastCreatedScene.activeCamera;
        camera.angularSensibilityX = camera.angularSensibilityY = divisor;
        camera.pinchPrecision = 12000 / divisor;
      }, { url, divisor });
      const before = await readCamera(page, url);
      await gesture(page, "orbit-y", true, framesPerStep);
      await settleCamera(page, url);
      const after = await readCamera(page, url);
      rows.push({ divisor, framesPerStep, delta: cameraDelta(before, after) });
    }
  }
  writeFileSync("evidence/camera-controls-02/orbit-gain-probe.json", JSON.stringify({ note: "Test-only settings overrides; not a shipped candidate or physical-phone result", rows }, null, 2) + "\n");
  await context.close();
});
