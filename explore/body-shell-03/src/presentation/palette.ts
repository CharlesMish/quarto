import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import sourcePalette from "./hushBasinPalette.json";

export type PresentationPaletteName = "hush-basin" | "accepted";

export interface PresentationPalette {
  setPalette(palette: PresentationPaletteName): void;
  setForm(t: number): void;
  getPalette(): PresentationPaletteName;
  dispose(): void;
}

type SourceRole = keyof typeof sourcePalette.materials;
type MaterialRole = "structure" | "shell" | "accent" | "carry" | "joint" | "rail"
  | "pocket" | "folio" | "underside" | "lock" | "can" | "core" | "receiver";

interface Appearance {
  diffuse: Color3;
  emissive: Color3;
  specular: number;
}

const ROLE_BY_MATERIAL: Partial<Record<string, MaterialRole>> = {
  matFrame: "structure",
  matCarry: "carry",
  matVane: "folio",
  matH1LateralArmorPresentation: "folio",
  matH1LateralUndersidePresentation: "underside",
  matUnder: "underside",
  matMech: "joint",
  matRail: "rail",
  matLock: "lock",
  matDrive: "can",
  matBodyShell03Hull: "shell",
  matBodyShell03Accent: "accent",
  matBodyShell03Pocket: "pocket",
  matH1RegisterBracketPresentation: "joint",
};

function sourceColor(role: SourceRole): Color3 {
  const [r, g, b] = sourcePalette.materials[role].albedo;
  return new Color3(r, g, b);
}

function appearance(role: SourceRole, diffuseScale: number, emissionScale: number, specular: number): Appearance {
  const source: { albedo: number[]; emission?: number[]; emissionEnergy?: number } = sourcePalette.materials[role];
  const [r, g, b] = source.emission ?? [0, 0, 0];
  return {
    diffuse: sourceColor(role).scale(diffuseScale),
    emissive: new Color3(r, g, b).scale((source.emissionEnergy ?? 0) * emissionScale),
    specular,
  };
}

/**
 * Reversible presentation on the existing meshes, initialized after H1/body and
 * before debug. Source: bridge dca5887; native derivative reference: 0b0cc10.
 * StandardMaterial response is authored for this viewer, not Godot photometry.
 * No geometry, visibility, authority role, registration or readiness is changed.
 */
export function createPresentationPalette(scene: Scene): PresentationPalette {
  const appearances: Record<MaterialRole, Appearance> = {
    structure: appearance("structure", 1, 0.6, 0.14),
    shell: appearance("shell", 1.03, 0.55, 0.16),
    accent: appearance("shell", 0.9, 0.4, 0.13),
    carry: appearance("joint", 1, 0.5, 0.2),
    joint: appearance("joint", 1.08, 0.5, 0.3),
    rail: appearance("joint", 1, 0.5, 0.3),
    // FO1's recess must remain darker than its surrounding frame in either
    // palette. Keep the Hush Basin structural hue, without the old mint mix.
    pocket: appearance("structure", 0.65, 0.25, 0.1),
    // Large faces must retain a shaded midtone; mint is reserved for small parts.
    folio: appearance("lift", 0.86, 0.12, 0.12),
    underside: appearance("lift_underlay", 0.96, 0.08, 0.14),
    lock: appearance("lift_edge", 0.78, 0.3, 0.15),
    can: appearance("can", 0.8, 0.15, 0.24),
    core: appearance("energy", 1, 0, 0.16),
    receiver: appearance("nozzle", 1, 0, 0.2),
  };
  appearances.carry.diffuse = Color3.Lerp(sourceColor("joint"), sourceColor("structure"), 0.35);
  appearances.rail.diffuse = Color3.Lerp(sourceColor("joint"), sourceColor("panel_seam"), 0.28);

  const bindings: Array<{ mesh: AbstractMesh; original: StandardMaterial; variant: StandardMaterial }> = [];
  const variants = new Map<string, StandardMaterial>();
  const animated: Array<{ material: StandardMaterial; role: "core" | "receiver" }> = [];

  for (const mesh of scene.meshes) {
    const original = mesh.material;
    if (!(original instanceof StandardMaterial)) continue;
    let role = ROLE_BY_MATERIAL[original.name];
    // The narrow overrides retain the bridge's established decorative mapping.
    if (mesh.name === "S5_CORE_PROXY") role = "core";
    if (/^S5_RECEIVER_(PORT|STBD|TOP|BOT)$/.test(mesh.name)) role = "receiver";
    if (!role) continue;

    const key = `${original.uniqueId}:${role}`;
    let variant = variants.get(key);
    if (!variant) {
      variant = original.clone(`QUARTO_HUSH_${original.uniqueId}_${role}`);
      // Cloning retains alpha, transparency mode, culling and H1 raster depth bias.
      // Only the three color terms change; no accepted material is mutated.
      const style = appearances[role];
      variant.diffuseColor.copyFrom(style.diffuse);
      variant.emissiveColor.copyFrom(style.emissive);
      style.diffuse.scaleToRef(style.specular, variant.specularColor);
      variants.set(key, variant);
      if (role === "core" || role === "receiver") animated.push({ material: variant, role });
    }
    bindings.push({ mesh, original, variant });
  }

  const amber = Color3.FromArray(sourcePalette.stateColors.spread);
  const cyan = Color3.FromArray(sourcePalette.stateColors.drive);
  const state = new Color3();
  const white = Color3.White();
  let current: PresentationPaletteName = "accepted";
  let form = -1;
  let disposed = false;

  const setForm = (t: number): void => {
    if (disposed || !Number.isFinite(t)) return;
    const next = Math.max(0, Math.min(1, t));
    if (form === next) return;
    form = next;
    Color3.LerpToRef(amber, cyan, form, state);
    const terminal = Math.max(0, Math.min(1, (form - 0.88) / 0.12));
    const handover = terminal * terminal * (3 - 2 * terminal);
    for (const { material, role } of animated) {
      if (role === "core") {
        state.scaleToRef(0.8, material.diffuseColor);
        state.scaleToRef(0.1 + 0.08 * form, material.emissiveColor);
      } else {
        Color3.LerpToRef(state, white, 0.18, material.diffuseColor);
        material.diffuseColor.scaleInPlace(0.72);
        state.scaleToRef(0.025 + 0.125 * handover, material.emissiveColor);
      }
    }
  };

  const setPalette = (palette: PresentationPaletteName): void => {
    if (disposed || current === palette) return;
    current = palette;
    for (const { mesh, original, variant } of bindings) {
      mesh.material = palette === "hush-basin" ? variant : original;
    }
  };

  setForm(0);
  setPalette("hush-basin");

  return {
    setPalette,
    setForm,
    getPalette: () => current,
    dispose() {
      if (disposed) return;
      for (const { mesh, original } of bindings) mesh.material = original;
      for (const material of variants.values()) material.dispose();
      variants.clear();
      bindings.length = 0;
      animated.length = 0;
      current = "accepted";
      disposed = true;
    },
  };
}
