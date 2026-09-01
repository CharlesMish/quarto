/** Frozen S4A identity. Study input only — not an S5 freeze. */
export const VB1_ID = "MT1-VB1";
export const S4A_SHA256 = "95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8";

export const MACHINE_HEIGHT_M = 2.895;
export const MACHINE_LENGTH_M = 11.7;
export const STRUCTURAL_READY_T = 0.84;

export const NAMED_STATES = [
  { id: "SPREAD", machineT: 0 },
  { id: "MID_FOLD", machineT: 0.15 },
  { id: "POST_YAW", machineT: 0.54 },
  { id: "POST_HAUNCH_CANT", machineT: 0.7 },
  { id: "STRUCTURAL_READY", machineT: STRUCTURAL_READY_T },
  { id: "DRIVE", machineT: 1 },
] as const;

export type NamedStateId = (typeof NAMED_STATES)[number]["id"];

export const TRACE_STEP = 0.05;

export const FAMILY_IDS = [
  "F1_REAR_BOOKS",
  "F2_FRONT_BOOKS",
  "F3_REAR_FIXED",
  "F4_FRONT_CARRY_FIXED",
  "F5_CENTRAL_STRUCTURE",
  "F6_DRIVE_MOVING",
  "F7_DRIVE_FIXED",
  "F8_COCKPIT_ALLOWANCE",
  "F9_WAIST_SYSTEMS_ALLOWANCE",
] as const;

export type FamilyId = (typeof FAMILY_IDS)[number];

export const LATERAL_TOL = 0.02;
export const METRE_CLASS = 1.0;
export const EXTREME_DRIVE_DZ = 2.0;

export const FORBIDDEN_CLAIM_WORDS = [
  "vehicle validated",
  "will fly",
  "is stable",
  "unstable",
  "untrimmable",
  "aerodynamic center",
  "static margin",
  "%mac",
  "gev confirmed",
  "hover-capable",
  "hover capable",
  "insufficient control",
  "needs canard",
  "thrust is adequate",
  "cfd",
];
