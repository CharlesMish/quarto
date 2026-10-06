import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera, type Gesture, type Profile } from "./helpers/cameraGestures";

type Reading = Awaited<ReturnType<typeof readCamera>>;
interface Reference {
  touch: boolean; profile: Profile; kind: Gesture;
  before: Reading; delta: ReturnType<typeof cameraDelta>;
}
// Measured on the accepted source, with exactly the same browser input traces.
const baseline: Reference[] = JSON.parse(readFileSync("evidence/camera-controls-01/baseline/observations.json", "utf8")).observations;

for (const touch of [false, true]) {
  test(`${touch ? "two-touch" : "mouse"} panning is gentler while orbit, zoom and playback profiles remain independent`, async ({ browser, baseURL }) => {
    const viewport = touch ? { width: 390, height: 844 } : { width: 1280, height: 720 };
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage();
    if (touch) await enableTwoTouch(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(baseURL!);
    await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
    if (touch) expect(await page.evaluate(() => navigator.maxTouchPoints)).toBe(2);
    const engineUrl = await cameraModule(page);
    const deltas = new Map<Gesture, ReturnType<typeof cameraDelta>>();
    for (const profile of ["inspect", "show", "game"] as const) {
      // The first touch pan after load initializes Babylon's contact history;
      // comparing it with later pans would conflate input history and profile.
      if (profile !== "inspect") {
        await page.reload();
        await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      }
      for (const kind of ["pan-x", "pan-y", "orbit-x", "orbit-y", "zoom"] as Gesture[]) {
        await resetGesture(page, engineUrl, profile);
        const before = await readCamera(page, engineUrl);
        const reference = baseline.find((row) => row.touch === touch && row.profile === profile && row.kind === kind)!;
        expect(reference).toBeDefined();
        for (const axis of ["alpha", "beta", "radius"] as const) expect(before[axis]).toBeCloseTo(reference.before[axis], 5);
        before.target.forEach((value, index) => expect(value).toBeCloseTo(reference.before.target[index], 5));
        for (const setting of ["angularSensibilityX", "angularSensibilityY", "wheelPrecision", "pinchPrecision", "pinchDeltaPercentage", "useNaturalPinchZoom", "inertia", "panningInertia"] as const) {
          expect(before[setting], setting).toBe(reference.before[setting]);
        }
        await gesture(page, kind, touch);
        await settleCamera(page, engineUrl);
        const after = await readCamera(page, engineUrl);
        const delta = cameraDelta(before, after);
        if (kind.startsWith("pan")) {
          expect(reference.delta.targetDistance, "accepted trace must pan").toBeGreaterThan(1);
          expect(delta.targetDistance / reference.delta.targetDistance).toBeGreaterThan(0.78);
          expect(delta.targetDistance / reference.delta.targetDistance).toBeLessThan(0.82);
          expect(Math.abs(delta.alpha)).toBeLessThan(0.002);
          expect(Math.abs(delta.beta)).toBeLessThan(0.002);
        }
        // Both the intended wheel/pinch response and incidental pinch during
        // a two-finger translation remain unchanged, within settling tolerance.
        expect(Math.abs(delta.radius - reference.delta.radius)).toBeLessThan(0.03);
        if (kind.startsWith("orbit")) {
          expect(Math.abs(delta.alpha - reference.delta.alpha)).toBeLessThan(0.004);
          expect(Math.abs(delta.beta - reference.delta.beta)).toBeLessThan(0.004);
        }
        const firstProfile = deltas.get(kind);
        if (firstProfile) {
          for (const axis of ["alpha", "beta", "radius", "targetDistance"] as const) {
            expect(Math.abs(delta[axis] - firstProfile[axis]), `${kind} ${axis} must not depend on playback profile`).toBeLessThan(0.03);
          }
        } else deltas.set(kind, delta);
        expect(after.inspection).toEqual(before.inspection);
        expect(after.inspection.certificate.state).toBe("STALE");
        expect(after.presentation.playback).toBe(profile);
        expect(after.presentation.automatic).toBe(false);
      }
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}
