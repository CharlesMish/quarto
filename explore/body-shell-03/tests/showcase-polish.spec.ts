import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { cameraModule, enableTwoTouch, gesture, readCamera, settleCamera } from "./helpers/cameraGestures";

/**
 * Showcase polish: page identity, the load-time showing, guided framing and
 * public copy. Presentation only; nothing here certifies or evaluates
 * authority. Public FIT composition is tested separately from the historical
 * input-gain references in camera-controls and zoom-response.
 */

async function ready(page: Page, search = ""): Promise<void> {
  await page.goto(`/${search}`);
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
}

async function renderFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => done())))));
}

/** Projected extents of every physical/H1/body corner, as viewport fractions. */
async function projectedExtents(page: Page) {
  const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  const vectorsPath = source.match(/import\s*\{\s*Vector3\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  if (!enginePath || !vectorsPath) throw new Error("Viewer engine imports were not found");
  await renderFrame(page);
  return page.evaluate(async ({ engineUrl, vectorsUrl }) => {
    const { Engine } = await import(engineUrl);
    const { Matrix, Vector3 } = await import(vectorsUrl);
    const scene = Engine.LastCreatedScene;
    const camera = scene.activeCamera;
    const engine = scene.getEngine();
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const names = new Set(window.__MT1!.getRenderInventory()
      .filter((row) => row.objectClass === "physical authority" || row.family === "body-shell-concept" || row.family === "h1-presentation")
      .map((row) => row.semanticName));
    let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
    for (const mesh of scene.meshes) {
      if (!names.has(mesh.name) || !mesh.isEnabled() || !mesh.isVisible || mesh.visibility <= 0 || mesh.getTotalVertices() === 0) continue;
      mesh.computeWorldMatrix(true);
      for (const point of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
        const value = Vector3.Project(point, Matrix.Identity(), scene.getTransformMatrix(), viewport);
        minX = Math.min(minX, value.x / viewport.width); maxX = Math.max(maxX, value.x / viewport.width);
        minY = Math.min(minY, value.y / viewport.height); maxY = Math.max(maxY, value.y / viewport.height);
      }
    }
    return { minX, maxX, minY, maxY, radius: camera.radius as number, alpha: camera.alpha as number, beta: camera.beta as number };
  }, { engineUrl: new URL(enginePath, page.url()).href, vectorsUrl: new URL(vectorsPath, page.url()).href });
}

test("page identity serves a title, description, link preview and icon", async ({ page }) => {
  await ready(page);
  await expect(page).toHaveTitle("Quarto / Mechanism viewer");
  const html = readFileSync("index.html", "utf8");
  expect(html).toContain("<title>Quarto / Mechanism viewer</title>");
  expect(html).not.toContain("Non-Authoritative Concept</title>");
  for (const property of ["og:title", "og:description", "og:image", "og:url"]) {
    await expect(page.locator(`meta[property="${property}"]`)).toHaveCount(1);
  }
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBe("https://quarto.cmish.dev/og-image.png");
  for (const asset of ["/og-image.png", "/favicon.svg"]) {
    const response = await page.request.get(asset);
    expect(response.ok(), asset).toBe(true);
  }
  await expect(page.locator("#view")).toHaveAttribute("aria-label", "Quarto transforming machine, interactive 3D view");
});

test("the load-time showing plays SPREAD → DRIVE → SPREAD once without certifying", async ({ page }) => {
  // Automated browsers skip the showing by default (see playback.spec); opt in.
  await ready(page, "?lighting=flat&intro=1");
  const certificate = await page.evaluate(() => window.__MT1!.getInspectionState().certificate);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().intro)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__MT1!.getMachineT()), { timeout: 60_000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__MT1!.presentation.getState().direction), { timeout: 30_000 }).toBe(-1);
  await expect.poll(() => page.evaluate(() => window.__MT1!.getMachineT()), { timeout: 60_000 }).toBe(0);
  const settled = await page.evaluate(() => ({ state: window.__MT1!.presentation.getState(), inspection: window.__MT1!.getInspectionState() }));
  expect(settled.state.intro).toBe(false);
  expect(settled.state.automatic).toBe(false);
  expect(settled.state.playback).toBe("show");
  expect(settled.inspection.mode).toBe("MACHINE");
  expect(settled.inspection.certificate).toEqual(certificate);
  // It does not come back on its own.
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
});

test("visitor input ends the showing, and intro=0 or automation keeps the paused start", async ({ page }) => {
  await ready(page, "?lighting=flat&intro=1");
  await expect.poll(() => page.evaluate(() => window.__MT1!.presentation.getState().automatic), { timeout: 20_000 }).toBe(true);
  await page.keyboard.press("Space");
  const paused = await page.evaluate(() => window.__MT1!.presentation.getState());
  expect(paused.automatic).toBe(false);
  expect(paused.intro).toBe(false);
  const held = await page.evaluate(() => window.__MT1!.getMachineT());
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__MT1!.getMachineT())).toBe(held);

  for (const search of ["?lighting=flat&intro=0", "?lighting=flat"]) {
    await ready(page, search);
    await page.waitForTimeout(2000);
    const state = await page.evaluate(() => ({ ...window.__MT1!.presentation.getState(), t: window.__MT1!.getMachineT() }));
    expect(state.intro, search).toBe(false);
    expect(state.automatic, search).toBe(false);
    expect(state.t, search).toBe(0);
  }
});

test("load and FIT share composed framing without changing orbit angles", async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await ready(page, "?lighting=flat");
    const composed = await projectedExtents(page);
    for (const value of [composed.minX, composed.minY]) expect(value, JSON.stringify({ viewport, composed })).toBeGreaterThanOrEqual(0.02);
    for (const value of [composed.maxX, composed.maxY]) expect(value, JSON.stringify({ viewport, composed })).toBeLessThanOrEqual(0.98);
    expect(Math.abs((composed.minX + composed.maxX) / 2 - 0.5), "composed horizontal centre").toBeLessThan(0.02);
    expect(Math.abs((composed.minY + composed.maxY) / 2 - 0.5), "composed vertical centre").toBeLessThan(0.02);

    await page.locator("#fitBtn").click();
    const fitted = await projectedExtents(page);
    expect(fitted.alpha).toBe(composed.alpha);
    expect(fitted.beta).toBe(composed.beta);
    expect(fitted.radius).toBeCloseTo(composed.radius, 5);
    expect(Math.abs((fitted.minX + fitted.maxX) / 2 - 0.5), "FIT horizontal centre").toBeLessThan(0.02);
    expect(Math.abs((fitted.minY + fitted.maxY) / 2 - 0.5), "FIT vertical centre").toBeLessThan(0.02);
  }
});

test("playback settling on DRIVE glides to that pose's framing; orbiting opts out", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "?lighting=flat");
  const spread = await projectedExtents(page);
  await page.evaluate(() => window.__MT1!.presentation.setPlayback("game"));
  await page.locator("#autoBtn").click();
  await expect.poll(() => page.evaluate(() => window.__MT1!.getMachineT()), { timeout: 30_000 }).toBe(1);
  await expect.poll(async () => (await projectedExtents(page)).radius, { timeout: 15_000 }).toBeLessThan(spread.radius * 0.9);
  const drive = await projectedExtents(page);
  expect(drive.minX).toBeGreaterThanOrEqual(0);
  expect(drive.maxX).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.__MT1!.getInspectionState().certificate.state)).toBe("STALE");

  // After a direct orbit the camera is the visitor's: no glide on return.
  const canvas = (await page.locator("#view").boundingBox())!;
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width / 2 + 30, canvas.y + canvas.height / 2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  const orbited = await projectedExtents(page);
  await page.locator("#autoBtn").click();
  await expect.poll(() => page.evaluate(() => window.__MT1!.getMachineT()), { timeout: 30_000 }).toBe(0);
  await page.waitForTimeout(1500);
  expect((await projectedExtents(page)).radius).toBeCloseTo(orbited.radius, 5);
});

test("public copy reads as progress and keeps provenance one click away", async ({ page }) => {
  await ready(page);
  await expect(page.locator("#stateValue")).toHaveText("SPREAD → DRIVE · 0%");
  await expect(page.locator("#stateValue")).toHaveAttribute("title", "Machine 0.000 · mode MACHINE");
  await page.evaluate(() => window.__MT1!.presentation.setPose(0.6));
  await expect(page.locator("#stateValue")).toHaveText("SPREAD → DRIVE · 60%");

  await page.locator('[data-panel="details"]').click();
  const provenance = page.locator(".provenance-details");
  await expect(provenance).toBeVisible();
  await expect(provenance).not.toHaveAttribute("open");
  await expect(page.locator(".eyebrow")).toBeHidden();
  await expect(page.locator("#detailsPanel")).not.toContainText("H1 remains", { useInnerText: true });
  await provenance.locator("summary").click();
  await expect(page.locator(".eyebrow")).toBeVisible();
  await expect(page.locator(".provenance")).toContainText("MT1-S5HR3R1");
  await expect(page.locator("#foliosPanel")).not.toContainText("legacy/source");
});

interface FramingSample {
  t: number; direction: number; minX: number; maxX: number; minY: number; maxY: number; radius: number;
  at: number; automatic: boolean; width: number; height: number; clientWidth: number; clientHeight: number;
}

/** Observe every rendered frame, not only endpoints or conservative timed polls. */
async function startFramingTrace(page: Page) {
  const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  const path = source.match(/import\s*\{\s*Vector3\s*\}\s*from\s*["']([^"']+)["']/)![1];
  await page.evaluate(async ({ engineUrl, vectorsUrl }) => {
    const { Engine } = await import(engineUrl);
    const { Matrix, Vector3 } = await import(vectorsUrl);
    const scene = Engine.LastCreatedScene, engine = scene.getEngine(), camera = scene.activeCamera;
    const names = new Set(window.__MT1!.getRenderInventory()
      .filter(row => row.objectClass === "physical authority" || row.family === "body-shell-concept" || row.family === "h1-presentation")
      .map(row => row.semanticName));
    const meshes = scene.meshes.filter((m: { name: string }) => names.has(m.name));
    const samples: FramingSample[] = [];
    (window as any).__compositionScene = scene;
    (window as any).__compositionSamples = samples;
    scene.onAfterRenderObservable.add(() => {
      const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const mesh of meshes) {
        if (!mesh.isEnabled() || !mesh.isVisible || mesh.visibility <= 0 || mesh.getTotalVertices() === 0) continue;
        for (const point of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
          const value = Vector3.Project(point, Matrix.Identity(), scene.getTransformMatrix(), viewport);
          minX = Math.min(minX, value.x / viewport.width); maxX = Math.max(maxX, value.x / viewport.width);
          minY = Math.min(minY, value.y / viewport.height); maxY = Math.max(maxY, value.y / viewport.height);
        }
      }
      samples.push({ t: window.__MT1!.getMachineT(), direction: window.__MT1!.presentation.getState().direction,
        minX, maxX, minY, maxY, radius: camera.radius, at: performance.now(),
        automatic: window.__MT1!.presentation.getState().automatic,
        width: engine.getRenderWidth(), height: engine.getRenderHeight(),
        clientWidth: engine.getRenderingCanvas().clientWidth, clientHeight: engine.getRenderingCanvas().clientHeight });
    });
  }, { engineUrl: await cameraModule(page), vectorsUrl: new URL(path, page.url()).href });
}

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 }, { width: 568, height: 320 },
  { width: 768, height: 1024 }, { width: 799, height: 600 }, { width: 801, height: 600 },
  { width: 844, height: 390 }, { width: 1280, height: 720 },
]) {
  test(`intro, reverse and scrub stay in the canvas at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await ready(page, "?intro=1&lighting=flat");
    await startFramingTrace(page);
    await page.waitForFunction(() => window.__MT1!.presentation.getState().direction === -1);
    await page.waitForFunction(() => !window.__MT1!.presentation.getState().intro && window.__MT1!.getMachineT() === 0);
    await page.waitForTimeout(1100);
    await page.locator("#machineSlider").press("End");
    await page.waitForTimeout(1100); // settle tight DRIVE framing before ordinary reverse
    await page.locator("#autoBtn").click();
    await page.waitForFunction(() => window.__MT1!.getMachineT() === 0);
    await page.waitForTimeout(1100);
    await page.locator("#machineSlider").press("End");
    await page.waitForTimeout(1100);
    for (const t of [0.6, 0.4, 0.12, 0.02, 0]) {
      await page.locator("#machineSlider").fill(String(t));
      await renderFrame(page);
    }
    const samples = await page.evaluate(() => (window as any).__compositionSamples as Array<{
      t: number; direction: number; minX: number; maxX: number; minY: number; maxY: number; radius: number;
    }>);
    await info.attach("intermediate-extents", { body: JSON.stringify({ viewport, samples }), contentType: "application/json" });
    for (const direction of [1, -1]) {
      const intermediate = samples.filter(s => s.direction === direction && s.t > 0.02 && s.t < 0.98);
      expect(intermediate.length, `rendered ${direction} intermediate frames`).toBeGreaterThan(10);
      expect(intermediate.some(s => s.t > 0.05 && s.t < 0.2), "sample the previously clipped region").toBe(true);
    }
    expect(samples.filter(s => s.minX < -0.001 || s.maxX > 1.001 || s.minY < -0.001 || s.maxY > 1.001).slice(0, 5),
      "every rendered physical/H1/body corner must fit, including glides").toEqual([]);
    expect(await page.evaluate(() => window.__MT1!.getInspectionState().certificate.state)).toBe("STALE");
  });
}

/** Wait on scene renders so resize probes include the first frame at each orientation. */
async function renderedFrames(page: Page, count: number): Promise<void> {
  await page.evaluate(count => new Promise<void>(resolve => {
    const scene = (window as any).__compositionScene;
    let rendered = 0;
    const observer = scene.onAfterRenderObservable.add(() => {
      if (++rendered >= count) { scene.onAfterRenderObservable.remove(observer); resolve(); }
    });
  }), count);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
  test(`interrupted DRIVE glide stays framed after PLAY or REVERSE and PAUSE at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    for (const startButton of ["autoBtn", "reverseBtn"]) {
      await ready(page, "?intro=0&lighting=flat");
      await startFramingTrace(page);
      await page.locator("#speedSelect").selectOption("game");
      await page.locator("#machineSlider").press("End");
      // Exercise the ordinary button handlers without actionability waits that
      // would let the 0.9-second endpoint glide finish before the command.
      const pausedAt = await page.evaluate(startButton => new Promise<number>(resolve => {
        const scene = (window as any).__compositionScene;
        document.getElementById(startButton)!.click();
        const observer = scene.onAfterRenderObservable.add(() => {
          const t = window.__MT1!.getMachineT();
          if (t > 0 && t < 0.2) {
            document.getElementById("autoBtn")!.click();
            scene.onAfterRenderObservable.remove(observer);
            resolve(t);
          }
        });
      }), startButton);
      await page.waitForTimeout(1200); // includes the obsolete glide's terminal frame and rest
      await renderedFrames(page, 6);
      const samples = await page.evaluate(() => (window as any).__compositionSamples as FramingSample[]);
      await info.attach(`${startButton}-interrupted-glide`, { body: JSON.stringify({ viewport, pausedAt, samples }), contentType: "application/json" });
      expect(pausedAt).toBeGreaterThan(0);
      expect(pausedAt).toBeLessThan(0.2);
      expect(samples.filter(s => s.minX < -0.001 || s.maxX > 1.001 || s.minY < -0.001 || s.maxY > 1.001).slice(0, 5),
        "all frames, including a paused obsolete glide's terminal frame, stay inside the canvas").toEqual([]);
      expect(samples.slice(-6).every(s => s.t === pausedAt && !s.automatic)).toBe(true);
      expect(await page.evaluate(() => window.__MT1!.getInspectionState().certificate.state)).toBe("STALE");
    }
  });
}

for (const moving of [false, true]) {
  test(`orientation transitions stay framed ${moving ? "during reverse" : "at rest"}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page, "?intro=0&lighting=flat");
    await startFramingTrace(page);
    await page.locator("#machineSlider").press("End");
    await page.waitForTimeout(1100);
    if (moving) {
      await page.locator("#speedSelect").selectOption("inspect");
      await page.locator("#autoBtn").click();
    }
    await page.evaluate(() => { (window as any).__compositionSamples.length = 0; });
    for (let i = 0; i < 12; i++) {
      await page.setViewportSize(i % 2 ? { width: 390, height: 844 } : { width: 844, height: 390 });
      await renderedFrames(page, 6);
    }
    const samples = await page.evaluate(() => (window as any).__compositionSamples as FramingSample[]);
    await info.attach("orientation-transitions", { body: JSON.stringify({ moving, rotations: 12, samples }), contentType: "application/json" });
    expect(samples.length).toBeGreaterThanOrEqual(72);
    expect(new Set(samples.map(s => s.width)).size).toBe(2);
    if (moving) expect(samples.filter(s => s.automatic && s.t > 0 && s.t < 1).length).toBeGreaterThan(10);
    expect(samples.filter(s => s.minX < -0.001 || s.maxX > 1.001 || s.minY < -0.001 || s.maxY > 1.001).slice(0, 5),
      "every rendered frame uses a coherent projection, including resize boundaries").toEqual([]);
    expect(await page.evaluate(() => window.__MT1!.getInspectionState().certificate.state)).toBe("STALE");
  });
}

for (const stage of ["wait", "forward", "hold", "back"] as const) {
  test(`input pauses intro motion during ${stage} without consuming the gesture`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage(); await enableTwoTouch(page);
    for (const input of ["mouse", "wheel", "touch-orbit", "touch-pan", "touch-pinch", "key"] as const) {
      await page.goto(`${baseURL}/?intro=1&lighting=flat`);
      await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
      if (stage !== "wait") await page.waitForFunction(stage => {
        const s = window.__MT1!.presentation.getState(), t = window.__MT1!.getMachineT();
        return stage === "forward" ? s.direction === 1 && t > 0.15 && t < 0.9
          : stage === "hold" ? t === 1 && s.intro && !s.automatic
          : s.direction === -1 && t > 0.15 && t < 0.9;
      }, stage);
      const engineUrl = await cameraModule(page), before = await readCamera(page, engineUrl);
      expect(before.presentation.intro, `exercise intro ${stage}`).toBe(true);
      if (stage === "wait" || stage === "hold") expect(before.inspection.machineT).toBe(stage === "wait" ? 0 : 1);
      else expect(before.presentation).toMatchObject({ automatic: true, direction: stage === "forward" ? 1 : -1 });
      if (input === "mouse") await gesture(page, "orbit-x", false);
      else if (input === "wheel") await gesture(page, "zoom", false);
      else if (input === "touch-orbit") await gesture(page, "orbit-x", true);
      else if (input === "touch-pan") await gesture(page, "pan-x", true);
      else if (input === "touch-pinch") await gesture(page, "zoom", true);
      else await page.keyboard.press("b"); // stop intro AND toggle BODY
      const paused = await page.evaluate(() => ({ state: window.__MT1!.presentation.getState(), t: window.__MT1!.getMachineT() }));
      expect(paused.state.intro, input).toBe(false); expect(paused.state.automatic, input).toBe(false);
      await settleCamera(page, engineUrl); await page.waitForTimeout(1500);
      expect(await page.evaluate(() => window.__MT1!.getMachineT()), input).toBe(paused.t);
      const after = await readCamera(page, engineUrl);
      if (input === "wheel" || input === "touch-pinch") expect(Math.abs(after.radius - before.radius), input).toBeGreaterThan(0.01);
      if (input === "touch-orbit" || input === "mouse") expect(Math.abs(after.alpha - before.alpha), input).toBeGreaterThan(0.01);
      if (input === "touch-pan") expect(Math.hypot(...after.target.map((v, i) => v - before.target[i])), input).toBeGreaterThan(0.01);
      if (input === "key") expect(await page.evaluate(() => window.__MT1!.getBodyConceptState().enabled)).toBe(false);
      expect(after.inspection.certificate.state).toBe("STALE");
    }
    await context.close();
  });
}

test("intro takeover preserves PAUSE, PLAY, reverse, FIT and slider command intent", async ({ page }) => {
  for (const command of ["pause-click", "pause-space", "held-space", "accessible-click", "reverse", "fit", "slider"] as const) {
    await ready(page, "?intro=1&lighting=flat");
    await page.waitForFunction(() => window.__MT1!.getMachineT() > 0.2 && window.__MT1!.getMachineT() < 0.8);
    if (command === "pause-click") {
      const box = (await page.locator("#autoBtn").boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
      expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
      await page.mouse.up(); // must not restart the now-paused intro
    } else if (command === "pause-space") await page.keyboard.press("Space");
    else if (command === "held-space") {
      await page.locator("#autoBtn").focus();
      await page.keyboard.down("Space");
      expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
      await page.keyboard.down("Space"); // repeated keydown before native click on keyup
      await page.keyboard.up("Space");
    } else if (command === "accessible-click") await page.locator("#autoBtn").evaluate((button: HTMLButtonElement) => button.click());
    else if (command === "reverse") await page.locator("#reverseBtn").click();
    else if (command === "fit") await page.locator("#fitBtn").click();
    else {
      await page.locator("#machineSlider").press("Home");
      expect(await page.evaluate(() => window.__MT1!.getMachineT())).toBe(0);
    }
    const state = await page.evaluate(() => window.__MT1!.presentation.getState());
    expect(state.intro).toBe(false); expect(state.automatic).toBe(command === "reverse");
    if (command === "reverse") expect(state.direction).toBe(-1);
    else {
      const t = await page.evaluate(() => window.__MT1!.getMachineT()); await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__MT1!.getMachineT())).toBe(t);
      await page.locator("#autoBtn").click();
      expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(true);
    }
  }
  await ready(page, "?intro=1&lighting=flat");
  expect(await page.evaluate(() => window.__MT1!.getMachineT()), "PLAY test reaches the initial wait").toBe(0);
  // The deck is already measurable; avoid spending the short intro wait on
  // Playwright's two-frame actionability wait on a software renderer.
  await page.locator("#autoBtn").click({ force: true });
  expect(await page.evaluate(() => window.__MT1!.presentation.getState())).toMatchObject({ intro: false, automatic: true });
});

for (const tier of ["flat", "lite", "studio"] as const) {
  test(`showcase appearance is limited to normal Hush views in ${tier}`, async ({ page }) => {
    await ready(page, `?intro=0&lighting=${tier}`); const engineUrl = await cameraModule(page);
    const read = () => page.evaluate(async url => {
      const { Engine } = await import(url); const scene = Engine.LastCreatedScene;
      const material = (name: string) => {
        const m = scene.materials.find((m: { name: string }) => m.name === name || m.name.endsWith(`_${name}`));
        return { diffuse: m.diffuseColor.asArray(), emissive: m.emissiveColor.asArray(), specular: m.specularColor.asArray() };
      };
      return { joint: material("joint"), rail: material("rail"), folio: material("folio"), accepted: material("matMech"),
        lighting: window.__MT1!.presentation.getLighting(),
        hemi: scene.getLightByName("hemi").intensity, sun: scene.getLightByName("sun").intensity };
    }, engineUrl);
    const baseline = { joint: [0.162, 0.2916, 0.324], rail: [0.1976, 0.4464, 0.454], folio: [0.1548, 0.6192, 0.5848] };
    let accepted: Awaited<ReturnType<typeof read>>["accepted"] | undefined;
    for (const palette of ["hush-basin", "accepted", "hush-basin"] as const) for (const study of [false, true, false]) {
      await page.evaluate(({ palette, study }) => {
        window.__MT1!.presentation.setPalette(palette); window.__MT1!.setBodySection(study);
      }, { palette, study });
      await renderFrame(page); const s = await read();
      expect(s.lighting.studyView).toBe(tier !== "flat" && study);
      const polished = tier !== "flat" && !study && palette === "hush-basin";
      expect(s.hemi).toBeCloseTo(polished ? 0.4675 : 0.55, 8); expect(s.sun).toBeCloseTo(polished ? 0.8625 : 0.75, 8);
      const expected = polished ? { joint: [0.213, 0.3834, 0.426], rail: baseline.rail.map(x => x * 1.3), folio: [0.1404, 0.5616, 0.5304] } : baseline;
      for (const role of ["joint", "rail", "folio"] as const) {
        s[role].diffuse.forEach((v: number, i: number) => expect(v, `${palette}/${study}/${role}`).toBeCloseTo(expected[role][i], 8));
        s[role].specular.forEach((v: number, i: number) => expect(v).toBeCloseTo(expected[role][i] * (role === "folio" ? 0.12 : 0.3), 8));
      }
      s.folio.emissive.forEach((v: number, i: number) => expect(v).toBeCloseTo((polished ? [0.001904, 0.01088, 0.009792] : [0.002856, 0.01632, 0.014688])[i], 8));
      accepted ??= s.accepted; expect(s.accepted, "accepted material never mutates").toEqual(accepted);
    }
  });
}
