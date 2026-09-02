import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { P } from "../design/parameters";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";
import { extrudeXZ, extrudeYZ, facetStrip, trap, wedge, type V3t } from "./primitives";

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
const COLLAR_Z = P.drive.stowedZ - P.drive.stroke - 0.18;
/** Aft face of the open stern frame. Do not move further into the can stroke. */
const COLLAR_Z_AFT = COLLAR_Z - 0.05;
/** FO1-scale accent lip at the opening. */
const COLLAR_LIP_Z = 0.09;
/** Recessed throat depth forward of the lip; frames bay/posts, does not follow the can aft. */
const COLLAR_THROAT_Z = 0.26;
const COLLAR_Z_LIP = COLLAR_Z_AFT + COLLAR_LIP_Z;
const COLLAR_Z_FWD = COLLAR_Z_LIP + COLLAR_THROAT_Z;
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

type Kind = "hull" | "accent" | "pocket" | "sternLip" | "sternThroat";

function markConcept(node: TransformNode, purpose: string, mass: string): void {
  node.metadata = {
    ...(node.metadata ?? {}),
    presentationOnly: true,
    physical: false,
    authorityStage: "body-shell exploration",
    family: "body-shell-concept",
    conceptId: BODY_CONCEPT_INFO.conceptId,
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

export function createBodyShellConcept(scene: Scene): BodyShellConcept {
  const root = new TransformNode("BODY_SHELL_03_PRESENTATION_ROOT", scene);
  markConcept(root, "Toggleable non-authoritative open-stern chine hull.", "root");

  const hull = new StandardMaterial("matBodyShell03Hull", scene);
  hull.diffuseColor = new Color3(0.16, 0.21, 0.24);
  hull.emissiveColor = new Color3(0.01, 0.02, 0.025);
  hull.specularColor = new Color3(0.07, 0.1, 0.11);
  hull.alpha = 0.88;
  hull.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  hull.backFaceCulling = false;

  // FO1: accent is station-frame language (lips/sill/web). Unchanged by SO1.
  const accent = hull.clone("matBodyShell03Accent");
  accent.diffuseColor = new Color3(0.33, 0.26, 0.13);
  accent.emissiveColor = new Color3(0.032, 0.016, 0.004);
  accent.alpha = 0.9;

  const pocket = hull.clone("matBodyShell03Pocket");
  pocket.diffuseColor = new Color3(0.1, 0.1, 0.095);
  pocket.emissiveColor = new Color3(0.006, 0.005, 0.004);
  pocket.specularColor = new Color3(0.05, 0.05, 0.045);
  pocket.alpha = 0.92;

  // SO1 director revision: collar-only values. Darker throat / brighter lip so
  // the portal reads in stock DRIVE 3/4 and rear. FO1 station materials stay put.
  const sternThroat = hull.clone("matBodyShell03SternThroat");
  sternThroat.diffuseColor = new Color3(0.035, 0.038, 0.042);
  sternThroat.emissiveColor = new Color3(0.001, 0.002, 0.002);
  sternThroat.specularColor = new Color3(0.03, 0.03, 0.032);
  sternThroat.alpha = 0.96;

  const sternLip = hull.clone("matBodyShell03SternLip");
  sternLip.diffuseColor = new Color3(0.5, 0.36, 0.12);
  sternLip.emissiveColor = new Color3(0.06, 0.03, 0.006);
  sternLip.specularColor = new Color3(0.16, 0.11, 0.04);
  sternLip.alpha = 0.96;

  const created: Mesh[] = [];
  const meshes: string[] = [];
  const propGhostMeshes: string[] = [];
  const sectionMeshes: string[] = [];

  const add = (mesh: Mesh, kind: Kind, mass: string, purpose: string, ghost = false): void => {
    mesh.material =
      kind === "sternLip" ? sternLip : kind === "sternThroat" ? sternThroat : kind === "accent" ? accent : kind === "pocket" ? pocket : hull;
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
    const xProwTip = hand * 0.44;

    add(
      extrudeXZ(
        scene,
        sideName("VENTRAL_HULL", hand),
        root,
        hull,
        [
          [0, COLLAR_Z_AFT],
          [xOut, COLLAR_Z_AFT],
          [xOut, 4.15],
          [xProwTip, PROW_Z],
          [0, PROW_Z],
        ],
        BELLY_Y0,
        BELLY_Y1,
      ),
      "hull",
      "ventral hull",
      "Ventral hull / belly in the same faceted language as the chine, tapering at the prow.",
    );

    add(
      extrudeYZ(
        scene,
        sideName("CHINE_FWD", hand),
        root,
        hull,
        [
          [BELLY_Y0, BAY_Z],
          [BELLY_Y0, P.fl.z],
          [BELLY_Y0 + 0.04, PROW_Z],
          [1.34, PROW_Z],
          [1.7, P.fl.z],
          [1.9, 0.55],
          [bayY, BAY_Z],
        ],
        xOut,
        xIn,
      ),
      "hull",
      "chine walls",
      "Forward chine / gunwale: quiet spine through the lower front station; the station frame, not this wall, marks the receiving opening.",
    );

    add(
      extrudeYZ(
        scene,
        sideName("CHINE_AFT", hand),
        root,
        hull,
        [
          [BELLY_Y0, COLLAR_Z_FWD],
          [BELLY_Y0, BAY_Z],
          [bayY, BAY_Z],
          [2.16, P.rl.z],
          [1.62, -3.45],
          [gunwaleY(COLLAR_Z_FWD), COLLAR_Z_FWD],
        ],
        xOut,
        xIn,
      ),
      "hull",
      "chine walls",
      "Aft chine: quiet spine through the higher rear station, then terminating into the open stern portal.",
      true,
    );

    const deckFwd: V3t[][] = [];
    const deckAft: V3t[][] = [];
    const zFwdDeck = [PROW_Z, 4.2, P.fl.z, 0.55, BAY_Z];
    const zAftDeck = [BAY_Z, P.rl.z, -3.45, COLLAR_Z_FWD];
    for (const z of zFwdDeck) {
      const y = gunwaleY(z) + 0.02;
      deckFwd.push([
        [0, y, z],
        [xOut, y, z],
        [xOut, y + 0.12, z],
        [0, y + 0.12, z],
      ]);
    }
    for (const z of zAftDeck) {
      const y = gunwaleY(z) + 0.02;
      deckAft.push([
        [xSlot, y, z],
        [xOut, y, z],
        [xOut, y + 0.12, z],
        [xSlot, y + 0.12, z],
      ]);
    }
    add(
      facetStrip(scene, sideName("DORSAL_DECK_FWD", hand), root, hull, deckFwd),
      "hull",
      "dorsal deck",
      "Dorsal deck from prow to bay mouth; one continuous top surface with the chine.",
    );
    add(
      facetStrip(scene, sideName("DORSAL_DECK_AFT", hand), root, hull, deckAft),
      "hull",
      "dorsal deck",
      "Split dorsal shoulder over propulsion, leaving a centerline service opening.",
      true,
    );

    const prowAft: [V3t, V3t, V3t, V3t] = [
      [0, BELLY_Y1, P.keel.zFwd],
      [xOut, BELLY_Y1, P.keel.zFwd],
      [xOut, gunwaleY(P.keel.zFwd), P.keel.zFwd],
      [0, gunwaleY(P.keel.zFwd) - 0.06, P.keel.zFwd],
    ];
    const prowFwd: [V3t, V3t, V3t, V3t] = [
      [0, BELLY_Y1 + 0.04, PROW_Z],
      [xProwTip, BELLY_Y1 + 0.04, PROW_Z],
      [hand * 0.38, 1.28, PROW_Z - 0.04],
      [0, 1.26, PROW_Z - 0.04],
    ];
    add(
      trap(scene, sideName("PROW", hand), root, hull, prowAft, prowFwd),
      "hull",
      "wedge prow",
      "Wedge prow occupying the reserved front volume; not a canopy or intake.",
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
      "Forward receiving shoulder: lip–recess–sill frame at the frozen front hinge station.",
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
      "Rear receiving shoulder: same lip–recess–sill family at the higher frozen rear hinge station.",
    );

    // SO1: same conceptual mass. Throat is the recessed portal; lip is the
    // opening frame. Deepens forward only. Opening X/Y toward the can is unchanged.
    add(
      extrudeYZ(
        scene,
        sideName("COLLAR_SIDE", hand),
        root,
        pocket,
        [
          [0.22, COLLAR_Z_LIP],
          [0.22, COLLAR_Z_FWD],
          [1.34, COLLAR_Z_FWD],
          [1.34, COLLAR_Z_LIP],
        ],
        xOut,
        xIn,
      ),
      "sternThroat",
      "open stern collar",
      "Recessed stern-throat side; the chine becomes a portal here, not a hoop around the can.",
      true,
    );
    add(
      extrudeYZ(
        scene,
        sideName("COLLAR_SIDE_LIP", hand),
        root,
        accent,
        [
          [0.22, COLLAR_Z_AFT],
          [0.22, COLLAR_Z_LIP],
          [1.34, COLLAR_Z_LIP],
          [1.34, COLLAR_Z_AFT],
        ],
        xOut,
        xIn,
      ),
      "sternLip",
      "open stern collar",
      "Accent lip of the open stern frame; owns the opening, does not cover the handover.",
      true,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_LINTEL", hand),
        root,
        pocket,
        [
          [0, COLLAR_Z_LIP],
          [xOut, COLLAR_Z_LIP],
          [xOut, COLLAR_Z_FWD],
          [0, COLLAR_Z_FWD],
        ],
        1.26,
        1.4,
      ),
      "sternThroat",
      "open stern collar",
      "Recessed stern-throat lintel; header of the portal, thickened upward away from the can.",
      true,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_LINTEL_LIP", hand),
        root,
        accent,
        [
          [0, COLLAR_Z_AFT],
          [xOut, COLLAR_Z_AFT],
          [xOut, COLLAR_Z_LIP],
          [0, COLLAR_Z_LIP],
        ],
        1.26,
        1.4,
      ),
      "sternLip",
      "open stern collar",
      "Accent lintel lip above the open throat; propulsion handover stays visible below.",
      true,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_SILL", hand),
        root,
        pocket,
        [
          [0, COLLAR_Z_LIP],
          [xOut, COLLAR_Z_LIP],
          [xOut, COLLAR_Z_FWD],
          [0, COLLAR_Z_FWD],
        ],
        0.12,
        0.26,
      ),
      "sternThroat",
      "open stern collar",
      "Recessed stern-throat sill joining the ventral hull to the portal.",
      true,
    );
    add(
      extrudeXZ(
        scene,
        sideName("COLLAR_SILL_LIP", hand),
        root,
        accent,
        [
          [0, COLLAR_Z_AFT],
          [xOut, COLLAR_Z_AFT],
          [xOut, COLLAR_Z_LIP],
          [0, COLLAR_Z_LIP],
        ],
        0.12,
        0.26,
      ),
      "sternLip",
      "open stern collar",
      "Accent sill lip of the open stern frame.",
      true,
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
  add: (mesh: Mesh, kind: Kind, mass: string, purpose: string, ghost?: boolean) => void,
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
  const lipZ = 0.09;
  const sillH = 0.07;
  const span = fwdExtent + aftExtent;
  const webHalf = Math.max(0.1, span * 0.5 - lipZ);

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
    `${purpose} Forward lip of the receiving frame; continues the chine into the station.`,
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
    `${purpose} Aft lip of the receiving frame.`,
  );
  const face = extrudeYZ(
    scene,
    sideName(`${stem}_FACE`, hand),
    root,
    lining,
    [
      [yBot + sillH, z0 + lipZ],
      [yBot + sillH, z1 - lipZ],
      [yTop, z1 - lipZ],
      [yTop, z0 + lipZ],
    ],
    xChine,
    xFace,
  );
  face.metadata = { ...(face.metadata ?? {}), dockX: xFace };
  add(face, "pocket", mass, `${purpose} Recessed bay face; folios remain proud of the lip.`);
  add(
    extrudeYZ(
      scene,
      sideName(`${stem}_SILL`, hand),
      root,
      lining,
      [
        [yBot, z0 + lipZ],
        [yBot, z1 - lipZ],
        [yBot + sillH, z1 - lipZ],
        [yBot + sillH, z0 + lipZ],
      ],
      xFace,
      xLip,
    ),
    "accent",
    mass,
    `${purpose} Sill joining the two lips; the lower datum of the bay.`,
  );
  add(
    wedge(
      scene,
      sideName(`${stem}_WEB`, hand),
      root,
      lining,
      [
        [xChine, yTop, z - webHalf],
        [xFace, yTop, z - webHalf],
        [xFace * 0.55 + xChine * 0.45, hingeY - 0.03, z],
      ],
      [
        [xChine, yTop, z + webHalf],
        [xFace, yTop, z + webHalf],
        [xFace * 0.55 + xChine * 0.45, hingeY - 0.03, z],
      ],
    ),
    "accent",
    mass,
    `${purpose} Short frame web to the frozen hinge; presents the root, does not replace it.`,
  );
}
