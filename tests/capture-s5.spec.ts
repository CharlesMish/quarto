import { test } from "@playwright/test";
import { execFileSync } from "node:child_process";

test("capture S5-H1 propulsion evidence", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1?.setMachineT));
  const shots: Array<[string, number, boolean]> = [
    ["s5-h1-stowed-section", 0.86, true],
    ["s5-h1-mid-section", 0.94, true],
    ["s5-h1-first-insertion", 0.99, true],
    ["s5-h1-pre-seat", 0.985, true],
    ["s5-h1-lock-retracted", 0.998, true],
    ["s5-h1-lock-partial", 0.9997, true],
    ["s5-h1-captured", 1, true],
    ["s5-h1-lock-engaged", 1, true],
    ["s5-h1-aft-loadpath", 1, false],
  ];
  for (const [name, t, section] of shots) {
    await page.evaluate(
      ([machineT, propSection]) => {
        window.__MT1!.setCamera?.("prop");
        window.__MT1!.setMachineT(machineT);
        window.__MT1!.setDebug?.(true);
        window.__MT1!.setPropSection?.(propSection);
      },
      [t, section] as [number, boolean],
    );
    await page.waitForTimeout(200);
    await page.screenshot({ path: `evidence/${name}.png`, fullPage: true });
  }
  await page.evaluate(() => {
    window.__MT1!.setCamera?.("aftProp");
    window.__MT1!.setMachineT(1);
    window.__MT1!.setPropSection?.(true);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "evidence/s5-h1-aft-side.png", fullPage: true });
  await page.evaluate(() => {
    window.__MT1!.setCamera?.("lockPort");
    window.__MT1!.setMachineT(1);
    window.__MT1!.setPropSection?.(true);
    window.__MT1!.setDebug?.(true);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "evidence/s5-h1-guide-track.png", fullPage: true });

  const corrective: Array<[string, number]> = [
    ["s5h-h1-pre-pickup-mouth", 0.99868],
    ["s5h-h1-active-track", 0.99928],
    ["s5h-h1-captured-shoe-pin", 1],
    ["s5h-h1-reverse-return-face", 0.9998],
    ["s5h-h1-pin-clear-shoulder", 0.9996],
    ["s5h-h1-guide-track-backing", 1],
  ];
  for (const [name, machineT] of corrective) {
    await page.evaluate((t) => {
      window.__MT1!.setCamera?.("lockPort");
      window.__MT1!.setMachineT(t);
      window.__MT1!.setPropSection?.(true);
      window.__MT1!.setLockStudyView?.(true);
      window.__MT1!.setDebug?.(true);
    }, machineT);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `evidence/${name}.png`, fullPage: true });
  }
  for (const [name] of corrective) {
    execFileSync("convert", [
      `evidence/${name}.png`,
      "-crop",
      "360x240+0+0",
      "+repage",
      "-resize",
      "1080x720!",
      `evidence/${name}.png`,
    ]);
  }
  execFileSync("convert", [
    "evidence/s5h-h1-pre-pickup-mouth.png",
    "evidence/s5h-h1-active-track.png",
    "evidence/s5h-h1-captured-shoe-pin.png",
    "+append",
    "evidence/s5h-h1-director-strip.png",
  ]);
});
