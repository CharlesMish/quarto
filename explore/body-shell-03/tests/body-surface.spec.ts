import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { loadBodyFixture, verifyBodySurface } from "../tools/verify-body-surface.mjs";

const ghostNames = ["CHINE_AFT", "DORSAL_DECK_AFT", "COLLAR_SIDE", "COLLAR_LINTEL", "COLLAR_SILL"]
  .flatMap(stem => ["PORT", "STBD"].map(hand => `BODY_${stem}_${hand}_VIS`)).sort();

test("BODY-SHELL-03.2 actual surfaces are closed, outward, flat and within the bounded joins", async ({}, testInfo) => {
  const report = await verifyBodySurface();
  const reportPath = testInfo.outputPath("body-surface-verification.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  await testInfo.attach("body-surface-verification", { path: reportPath, contentType: "application/json" });
  expect(report.meshCount).toBe(38);
  expect(report.surfaceRevision).toBe("BODY-SHELL-03.2");
  expect(report.stationRevision).toBe("MT1-FO1");
  expect(report.participatesInAuthority).toBe(false);
  expect(report.authorityParticipation).toBe("none");
  expect(report.dimensions.mirroredPairs).toBe(19);
  expect(report.seams.length).toBe(72);
  expect(report.failures, JSON.stringify(report.failures, null, 2)).toEqual([]);
  expect(report.pass).toBe(true);
});

test("surface verifier rejects known defects in the immutable pre-refinement shell", async ({}, testInfo) => {
  const report = await verifyBodySurface({ ref: "3780e02" });
  const reportPath = testInfo.outputPath("body-surface-baseline-negative.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  await testInfo.attach("body-surface-baseline-negative", { path: reportPath, contentType: "application/json" });
  expect(report.sourceRef).toBe("3780e0241d4ee6610baf849e33f0348ce32adb33");
  expect(report.meshCount).toBe(38);
  expect(report.pass).toBe(false);
  expect(report.meshes.filter(mesh => mesh.name.includes("DORSAL_DECK") && mesh.boundaryEdges > 0)).toHaveLength(4);
  expect(report.meshes.filter(mesh => mesh.name.includes("_WEB_") && mesh.degenerates > 0)).toHaveLength(4);
  const codes = new Set(report.failures.map(failure => failure.code));
  for (const code of ["NONFLAT_OR_INWARD_NORMAL", "NONOUTWARD_VOLUME", "BODY_MATERIAL_NOT_AUTOMATIC_OPAQUE", "BODY_BLEND_CLASSIFICATION", "BODY_JOIN_GAP", "NOSE_JOIN_VERTEX_MISSING"]) expect(codes.has(code), code).toBe(true);
});

test("opaque BODY and explicit section ghosting survive live palette and visibility combinations", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.locator('[data-panel="details"]').click();
  await expect(page.locator("#detailsPanel")).toContainText("BODY-SHELL-03.2");
  await page.locator('[data-panel="inspection"]').click();
  const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  expect(enginePath).toBeTruthy();
  const engineUrl = new URL(enginePath!, page.url()).href;
  const before = await page.evaluate(() => ({ inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(), body: window.__MT1!.getBodyConceptState() }));
  expect(before.inspection.certificate.state).toBe("STALE");
  expect(before.body.surfaceRevision).toBe("BODY-SHELL-03.2");
  expect(before.body.stationRevision).toBe("MT1-FO1");
  expect([...before.body.propGhostMeshes].sort()).toEqual(ghostNames);
  expect(before.body.meshes).toHaveLength(38);
  const immutableInventory = rows => rows.map(({ enabled, visible, ...row }) => row);

  for (const palette of ["accepted", "hush-basin", "accepted"] as const) {
    await page.locator("#paletteSelect").selectOption(palette);
    for (const enabled of [true, false]) for (const section of [false, true]) {
      await page.evaluate(({ enabled, section }) => {
        window.__MT1!.setBodyConcept(enabled);
        window.__MT1!.setBodySection(section);
      }, { enabled, section });
      for (const ghost of [true, false]) {
        // Exercise the actual UI→scene→body call, not only the body constructor.
        await page.locator("#propSectionBtn").click();
        await expect(page.locator("#propSectionBtn")).toHaveAttribute("aria-pressed", String(ghost));
        const observation = await page.evaluate(async ({ engineUrl, ghostNames }) => {
          const { Engine } = await import(engineUrl);
          const scene = Engine.LastCreatedScene;
          return {
            inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory(),
            meshes: scene.meshes.filter(mesh => mesh.name.startsWith("BODY_") || mesh.name.startsWith("S5_CAN_")).map(mesh => ({
              name: mesh.name, enabled: mesh.isEnabled(), visibility: mesh.visibility,
              body: mesh.name.startsWith("BODY_"), selectedGhost: ghostNames.includes(mesh.name),
              alpha: mesh.material.alpha, transparencyMode: mesh.material.transparencyMode,
              backFaceCulling: mesh.material.backFaceCulling,
              blended: Boolean(mesh.material.needAlphaBlendingForMesh(mesh)),
            })),
          };
        }, { engineUrl, ghostNames });
        expect(observation.inspection).toEqual(before.inspection);
        expect(immutableInventory(observation.inventory)).toEqual(immutableInventory(before.inventory));
        const bodyMeshes = observation.meshes.filter(mesh => mesh.body);
        expect(bodyMeshes).toHaveLength(38);
        expect(observation.meshes.some(mesh => mesh.name.startsWith("S5_CAN_"))).toBe(true);
        const mismatches = observation.meshes.filter(mesh => mesh.body
          ? mesh.alpha !== 1 || mesh.transparencyMode !== null || mesh.backFaceCulling !== true
            || mesh.visibility !== (ghost && mesh.selectedGhost ? 0.12 : 1)
            || mesh.blended !== (ghost && mesh.selectedGhost)
            || mesh.enabled !== (enabled && !(section && mesh.name.includes("_STBD_")))
          : mesh.visibility !== (ghost ? 0.08 : 1) || mesh.blended !== ghost);
        expect(mismatches, JSON.stringify({ palette, enabled, section, ghost, mismatches })).toEqual([]);
      }
    }
  }
  await page.evaluate(() => {
    window.__MT1!.setBodyConcept(true); window.__MT1!.setBodySection(false); window.__MT1!.presentation.setPalette("hush-basin");
  });
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
  expect(errors).toEqual([]);
});

test("reconciliation retains accepted FO1 station geometry and frame hierarchy", async ({}, testInfo) => {
  const accepted = await loadBodyFixture({ ref: "e56a4c09330119827e5a6c9757bf5cbc448dd29d", geometryOnly: true });
  const current = await loadBodyFixture({ geometryOnly: true });
  const points = mesh => {
    const values = mesh.getVerticesData("position");
    return Array.from({ length: values.length / 3 }, (_, i) => Array.from(values.slice(i * 3, i * 3 + 3)));
  };
  const within = (a, b) => Math.hypot(...a.map((v, i) => v - b[i])) <= 1e-6;
  const checked: string[] = [];
  try {
    for (const mesh of current.scene.meshes) {
      const original = accepted.scene.getMeshByName(mesh.name);
      expect(original, mesh.name).toBeTruthy();
      for (const term of ["diffuseColor", "emissiveColor", "specularColor"]) {
        expect(mesh.material[term].asArray(), `${mesh.name} ${term}`).toEqual(original.material[term].asArray());
      }
      expect(mesh.material.name, mesh.name).toBe(original.material.name);
      if (!/^BODY_(FWD|AFT)_/.test(mesh.name)) continue;
      const actual = points(mesh), prior = points(original);
      expect(actual.every(a => prior.some(b => within(a, b))), mesh.name).toBe(true);
      expect(prior.every(a => actual.some(b => within(a, b))), mesh.name).toBe(true);
      checked.push(mesh.name);
    }
    expect(checked).toHaveLength(20);
    const reportPath = testInfo.outputPath("fo1-station-preservation.json");
    writeFileSync(reportPath, JSON.stringify({ pass: true, authorityParticipation: "none", acceptedRef: accepted.sourceRef,
      comparedStations: checked, materialMeshes: current.scene.meshes.length,
      coordinateToleranceMeters: 1e-6, acceptedSources: accepted.sources, currentSources: current.sources }, null, 2), { flag: "wx" });
    await testInfo.attach("fo1-station-preservation", { path: reportPath, contentType: "application/json" });
  } finally { accepted.dispose(); current.dispose(); }

  const presented = await loadBodyFixture();
  const value = color => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  try {
    for (const palette of ["accepted", "hush-basin"]) {
      presented.palette.setPalette(palette);
      for (const hand of ["PORT", "STBD"]) for (const station of ["FWD", "AFT"]) {
        const face = presented.scene.getMeshByName(`BODY_${station}_FACE_${hand}_VIS`);
        const frame = presented.scene.getMeshByName(`BODY_${station}_LIP_FWD_${hand}_VIS`);
        const wall = presented.scene.getMeshByName(`BODY_CHINE_${station}_${hand}_VIS`);
        expect(value(face.material.diffuseColor), `${palette} ${face.name}`).toBeLessThan(value(frame.material.diffuseColor));
        expect(value(face.material.diffuseColor), `${palette} ${face.name}`).toBeLessThan(value(wall.material.diffuseColor));
      }
    }
  } finally { presented.dispose(); }
});
