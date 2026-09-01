import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { MachineRig } from "../machine/types";
import type { Materials } from "./materials";
import { box } from "./primitives";

export interface H1PresentationResult {
  presentationMeshes: string[];
  depthSeparatedMeshes: string[];
  annotatedAuthorityMeshes: string[];
}

function markPresentation(mesh: TransformNode, purpose: string): void {
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    presentationOnly: true,
    physical: false,
    authorityStage: "H1 presentation",
    family: "h1-presentation",
    purpose,
  };
}

/**
 * Director-only visual aids. Nothing created here is registered in the machine
 * authority universe or parented below its authority root.
 */
export function createH1Presentation(scene: Scene, rig: MachineRig, mats: Materials): H1PresentationResult {
  const root = new TransformNode("H1_PRESENTATION_ROOT", scene);
  markPresentation(root, "Non-authoritative H1 readability layer.");

  const bracketMaterial = new StandardMaterial("matH1RegisterBracketPresentation", scene);
  bracketMaterial.diffuseColor = new Color3(0.19, 0.31, 0.34);
  bracketMaterial.emissiveColor = new Color3(0.015, 0.045, 0.05);
  bracketMaterial.specularColor = new Color3(0.08, 0.12, 0.13);

  const bracketSpecs: Array<[string, [number, number, number], [number, number, number], string]> = [
    [
      "H1_REG_BRACKET_PORT_VIS",
      [0.07, 0.065, 0.13],
      [-0.555, 0.78, -4.625],
      "Presentation-only saddle joining the visible PORT register pad to the adjacent fixed wall.",
    ],
    [
      "H1_REG_BRACKET_STARBOARD_VIS",
      [0.07, 0.065, 0.13],
      [0.555, 0.78, -4.625],
      "Presentation-only saddle joining the visible STARBOARD register pad to the adjacent fixed wall.",
    ],
    [
      "H1_REG_BRACKET_TOP_VIS",
      [0.2, 0.055, 0.13],
      [0, 1.245, -4.625],
      "Presentation-only saddle joining the visible TOP register pad to the fixed top support pair.",
    ],
  ];
  const presentationMeshes: string[] = [];
  for (const [name, size, position, purpose] of bracketSpecs) {
    const mesh = box(scene, name, root, bracketMaterial, size, position);
    markPresentation(mesh, purpose);
    presentationMeshes.push(name);
  }

  // The physical top/underside solids intentionally meet at exact construction
  // planes. Separate only their raster depth bias so those interfaces do not
  // alternate with camera angle; geometry and authority bounds are unchanged.
  const armorPresentation = mats.vaneArmor.clone("matH1LateralArmorPresentation");
  const undersidePresentation = mats.underside.clone("matH1LateralUndersidePresentation");
  armorPresentation.zOffset = -1;
  undersidePresentation.zOffset = 1;
  const depthSeparatedMeshes: string[] = [];
  for (const mesh of scene.meshes) {
    if (/^(FL|FR|RL|RR)_(INNER|OUTER)_ARMOR(?:_|$)/.test(mesh.name)) {
      mesh.material = armorPresentation;
      depthSeparatedMeshes.push(mesh.name);
    } else if (/^(FL|FR|RL|RR)_(INNER|OUTER)_UNDER(?:_|$)/.test(mesh.name)) {
      mesh.material = undersidePresentation;
      depthSeparatedMeshes.push(mesh.name);
    }
  }

  const purposeByName: Readonly<Record<string, string>> = {
    S5_REG_PAD_PORT: "Physical PORT register pad used by evalRegister(); visual saddle is presentation-only.",
    S5_REG_PAD_STARBOARD: "Physical STARBOARD register pad used by evalRegister(); visual saddle is presentation-only.",
    S5_REG_PAD_TOP: "Physical TOP register pad used by evalRegister(); visual saddle is presentation-only.",
    FL_CATCH_CHEEK_FWD: "Forward wall of the fixed, deliberately open FL passive U-throat.",
    FL_CATCH_CHEEK_AFT: "Aft wall of the fixed, deliberately open FL passive U-throat.",
    FL_CATCH_BACK: "Closed back of the fixed FL passive U-throat; its mouth remains open for the keeper.",
    FR_CATCH_CHEEK_FWD: "Forward wall of the fixed, deliberately open FR passive U-throat.",
    FR_CATCH_CHEEK_AFT: "Aft wall of the fixed, deliberately open FR passive U-throat.",
    FR_CATCH_BACK: "Closed back of the fixed FR passive U-throat; its mouth remains open for the keeper.",
    RL_LATCH_THROAT_BACK: "Rear-left book-latch U-throat back; the keeper intentionally enters the open throat.",
    RR_LATCH_THROAT_BACK: "Rear-right book-latch U-throat back; the keeper intentionally enters the open throat.",
  };
  const annotatedAuthorityMeshes: string[] = [];
  for (const solid of rig.solids) {
    const purpose = purposeByName[solid.name];
    if (!purpose) continue;
    solid.node.metadata = { ...(solid.node.metadata ?? {}), purpose };
    annotatedAuthorityMeshes.push(solid.name);
  }

  return { presentationMeshes, depthSeparatedMeshes: depthSeparatedMeshes.sort(), annotatedAuthorityMeshes };
}
