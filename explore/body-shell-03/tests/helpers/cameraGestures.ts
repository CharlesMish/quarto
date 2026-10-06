import type { Page } from "@playwright/test";

export type Gesture = "pan-x" | "pan-y" | "orbit-x" | "orbit-y" | "zoom";
export type Profile = "inspect" | "show" | "game";

// Playwright's hasTouch defaults maxTouchPoints to one. Babylon sizes its
// touch slots at startup, so enable two contacts before loading the app.
export async function enableTwoTouch(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
  // Keep this session attached until the test context closes; detaching clears
  // its emulation override and reverts Chromium to a single touch contact.
}

export async function cameraModule(page: Page): Promise<string> {
  const response = await page.request.get("/src/scene/createScene.ts");
  const source = await response.text();
  const path = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)?.[1];
  if (!path) throw new Error("Live viewer engine import was not found");
  return new URL(path, page.url()).href;
}

export async function readCamera(page: Page, engineUrl: string) {
  return page.evaluate(async (url) => {
    const { Engine } = await import(url);
    const scene = Engine.LastCreatedScene;
    const camera = scene.activeCamera;
    return {
      alpha: camera.alpha as number, beta: camera.beta as number, radius: camera.radius as number,
      target: camera.target.asArray() as number[],
      panningSensibility: camera.panningSensibility as number,
      angularSensibilityX: camera.angularSensibilityX as number,
      angularSensibilityY: camera.angularSensibilityY as number,
      inertia: camera.inertia as number, panningInertia: camera.panningInertia as number,
      wheelPrecision: camera.wheelPrecision as number, pinchPrecision: camera.pinchPrecision as number,
      pinchDeltaPercentage: camera.pinchDeltaPercentage as number,
      useNaturalPinchZoom: camera.useNaturalPinchZoom as boolean,
      renderer: scene.getEngine().getGlInfo().renderer as string,
      lighting: window.__MT1!.presentation.getLighting(),
      maxTouchPoints: navigator.maxTouchPoints,
      residual: {
        alpha: camera.inertialAlphaOffset as number, beta: camera.inertialBetaOffset as number,
        radius: camera.inertialRadiusOffset as number,
        panX: camera.inertialPanningX as number, panY: camera.inertialPanningY as number,
      },
      inspection: window.__MT1!.getInspectionState(),
      presentation: window.__MT1!.presentation.getState(),
    };
  }, engineUrl);
}

/** Wait for camera inertia, not a fixed wall-clock delay. Does not pose/certify. */
export async function settleCamera(page: Page, engineUrl: string): Promise<void> {
  await page.evaluate(async (url) => {
    const { Engine } = await import(url);
    const camera = Engine.LastCreatedScene.activeCamera;
    await new Promise<void>((resolve, reject) => {
      let frames = 0;
      const step = () => {
        const offsets = [camera.inertialAlphaOffset, camera.inertialBetaOffset,
          camera.inertialRadiusOffset, camera.inertialPanningX, camera.inertialPanningY];
        if (++frames > 2 && offsets.every((value) => value === 0)) resolve();
        else if (frames > 240) reject(new Error("Camera inertia did not settle"));
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, engineUrl);
}

export async function resetGesture(page: Page, engineUrl: string, profile: Profile): Promise<void> {
  await page.evaluate((value) => {
    const api = window.__MT1!;
    api.presentation.setPose(0);
    api.setCamera("body");
    api.presentation.fitCamera();
    api.presentation.setPlayback(value);
  }, profile);
  await settleCamera(page, engineUrl);
}

/** Browser input events: mouse drag, or Chromium's touch emulation (not a phone). */
export async function gesture(page: Page, kind: Gesture, touch: boolean, framesPerStep = 1): Promise<void> {
  const bounds = await page.locator("#view").boundingBox();
  if (!bounds) throw new Error("Missing canvas bounds");
  const x = Math.round(bounds.x + bounds.width / 2);
  const y = Math.round(bounds.y + bounds.height / 2);
  const pan = kind.startsWith("pan");
  const dx = kind.endsWith("x") ? (pan ? 24 : 48) : 0;
  const dy = kind.endsWith("y") ? 24 : 0;
  const frame = async () => {
    for (let i = 0; i < framesPerStep; i++) {
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    }
  };
  if (!touch) {
    await page.mouse.move(x, y);
    if (kind === "zoom") { await page.mouse.wheel(0, 80); return; }
    const button = pan ? "right" : "left";
    await page.mouse.down({ button });
    for (let i = 1; i <= 12; i++) { await page.mouse.move(x + dx * i / 12, y + dy * i / 12); await frame(); }
    await page.mouse.up({ button });
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const points = (i: number) => {
    if (kind === "zoom") return [{ x: x - 40 - i, y, id: 0 }, { x: x + 40 + i, y, id: 1 }];
    // Place the contact pair perpendicular to the translation. Chromium emits
    // the two pointer moves sequentially; an along-axis pair can temporarily
    // stretch enough to inject a pinch before the second contact catches up.
    if (kind === "pan-x") return [{ x: x + dx * i / 12, y: y - 40, id: 0 },
      { x: x + dx * i / 12, y: y + 40, id: 1 }];
    if (kind === "pan-y") return [{ x: x - 40, y: y + dy * i / 12, id: 0 },
      { x: x + 40, y: y + dy * i / 12, id: 1 }];
    return [{ x: x + dx * i / 12, y: y + dy * i / 12, id: 0 }];
  };
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(0) });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(i) });
      await frame();
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
}

export function cameraDelta(before: Awaited<ReturnType<typeof readCamera>>, after: Awaited<ReturnType<typeof readCamera>>) {
  return { alpha: after.alpha - before.alpha, beta: after.beta - before.beta,
    radius: after.radius - before.radius,
    targetDistance: Math.hypot(...after.target.map((value, i) => value - before.target[i])),
    target: after.target.map((value, i) => value - before.target[i]),
  };
}
