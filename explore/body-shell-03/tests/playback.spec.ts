import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
}

/** Record machineT once per rendered frame until automatic playback stops. */
async function recordPlayback(page: Page, start: () => void | Promise<void>) {
  await page.evaluate(() => {
    const log: Array<{ at: number; t: number; automatic: boolean }> = [];
    (window as unknown as { __playbackLog: typeof log }).__playbackLog = log;
    let started = false;
    const tick = (at: number): void => {
      const state = window.__MT1!.presentation.getState();
      started ||= state.automatic;
      if (started) log.push({ at, t: window.__MT1!.getMachineT(), automatic: state.automatic });
      if (!started || state.automatic) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await start();
  await page.waitForFunction(() => {
    const log = (window as unknown as { __playbackLog: Array<{ automatic: boolean }> }).__playbackLog;
    return log.length > 1 && !log[log.length - 1]!.automatic;
  }, undefined, { timeout: 60_000 });
  return page.evaluate(() => (window as unknown as { __playbackLog: Array<{ at: number; t: number; automatic: boolean }> }).__playbackLog);
}

test("speed select and hook choose the playback profile without touching pose or certificate", async ({ page }) => {
  await ready(page);
  const before = await page.evaluate(() => window.__MT1!.getInspectionState());
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().playback)).toBe("inspect");
  await expect(page.locator("#speedSelect")).toHaveAccessibleName("Playback speed");
  await page.locator("#speedSelect").selectOption("show");
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().playback)).toBe("show");
  await page.evaluate(() => window.__MT1!.presentation.setPlayback("game"));
  await expect(page.locator("#speedSelect")).toHaveValue("game");
  expect(await page.evaluate(() => {
    try { window.__MT1!.presentation.setPlayback("warp" as never); return "accepted"; } catch (error) { return (error as Error).name; }
  })).toBe("RangeError");
  expect(await page.evaluate(() => window.__MT1!.getInspectionState())).toEqual(before);
});

test("game-speed playback reaches DRIVE and returns to SPREAD at Hush Basin cadence", async ({ page }) => {
  await ready(page);
  const initial = await page.evaluate(() => window.__MT1!.getInspectionState());
  await page.evaluate(() => window.__MT1!.presentation.setPlayback("game"));
  const forward = await recordPlayback(page, () => page.locator("#autoBtn").click());
  const moving = forward.filter((row) => row.t > 0);
  expect(forward.at(-1)!.t).toBe(1);
  // Frame time is clamped at 50 ms, so budget in frames as well as seconds:
  // 0.24 s of clock time plus two frames.
  const frames = forward.slice(1).map((row, i) => row.at - forward[i]!.at);
  const frame = Math.max(...frames);
  const clockFrames = moving.length;
  expect(clockFrames, `frames at ${frame.toFixed(1)} ms`).toBeLessThanOrEqual(Math.ceil(0.24 / Math.min(0.05, frame / 1000)) + 2);
  if (frame <= 50) expect(moving.at(-1)!.at - moving[0]!.at).toBeLessThanOrEqual(240 + 2 * frame);
  for (let i = 1; i < forward.length; i += 1) expect(forward[i]!.t).toBeGreaterThanOrEqual(forward[i - 1]!.t);

  const back = await recordPlayback(page, () => page.locator("#autoBtn").click());
  expect(back.at(-1)!.t).toBe(0);
  for (let i = 1; i < back.length; i += 1) expect(back[i]!.t).toBeLessThanOrEqual(back[i - 1]!.t);
  expect((await page.evaluate(() => window.__MT1!.getInspectionState())).certificate).toEqual(initial.certificate);
});

test("show-speed playback shows the declared settles and never leaves the canonical path", async ({ page }) => {
  await ready(page);
  const initial = await page.evaluate(() => window.__MT1!.getInspectionState());
  await page.evaluate(() => {
    window.__MT1!.presentation.setPose(0.6);
    window.__MT1!.presentation.setPlayback("show");
  });
  // From an interior pose REVERSE flips the heading: first toward SPREAD
  // (release has no settles), then, from the same pose, toward DRIVE.
  const toSpread = await recordPlayback(page, () => page.evaluate(() => window.__MT1!.presentation.reverse()));
  expect(toSpread.at(-1)!.t).toBe(0);
  for (let i = 1; i < toSpread.length; i += 1) expect(toSpread[i]!.t).toBeLessThanOrEqual(toSpread[i - 1]!.t);
  await page.evaluate(() => window.__MT1!.presentation.setPose(0.6));
  const toDrive = await recordPlayback(page, () => page.evaluate(() => window.__MT1!.presentation.reverse()));
  expect(toDrive.at(-1)!.t).toBe(1);
  for (const row of toDrive) {
    expect(row.t).toBeGreaterThanOrEqual(0);
    expect(row.t).toBeLessThanOrEqual(1);
  }
  const falls = toDrive.slice(1).filter((row, i) => row.t < toDrive[i]!.t);
  for (const row of falls) {
    const seat = row.t >= 0.852 - 1e-9 && row.t <= 0.86 + 1e-9;
    const lock = row.t >= 0.994 - 1e-9 && row.t <= 0.9988 + 1e-9;
    expect(seat || lock, `backward step to ${row.t} is inside a declared settle`).toBe(true);
  }
  expect((await page.evaluate(() => window.__MT1!.getInspectionState())).certificate).toEqual(initial.certificate);
});

test("scrubbing during playback stops it and stays direct and linear", async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__MT1!.presentation.setPlayback("inspect"));
  await page.locator("#autoBtn").click();
  await expect.poll(() => page.evaluate(() => window.__MT1!.getMachineT())).toBeGreaterThan(0.04);
  await page.locator("#machineSlider").evaluate((element) => {
    const slider = element as HTMLInputElement;
    slider.value = "0.5";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(await page.evaluate(() => window.__MT1!.getMachineT())).toBe(0.5);
  expect(await page.evaluate(() => window.__MT1!.presentation.getState().automatic)).toBe(false);
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  expect(await page.evaluate(() => window.__MT1!.getMachineT())).toBe(0.5);
});
