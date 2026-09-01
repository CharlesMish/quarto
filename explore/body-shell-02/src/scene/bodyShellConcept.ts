import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { P } from "../design/parameters";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";
import { box } from "./primitives";

export interface BodyShellConcept {
  root: TransformNode;
  meshes: string[];
  propGhostMeshes: string[];
  sectionMeshes: string[];
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
  setSection(on: boolean): void;
  isSection(): boolean;
  setPropGhost(on: boolean): void;
}

type Kind = "hull" | "accent" | "mount";

type Piece = {
  name: string;
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  kind: Kind;
  purpose: string;
  propGhost?: boolean;
};

const SKIN_X = P.keel.halfWidth + 0.05;
const CORE_HALF_W = P.keel.halfWidth - 0.11;
const FUSELAGE_Y = (P.keel.ventralY + P.keel.dorsalY) * 0.5 + 0.04;
const FUSELAGE_H = P.keel.dorsalY - P.keel.ventralY - 0.22;
const CAN_SEATED_AFT = P.drive.stowedZ - P.drive.stroke;
const HOOP_Z = CAN_SEATED_AFT - 0.22;
const BAY_Z = (P.bay.zFwd + P.bay.zAft) * 0.5;
const BAY_L = P.bay.zFwd - P.bay.zAft + 0.12;
const FWD_LEN = P.keel.zFwd - P.bay.zFwd - 0.15;
const FWD_Z = (P.keel.zFwd + P.bay.zFwd) * 0.5 + 0.12;

function pair(
  stem: string,
  size: [number, number, number],
  portPosition: [number, number, number],
  extras: {
    kind: Kind;
    purpose: string;
    rotationPort?: [number, number, number];
    propGhost?: boolean;
  },
): Piece[] {
  const rotationStbd = extras.rotationPort
    ? ([extras.rotationPort[0], -extras.rotationPort[1], -extras.rotationPort[2]] as [number, number, number])
    : undefined;
  return [
    {
      name: `BODY_${stem}_PORT_VIS`,
      size,
      position: portPosition,
      rotation: extras.rotationPort,
      kind: extras.kind,
      purpose: `Port ${extras.purpose}`,
      propGhost: extras.propGhost,
    },
    {
      name: `BODY_${stem}_STBD_VIS`,
      size,
      position: [-portPosition[0], portPosition[1], portPosition[2]],
      rotation: rotationStbd,
      kind: extras.kind,
      purpose: `Starboard ${extras.purpose}`,
      propGhost: extras.propGhost,
    },
  ];
}

const PIECES: readonly Piece[] = [
  ...pair("NOSE_PROW", [CORE_HALF_W, 1.28, 0.74], [-CORE_HALF_W / 2, 0.86, P.keel.zFwd + 0.28], {
    kind: "hull",
    purpose: "forward terminus filling the reserved front volume; not a cockpit or intake.",
  }),
  ...pair(
    "NOSE_CHEEK",
    [0.12, 1.12, 0.98],
    [-0.68, 0.84, P.keel.zFwd - 0.02],
    {
      kind: "accent",
      purpose: "prow cheek tapering the fuselage into a readable nose without an aero claim.",
      rotationPort: [0, -0.26, 0],
    },
  ),
  ...pair("FUSELAGE_CORE", [CORE_HALF_W, FUSELAGE_H, FWD_LEN], [-CORE_HALF_W / 2, FUSELAGE_Y, FWD_Z], {
    kind: "hull",
    purpose: "central fuselage mass tying the certified keel into one chassis volume.",
  }),
  ...pair("DORSAL_DECK", [SKIN_X, 0.16, FWD_LEN + 0.25], [-SKIN_X / 2, P.keel.dorsalY + 0.08, FWD_Z - 0.05], {
    kind: "hull",
    purpose: "dorsal deck giving the craft a continuous top silhouette from nose to bay.",
  }),
  ...pair("VENTRAL_HULL", [SKIN_X + 0.04, 0.16, 10.45], [-(SKIN_X + 0.04) / 2, 0.12, -0.72], {
    kind: "hull",
    purpose: "ventral hull / belly tying nose, chassis, and aft sill into one ground silhouette.",
  }),
  ...pair("SKIN_FWD", [0.1, FUSELAGE_H + 0.08, FWD_LEN - 0.15], [-SKIN_X, FUSELAGE_Y, FWD_Z + 0.05], {
    kind: "hull",
    purpose: "forward side skin; laterals remain outboard and exposed.",
  }),
  ...pair("SKIN_AFT", [0.1, 1.02, BAY_L], [-SKIN_X, 0.78, BAY_Z], {
    kind: "hull",
    purpose: "aft side skin wrapping the propulsion bay wall without entering the can corridor.",
    propGhost: true,
  }),
  ...pair("CHINE", [0.14, 0.1, 9.35], [-SKIN_X + 0.02, 0.26, -0.55], {
    kind: "accent",
    purpose: "lower chine rail strengthening the side silhouette.",
  }),
  ...pair("PROP_FAIRING", [0.12, 0.9, 2.55], [-SKIN_X + 0.04, 0.74, -4.52], {
    kind: "hull",
    purpose: "restrained propulsion-bay side fairing; thrust-can centerline stays open.",
    propGhost: true,
  }),
  ...pair("PROP_SHOULDER", [0.36, 0.1, 2.65], [-0.54, 1.4, -3.52], {
    kind: "accent",
    purpose: "split dorsal shoulder over propulsion, leaving a centerline service slot.",
    propGhost: true,
  }),
  ...pair("AFT_HOOP", [0.12, 0.96, 0.16], [-0.7, 0.76, HOOP_Z], {
    kind: "accent",
    purpose: "open rear hoop framing the seated can mouth; no closed boat-tail.",
    propGhost: true,
  }),
  ...pair("FWD_ROOT", [0.38, 0.32, 0.72], [(P.fl.nestX - SKIN_X) * 0.5, P.fl.y - 0.2, P.fl.z], {
    kind: "mount",
    purpose: "forward lateral root housing; visually mounts the hinge cluster to the fuselage.",
  }),
  ...pair("FWD_POST", [0.12, 0.9, 0.2], [-SKIN_X - 0.08, 1.5, P.fl.z], {
    kind: "mount",
    purpose: "forward root post spanning fuselage shoulder to the front hinge station.",
  }),
  ...pair("AFT_ROOT", [0.4, 0.42, 0.82], [(P.rl.nestX - SKIN_X) * 0.5, P.rl.y - 0.28, P.rl.z], {
    kind: "mount",
    purpose: "aft lateral root housing; visually mounts the rear hinge cluster to the fuselage.",
  }),
  ...pair("AFT_POST", [0.12, 1.35, 0.2], [-SKIN_X - 0.08, 1.85, P.rl.z], {
    kind: "mount",
    purpose: "aft root post spanning fuselage shoulder to the rear hinge station.",
  }),
  {
    name: "BODY_AFT_HOOP_TOP_VIS",
    size: [1.28, 0.1, 0.16],
    position: [0, 1.26, HOOP_Z],
    kind: "accent",
    purpose: "Open rear hoop lintel; propulsion handover remains visible below.",
    propGhost: true,
  },
  {
    name: "BODY_AFT_HOOP_SILL_VIS",
    size: [1.28, 0.1, 0.16],
    position: [0, 0.26, HOOP_Z],
    kind: "accent",
    purpose: "Open rear hoop sill joining the ventral hull to the propulsion frame.",
    propGhost: true,
  },
];

function markConcept(node: TransformNode, purpose: string): void {
  node.metadata = {
    ...(node.metadata ?? {}),
    presentationOnly: true,
    physical: false,
    authorityStage: "body-shell exploration",
    family: "body-shell-concept",
    conceptId: BODY_CONCEPT_INFO.conceptId,
    purpose,
  };
}

export function createBodyShellConcept(scene: Scene): BodyShellConcept {
  const root = new TransformNode("BODY_SHELL_02_PRESENTATION_ROOT", scene);
  markConcept(root, "Toggleable non-authoritative fuselage / frame integration root.");

  const hull = new StandardMaterial("matBodyShell02Hull", scene);
  hull.diffuseColor = new Color3(0.16, 0.21, 0.24);
  hull.emissiveColor = new Color3(0.01, 0.02, 0.025);
  hull.specularColor = new Color3(0.07, 0.1, 0.11);
  hull.alpha = 0.86;
  hull.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  hull.backFaceCulling = false;

  const accent = hull.clone("matBodyShell02Accent");
  accent.diffuseColor = new Color3(0.42, 0.32, 0.14);
  accent.emissiveColor = new Color3(0.05, 0.025, 0.005);
  accent.alpha = 0.9;

  const mount = hull.clone("matBodyShell02Mount");
  mount.diffuseColor = new Color3(0.28, 0.26, 0.22);
  mount.emissiveColor = new Color3(0.02, 0.016, 0.01);
  mount.specularColor = new Color3(0.12, 0.1, 0.06);
  mount.alpha = 0.92;

  const materialFor = (kind: Kind): StandardMaterial => {
    if (kind === "accent") return accent;
    if (kind === "mount") return mount;
    return hull;
  };

  const created: Mesh[] = [];
  const meshes: string[] = [];
  const propGhostMeshes: string[] = [];
  const sectionMeshes: string[] = [];

  for (const piece of PIECES) {
    const mesh = box(scene, piece.name, root, materialFor(piece.kind), piece.size, piece.position, {
      rotation: piece.rotation,
    });
    markConcept(mesh, piece.purpose);
    created.push(mesh);
    meshes.push(piece.name);
    if (piece.propGhost) propGhostMeshes.push(piece.name);
    if (piece.name.includes("_STBD_")) sectionMeshes.push(piece.name);
  }

  let enabled = true;
  let section = false;

  const applySection = (): void => {
    for (const mesh of created) {
      if (mesh.name.includes("_STBD_")) mesh.setEnabled(enabled && !section);
    }
  };

  return {
    root,
    meshes,
    propGhostMeshes,
    sectionMeshes,
    setEnabled(on: boolean) {
      enabled = on;
      root.setEnabled(on);
      applySection();
    },
    isEnabled() {
      return enabled;
    },
    setSection(on: boolean) {
      section = on;
      applySection();
    },
    isSection() {
      return section;
    },
    setPropGhost(on: boolean) {
      for (const mesh of created) {
        if (propGhostMeshes.includes(mesh.name)) mesh.visibility = on ? 0.12 : 1;
      }
    },
  };
}
