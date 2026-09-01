import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");

test("capture MT1-S2 proof views", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  const shots: Array<{ name: string; frontT: number; cam: string; debug?: boolean; section?: boolean }> = [
    { name: "s2-spread-three", frontT: 0, cam: "three" },
    { name: "s2-spread-top", frontT: 0, cam: "frontTop" },
    { name: "s2-fold", frontT: 0.2, cam: "front" },
    { name: "s2-pin", frontT: 0.27, cam: "front" },
    { name: "s2-yaw-top", frontT: 0.4, cam: "frontTop" },
    { name: "s2-cant", frontT: 0.62, cam: "front" },
    { name: "s2-socket", frontT: 0.78, cam: "carry" },
    { name: "s2-seated", frontT: 1, cam: "front" },
    { name: "s2-carry-debug", frontT: 1, cam: "carry", debug: true },
    { name: "s2-reservations", frontT: 0.75, cam: "three", debug: true },
    { name: "s2-catch", frontT: 1, cam: "carry", section: true },
  ];

  for (const shot of shots) {
    await page.evaluate(({ frontT, cam, debug, section }) => {
      const api = window.__MT1!;
      api.setDebug(Boolean(debug));
      api.setSection(Boolean(section) || Boolean(debug));
      api.setFrontT(frontT);
      api.setT(0);
      api.setCamera(cam);
    }, shot);
    await page.waitForTimeout(80);
    await page.screenshot({ path: resolve(outDir, `${shot.name}.png`), fullPage: true });
  }
});
