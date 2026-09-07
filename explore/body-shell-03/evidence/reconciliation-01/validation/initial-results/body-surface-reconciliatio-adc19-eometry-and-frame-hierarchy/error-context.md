# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: body-surface.spec.ts >> reconciliation retains accepted FO1 station geometry and frame hierarchy
- Location: tests/body-surface.spec.ts:105:1

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 24
Received length: 20
Received array:  ["BODY_FWD_LIP_FWD_PORT_VIS", "BODY_FWD_LIP_AFT_PORT_VIS", "BODY_FWD_FACE_PORT_VIS", "BODY_FWD_SILL_PORT_VIS", "BODY_FWD_WEB_PORT_VIS", "BODY_AFT_LIP_FWD_PORT_VIS", "BODY_AFT_LIP_AFT_PORT_VIS", "BODY_AFT_FACE_PORT_VIS", "BODY_AFT_SILL_PORT_VIS", "BODY_AFT_WEB_PORT_VIS", …]
```

# Test source

```ts
  28  |   await testInfo.attach("body-surface-baseline-negative", { path: reportPath, contentType: "application/json" });
  29  |   expect(report.sourceRef).toBe("3780e0241d4ee6610baf849e33f0348ce32adb33");
  30  |   expect(report.meshCount).toBe(38);
  31  |   expect(report.pass).toBe(false);
  32  |   expect(report.meshes.filter(mesh => mesh.name.includes("DORSAL_DECK") && mesh.boundaryEdges > 0)).toHaveLength(4);
  33  |   expect(report.meshes.filter(mesh => mesh.name.includes("_WEB_") && mesh.degenerates > 0)).toHaveLength(4);
  34  |   const codes = new Set(report.failures.map(failure => failure.code));
  35  |   for (const code of ["NONFLAT_OR_INWARD_NORMAL", "NONOUTWARD_VOLUME", "BODY_MATERIAL_NOT_AUTOMATIC_OPAQUE", "BODY_BLEND_CLASSIFICATION", "BODY_JOIN_GAP", "NOSE_JOIN_VERTEX_MISSING"]) expect(codes.has(code), code).toBe(true);
  36  | });
  37  | 
  38  | test("opaque BODY and explicit section ghosting survive live palette and visibility combinations", async ({ page }) => {
  39  |   await page.goto("/");
  40  |   await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  41  |   const errors: string[] = [];
  42  |   page.on("pageerror", error => errors.push(error.message));
  43  |   await page.locator('[data-panel="details"]').click();
  44  |   await expect(page.locator("#detailsPanel")).toContainText("BODY-SHELL-03.2");
  45  |   await page.locator('[data-panel="inspection"]').click();
  46  |   const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  47  |   const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  48  |   expect(enginePath).toBeTruthy();
  49  |   const engineUrl = new URL(enginePath!, page.url()).href;
  50  |   const before = await page.evaluate(() => ({ inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(), body: window.__MT1!.getBodyConceptState() }));
  51  |   expect(before.inspection.certificate.state).toBe("STALE");
  52  |   expect(before.body.surfaceRevision).toBe("BODY-SHELL-03.2");
  53  |   expect(before.body.stationRevision).toBe("MT1-FO1");
  54  |   expect([...before.body.propGhostMeshes].sort()).toEqual(ghostNames);
  55  |   expect(before.body.meshes).toHaveLength(38);
  56  |   const immutableInventory = rows => rows.map(({ enabled, visible, ...row }) => row);
  57  | 
  58  |   for (const palette of ["accepted", "hush-basin", "accepted"] as const) {
  59  |     await page.locator("#paletteSelect").selectOption(palette);
  60  |     for (const enabled of [true, false]) for (const section of [false, true]) {
  61  |       await page.evaluate(({ enabled, section }) => {
  62  |         window.__MT1!.setBodyConcept(enabled);
  63  |         window.__MT1!.setBodySection(section);
  64  |       }, { enabled, section });
  65  |       for (const ghost of [true, false]) {
  66  |         // Exercise the actual UI→scene→body call, not only the body constructor.
  67  |         await page.locator("#propSectionBtn").click();
  68  |         await expect(page.locator("#propSectionBtn")).toHaveAttribute("aria-pressed", String(ghost));
  69  |         const observation = await page.evaluate(async ({ engineUrl, ghostNames }) => {
  70  |           const { Engine } = await import(engineUrl);
  71  |           const scene = Engine.LastCreatedScene;
  72  |           return {
  73  |             inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(),
  74  |             meshes: scene.meshes.filter(mesh => mesh.name.startsWith("BODY_") || mesh.name.startsWith("S5_CAN_")).map(mesh => ({
  75  |               name: mesh.name, enabled: mesh.isEnabled(), visibility: mesh.visibility,
  76  |               body: mesh.name.startsWith("BODY_"), selectedGhost: ghostNames.includes(mesh.name),
  77  |               alpha: mesh.material.alpha, transparencyMode: mesh.material.transparencyMode,
  78  |               backFaceCulling: mesh.material.backFaceCulling,
  79  |               blended: Boolean(mesh.material.needAlphaBlendingForMesh(mesh)),
  80  |             })),
  81  |           };
  82  |         }, { engineUrl, ghostNames });
  83  |         expect(observation.inspection).toEqual(before.inspection);
  84  |         expect(immutableInventory(observation.inventory)).toEqual(immutableInventory(before.inventory));
  85  |         const bodyMeshes = observation.meshes.filter(mesh => mesh.body);
  86  |         expect(bodyMeshes).toHaveLength(38);
  87  |         expect(observation.meshes.some(mesh => mesh.name.startsWith("S5_CAN_"))).toBe(true);
  88  |         const mismatches = observation.meshes.filter(mesh => mesh.body
  89  |           ? mesh.alpha !== 1 || mesh.transparencyMode !== null || mesh.backFaceCulling !== true
  90  |             || mesh.visibility !== (ghost && mesh.selectedGhost ? 0.12 : 1)
  91  |             || mesh.blended !== (ghost && mesh.selectedGhost)
  92  |             || mesh.enabled !== (enabled && !(section && mesh.name.includes("_STBD_")))
  93  |           : mesh.visibility !== (ghost ? 0.08 : 1) || mesh.blended !== ghost);
  94  |         expect(mismatches, JSON.stringify({ palette, enabled, section, ghost, mismatches })).toEqual([]);
  95  |       }
  96  |     }
  97  |   }
  98  |   await page.evaluate(() => {
  99  |     window.__MT1!.setBodyConcept(true); window.__MT1!.setBodySection(false); window.__MT1!.presentation.setPalette("hush-basin");
  100 |   });
  101 |   expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
  102 |   expect(errors).toEqual([]);
  103 | });
  104 | 
  105 | test("reconciliation retains accepted FO1 station geometry and frame hierarchy", async ({}, testInfo) => {
  106 |   const accepted = await loadBodyFixture({ ref: "e56a4c09330119827e5a6c9757bf5cbc448dd29d", geometryOnly: true });
  107 |   const current = await loadBodyFixture({ geometryOnly: true });
  108 |   const points = mesh => {
  109 |     const values = mesh.getVerticesData("position");
  110 |     return Array.from({ length: values.length / 3 }, (_, i) => Array.from(values.slice(i * 3, i * 3 + 3)));
  111 |   };
  112 |   const within = (a, b) => Math.hypot(...a.map((v, i) => v - b[i])) <= 1e-6;
  113 |   const checked: string[] = [];
  114 |   try {
  115 |     for (const mesh of current.scene.meshes) {
  116 |       const original = accepted.scene.getMeshByName(mesh.name);
  117 |       expect(original, mesh.name).toBeTruthy();
  118 |       for (const term of ["diffuseColor", "emissiveColor", "specularColor"]) {
  119 |         expect(mesh.material[term].asArray(), `${mesh.name} ${term}`).toEqual(original.material[term].asArray());
  120 |       }
  121 |       expect(mesh.material.name, mesh.name).toBe(original.material.name);
  122 |       if (!/^BODY_(FWD|AFT)_/.test(mesh.name)) continue;
  123 |       const actual = points(mesh), prior = points(original);
  124 |       expect(actual.every(a => prior.some(b => within(a, b))), mesh.name).toBe(true);
  125 |       expect(prior.every(a => actual.some(b => within(a, b))), mesh.name).toBe(true);
  126 |       checked.push(mesh.name);
  127 |     }
> 128 |     expect(checked).toHaveLength(24);
      |                     ^ Error: expect(received).toHaveLength(expected)
  129 |     const reportPath = testInfo.outputPath("fo1-station-preservation.json");
  130 |     writeFileSync(reportPath, JSON.stringify({ pass: true, authorityParticipation: "none", acceptedRef: accepted.sourceRef,
  131 |       comparedStations: checked, materialMeshes: current.scene.meshes.length,
  132 |       coordinateToleranceMeters: 1e-6, acceptedSources: accepted.sources, currentSources: current.sources }, null, 2), { flag: "wx" });
  133 |     await testInfo.attach("fo1-station-preservation", { path: reportPath, contentType: "application/json" });
  134 |   } finally { accepted.dispose(); current.dispose(); }
  135 | 
  136 |   const presented = await loadBodyFixture();
  137 |   const value = color => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  138 |   try {
  139 |     for (const palette of ["accepted", "hush-basin"]) {
  140 |       presented.palette.setPalette(palette);
  141 |       for (const hand of ["PORT", "STBD"]) for (const station of ["FWD", "AFT"]) {
  142 |         const face = presented.scene.getMeshByName(`BODY_${station}_FACE_${hand}_VIS`);
  143 |         const frame = presented.scene.getMeshByName(`BODY_${station}_LIP_FWD_${hand}_VIS`);
  144 |         const wall = presented.scene.getMeshByName(`BODY_CHINE_${station}_${hand}_VIS`);
  145 |         expect(value(face.material.diffuseColor), `${palette} ${face.name}`).toBeLessThan(value(frame.material.diffuseColor));
  146 |         expect(value(face.material.diffuseColor), `${palette} ${face.name}`).toBeLessThan(value(wall.material.diffuseColor));
  147 |       }
  148 |     }
  149 |   } finally { presented.dispose(); }
  150 | });
  151 | 
```