import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Explicit evidence writer, excluded from the supported non-writing suite. */
test("capture rear-frame attachment and startup review @evidence-writer", async ({ page }) => {
  const phase = process.env.ATTACHMENT_PHASE === "before" ? "before" : "after";
  const dir = `evidence/attachment-startup-01/${phase}`;
  mkdirSync(dir, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const initial = await page.evaluate(() => ({ build: window.__MT1!.getBuildInfo(),
    inspection: window.__MT1!.getInspectionState(), presentation: window.__MT1!.presentation.getState() }));
  const source = await (await page.request.get("/src/scene/createScene.ts")).text();
  const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  expect(enginePath).toBeTruthy();
  const engineUrl = new URL(enginePath!, page.url()).href;
  const frame = () => page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  const capture = async (name: string) => { await frame(); await page.screenshot({ path: `${dir}/${name}.png` }); };
  await capture("desktop-startup");
  const geometry = await page.evaluate(async engineUrl => {
    const { Engine } = await import(engineUrl);
    const scene = Engine.LastCreatedScene;
    return scene.meshes.filter(mesh => /CHANNEL_FRAME|BODY_CHINE_AFT|BODY_REAR_FRAME/.test(mesh.name)).map(mesh => {
      mesh.computeWorldMatrix(true);
      const bounds = mesh.getBoundingInfo().boundingBox;
      return { name: mesh.name, min: bounds.minimumWorld.asArray(), max: bounds.maximumWorld.asArray(), metadata: mesh.metadata };
    });
  }, engineUrl);
  for (const t of [0, 0.6, 1]) {
    await page.evaluate(async ({ engineUrl, t }) => {
      window.__MT1!.presentation.setPose(t);
      const { Engine } = await import(engineUrl);
      const camera = Engine.LastCreatedScene.activeCamera;
      camera.alpha = -0.45; camera.beta = 1.22; camera.radius = 5.8;
      camera.target.set(0.55, 1.75, -4.3);
    }, { engineUrl, t });
    await capture(`rear-${String(t).replace(".", "p")}`);
  }
  await page.evaluate(() => { window.__MT1!.presentation.setPose(1); window.__MT1!.setCamera("driveBody"); window.__MT1!.presentation.fitCamera(); });
  await capture("desktop-drive");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  await capture("mobile-startup");
  await page.evaluate(() => { window.__MT1!.presentation.setPose(1); window.__MT1!.presentation.fitCamera(); });
  await capture("mobile-drive");
  expect(errors).toEqual([]);
  writeFileSync(`${dir}/observations.json`, `${JSON.stringify({ initial, geometry, errors }, null, 2)}\n`);
});

test("record live viewer provenance without certification @evidence-writer", async ({ page }) => {
  const dir = "evidence/attachment-startup-01/live";
  mkdirSync(dir, { recursive: true });
  await page.goto("https://quarto.cmish.dev/");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const observation = await page.evaluate(() => ({ build: window.__MT1!.getBuildInfo(),
    inspection: window.__MT1!.getInspectionState(), presentation: window.__MT1!.presentation.getState(),
    scripts: Array.from(document.scripts, script => script.src).filter(Boolean) }));
  expect(observation.inspection.certificate.state).toBe("STALE");
  expect(observation.presentation.playback).toBe("inspect");
  await page.screenshot({ path: `${dir}/startup.png` });
  writeFileSync(`${dir}/provenance.json`, `${JSON.stringify(observation, null, 2)}\n`);
});

test("production playback and responsive smoke @evidence-writer", async ({ page }) => {
  test.setTimeout(180_000);
  const dir = `evidence/attachment-startup-01/${process.env.SMOKE_SOURCE === "ci-preview" ? "ci-preview" : "production"}`;
  mkdirSync(dir, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const observations = [];
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
    await expect(page.locator("#speedSelect")).toHaveValue("show");
    for (const profile of ["inspect", "show", "game"]) {
      await page.locator("#speedSelect").selectOption(profile);
      for (const target of [1, 0]) {
        await page.locator("#autoBtn").click();
        await page.waitForFunction(target => window.__MT1!.getMachineT() === target
          && !window.__MT1!.presentation.getState().automatic, target, { timeout: 60_000 });
        const inspection = await page.evaluate(() => window.__MT1!.getInspectionState());
        expect(inspection.certificate.state).toBe("STALE");
        expect(inspection.mode).toBe("MACHINE");
        observations.push({ viewport, profile, target, inspection });
      }
    }
    await page.evaluate(() => { window.__MT1!.presentation.setPose(1); window.__MT1!.presentation.setPlayback("show"); window.__MT1!.presentation.fitCamera(); });
    await page.screenshot({ path: `${dir}/drive-${viewport.width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
  expect(errors).toEqual([]);
  writeFileSync(`${dir}/smoke.json`, `${JSON.stringify({ url: page.url(), observations, errors }, null, 2)}\n`);
});
