import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { box } from "./primitives";

export interface BodyShellConcept {
  root: TransformNode;
  meshes: string[];
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
}

type Piece = {
  name: string;
  size: [number, number, number];
  position: [number, number, number];
  accent?: boolean;
  rotation?: [number, number, number];
  purpose: string;
};

const PIECES: readonly Piece[] = [
  { name: "BODY_DORSAL_SPINE_VIS", size: [1.32, 0.12, 9.0], position: [0, 1.56, -0.15], purpose: "Thin dorsal datum unifying the certified central mechanism without concealing its sides." },
  { name: "BODY_VENTRAL_SPINE_VIS", size: [1.28, 0.12, 8.8], position: [0, 0.14, -0.15], purpose: "Ventral silhouette datum kept outside the visible mechanism volume." },
  { name: "BODY_PORT_FORWARD_CHINE_VIS", size: [0.1, 1.18, 5.3], position: [-0.7, 0.82, 1.35], purpose: "Port central-body chine; lateral mechanism remains outboard and exposed." },
  { name: "BODY_STBD_FORWARD_CHINE_VIS", size: [0.1, 1.18, 5.3], position: [0.7, 0.82, 1.35], purpose: "Starboard central-body chine; lateral mechanism remains outboard and exposed." },
  { name: "BODY_PORT_PROP_FAIRING_VIS", size: [0.1, 0.82, 3.0], position: [-0.7, 0.78, -3.35], purpose: "Open-sided port propulsion fairing edge; the thrust can remains visually inspectable." },
  { name: "BODY_STBD_PROP_FAIRING_VIS", size: [0.1, 0.82, 3.0], position: [0.7, 0.78, -3.35], purpose: "Open-sided starboard propulsion fairing edge; the thrust can remains visually inspectable." },
  { name: "BODY_PROP_SHOULDER_PORT_VIS", size: [0.34, 0.08, 2.85], position: [-0.47, 1.38, -3.35], accent: true, purpose: "Port upper shoulder leaving an open centerline service slot over propulsion." },
  { name: "BODY_PROP_SHOULDER_STBD_VIS", size: [0.34, 0.08, 2.85], position: [0.47, 1.38, -3.35], accent: true, purpose: "Starboard upper shoulder leaving an open centerline service slot over propulsion." },
  { name: "BODY_NOSE_BLOCK_VIS", size: [1.08, 0.86, 0.5], position: [0, 0.83, 4.45], purpose: "Blunt first-pass forward terminus; no cockpit or intake claim." },
  { name: "BODY_NOSE_PORT_RAIL_VIS", size: [0.12, 0.82, 1.25], position: [-0.61, 0.82, 3.78], accent: true, purpose: "Port forward silhouette rail." },
  { name: "BODY_NOSE_STBD_RAIL_VIS", size: [0.12, 0.82, 1.25], position: [0.61, 0.82, 3.78], accent: true, purpose: "Starboard forward silhouette rail." },
  { name: "BODY_TRANSITION_FWD_PORT_VIS", size: [0.56, 0.09, 1.05], position: [-0.93, 1.48, 1.42], rotation: [0, -0.18, -0.08], purpose: "Open shoulder gesture toward the forward-port mechanism root." },
  { name: "BODY_TRANSITION_FWD_STBD_VIS", size: [0.56, 0.09, 1.05], position: [0.93, 1.48, 1.42], rotation: [0, 0.18, 0.08], purpose: "Open shoulder gesture toward the forward-starboard mechanism root." },
  { name: "BODY_TRANSITION_AFT_PORT_VIS", size: [0.56, 0.09, 1.05], position: [-0.93, 1.48, -1.18], rotation: [0, 0.18, -0.08], purpose: "Open shoulder gesture toward the aft-port mechanism root." },
  { name: "BODY_TRANSITION_AFT_STBD_VIS", size: [0.56, 0.09, 1.05], position: [0.93, 1.48, -1.18], rotation: [0, -0.18, 0.08], purpose: "Open shoulder gesture toward the aft-starboard mechanism root." },
] as const;

function markConcept(node: TransformNode, purpose: string): void {
  node.metadata = {
    ...(node.metadata ?? {}),
    presentationOnly: true,
    physical: false,
    authorityStage: "body-shell exploration",
    family: "body-shell-concept",
    conceptId: "MT1-BODY-SHELL-01",
    purpose,
  };
}

export function createBodyShellConcept(scene: Scene): BodyShellConcept {
  const root = new TransformNode("BODY_SHELL_01_PRESENTATION_ROOT", scene);
  markConcept(root, "Toggleable non-authoritative body-shell exploration root.");

  const shell = new StandardMaterial("matBodyShell01Concept", scene);
  shell.diffuseColor = new Color3(0.24, 0.31, 0.34);
  shell.emissiveColor = new Color3(0.012, 0.025, 0.03);
  shell.specularColor = new Color3(0.08, 0.11, 0.12);
  shell.alpha = 0.58;
  shell.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  shell.backFaceCulling = false;

  const accent = shell.clone("matBodyShell01AccentConcept");
  accent.diffuseColor = new Color3(0.4, 0.3, 0.14);
  accent.emissiveColor = new Color3(0.05, 0.025, 0.005);
  accent.alpha = 0.66;

  const meshes: string[] = [];
  for (const piece of PIECES) {
    const mesh = box(scene, piece.name, root, piece.accent ? accent : shell, piece.size, piece.position, {
      rotation: piece.rotation,
    });
    markConcept(mesh, piece.purpose);
    meshes.push(piece.name);
  }

  return {
    root,
    meshes,
    setEnabled(on: boolean) {
      root.setEnabled(on);
    },
    isEnabled() {
      return root.isEnabled();
    },
  };
}
