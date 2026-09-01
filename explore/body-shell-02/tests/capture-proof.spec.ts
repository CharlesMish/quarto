import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");

test("capture MT1-S1 proof views", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  const shots: Array<{ name: string; t: number; cam: string; debug?: boolean; section?: boolean }> = [
    { name: "t000-three", t: 0, cam: "three" },
    { name: "t000-top", t: 0, cam: "top" },
    { name: "t000-bay-section", t: 0, cam: "bay", section: true },
    { name: "t025-top", t: 0.25, cam: "top" },
    { name: "t050-top", t: 0.5, cam: "top" },
    { name: "t050-side", t: 0.5, cam: "side" },
    { name: "t075-side", t: 0.75, cam: "side" },
    { name: "t075-rear", t: 0.75, cam: "rear" },
    { name: "t090-rear", t: 0.9, cam: "rear" },
    { name: "t090-top", t: 0.9, cam: "top" },
    { name: "t100-rear", t: 1, cam: "rear" },
    { name: "t100-side", t: 1, cam: "side" },
    { name: "debug-keepouts", t: 0.75, cam: "three", debug: true },
  ];

  for (const shot of shots) {
    await page.evaluate(({ t, cam, debug, section }) => {
      const api = window.__MT1!;
      api.setDebug(Boolean(debug));
      api.setSection(Boolean(section) || Boolean(debug));
      api.setT(t);
      api.setCamera(cam);
    }, shot);
    await page.waitForTimeout(80);
    await page.screenshot({ path: resolve(outDir, `${shot.name}.png`), fullPage: true });
  }

  const angles = [55, 62.5, 70, 80];
  for (const deg of angles) {
    await page.evaluate((haunch) => {
      const api = window.__MT1!;
      api.setDebug(false);
      api.setSection(false);
      api.setCamera("rear");
      api.previewHaunch(haunch);
    }, deg);
    await page.waitForTimeout(80);
    await page.screenshot({ path: resolve(outDir, `haunch-${String(deg).replace(".", "p")}-rear.png`) });
  }
});
