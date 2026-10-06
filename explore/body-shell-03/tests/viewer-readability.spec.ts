import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
}

async function openPanel(page: Page, name: string): Promise<void> {
  const trigger = page.locator(`[data-panel="${name}"]`);
  if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#${name}Panel`)).toBeVisible();
}

async function pose(page: Page): Promise<number> {
  return page.evaluate(() => window.__MT1!.getMachineT());
}

async function renderFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function viewerModuleUrls(page: Page): Promise<{ engineUrl: string; vectorsUrl: string }> {
  // Resolve the actual served imports, including Vite's current cache query.
  // Resource timing has a bounded buffer and may omit these cached modules.
  const response = await page.request.get("/src/scene/createScene.ts");
  expect(response.ok()).toBe(true);
  const source = await response.text();
  const enginePath = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  const vectorsPath = source.match(/import\s*\{\s*Vector3\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  if (!enginePath || !vectorsPath) throw new Error("Current viewer engine imports were not found");
  return { engineUrl: new URL(enginePath, page.url()).href, vectorsUrl: new URL(vectorsPath, page.url()).href };
}

async function cameraObservation(page: Page) {
  // Observe the engine modules already loaded by the viewer. No additional
  // scene, mechanism, certificate or authority evaluator is constructed.
  return page.evaluate(async ({ engineUrl, vectorsUrl }) => {
    const { Engine } = await import(engineUrl);
    const { Matrix, Vector3 } = await import(vectorsUrl);
    const scene = Engine.LastCreatedScene;
    const camera = scene?.activeCamera;
    if (!camera || typeof camera.alpha !== "number") throw new Error("Expected the live inspection camera");
    const engine = scene.getEngine();
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    const names = new Set(window.__MT1!.getRenderInventory()
      .filter((row) => row.objectClass === "physical authority" || row.family === "body-shell-concept" || row.family === "h1-presentation")
      .map((row) => row.semanticName));
    const projected: Array<[number, number, number]> = [];
    for (const mesh of scene.meshes) {
      if (!names.has(mesh.name) || !mesh.isEnabled() || !mesh.isVisible || mesh.visibility <= 0 || mesh.getTotalVertices() === 0) continue;
      mesh.computeWorldMatrix(true);
      for (const point of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
        const value = Vector3.Project(point, Matrix.Identity(), scene.getTransformMatrix(), viewport);
        projected.push([value.x / viewport.width, value.y / viewport.height, value.z]);
      }
    }
    return { alpha: camera.alpha as number, beta: camera.beta as number, radius: camera.radius as number, projected };
  }, await viewerModuleUrls(page));
}

test("body surface refinement preserves the frozen mechanism, shared primitives and shaders", () => {
  const root = resolve(process.cwd(), "../..");
  // Keep the original mechanism freeze. Only the root build/deploy scripts
  // changed later, in accepted public-viewer deployment PR #7.
  const acceptedBaseline = "e56a4c09330119827e5a6c9757bf5cbc448dd29d";
  const deploymentBaseline = "bea126427c9d1758d0a4d5d488028d885d0000f9";
  const frozen = [
    "src",
    "tests",
    "package-lock.json",
    "playwright.config.ts",
    "explore/body-shell-03/src/design",
    "explore/body-shell-03/src/machine",
    "explore/body-shell-03/src/math",
    "explore/body-shell-03/src/verify",
    "explore/body-shell-03/src/scene/h1Presentation.ts",
    // BODY-SHELL-03.2 reopens only body geometry and body-only helpers. The
    // shared constructors used by the frozen mechanism remain byte-identical.
    "explore/body-shell-03/src/scene/primitives.ts",
    "explore/body-shell-03/src/scene/materials.ts",
  ];
  // The candidate's only exception is the exact additive presentation pose
  // path from a50a979. Pin the whole wrapper: merely finding its method name
  // in added lines would also admit unrelated authority changes. This test
  // records the candidate under review, not director approval to merge it.
  const posePath = "explore/body-shell-03/src/machine/createS5Machine.ts";
  const changed = execFileSync("git", ["diff", "--name-only", acceptedBaseline, "--", ...frozen], { cwd: root, encoding: "utf8" })
    .trim().split("\n").filter((name) => name && name !== posePath).join("\n");
  const added = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", ...frozen], { cwd: root, encoding: "utf8" }).trim();
  const poseDiff = execFileSync("git", ["diff", "-U0", acceptedBaseline, "--", posePath], { cwd: root, encoding: "utf8" }).split("\n");
  const removedLines = poseDiff.filter((line) => line.startsWith("-") && !line.startsWith("---"));
  expect(removedLines, "existing S5 machine lines must remain byte-identical").toEqual([]);
  const candidatePose = execFileSync("git", ["show", `a50a979d7d5d6dde299a8153e1097a28e09307fd:${posePath}`], { cwd: root, encoding: "utf8" });
  expect(readFileSync(resolve(root, posePath), "utf8"), "S5 wrapper differs from the exact presentation-pose candidate").toBe(candidatePose);
  expect(changed, `frozen tracked source differs from accepted ${acceptedBaseline}`).toBe("");
  expect(added, "new source was added inside a frozen subsystem").toBe("");
  const acceptedPackage = execFileSync("git", ["show", `${deploymentBaseline}:package.json`], { cwd: root, encoding: "utf8" });
  expect(readFileSync(resolve(root, "package.json"), "utf8"), "root build/deploy scripts differ from accepted deployment").toBe(acceptedPackage);
});

test("initial presentation and reversible palettes preserve inspection and render identity", async ({ page }) => {
  await ready(page);
  const initial = await page.evaluate(() => ({
    build: window.__MT1!.getBuildInfo(),
    inspection: window.__MT1!.getInspectionState(),
    presentation: window.__MT1!.presentation.getState(),
  }));
  expect(initial.build.candidateId).toBe("MT1-S5HR3R1");
  expect(initial.presentation.viewerId).toBe("QUARTO-VIEWER-01");
  expect(initial.presentation.palette).toBe("hush-basin");
  expect(initial.inspection.certificate.state).toBe("STALE");
  expect(initial.inspection.certificate.valid).toBe(false);

  const coldInventory = await page.evaluate(() => window.__MT1!.getRenderInventory());
  await page.locator("#paletteSelect").selectOption("accepted");
  await page.locator("#fitBtn").click();
  await page.locator("#paletteSelect").selectOption("hush-basin");
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(initial.inspection);
  expect(await page.evaluate(() => window.__MT1!.getRenderInventory())).toEqual(coldInventory);

  for (const amount of [0, 0.6, 1]) {
    await page.evaluate((value) => window.__MT1!.setMachineT(value), amount);
    const before = await page.evaluate(() => ({
      inspection: window.__MT1!.getInspectionState(),
      inventory: window.__MT1!.getRenderInventory(),
    }));
    for (const palette of ["accepted", "hush-basin", "accepted"] as const) {
      await page.locator("#paletteSelect").selectOption(palette);
      expect(await page.evaluate(() => window.__MT1!.presentation.getState().palette)).toBe(palette);
      expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
      expect(await page.evaluate(() => window.__MT1!.getRenderInventory())).toEqual(before.inventory);
    }
    // Programmatic canonical posing (window.__MT1.setMachineT) intentionally
    // runs the unchanged frozen path machinery. Palette changes preserve the
    // certificate that posing establishes.
    expect(before.inspection.certificate.state).toBe("CURRENT");
  }
});

test("responsive disclosures reserve a usable canvas and keep controls within the viewport", async ({ page }) => {
  await ready(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const viewport of [{ width: 1600, height: 900 }, { width: 1280, height: 720 }, { width: 700, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await renderFrame(page);
    const geometry = await page.evaluate(() => {
      const box = (selector: string) => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      };
      return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, canvas: box("#view"), header: box(".topbar"), controls: box(".control-deck") };
    });
    expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width);
    expect(geometry.canvas.width).toBeGreaterThanOrEqual(viewport.width - 2);
    expect(geometry.canvas.height).toBeGreaterThanOrEqual(viewport.height * 0.6);
    expect(geometry.canvas.top).toBeGreaterThanOrEqual(geometry.header.bottom - 2);
    expect(geometry.canvas.bottom).toBeLessThanOrEqual(geometry.controls.top + 2);
    expect(geometry.controls.bottom).toBeLessThanOrEqual(viewport.height + 2);
    await expect(page.locator("#machineSlider")).toBeVisible();
    await expect(page.locator("#machineSlider")).toHaveAccessibleName("Machine transformation");
    await expect(page.locator("#fitBtn")).toBeVisible();
    const targets = await page.locator('button:visible, select:visible, input[type="range"]:visible').evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.id || element.textContent, width: rect.width, height: rect.height };
    }));
    for (const target of targets) {
      expect(target.width, `${target.id} target width at ${viewport.width}px`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${target.id} target height at ${viewport.width}px`).toBeGreaterThanOrEqual(44);
    }
    await openPanel(page, "cameras");
    await openPanel(page, "inspection");
    await expect(page.locator("#camerasPanel")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const panel = await page.locator("#inspectionPanel").boundingBox();
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press("Escape");
    await expect(page.locator("#inspectionPanel")).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test("slider events commit their latest value and cannot overwrite a later explicit pose", async ({ page }) => {
  await ready(page);
  // Cold certificate generation belongs to the unchanged frozen mechanism.
  // Complete it before checking warm input coalescing and delivery latency.
  await page.evaluate(() => window.__MT1!.setMachineT(0));
  await page.locator("#machineSlider").evaluate((element) => {
    const slider = element as HTMLInputElement;
    for (const value of [0.11, 0.81, 0.337]) {
      slider.value = String(value);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await expect.poll(() => pose(page)).toBeCloseTo(0.337, 3);

  for (const [event, value] of [["change", 0.281], ["pointerup", 0.423], ["blur", 0.562]] as const) {
    const committed = await page.locator("#machineSlider").evaluate((element, input) => {
      const slider = element as HTMLInputElement;
      slider.value = String(input.value);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event(input.event, { bubbles: true }));
      return window.__MT1!.getMachineT();
    }, { event, value });
    expect(committed).toBeCloseTo(value, 3);
  }

  await page.locator("#machineSlider").evaluate((element) => {
    const slider = element as HTMLInputElement;
    slider.value = "0.83";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    window.__MT1!.setMachineT(0.17);
  });
  await renderFrame(page);
  expect(await pose(page)).toBeCloseTo(0.17, 3);
  expect(Number(await page.locator("#machineSlider").inputValue())).toBe(0.17);

  await page.locator("#machineSlider").evaluate((element) => {
    const slider = element as HTMLInputElement;
    slider.value = "0.79";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    window.__MT1!.presentation.setTourStep(0);
  });
  await renderFrame(page);
  expect(await pose(page)).toBe(0);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().tourStep)).toBe(0);
});

test("folio sliders remain explicit noncanonical previews", async ({ page }) => {
  await ready(page);
  await openPanel(page, "folios");
  for (const [selector, value, mode, label] of [
    ["#frontSlider", 0.341, "FRONT_PREVIEW", "FRONT PREVIEW"],
    ["#slider", 0.592, "REAR_PREVIEW", "REAR PREVIEW"],
  ] as const) {
    await page.locator(selector).evaluate((element, amount) => {
      const slider = element as HTMLInputElement;
      slider.value = String(amount);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    const state = await page.evaluate(() => ({
      inspection: window.__MT1!.getInspectionState(),
      front: window.__MT1!.getFrontT(), rear: window.__MT1!.getT(),
    }));
    expect(state.inspection.preview).toBe(true);
    expect(state.inspection.mode).toBe(mode);
    await expect(page.locator("#stateName")).toHaveText(label);
    await expect(page.locator("#stateValue")).toContainText(`MODE ${mode}`);
    expect(mode === "FRONT_PREVIEW" ? state.front : state.rear).toBe(value);
  }
});

test("public phase labels retain the deploy/locked distinction and point to Diagnostics", async ({ page }) => {
  await ready(page);
  for (const [pose, label] of [[0.87, "STRUCTURAL READY"], [0.94, "DRIVE DEPLOY"], [0.998, "DRIVE DEPLOY"], [1, "DRIVE"]] as const) {
    await page.evaluate((value) => window.__MT1!.presentation.setPose(value), pose);
    await expect(page.locator("#stateName")).toHaveText(label);
    const inspection = await page.evaluate(() => window.__MT1!.getInspectionState());
    expect(inspection.machineT).toBe(pose);
    expect(inspection.mode).toBe("MACHINE");
    expect(inspection.certificate.state).toBe("STALE");
  }
  await page.evaluate(() => window.__MT1!.presentation.setTourStep(5));
  await expect(page.locator("#tourDescription")).toContainText("readiness checks are under Diagnostics.");
});

test("keyboard range input stays local and global playback remains controllable", async ({ page }) => {
  await ready(page);
  const slider = page.locator("#machineSlider");
  await slider.focus();
  await page.keyboard.press("End");
  await expect.poll(() => pose(page)).toBe(1);
  await page.keyboard.press("Home");
  await expect.poll(() => pose(page)).toBe(0);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => pose(page)).toBeGreaterThan(0);
  const before = await pose(page);
  await page.keyboard.press("9");
  await renderFrame(page);
  expect(await pose(page)).toBe(before);

  await slider.evaluate((element) => (element as HTMLElement).blur());
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(true);
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
  await page.keyboard.press("1");
  await expect.poll(() => pose(page)).toBe(0);
});

test("tour visits six canonical poses and exits without resetting the inspected pose", async ({ page }) => {
  await ready(page);
  await expect(page.locator("#tourCard")).toBeHidden();
  await page.locator("#tourBtn").click();
  const tourCertificate = await page.evaluate(() => window.__MT1!.getInspectionState().certificate);
  await expect(page.locator("#tourCard")).toBeVisible();
  await expect(page.locator("#tourPrevBtn")).toBeDisabled();
  const stops = [0, 0.24, 0.6, 0.86, 0.94, 1];
  for (let step = 0; step < stops.length; step += 1) {
    expect(await pose(page)).toBe(stops[step]);
    expect(await page.evaluate(() => window.__MT1!.presentation.getState().tourStep)).toBe(step);
    await expect(page.locator("#tourTitle")).not.toHaveText("");
    await expect(page.locator("#tourDescription")).not.toHaveText("");
    expect(await page.evaluate(() => window.__MT1!.getInspectionState().certificate)).toEqual(tourCertificate);
    if (step < stops.length - 1) await page.locator("#tourNextBtn").click();
  }
  await expect(page.locator("#tourNextBtn")).toBeDisabled();
  await page.locator("#tourPrevBtn").click();
  expect(await pose(page)).toBe(0.94);
  await page.locator("#tourCloseBtn").click();
  await expect(page.locator("#tourCard")).toBeHidden();
  expect(await pose(page)).toBe(0.94);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().tourStep)).toBeNull();

  await page.evaluate(() => window.__MT1!.presentation.setTourStep(2));
  await openPanel(page, "cameras");
  await page.keyboard.press("Escape");
  await expect(page.locator("#camerasPanel")).toBeHidden();
  await expect(page.locator("#tourCard")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#tourCard")).toBeHidden();
  expect(await pose(page)).toBe(0.6);

  await page.evaluate(() => {
    window.__MT1!.presentation.setTourStep(1);
    window.__MT1!.setMachineT(0.45);
  });
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().tourStep)).toBeNull();
  expect(await pose(page)).toBe(0.45);

  for (const viewport of [{ width: 390, height: 844 }, { width: 700, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (let step = 0; step < stops.length; step += 1) {
      await page.evaluate((value) => window.__MT1!.presentation.setTourStep(value), step);
      await renderFrame(page);
      const canvas = await page.locator("#view").boundingBox();
      const card = await page.locator("#tourCard").boundingBox();
      expect(canvas!.height, `tour ${step} canvas height at ${viewport.width}px`).toBeGreaterThanOrEqual(300);
      const overlaps = card!.x < canvas!.x + canvas!.width && card!.x + card!.width > canvas!.x
        && card!.y < canvas!.y + canvas!.height && card!.y + card!.height > canvas!.y;
      expect(overlaps, `tour ${step} card covers canvas at ${viewport.width}px`).toBe(false);
    }
    const details = page.locator("#tourDetailsBtn");
    await details.click();
    await expect(details).toHaveAttribute("aria-expanded", "true");
    await renderFrame(page);
    const canvas = await page.locator("#view").boundingBox();
    const card = await page.locator("#tourCard").boundingBox();
    expect(canvas!.height).toBeGreaterThanOrEqual(300);
    expect(card!.y + card!.height).toBeLessThanOrEqual(canvas!.y);
    await details.click();
    await page.locator("#tourCloseBtn").click();
    await renderFrame(page);
    expect((await page.locator("#view").boundingBox())!.height).toBeGreaterThanOrEqual(viewport.height * 0.6);
  }
});

test("reverse playback reaches both endpoints and interruptions stop automatic motion", async ({ page }) => {
  await ready(page);
  // At the upper endpoint reverse must point inward, and a second reverse at
  // an interior pose lets the short forward run terminate at the exact end.
  await page.evaluate(() => window.__MT1!.setMachineT(1));
  const certificate = await page.evaluate(() => window.__MT1!.getInspectionState().certificate);
  await page.locator("#reverseBtn").click();
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().direction)).toBe(-1);
  await expect.poll(() => pose(page)).toBeLessThan(1);
  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.005);
    window.__MT1!.presentation.reverse();
    if (window.__MT1!.presentation.getState().direction !== -1) window.__MT1!.presentation.reverse();
  });
  await expect.poll(() => pose(page), { timeout: 10_000 }).toBe(0);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);

  await page.evaluate(() => {
    window.__MT1!.setMachineT(0.995);
    window.__MT1!.presentation.reverse();
    if (window.__MT1!.presentation.getState().direction !== 1) window.__MT1!.presentation.reverse();
  });
  await expect.poll(() => pose(page), { timeout: 10_000 }).toBe(1);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);

  await page.evaluate(() => {
    window.__MT1!.presentation.reverse();
    window.__MT1!.setMachineT(0.42);
  });
  await renderFrame(page);
  expect(await pose(page)).toBe(0.42);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
  expect((await page.evaluate(() => window.__MT1!.getInspectionState())).certificate).toEqual(certificate);
});

test("fit camera is presentation-only and keeps the inspected pose", async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__MT1!.setMachineT(0.6));
  const before = await page.evaluate(() => ({ inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory() }));
  await page.locator("#fitBtn").click();
  await renderFrame(page);
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
  expect(await page.evaluate(() => window.__MT1!.getRenderInventory())).toEqual(before.inventory);

  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const amount of [0, 0.24, 0.6, 1]) {
      await page.evaluate((value) => window.__MT1!.setMachineT(value), amount);
      for (const preset of ["body", "prop"]) {
        await page.evaluate((value) => window.__MT1!.setCamera(value), preset);
        await renderFrame(page);
        const closeup = await cameraObservation(page);
        await page.locator("#fitBtn").click();
        await renderFrame(page);
        const fitted = await cameraObservation(page);
        const extrema = [0, 1, 2].map((axis) => ({
          min: Math.min(...fitted.projected.map((point) => point[axis])),
          max: Math.max(...fitted.projected.map((point) => point[axis])),
        }));
        const details = JSON.stringify({ viewport, amount, preset, alpha: fitted.alpha, beta: fitted.beta, radius: fitted.radius, extrema });
        console.log(`FIT_BOUNDS ${details}`);
        expect(fitted.alpha, details).toBeCloseTo(closeup.alpha, 10);
        expect(fitted.beta, details).toBeCloseTo(closeup.beta, 10);
        expect(fitted.projected.length, details).toBeGreaterThan(100);
        expect(fitted.projected.every((point) => point.every(Number.isFinite)), details).toBe(true);
        // Min/max checks still cover every physical/H1/body bounding-box corner,
        // without constructing tens of thousands of individual test steps.
        for (const axis of [0, 1]) {
          expect(extrema[axis].min, details).toBeGreaterThanOrEqual(0);
          expect(extrema[axis].max, details).toBeLessThanOrEqual(1);
        }
        expect(extrema[2].min, details).toBeGreaterThan(0);
        expect(extrema[2].max, details).toBeLessThan(1);
        expect(await pose(page)).toBe(amount);
      }
    }
  }
});

test("inspect pick identifies the visible part after responsive canvas offsets", async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__MT1!.setBodyConcept(false));
  const modules = await viewerModuleUrls(page);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.locator("#fitBtn").click();
    await openPanel(page, "inspection");
    await page.locator("#inspectPickBtn").click();
    await expect(page.locator("#inspectCard")).toBeVisible();
    await renderFrame(page);
    const before = await page.evaluate(() => ({ inspection: window.__MT1!.getInspectionState(), inventory: window.__MT1!.getRenderInventory() }));
    const target = await page.evaluate(async ({ engineUrl, vectorsUrl }) => {
      const { Engine } = await import(engineUrl);
      const { Matrix, Vector3 } = await import(vectorsUrl);
      const scene = Engine.LastCreatedScene;
      const engine = scene.getEngine();
      const camera = scene.activeCamera;
      const canvas = document.querySelector<HTMLCanvasElement>("#view")!;
      const bounds = canvas.getBoundingClientRect();
      const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
      const centerClear = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2) === canvas;
      const inventory = window.__MT1!.getRenderInventory();
      for (const registeredOnly of [true, false]) {
        for (let index = 0; index < scene.meshes.length; index++) {
          const row = inventory[index];
          const mesh = scene.meshes[index];
          if (row.objectClass !== "physical authority" || (registeredOnly && !row.registrationId) || !row.enabled || !row.visible) continue;
          mesh.computeWorldMatrix(true);
          const projected = Vector3.Project(mesh.getBoundingInfo().boundingBox.centerWorld, Matrix.Identity(), scene.getTransformMatrix(), viewport);
          if (projected.z <= 0 || projected.z >= 1) continue;
          const localX = projected.x / viewport.width * canvas.clientWidth;
          const localY = projected.y / viewport.height * canvas.clientHeight;
          const x = bounds.left + localX / canvas.clientWidth * bounds.width;
          const y = bounds.top + localY / canvas.clientHeight * bounds.height;
          if (document.elementFromPoint(x, y) !== canvas) continue;
          const hit = scene.pick(localX, localY)?.pickedMesh;
          if (!hit) continue;
          const expected = inventory[scene.meshes.indexOf(hit)];
          if (expected.objectClass !== "physical authority" || (registeredOnly && !expected.registrationId)) continue;
          return { x, y, centerClear, expected };
        }
      }
      throw new Error("No unobstructed visible physical part could be picked");
    }, modules);
    expect(target.centerClear, "empty inspection card covers the canvas center").toBe(true);
    await page.mouse.click(target.x, target.y);
    await expect(page.locator("#inspectPanel")).toHaveAttribute("data-has-selection", "true");
    const fields = await page.locator("#inspectPanel .inspect-row").evaluateAll((rows) => Object.fromEntries(rows.map((row) => [row.querySelector("span")!.textContent, row.querySelector("b")!.textContent])));
    expect(fields.MESH).toBe(target.expected.displayName);
    expect(fields.SEMANTIC).toBe(target.expected.semanticName);
    expect(fields["REG ID"]).toBe(target.expected.registrationId ?? "—");
    expect(fields.CLASS).toBe("physical authority");
    expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before.inspection);
    expect(await page.evaluate(() => window.__MT1!.getRenderInventory())).toEqual(before.inventory);
    await page.locator("#inspectCloseBtn").click();
  }
});

test("interactive posing never runs the cold path certification", async ({ page }) => {
  await ready(page);
  const initial = await page.evaluate(() => window.__MT1!.getInspectionState());
  expect(initial.certificate.state).toBe("STALE");
  const elapsed = await page.locator("#machineSlider").evaluate((element) => {
    const slider = element as HTMLInputElement;
    const started = performance.now();
    slider.value = "0.62";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
    return performance.now() - started;
  });
  await expect.poll(() => pose(page)).toBeCloseTo(0.62, 3);
  // The certified path took ~30 s here on first touch; the pose path is milliseconds.
  expect(elapsed).toBeLessThan(1_000);
  for (const value of [0, 0.37, 0.86, 0.94, 1]) {
    await page.evaluate((v) => window.__MT1!.presentation.setPose(v), value);
    expect(await pose(page)).toBe(value);
  }
  await page.evaluate(() => window.__MT1!.presentation.setTourStep(4));
  await page.evaluate(() => window.__MT1!.presentation.setTourStep(null));
  await page.locator("#autoBtn").click();
  await renderFrame(page);
  await page.locator("#autoBtn").click();
  expect((await page.evaluate(() => window.__MT1!.getInspectionState())).certificate).toEqual(initial.certificate);
});

test("presentation pose path matches the certified canonical pose exactly", async ({ page }) => {
  test.setTimeout(300_000);
  await ready(page);
  for (const value of [0.3, 0.86, 0.94, 0.998, 1]) {
    await page.evaluate((v) => window.__MT1!.presentation.setPose(v), value);
    const fast = await page.evaluate(() => window.__MT1!.getRenderInventory());
    await page.evaluate((v) => window.__MT1!.setMachineT(v), value);
    const certified = await page.evaluate(() => window.__MT1!.getRenderInventory());
    expect(fast, `pose ${value}`).toEqual(certified);
  }
  expect((await page.evaluate(() => window.__MT1!.getInspectionState())).certificate.state).toBe("CURRENT");
});

test("opening diagnostics explains the one-time certification before running it", async ({ page }) => {
  test.setTimeout(300_000);
  await ready(page);
  await openPanel(page, "diagnostics");
  // The note only needs to paint before the main thread blocks, so record
  // every panel text the page produces rather than racing the sweep.
  await page.evaluate(() => {
    const seen: string[] = ((window as unknown as { __panelTexts: string[] }).__panelTexts = []);
    const panel = document.querySelector("#debugPanel")!;
    new MutationObserver(() => seen.push(panel.textContent ?? "")).observe(panel, { childList: true, subtree: true, characterData: true });
  });
  await page.locator("#debugBtn").click();
  await expect.poll(async () => (await page.evaluate(() => window.__MT1!.getInspectionState())).certificate.state, { timeout: 240_000 }).toBe("CURRENT");
  const texts = await page.evaluate(() => (window as unknown as { __panelTexts: string[] }).__panelTexts);
  const noteIndex = texts.findIndex((text) => text.includes("Certifying the stern capture path"));
  const dataIndex = texts.findIndex((text) => text.includes("driveThrustReady"));
  expect(noteIndex, "certification note was shown").toBeGreaterThanOrEqual(0);
  expect(dataIndex, "diagnostics rendered after the note").toBeGreaterThan(noteIndex);
  await expect(page.locator("#debugPanel")).not.toContainText("Certifying the stern capture path");
});

test("presentation lighting yields to flat lighting in study views", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto("/?lighting=studio");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await renderFrame(page);
  expect(await page.evaluate(() => window.__MT1!.presentation.getLighting())).toEqual({ tier: "studio", studyView: false, shadows: true, ambientOcclusion: true });
  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  for (const [on, off] of [["setSection", "setSection"], ["setLockStudyView", "setLockStudyView"], ["setPropSection", "setPropSection"]] as const) {
    await page.evaluate((name) => (window.__MT1 as unknown as Record<string, (v: boolean) => void>)[name](true), on);
    await renderFrame(page);
    expect(await page.evaluate(() => window.__MT1!.presentation.getLighting()), on).toMatchObject({ studyView: true, shadows: false, ambientOcclusion: false });
    await page.evaluate((name) => (window.__MT1 as unknown as Record<string, (v: boolean) => void>)[name](false), off);
    await renderFrame(page);
    expect(await page.evaluate(() => window.__MT1!.presentation.getLighting()), off).toMatchObject({ studyView: false, shadows: true, ambientOcclusion: true });
  }
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
  expect(errors).toEqual([]);
});
