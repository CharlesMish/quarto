import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera, type Gesture } from "./helpers/cameraGestures";

type Reading = Awaited<ReturnType<typeof readCamera>>;
type Observation = { key: string; touch: boolean; profile: string; kind: Gesture; direction: number;
  variant: { name: string; radiusFactor: number; framesPerStep: number };
  before: Reading; after: Reading; delta: ReturnType<typeof cameraDelta> };
const evidence = resolve("evidence/camera-controls-03");
const pose = (r: Reading) => ({ alpha: r.alpha, beta: r.beta, radius: r.radius, target: r.target });

test("pinch and wheel zoom are about 20% gentler across direction, distance and playback profile", async ({ browser, baseURL }) => {
  const phase = process.env.ZOOM_REVIEW_PHASE;
  if (phase && phase !== "baseline" && phase !== "candidate") throw new Error("ZOOM_REVIEW_PHASE must be baseline or candidate");
  const reference = phase === "baseline" ? undefined : JSON.parse(readFileSync(resolve(evidence, "baseline/observations.json"), "utf8")) as {
    observations: Observation[]; programmatic: { key: string; pose: ReturnType<typeof pose> }[];
  };
  const observations: Observation[] = [];
  const programmatic: { key: string; pose: ReturnType<typeof pose> }[] = [];
  const errors: string[] = [];
  const directory = phase ? resolve(evidence, phase) : undefined;
  if (directory) mkdirSync(directory, { recursive: true });
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 720 },
      hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage();
    if (touch) await enableTwoTouch(page);
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(baseURL!);
    await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
    const engineUrl = await cameraModule(page);
    for (const profile of ["inspect", "show"] as const) {
      for (const variant of [
        { name: "standard", radiusFactor: 1, framesPerStep: 1 },
        { name: "slower-input", radiusFactor: 1, framesPerStep: 3 },
        { name: "near", radiusFactor: 0.65, framesPerStep: 1 },
        { name: "far", radiusFactor: 1.25, framesPerStep: 1 },
        { name: "far-limit", radiusFactor: 1.35, framesPerStep: 1 },
      ]) {
        const traces: { kind: Gesture; direction: number }[] = [{ kind: "zoom", direction: 1 }, { kind: "zoom", direction: -1 }];
        if (profile === "show" && variant.name === "standard") {
          traces.push(...(["orbit-x", "orbit-y", "pan-x", "pan-y"] as const).map(kind => ({ kind, direction: 1 })));
        }
        for (const { kind, direction } of traces) {
          await page.reload();
          await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
          await resetGesture(page, engineUrl, profile);
          await page.evaluate(async ({ url, factor }) => {
            const { Engine } = await import(url);
            Engine.LastCreatedScene.activeCamera.radius *= factor;
          }, { url: engineUrl, factor: variant.radiusFactor });
          await settleCamera(page, engineUrl);
          const before = await readCamera(page, engineUrl);
          const key = `${touch ? "touch" : "mouse"}/${profile}/${variant.name}/${kind}/${direction}`;
          if (directory && profile === "show" && variant.name === "standard" && kind === "zoom" && direction === 1) {
            await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-start.png`) });
          }
          await gesture(page, kind, touch, variant.framesPerStep, direction);
          await settleCamera(page, engineUrl);
          const after = await readCamera(page, engineUrl);
          const delta = cameraDelta(before, after);
          observations.push({ key, touch, profile, kind, direction, variant, before, after, delta });
          expect(after.inspection).toEqual(before.inspection);
          expect(after.presentation.automatic).toBe(false);
          expect(after.presentation.playback).toBe(profile);
          expect(before.lowerRadiusLimit).toBe(0.05);
          expect(before.upperRadiusLimit).toBe(42);
          if (reference) {
            const old = reference.observations.find(r => r.key === key)!;
            expect(old, key).toBeDefined();
            expect(pose(before)).toEqual(pose(old.before));
            for (const setting of ["angularSensibilityX", "angularSensibilityY", "panningSensibility", "pinchDeltaPercentage", "useNaturalPinchZoom", "inertia", "panningInertia", "lowerRadiusLimit", "upperRadiusLimit"] as const) {
              expect(before[setting], `${key} ${setting}`).toBe(old.before[setting]);
            }
            expect(before.pinchPrecision).toBe(old.before.pinchPrecision * 1.25);
            expect(before.wheelPrecision).toBe(old.before.wheelPrecision * 1.25);
            if (kind === "zoom") {
              expect(Math.abs(old.delta.radius)).toBeGreaterThan(0.1);
              if (old.after.radius === old.before.upperRadiusLimit || old.after.radius === old.before.lowerRadiusLimit) {
                // A bound-clipped trace measures the retained limit, not gain.
                expect(after.radius, `${key} keeps its original stop`).toBe(old.after.radius);
              } else {
                expect(delta.radius / old.delta.radius, key).toBeGreaterThan(0.75);
                expect(delta.radius / old.delta.radius, key).toBeLessThan(0.805);
              }
              expect(Math.abs(delta.alpha)).toBeLessThan(0.002);
              expect(Math.abs(delta.beta)).toBeLessThan(0.002);
            } else {
              for (const axis of ["alpha", "beta", "targetDistance"] as const) {
                expect(Math.abs(delta[axis] - old.delta[axis]), `${key} ${axis}`).toBeLessThan(0.01);
              }
            }
          }
          if (directory && profile === "show" && variant.name === "standard" && kind === "zoom") {
            await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-zoom-${direction}.png`) });
          }
          if (kind === "zoom" && variant.name === "standard") {
            await page.getByRole("button", { name: "FIT", exact: true }).click();
            await settleCamera(page, engineUrl);
            const fitted = await readCamera(page, engineUrl);
            expect(fitted.radius).toBeCloseTo(before.radius, 5);
            expect(fitted.target).toEqual(before.target);
          }
        }
      }
    }
    // Actual inputs still stop at the original minimum and maximum radius.
    for (const edge of ["lower", "upper"] as const) {
      await resetGesture(page, engineUrl, "show");
      await page.evaluate(async ({ url, edge }) => {
        const { Engine } = await import(url);
        Engine.LastCreatedScene.activeCamera.radius = edge === "lower" ? 0.1 : 41.9;
      }, { url: engineUrl, edge });
      const direction = touch ? (edge === "lower" ? 1 : -1) : (edge === "lower" ? -1 : 1);
      await gesture(page, "zoom", touch, 1, direction);
      await settleCamera(page, engineUrl);
      expect((await readCamera(page, engineUrl)).radius).toBe(edge === "lower" ? 0.05 : 42);
    }
    for (const destination of ["body", "prop", 0, 1, 2, 3, 4, 5] as const) {
      await page.evaluate(value => {
        if (typeof value === "number") window.__MT1!.presentation.setTourStep(value);
        else window.__MT1!.setCamera(value);
      }, destination);
      await settleCamera(page, engineUrl);
      const record = { key: `${touch}/${destination}`, pose: pose(await readCamera(page, engineUrl)) };
      programmatic.push(record);
      if (reference) expect(record).toEqual(reference.programmatic.find(r => r.key === record.key));
    }
    await context.close();
  }
  if (directory) writeFileSync(resolve(directory, "observations.json"), JSON.stringify({
    capturedAt: new Date().toISOString(), sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    phase, baseURL, note: "Same browser input traces; touch is emulated, not a physical phone. Candidate may be an uncommitted diff from sourceHead.",
    errors, observations, programmatic,
  }, null, 2) + "\n");
  expect(errors).toEqual([]);
});
