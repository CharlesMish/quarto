/**
 * MT1-S1 provisional design-study parameters.
 * All critical dimensions live here. Builders must not invent stray literals
 * for envelopes, strokes, or joint limits.
 *
 * Units: metres and degrees. +X starboard, +Y up, +Z forward.
 */

export const DESIGN_CLEARANCE = 0.06;

export const FRONT_STAGE = {
  prep: [0.0, 0.06],
  bookFold: [0.06, 0.22],
  bookPin: [0.2, 0.28],
  yaw: [0.28, 0.54],
  cant: [0.52, 0.7],
  socket: [0.68, 0.86],
  nestLock: [0.84, 0.94],
} as const;

export const CANT_CANDIDATES_DEG = [65, 70, 75] as const;

/** Certified S1C moving swept union — used as a protected corridor, not rebuilt live. */
export const REAR_E2_CERT = {
  minX: -6.684,
  maxX: 0.5,
  minY: 0.26,
  maxY: 2.925,
  minZ: -7.075,
  maxZ: 0.28,
} as const;

export const REAR_FIREWALL_Z = REAR_E2_CERT.maxZ + DESIGN_CLEARANCE;
export const REAR_SEATED_HALF_WIDTH = 2.239;

export const STAGE = {
  prep: [0.0, 0.06],
  bookFold: [0.06, 0.22],
  bookLatch: [0.2, 0.27],
  yaw: [0.27, 0.54],
  roll: [0.52, 0.7],
  socket: [0.68, 0.84],
  nestLock: [0.82, 0.9],
  driveExit: [0.9, 1.0],
} as const;

/** Candidate roll angles evaluated before freezing Slice-1. */
export const HAUNCH_CANDIDATES_DEG = [55, 62.5, 70, 80] as const;

export const P = {
  /**
   * Frozen after the haunch mini-study (see MT1_DECISIONS.md).
   * 70° keeps a crouched haunch. 80° is the only candidate near the
   * 3.0–3.6 m DRIVE-width sketch; Slice-1 accepts the 70° width
   * overshoot rather than standing the book into a wall.
   */
  haunchDeg: 70,

  keel: {
    halfWidth: 0.75,
    zFwd: 4.55,
    zAft: -4.95,
    dorsalY: 1.52,
    ventralY: 0.1,
    longeronW: 0.24,
    longeronH: 0.15,
    wallT: 0.14,
  },

  bay: {
    halfW: 0.6,
    yBot: 0.28,
    yTop: 1.28,
    zFwd: -1.7,
    zAft: -4.8,
  },

  channel: {
    xIn: -0.75,
    xOut: -1.55,
    yBot: 1.72,
    yTop: 2.7,
    zFwd: -1.72,
    zAft: -4.48,
  },

  /**
   * Rear-left book. High shoulder plane so a downward underside-to-underside
   * fold of a real outer vane clears the floor. Yaw pivot is the
   * trailing-inboard corner so the planform disk stays outboard/aft of the keel.
   */
  rl: {
    spreadX: -1.98,
    nestX: -1.5,
    y: 2.78,
    z: -1.88,
    innerSpan: 2.52,
    outerSpan: 2.16,
    chord: 2.16,
    armorT: 0.12,
    undersideT: 0.16,
    bookGap: 0.08,
    foldDeg: 180,
    yawDeg: -90,
    spreadLockDeg: 72,
    latchDeg: -90,
    latchSpar: [-1.26, -0.1, 2.06] as const,
    keeperOpen: [-1.26, 0.08, 0.98] as const,
    keeperSize: [0.04, 0.04, 0.04] as const,
    jawLocal: [0.48, 0, 0] as const,
    jawSize: [0.06, 0.04, 0.08] as const,
    cheekSize: [0.1, 0.22, 0.03] as const,
    cheekOffsetZ: 0.055,
    cheekSparY: -0.3,
    throatBackSize: [0.1, 0.03, 0.08] as const,
    throatBackSparY: -0.26,
    nestBoltRetractZ: -0.02,
    nestBoltExtendZ: 0.16,
    nestPinSize: [0.035, 0.035, 0.22] as const,
  },

  nestReceiver: {
    x: -1.5,
    y: 2.78,
    z: -1.7,
    outer: [0.16, 0.16, 0.12] as const,
    bore: [0.06, 0.06] as const,
  },

  socketRail: {
    y: 2.78,
    z: -1.88,
    xOut: -2.28,
    xIn: -1.28,
    section: 0.07,
    shoe: 0.11,
  },

  drive: {
    w: 1.0,
    h: 0.82,
    l: 2.55,
    x: 0,
    y: 0.78,
    stowedZ: -3.25,
    stroke: 2.55,
  },

  driveRail: {
    xs: [-0.36, 0.36] as const,
    y: 0.31,
    zFwd: -1.76,
    zAft: -7.15,
    section: 0.06,
    shoe: 0.1,
  },

  keep: {
    /** Pad added after X-mirroring the live seated rear-left book AABB. */
    rearStbdPad: 0.08,
    fwdStbdPad: 0.08,
    cockpit: {
      cx: 0,
      cy: 1.25,
      cz: 3.55,
      hx: 0.68,
      hy: 0.95,
      hz: 1.05,
    },
    dorsal: {
      cx: 0,
      cy: 1.72,
      cz: 0.35,
      hx: 0.2,
      hy: 0.16,
      hz: 1.95,
    },
  },

  fl: {
    innerSpan: 1.7,
    outerSpan: 1.5,
    chord: 1.1,
    armorT: 0.1,
    undersideT: 0.14,
    bookGap: 0.06,
    foldDeg: 180,
    yawDeg: -90,
    cantDeg: 70,
    y: 2.22,
    z: 3.22,
    spreadX: -1.78,
    nestX: -1.38,
    spreadLockDeg: 70,
    bookPinRetractY: -0.04,
    bookPinExtendY: -0.42,
    bookPinSize: [0.028, 0.3, 0.028] as const,
    bookPinSpar: [-0.4, 0, 0.4] as const,
    bookBore: [0.05, 0.05] as const,
    bookCutout: [0.06, 0.06] as const,
    bookReceiverOuter: [0.14, 0.22, 0.14] as const,
    bookReceiverHinge: [-1.3, 0.12, -0.15] as const,
    nestPinRetractX: -0.08,
    nestPinExtendX: 0.16,
    nestPinLocalY: 0.16,
    nestPinLocalZ: 0.28,
    nestPinSize: [0.2, 0.03, 0.03] as const,
    nestReceiver: {
      x: -1.22,
      y: 2.38,
      z: 3.5,
      outer: [0.14, 0.14, 0.14] as const,
      bore: [0.05, 0.05] as const,
    },
    catchKeeperSize: [0.05, 0.05, 0.05] as const,
    catchKeeperSpar: [-1.84, -0.12, 0.55] as const,
    catchThroat: {
      cheek: [0.12, 0.16, 0.025] as const,
      back: [0.025, 0.1, 0.08] as const,
      offsetZ: 0.05,
    },
  },

  flSocketRail: {
    y: 2.22,
    z: 3.22,
    xOut: -2.05,
    xIn: -1.12,
    section: 0.06,
    shoe: 0.09,
  },
} as const;

export function vaneThickness(): number {
  return P.rl.armorT + P.rl.undersideT;
}

export function bookThickness(): number {
  return vaneThickness() * 2 + P.rl.bookGap;
}

export function hingeLocalY(): number {
  return -(vaneThickness() + P.rl.bookGap / 2);
}

export function socketStroke(): number {
  return P.rl.nestX - P.rl.spreadX;
}

export function socketRailLength(): number {
  return P.socketRail.xIn - P.socketRail.xOut;
}

export function flVaneThickness(): number {
  return P.fl.armorT + P.fl.undersideT;
}

export function flBookThickness(): number {
  return flVaneThickness() * 2 + P.fl.bookGap;
}

export function flHingeLocalY(): number {
  return -(flVaneThickness() + P.fl.bookGap / 2);
}

export function flSocketStroke(): number {
  return P.fl.nestX - P.fl.spreadX;
}

export function flSocketRailLength(): number {
  return P.flSocketRail.xIn - P.flSocketRail.xOut;
}

export interface WaistBlockers {
  channelFwd: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  carryAft: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}

export interface WaistCell extends KeepBox {
  name: string;
}

/**
 * Port DRIVE waist: empty occupancy between seated laterals, forward of the
 * rear channel mouth and aft of the FWD_CARRY aft frame. Structure bounds
 * the reservation; it is not allowed inside it.
 */
export function deriveDriveWaistPort(
  front: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  rear: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  blockers?: WaistBlockers,
  pad = DESIGN_CLEARANCE,
  name = "DRIVE_WAIST_PORT",
): WaistCell[] {
  const zAft = blockers ? blockers.channelFwd.max.z + pad : rear.max.z + pad;
  const zFwd = blockers ? blockers.carryAft.min.z - pad : front.min.z - pad;
  const starboard = name.includes("STBD") || (front.min.x + front.max.x) * 0.5 > 0;
  const xOut = starboard ? Math.max(front.max.x, rear.max.x) : Math.min(front.min.x, rear.min.x);
  const xIn = starboard ? P.keel.halfWidth + pad : -P.keel.halfWidth - pad;
  const yBot = Math.max(Math.min(front.min.y, rear.min.y), 0.6);
  const yTop = Math.min(Math.max(front.max.y, rear.max.y), 2.35);
  return [
    {
      name,
      cx: (xOut + xIn) * 0.5,
      cy: (yBot + yTop) * 0.5,
      cz: (zAft + zFwd) * 0.5,
      hx: Math.abs(xIn - xOut) * 0.5,
      hy: Math.abs(yTop - yBot) * 0.5,
      hz: Math.abs(zFwd - zAft) * 0.5,
    },
  ];
}

export function rearCorridorBox(): KeepBox {
  return {
    cx: (REAR_E2_CERT.minX + REAR_E2_CERT.maxX) * 0.5,
    cy: (REAR_E2_CERT.minY + REAR_E2_CERT.maxY) * 0.5,
    cz: (REAR_E2_CERT.minZ + REAR_E2_CERT.maxZ) * 0.5,
    hx: (REAR_E2_CERT.maxX - REAR_E2_CERT.minX) * 0.5,
    hy: (REAR_E2_CERT.maxY - REAR_E2_CERT.minY) * 0.5,
    hz: (REAR_E2_CERT.maxZ - REAR_E2_CERT.minZ) * 0.5,
  };
}

export function driveRailLength(): number {
  return P.driveRail.zFwd - P.driveRail.zAft;
}

export function bayInterior(): { w: number; h: number; l: number } {
  return {
    w: P.bay.halfW * 2,
    h: P.bay.yTop - P.bay.yBot,
    l: P.bay.zFwd - P.bay.zAft,
  };
}

export function channelDepth(): number {
  return P.channel.xIn - P.channel.xOut;
}

export const INSPECTION_T = [0, 0.25, 0.5, 0.75, 0.9, 1] as const;
export const FRONT_INSPECTION_T = [0, 0.2, 0.35, 0.55, 0.75, 0.9, 1] as const;

export const S1A_SHA256 = "4c7ac15b02e80a05351f80f42398c8ddee19d4069648604d913a9e2e4f59b6db";
export const S1B_SHA256 = "08355f7372121f6d23a419403523c39325e8c5c9f9ba73fae309032e0afbf2c4";
export const S1C_SHA256 = "fef06acea92ed2f76e872f99f01dee38969dc755f7845cdd685e1f6bab707201";
export const S2_SHA256 = "9ff777347548ff7917a9f4a028b4ceef31a31f6fa6605952ec6587bad34196bb";
export const S2A_SHA256 = "f38efd6c1691244ceb44069b843aacc4dfd440cce5d745631892c8035c0e8fba";
export const FREEZE_ID = "MT1-S1C";
export const S2_FREEZE_ID = "MT1-S2A";
export const S3_SHA256 = "d6aeb43d684925cbc6266b1b606ab61efa27565a413f800d92ce45eb6f0d975e";
export const S3A_SHA256 = "56e45ff236522753f8626909c93b7dfc5ea347e5ab7087dac5b641eae0f693f8";
export const S3_FREEZE_ID = "MT1-S3";
export const S3A_FREEZE_ID = "MT1-S3A";
export const S4_SHA256 = "a80463583662531aed9c2ec62559dfbb6259d1cf83ae698847c8aaafec40cd93";
export const S4_FREEZE_ID = "MT1-S4";
export const S4A_FREEZE_ID = "MT1-S4A";

/** Declared FWD_CARRY splices. GF6 verifies contact/overlap on these pairs only. */
export const CARRY_INTERFACES: ReadonlyArray<readonly [string, string]> = [
  ["FWD_IFACE_FWD", "BULKHEAD_Z3p35"],
  ["FWD_IFACE_AFT", "BULKHEAD_Z1p15"],
  ["FWD_FRAME_FWD_IN", "FWD_IFACE_FWD"],
  ["FWD_FRAME_FWD_TOP", "FWD_FRAME_FWD_IN"],
  ["FWD_FRAME_AFT", "FWD_IFACE_AFT"],
  ["FWD_LONGERON_HIGH", "FWD_FRAME_FWD_IN"],
  ["FWD_LONGERON_HIGH", "FWD_FRAME_AFT"],
  ["FWD_LONGERON_LOW", "FWD_FRAME_FWD_IN"],
  ["FWD_LONGERON_LOW", "FWD_FRAME_AFT"],
  ["FWD_RAIL_BRACKET", "FWD_FRAME_FWD_TOP"],
  ["FWD_RAIL_BRACKET", "FL_SOCKET_RAIL_BEAM"],
  ["FWD_NEST_BRACKET", "FWD_RAIL_BRACKET"],
  ["FWD_NEST_BRACKET", "FL_NEST_CHEEK_DN"],
  ["FWD_CATCH_ARM", "FWD_FRAME_AFT"],
  ["FWD_CATCH_RISER_FWD", "FWD_CATCH_ARM"],
  ["FWD_CATCH_RISER_AFT", "FWD_CATCH_ARM"],
  ["FWD_CATCH_RISER_FWD", "FL_CATCH_CHEEK_FWD"],
  ["FWD_CATCH_RISER_AFT", "FL_CATCH_CHEEK_AFT"],
];

export const KEEP_FAMILIES = ["keep-rear-stbd", "keep-cockpit", "keep-dorsal"] as const;
export const PROTECTED_FAMILIES = ["keep-cockpit", "keep-dorsal", "keep-rear-corridor", "keep-aft-bay"] as const;
export const EMPTY_OCCUPANCY_FAMILIES = ["keep-rear-stbd", "keep-fwd-stbd"] as const;

export interface KeepBox {
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
}

export function mirrorSeatedRearKeepout(
  min: { x: number; y: number; z: number },
  max: { x: number; y: number; z: number },
  pad = P.keep.rearStbdPad,
): KeepBox {
  return {
    cx: -((min.x + max.x) * 0.5),
    cy: (min.y + max.y) * 0.5,
    cz: (min.z + max.z) * 0.5,
    hx: (max.x - min.x) * 0.5 + pad,
    hy: (max.y - min.y) * 0.5 + pad,
    hz: (max.z - min.z) * 0.5 + pad,
  };
}
