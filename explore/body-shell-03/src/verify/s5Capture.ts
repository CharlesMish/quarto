import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import {
  S5P,
  S5_CONTACT,
  S5_DOG_IDS,
  S5_FLOW_JOINT_CLEARANCE,
  S5_LOCK_EXTEND,
  S5_LOCK_PIN_RETRACT_X,
  S5_LOCK_PIN_RETRACT_Y_TOP,
  S5_MIN_INSERTION,
  S5_REGISTER_MOUTH_BAND,
  S5_REGISTER_RADIAL,
  S5_RETAINED_INSERTION_MIN,
  S5_REVERSE_LEAD_MIN,
  S5_TRACK_FREEPLAY_MAX,
  S5_TRACK_RUN_CLEARANCE,
  s5FollowerZ,
  s5TrackBoundsAtZ,
  s5TrackLayout,
  s5TrackSegment,
  s5TrackUFromZ,
  type S5DogId,
} from "../design/s5Parameters";
import { P } from "../design/parameters";
import type { AuthoritySolid } from "../machine/authority";
import {
  auditS5AuthorityIdentity,
  getS5AuthorityIdentityBinding,
  registrationIdOf,
  type S5AuthorityIdentityAudit,
  type S5AuthorityIdentityBinding,
  type S5RegisteredAuthoritySolid,
} from "../machine/s5Identity";
import { isS5MaterialRegistration, meshEnabled } from "../machine/s5Authority";
import type { MachineRig } from "../machine/types";
import { obbOverlaps, obbSeparation, obbWorldAabb, type OBB } from "../math/obb";
import { evaluateDriveReadiness } from "./capturePredicates";

export function isS5Material(s: AuthoritySolid): boolean {
  return isS5MaterialRegistration(registrationIdOf(s), s.role, meshEnabled(s.node));
}

interface S5ProofEdgeReport {
  fromRegistrationId: string;
  toRegistrationId: string;
  from: string;
  to: string;
  sep: number;
}

export interface S5PathCertificate {
  valid: boolean;
  samples: number;
  pairsEvaluated: number;
  firstHit: string;
  firstHitRegistrationIds: string[];
  minPinBacking: number;
  minShoeBacking: number;
  minShoeRail: number;
  reverseLead: Record<S5DogId, { returnTravel: number; shoulderTravel: number; lead: number }>;
  reverseShoulderClearanceLead: Record<
    S5DogId,
    {
      returnContactTravel: number;
      shoulderClearTravel: number;
      shoulderConflictTravel: number;
      lead: number;
      clearInsertion: number;
      tongueInsertionAtClear: number;
      exitTravel: number;
      finalExtension: number;
    }
  >;
  retainedWorst: Record<S5DogId, number>;
  passiveForward: boolean;
  passiveReverse: boolean;
  entryValid: boolean;
  entryRange: {
    driveT0: number;
    driveT1: number;
    sampleStep: number;
    lastClearDriveT: number;
    firstContactDriveT: number;
    lastSampledPreContactSeparation: number;
  };
  forwardEndpoint: Record<S5DogId, { extension: number; insertion: number; aSide: number; bSide: number }>;
  requiredPieceTopology: Record<
    S5DogId,
    { moving: string[]; faceA: string[]; faceB: string[]; support: string[] }
  >;
  inventory: {
    method: "FULL_MOTION_SAMPLED_UNION";
    proofIdentity: "registrationId";
    identityPreflightPassed: boolean;
    requiredTopologyProjected: boolean;
    registeredRows: number;
    registrationIdsUnique: boolean;
    namesUnique: boolean;
    duplicateRegistrationIds: S5AuthorityIdentityAudit["duplicateRegistrationIds"];
    duplicateNames: S5AuthorityIdentityAudit["duplicateNames"];
    metadataIdentityMismatches: S5AuthorityIdentityAudit["metadataMismatches"];
    physicalUniverse: string[];
    physicalUniverseRegistrationIds: string[];
    moving: string[];
    fixed: string[];
    relevant: string[];
    relevantRegistrationIds: string[];
    capturedRelevant: string[];
    pathAdded: string[];
    pathAddedRegistrationIds: string[];
    approvedSurrounding: string[];
    approvedSurroundingRegistrationIds: string[];
    unclassified: string[];
    unclassifiedRegistrationIds: string[];
    invalidClassification: string[];
    conflictingClassification: string[];
    missingRequired: string[];
    missingRequiredRegistrationIds: string[];
    collisionScope: string[];
    collisionScopeRegistrationIds: string[];
    lifetimeRows: S5AuthorityLifetimeRow[];
    complete: boolean;
  };
  pairProof: {
    identity: "registrationId";
    movingFixed: number;
    movingSurrounding: number;
    movingMoving: number;
    foreignRail: number;
    movingMovingPairs: string[];
  };
  intentionalContactTable: {
    immutable: true;
    rules: typeof S5_INTENTIONAL_CONTACT_RULES;
    relations: S5IntentionalContactRelation[];
    instantiatedRelations: number;
    missingRelationRows: string[];
    pass: boolean;
  };
  analyticComparison: { maxDeviation: number; tolerance: number; pass: boolean };
  supportContinuity: boolean;
  phases: string[];
  detail: string;
}

export interface S5AuthorityLifetimeRow {
  registrationId: string;
  name: string;
  family: string;
  role: string;
  moving: boolean;
  assembly?: string;
  subsystem?: string;
  classification:
    | "required-moving-lock"
    | "required-fixed-track"
    | "expected-surrounding"
    | "declared-nc-moving"
    | "declared-nc-fixed"
    | "unclassified"
    | "invalid"
    | "conflicting";
  firstRelevant: {
    sample: number;
    stage: "PREREQUISITE" | "FORWARD" | "REVERSE";
    phase: ReturnType<typeof s5TrackBoundsAtZ>["phase"];
    driveT: number;
    enabled: boolean;
    aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  };
}

export interface S5IntentionalContactRelation {
  rule: (typeof S5_INTENTIONAL_CONTACT_RULES)[number];
  aRegistrationId: string;
  aName: string;
  bRegistrationId: string;
  bName: string;
}

export const S5_INTENTIONAL_CONTACT_RULES = Object.freeze([
  "CAM_SHOE_TO_SECTOR_RAIL_B_FORWARD_OR_CAPTURED",
  "CAM_SHOE_TO_SECTOR_RAIL_A_REVERSE_OR_CAPTURED",
  "CAM_SHOE_TO_OPPOSITE_FACE_NONPENETRATING",
  "LOCK_PIN_TO_SECTOR_SHOULDER_RETAINED_ESCAPE_PROBE",
  "RAIL_FACE_TO_DECLARED_BACKING_STRUCTURAL_SPLICE",
  "SHOULDER_TO_DECLARED_WEB_STRUCTURAL_SPLICE",
  "WEB_TO_RECEIVER_POST_FRAME_KEEL_CHAIN",
  "SEAT_TONGUE_TO_DECLARED_RECEIVER_CAVITY",
  "FIXED_SPIGOT_TO_MOVING_RECEIVER_NESTED_INTERFACE",
] as const);

const TRACK_PIECES = ["MOUTH", "LEAD", "TRANSITION", "CAM_ENTRY", "CAM", "CAM_EXIT", "CAPTURE"] as const;
const POCKET_WALL_NAMES: Record<S5DogId, readonly string[]> = {
  PORT: ["S5_POCKET_PORT_OUTER", "S5_POCKET_PORT_TOP", "S5_POCKET_PORT_BOT", "S5_POCKET_PORT_AFT"],
  STARBOARD: ["S5_POCKET_STARBOARD_OUTER", "S5_POCKET_STARBOARD_TOP", "S5_POCKET_STARBOARD_BOT", "S5_POCKET_STARBOARD_AFT"],
  TOP_PORT: ["S5_POCKET_TOP_PORT_OUTER", "S5_POCKET_TOP_PORT_PORT", "S5_POCKET_TOP_PORT_STBD", "S5_POCKET_TOP_PORT_AFT"],
  TOP_STARBOARD: ["S5_POCKET_TOP_STARBOARD_OUTER", "S5_POCKET_TOP_STARBOARD_PORT", "S5_POCKET_TOP_STARBOARD_STBD", "S5_POCKET_TOP_STARBOARD_AFT"],
};

function requiredTopology(id: S5DogId): S5PathCertificate["requiredPieceTopology"][S5DogId] {
  const top = id === "TOP_PORT" || id === "TOP_STARBOARD";
  return {
    moving: [`S5_LOCK_PIN_${id}`, `S5_LOCK_CAM_SHOE_${id}`],
    faceA: TRACK_PIECES.map((piece) => `S5_LOCK_RAIL_A_${id}_${piece}`),
    faceB: TRACK_PIECES.map((piece) => `S5_LOCK_RAIL_B_${id}_${piece}`),
    support: [
      `S5_LOCK_RECV_${id}`,
      `S5_LOCK_GUIDE_A_${id}`,
      `S5_LOCK_GUIDE_B_${id}`,
      `S5_LOCK_SHOULDER_${id}`,
      ...(top
        ? [
            `S5_LOCK_TRACK_BACK_AFT_${id}`,
            `S5_LOCK_TRACK_BACK_${id}`,
            `S5_LOCK_TRACK_BACK_MOUTH_${id}`,
            `S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_${id}`,
          ]
        : [`S5_LOCK_TRACK_BACK_${id}`]),
      `S5_LOCK_WEB_${id}`,
      `S5_LOCK_POST_${id}`,
    ],
  };
}

export const S5_REQUIRED_TRACK_TOPOLOGY = Object.fromEntries(
  S5_DOG_IDS.map((id) => [id, requiredTopology(id)]),
) as S5PathCertificate["requiredPieceTopology"];

const pathCerts = new WeakMap<object, S5PathCertificate>();
const pathCertStates = new WeakMap<object, "ABSENT" | "STALE" | "CURRENT">();

export function getPathCertificate(rig: MachineRig): S5PathCertificate | undefined {
  return pathCerts.get(rig);
}

export function setPathCertificate(rig: MachineRig, cert: S5PathCertificate): void {
  pathCerts.set(rig, cert);
  pathCertStates.set(rig, "CURRENT");
}

export function invalidatePathCertificate(rig: MachineRig): void {
  pathCerts.delete(rig);
  pathCertStates.set(rig, "ABSENT");
}

export function markPathCertificateStale(rig: MachineRig): void {
  pathCerts.delete(rig);
  pathCertStates.set(rig, "STALE");
}

export function getPathCertificateState(rig: MachineRig): "ABSENT" | "STALE" | "CURRENT" {
  if (pathCerts.has(rig)) return "CURRENT";
  return pathCertStates.get(rig) ?? "STALE";
}

function assemblyOf(s: AuthoritySolid): string | undefined {
  return (s.node as { metadata?: { assembly?: string } }).metadata?.assembly;
}

export function isMovingLockSolid(s: AuthoritySolid): boolean {
  return assemblyOf(s) === "MOVING_LOCK_ASSEMBLY";
}

export function isFixedTrackSolid(s: AuthoritySolid): boolean {
  return assemblyOf(s) === "FIXED_TRACK_ASSEMBLY";
}

function inLockTrackSubsystem(s: AuthoritySolid): boolean {
  return (s.node as { metadata?: { subsystem?: string } }).metadata?.subsystem === "S5_LOCK_TRACK_SUBSYSTEM";
}

type S5WorldSolid = S5RegisteredAuthoritySolid & { obb: OBB };

function s5WorldOf(rig: MachineRig): S5WorldSolid[] {
  return rig.worldSolids() as S5WorldSolid[];
}

const LOCK_CORRIDOR_REGIONS: Record<S5DogId, { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }> = {
  PORT: { min: { x: -0.561, y: 0.518, z: -4.5895 }, max: { x: -0.461, y: 0.578, z: -4.5345 } },
  STARBOARD: { min: { x: 0.461, y: 0.518, z: -4.5895 }, max: { x: 0.561, y: 0.578, z: -4.5345 } },
  TOP_PORT: { min: { x: -0.415, y: 1.1655, z: -4.5895 }, max: { x: -0.345, y: 1.2205, z: -4.5345 } },
  TOP_STARBOARD: { min: { x: 0.345, y: 1.1655, z: -4.5895 }, max: { x: 0.415, y: 1.2205, z: -4.5345 } },
};

function intersectsLockCorridor(s: S5WorldSolid): boolean {
  const a = obbWorldAabb(s.obb);
  return Object.values(LOCK_CORRIDOR_REGIONS).some(
    (r) =>
      a.max.x > r.min.x &&
      a.min.x < r.max.x &&
      a.max.y > r.min.y &&
      a.min.y < r.max.y &&
      a.max.z > r.min.z &&
      a.min.z < r.max.z,
  );
}

/**
 * Frozen surrounding identities that can legitimately occupy the sampled lock
 * corridor. Identity and expected family must both match. These solids are not
 * collision-exempt: they remain in collisionScope and are checked against the
 * moving locks and every required working rail face.
 */
const EXPECTED_CORRIDOR_SURROUNDING = new Map<string, string>([
  ["S5_CAN_PORT", "s5-can"],
  ["S5_CAN_PORT_ABOVE", "s5-can"],
  ["S5_CAN_PORT_BELOW", "s5-can"],
  ["S5_CAN_PORT_MOUTH", "s5-can"],
  ["S5_CAN_STBD", "s5-can"],
  ["S5_CAN_STBD_ABOVE", "s5-can"],
  ["S5_CAN_STBD_BELOW", "s5-can"],
  ["S5_CAN_STBD_MOUTH", "s5-can"],
  ["S5_CAN_TOP", "s5-can"],
  ["S5_CAN_TOP_MID", "s5-can"],
  ["S5_CAN_TOP_MOUTH", "s5-can"],
  ["S5_CAN_TOP_PORT_OUT", "s5-can"],
  ["S5_CAN_TOP_STBD_OUT", "s5-can"],
]);

const HOST_CAN_SEMANTIC_NAMES: Record<S5DogId, readonly string[]> = {
  PORT: [
    "S5_CAN_PORT",
    "S5_CAN_PORT_ABOVE",
    "S5_CAN_PORT_BELOW",
    "S5_CAN_PORT_MOUTH",
    "S5_CAN_PORT_GUIDE_PLUG_VIS",
  ],
  STARBOARD: ["S5_CAN_STBD", "S5_CAN_STBD_ABOVE", "S5_CAN_STBD_BELOW", "S5_CAN_STBD_MOUTH"],
  TOP_PORT: ["S5_CAN_TOP", "S5_CAN_TOP_MID", "S5_CAN_TOP_MOUTH", "S5_CAN_TOP_PORT_OUT", "S5_CAN_TOP_STBD_OUT"],
  TOP_STARBOARD: ["S5_CAN_TOP", "S5_CAN_TOP_MID", "S5_CAN_TOP_MOUTH", "S5_CAN_TOP_PORT_OUT", "S5_CAN_TOP_STBD_OUT"],
};

export const S5_CAN_SEMANTIC_NAMES = Object.freeze([
  "S5_CAN_PORT",
  "S5_CAN_PORT_ABOVE",
  "S5_CAN_PORT_BELOW",
  "S5_CAN_PORT_MOUTH",
  "S5_CAN_STBD",
  "S5_CAN_STBD_ABOVE",
  "S5_CAN_STBD_BELOW",
  "S5_CAN_STBD_MOUTH",
  "S5_CAN_TOP",
  "S5_CAN_TOP_MID",
  "S5_CAN_TOP_MOUTH",
  "S5_CAN_TOP_PORT_OUT",
  "S5_CAN_TOP_STBD_OUT",
  "S5_CAN_BOT",
] as const);

const TRACK_BACKING_SEMANTIC_NAMES: Record<S5DogId, readonly string[]> = {
  PORT: ["S5_LOCK_TRACK_BACK_PORT"],
  STARBOARD: ["S5_LOCK_TRACK_BACK_STARBOARD"],
  TOP_PORT: [
    "S5_LOCK_TRACK_BACK_AFT_TOP_PORT",
    "S5_LOCK_TRACK_BACK_TOP_PORT",
    "S5_LOCK_TRACK_BACK_MOUTH_TOP_PORT",
    "S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_TOP_PORT",
  ],
  TOP_STARBOARD: [
    "S5_LOCK_TRACK_BACK_AFT_TOP_STARBOARD",
    "S5_LOCK_TRACK_BACK_TOP_STARBOARD",
    "S5_LOCK_TRACK_BACK_MOUTH_TOP_STARBOARD",
    "S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_TOP_STARBOARD",
  ],
};

const REQUIRED_MOVING_NAMES = new Set(
  S5_DOG_IDS.flatMap((id) => S5_REQUIRED_TRACK_TOPOLOGY[id].moving),
);
const REQUIRED_FIXED_NAMES = new Set(
  S5_DOG_IDS.flatMap((id) => {
    const required = S5_REQUIRED_TRACK_TOPOLOGY[id];
    return [...required.faceA, ...required.faceB, ...required.support];
  }),
);
const REQUIRED_RAIL_NAMES = new Set(
  S5_DOG_IDS.flatMap((id) => {
    const required = S5_REQUIRED_TRACK_TOPOLOGY[id];
    return [...required.faceA, ...required.faceB];
  }),
);

interface S5ProofIdentityBinding {
  readonly authority: S5AuthorityIdentityBinding;
  readonly requiredMovingIds: ReadonlySet<string>;
  readonly requiredFixedIds: ReadonlySet<string>;
  readonly requiredRailIds: ReadonlySet<string>;
  readonly expectedSurroundingFamilyById: Readonly<Record<string, string>>;
  readonly hostCanIds: Readonly<Record<S5DogId, ReadonlySet<string>>>;
  readonly sectorBackingIds: Readonly<Record<S5DogId, ReadonlySet<string>>>;
  readonly passageAllowedIds: ReadonlySet<string>;
  readonly ids: Readonly<Record<string, string>>;
}

const proofIdentityBindings = new WeakMap<object, S5ProofIdentityBinding>();

function getProofIdentityBinding(rig: MachineRig): S5ProofIdentityBinding {
  const prior = proofIdentityBindings.get(rig);
  if (prior) return prior;
  const authority = getS5AuthorityIdentityBinding(rig);
  const id = (semanticName: string): string => {
    const registrationId = authority.registrationIdBySemanticName[semanticName];
    if (!registrationId) throw new Error(`S5 proof semantic row is unbound: ${semanticName}`);
    return registrationId;
  };
  const ids = Object.freeze({ ...authority.registrationIdBySemanticName });
  const expectedSurroundingFamilyById = Object.freeze(
    Object.fromEntries([...EXPECTED_CORRIDOR_SURROUNDING].map(([name, family]) => [id(name), family])),
  );
  const hostCanIds: Readonly<Record<S5DogId, ReadonlySet<string>>> = Object.freeze({
    PORT: new Set(HOST_CAN_SEMANTIC_NAMES.PORT.map(id)),
    STARBOARD: new Set(HOST_CAN_SEMANTIC_NAMES.STARBOARD.map(id)),
    TOP_PORT: new Set(HOST_CAN_SEMANTIC_NAMES.TOP_PORT.map(id)),
    TOP_STARBOARD: new Set(HOST_CAN_SEMANTIC_NAMES.TOP_STARBOARD.map(id)),
  });
  const sectorBackingIds: Readonly<Record<S5DogId, ReadonlySet<string>>> = Object.freeze({
    PORT: new Set(TRACK_BACKING_SEMANTIC_NAMES.PORT.map(id)),
    STARBOARD: new Set(TRACK_BACKING_SEMANTIC_NAMES.STARBOARD.map(id)),
    TOP_PORT: new Set(TRACK_BACKING_SEMANTIC_NAMES.TOP_PORT.map(id)),
    TOP_STARBOARD: new Set(TRACK_BACKING_SEMANTIC_NAMES.TOP_STARBOARD.map(id)),
  });
  const passageAllowedIds = new Set([...PASSAGE_OK, ...S5_CAN_SEMANTIC_NAMES].map(id));
  const binding = Object.freeze({
    authority,
    ids,
    requiredMovingIds: new Set([...REQUIRED_MOVING_NAMES].map(id)),
    requiredFixedIds: new Set([...REQUIRED_FIXED_NAMES].map(id)),
    requiredRailIds: new Set([...REQUIRED_RAIL_NAMES].map(id)),
    expectedSurroundingFamilyById,
    hostCanIds,
    sectorBackingIds,
    passageAllowedIds,
  });
  proofIdentityBindings.set(rig, binding);
  return binding;
}

function indexWorldByRegistrationId(world: S5WorldSolid[]): Map<string, S5WorldSolid> {
  return new Map(world.map((row) => [row.registrationId, row]));
}

function boundSolid(
  worldById: ReadonlyMap<string, S5WorldSolid>,
  binding: S5ProofIdentityBinding,
  semanticName: string,
  requireMaterial = true,
): S5WorldSolid | undefined {
  const row = worldById.get(binding.ids[semanticName]);
  return row && (!requireMaterial || isS5Material(row)) ? row : undefined;
}

function boundSolids(
  worldById: ReadonlyMap<string, S5WorldSolid>,
  binding: S5ProofIdentityBinding,
  semanticNames: readonly string[],
  requireMaterial = true,
): S5WorldSolid[] {
  return semanticNames
    .map((name) => boundSolid(worldById, binding, name, requireMaterial))
    .filter(Boolean) as S5WorldSolid[];
}

function boundAuthorityNode(
  rig: MachineRig,
  binding: S5ProofIdentityBinding,
  semanticName: string,
): AuthoritySolid["node"] | undefined {
  const registrationId = binding.ids[semanticName];
  return rig.solids.find((row) => registrationIdOf(row) === registrationId)?.node;
}

function instantiateIntentionalContactRelations(
  rig: MachineRig,
  world: S5WorldSolid[],
): S5PathCertificate["intentionalContactTable"] {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const relations: S5IntentionalContactRelation[] = [];
  const missingRelationRows: string[] = [];
  const add = (rule: S5IntentionalContactRelation["rule"], aName: string, bName: string): void => {
    const a = boundSolid(worldById, binding, aName);
    const b = boundSolid(worldById, binding, bName);
    if (!a || !b) {
      missingRelationRows.push(`${rule}:${aName}[${a ? 1 : 0}]↔${bName}[${b ? 1 : 0}]`);
      return;
    }
    relations.push({
      rule,
      aRegistrationId: a.registrationId,
      aName: a.name,
      bRegistrationId: b.registrationId,
      bName: b.name,
    });
  };
  for (const id of S5_DOG_IDS) {
    const topology = S5_REQUIRED_TRACK_TOPOLOGY[id];
    const shoe = `S5_LOCK_CAM_SHOE_${id}`;
    for (const rail of topology.faceB) {
      add("CAM_SHOE_TO_SECTOR_RAIL_B_FORWARD_OR_CAPTURED", shoe, rail);
      add("CAM_SHOE_TO_OPPOSITE_FACE_NONPENETRATING", shoe, rail);
    }
    for (const rail of topology.faceA) {
      add("CAM_SHOE_TO_SECTOR_RAIL_A_REVERSE_OR_CAPTURED", shoe, rail);
      add("CAM_SHOE_TO_OPPOSITE_FACE_NONPENETRATING", shoe, rail);
    }
    add("LOCK_PIN_TO_SECTOR_SHOULDER_RETAINED_ESCAPE_PROBE", `S5_LOCK_PIN_${id}`, `S5_LOCK_SHOULDER_${id}`);
    const top = id === "TOP_PORT" || id === "TOP_STARBOARD";
    for (const [index, rail] of [...topology.faceA, ...topology.faceB].entries()) {
      const pieceIndex = index % TRACK_PIECES.length;
      const piece = TRACK_PIECES[pieceIndex];
      const backing = top
        ? piece === "MOUTH"
          ? `S5_LOCK_TRACK_BACK_MOUTH_${id}`
          : piece === "LEAD"
            ? `S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_${id}`
            : piece === "CAPTURE"
              ? `S5_LOCK_TRACK_BACK_AFT_${id}`
              : `S5_LOCK_TRACK_BACK_${id}`
        : `S5_LOCK_TRACK_BACK_${id}`;
      add("RAIL_FACE_TO_DECLARED_BACKING_STRUCTURAL_SPLICE", rail, backing);
    }
    add("SHOULDER_TO_DECLARED_WEB_STRUCTURAL_SPLICE", `S5_LOCK_SHOULDER_${id}`, `S5_LOCK_WEB_${id}`);
    for (const wallName of POCKET_WALL_NAMES[id]) {
      add("SEAT_TONGUE_TO_DECLARED_RECEIVER_CAVITY", `S5_SEAT_TONGUE_${id}`, wallName);
    }
  }
  for (const [a, b] of LOCK_CHAIN.slice(8)) {
    add("WEB_TO_RECEIVER_POST_FRAME_KEEL_CHAIN", a, b);
  }
  for (const wall of ["PORT", "STBD", "TOP", "BOT"] as const) {
    add("FIXED_SPIGOT_TO_MOVING_RECEIVER_NESTED_INTERFACE", `S5_SPIGOT_${wall}`, `S5_RECEIVER_${wall}`);
  }
  const registrationPairKeys = new Set(
    relations.map((row) => `${row.rule}:${row.aRegistrationId}↔${row.bRegistrationId}`),
  );
  return {
    immutable: true,
    rules: S5_INTENTIONAL_CONTACT_RULES,
    relations,
    instantiatedRelations: relations.length,
    missingRelationRows: [...new Set(missingRelationRows)].sort(),
    pass: missingRelationRows.length === 0 && registrationPairKeys.size === relations.length,
  };
}

function snapshotLifetimeRow(
  binding: S5ProofIdentityBinding,
  solid: S5WorldSolid,
  sample: number,
  stage: S5AuthorityLifetimeRow["firstRelevant"]["stage"],
  driveT: number,
): S5AuthorityLifetimeRow {
  const metadata = (solid.node as { metadata?: { assembly?: string; subsystem?: string } }).metadata ?? {};
  const movingClass = metadata.assembly === "MOVING_LOCK_ASSEMBLY";
  const fixedClass = metadata.assembly === "FIXED_TRACK_ASSEMBLY";
  const correctSubsystem = metadata.subsystem === "S5_LOCK_TRACK_SUBSYSTEM";
  const requiredMoving = binding.requiredMovingIds.has(solid.registrationId);
  const requiredFixed = binding.requiredFixedIds.has(solid.registrationId);
  const expectedSurrounding = binding.expectedSurroundingFamilyById[solid.registrationId] === solid.family;
  let classification: S5AuthorityLifetimeRow["classification"];
  if (requiredMoving && movingClass && correctSubsystem) classification = "required-moving-lock";
  else if (requiredFixed && fixedClass && correctSubsystem) classification = "required-fixed-track";
  else if (!requiredMoving && !requiredFixed && movingClass && correctSubsystem) classification = "declared-nc-moving";
  else if (!requiredMoving && !requiredFixed && fixedClass && correctSubsystem) classification = "declared-nc-fixed";
  else if (!metadata.assembly && !metadata.subsystem && expectedSurrounding) classification = "expected-surrounding";
  else if (!metadata.assembly && !metadata.subsystem) classification = "unclassified";
  else if ((movingClass || fixedClass) && !correctSubsystem) classification = "invalid";
  else classification = "conflicting";
  return {
    registrationId: solid.registrationId,
    name: solid.name,
    family: solid.family,
    role: solid.role,
    moving: solid.moving,
    assembly: metadata.assembly,
    subsystem: metadata.subsystem,
    classification,
    firstRelevant: {
      sample,
      stage,
      phase: s5TrackBoundsAtZ(s5FollowerZ(driveT)).phase,
      driveT,
      enabled: meshEnabled(solid.node),
      aabb: obbWorldAabb(solid.obb),
    },
  };
}

function physicalFirstInventory(
  rig: MachineRig,
  world: S5WorldSolid[],
  identity: S5AuthorityIdentityAudit,
  relevantRows?: ReadonlyMap<string, S5AuthorityLifetimeRow>,
  capturedRelevantIds?: ReadonlySet<string>,
  physicalUniverseRows?: ReadonlyMap<string, { registrationId: string; name: string }>,
): S5PathCertificate["inventory"] {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const physical = world.filter(isS5Material);
  const currentRows = new Map(
    physical
      .filter(intersectsLockCorridor)
      .map((solid, index) => [solid.registrationId, snapshotLifetimeRow(binding, solid, index, "PREREQUISITE", 1)]),
  );
  const lifetimeRows = [...(relevantRows ?? currentRows).values()];
  const moving = physical.filter((s) => isMovingLockSolid(s) && inLockTrackSubsystem(s)).map((s) => s.name);
  const fixed = physical.filter((s) => isFixedTrackSolid(s) && inLockTrackSubsystem(s)).map((s) => s.name);
  const approvedSurrounding = lifetimeRows
    .filter((row) => row.classification === "expected-surrounding")
    .map((row) => row.name);
  const approvedSurroundingRegistrationIds = lifetimeRows
    .filter((row) => row.classification === "expected-surrounding")
    .map((row) => row.registrationId);
  const unclassified = lifetimeRows.filter((row) => row.classification === "unclassified").map((row) => row.name);
  const unclassifiedRegistrationIds = lifetimeRows
    .filter((row) => row.classification === "unclassified")
    .map((row) => row.registrationId);
  const invalidClassification = lifetimeRows.filter((row) => row.classification === "invalid").map((row) => row.name);
  const conflictingClassification = lifetimeRows.filter((row) => row.classification === "conflicting").map((row) => row.name);

  const missingRequired: string[] = [];
  const missingRequiredRegistrationIds: string[] = [];
  if (identity.pass) {
    for (const id of S5_DOG_IDS) {
      const required = S5_REQUIRED_TRACK_TOPOLOGY[id];
      for (const name of required.moving) {
        const match = boundSolid(worldById, binding, name);
        if (!match) {
          missingRequired.push(name);
          missingRequiredRegistrationIds.push(binding.ids[name]);
        }
        else if (!isMovingLockSolid(match) || !inLockTrackSubsystem(match)) invalidClassification.push(name);
      }
      for (const name of [...required.faceA, ...required.faceB, ...required.support]) {
        const match = boundSolid(worldById, binding, name);
        if (!match) {
          missingRequired.push(name);
          missingRequiredRegistrationIds.push(binding.ids[name]);
        }
        else if (!isFixedTrackSolid(match) || !inLockTrackSubsystem(match)) invalidClassification.push(name);
      }
    }
  } else {
    missingRequired.push("AUTHORITY_IDENTITY_PREFLIGHT_FAILED_BEFORE_REQUIRED_TOPOLOGY_PROJECTION");
  }

  const uniq = (items: string[]): string[] => [...new Set(items)].sort();
  const relevant = uniq(lifetimeRows.map((row) => row.name));
  const relevantRegistrationIds = uniq(lifetimeRows.map((row) => row.registrationId));
  const capturedRows = lifetimeRows.filter((row) => (capturedRelevantIds ?? new Set(relevantRegistrationIds)).has(row.registrationId));
  const capturedRelevant = uniq(capturedRows.map((row) => row.name));
  const pathAdded = uniq(
    lifetimeRows.filter((row) => !capturedRows.some((captured) => captured.registrationId === row.registrationId)).map((row) => row.name),
  );
  const pathAddedRegistrationIds = uniq(
    lifetimeRows
      .filter((row) => !capturedRows.some((captured) => captured.registrationId === row.registrationId))
      .map((row) => row.registrationId),
  );
  const scopedRows = lifetimeRows.filter((row) => row.classification !== "required-moving-lock");
  const collisionScope = uniq(scopedRows.map((row) => row.name));
  const collisionScopeRegistrationIds = uniq(scopedRows.map((row) => row.registrationId));
  const physicalUniverse = physicalUniverseRows
    ? [...physicalUniverseRows.values()]
    : physical.map((row) => ({ registrationId: row.registrationId, name: row.name }));
  const result: S5PathCertificate["inventory"] = {
    method: "FULL_MOTION_SAMPLED_UNION",
    proofIdentity: "registrationId",
    identityPreflightPassed: identity.pass,
    requiredTopologyProjected: identity.pass,
    registeredRows: identity.registeredRows,
    registrationIdsUnique: identity.duplicateRegistrationIds.length === 0 && identity.metadataMismatches.length === 0,
    namesUnique: identity.duplicateNames.length === 0,
    duplicateRegistrationIds: identity.duplicateRegistrationIds,
    duplicateNames: identity.duplicateNames,
    metadataIdentityMismatches: identity.metadataMismatches,
    physicalUniverse: uniq(physicalUniverse.map((row) => row.name)),
    physicalUniverseRegistrationIds: uniq(physicalUniverse.map((row) => row.registrationId)),
    moving: uniq(moving),
    fixed: uniq(fixed),
    relevant,
    relevantRegistrationIds,
    capturedRelevant,
    pathAdded,
    pathAddedRegistrationIds,
    approvedSurrounding: uniq(approvedSurrounding),
    approvedSurroundingRegistrationIds: uniq(approvedSurroundingRegistrationIds),
    unclassified: uniq(unclassified),
    unclassifiedRegistrationIds: uniq(unclassifiedRegistrationIds),
    invalidClassification: uniq(invalidClassification),
    conflictingClassification: uniq(conflictingClassification),
    missingRequired: uniq(missingRequired),
    missingRequiredRegistrationIds: uniq(missingRequiredRegistrationIds),
    collisionScope,
    collisionScopeRegistrationIds,
    lifetimeRows: [...lifetimeRows].sort((a, b) => a.registrationId.localeCompare(b.registrationId)),
    complete: false,
  };
  result.complete =
    result.moving.length === 8 &&
    result.registrationIdsUnique &&
    result.namesUnique &&
    result.unclassified.length === 0 &&
    result.invalidClassification.length === 0 &&
    result.conflictingClassification.length === 0 &&
    result.missingRequired.length === 0;
  return result;
}

export interface DogCapture {
  id: S5DogId;
  captured: boolean;
  approachClear: boolean;
  insertion: number;
  wallHits: string[];
  detail: string;
}

export interface LockCapture {
  id: S5DogId;
  retained: boolean;
  extension: number;
  pinInReceiver: boolean;
  lockTransverseInsertion: number;
  cavityWallClearance: number;
  lockAxialFreePlay: number;
  shoulderName: string;
  followerCamSep: number;
  followerTrackSep: number;
  shoulderSpliced: boolean;
  driverValid: boolean;
  driverDetail: string;
  retainedMargin: number;
  trackSupported: boolean;
  detail: string;
}

export interface LockDriver {
  id: S5DogId;
  valid: boolean;
  region: "PRE_PICKUP" | "ACTIVE" | "CAPTURED";
  guideAperture: boolean;
  wallClear: boolean;
  confined: boolean;
  extendBlocked: boolean;
  retractBlocked: boolean;
  freePlay: number;
  minTrackClr: number;
  maxTrackClr: number;
  pickupDriveT: number;
  trackU: number;
  pinU: number;
  retainedMargin: number;
  trackSupported: boolean;
  detail: string;
}

export interface EscapeProbe {
  blocked: boolean;
  hits: string[];
}

export interface S5HandoverState {
  driveT: number;
  canMouthZ: number;
  insertion: number;
  insertionNondegenerate: boolean;
  radialClearance: number;
  passageOpen: boolean;
  passageBlockers: string[];
  registerSeated: boolean;
  registerDetail: string;
  tongues: DogCapture[];
  dogs: DogCapture[];
  locks: LockCapture[];
  allTonguesSeated: boolean;
  allDogsCaptured: boolean;
  allLocksRetained: boolean;
  allLockDriversValid: boolean;
  trackSupport: { pass: boolean; missing: string[]; edges: S5ProofEdgeReport[]; minContact: number };
  fourSectorsDistinct: boolean;
  bottomSectorUsed: boolean;
  seatGraph: { pass: boolean; missing: string[]; edges: S5ProofEdgeReport[] };
  coreGraph: { pass: boolean; missing: string[]; edges: S5ProofEdgeReport[] };
  railBypass: boolean;
  driveThrustReady: boolean;
  firstApproachEvent: string;
  liveSpigotLength: number;
  upstreamReady: boolean;
  pathCertificateValid: boolean;
  minLiveRetainedMargin: number;
}

function identityPreflightHandoverFailure(
  rig: MachineRig,
  identity: S5AuthorityIdentityAudit,
): S5HandoverState {
  const detail = `S5 identity preflight failed before handover projection duplicateNames=${identity.duplicateNames
    .map((row) => `${row.name}[${row.registrationIds.join(",")}]`)
    .join(";") || "none"} duplicateIds=${identity.duplicateRegistrationIds
    .map((row) => `${row.registrationId}[${row.names.join(",")}]`)
    .join(";") || "none"}`;
  const failedGraph = { pass: false, missing: [detail], edges: [] as S5ProofEdgeReport[] };
  return {
    driveT: rig.lastDriveT(),
    canMouthZ: 0,
    insertion: 0,
    insertionNondegenerate: false,
    radialClearance: 0,
    passageOpen: false,
    passageBlockers: [detail],
    registerSeated: false,
    registerDetail: detail,
    tongues: [],
    dogs: [],
    locks: [],
    allTonguesSeated: false,
    allDogsCaptured: false,
    allLocksRetained: false,
    allLockDriversValid: false,
    trackSupport: { ...failedGraph, minContact: 0 },
    fourSectorsDistinct: false,
    bottomSectorUsed: false,
    seatGraph: failedGraph,
    coreGraph: failedGraph,
    railBypass: false,
    driveThrustReady: false,
    firstApproachEvent: "identity_preflight_failed_before_projection",
    liveSpigotLength: 0,
    upstreamReady: false,
    pathCertificateValid: false,
    minLiveRetainedMargin: 0,
  };
}

const LOCK_CHAIN: Array<[string, string]> = [
  ["S5_LOCK_PIN_PORT", "S5_LOCK_SHOULDER_PORT"],
  ["S5_LOCK_PIN_STARBOARD", "S5_LOCK_SHOULDER_STARBOARD"],
  ["S5_LOCK_PIN_TOP_PORT", "S5_LOCK_SHOULDER_TOP_PORT"],
  ["S5_LOCK_PIN_TOP_STARBOARD", "S5_LOCK_SHOULDER_TOP_STARBOARD"],
  ["S5_LOCK_SHOULDER_PORT", "S5_LOCK_WEB_PORT"],
  ["S5_LOCK_SHOULDER_STARBOARD", "S5_LOCK_WEB_STARBOARD"],
  ["S5_LOCK_SHOULDER_TOP_PORT", "S5_LOCK_WEB_TOP_PORT"],
  ["S5_LOCK_SHOULDER_TOP_STARBOARD", "S5_LOCK_WEB_TOP_STARBOARD"],
  ["S5_LOCK_WEB_PORT", "S5_LOCK_RECV_PORT"],
  ["S5_LOCK_WEB_STARBOARD", "S5_LOCK_RECV_STARBOARD"],
  ["S5_LOCK_WEB_TOP_PORT", "S5_LOCK_RECV_TOP_PORT"],
  ["S5_LOCK_WEB_TOP_STARBOARD", "S5_LOCK_RECV_TOP_STARBOARD"],
  ["S5_LOCK_RECV_PORT", "S5_LOCK_POST_PORT"],
  ["S5_LOCK_RECV_STARBOARD", "S5_LOCK_POST_STARBOARD"],
  ["S5_LOCK_RECV_TOP_PORT", "S5_LOCK_POST_TOP_PORT"],
  ["S5_LOCK_RECV_TOP_STARBOARD", "S5_LOCK_POST_TOP_STARBOARD"],
  ["S5_LOCK_POST_PORT", "S5_FRAME_PORT"],
  ["S5_LOCK_POST_STARBOARD", "S5_FRAME_STBD"],
  ["S5_LOCK_POST_TOP_PORT", "S5_FRAME_TOP_PORT"],
  ["S5_LOCK_POST_TOP_STARBOARD", "S5_FRAME_TOP_STBD"],
  ["S5_FRAME_TOP_PORT", "S5_FRAME_TOP_CROSS"],
  ["S5_FRAME_TOP_STBD", "S5_FRAME_TOP_CROSS"],
  ["S5_FRAME_PORT", "AFT_POST_PORT"],
  ["S5_FRAME_STBD", "AFT_POST_STBD"],
  ["S5_FRAME_TOP_CROSS", "AFT_POST_PORT"],
  ["S5_FRAME_TOP_CROSS", "AFT_POST_STBD"],
  ["S5_FRAME_PORT", "S5_FRAME_WALL_PORT"],
  ["S5_FRAME_STBD", "S5_FRAME_WALL_STBD"],
  ["S5_FRAME_WALL_PORT", "BAY_WALL_PORT"],
  ["S5_FRAME_WALL_STBD", "BAY_WALL_STBD"],
  ["AFT_POST_PORT", "BAY_WALL_PORT"],
  ["AFT_POST_STBD", "BAY_WALL_STBD"],
  ["BAY_WALL_PORT", "BULKHEAD_Z-1p70"],
  ["BAY_WALL_STBD", "BULKHEAD_Z-1p70"],
  ["BULKHEAD_Z-1p70", "VENTRAL_KEEL"],
];

const CORE_CHAIN: Array<[string, string]> = [
  ["S5_CORE_PROXY", "S5_CORE_SUPPORT_PORT"],
  ["S5_CORE_PROXY", "S5_CORE_SUPPORT_STBD"],
  ["S5_CORE_SUPPORT_PORT", "S5_CORE_REACTION_FRAME"],
  ["S5_CORE_SUPPORT_STBD", "S5_CORE_REACTION_FRAME"],
  ["S5_CORE_REACTION_FRAME", "BULKHEAD_Z-1p70"],
  ["BULKHEAD_Z-1p70", "VENTRAL_KEEL"],
];

const NONPHYSICAL_CHAIN_TARGETS = new Set([
  "AFT_POST_PORT",
  "AFT_POST_STBD",
  "BAY_WALL_PORT",
  "BAY_WALL_STBD",
  "BULKHEAD_Z-1p70",
  "VENTRAL_KEEL",
]);

const LOCK_PIN_DOG_BY_SEMANTIC_NAME: Readonly<Record<string, S5DogId>> = Object.freeze(
  Object.fromEntries(S5_DOG_IDS.map((id) => [`S5_LOCK_PIN_${id}`, id])),
);

interface S5ResolvedChainEdge {
  aRegistrationId: string;
  bRegistrationId: string;
  aName: string;
  bName: string;
  bMayBeNonphysical: boolean;
  retainedLockId?: S5DogId;
}

function resolveChainByRegistrationId(
  binding: S5ProofIdentityBinding,
  chain: ReadonlyArray<readonly [string, string]>,
): S5ResolvedChainEdge[] {
  return chain.map(([aName, bName]) => ({
    aRegistrationId: binding.ids[aName],
    bRegistrationId: binding.ids[bName],
    aName,
    bName,
    bMayBeNonphysical: NONPHYSICAL_CHAIN_TARGETS.has(bName),
    retainedLockId: LOCK_PIN_DOG_BY_SEMANTIC_NAME[aName],
  }));
}

const PASSAGE_OK = new Set([
  "S5_SPIGOT_PORT",
  "S5_SPIGOT_STBD",
  "S5_SPIGOT_TOP",
  "S5_SPIGOT_BOT",
  "S5_RECEIVER_PORT",
  "S5_RECEIVER_STBD",
  "S5_RECEIVER_TOP",
  "S5_RECEIVER_BOT",
  "S5_CAN_PORT",
  "S5_CAN_STBD",
  "S5_CAN_TOP",
  "S5_CAN_BOT",
]);

export function liveSpigotInterval(rig: MachineRig, world: S5WorldSolid[]): { zAft: number; zFwd: number; length: number } {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const walls = boundSolids(worldById, binding, ["S5_SPIGOT_PORT", "S5_SPIGOT_STBD", "S5_SPIGOT_TOP", "S5_SPIGOT_BOT"]);
  if (walls.length === 0) return { zAft: S5P.spigotZAft, zFwd: S5P.spigotZFwd, length: S5P.spigotL };
  let zAft = Infinity;
  let zFwd = -Infinity;
  for (const w of walls) {
    const a = obbWorldAabb(w.obb);
    zAft = Math.min(zAft, a.min.z);
    zFwd = Math.max(zFwd, a.max.z);
  }
  return { zAft, zFwd, length: zFwd - zAft };
}

export function liveReceiverInterval(rig: MachineRig, world: S5WorldSolid[]): { zAft: number; zFwd: number } {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const walls = boundSolids(worldById, binding, ["S5_RECEIVER_PORT", "S5_RECEIVER_STBD", "S5_RECEIVER_TOP", "S5_RECEIVER_BOT"]);
  if (walls.length === 0) return { zAft: -4.705, zFwd: -4.525 };
  let zAft = Infinity;
  let zFwd = -Infinity;
  for (const w of walls) {
    const a = obbWorldAabb(w.obb);
    zAft = Math.min(zAft, a.min.z);
    zFwd = Math.max(zFwd, a.max.z);
  }
  return { zAft, zFwd };
}

export function liveCanMouthZ(rig: MachineRig, world: S5WorldSolid[]): number {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const walls = boundSolids(worldById, binding, S5_CAN_SEMANTIC_NAMES);
  if (walls.length === 0) return P.drive.stowedZ + P.drive.l / 2;
  let zFwd = -Infinity;
  for (const w of walls) {
    zFwd = Math.max(zFwd, obbWorldAabb(w.obb).max.z);
  }
  return zFwd;
}

export function evaluateS5Handover(rig: MachineRig, _driveT = rig.lastDriveT()): S5HandoverState {
  void _driveT;
  const identity = auditS5AuthorityIdentity(rig.solids);
  if (!identity.pass) return identityPreflightHandoverFailure(rig, identity);
  const world = s5WorldOf(rig);
  const binding = getProofIdentityBinding(rig);
  const byRegistrationId = indexWorldByRegistrationId(world);
  const spigot = liveSpigotInterval(rig, world);
  const receiver = liveReceiverInterval(rig, world);
  const insertion = Math.max(0, Math.min(spigot.zFwd, receiver.zFwd) - Math.max(spigot.zAft, receiver.zAft));
  const canMouthZ = liveCanMouthZ(rig, world);
  const tongues = S5_DOG_IDS.map((id) => evalTongue(rig, world, id));
  const locks = S5_DOG_IDS.map((id) => evalLock(rig, world, id));
  const seatGraph = evalChain(byRegistrationId, resolveChainByRegistrationId(binding, LOCK_CHAIN), locks);
  const coreGraph = evalChain(byRegistrationId, resolveChainByRegistrationId(binding, CORE_CHAIN));
  const bottom = Boolean(boundSolid(byRegistrationId, binding, "S5_DOG_BOTTOM_VIS"));
  const reg = evalRegister(rig, world, canMouthZ);
  const passage = evalPassage(rig, world, canMouthZ);
  const allTongues = tongues.every((d) => d.captured);
  const allLocks = locks.every((d) => d.retained);
  const trackSupport = evalTrackSupport(rig, world);
  const pathCertificate = getPathCertificate(rig);
  const pathCertificateValid = pathCertificate?.valid === true;
  const allDrivers =
    pathCertificateValid &&
    trackSupport.pass &&
    locks.every(
      (d) =>
        d.cavityWallClearance > 0 &&
        (pathCertificate?.retainedWorst[d.id] ?? -Infinity) >= S5_RETAINED_INSERTION_MIN,
    );
  const upstreamReady = evaluateDriveReadiness(rig).driveStructuralReady;
  const minLiveRetainedMargin = Math.min(
    ...locks.map((l) => l.lockTransverseInsertion),
    ...S5_DOG_IDS.map((id) => pathCertificate?.retainedWorst[id] ?? -Infinity),
  );
  const ready =
    insertion > S5_MIN_INSERTION &&
    passage.open &&
    reg.seated &&
    allTongues &&
    allLocks &&
    allDrivers &&
    seatGraph.pass &&
    coreGraph.pass &&
    !bottom &&
    upstreamReady &&
    rig.lastDriveT() > 0 &&
    minLiveRetainedMargin >= S5_RETAINED_INSERTION_MIN &&
    pathCertificateValid;
  return {
    driveT: rig.lastDriveT(),
    canMouthZ,
    insertion,
    insertionNondegenerate: insertion > S5_MIN_INSERTION,
    radialClearance: S5_FLOW_JOINT_CLEARANCE,
    passageOpen: passage.open,
    passageBlockers: passage.blockers,
    registerSeated: reg.seated,
    registerDetail: reg.detail,
    tongues,
    dogs: tongues,
    locks,
    allTonguesSeated: allTongues,
    allDogsCaptured: allTongues,
    allLocksRetained: allLocks,
    allLockDriversValid: allDrivers,
    trackSupport,
    fourSectorsDistinct: fourSectorsOk(rig, world),
    bottomSectorUsed: bottom,
    seatGraph,
    coreGraph,
    railBypass:
      seatGraph.pass &&
      !seatGraph.edges.some(
        (edge) =>
          binding.requiredRailIds.has(edge.fromRegistrationId) ||
          binding.requiredRailIds.has(edge.toRegistrationId),
      ),
    driveThrustReady: ready,
    firstApproachEvent: "first_receiver_spigot_z_overlap",
    liveSpigotLength: spigot.length,
    upstreamReady,
    pathCertificateValid,
    minLiveRetainedMargin: Number.isFinite(minLiveRetainedMargin) ? minLiveRetainedMargin : 0,
  };
}

function evalTongue(rig: MachineRig, world: S5WorldSolid[], id: S5DogId): DogCapture {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const dog = boundSolid(worldById, binding, `S5_SEAT_TONGUE_${id}`);
  const walls = boundSolids(worldById, binding, POCKET_WALL_NAMES[id]);
  if (!dog || walls.length === 0) {
    return { id, captured: false, approachClear: false, insertion: 0, wallHits: [], detail: "missing tongue or pocket" };
  }
  const wallHits = walls.filter((w) => obbOverlaps(dog.obb, w.obb)).map((w) => w.name);
  const da = obbWorldAabb(dog.obb);
  const pa = walls.map((w) => obbWorldAabb(w.obb));
  const pocketZAft = Math.min(...pa.map((a) => a.min.z));
  const pocketZFwd = Math.max(...pa.map((a) => a.max.z));
  const insertion = Math.max(0, Math.min(da.max.z, pocketZFwd) - Math.max(da.min.z, pocketZAft));
  const captured = wallHits.length === 0 && insertion >= 0.06;
  return {
    id,
    captured,
    approachClear: wallHits.length === 0,
    insertion,
    wallHits,
    detail: captured ? `seated insertion=${insertion.toFixed(3)}` : `not seated hits=${wallHits.join(",")} insertion=${insertion.toFixed(3)}`,
  };
}

function evalLock(rig: MachineRig, world: S5WorldSolid[], id: S5DogId): LockCapture {
  const missing: LockCapture = {
    id,
    retained: false,
    extension: 0,
    pinInReceiver: false,
    lockTransverseInsertion: 0,
    cavityWallClearance: 0,
    lockAxialFreePlay: 0,
    shoulderName: "",
    followerCamSep: Infinity,
    followerTrackSep: Infinity,
    shoulderSpliced: false,
    driverValid: false,
    driverDetail: "missing pin/receiver/shoulder",
    retainedMargin: 0,
    trackSupported: false,
    detail: "missing pin/receiver/shoulder",
  };
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const pin = boundSolid(worldById, binding, `S5_LOCK_PIN_${id}`);
  const recv = boundSolid(worldById, binding, `S5_LOCK_RECV_${id}`);
  const guideA = boundSolid(worldById, binding, `S5_LOCK_GUIDE_A_${id}`);
  const guideB = boundSolid(worldById, binding, `S5_LOCK_GUIDE_B_${id}`);
  const shoulder = boundSolid(worldById, binding, `S5_LOCK_SHOULDER_${id}`);
  const web = boundSolid(worldById, binding, `S5_LOCK_WEB_${id}`);
  const follower = boundSolid(worldById, binding, `S5_LOCK_CAM_SHOE_${id}`);
  if (!pin || !recv || !guideA || !guideB || !shoulder) return missing;
  const pa = obbWorldAabb(pin.obb);
  const ga = obbWorldAabb(guideA.obb);
  const gb = obbWorldAabb(guideB.obb);
  const sa = obbWorldAabb(shoulder.obb);
  const walls = [recv, guideA, guideB];
  const wallHit = walls.some((w) => obbOverlaps(pin.obb, w.obb));
  const cavityWallClearance = wallHit ? -Math.max(...walls.map((w) => -obbSeparation(pin.obb, w.obb))) : Math.min(...walls.map((w) => obbSeparation(pin.obb, w.obb)));
  const lockAxialFreePlay = sa.min.z - pa.max.z;
  let lockTransverseInsertion = 0;
  if (id === "PORT") {
    const entry = Math.max(ga.max.x, gb.max.x);
    lockTransverseInsertion = entry - pa.min.x;
  } else if (id === "STARBOARD") {
    const entry = Math.min(ga.min.x, gb.min.x);
    lockTransverseInsertion = pa.max.x - entry;
  } else {
    const entry = Math.min(ga.min.y, gb.min.y);
    lockTransverseInsertion = pa.max.y - entry;
  }
  const pinInReceiver = lockTransverseInsertion > 0 && !wallHit;
  const railsA = boundSolids(worldById, binding, S5_REQUIRED_TRACK_TOPOLOGY[id].faceA);
  const railsB = boundSolids(worldById, binding, S5_REQUIRED_TRACK_TOPOLOGY[id].faceB);
  const followerCamSep = follower && railsA.length ? Math.min(...railsA.map((r) => obbSeparation(follower.obb, r.obb))) : Infinity;
  const followerTrackSep =
    follower && railsA.length && railsB.length
      ? Math.min(
          Math.min(...railsA.map((r) => obbSeparation(follower.obb, r.obb))),
          Math.min(...railsB.map((r) => obbSeparation(follower.obb, r.obb))),
        )
      : Infinity;
  const driver = evalLockDriverPose(rig, world, id, pin, follower, railsA, railsB);
  const shoulderSpliced = Boolean(
    web && recv && obbSeparation(shoulder.obb, web.obb) <= S5_CONTACT && obbSeparation(web.obb, recv.obb) <= S5_CONTACT,
  );
  const retained = pinInReceiver && cavityWallClearance > 0 && lockAxialFreePlay >= 0 && !obbOverlaps(pin.obb, shoulder.obb);
  const radial =
    id === "PORT" || id === "STARBOARD"
      ? Math.max(0, Math.min(pa.max.x, obbWorldAabb(recv.obb).max.x) - Math.max(pa.min.x, obbWorldAabb(recv.obb).min.x))
      : Math.max(0, Math.min(pa.max.y, obbWorldAabb(recv.obb).max.y) - Math.max(pa.min.y, obbWorldAabb(recv.obb).min.y));
  return {
    id,
    retained,
    extension: radial,
    pinInReceiver,
    lockTransverseInsertion,
    cavityWallClearance,
    lockAxialFreePlay,
    shoulderName: shoulder.name,
    followerCamSep,
    followerTrackSep,
    shoulderSpliced,
    driverValid: driver.valid,
    driverDetail: driver.detail,
    retainedMargin: driver.retainedMargin,
    trackSupported: driver.trackSupported,
    detail: retained
      ? `retained insert=${lockTransverseInsertion.toFixed(4)} wallClr=${cavityWallClearance.toFixed(4)} play=${lockAxialFreePlay.toFixed(4)}`
      : `not retained insert=${lockTransverseInsertion.toFixed(4)} wallClr=${cavityWallClearance.toFixed(4)} play=${lockAxialFreePlay.toFixed(4)} hit=${wallHit}`,
  };
}

function hostCanWalls(rig: MachineRig, world: S5WorldSolid[], id: S5DogId): S5WorldSolid[] {
  const binding = getProofIdentityBinding(rig);
  const ids = binding.hostCanIds[id];
  return world.filter((row) => ids.has(row.registrationId) && isS5Material(row));
}

function pinExtensionU(id: S5DogId, pin: AuthoritySolid & { obb: OBB }): number {
  const c = pin.obb.center;
  if (id === "PORT") return (-c.x - S5_LOCK_PIN_RETRACT_X) / S5_LOCK_EXTEND;
  if (id === "STARBOARD") return (c.x - S5_LOCK_PIN_RETRACT_X) / S5_LOCK_EXTEND;
  return (c.y - (P.drive.y + S5_LOCK_PIN_RETRACT_Y_TOP)) / S5_LOCK_EXTEND;
}

function sectorTrackSolids(
  rig: MachineRig,
  world: S5WorldSolid[],
  id: S5DogId,
): S5WorldSolid[] {
  const binding = getProofIdentityBinding(rig);
  const sectorRailIds = new Set(
    [...S5_REQUIRED_TRACK_TOPOLOGY[id].faceA, ...S5_REQUIRED_TRACK_TOPOLOGY[id].faceB]
      .map((semanticName) => binding.ids[semanticName]),
  );
  return world.filter(
    (row) =>
      isS5Material(row) &&
      (sectorRailIds.has(row.registrationId) || (isFixedTrackSolid(row) && inLockTrackSubsystem(row))),
  );
}

function sectorBackings(rig: MachineRig, world: S5WorldSolid[], id: S5DogId): S5WorldSolid[] {
  const binding = getProofIdentityBinding(rig);
  const ids = binding.sectorBackingIds[id];
  return world.filter((row) => ids.has(row.registrationId) && isS5Material(row));
}

function minSepToRails(follower: AuthoritySolid & { obb: OBB }, rails: Array<AuthoritySolid & { obb: OBB }>): number {
  if (rails.length === 0) return Infinity;
  return Math.min(...rails.map((r) => obbSeparation(follower.obb, r.obb)));
}

function anyRailHit(follower: AuthoritySolid & { obb: OBB }, rails: Array<AuthoritySolid & { obb: OBB }>): boolean {
  return rails.some((r) => obbOverlaps(follower.obb, r.obb));
}

function centerlineError(id: S5DogId, p: { x: number; y: number; z: number }): number {
  const seg = s5TrackSegment(id);
  const vx = seg.p1.x - seg.p0.x;
  const vy = seg.p1.y - seg.p0.y;
  const vz = seg.p1.z - seg.p0.z;
  const wx = p.x - seg.p0.x;
  const wy = p.y - seg.p0.y;
  const wz = p.z - seg.p0.z;
  const t = Math.min(1, Math.max(0, (wx * vx + wy * vy + wz * vz) / (seg.len * seg.len)));
  const qx = seg.p0.x + t * vx;
  const qy = seg.p0.y + t * vy;
  const qz = seg.p0.z + t * vz;
  return Math.hypot(p.x - qx, p.y - qy, p.z - qz);
}

function evalTrackSupport(rig: MachineRig, world: S5WorldSolid[]): {
  pass: boolean;
  missing: string[];
  edges: S5ProofEdgeReport[];
  minContact: number;
} {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const edges: S5ProofEdgeReport[] = [];
  const missing: string[] = [];
  let minContact = Infinity;
  for (const id of S5_DOG_IDS) {
    const backs = sectorBackings(rig, world, id);
    const post = boundSolid(worldById, binding, `S5_LOCK_POST_${id}`);
    const rails = boundSolids(worldById, binding, [
      ...S5_REQUIRED_TRACK_TOPOLOGY[id].faceA,
      ...S5_REQUIRED_TRACK_TOPOLOGY[id].faceB,
    ]);
    if (backs.length === 0) {
      missing.push(`BACK_${id}`);
      continue;
    }
    const railBackingIds: string[] = [];
    for (const rail of rails) {
      const seps = backs.map((back) => ({ back, sep: obbSeparation(rail.obb, back.obb) }));
      seps.sort((a, b) => a.sep - b.sep);
      const best = seps[0]!;
      edges.push({
        fromRegistrationId: rail.registrationId,
        toRegistrationId: best.back.registrationId,
        from: rail.name,
        to: best.back.name,
        sep: best.sep,
      });
      if (best.sep > S5_CONTACT) missing.push(`${rail.name}↔backing sep=${best.sep.toFixed(4)}`);
      else railBackingIds.push(best.back.registrationId);
      minContact = Math.min(minContact, best.sep <= 0 ? -best.sep : 0);
    }
    const adjacency = new Map<string, Set<string>>();
    const connect = (a: string, b: string): void => {
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a)!.add(b);
      adjacency.get(b)!.add(a);
    };
    for (let i = 0; i < backs.length; i += 1) {
      for (let j = i + 1; j < backs.length; j += 1) {
        const sep = obbSeparation(backs[i]!.obb, backs[j]!.obb);
        if (sep <= S5_CONTACT) {
          edges.push({
            fromRegistrationId: backs[i]!.registrationId,
            toRegistrationId: backs[j]!.registrationId,
            from: backs[i]!.name,
            to: backs[j]!.name,
            sep,
          });
          connect(backs[i]!.registrationId, backs[j]!.registrationId);
          minContact = Math.min(minContact, sep <= 0 ? -sep : 0);
        }
      }
    }
    if (!post) {
      missing.push(`POST_${id}`);
    } else {
      for (const back of backs) {
        const sep = obbSeparation(back.obb, post.obb);
        if (sep <= S5_CONTACT) {
          edges.push({
            fromRegistrationId: back.registrationId,
            toRegistrationId: post.registrationId,
            from: back.name,
            to: post.name,
            sep,
          });
          connect(back.registrationId, post.registrationId);
          minContact = Math.min(minContact, sep <= 0 ? -sep : 0);
        }
      }
      for (const startRegistrationId of railBackingIds) {
        const start = worldById.get(startRegistrationId);
        const seen = new Set([startRegistrationId]);
        const queue = [startRegistrationId];
        while (queue.length) {
          const next = queue.shift()!;
          for (const n of adjacency.get(next) ?? []) {
            if (!seen.has(n)) {
              seen.add(n);
              queue.push(n);
            }
          }
        }
        if (!seen.has(post.registrationId)) {
          missing.push(`${start?.name ?? startRegistrationId}[${startRegistrationId}] has no backing→post path`);
        }
      }
    }
  }
  return {
    pass: missing.length === 0,
    missing,
    edges,
    minContact: Number.isFinite(minContact) ? minContact : 0,
  };
}

function pinInsertionFromWorld(rig: MachineRig, world: S5WorldSolid[], id: S5DogId): number {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const pin = boundSolid(worldById, binding, `S5_LOCK_PIN_${id}`);
  const guideA = boundSolid(worldById, binding, `S5_LOCK_GUIDE_A_${id}`);
  const guideB = boundSolid(worldById, binding, `S5_LOCK_GUIDE_B_${id}`);
  if (!pin || !guideA || !guideB) return 0;
  const pa = obbWorldAabb(pin.obb);
  const ga = obbWorldAabb(guideA.obb);
  const gb = obbWorldAabb(guideB.obb);
  if (id === "PORT") return Math.max(ga.max.x, gb.max.x) - pa.min.x;
  if (id === "STARBOARD") return pa.max.x - Math.min(ga.min.x, gb.min.x);
  return pa.max.y - Math.min(ga.min.y, gb.min.y);
}

export function probeRetainedMargin(
  rig: MachineRig,
  id: S5DogId,
): { margin: number; stopDelta: number; blocked: boolean } {
  const identity = auditS5AuthorityIdentity(rig.solids);
  if (!identity.pass) return { margin: 0, stopDelta: 0, blocked: false };
  const binding = getProofIdentityBinding(rig);
  const pin = boundAuthorityNode(rig, binding, `S5_LOCK_PIN_${id}`) as Mesh | undefined;
  if (!pin) return { margin: 0, stopDelta: 0, blocked: false };
  const sx = pin.position.x;
  const sy = pin.position.y;
  const hitsAt = (d: number): boolean => {
    if (id === "PORT") pin.position.x = sx + d;
    else if (id === "STARBOARD") pin.position.x = sx - d;
    else pin.position.y = sy - d;
    const world = s5WorldOf(rig);
    const worldById = indexWorldByRegistrationId(world);
    const fol = boundSolid(worldById, binding, `S5_LOCK_CAM_SHOE_${id}`);
    const railsB = boundSolids(worldById, binding, S5_REQUIRED_TRACK_TOPOLOGY[id].faceB);
    return Boolean(fol && railsB.some((r) => obbOverlaps(fol.obb, r.obb)));
  };
  let lo = 0;
  let hi = S5_LOCK_EXTEND + 0.004;
  if (!hitsAt(hi)) {
    pin.position.x = sx;
    pin.position.y = sy;
    return { margin: pinInsertionFromWorld(rig, s5WorldOf(rig), id), stopDelta: hi, blocked: false };
  }
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (hitsAt(mid)) hi = mid;
    else lo = mid;
  }
  hitsAt(hi);
  const margin = pinInsertionFromWorld(rig, s5WorldOf(rig), id);
  pin.position.x = sx;
  pin.position.y = sy;
  return { margin, stopDelta: hi, blocked: true };
}

function evalLockDriverPose(
  rig: MachineRig,
  world: S5WorldSolid[],
  id: S5DogId,
  pin: AuthoritySolid & { obb: OBB },
  follower: (AuthoritySolid & { obb: OBB }) | undefined,
  railsA: Array<AuthoritySolid & { obb: OBB }>,
  railsB: Array<AuthoritySolid & { obb: OBB }>,
): { valid: boolean; detail: string; retainedMargin: number; trackSupported: boolean } {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const plug = boundSolid(worldById, binding, "S5_CAN_PORT_GUIDE_PLUG_VIS");
  const walls = hostCanWalls(rig, world, id);
  const pinWallHit = walls.some((w) => obbOverlaps(pin.obb, w.obb));
  const folWallHit = follower ? walls.some((w) => obbOverlaps(follower.obb, w.obb)) : true;
  const aperture = !plug && walls.length >= 3 && !pinWallHit;
  const backs = sectorBackings(rig, world, id);
  const trackSupported = evalTrackSupport(rig, world).pass;
  if (!follower || railsA.length === 0 || railsB.length === 0) {
    return { valid: false, detail: `${id} missing follower/rails`, retainedMargin: 0, trackSupported: false };
  }
  const allRails = sectorTrackSolids(rig, world, id);
  const sepA = minSepToRails(follower, railsA);
  const sepB = minSepToRails(follower, railsB);
  const allHit = anyRailHit(follower, allRails);
  const pinU = pinExtensionU(id, pin);
  const trackU = s5TrackUFromZ(follower.obb.center.z);
  const clErr = centerlineError(id, follower.obb.center);
  const agree = clErr <= S5_TRACK_RUN_CLEARANCE;
  const confined =
    !allHit &&
    sepA > -1e-4 &&
    sepB > -1e-4 &&
    sepA <= S5_TRACK_FREEPLAY_MAX &&
    sepB <= S5_TRACK_FREEPLAY_MAX;
  const needConfine = trackU > 1e-4;
  const insertion = pinInsertionFromWorld(rig, world, id);
  const layout = s5TrackLayout(id);
  const along = Math.abs(id === "PORT" || id === "STARBOARD" ? layout.nx : layout.ny);
  const lockTravelB = along > 1e-9 ? Math.max(0, sepB) / along : Math.max(0, sepB);
  const retainedMargin = insertion - lockTravelB;
  const pinBackHit = backs.some((b) => obbOverlaps(pin.obb, b.obb));
  const shoeBackHit = Boolean(follower && backs.some((b) => obbOverlaps(follower.obb, b.obb)));
  const valid =
    aperture &&
    !pinWallHit &&
    !folWallHit &&
    agree &&
    trackSupported &&
    !allHit &&
    !pinBackHit &&
    !shoeBackHit &&
    (!needConfine || confined);
  return {
    valid,
    retainedMargin,
    trackSupported,
    detail: `${id} ap=${aperture} wall=${!pinWallHit && !folWallHit} confined=${confined} allHit=${allHit} pinBack=${pinBackHit} shoeBack=${shoeBackHit} supp=${trackSupported} mar=${retainedMargin.toFixed(6)} sepA=${sepA.toFixed(4)} sepB=${sepB.toFixed(4)} clErr=${clErr.toFixed(5)} pinU=${pinU.toFixed(3)} trackU=${trackU.toFixed(3)}`,
  };
}

function evalRegister(rig: MachineRig, world: S5WorldSolid[], mouthZ: number): { seated: boolean; detail: string } {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const pads = ["PORT", "STARBOARD", "TOP"].map((id) => boundSolid(worldById, binding, `S5_REG_PAD_${id}`));
  const can = {
    PORT: boundSolid(worldById, binding, "S5_CAN_PORT"),
    STARBOARD: boundSolid(worldById, binding, "S5_CAN_STBD"),
    TOP: boundSolid(worldById, binding, "S5_CAN_TOP"),
  };
  if (pads.some((p) => !p) || !can.PORT || !can.STARBOARD || !can.TOP) {
    return { seated: false, detail: "missing register pads" };
  }
  const pairs: Array<[NonNullable<(typeof pads)[0]>, NonNullable<(typeof can)[keyof typeof can]>]> = [
    [pads[0]!, can.PORT],
    [pads[1]!, can.STARBOARD],
    [pads[2]!, can.TOP],
  ];
  const seps = pairs.map(([pad, wall]) => obbSeparation(pad.obb, wall.obb));
  const close = seps.every((s) => s >= -1e-4 && s < S5_REGISTER_RADIAL);
  const mouthBand = { min: mouthZ - S5_REGISTER_MOUTH_BAND, max: mouthZ };
  const zOverlap = pairs.every(([pad]) => {
    const a = obbWorldAabb(pad.obb);
    return Math.min(a.max.z, mouthBand.max) - Math.max(a.min.z, mouthBand.min) > 0.02;
  });
  const seated = close && zOverlap;
  return { seated, detail: `liveMouth=${mouthZ.toFixed(3)} seps=${seps.map((s) => s.toFixed(3)).join(",")} zOv=${zOverlap}` };
}

function evalPassage(rig: MachineRig, world: S5WorldSolid[], mouthZ: number): { open: boolean; blockers: string[] } {
  const binding = getProofIdentityBinding(rig);
  const corridor = {
    min: { x: -0.27, y: P.drive.y - 0.18, z: S5P.spigotZAft - 0.02 },
    max: { x: 0.27, y: P.drive.y + 0.18, z: mouthZ - P.drive.l + 0.05 },
  };
  if (corridor.max.z < corridor.min.z) corridor.max.z = corridor.min.z + 0.2;
  const blockers: string[] = [];
  for (const s of world) {
    if (!isS5Material(s) && !(s.role === "physical" && meshEnabled(s.node))) continue;
    if (s.role !== "physical") continue;
    if (!meshEnabled(s.node)) continue;
    if (binding.passageAllowedIds.has(s.registrationId)) continue;
    const a = obbWorldAabb(s.obb);
    const hit =
      a.max.x > corridor.min.x &&
      a.min.x < corridor.max.x &&
      a.max.y > corridor.min.y &&
      a.min.y < corridor.max.y &&
      a.max.z > corridor.min.z &&
      a.min.z < corridor.max.z;
    if (hit) blockers.push(s.name);
  }
  return { open: blockers.length === 0, blockers };
}

function evalChain(
  byRegistrationId: ReadonlyMap<string, S5WorldSolid>,
  chain: readonly S5ResolvedChainEdge[],
  locks?: LockCapture[],
): { pass: boolean; missing: string[]; edges: S5ProofEdgeReport[] } {
  const edges: S5ProofEdgeReport[] = [];
  const missing: string[] = [];
  for (const edge of chain) {
    const a = byRegistrationId.get(edge.aRegistrationId);
    const b = byRegistrationId.get(edge.bRegistrationId);
    if (!a || !b || a.role !== "physical" || (b.role !== "physical" && !edge.bMayBeNonphysical)) {
      missing.push(`${edge.aName}[${edge.aRegistrationId}]↔${edge.bName}[${edge.bRegistrationId}]`);
      continue;
    }
    if (edge.retainedLockId) {
      const lock = locks?.find((row) => row.id === edge.retainedLockId);
      if (!lock?.retained) {
        missing.push(`${edge.aName}[${edge.aRegistrationId}]↔${edge.bName}[${edge.bRegistrationId}] not retained`);
        continue;
      }
      edges.push({
        fromRegistrationId: edge.aRegistrationId,
        toRegistrationId: edge.bRegistrationId,
        from: edge.aName,
        to: edge.bName,
        sep: -lock.lockTransverseInsertion,
      });
      continue;
    }
    const sep = obbSeparation(a.obb, b.obb);
    edges.push({
      fromRegistrationId: edge.aRegistrationId,
      toRegistrationId: edge.bRegistrationId,
      from: edge.aName,
      to: edge.bName,
      sep,
    });
    if (sep > S5_CONTACT) {
      missing.push(`${edge.aName}[${edge.aRegistrationId}]↔${edge.bName}[${edge.bRegistrationId}] sep=${sep.toFixed(4)}`);
    }
  }
  return { pass: missing.length === 0, missing, edges };
}

function fourSectorsOk(rig: MachineRig, world: S5WorldSolid[]): boolean {
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const pins = boundSolids(
    worldById,
    binding,
    S5_DOG_IDS.map((id) => `S5_LOCK_PIN_${id}`),
  );
  if (pins.length !== 4) return false;
  for (let i = 0; i < pins.length; i += 1) {
    for (let j = i + 1; j < pins.length; j += 1) {
      if (obbOverlaps(pins[i].obb, pins[j].obb)) return false;
    }
  }
  return true;
}

export function probeAxialEscape(rig: MachineRig, engaged?: boolean): EscapeProbe {
  const identity = auditS5AuthorityIdentity(rig.solids);
  if (!identity.pass) return { blocked: false, hits: ["identity preflight failed before axial-escape probe"] };
  const carriage =
    rig.root.getChildTransformNodes(false).find((n) => n.name === "DRIVE_CARRIAGE") ??
    rig.root.getScene().getTransformNodeByName("DRIVE_CARRIAGE");
  if (!carriage) return { blocked: false, hits: ["no carriage"] };
  const s5 = rig as MachineRig & {
    applyS5Override?: (o: { forceLock?: boolean; forceUnlock?: boolean }) => void;
    getS5Override?: () => { forceLock?: boolean; forceUnlock?: boolean; lockGap?: boolean };
  };
  const prior = s5.getS5Override?.() ?? {};
  if (engaged === true) s5.applyS5Override?.({ forceLock: true });
  else if (engaged === false) s5.applyS5Override?.({ forceUnlock: true });
  rig.applyDrive(1);
  const z0 = carriage.position.z;
  carriage.position.z = z0 + 0.02;
  const world = s5WorldOf(rig);
  const binding = getProofIdentityBinding(rig);
  const worldById = indexWorldByRegistrationId(world);
  const hits: string[] = [];
  for (const id of S5_DOG_IDS) {
    const pin = boundSolid(worldById, binding, `S5_LOCK_PIN_${id}`, false);
    const sh = boundSolid(worldById, binding, `S5_LOCK_SHOULDER_${id}`, false);
    if (pin && sh && obbOverlaps(pin.obb, sh.obb)) hits.push(`S5_LOCK_PIN_${id} ↔ S5_LOCK_SHOULDER_${id}`);
  }
  carriage.position.z = z0;
  s5.applyS5Override?.(prior);
  rig.applyDrive(1);
  return { blocked: hits.length > 0, hits };
}

export function probeReverseLead(
  rig: MachineRig,
  id: S5DogId,
): { returnTravel: number; shoulderTravel: number; lead: number } {
  const identity = auditS5AuthorityIdentity(rig.solids);
  if (!identity.pass) return { returnTravel: 1, shoulderTravel: 0, lead: -1 };
  const binding = getProofIdentityBinding(rig);
  const pin = boundAuthorityNode(rig, binding, `S5_LOCK_PIN_${id}`) as Mesh | undefined;
  if (!pin) return { returnTravel: 1, shoulderTravel: 0, lead: -1 };
  rig.applyDrive(1);
  const world0 = s5WorldOf(rig);
  const world0ById = indexWorldByRegistrationId(world0);
  const pin0 = boundSolid(world0ById, binding, `S5_LOCK_PIN_${id}`, false);
  const sh = boundSolid(world0ById, binding, `S5_LOCK_SHOULDER_${id}`);
  if (!pin0 || !sh) return { returnTravel: 1, shoulderTravel: 0, lead: -1 };
  const pa = obbWorldAabb(pin0.obb);
  const sa = obbWorldAabb(sh.obb);
  const shoulderTravel = Math.max(0, sa.min.z - pa.max.z);
  const axisX = pin.position.x;
  const axisY = pin.position.y;
  const hitsA = (dZ: number): boolean => {
    const t = Math.min(1, Math.max(0, 1 - dZ / 2.55));
    rig.applyDrive(t);
    pin.position.x = axisX;
    pin.position.y = axisY;
    pin.computeWorldMatrix(true);
    const world = s5WorldOf(rig);
    const worldById = indexWorldByRegistrationId(world);
    const shoe = boundSolid(worldById, binding, `S5_LOCK_CAM_SHOE_${id}`, false);
    const railsA = boundSolids(worldById, binding, S5_REQUIRED_TRACK_TOPOLOGY[id].faceA);
    return Boolean(shoe && railsA.some((r) => obbOverlaps(shoe.obb, r.obb)));
  };
  let lo = 0;
  let hi = 0.02;
  if (!hitsA(hi)) {
    pin.position.x = axisX;
    pin.position.y = axisY;
    rig.applyDrive(1);
    return { returnTravel: hi, shoulderTravel, lead: shoulderTravel - hi };
  }
  for (let i = 0; i < 32; i += 1) {
    const mid = (lo + hi) / 2;
    if (hitsA(mid)) hi = mid;
    else lo = mid;
  }
  pin.position.x = axisX;
  pin.position.y = axisY;
  rig.applyDrive(1);
  return { returnTravel: hi, shoulderTravel, lead: shoulderTravel - hi };
}

export function evalCamTrack(rig: MachineRig): {
  pass: boolean;
  minCam: number;
  maxCam: number;
  minTrack: number;
  maxTrack: number;
  samples: number;
  drivers: LockDriver[];
  internal: { pass: boolean; hits: string[]; samples: number };
  trackSupport: ReturnType<typeof evalTrackSupport>;
  margins: Record<S5DogId, { margin: number; stopDelta: number; blocked: boolean }>;
  pairsEvaluated: number;
  maxCenterlineError: number;
  firstHit: string;
  reverseLead: Record<S5DogId, { returnTravel: number; shoulderTravel: number; lead: number }>;
  pathCertificate: S5PathCertificate;
  detail: string;
} {
  const saved = rig.lastDriveT();
  const opts = (rig as MachineRig & { getS5Override?: () => { reverseJam?: boolean; zeroMargin?: boolean } }).getS5Override?.() ?? {};
  const contactGap = 0.0000002;
  const dt = 0.00002;
  const forwardT0 = 0.98;
  const reverseT1 = 0.98;
  const q = Object.fromEntries(S5_DOG_IDS.map((id) => [id, 0])) as Record<S5DogId, number>;
  const firstForwardContact = Object.fromEntries(S5_DOG_IDS.map((id) => [id, 1])) as Record<S5DogId, number>;
  const returnContactTravel = Object.fromEntries(S5_DOG_IDS.map((id) => [id, Infinity])) as Record<S5DogId, number>;
  const shoulderClearTravel = Object.fromEntries(S5_DOG_IDS.map((id) => [id, Infinity])) as Record<S5DogId, number>;
  const exitTravel = Object.fromEntries(S5_DOG_IDS.map((id) => [id, Infinity])) as Record<S5DogId, number>;
  const conflictTravel = Object.fromEntries(S5_DOG_IDS.map((id) => [id, 0])) as Record<S5DogId, number>;
  const clearInsertion = Object.fromEntries(S5_DOG_IDS.map((id) => [id, Infinity])) as Record<S5DogId, number>;
  const tongueAtClear = Object.fromEntries(S5_DOG_IDS.map((id) => [id, 0])) as Record<S5DogId, number>;
  const sectorHit = Object.fromEntries(S5_DOG_IDS.map((id) => [id, ""])) as Record<S5DogId, string>;
  const phases = new Set<string>();
  const internalHits: string[] = [];
  let firstHit = "";
  let firstHitRegistrationIds: string[] = [];
  let pairsEvaluated = 0;
  let samples = 0;
  let minPinBacking = Infinity;
  let minShoeBacking = Infinity;
  let minShoeRail = Infinity;
  let lastSampledPreContactSeparation = Infinity;
  let lastClearDriveT = forwardT0;
  let entryHit = "";
  let maxCenterlineError = 0;
  const physicalUniverseRows = new Map<string, { registrationId: string; name: string }>();
  const pathRelevantRows = new Map<string, S5AuthorityLifetimeRow>();
  const capturedRelevantIds = new Set<string>();
  const identity = auditS5AuthorityIdentity(rig.solids);
  if (!identity.pass) {
    const detail = `authority identity preflight failed before semantic/support/load/contact projection duplicateNames=${identity.duplicateNames
      .map((row) => `${row.name}[${row.registrationIds.join(",")}]`)
      .join(";") || "none"} duplicateIds=${identity.duplicateRegistrationIds
      .map((row) => `${row.registrationId}[${row.names.join(",")}]`)
      .join(";") || "none"}`;
    const invalidReverse = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { returnContactTravel: -1, shoulderClearTravel: -1, shoulderConflictTravel: -1, lead: -1, clearInsertion: -1, tongueInsertionAtClear: -1, exitTravel: -1, finalExtension: 0 }]),
    ) as S5PathCertificate["reverseShoulderClearanceLead"];
    const invalidLead = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { returnTravel: -1, shoulderTravel: -1, lead: -1 }]),
    ) as S5PathCertificate["reverseLead"];
    const invalidRetained = Object.fromEntries(S5_DOG_IDS.map((id) => [id, -1])) as Record<S5DogId, number>;
    const invalidEndpoint = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { extension: 0, insertion: -1, aSide: -1, bSide: -1 }]),
    ) as S5PathCertificate["forwardEndpoint"];
    const physicalRows = rig.solids.filter((row) => row.role === "physical" && meshEnabled(row.node));
    const physicalIds = physicalRows.map(registrationIdOf);
    const inventory: S5PathCertificate["inventory"] = {
      method: "FULL_MOTION_SAMPLED_UNION",
      proofIdentity: "registrationId",
      identityPreflightPassed: false,
      requiredTopologyProjected: false,
      registeredRows: identity.registeredRows,
      registrationIdsUnique: identity.duplicateRegistrationIds.length === 0 && identity.metadataMismatches.length === 0,
      namesUnique: identity.duplicateNames.length === 0,
      duplicateRegistrationIds: identity.duplicateRegistrationIds,
      duplicateNames: identity.duplicateNames,
      metadataIdentityMismatches: identity.metadataMismatches,
      physicalUniverse: physicalRows.map((row) => row.name),
      physicalUniverseRegistrationIds: physicalIds,
      moving: [],
      fixed: [],
      relevant: [],
      relevantRegistrationIds: [],
      capturedRelevant: [],
      pathAdded: [],
      pathAddedRegistrationIds: [],
      approvedSurrounding: [],
      approvedSurroundingRegistrationIds: [],
      unclassified: [],
      unclassifiedRegistrationIds: [],
      invalidClassification: [],
      conflictingClassification: [],
      missingRequired: ["AUTHORITY_IDENTITY_PREFLIGHT_FAILED_BEFORE_REQUIRED_TOPOLOGY_PROJECTION"],
      missingRequiredRegistrationIds: [],
      collisionScope: [],
      collisionScopeRegistrationIds: [],
      lifetimeRows: [],
      complete: false,
    };
    const trackSupport = {
      pass: false,
      missing: ["AUTHORITY_IDENTITY_PREFLIGHT_FAILED_BEFORE_SUPPORT_PROJECTION"],
      edges: [] as S5ProofEdgeReport[],
      minContact: 0,
    };
    const pathCertificate: S5PathCertificate = {
      valid: false,
      samples: 0,
      pairsEvaluated: 0,
      firstHit: detail,
      firstHitRegistrationIds: [],
      minPinBacking: 0,
      minShoeBacking: 0,
      minShoeRail: 0,
      reverseLead: invalidLead,
      reverseShoulderClearanceLead: invalidReverse,
      retainedWorst: invalidRetained,
      passiveForward: false,
      passiveReverse: false,
      entryValid: false,
      entryRange: { driveT0: forwardT0, driveT1: 1, sampleStep: dt, lastClearDriveT: forwardT0, firstContactDriveT: 1, lastSampledPreContactSeparation: 0 },
      forwardEndpoint: invalidEndpoint,
      requiredPieceTopology: S5_REQUIRED_TRACK_TOPOLOGY,
      inventory,
      pairProof: { identity: "registrationId", movingFixed: 0, movingSurrounding: 0, movingMoving: 0, foreignRail: 0, movingMovingPairs: [] },
      intentionalContactTable: {
        immutable: true,
        rules: S5_INTENTIONAL_CONTACT_RULES,
        relations: [],
        instantiatedRelations: 0,
        missingRelationRows: ["identity preflight failed before intentional-contact projection"],
        pass: false,
      },
      analyticComparison: { maxDeviation: -1, tolerance: 2 * S5_TRACK_FREEPLAY_MAX + 0.00001, pass: false },
      supportContinuity: false,
      phases: ["IDENTITY_PREFLIGHT_FAILED_BEFORE_PROOF_PROJECTION"],
      detail,
    };
    const drivers: LockDriver[] = S5_DOG_IDS.map((id) => ({
      id,
      valid: false,
      region: "PRE_PICKUP",
      guideAperture: false,
      wallClear: false,
      confined: false,
      extendBlocked: false,
      retractBlocked: false,
      freePlay: 0,
      minTrackClr: 0,
      maxTrackClr: 0,
      pickupDriveT: 1,
      trackU: 0,
      pinU: 0,
      retainedMargin: -1,
      trackSupported: false,
      detail,
    }));
    const margins = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { margin: -1, stopDelta: -1, blocked: false }]),
    ) as Record<S5DogId, { margin: number; stopDelta: number; blocked: boolean }>;
    setPathCertificate(rig, pathCertificate);
    return {
      pass: false,
      minCam: 0,
      maxCam: 0,
      minTrack: 0,
      maxTrack: 0,
      samples: 0,
      drivers,
      internal: { pass: false, hits: [detail], samples: 0 },
      trackSupport,
      margins,
      pairsEvaluated: 0,
      maxCenterlineError: -1,
      firstHit: detail,
      reverseLead: invalidLead,
      pathCertificate,
      detail,
    };
  }
  const proofBinding = getProofIdentityBinding(rig);
  const pinNodes = Object.fromEntries(
    S5_DOG_IDS.map((id) => [id, boundAuthorityNode(rig, proofBinding, `S5_LOCK_PIN_${id}`) as Mesh | undefined]),
  ) as Record<S5DogId, Mesh | undefined>;
  const dogIdByMovingRegistrationId = new Map<string, S5DogId>(
    S5_DOG_IDS.flatMap((id) => [
      [proofBinding.ids[`S5_LOCK_PIN_${id}`], id] as const,
      [proofBinding.ids[`S5_LOCK_CAM_SHOE_${id}`], id] as const,
    ]),
  );
  const pairCounts = { movingFixed: 0, movingSurrounding: 0, movingMoving: 0, foreignRail: 0 };
  const movingMovingPairs = new Set<string>();

  const recordForbiddenHit = (
    a: S5WorldSolid,
    b: S5WorldSolid,
    stage: "PREREQUISITE" | "FORWARD" | "REVERSE",
    t: number,
  ): void => {
    const hit = `${a.name}[${a.registrationId}]∩${b.name}[${b.registrationId}]@${stage}:${t.toFixed(5)} sep=${obbSeparation(a.obb, b.obb).toFixed(7)}`;
    if (!firstHit) {
      firstHit = hit;
      firstHitRegistrationIds = [a.registrationId, b.registrationId].sort();
    }
    if (
      stage === "FORWARD" &&
      s5TrackBoundsAtZ(s5FollowerZ(t), Boolean(opts.reverseJam)).phase === "PRE_PICKUP" &&
      !entryHit
    ) {
      entryHit = hit;
    }
    const id = dogIdByMovingRegistrationId.get(a.registrationId);
    if (id && !sectorHit[id]) sectorHit[id] = hit;
  };

  /**
   * Discover matter before reading its taxonomy. Relevance is accumulated over
   * every sampled pose. Exact surrounding identities remain in both pair
   * proofs; their identity is not a collision waiver.
   */
  const inspectPhysicalScope = (
    world: S5WorldSolid[],
    stage: "PREREQUISITE" | "FORWARD" | "REVERSE",
    t: number,
  ): void => {
    const physical = world.filter(isS5Material);
    for (const solid of physical) {
      if (!physicalUniverseRows.has(solid.registrationId)) {
        physicalUniverseRows.set(solid.registrationId, { registrationId: solid.registrationId, name: solid.name });
      }
    }
    const poseRelevant = physical.filter(intersectsLockCorridor);
    const poseRelevantIds = new Set(poseRelevant.map((solid) => solid.registrationId));
    for (const solid of poseRelevant) {
      if (!pathRelevantRows.has(solid.registrationId)) {
        pathRelevantRows.set(solid.registrationId, snapshotLifetimeRow(proofBinding, solid, samples, stage, t));
      }
    }

    const moving = physical.filter((s) => isMovingLockSolid(s) && inLockTrackSubsystem(s));
    const pairTargets = physical.filter(
      (s) =>
        isFixedTrackSolid(s) && inLockTrackSubsystem(s) ||
        (!isMovingLockSolid(s) && poseRelevantIds.has(s.registrationId)),
    );
    for (const movingSolid of moving) {
      for (const target of pairTargets) {
        if (movingSolid.registrationId === target.registrationId) continue;
        pairsEvaluated += 1;
        if (isFixedTrackSolid(target)) pairCounts.movingFixed += 1;
        else pairCounts.movingSurrounding += 1;
        if (obbOverlaps(movingSolid.obb, target.obb)) {
          recordForbiddenHit(movingSolid, target, stage, t);
        }
      }
    }

    for (let i = 0; i < moving.length; i += 1) {
      for (let j = i + 1; j < moving.length; j += 1) {
        const a = moving[i];
        const b = moving[j];
        if (a.registrationId === b.registrationId) continue;
        const pairId = [a.registrationId, b.registrationId].sort().join("↔");
        movingMovingPairs.add(pairId);
        pairCounts.movingMoving += 1;
        pairsEvaluated += 1;
        if (obbOverlaps(a.obb, b.obb)) recordForbiddenHit(a, b, stage, t);
      }
    }

    // Non-mechanism matter must remain clear of every positive-thickness
    // working rail even if it misses the shoe at that exact sample.
    const foreign = poseRelevant.filter(
      (s) => !isMovingLockSolid(s) && !proofBinding.requiredFixedIds.has(s.registrationId),
    );
    const rails = physical.filter((s) => proofBinding.requiredRailIds.has(s.registrationId));
    for (const solid of foreign) {
      for (const rail of rails) {
        pairsEvaluated += 1;
        pairCounts.foreignRail += 1;
        if (obbOverlaps(solid.obb, rail.obb)) recordForbiddenHit(solid, rail, stage, t);
      }
    }
  };

  // Exact required topology remains an independent prerequisite. The captured
  // pose is retained only as a comparison set; it no longer bounds relevance.
  rig.applyDrive(1);
  const initialWorld = s5WorldOf(rig);
  for (const solid of initialWorld.filter(isS5Material)) {
    physicalUniverseRows.set(solid.registrationId, { registrationId: solid.registrationId, name: solid.name });
    if (intersectsLockCorridor(solid)) capturedRelevantIds.add(solid.registrationId);
  }
  inspectPhysicalScope(initialWorld, "PREREQUISITE", 1);
  const initialInventory = physicalFirstInventory(
    rig,
    initialWorld,
    identity,
    new Map([...pathRelevantRows].filter(([registrationId]) => capturedRelevantIds.has(registrationId))),
    capturedRelevantIds,
    physicalUniverseRows,
  );
  const initialSupport = evalTrackSupport(rig, initialWorld);
  rig.applyDrive(saved);

  // Exact topology and classification are prerequisites for a mechanical path
  // proof. Fail closed before attempting contact resolution when matter is
  // missing or unclassified; otherwise an impossible one-sided remnant can
  // force thousands of meaningless overlap-resolution iterations.
  if (!initialInventory.complete) {
    const invalidDetail = `incomplete lock/track inventory missing=${initialInventory.missingRequired.join(",")} unclassified=${initialInventory.unclassified.join(",")} invalid=${initialInventory.invalidClassification.join(",")} conflicting=${initialInventory.conflictingClassification.join(",")}`;
    const prerequisiteInternalHits: string[] = [];
    const initialWorldById = indexWorldByRegistrationId(initialWorld);
    for (const id of S5_DOG_IDS) {
      const pin = boundSolid(initialWorldById, proofBinding, `S5_LOCK_PIN_${id}`);
      const shoe = boundSolid(initialWorldById, proofBinding, `S5_LOCK_CAM_SHOE_${id}`);
      for (const wall of hostCanWalls(rig, initialWorld, id)) {
        if (pin && obbOverlaps(pin.obb, wall.obb)) prerequisiteInternalHits.push(`${pin.name}∩${wall.name}@PREREQUISITE`);
        if (shoe && obbOverlaps(shoe.obb, wall.obb)) prerequisiteInternalHits.push(`${shoe.name}∩${wall.name}@PREREQUISITE`);
      }
    }
    const invalidReverse = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { returnContactTravel: -1, shoulderClearTravel: -1, shoulderConflictTravel: -1, lead: -1, clearInsertion: -1, tongueInsertionAtClear: -1, exitTravel: -1, finalExtension: 0 }]),
    ) as S5PathCertificate["reverseShoulderClearanceLead"];
    const invalidLead = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { returnTravel: -1, shoulderTravel: -1, lead: -1 }]),
    ) as S5PathCertificate["reverseLead"];
    const invalidRetained = Object.fromEntries(S5_DOG_IDS.map((id) => [id, -1])) as Record<S5DogId, number>;
    const invalidEndpoint = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { extension: 0, insertion: -1, aSide: -1, bSide: -1 }]),
    ) as S5PathCertificate["forwardEndpoint"];
    const pathCertificate: S5PathCertificate = {
      valid: false,
      samples: 0,
      pairsEvaluated,
      firstHit,
      firstHitRegistrationIds,
      minPinBacking: 0,
      minShoeBacking: 0,
      minShoeRail: 0,
      reverseLead: invalidLead,
      reverseShoulderClearanceLead: invalidReverse,
      retainedWorst: invalidRetained,
      passiveForward: false,
      passiveReverse: false,
      entryValid: false,
      entryRange: {
        driveT0: forwardT0,
        driveT1: 1,
        sampleStep: dt,
        lastClearDriveT: forwardT0,
        firstContactDriveT: 1,
        lastSampledPreContactSeparation: 0,
      },
      forwardEndpoint: invalidEndpoint,
      requiredPieceTopology: S5_REQUIRED_TRACK_TOPOLOGY,
      inventory: initialInventory,
      pairProof: {
        identity: "registrationId",
        ...pairCounts,
        movingMovingPairs: [...movingMovingPairs].sort(),
      },
      intentionalContactTable: {
        immutable: true,
        rules: S5_INTENTIONAL_CONTACT_RULES,
        relations: [],
        instantiatedRelations: 0,
        missingRelationRows: ["certificate prerequisite failed before exact relation instantiation"],
        pass: false,
      },
      analyticComparison: { maxDeviation: -1, tolerance: 2 * S5_TRACK_FREEPLAY_MAX + 0.00001, pass: false },
      supportContinuity: initialSupport.pass,
      phases: ["CERTIFICATE_PREREQUISITE_FAIL"],
      detail: invalidDetail,
    };
    const drivers: LockDriver[] = S5_DOG_IDS.map((id) => ({
      id,
      valid: false,
      region: "PRE_PICKUP",
      guideAperture: false,
      wallClear: false,
      confined: false,
      extendBlocked: false,
      retractBlocked: false,
      freePlay: 0,
      minTrackClr: 0,
      maxTrackClr: 0,
      pickupDriveT: 1,
      trackU: 0,
      pinU: 0,
      retainedMargin: -1,
      trackSupported: initialSupport.pass,
      detail: invalidDetail,
    }));
    const margins = Object.fromEntries(
      S5_DOG_IDS.map((id) => [id, { margin: -1, stopDelta: -1, blocked: false }]),
    ) as Record<S5DogId, { margin: number; stopDelta: number; blocked: boolean }>;
    setPathCertificate(rig, pathCertificate);
    return {
      pass: false,
      minCam: 0,
      maxCam: 0,
      minTrack: 0,
      maxTrack: 0,
      samples: 0,
      drivers,
      internal: { pass: false, hits: prerequisiteInternalHits.length ? prerequisiteInternalHits : [invalidDetail], samples: 0 },
      trackSupport: initialSupport,
      margins,
      pairsEvaluated,
      maxCenterlineError: -1,
      firstHit,
      reverseLead: invalidLead,
      pathCertificate,
      detail: invalidDetail,
    };
  }

  const setExtension = (id: S5DogId, extension: number): void => {
    const pin = pinNodes[id];
    if (!pin) return;
    if (id === "PORT") pin.position.x = -S5_LOCK_PIN_RETRACT_X - extension;
    else if (id === "STARBOARD") pin.position.x = S5_LOCK_PIN_RETRACT_X + extension;
    else pin.position.y = S5_LOCK_PIN_RETRACT_Y_TOP + extension;
  };

  /** Analytic law is reference-only: phase labels and post-simulation comparison. */
  const boundsAt = (z: number) => {
    const b = s5TrackBoundsAtZ(z, Boolean(opts.reverseJam));
    if (opts.zeroMargin && Number.isFinite(b.lower)) b.lower -= 0.006;
    return b;
  };

  /** Resolve the finite rail prisms themselves, including their positive-thickness end caps. */
  const resolveFaceContact = (id: S5DogId, face: "A" | "B", direction: -1 | 1, limit: number): boolean => {
    const overlapsLiveFace = (): boolean => {
      const live = s5WorldOf(rig);
      const liveById = indexWorldByRegistrationId(live);
      const shoe = boundSolid(liveById, proofBinding, `S5_LOCK_CAM_SHOE_${id}`);
      const rails = boundSolids(
        liveById,
        proofBinding,
        face === "A" ? S5_REQUIRED_TRACK_TOPOLOGY[id].faceA : S5_REQUIRED_TRACK_TOPOLOGY[id].faceB,
      );
      return Boolean(shoe && rails.some((rail) => obbOverlaps(shoe.obb, rail.obb)));
    };
    if (!overlapsLiveFace()) return false;

    // Bracket the clear state coarsely, then return to the last penetrating
    // state and refine at the original 5 µm resolution. This is still driven
    // exclusively by live prism overlap; it only avoids rebuilding the full
    // world hundreds of times for intentionally displaced NC fixtures.
    const coarse = 0.00005;
    let coarseSteps = 0;
    while (overlapsLiveFace() && coarseSteps < 140) {
      q[id] += direction * coarse;
      setExtension(id, q[id]);
      coarseSteps += 1;
      if ((direction > 0 && q[id] >= limit) || (direction < 0 && q[id] <= limit)) return true;
    }
    q[id] -= direction * coarse;
    setExtension(id, q[id]);
    for (let i = 0; i < 12 && overlapsLiveFace(); i += 1) {
      q[id] += direction * 0.000005;
      setExtension(id, q[id]);
      if ((direction > 0 && q[id] >= limit) || (direction < 0 && q[id] <= limit)) break;
    }
    return true;
  };

  const inspectPose = (t: number, stage: "FORWARD" | "REVERSE"): void => {
    const world = s5WorldOf(rig);
    const worldById = indexWorldByRegistrationId(world);
    const analyticPhase = boundsAt(s5FollowerZ(t)).phase;
    inspectPhysicalScope(world, stage, t);
    for (const id of S5_DOG_IDS) {
      const pin = boundSolid(worldById, proofBinding, `S5_LOCK_PIN_${id}`);
      const shoe = boundSolid(worldById, proofBinding, `S5_LOCK_CAM_SHOE_${id}`);
      const rails = boundSolids(worldById, proofBinding, [
        ...S5_REQUIRED_TRACK_TOPOLOGY[id].faceA,
        ...S5_REQUIRED_TRACK_TOPOLOGY[id].faceB,
      ]);
      if (!pin || !shoe || rails.length === 0) {
        const hit = `${id} missing pin/shoe/rail`;
        if (!firstHit) firstHit = hit;
        sectorHit[id] ||= hit;
        continue;
      }
      const phase = analyticPhase;
      phases.add(`${stage}:${phase}`);
      const railSep = Math.min(...rails.map((r) => obbSeparation(shoe.obb, r.obb)));
      minShoeRail = Math.min(minShoeRail, railSep);
      if (stage === "FORWARD" && firstForwardContact[id] === 1 && railSep > 0) {
        lastSampledPreContactSeparation = Math.min(lastSampledPreContactSeparation, railSep);
        lastClearDriveT = t;
      }
      const backs = sectorBackings(rig, world, id);
      for (const back of backs) {
        minPinBacking = Math.min(minPinBacking, obbSeparation(pin.obb, back.obb));
        minShoeBacking = Math.min(minShoeBacking, obbSeparation(shoe.obb, back.obb));
      }
      for (const wall of hostCanWalls(rig, world, id)) {
        if (obbOverlaps(pin.obb, wall.obb)) internalHits.push(`${pin.name}∩${wall.name}@${stage}:${t.toFixed(5)}`);
        if (obbOverlaps(shoe.obb, wall.obb)) internalHits.push(`${shoe.name}∩${wall.name}@${stage}:${t.toFixed(5)}`);
      }
      const center = boundsAt(s5FollowerZ(t)).centerExtension;
      maxCenterlineError = Math.max(maxCenterlineError, Math.abs(q[id] - center));
    }
  };

  for (let i = 0; ; i += 1) {
    const t = Math.min(1, forwardT0 + i * dt);
    rig.applyDrive(t);
    for (const id of S5_DOG_IDS) {
      setExtension(id, q[id]);
    }
    for (const id of S5_DOG_IDS) {
      const touched = resolveFaceContact(id, "B", 1, S5_LOCK_EXTEND + S5_TRACK_FREEPLAY_MAX + 0.002);
      if (touched && firstForwardContact[id] === 1) firstForwardContact[id] = t;
    }
    inspectPose(t, "FORWARD");
    samples += 1;
    if (t >= 1) break;
  }

  const forwardQ = { ...q };
  const bSide = {} as Record<S5DogId, number>;
  const aSide = {} as Record<S5DogId, number>;
  const forwardInsertion = {} as Record<S5DogId, number>;
  const bSideInsertion = {} as Record<S5DogId, number>;
  rig.applyDrive(1);
  for (const id of S5_DOG_IDS) {
    setExtension(id, forwardQ[id]);
  }
  let world = s5WorldOf(rig);
  for (const id of S5_DOG_IDS) forwardInsertion[id] = pinInsertionFromWorld(rig, world, id);
  const seekExtreme = (id: S5DogId, face: "A" | "B", seekDirection: -1 | 1): number => {
    if (initialInventory.missingRequired.includes(`S5_LOCK_RAIL_${face}_${id}_CAPTURE`)) return Number.NaN;
    q[id] = forwardQ[id];
    setExtension(id, q[id]);
    for (let i = 0; i < 1200; i += 1) {
      q[id] += seekDirection * 0.000005;
      setExtension(id, q[id]);
      const worldAt = s5WorldOf(rig);
      const worldAtById = indexWorldByRegistrationId(worldAt);
      const shoe = boundSolid(worldAtById, proofBinding, `S5_LOCK_CAM_SHOE_${id}`);
      const rails = boundSolids(
        worldAtById,
        proofBinding,
        face === "A" ? S5_REQUIRED_TRACK_TOPOLOGY[id].faceA : S5_REQUIRED_TRACK_TOPOLOGY[id].faceB,
      );
      if (shoe && rails.some((rail) => obbOverlaps(shoe.obb, rail.obb))) {
        resolveFaceContact(
          id,
          face,
          seekDirection > 0 ? -1 : 1,
          seekDirection > 0 ? -S5_TRACK_FREEPLAY_MAX - 0.002 : S5_LOCK_EXTEND + S5_TRACK_FREEPLAY_MAX + 0.002,
        );
        return q[id];
      }
    }
    return Number.NaN;
  };
  for (const id of S5_DOG_IDS) bSide[id] = seekExtreme(id, "B", -1);
  for (const id of S5_DOG_IDS) aSide[id] = seekExtreme(id, "A", 1);
  for (const id of S5_DOG_IDS) setExtension(id, bSide[id]);
  world = s5WorldOf(rig);
  for (const id of S5_DOG_IDS) bSideInsertion[id] = pinInsertionFromWorld(rig, world, id);
  for (const id of S5_DOG_IDS) setExtension(id, aSide[id]);
  inspectPose(1, "FORWARD");

  rig.applyDrive(1);
  for (const id of S5_DOG_IDS) setExtension(id, bSide[id]);
  world = s5WorldOf(rig);
  const endpointWorldById = indexWorldByRegistrationId(world);
  for (const id of S5_DOG_IDS) {
    const pin = boundSolid(endpointWorldById, proofBinding, `S5_LOCK_PIN_${id}`, false);
    const shoulder = boundSolid(endpointWorldById, proofBinding, `S5_LOCK_SHOULDER_${id}`);
    if (pin && shoulder) conflictTravel[id] = Math.max(0, obbWorldAabb(shoulder.obb).min.z - obbWorldAabb(pin.obb).max.z);
    q[id] = bSide[id];
  }

  for (let i = 0; ; i += 1) {
    const t = Math.max(reverseT1, 1 - i * dt);
    const travel = (1 - t) * P.drive.stroke;
    rig.applyDrive(t);
    for (const id of S5_DOG_IDS) {
      setExtension(id, q[id]);
    }
    for (const id of S5_DOG_IDS) {
      const touched = resolveFaceContact(id, "A", -1, -S5_TRACK_FREEPLAY_MAX - 0.002);
      if (touched && !Number.isFinite(returnContactTravel[id])) returnContactTravel[id] = travel;
    }
    inspectPose(t, "REVERSE");
    world = s5WorldOf(rig);
    for (const id of S5_DOG_IDS) {
      const insertion = pinInsertionFromWorld(rig, world, id);
      if (!Number.isFinite(shoulderClearTravel[id]) && insertion <= 0) {
        shoulderClearTravel[id] = travel;
        clearInsertion[id] = insertion;
        tongueAtClear[id] = evalTongue(rig, world, id).insertion;
      }
      if (!Number.isFinite(exitTravel[id]) && boundsAt(s5FollowerZ(t)).phase === "PRE_PICKUP") exitTravel[id] = travel;
    }
    samples += 1;
    if (t <= reverseT1) break;
  }

  rig.applyDrive(0.94);
  for (const id of S5_DOG_IDS) setExtension(id, q[id]);
  const tongueWithdrawn = S5_DOG_IDS.every((id) => evalTongue(rig, s5WorldOf(rig), id).insertion < 0.01);
  rig.applyDrive(1);
  const support = evalTrackSupport(rig, s5WorldOf(rig));
  const inventory = physicalFirstInventory(
    rig,
    s5WorldOf(rig),
    auditS5AuthorityIdentity(rig.solids),
    pathRelevantRows,
    capturedRelevantIds,
    physicalUniverseRows,
  );
  const intentionalContactTable = instantiateIntentionalContactRelations(rig, s5WorldOf(rig));
  const interfaceWorld = s5WorldOf(rig);
  const interfaceWorldById = indexWorldByRegistrationId(interfaceWorld);
  const declaredNestedPairs = new Set(
    intentionalContactTable.relations
      .filter((row) => row.rule === "FIXED_SPIGOT_TO_MOVING_RECEIVER_NESTED_INTERFACE")
      .map((row) => [row.aRegistrationId, row.bRegistrationId].sort().join("↔")),
  );
  const spigots = boundSolids(
    interfaceWorldById,
    proofBinding,
    ["S5_SPIGOT_PORT", "S5_SPIGOT_STBD", "S5_SPIGOT_TOP", "S5_SPIGOT_BOT"],
  );
  const receivers = boundSolids(
    interfaceWorldById,
    proofBinding,
    ["S5_RECEIVER_PORT", "S5_RECEIVER_STBD", "S5_RECEIVER_TOP", "S5_RECEIVER_BOT"],
  );
  for (const receiver of receivers) {
    for (const spigot of spigots) {
      pairsEvaluated += 1;
      const pairId = [receiver.registrationId, spigot.registrationId].sort().join("↔");
      if (obbOverlaps(receiver.obb, spigot.obb) && !declaredNestedPairs.has(pairId)) {
        recordForbiddenHit(receiver, spigot, "FORWARD", 1);
      }
    }
  }
  const reverseShoulderClearanceLead = {} as S5PathCertificate["reverseShoulderClearanceLead"];
  const reverseLead = {} as Record<S5DogId, { returnTravel: number; shoulderTravel: number; lead: number }>;
  const retainedWorst = {} as Record<S5DogId, number>;
  const forwardEndpoint = {} as S5PathCertificate["forwardEndpoint"];
  const margins = {} as Record<S5DogId, { margin: number; stopDelta: number; blocked: boolean }>;
  for (const id of S5_DOG_IDS) {
    const lead = conflictTravel[id] - shoulderClearTravel[id];
    reverseShoulderClearanceLead[id] = {
      returnContactTravel: returnContactTravel[id],
      shoulderClearTravel: shoulderClearTravel[id],
      shoulderConflictTravel: conflictTravel[id],
      lead,
      clearInsertion: clearInsertion[id],
      tongueInsertionAtClear: tongueAtClear[id],
      exitTravel: exitTravel[id],
      finalExtension: q[id],
    };
    reverseLead[id] = { returnTravel: returnContactTravel[id], shoulderTravel: conflictTravel[id], lead };
    retainedWorst[id] = Math.min(forwardInsertion[id], bSideInsertion[id]);
    forwardEndpoint[id] = { extension: forwardQ[id], insertion: forwardInsertion[id], aSide: aSide[id], bSide: bSide[id] };
    margins[id] = { margin: retainedWorst[id], stopDelta: aSide[id] - bSide[id], blocked: true };
  }
  const reverseOk = S5_DOG_IDS.every(
    (id) =>
      Number.isFinite(returnContactTravel[id]) &&
      Number.isFinite(shoulderClearTravel[id]) &&
      shoulderClearTravel[id] < conflictTravel[id] &&
      reverseShoulderClearanceLead[id].lead >= S5_REVERSE_LEAD_MIN &&
      tongueAtClear[id] >= 0.06 &&
      Number.isFinite(exitTravel[id]) &&
      q[id] <= 0.000021,
  );
  const forwardOk = S5_DOG_IDS.every(
    (id) =>
      firstForwardContact[id] < 1 &&
      Number.isFinite(aSide[id]) &&
      Number.isFinite(bSide[id]) &&
      aSide[id] > bSide[id] &&
      retainedWorst[id] >= S5_RETAINED_INSERTION_MIN &&
      !sectorHit[id],
  );
  const entryValid = entryHit.length === 0;
  const internalPass = internalHits.length === 0;
  // Live unilateral motion may lag the intended centerline by one full two-sided
  // backlash traversal before the opposite face makes contact.
  const analyticTolerance = 2 * S5_TRACK_FREEPLAY_MAX + 0.00001;
  const analyticComparison = {
    maxDeviation: maxCenterlineError,
    tolerance: analyticTolerance,
    pass: maxCenterlineError <= analyticTolerance,
  };
  const pass =
    entryValid &&
    forwardOk &&
    reverseOk &&
    tongueWithdrawn &&
    inventory.complete &&
    support.pass &&
    intentionalContactTable.pass &&
    analyticComparison.pass &&
    internalPass &&
    !firstHit &&
    S5_DOG_IDS.every((id) => retainedWorst[id] >= S5_RETAINED_INSERTION_MIN);
  const minTrack = Math.min(contactGap, S5_TRACK_RUN_CLEARANCE);
  const maxTrack = Math.max(...S5_DOG_IDS.map((id) => aSide[id] - bSide[id]));
  const drivers: LockDriver[] = S5_DOG_IDS.map((id) => ({
    id,
    valid: forwardOk && reverseOk && !sectorHit[id],
    region: "CAPTURED",
    guideAperture: true,
    wallClear: !internalHits.some((h) => h.includes(id)),
    confined: true,
    extendBlocked: firstForwardContact[id] < 1,
    retractBlocked: Number.isFinite(returnContactTravel[id]),
    freePlay: maxTrack,
    minTrackClr: minTrack,
    maxTrackClr: maxTrack,
    pickupDriveT: firstForwardContact[id],
    trackU: 1,
    pinU: forwardQ[id] / S5_LOCK_EXTEND,
    retainedMargin: retainedWorst[id],
    trackSupported: support.pass,
    detail: `${id} B-contact=${firstForwardContact[id].toFixed(5)} endpoint=${forwardQ[id].toFixed(6)} insert=${forwardInsertion[id].toFixed(6)} B-extreme=${bSide[id].toFixed(6)}/${bSideInsertion[id].toFixed(6)} return=${returnContactTravel[id].toFixed(6)} clear=${shoulderClearTravel[id].toFixed(6)} conflict=${conflictTravel[id].toFixed(6)} lead=${reverseShoulderClearanceLead[id].lead.toFixed(6)} exit=${exitTravel[id].toFixed(6)}`,
  }));
  const detail =
    firstHit ||
    (!inventory.complete
      ? `incomplete lock/track inventory missing=${inventory.missingRequired.join(",")} unclassified=${inventory.unclassified.join(",")} invalid=${inventory.invalidClassification.join(",")}`
      : `live-prism slot samples=${samples} pairs=${pairsEvaluated} lastPreContactSep=${lastSampledPreContactSeparation.toFixed(8)} freePlay=${maxTrack.toFixed(6)} forward=${forwardOk} reverse=${reverseOk} analyticDev=${maxCenterlineError.toFixed(7)} support=${support.pass} backing=${minPinBacking.toFixed(6)}`);
  const firstContactDriveT = Math.min(...Object.values(firstForwardContact));
  const pathCertificate: S5PathCertificate = {
    valid: pass,
    samples,
    pairsEvaluated,
    firstHit,
    firstHitRegistrationIds,
    minPinBacking: Number.isFinite(minPinBacking) ? minPinBacking : 0,
    minShoeBacking: Number.isFinite(minShoeBacking) ? minShoeBacking : 0,
    minShoeRail: Number.isFinite(minShoeRail) ? minShoeRail : 0,
    reverseLead,
    reverseShoulderClearanceLead,
    retainedWorst,
    passiveForward: forwardOk,
    passiveReverse: reverseOk,
    entryValid,
    entryRange: {
      driveT0: forwardT0,
      driveT1: Math.max(...Object.values(firstForwardContact)),
      sampleStep: dt,
      lastClearDriveT,
      firstContactDriveT,
      lastSampledPreContactSeparation: Number.isFinite(lastSampledPreContactSeparation)
        ? lastSampledPreContactSeparation
        : 0,
    },
    forwardEndpoint,
    requiredPieceTopology: S5_REQUIRED_TRACK_TOPOLOGY,
    inventory,
    pairProof: {
      identity: "registrationId",
      ...pairCounts,
      movingMovingPairs: [...movingMovingPairs].sort(),
    },
    intentionalContactTable,
    analyticComparison,
    supportContinuity: support.pass,
    phases: [...phases],
    detail,
  };
  rig.applyDrive(saved);
  setPathCertificate(rig, pathCertificate);
  return {
    pass,
    minCam: minTrack,
    maxCam: maxTrack,
    minTrack,
    maxTrack,
    samples,
    drivers,
    internal: { pass: internalPass, hits: internalHits.slice(0, 8), samples },
    trackSupport: support,
    margins,
    pairsEvaluated,
    maxCenterlineError,
    firstHit,
    reverseLead,
    pathCertificate,
    detail,
  };
}

export function s5MovingNames(): string[] {
  return [
    "S5_CAN_PORT",
    "S5_CAN_PORT_MOUTH",
    "S5_CAN_PORT_ABOVE",
    "S5_CAN_PORT_BELOW",
    "S5_CAN_PORT_GUIDE_PLUG_VIS",
    "S5_CAN_STBD",
    "S5_CAN_STBD_MOUTH",
    "S5_CAN_STBD_ABOVE",
    "S5_CAN_STBD_BELOW",
    "S5_CAN_TOP",
    "S5_CAN_TOP_MOUTH",
    "S5_CAN_TOP_PORT_OUT",
    "S5_CAN_TOP_MID",
    "S5_CAN_TOP_STBD_OUT",
    "S5_CAN_BOT",
    "S5_RECEIVER_PORT",
    "S5_RECEIVER_STBD",
    "S5_RECEIVER_TOP",
    "S5_RECEIVER_BOT",
    "S5_SEAT_TONGUE_PORT",
    "S5_SEAT_TONGUE_STARBOARD",
    "S5_SEAT_TONGUE_TOP_PORT",
    "S5_SEAT_TONGUE_TOP_STARBOARD",
    "S5_LOCK_PIN_PORT",
    "S5_LOCK_PIN_STARBOARD",
    "S5_LOCK_PIN_TOP_PORT",
    "S5_LOCK_PIN_TOP_STARBOARD",
    "S5_LOCK_CAM_SHOE_PORT",
    "S5_LOCK_CAM_SHOE_STARBOARD",
    "S5_LOCK_CAM_SHOE_TOP_PORT",
    "S5_LOCK_CAM_SHOE_TOP_STARBOARD",
  ];
}

export function s5FixedNames(): string[] {
  return [
    "S5_CORE_PROXY",
    "S5_CORE_SUPPORT_PORT",
    "S5_CORE_SUPPORT_STBD",
    "S5_CORE_REACTION_FRAME",
    "S5_SPIGOT_PORT",
    "S5_SPIGOT_STBD",
    "S5_SPIGOT_TOP",
    "S5_SPIGOT_BOT",
  ];
}
