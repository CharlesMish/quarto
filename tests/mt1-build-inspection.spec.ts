import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe("MT1-S5HR3R1 lightweight build inspection", () => {
  test("dev-page identity has no stale stage labels", () => {
    const files = ["index.html", "src/main.ts", "src/ui/createUI.ts", "src/scene/debug.ts"];
    const presentation = files.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect(presentation).toContain("MT1-S5HR3R1");
    expect(presentation).not.toMatch(/MT1-S5HR2|MT1-S5HR3(?!R1)/);
    const materials = readFileSync(resolve(process.cwd(), "src/scene/materials.ts"), "utf8");
    expect(materials).toContain('import "@babylonjs/core/Shaders/default.vertex";');
    expect(materials).toContain('import "@babylonjs/core/Shaders/default.fragment";');
  });

  test("build and cached inspection getters return without authority work", async ({ page }) => {
    const shaderErrors: string[] = [];
    const shaderHtmlFallbacks: string[] = [];
    page.on("console", (message) => {
      if (/Unable to compile effect|SHADER ERROR|Offending line/.test(message.text())) shaderErrors.push(message.text());
    });
    page.on("response", (response) => {
      const contentType = response.headers()["content-type"] ?? "";
      if (contentType.includes("text/html") && /\/src\/Shaders|\.fx(?:$|\?)/i.test(response.url())) {
        shaderHtmlFallbacks.push(response.url());
      }
    });
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.getBuildInfo));
    await page.waitForTimeout(1_000);

    const result = await page.evaluate(() => {
      const before = window.__MT1!.getInspectionState();
      const started = performance.now();
      let info = window.__MT1!.getBuildInfo();
      for (let i = 0; i < 1_000; i += 1) info = window.__MT1!.getBuildInfo();
      const elapsedMs = performance.now() - started;
      const after = window.__MT1!.getInspectionState();
      return { info, before, after, elapsedMs, title: document.title };
    });

    expect(result.info).toMatchObject({
      candidateId: "MT1-S5HR3R1",
      freezeId: "MT1-S5HR3R1",
      sourceCandidateId: "MT1-S5HR3R",
      inspectionSurface: "presentation-only-v1",
    });
    expect(result.info.candidateSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.info.authorityContractSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.info.frozenNegativeControlContractSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.info.nominalGeometryAuthority.id).toBe("MT1-S5H");
    expect(result.before).toEqual(result.after);
    expect(result.before).toMatchObject({
      candidateId: "MT1-S5HR3R1",
      machineT: 0,
      driveT: 0,
      mode: "MACHINE",
      certificate: { state: "STALE", present: false, valid: false, samples: null, pairsEvaluated: null },
    });
    expect(result.elapsedMs).toBeLessThan(50);
    expect(result.title).toBe("MT1-S5HR3R1 / Mechanical Truth Authority");
    expect(shaderErrors).toEqual([]);
    expect(shaderHtmlFallbacks).toEqual([]);
    await expect(page.locator(".eyebrow")).toContainText("MT1-S5HR3R1");
    await expect(page.locator(".provenance")).toContainText("FREEZE MT1-S5HR3R1");
  });
});
