import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { P } from "../design/parameters";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";
import { extrudeXZ, extrudeYZ, trap, type V3t } from "./primitives";
import { bodyClosedLoft, bodyPyramid, finishBodySurface } from "./bodyShellGeometry";

export const BODY_GUTTER = 0.1;

export interface BodyShellConcept {
  root: TransformNode;
  meshes: string[];
  propGhostMeshes: string[];
  sectionMeshes: string[];
  masses: readonly string[];
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
  setSection(on: boolean): void;
  isSection(): boolean;
  setPropGhost(on: boolean): void;
}

const CHINE_X = P.keel.halfWidth;
const WALL_T = 0.14;
const SLOT_X = 0.36;
const BELLY_Y0 = 0.08;
const BELLY_Y1 = 0.2;
const PROW_Z = P.keel.zFwd + 0.48;
const BELLY_TAPER_Z = 4.15;
const PROW_TIP_X = 0.44;
const PROW_UPPER_X = 0.38;
const PROW_BEVEL = 0.04;
const FLANGE_START_Z = BELLY_TAPER_Z + WALL_T / (CHINE_X - PROW_TIP_X) * (PROW_Z - BELLY_TAPER_Z);
const FRONT_RETURN_Z = PROW_Z - 2 * PROW_BEVEL;
const COLLAR_Z = P.drive.stowedZ - P.drive.stroke - 0.18;
const BAY_Z = P.bay.zFwd;
const HANDS = [-1, 1] as const;

const MASSES = [
  "wedge prow",
  "ventral hull",
  "chine walls",
  "dorsal deck",
  "forward book-pocket haunches",
  "rear book-pocket haunches",
  "open stern collar",
] as const;

type Kind = "hull" | "accent" | "pocket";

function markConcept(node: TransformNode, purpose: string, mass: string): void {
  node.metadata = {
    ...(node.metadata ?? {}),
    presentationOnly: true,
    physical: false,
    authorityStage: "body-shell exploration",
    family: "body-shell-concept",
    conceptId: BODY_CONCEPT_INFO.conceptId,
    surfaceRevision: BODY_CONCEPT_INFO.surfaceRevision,
    mass,
    purpose,
  };
}

function sideName(stem: string, hand: number): string {
  return `BODY_${stem}_${hand < 0 ? "PORT" : "STBD"}_VIS`;
}

function gunwaleY(z: number): number {
  const pts: Array<[number, number]> = [
    [PROW_Z, 1.34],
    [P.fl.z, 1.7],
    [0.55, 1.9],
    [P.rl.z, 2.16],
    [-3.45, 1.62],
    [COLLAR_Z, 1.3],
  ];
  if (z >= pts[0][0]) return pts[0][1];
  if (z <= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [z0, y0] = pts[i];
    const [z1, y1] = pts[i + 1];
    if (z <= z0 && z >= z1) {
      const t = (z0 - z) / (z0 - z1);
      return y0 + t * (y1 - y0);
    }
  }
  return 1.7;
}

/** One continuous chine boundary, including only the local forebody returns. */
function forwardChineRows(hand: number): V3t[][] {
  const xOut = hand * CHINE_X;
  const xIn = hand * (CHINE_X - WALL_T);
  const rows: V3t[][] = [[
    [hand * PROW_TIP_X, BELLY_Y0 + 0.04, PROW_Z],
    [xOut, BELLY_Y0 + 0.04, PROW_Z],
    [xOut, gunwaleY(PROW_Z), PROW_Z],
    [hand * PROW_UPPER_X, gunwaleY(PROW_Z - PROW_BEVEL), PROW_Z - PROW_BEVEL],
    [hand * PROW_TIP_X, BELLY_Y1, PROW_Z],
    [hand * PROW_TIP_X, BELLY_Y1, PROW_Z],
  ]];
  for (const z of [FRONT_RETURN_Z, FLANGE_START_Z, BELLY_TAPER_Z, P.fl.z, 0.55, BAY_Z]) {
    const floorY = BELLY_Y0 + Math.max(0, (z - P.fl.z) / (PROW_Z - P.fl.z)) * 0.04;
    const bellyX = CHINE_X - (CHINE_X - PROW_TIP_X) * (z - BELLY_TAPER_Z) / (PROW_Z - BELLY_TAPER_Z);
    // Use the exact common corner at the flange start, rather than leaving a
    // floating-point sliver between the vertical wall and the new return.
    const xBottom = z <= FLANGE_START_Z ? xIn : hand * bellyX;
    rows.push([
      [xBottom, floorY, z],
      [xOut, floorY, z],
      [xOut, gunwaleY(z), z],
      [xIn, gunwaleY(z), z],
      [xIn, BELLY_Y1, z],
      [xBottom, BELLY_Y1, z],
    ]);
  }
  return rows;
}

export function createBodyShellConcept(scene: Scene): BodyShellConcept {
  const root = new TransformNode("BODY_SHELL_03_PRESENTATION_ROOT", scene);
  markConcept(root, "Toggleable non-authoritative open-stern chine hull.", "root");

  const hull = new StandardMaterial("matBodyShell03Hull", scene);
  hull.diffuseColor = new Color3(0.16, 0.21, 0.24);
  hull.emissiveColor = new Color3(0.01, 0.02, 0.025);
  hull.specularColor = new Color3(0.07, 0.1, 0.11);
  hull.alpha = 1;
  // Automatic classification keeps normal BODY opaque while explicit PROP
  // SECTION can still ghost selected meshes through their visibility value.
  hull.transparencyMode = null;
  hull.backFaceCulling = true;

  const accent = hull.clone("matBodyShell03Accent");
  accent.diffuseColor = new Color3(0.42, 0.32, 0.14);
  accent.emissiveColor = new Color3(0.05, 0.025, 0.005);
  accent.alpha = 1;

  const pocket = hull.clone("matBodyShell03Pocket");
  pocket.diffuseColor = new Color3(0.26, 0.25, 0.22);
  pocket.emissiveColor = new Color3(0.018, 0.014, 0.01);
  pocket.specularColor = new Color3(0.1, 0.09, 0.07);
  pocket.alpha = 1;

  const created: Mesh[] = [];
  const meshes: string[] = [];
  const propGhostMeshes: string[] = [];
  const sectionMeshes: string[] = [];

  const add = (mesh: Mesh, kind: Kind, mass: string, purpose: string, ghost = false, reverseWinding = false): void => {
    finishBodySurface(mesh, reverseWinding);
    mesh.material = kind === "accent" ? accent : kind === "pocket" ? pocket : hull;
    markConcept(mesh, purpose, mass);
    created.push(mesh);
    meshes.push(mesh.name);
    if (ghost) propGhostMeshes.push(mesh.name);
    if (mesh.name.includes("_STBD_")) sectionMeshes.push(mesh.name);
  };

  const bayY = gunwaleY(BAY_Z);

  for (const hand of HANDS) {
    const xOut = hand * CHINE_X;
    const xIn = hand * (CHINE_X - WALL_T);
    const xSlot = hand * SLOT_X;
    const xProwTip = hand * PROW_TIP_X;

    add(
      extrudeXZ(
        scene,
        sideName("VENTRAL_HULL", hand),
        root,
        hull,
        [
          [0, COLLAR_Z],
          [xOut, COLLAR_Z],
          [xOut, BELLY_TAPER_Z],
          [xProwTip, PROW_Z],
          [0, PROW_Z],
        ],
        BELLY_Y0,
        BELLY_Y1,
      ),
      "hull",
      "ventral hull",
      "Ventral hull / belly in the same faceted language as the chine, tapering at the prow.",
      false,
      hand < 0,
    );

    const forwardChine = bodyClosedLoft(scene, sideName("CHINE_FWD", hand), root, accent, forwardChineRows(hand), 1);
    forwardChine.metadata = {
      ...(forwardChine.metadata ?? {}),
      forebodyJoin: {
        bellyTaperStartZ: BELLY_TAPER_Z,
        flangeStartZ: FLANGE_START_Z,
        returnStartZ: FRONT_RETURN_Z,
        upperNoseZ: PROW_Z - PROW_BEVEL,
        lowerNoseZ: PROW_Z,
        bellyContactY: BELLY_Y1,
      },
    };
    add(
      forwardChine,
      "accent",
      "chine walls",
      "Forward chine with bounded belly and nose returns joining the prow to the deck; the side cavity remains open aft of the return.",
      false,
      hand < 0,
    );

    add(
      extrudeYZ(
        scene,
        sideName("CHINE_AFT", hand),
        root,
        accent,
        [
          [BELLY_Y0, COLLAR_Z],
          [BELLY_Y0, BAY_Z],
          [bayY, BAY_Z],
          [2.16, P.rl.z],
          [1.62, -3.45],
          [1.3, COLLAR_Z],
        ],
        xOut,
        xIn,
      ),
      "accent",
      "chine walls",
      "Aft chine rising through the higher rear book station, then dropping into the open stern.",
      true,
    );

    const deckFwd: V3t[][] = [];
    const deckAft: V3t[][] = [];
    const zFwdDeck = [PROW_Z, 4.2, P.fl.z, 0.55, BAY_Z];
    const zAftDeck = [BAY_Z, P.rl.z, -3.45, COLLAR_Z];
    for (const z of zFwdDeck) {
      const y = gunwaleY(z);
      deckFwd.push([
        [0, y, z],
        [xOut, y, z],
        [xOut, y + 0.14, z],
        [0, y + 0.14, z],
      ]);
    }
    for (const z of zAftDeck) {
      const y = gunwaleY(z);
      deckAft.push([
        [xSlot, y, z],
        [xOut, y, z],
        [xOut, y + 0.14, z],
        [xSlot, y + 0.14, z],
      ]);
    }
    add(
      bodyClosedLoft(scene, sideName("DORSAL_DECK_FWD", hand), root, hull, deckFwd),
      "hull",
      "dorsal deck",
      "Dorsal deck from prow to bay mouth; one continuous top surface with the chine.",
      false,
      hand < 0,
    );
    add(
      bodyClosedLoft(scene, sideName("DORSAL_DECK_AFT", hand), root, hull, deckAft),
      "hull",
      "dorsal deck",
      "Split dorsal shoulder over propulsion, leaving a centerline service opening.",
      true,
      hand < 0,
    );

    const prowAft: [V3t, V3t, V3t, V3t] = [
      [0, BELLY_Y1, P.keel.zFwd],
      [xOut, BELLY_Y1, P.keel.zFwd],
      [xOut, gunwaleY(P.keel.zFwd), P.keel.zFwd],
      [0, gunwaleY(P.keel.zFwd), P.keel.zFwd],
    ];
    const prowFwd: [V3t, V3t, V3t, V3t] = [
      [0, BELLY_Y1, PROW_Z],
      [xProwTip, BELLY_Y1, PROW_Z],
      [hand * PROW_UPPER_X, gunwaleY(PROW_Z - PROW_BEVEL), PROW_Z - PROW_BEVEL],
      [0, gunwaleY(PROW_Z - PROW_BEVEL), PROW_Z - PROW_BEVEL],
    ];
    add(
      trap(scene, sideName("PROW", hand), root, hull, prowAft, prowFwd),
      "hull",
      "wedge prow",
      "Wedge prow occupying the reserved front volume; not a canopy or intake.",
      false,
      hand < 0,
    );

    addPocket(
      scene,
      root,
      add,
      pocket,
      hand,
      "FWD",
      "forward book-pocket haunches",
      P.fl.z,
      P.fl.y,
      0.14,
      0.36,
      1.18,
      0.16,
      "Forward book pocket grown along the chine at the frozen front hinge station.",
    );
    addPocket(
      scene,
      root,
      add,
      pocket,
      hand,
      "AFT",
      "rear book-pocket haunches",
      P.rl.z,
      P.rl.y,
      0.18,
      0.4,
      1.5,
      0.22,
      "Rear book pocket grown along the chine at the frozen rear hinge station.",
    );

    add(
      extrudeYZ(
        scene,
        sideName("COLLAR_SIDE", hand),
        root,
        accent,
        [
          [0.22, COLLAR_Z - 0.05],
          [0.22, COLLAR_Z + 0.1],
          [1.32, COLLAR_Z + 0.1],
          [1.32, COLLAR_Z - 0.05],
        ],
        xOut,
        xIn,
      ),
      "accent",
      "open stern collar",
      "Open stern collar side; frames the seated-can mouth without capping it.",
      true,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_LINTEL", hand),
        root,
        accent,
        [
          [0, COLLAR_Z - 0.05],
          [xOut, COLLAR_Z - 0.05],
          [xOut, COLLAR_Z + 0.1],
          [0, COLLAR_Z + 0.1],
        ],
        1.26,
        1.36,
      ),
      "accent",
      "open stern collar",
      "Open stern collar lintel above the can; propulsion handover stays visible below.",
      true,
      hand < 0,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_SILL", hand),
        root,
        accent,
        [
          [0, COLLAR_Z - 0.05],
          [xOut, COLLAR_Z - 0.05],
          [xOut, COLLAR_Z + 0.1],
          [0, COLLAR_Z + 0.1],
        ],
        0.18,
        0.26,
      ),
      "accent",
      "open stern collar",
      "Open stern collar sill joining the ventral hull to the propulsion frame.",
      true,
      hand < 0,
    );
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
    masses: MASSES,
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

function addPocket(
  scene: Scene,
  root: TransformNode,
  add: (mesh: Mesh, kind: Kind, mass: string, purpose: string, ghost?: boolean, reverseWinding?: boolean) => void,
  lining: Material,
  hand: number,
  stem: "FWD" | "AFT",
  mass: string,
  z: number,
  hingeY: number,
  aftExtent: number,
  fwdExtent: number,
  yBot: number,
  reach: number,
  purpose: string,
): void {
  const xChine = hand * CHINE_X;
  const xLip = hand * (CHINE_X + reach);
  const recess = 0.07;
  const xFace = hand * (CHINE_X + Math.max(0.05, reach - recess));
  const yTop = hingeY - 0.12;
  const z0 = z - aftExtent;
  const z1 = z + fwdExtent;
  const lipZ = 0.07;

  add(
    extrudeYZ(
      scene,
      sideName(`${stem}_LIP_FWD`, hand),
      root,
      lining,
      [
        [yBot, z0],
        [yBot, z0 + lipZ],
        [yTop, z0 + lipZ],
        [yTop, z0],
      ],
      xChine,
      xLip,
    ),
    "accent",
    mass,
    `${purpose} Forward chine lip of the socket.`,
  );
  add(
    extrudeYZ(
      scene,
      sideName(`${stem}_LIP_AFT`, hand),
      root,
      lining,
      [
        [yBot, z1 - lipZ],
        [yBot, z1],
        [yTop, z1],
        [yTop, z1 - lipZ],
      ],
      xChine,
      xLip,
    ),
    "accent",
    mass,
    `${purpose} Aft chine lip of the socket.`,
  );
  const face = extrudeYZ(
    scene,
    sideName(`${stem}_FACE`, hand),
    root,
    lining,
    [
      [yBot + 0.05, z0 + lipZ],
      [yBot + 0.05, z1 - lipZ],
      [yTop, z1 - lipZ],
      [yTop, z0 + lipZ],
    ],
    xChine,
    xFace,
  );
  face.metadata = { ...(face.metadata ?? {}), dockX: xFace };
  add(face, "pocket", mass, `${purpose} Recessed dock face; books remain proud of the chine lip.`);
  add(
    extrudeYZ(
      scene,
      sideName(`${stem}_SILL`, hand),
      root,
      lining,
      [
        [yBot, z0 + lipZ],
        [yBot, z1 - lipZ],
        [yBot + 0.05, z1 - lipZ],
        [yBot + 0.05, z0 + lipZ],
      ],
      xFace,
      xLip,
    ),
    "accent",
    mass,
    `${purpose} Socket sill joining the two chine lips.`,
  );
  const webHalf = Math.min(0.14, (fwdExtent + aftExtent) * 0.22);
  add(
    bodyPyramid(
      scene,
      sideName(`${stem}_WEB`, hand),
      root,
      lining,
      [
        [xChine, yTop, z - webHalf],
        [xFace, yTop, z - webHalf],
        [xFace, yTop, z + webHalf],
        [xChine, yTop, z + webHalf],
      ],
      [xFace * 0.55 + xChine * 0.45, hingeY - 0.03, z],
    ),
    "pocket",
    mass,
    `${purpose} Short wedge web to the frozen hinge; does not replace certified structure.`,
    false,
    hand < 0,
  );
}
