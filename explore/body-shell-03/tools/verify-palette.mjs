import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";

// Isolated behavior checks: this never builds the mechanism, evaluates authority
// or writes evidence. The normal package build remains the TypeScript check.
const sourceUrl = new URL("../src/presentation/palette.ts", import.meta.url);
const dataUrl = new URL("../src/presentation/hushBasinPalette.json", import.meta.url);
let source = readFileSync(sourceUrl, "utf8").replace(
  'import sourcePalette from "./hushBasinPalette.json";',
  `const sourcePalette = ${readFileSync(dataUrl, "utf8")};`,
);
source = source.replace(/"(@babylonjs\/core\/[^\"]+)"/g, (_, specifier) =>
  JSON.stringify(import.meta.resolve(`${specifier}.js`)));
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { createPresentationPalette } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const checks = [];
const check = (name, run) => { run(); checks.push(name); };
const engine = new NullEngine();
const scene = new Scene(engine);
const originals = [];
const properties = material => [
  material.diffuseColor.asArray(), material.emissiveColor.asArray(), material.specularColor.asArray(),
  material.alpha, material.transparencyMode, material.backFaceCulling, material.zOffset,
];

try {
  for (const [name, materialName] of [
    ["leaf-a", "matH1LateralArmorPresentation"], ["under", "matH1LateralUndersidePresentation"],
    ["pocket", "matBodyShell03Pocket"], ["rail", "matRail"],
    ["S5_CORE_PROXY", "matMech"], ["S5_RECEIVER_PORT", "matMech"], ["joint", "matMech"],
    ["reservation", "matKeep"], ["grid", "matGrid"],
  ]) {
    let material = scene.getMaterialByName(materialName);
    if (!material) {
      material = new StandardMaterial(materialName, scene);
      material.diffuseColor.set(0.31, 0.46, 0.52);
      material.emissiveColor.set(0.02, 0.03, 0.04);
      material.alpha = 0.83;
      material.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
      material.backFaceCulling = false;
      material.zOffset = materialName.includes("Underside") ? 1 : -1;
    }
    const mesh = MeshBuilder.CreateBox(name, {}, scene);
    mesh.material = material;
    originals.push({ mesh, material, properties: properties(material) });
  }
  const duplicate = MeshBuilder.CreateBox("leaf-b", {}, scene);
  duplicate.material = originals[0].material;
  const beforeMeshes = scene.meshes.length;
  const beforeMaterials = scene.materials.length;
  const palette = createPresentationPalette(scene);
  const initializedMaterials = scene.materials.length;
  const colors = () => originals.slice(4, 6).map(({ mesh }) => [
    mesh.material.diffuseColor.asArray(), mesh.material.emissiveColor.asArray(),
  ]);

  check("Hush Basin default with no mesh additions", () => {
    assert.equal(palette.getPalette(), "hush-basin");
    assert.equal(scene.meshes.length, beforeMeshes);
  });
  check("Shared source and role reuse one clone", () => {
    assert.equal(duplicate.material, originals[0].mesh.material);
    assert.notEqual(duplicate.material, originals[0].material);
  });
  check("Original colors and presentation properties remain unchanged", () => {
    for (const entry of originals) assert.deepEqual(properties(entry.material), entry.properties);
  });
  check("Clones retain transparency, culling and opposite H1 depth bias", () => {
    for (const entry of originals) assert.deepEqual(properties(entry.mesh.material).slice(3), entry.properties.slice(3));
  });
  check("Diagnostic materials remain original", () => {
    assert.equal(originals[7].mesh.material, originals[7].material);
    assert.equal(originals[8].mesh.material, originals[8].material);
  });
  check("Core, receiver and joint roles cannot recolor one another", () => {
    assert.notEqual(originals[4].mesh.material, originals[5].mesh.material);
    assert.notEqual(originals[4].mesh.material, originals[6].mesh.material);
    assert.notEqual(originals[5].mesh.material, originals[6].mesh.material);
  });
  check("Direct, reverse and repeated scalar posing agree", () => {
    palette.setForm(0.27);
    const direct = colors();
    palette.setForm(1);
    palette.setForm(0.27);
    assert.deepEqual(colors(), direct);
    palette.setForm(0.27);
    assert.deepEqual(colors(), direct);
  });
  check("Nonfinite values are ignored and finite values clamp", () => {
    const before = colors();
    for (const value of [NaN, Infinity, -Infinity]) palette.setForm(value);
    assert.deepEqual(colors(), before);
    palette.setForm(1);
    const drive = colors();
    palette.setForm(2);
    assert.deepEqual(colors(), drive);
    palette.setForm(0);
    const spread = colors();
    palette.setForm(-1);
    assert.deepEqual(colors(), spread);
  });
  check("A hundred palette/scalar toggles allocate no new materials", () => {
    for (let i = 0; i < 100; i++) {
      palette.setPalette("accepted");
      palette.setForm(i / 100);
      palette.setPalette("hush-basin");
    }
    assert.equal(scene.materials.length, initializedMaterials);
    for (const entry of originals) assert.deepEqual(properties(entry.material), entry.properties);
  });
  check("Accepted mode restores exact original object identities", () => {
    palette.setPalette("accepted");
    for (const entry of originals) assert.equal(entry.mesh.material, entry.material);
    assert.equal(duplicate.material, originals[0].material);
  });
  check("Disposal restores originals and releases only owned clones", () => {
    palette.setPalette("hush-basin");
    palette.dispose();
    palette.dispose();
    assert.equal(scene.materials.length, beforeMaterials);
    for (const entry of originals) assert.equal(entry.mesh.material, entry.material);
    assert.equal(duplicate.material, originals[0].material);
    palette.setForm(1);
    palette.setPalette("hush-basin");
    assert.equal(palette.getPalette(), "accepted");
    assert.equal(scene.materials.length, beforeMaterials);
  });

  console.log(JSON.stringify({ pass: true, checks, authorityParticipation: "none" }, null, 2));
} finally {
  scene.dispose();
  engine.dispose();
}
