import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera, type Gesture, type Profile } from "./helpers/cameraGestures";

type Reading = Awaited<ReturnType<typeof readCamera>>;
interface Reference {
  touch: boolean; profile: Profile; kind: Gesture;
  before: Reading; delta: ReturnType<typeof cameraDelta>;
}
interface ResponseReference extends Reference {
  variant: { name: string; radiusFactor: number; framesPerStep: number };
}
// The owner's first PR #12 preview, measured with the same input traces.
const baseline: Reference[] = JSON.parse(readFileSync("evidence/camera-controls-02/baseline/observations.json", "utf8")).observations;
const responseBaseline: ResponseReference[] = JSON.parse(readFileSync("evidence/camera-controls-02/baseline/response-study.json", "utf8")).observations;

function compareSettings(before: Reading, reference: Reference) {
  for (const axis of ["alpha", "beta", "radius"] as const) expect(before[axis]).toBeCloseTo(reference.before[axis], 5);
  before.target.forEach((value, index) => expect(value).toBeCloseTo(reference.before.target[index], 5));
  for (const setting of ["angularSensibilityX", "angularSensibilityY", "pinchDeltaPercentage", "useNaturalPinchZoom", "inertia", "panningInertia"] as const) {
    expect(before[setting], setting).toBe(reference.before[setting]);
  }
  expect(before.panningSensibility).toBe(reference.before.panningSensibility * 1.5);
  const pinchDivisor = (r: Reading) => r.pinchPrecision * (r.angularSensibilityX + r.angularSensibilityY) / 2;
  expect(pinchDivisor(before), "zoom tuning must preserve the orbit divisors").toBe(pinchDivisor(reference.before) * 1.25);
  expect(before.wheelPrecision).toBe(reference.before.wheelPrecision * 1.25);
}

function compareResponse(before: Reading, after: Reading, reference: Reference) {
  const delta = cameraDelta(before, after);
  if (reference.kind.startsWith("pan")) {
    expect(reference.delta.targetDistance, "baseline trace must actually pan").toBeGreaterThan(1);
    expect(delta.targetDistance / reference.delta.targetDistance).toBeGreaterThan(0.65);
    expect(delta.targetDistance / reference.delta.targetDistance).toBeLessThan(0.68);
    expect(Math.abs(delta.alpha)).toBeLessThan(0.002);
    expect(Math.abs(delta.beta)).toBeLessThan(0.002);
  }
  if (reference.kind.startsWith("orbit")) {
    const axis = reference.kind === "orbit-x" ? "alpha" : "beta";
    const other = axis === "alpha" ? "beta" : "alpha";
    expect(Math.abs(reference.delta[axis]), "baseline trace must actually orbit").toBeGreaterThan(0.1);
    expect(delta[axis] / reference.delta[axis]).toBeGreaterThan(0.64);
    expect(delta[axis] / reference.delta[axis]).toBeLessThan(0.69);
    expect(Math.abs(delta[other])).toBeLessThan(0.002);
  }
  if (reference.kind === "zoom") {
    expect(delta.radius / reference.delta.radius).toBeGreaterThan(0.75);
    expect(delta.radius / reference.delta.radius).toBeLessThan(0.805);
  } else {
    // Non-zoom traces may include tiny incidental two-touch residuals.
    expect(Math.abs(delta.radius - reference.delta.radius)).toBeLessThan(0.03);
  }
  expect(after.inspection).toEqual(before.inspection);
  expect(after.inspection.certificate.state).toBe("STALE");
  expect(after.presentation.playback).toBe(reference.profile);
  expect(after.presentation.automatic).toBe(false);
  return delta;
}

for (const touch of [false, true]) {
  test(`${touch ? "two-touch" : "mouse"} orbit and pan retain their tuned response, with gentler zoom`, async ({ browser, baseURL }) => {
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
      // Keep first-contact history identical between playback profiles.
      if (profile !== "inspect") {
        await page.reload();
        await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      }
      for (const kind of ["pan-x", "pan-y", "orbit-x", "orbit-y", "zoom"] as Gesture[]) {
        await resetGesture(page, engineUrl, profile, true);
        const before = await readCamera(page, engineUrl);
        const reference = baseline.find((row) => row.touch === touch && row.profile === profile && row.kind === kind)!;
        expect(reference).toBeDefined();
        compareSettings(before, reference);
        await gesture(page, kind, touch);
        await settleCamera(page, engineUrl);
        const after = await readCamera(page, engineUrl);
        const delta = compareResponse(before, after, reference);
        const firstProfile = deltas.get(kind);
        if (firstProfile) {
          for (const axis of ["alpha", "beta", "radius", "targetDistance"] as const) {
            expect(Math.abs(delta[axis] - firstProfile[axis]), `${kind} ${axis} must not depend on playback profile`).toBeLessThan(0.03);
          }
        } else deltas.set(kind, delta);
      }
    }
    // Additional rate/distance probes use fresh documents, as did the baseline.
    for (const reference of responseBaseline.filter((row) => row.touch === touch)) {
      await page.reload();
      await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      await resetGesture(page, engineUrl, reference.profile, true);
      await page.evaluate(async ({ url, factor }) => {
        const { Engine } = await import(url);
        Engine.LastCreatedScene.activeCamera.radius *= factor;
      }, { url: engineUrl, factor: reference.variant.radiusFactor });
      await settleCamera(page, engineUrl);
      const before = await readCamera(page, engineUrl);
      compareSettings(before, reference);
      await gesture(page, reference.kind, touch, reference.variant.framesPerStep);
      await settleCamera(page, engineUrl);
      compareResponse(before, await readCamera(page, engineUrl), reference);
    }
    // The manual-orbit adapter must not scale programmatic preset/tour angles.
    for (const destination of ["body", "prop", 0, 1, 2, 3, 4, 5] as const) {
      await page.evaluate((value) => {
        if (typeof value === "number") window.__MT1!.presentation.setTourStep(value);
        else window.__MT1!.setCamera(value);
      }, destination);
      const immediate = await readCamera(page, engineUrl);
      await settleCamera(page, engineUrl);
      const settled = await readCamera(page, engineUrl);
      expect(settled.alpha).toBe(immediate.alpha);
      expect(settled.beta).toBe(immediate.beta);
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}
