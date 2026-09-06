# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: body-surface.spec.ts >> BODY-SHELL-03.2 actual surfaces are closed, outward, flat and within the bounded joins
- Location: tests/body-surface.spec.ts:7:1

# Error details

```
Error: [
  {
    "code": "BODY_JOIN_GAP",
    "mesh": "NOSE_RETURN_PORT",
    "point": [
      -0.395,
      1.0609668508287293,
      5
    ],
    "gap": 0.07750117897878972
  },
  {
    "code": "BODY_JOIN_GAP",
    "mesh": "NOSE_RETURN_STBD",
    "point": [
      0.395,
      1.0609668508287293,
      5
    ],
    "gap": 0.07750117897878972
  }
]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 22

- Array []
+ Array [
+   Object {
+     "code": "BODY_JOIN_GAP",
+     "gap": 0.07750117897878972,
+     "mesh": "NOSE_RETURN_PORT",
+     "point": Array [
+       -0.395,
+       1.0609668508287293,
+       5,
+     ],
+   },
+   Object {
+     "code": "BODY_JOIN_GAP",
+     "gap": 0.07750117897878972,
+     "mesh": "NOSE_RETURN_STBD",
+     "point": Array [
+       0.395,
+       1.0609668508287293,
+       5,
+     ],
+   },
+ ]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { verifyBodySurface } from "../tools/verify-body-surface.mjs";
  3  | 
  4  | const ghostNames = ["CHINE_AFT", "DORSAL_DECK_AFT", "COLLAR_SIDE", "COLLAR_LINTEL", "COLLAR_SILL"]
  5  |   .flatMap(stem => ["PORT", "STBD"].map(hand => `BODY_${stem}_${hand}_VIS`)).sort();
  6  | 
  7  | test("BODY-SHELL-03.2 actual surfaces are closed, outward, flat and within the bounded joins", async ({}, testInfo) => {
  8  |   const report = await verifyBodySurface();
  9  |   await testInfo.attach("body-surface-verification", { body: Buffer.from(JSON.stringify(report, null, 2)), contentType: "application/json" });
  10 |   expect(report.meshCount).toBe(38);
  11 |   expect(report.surfaceRevision).toBe("BODY-SHELL-03.2");
  12 |   expect(report.participatesInAuthority).toBe(false);
  13 |   expect(report.authorityParticipation).toBe("none");
  14 |   expect(report.dimensions.mirroredPairs).toBe(19);
  15 |   expect(report.seams.length).toBe(72);
> 16 |   expect(report.failures, JSON.stringify(report.failures, null, 2)).toEqual([]);
     |                                                                     ^ Error: [
  17 |   expect(report.pass).toBe(true);
  18 | });
  19 | 
  20 | test("surface verifier rejects known defects in the immutable pre-refinement shell", async ({}, testInfo) => {
  21 |   const report = await verifyBodySurface({ ref: "3780e02" });
  22 |   await testInfo.attach("body-surface-baseline-negative", { body: Buffer.from(JSON.stringify(report, null, 2)), contentType: "application/json" });
  23 |   expect(report.sourceRef).toBe("3780e0241d4ee6610baf849e33f0348ce32adb33");
  24 |   expect(report.meshCount).toBe(38);
  25 |   expect(report.pass).toBe(false);
  26 |   expect(report.meshes.filter(mesh => mesh.name.includes("DORSAL_DECK") && mesh.boundaryEdges > 0)).toHaveLength(4);
  27 |   expect(report.meshes.filter(mesh => mesh.name.includes("_WEB_") && mesh.degenerates > 0)).toHaveLength(4);
  28 |   const codes = new Set(report.failures.map(failure => failure.code));
  29 |   for (const code of ["NONFLAT_OR_INWARD_NORMAL", "NONOUTWARD_VOLUME", "BODY_MATERIAL_NOT_AUTOMATIC_OPAQUE", "BODY_BLEND_CLASSIFICATION", "BODY_JOIN_GAP", "NOSE_JOIN_VERTEX_MISSING"]) expect(codes.has(code), code).toBe(true);
  30 | });
  31 | 
  32 | test("opaque BODY and explicit section ghosting survive live palette and visibility combinations", async ({ page }) => {
  33 |   await page.goto("/");
  34 |   await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  35 |   const errors: string[] = [];
  36 |   page.on("pageerror", error => errors.push(error.message));
  37 |   await page.locator('[data-panel="details"]').click();
  38 |   await expect(page.locator("#detailsPanel")).toContainText("BODY-SHELL-03.2");
  39 |   await page.locator('[data-panel="inspection"]').click();
  40 |   const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  41 |   const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  42 |   expect(enginePath).toBeTruthy();
  43 |   const engineUrl = new URL(enginePath!, page.url()).href;
  44 |   const before = await page.evaluate(() => ({ inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(), body: window.__MT1!.getBodyConceptState() }));
  45 |   expect(before.inspection.certificate.state).toBe("STALE");
  46 |   expect(before.body.surfaceRevision).toBe("BODY-SHELL-03.2");
  47 |   expect([...before.body.propGhostMeshes].sort()).toEqual(ghostNames);
  48 |   expect(before.body.meshes).toHaveLength(38);
  49 |   const immutableInventory = rows => rows.map(({ enabled, visible, ...row }) => row);
  50 | 
  51 |   for (const palette of ["accepted", "hush-basin", "accepted"] as const) {
  52 |     await page.locator("#paletteSelect").selectOption(palette);
  53 |     for (const enabled of [true, false]) for (const section of [false, true]) {
  54 |       await page.evaluate(({ enabled, section }) => {
  55 |         window.__MT1!.setBodyConcept(enabled);
  56 |         window.__MT1!.setBodySection(section);
  57 |       }, { enabled, section });
  58 |       for (const ghost of [true, false]) {
  59 |         // Exercise the actual UI→scene→body call, not only the body constructor.
  60 |         await page.locator("#propSectionBtn").click();
  61 |         await expect(page.locator("#propSectionBtn")).toHaveAttribute("aria-pressed", String(ghost));
  62 |         const observation = await page.evaluate(async ({ engineUrl, ghostNames }) => {
  63 |           const { Engine } = await import(engineUrl);
  64 |           const scene = Engine.LastCreatedScene;
  65 |           return {
  66 |             inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(),
  67 |             meshes: scene.meshes.filter(mesh => mesh.name.startsWith("BODY_") || mesh.name.startsWith("S5_CAN_")).map(mesh => ({
  68 |               name: mesh.name, enabled: mesh.isEnabled(), visibility: mesh.visibility,
  69 |               body: mesh.name.startsWith("BODY_"), selectedGhost: ghostNames.includes(mesh.name),
  70 |               alpha: mesh.material.alpha, transparencyMode: mesh.material.transparencyMode,
  71 |               blended: Boolean(mesh.material.needAlphaBlendingForMesh(mesh)),
  72 |             })),
  73 |           };
  74 |         }, { engineUrl, ghostNames });
  75 |         expect(observation.inspection).toEqual(before.inspection);
  76 |         expect(immutableInventory(observation.inventory)).toEqual(immutableInventory(before.inventory));
  77 |         const bodyMeshes = observation.meshes.filter(mesh => mesh.body);
  78 |         expect(bodyMeshes).toHaveLength(38);
  79 |         expect(observation.meshes.some(mesh => mesh.name.startsWith("S5_CAN_"))).toBe(true);
  80 |         const mismatches = observation.meshes.filter(mesh => mesh.body
  81 |           ? mesh.alpha !== 1 || mesh.transparencyMode !== null
  82 |             || mesh.visibility !== (ghost && mesh.selectedGhost ? 0.12 : 1)
  83 |             || mesh.blended !== (ghost && mesh.selectedGhost)
  84 |             || mesh.enabled !== (enabled && !(section && mesh.name.includes("_STBD_")))
  85 |           : mesh.visibility !== (ghost ? 0.08 : 1));
  86 |         expect(mismatches, JSON.stringify({ palette, enabled, section, ghost, mismatches })).toEqual([]);
  87 |       }
  88 |     }
  89 |   }
  90 |   await page.evaluate(() => {
  91 |     window.__MT1!.setBodyConcept(true); window.__MT1!.setBodySection(false); window.__MT1!.presentation.setPalette("hush-basin");
  92 |   });
  93 |   expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
  94 |   expect(errors).toEqual([]);
  95 | });
  96 | 
```