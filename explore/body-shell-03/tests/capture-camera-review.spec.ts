import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera, type Gesture } from "./helpers/cameraGestures";

test("@evidence-writer matched desktop and touch-emulated camera gestures", async ({ browser, baseURL }) => {
  const phase = process.env.CAMERA_REVIEW_PHASE;
  if (phase !== "baseline" && phase !== "candidate") throw new Error("Set CAMERA_REVIEW_PHASE=baseline|candidate explicitly");
  const directory = resolve("evidence/camera-controls-01", phase);
  mkdirSync(directory, { recursive: true });
  const observations: unknown[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const touch of [false, true]) {
    const viewport = touch ? { width: 390, height: 844 } : { width: 1280, height: 720 };
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage();
    if (touch) await enableTwoTouch(page);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.goto(baseURL!);
    if (touch) expect(await page.evaluate(() => navigator.maxTouchPoints)).toBe(2);
    await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
    const engineUrl = await cameraModule(page);
    for (const profile of ["inspect", "show", "game"] as const) {
      // Compare each playback profile from the same fresh pointer history.
      if (profile !== "inspect") {
        await page.reload();
        await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      }
      for (const kind of ["pan-x", "pan-y", "orbit-x", "orbit-y", "zoom"] as Gesture[]) {
        await resetGesture(page, engineUrl, profile);
        const before = await readCamera(page, engineUrl);
        if (profile === "show" && kind === "pan-x") await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-start.png`) });
        await gesture(page, kind, touch);
        await settleCamera(page, engineUrl);
        const after = await readCamera(page, engineUrl);
        const delta = cameraDelta(before, after);
        observations.push({ touch, viewport, profile, kind, before, after, delta });
        if (kind.startsWith("pan")) expect(delta.targetDistance, "gesture must actually pan").toBeGreaterThan(1);
        if (kind === "zoom") expect(Math.abs(delta.radius), "gesture must actually zoom").toBeGreaterThan(0.1);
        if (profile === "show" && ["pan-x", "pan-y", "orbit-x"].includes(kind)) {
          await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-${kind}.png`) });
        }
        expect(after.inspection.certificate.state).toBe("STALE");
        expect(after.inspection.machineT).toBe(0);
      }
    }
    await context.close();
  }
  writeFileSync(resolve(directory, "observations.json"), JSON.stringify({
    capturedAt: new Date().toISOString(), sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    phase, baseURL, note: "Actual browser mouse/touch-emulated inputs; not physical-phone feel. Candidate may be an uncommitted diff from sourceHead.",
    errors, warnings, observations,
  }, null, 2) + "\n");
  expect(errors).toEqual([]);
  // Chromium can report ReadPixels stalls while screenshots read the GPU.
  // Retain those capture warnings; do not treat them as app/runtime errors.
  expect(warnings.filter((message) => !message.includes("GPU stall due to ReadPixels"))).toEqual([]);
});
