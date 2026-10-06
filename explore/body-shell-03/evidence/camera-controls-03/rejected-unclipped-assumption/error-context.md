# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zoom-response.spec.ts >> pinch and wheel zoom are about 20% gentler across direction, distance and playback profile
- Location: tests/zoom-response.spec.ts:14:1

# Error details

```
Error: touch/inspect/far/zoom/-1

expect(received).toBeLessThan(expected)

Expected: < 0.805
Received:   1
```

# Page snapshot

```yaml
- generic [ref=f8e1]:
  - generic "Quarto inspectable transformation · MT1-BODY-SHELL-03" [active] [ref=f8e2]
  - generic:
    - banner:
      - generic: QUARTO
      - generic:
        - generic: SPREAD
        - generic: MACHINE 0.000 · MODE MACHINE
    - region "Transformation controls" [ref=f8e3]:
      - generic [ref=f8e4]:
        - generic [ref=f8e5]: SPREAD
        - generic [ref=f8e6]: Machine transformation
        - slider "Machine transformation" [ref=f8e7]: "0"
        - generic [ref=f8e8]: DRIVE
      - generic [ref=f8e9]:
        - button "PLAY ▶" [ref=f8e10] [cursor=pointer]
        - button "REVERSE ↶" [ref=f8e11] [cursor=pointer]
        - button "BODY ON" [pressed] [ref=f8e12] [cursor=pointer]
        - generic [ref=f8e13]:
          - generic [ref=f8e14]: Color palette
          - combobox "Color palette" [ref=f8e15] [cursor=pointer]:
            - option "Hush Basin" [selected]
            - option "Accepted palette"
        - generic [ref=f8e16]:
          - generic [ref=f8e17]: Playback speed
          - combobox "Playback speed" [ref=f8e18] [cursor=pointer]:
            - option "Inspect" [selected]
            - option "Show"
            - option "Game"
        - button "FIT" [ref=f8e19] [cursor=pointer]
        - button "TAKE A TOUR" [ref=f8e20] [cursor=pointer]
      - navigation "Viewer tools" [ref=f8e21]:
        - button "Cameras" [ref=f8e22] [cursor=pointer]
        - button "Inspection" [ref=f8e23] [cursor=pointer]
        - button "Diagnostics" [ref=f8e24] [cursor=pointer]
        - button "Folio previews" [ref=f8e25] [cursor=pointer]
        - button "Details & help" [ref=f8e26] [cursor=pointer]
```

# Test source

```ts
  1   | import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
  2   | import { resolve } from "node:path";
  3   | import { execFileSync } from "node:child_process";
  4   | import { expect, test } from "@playwright/test";
  5   | import { cameraDelta, cameraModule, enableTwoTouch, gesture, readCamera, resetGesture, settleCamera, type Gesture } from "./helpers/cameraGestures";
  6   |
  7   | type Reading = Awaited<ReturnType<typeof readCamera>>;
  8   | type Observation = { key: string; touch: boolean; profile: string; kind: Gesture; direction: number;
  9   |   variant: { name: string; radiusFactor: number; framesPerStep: number };
  10  |   before: Reading; after: Reading; delta: ReturnType<typeof cameraDelta> };
  11  | const evidence = resolve("evidence/camera-controls-03");
  12  | const pose = (r: Reading) => ({ alpha: r.alpha, beta: r.beta, radius: r.radius, target: r.target });
  13  |
  14  | test("pinch and wheel zoom are about 20% gentler across direction, distance and playback profile", async ({ browser, baseURL }) => {
  15  |   const phase = process.env.ZOOM_REVIEW_PHASE;
  16  |   if (phase && phase !== "baseline" && phase !== "candidate") throw new Error("ZOOM_REVIEW_PHASE must be baseline or candidate");
  17  |   const reference = phase === "baseline" ? undefined : JSON.parse(readFileSync(resolve(evidence, "baseline/observations.json"), "utf8")) as {
  18  |     observations: Observation[]; programmatic: { key: string; pose: ReturnType<typeof pose> }[];
  19  |   };
  20  |   const observations: Observation[] = [];
  21  |   const programmatic: { key: string; pose: ReturnType<typeof pose> }[] = [];
  22  |   const errors: string[] = [];
  23  |   const directory = phase ? resolve(evidence, phase) : undefined;
  24  |   if (directory) mkdirSync(directory, { recursive: true });
  25  |   for (const touch of [false, true]) {
  26  |     const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 720 },
  27  |       hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  28  |     const page = await context.newPage();
  29  |     if (touch) await enableTwoTouch(page);
  30  |     page.on("pageerror", e => errors.push(e.message));
  31  |     page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  32  |     await page.goto(baseURL!);
  33  |     await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  34  |     const engineUrl = await cameraModule(page);
  35  |     for (const profile of ["inspect", "show"] as const) {
  36  |       for (const variant of [
  37  |         { name: "standard", radiusFactor: 1, framesPerStep: 1 },
  38  |         { name: "slower-input", radiusFactor: 1, framesPerStep: 3 },
  39  |         { name: "near", radiusFactor: 0.65, framesPerStep: 1 },
  40  |         { name: "far", radiusFactor: 1.35, framesPerStep: 1 },
  41  |       ]) {
  42  |         const traces: { kind: Gesture; direction: number }[] = [{ kind: "zoom", direction: 1 }, { kind: "zoom", direction: -1 }];
  43  |         if (profile === "show" && variant.name === "standard") {
  44  |           traces.push(...(["orbit-x", "orbit-y", "pan-x", "pan-y"] as const).map(kind => ({ kind, direction: 1 })));
  45  |         }
  46  |         for (const { kind, direction } of traces) {
  47  |           await page.reload();
  48  |           await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  49  |           await resetGesture(page, engineUrl, profile);
  50  |           await page.evaluate(async ({ url, factor }) => {
  51  |             const { Engine } = await import(url);
  52  |             Engine.LastCreatedScene.activeCamera.radius *= factor;
  53  |           }, { url: engineUrl, factor: variant.radiusFactor });
  54  |           await settleCamera(page, engineUrl);
  55  |           const before = await readCamera(page, engineUrl);
  56  |           const key = `${touch ? "touch" : "mouse"}/${profile}/${variant.name}/${kind}/${direction}`;
  57  |           if (directory && profile === "show" && variant.name === "standard" && kind === "zoom" && direction === 1) {
  58  |             await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-start.png`) });
  59  |           }
  60  |           await gesture(page, kind, touch, variant.framesPerStep, direction);
  61  |           await settleCamera(page, engineUrl);
  62  |           const after = await readCamera(page, engineUrl);
  63  |           const delta = cameraDelta(before, after);
  64  |           observations.push({ key, touch, profile, kind, direction, variant, before, after, delta });
  65  |           expect(after.inspection).toEqual(before.inspection);
  66  |           expect(after.presentation.automatic).toBe(false);
  67  |           expect(after.presentation.playback).toBe(profile);
  68  |           expect(before.lowerRadiusLimit).toBe(0.05);
  69  |           expect(before.upperRadiusLimit).toBe(42);
  70  |           if (reference) {
  71  |             const old = reference.observations.find(r => r.key === key)!;
  72  |             expect(old, key).toBeDefined();
  73  |             expect(pose(before)).toEqual(pose(old.before));
  74  |             for (const setting of ["angularSensibilityX", "angularSensibilityY", "panningSensibility", "pinchDeltaPercentage", "useNaturalPinchZoom", "inertia", "panningInertia", "lowerRadiusLimit", "upperRadiusLimit"] as const) {
  75  |               expect(before[setting], `${key} ${setting}`).toBe(old.before[setting]);
  76  |             }
  77  |             expect(before.pinchPrecision).toBe(old.before.pinchPrecision * 1.25);
  78  |             expect(before.wheelPrecision).toBe(old.before.wheelPrecision * 1.25);
  79  |             if (kind === "zoom") {
  80  |               expect(Math.abs(old.delta.radius)).toBeGreaterThan(0.1);
  81  |               expect(delta.radius / old.delta.radius, key).toBeGreaterThan(0.75);
> 82  |               expect(delta.radius / old.delta.radius, key).toBeLessThan(0.805);
      |                                                            ^ Error: touch/inspect/far/zoom/-1
  83  |               expect(Math.abs(delta.alpha)).toBeLessThan(0.002);
  84  |               expect(Math.abs(delta.beta)).toBeLessThan(0.002);
  85  |             } else {
  86  |               for (const axis of ["alpha", "beta", "targetDistance"] as const) {
  87  |                 expect(Math.abs(delta[axis] - old.delta[axis]), `${key} ${axis}`).toBeLessThan(0.01);
  88  |               }
  89  |             }
  90  |           }
  91  |           if (directory && profile === "show" && variant.name === "standard" && kind === "zoom") {
  92  |             await page.screenshot({ path: resolve(directory, `${touch ? "touch" : "desktop"}-zoom-${direction}.png`) });
  93  |           }
  94  |           if (kind === "zoom" && variant.name === "standard") {
  95  |             await page.getByRole("button", { name: "FIT", exact: true }).click();
  96  |             await settleCamera(page, engineUrl);
  97  |             const fitted = await readCamera(page, engineUrl);
  98  |             expect(fitted.radius).toBeCloseTo(before.radius, 5);
  99  |             expect(fitted.target).toEqual(before.target);
  100 |           }
  101 |         }
  102 |       }
  103 |     }
  104 |     // Actual inputs still stop at the original minimum and maximum radius.
  105 |     for (const edge of ["lower", "upper"] as const) {
  106 |       await resetGesture(page, engineUrl, "show");
  107 |       await page.evaluate(async ({ url, edge }) => {
  108 |         const { Engine } = await import(url);
  109 |         Engine.LastCreatedScene.activeCamera.radius = edge === "lower" ? 0.1 : 41.9;
  110 |       }, { url: engineUrl, edge });
  111 |       const direction = touch ? (edge === "lower" ? 1 : -1) : (edge === "lower" ? -1 : 1);
  112 |       await gesture(page, "zoom", touch, 1, direction);
  113 |       await settleCamera(page, engineUrl);
  114 |       expect((await readCamera(page, engineUrl)).radius).toBe(edge === "lower" ? 0.05 : 42);
  115 |     }
  116 |     for (const destination of ["body", "prop", 0, 1, 2, 3, 4, 5] as const) {
  117 |       await page.evaluate(value => {
  118 |         if (typeof value === "number") window.__MT1!.presentation.setTourStep(value);
  119 |         else window.__MT1!.setCamera(value);
  120 |       }, destination);
  121 |       await settleCamera(page, engineUrl);
  122 |       const record = { key: `${touch}/${destination}`, pose: pose(await readCamera(page, engineUrl)) };
  123 |       programmatic.push(record);
  124 |       if (reference) expect(record).toEqual(reference.programmatic.find(r => r.key === record.key));
  125 |     }
  126 |     await context.close();
  127 |   }
  128 |   if (directory) writeFileSync(resolve(directory, "observations.json"), JSON.stringify({
  129 |     capturedAt: new Date().toISOString(), sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  130 |     phase, baseURL, note: "Same browser input traces; touch is emulated, not a physical phone. Candidate may be an uncommitted diff from sourceHead.",
  131 |     errors, observations, programmatic,
  132 |   }, null, 2) + "\n");
  133 |   expect(errors).toEqual([]);
  134 | });
  135 |
```
