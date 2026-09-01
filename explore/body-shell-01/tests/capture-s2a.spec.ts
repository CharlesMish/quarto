import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../evidence");

test("capture MT1-S2A corrective proof views", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(outDir, { recursive: true });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__MT1));

  const shots: Array<{ name: string; frontT: number; cam: string; debug?: boolean; section?: boolean }> = [
    { name: "s2a-seated-lane", frontT: 1, cam: "front" },
    { name: "s2a-mid-cant", frontT: 0.62, cam: "front" },
    { name: "s2a-mid-socket", frontT: 0.78, cam: "carry" },
    { name: "s2a-book-pin", frontT: 0.27, cam: "front", section: true },
    { name: "s2a-nest-pin", frontT: 1, cam: "carry", section: true },
    { name: "s2a-catch-approach", frontT: 0.8, cam: "carry" },
    { name: "s2a-catch-seated", frontT: 1, cam: "carry" },
    { name: "s2a-carry-ifaces", frontT: 1, cam: "carry", debug: true },
    { name: "s2a-reservations", frontT: 1, cam: "three", debug: true },
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
