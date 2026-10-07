import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Showcase polish: page identity, the load-time showing, guided framing and
 * public copy. Presentation only; nothing here certifies or evaluates
 * authority, and the existing FIT and camera-response baselines stay pinned
 * by camera-controls and zoom-response.
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

test("guided framing centres the machine and fills more of the canvas than FIT", async ({ page }) => {
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
    expect(fitted.radius).toBeGreaterThanOrEqual(composed.radius);
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
