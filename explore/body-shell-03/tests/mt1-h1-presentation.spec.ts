import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe("MT1-S5HR3R1 H1 presentation plumbing", () => {
  test("presentation layer is explicit and authority geometry remains outside it", () => {
    const source = readFileSync(resolve(process.cwd(), "src/scene/h1Presentation.ts"), "utf8");
    expect(source).toContain('new TransformNode("H1_PRESENTATION_ROOT"');
    expect(source).toContain("presentationOnly: true");
    expect(source).toContain("physical: false");
    expect(source).toContain("armorPresentation.zOffset = -1");
    expect(source).toContain("undersidePresentation.zOffset = 1");
    expect(source).not.toContain("registerBox(");
  });

  test("director inventory, picking, cameras, and shader runtime are lightweight", async ({ page }) => {
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
    await page.waitForFunction(() => Boolean(window.__MT1?.getRenderInventory));
    await page.waitForTimeout(600);
    const result = await page.evaluate(() => {
      const before = window.__MT1!.getInspectionState();
      const rows = window.__MT1!.getRenderInventory();
      const after = window.__MT1!.getInspectionState();
      return {
        before,
        after,
        brackets: rows.filter((row) => row.semanticName.startsWith("H1_REG_BRACKET_")),
        portPad: rows.find((row) => row.semanticName === "S5_REG_PAD_PORT"),
      };
    });
    expect(result.after).toEqual(result.before);
    expect(result.brackets).toHaveLength(3);
    expect(result.brackets.every((row) => row.objectClass === "presentation-only" && row.registrationId === null)).toBe(true);
    expect(result.portPad).toMatchObject({ objectClass: "physical authority", family: "s5-register" });
    expect(result.portPad?.registrationId).toMatch(/^AUTHORITY_ROW_/);

    for (const label of [
      "PROP",
      "AFT PROP",
      "PROP STOWED",
      "PROP MID",
      "PROP SEATED",
      "LOCK PORT",
      "LOCK STARBOARD",
      "LOCK TOP PORT",
      "LOCK TOP STARBOARD",
      "LOCK FOCUS",
      "INSPECT PICK",
    ]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }

    await page.getByRole("button", { name: "INSPECT PICK", exact: true }).click();
    await page.mouse.click(800, 520);
    await expect(page.locator("#inspectPanel")).toBeVisible();
    await expect(page.locator("#inspectPanel")).toContainText("DIRECTOR INSPECT");
    await expect(page.locator("#inspectPanel")).toContainText("SEMANTIC");
    expect(shaderErrors).toEqual([]);
    expect(shaderHtmlFallbacks).toEqual([]);
  });
});
