import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

// StandardMaterial can otherwise reach Babylon's external .fx fallback before
// its lazy shader modules register on some dev-browser/GPU paths. Vite answers
// unknown /src/Shaders/*.fx URLs with index.html, which is then invalid GLSL.
// Register both canonical shaders synchronously before any material renders.
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

export interface Materials {
  frame: StandardMaterial;
  carry: StandardMaterial;
  vaneArmor: StandardMaterial;
  underside: StandardMaterial;
  mechanism: StandardMaterial;
  rail: StandardMaterial;
  lock: StandardMaterial;
  drive: StandardMaterial;
  keep: StandardMaterial;
  protect: StandardMaterial;
  occupy: StandardMaterial;
  empty: StandardMaterial;
  floor: StandardMaterial;
  grid: StandardMaterial;
}

function mat(scene: Scene, name: string, color: Color3, extras?: Partial<{
  alpha: number;
  emissive: Color3;
  specular: number;
}>): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = color.scale(extras?.specular ?? 0.18);
  if (extras?.alpha !== undefined) {
    m.alpha = extras.alpha;
    m.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    m.backFaceCulling = false;
  }
  if (extras?.emissive) m.emissiveColor = extras.emissive;
  return m;
}

export function createMaterials(scene: Scene): Materials {
  return {
    frame: mat(scene, "matFrame", new Color3(0.22, 0.24, 0.26)),
    carry: mat(scene, "matCarry", new Color3(0.34, 0.3, 0.24), { specular: 0.28 }),
    vaneArmor: mat(scene, "matVane", new Color3(0.78, 0.76, 0.68)),
    underside: mat(scene, "matUnder", new Color3(0.38, 0.32, 0.2)),
    mechanism: mat(scene, "matMech", new Color3(0.55, 0.56, 0.58), { specular: 0.4 }),
    rail: mat(scene, "matRail", new Color3(0.72, 0.55, 0.22), { emissive: new Color3(0.12, 0.07, 0) }),
    lock: mat(scene, "matLock", new Color3(0.82, 0.62, 0.12)),
    drive: mat(scene, "matDrive", new Color3(0.12, 0.22, 0.26), { emissive: new Color3(0.02, 0.06, 0.08) }),
    keep: mat(scene, "matKeep", new Color3(0.75, 0.15, 0.45), { alpha: 0.18, emissive: new Color3(0.12, 0.02, 0.06) }),
    protect: mat(scene, "matProtect", new Color3(0.72, 0.18, 0.2), { alpha: 0.16, emissive: new Color3(0.14, 0.02, 0.02) }),
    occupy: mat(scene, "matOccupy", new Color3(0.78, 0.55, 0.12), { alpha: 0.16, emissive: new Color3(0.12, 0.08, 0.01) }),
    empty: mat(scene, "matEmpty", new Color3(0.1, 0.45, 0.5), { alpha: 0.12, emissive: new Color3(0.02, 0.08, 0.09) }),
    floor: mat(scene, "matFloor", new Color3(0.12, 0.13, 0.14)),
    grid: mat(scene, "matGrid", new Color3(0.28, 0.3, 0.3)),
  };
}
