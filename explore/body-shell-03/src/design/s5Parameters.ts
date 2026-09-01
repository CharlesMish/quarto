import { P } from "./parameters";

export const S5_FREEZE_ID = "MT1-S5H";
export const S4A_SHA256 = "95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8";
export const DP1AR_SHA256 = "3d63b1d08566fbc095713685d39570aae9fc5f454272eddb273e45e24c24fb71";

/** First-order S5 flow-joint radial clearance per face. Design value, not a tolerance. */
export const S5_FLOW_JOINT_CLEARANCE = 0.03;
export const S5_MIN_INSERTION = 0.05;
export const S5_CONTACT = 0.003;

export const S5P = {
  canWall: 0.06,
  innerW: 0.88,
  innerH: 0.7,
  coreW: 0.7,
  coreH: 0.52,
  coreL: 1.8,
  coreZAft: -4.405,
  coreZFwd: -2.605,
  robustW: 0.66,
  robustH: 0.48,
  spigotL: 0.24,
  spigotZAft: -4.645,
  spigotZFwd: -4.405,
  spigotOuterW: 0.7,
  spigotOuterH: 0.52,
  spigotWall: 0.06,
  receiverDepth: 0.18,
  receiverInnerW: 0.76,
  receiverInnerH: 0.58,
  receiverOuterW: 0.88,
  receiverOuterH: 0.7,
  seatZAft: -4.72,
  seatZFwd: -4.525,
  dogW: 0.04,
  dogH: 0.08,
  dogL: 0.12,
  supportSec: 0.05,
} as const;

export const S5_DOG_IDS = ["PORT", "STARBOARD", "TOP_PORT", "TOP_STARBOARD"] as const;
export const S5_SECTOR_IDS = S5_DOG_IDS;
export type S5DogId = (typeof S5_DOG_IDS)[number];
export type S5SectorId = S5DogId;

/**
 * Cam-driven lock. Can Z is the sole mechanical input.
 *
 * Physical chain:
 *   live can motion
 *     → follower axial station (world Z)
 *     → closed two-sided track centerline
 *     → transverse pin station
 *
 * Analytical helper (same numbers as the track centerline):
 *   followerZ ≈ live pin centre Z = canMouthZ(driveT) − 0.05
 *   u = saturate((CAM_Z0 − followerZ) / (CAM_Z0 − CAM_Z1))
 *   transverse = u * LOCK_EXTEND
 *
 * CAM_Z0 is aft of the +Z retaining-shoulder face so the pin stays
 * inboard until it has passed the shoulder, then extends into the cavity.
 * Reverse traces the same track and retracts before tongue withdrawal.
 *
 * Regions:
 *   PRE-PICKUP  — pin retracted in its can-wall guide aperture; follower clear of track
 *   ACTIVE CAM  — follower in the closed rail pair; axial motion drives extension
 *   CAPTURED    — pin fully extended in the receiver; follower remains in the track
 */
export const S5_LOCK_CAM_Z0 = -4.562;
export const S5_LOCK_CAM_Z1 = -4.575;
/** S5H physical cam ramp. The unchanged lock station remains S5_LOCK_CAM_Z1. */
export const S5_LOCK_RAMP_Z0 = -4.566;
/** Forward and return working faces share the bounded active cam endpoint. */
export const S5_LOCK_B_RAMP_Z0 = -4.552;
export const S5_LOCK_B_RAMP_Z1 = -4.573;
export const S5_LOCK_B_EXIT_Z1 = -4.576;
export const S5_LOCK_RAMP_Z1 = -4.573;
/** Positive-thickness straight mouth begins here; the retracted shoe enters axially. */
export const S5_LOCK_MOUTH_Z0 = -4.548;
/** Captured tail keeps the shoe confined aft of the unchanged nominal endpoint. */
export const S5_LOCK_CAPTURE_Z1 = -4.591;
/** A-face mouth relief joins the steep return surface only after lateral relief exists. */
export const S5_LOCK_A_JOIN_Z = -4.5675;
export const S5_LOCK_A_JOIN_EXTENSION = 0.006;
export const S5_LOCK_A_KNEE_Z = -4.5665;
export const S5_LOCK_A_KNEE_EXTENSION = 0.0055;
export const S5_LOCK_A_LEAD_Z = -4.552;
export const S5_LOCK_A_LEAD_EXTENSION = 0;
export const S5_LOCK_PIN_Z_LOCAL = 1.225;
export const S5_LOCK_EXTEND = 0.026;
export const S5_LOCK_ENTRY = 0.5;
export const S5_PIN_SIZE = { radial: 0.02, height: 0.024, axial: 0.024 } as const;
export const S5_LOCK_PORT_Y = 0.56;
export const S5_LOCK_TOP_X = 0.36;
export const S5_LOCK_PIN_RETRACT_X = 0.478;
export const S5_LOCK_PIN_RETRACT_Y_TOP = 0.4;
export const S5_REGISTER_MOUTH_BAND = 0.08;
export const S5_REGISTER_RADIAL = 0.03;
/** Architectural running clearance, pin shaft vs can-wall guide aperture (per side). */
export const S5_PIN_GUIDE_CLEARANCE = 0.002;
/** Architectural running clearance, captive cam shoe vs each closed-track rail (per side). */
export const S5_TRACK_RUN_CLEARANCE = 0.00035;
/** Return-mouth face finishes the passive reverse stroke to numerical full retract. */
export const S5_TRACK_MOUTH_RETURN_CLEARANCE = 0.00002;
/** Local B-side flare at the constant-extension capture splice. */
export const S5_TRACK_CAPTURE_B_CLEARANCE = 0.001;
/** Local A cam/capture relief for the finite shoe at the direction-changing splice. */
export const S5_TRACK_CAPTURE_A_CLEARANCE = 0.0007;
/** Maximum allowed total slot free play (both sides) for a captive shoe. */
export const S5_TRACK_FREEPLAY_MAX = 0.0017;
/** Cam-shoe thickness along the track normal. */
export const S5_SHOE_THICK = 0.001;
/** Cam-shoe extent along the rail binormal. */
export const S5_SHOE_BINORMAL = 0.008;
/** Cam-shoe length along the slot centerline. */
export const S5_SHOE_LENGTH = 0.0005;
/** Minimum reverse-return lead: RAIL_A contact before retaining-shoulder jam. */
export const S5_REVERSE_LEAD_MIN = 0.001;
export const S5_TRACK_RAIL_THICK = 0.004;
/** Thin, positive-thickness terminal leaf removes the square end-cap projection at capture. */
export const S5_TRACK_TERMINAL_THICK = 0.0006;
/** PORT/STBD follower (parented to pin): outboard of the can wall, jogged in −Y to miss the receiver. */
export const S5_FOLLOWER_PORT = { sx: 0.006, sy: 0.012, sz: 0.008, ox: 0.048, oy: -0.036 } as const;
/** TOP follower: above the can roof, jogged outboard in X to miss the top lock post. */
export const S5_FOLLOWER_TOP = { sx: 0.01, sy: 0.006, sz: 0.008, ox: 0.04, oy: 0.028 } as const;
/** PORT/STBD RAIL_B lock-axis travel to first contact is insertion minus this remaining margin. */
export const S5_TRACK_B_INSET = 0.002;
/** Capture-only rail length past p1; the p0 approach has no matching full-depth pad. */
export const S5_TRACK_CAPTURE_PAD = 0.008;
/** Working-rail height in the binormal (covers follower and splices to the backing plate). */
export const S5_TRACK_RAIL_HEIGHT = 0.028;
/** Captured pin insertion into the receiver guides (architectural, from live AABB). */
export const S5_CAPTURED_PIN_INSERTION: Record<S5SectorId, number> = {
  PORT: 0.008,
  STARBOARD: 0.008,
  TOP_PORT: 0.02,
  TOP_STARBOARD: 0.02,
};
/** Minimum remaining receiver insertion at first physical retraction-side track contact. */
export const S5_RETAINED_INSERTION_MIN = 0.002;
/** NC fixture: shifts the complete return face outward enough to reproduce a top-lock jam. */
export const S5_REVERSE_JAM_A_OFFSET = 0.012;
/** @deprecated S5C U-channel name; track running clearance is S5_TRACK_RUN_CLEARANCE. */
export const S5_CAM_RUN_CLEARANCE = S5_TRACK_RUN_CLEARANCE;

/** Frozen S4A refined envelopes (floor for S5 conservative records). */
export const FROZEN_S4A_E1 = { width: 13.367149536972, height: 2.6649998831748962, length: 10.590000190734864 } as const;
export const FROZEN_S4A_E2 = {
  width: 13.367149536972,
  height: 2.6649998831748962,
  length: 11.395000324249267,
  minX: -6.683574768486,
  maxX: 6.683574768486,
  minY: 0.2600000023841858,
  maxY: 2.924999885559082,
  minZ: -7.075000190734864,
  maxZ: 4.320000133514404,
} as const;
export const FROZEN_S4A_E3 = { width: 13.367149536972, height: 2.894999884068966, length: 11.699999920725823 } as const;

/** Frozen S4A refined whole swept envelope (E4). S5 cannot underbound this. */
export const FROZEN_S4A_E4 = {
  width: 13.367149536972,
  height: 2.894999884068966,
  length: 11.699999920725823,
  minX: -6.683574768486,
  maxX: 6.683574768486,
  minY: 0.030000001490116113,
  maxY: 2.924999885559082,
  minZ: -7.149999923706055,
  maxZ: 4.549999997019768,
} as const;

export const HIST_S3A_REPORT_SHA256 = "49f63bb4ab743e09a02b3af85a1ce2c7425091ecd0748954baa68119d92150c9";
export const HIST_S4_REPORT_SHA256 = "6f6be35955291af8769a2371b2d4f6228b14051aa8a9a207b7a153cca7093bd4";

/** Track parameter from live follower/pin world Z. Geometry of the closed rail pair. */
export function s5TrackUFromZ(followerZ: number): number {
  const u = (S5_LOCK_B_RAMP_Z0 - followerZ) / (S5_LOCK_B_RAMP_Z0 - S5_LOCK_B_RAMP_Z1);
  return Math.min(1, Math.max(0, u));
}

export function s5LockExtension(driveT: number): number {
  const mouth = s5CanMouthZ(driveT);
  const followerZ = mouth - 0.05;
  return Math.min(1, Math.max(0, s5TrackBoundsAtZ(followerZ).centerExtension / S5_LOCK_EXTEND));
}

export function s5GuideAperture(): { y: number; z: number; xTop: number } {
  return {
    y: S5_PIN_SIZE.height + 2 * S5_PIN_GUIDE_CLEARANCE,
    z: S5_PIN_SIZE.axial + 2 * S5_PIN_GUIDE_CLEARANCE,
    xTop: S5_PIN_SIZE.height + 2 * S5_PIN_GUIDE_CLEARANCE,
  };
}

export function s5TrackCenterline(
  id: S5SectorId,
  u: number,
): { x: number; y: number; z: number } {
  const t = Math.min(1, Math.max(0, u));
  const z = S5_LOCK_RAMP_Z0 + t * (S5_LOCK_B_RAMP_Z1 - S5_LOCK_RAMP_Z0);
  if (id === "PORT") {
    const x0 = -S5_LOCK_PIN_RETRACT_X - S5_FOLLOWER_PORT.ox;
    return { x: x0 - t * S5_LOCK_EXTEND, y: S5_LOCK_PORT_Y + S5_FOLLOWER_PORT.oy, z };
  }
  if (id === "STARBOARD") {
    const x0 = S5_LOCK_PIN_RETRACT_X + S5_FOLLOWER_PORT.ox;
    return { x: x0 + t * S5_LOCK_EXTEND, y: S5_LOCK_PORT_Y + S5_FOLLOWER_PORT.oy, z };
  }
  const s = id === "TOP_PORT" ? -1 : 1;
  const y0 = P.drive.y + S5_LOCK_PIN_RETRACT_Y_TOP + S5_FOLLOWER_TOP.oy;
  return { x: s * (S5_LOCK_TOP_X + S5_FOLLOWER_TOP.ox), y: y0 + t * S5_LOCK_EXTEND, z };
}

export function s5TrackSegment(id: S5SectorId): {
  p0: { x: number; y: number; z: number };
  p1: { x: number; y: number; z: number };
  dx: number;
  dy: number;
  dz: number;
  len: number;
  nx: number;
  ny: number;
  nz: number;
  yaw: number;
  pitch: number;
  followerSupport: number;
  angleDeg: number;
  axialLength: number;
  transverseExtension: number;
} {
  const p0 = s5TrackCenterline(id, 0);
  const p1 = s5TrackCenterline(id, 1);
  const vx = p1.x - p0.x;
  const vy = p1.y - p0.y;
  const vz = p1.z - p0.z;
  const len = Math.hypot(vx, vy, vz);
  const dx = vx / len;
  const dy = vy / len;
  const dz = vz / len;
  const lateral = id === "PORT" || id === "STARBOARD";
  let nx = lateral ? dz : 0;
  let ny = lateral ? 0 : -dz;
  let nz = lateral ? -dx : dy;
  if (id === "STARBOARD") {
    nx = -nx;
    nz = -nz;
  }
  const h = lateral ? { sx: S5_SHOE_THICK, sy: S5_SHOE_BINORMAL, sz: S5_SHOE_LENGTH } : { sx: S5_SHOE_BINORMAL, sy: S5_SHOE_THICK, sz: S5_SHOE_LENGTH };
  const followerSupport = Math.abs(nx) * (h.sx / 2) + Math.abs(ny) * (h.sy / 2) + Math.abs(nz) * (h.sz / 2);
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.atan2(-dy, dz);
  const axialLength = Math.abs(p0.z - p1.z);
  const transverseExtension = S5_LOCK_EXTEND;
  const angleDeg = (Math.atan2(transverseExtension, axialLength) * 180) / Math.PI;
  return { p0, p1, dx, dy, dz, len, nx, ny, nz, yaw, pitch, followerSupport, angleDeg, axialLength, transverseExtension };
}

export interface S5TrackLayout {
  id: S5SectorId;
  p0: { x: number; y: number; z: number };
  p1: { x: number; y: number; z: number };
  dx: number;
  dy: number;
  dz: number;
  nx: number;
  ny: number;
  nz: number;
  len: number;
  yaw: number;
  pitch: number;
  angleDeg: number;
  followerSupport: number;
  runClearanceA: number;
  runClearanceB: number;
  runClearanceBZero: number;
  innerOffsetA: number;
  innerOffsetB: number;
  offA: number;
  offB: number;
  offBZero: number;
  thick: number;
  height: number;
  length: number;
  rot: [number, number, number];
  aSize: [number, number, number];
  bSize: [number, number, number];
  aPos: [number, number, number];
  bPos: [number, number, number];
  bPosZero: [number, number, number];
  shoeSize: [number, number, number];
  stopDelta: number;
}

export type S5TrackPieceKind = "MOUTH" | "LEAD" | "TRANSITION" | "CAM_ENTRY" | "CAM" | "CAM_EXIT" | "CAPTURE";

export interface S5TrackPieceLayout {
  id: S5SectorId;
  kind: S5TrackPieceKind;
  p0: { x: number; y: number; z: number };
  p1: { x: number; y: number; z: number };
  dx: number;
  dy: number;
  dz: number;
  nx: number;
  ny: number;
  nz: number;
  length: number;
  rot: [number, number, number];
  aSize: [number, number, number];
  bSize: [number, number, number];
  aPos: [number, number, number];
  bPos: [number, number, number];
  aClearance: number;
  bClearance: number;
  railThickness: number;
}

export type S5TrackPhase = "PRE_PICKUP" | "MOUTH" | "ACTIVE" | "CAPTURED" | "POST_EXIT";

export interface S5TrackBounds {
  phase: S5TrackPhase;
  centerExtension: number;
  lower: number;
  upper: number;
}

/**
 * Continuous two-sided slot: one rotated prism per working face, offset along the
 * track normal by follower support in that direction plus running clearance.
 * PORT/STBD RAIL_B clearance is reduced so first lock-axis retraction contact
 * leaves S5_RETAINED_INSERTION_MIN of receiver insertion.
 */
export function s5TrackLayout(id: S5SectorId): S5TrackLayout {
  const seg = s5TrackSegment(id);
  const lateral = id === "PORT" || id === "STARBOARD";
  const thick = S5_TRACK_RAIL_THICK;
  const height = S5_TRACK_RAIL_HEIGHT;
  const runA = S5_TRACK_RUN_CLEARANCE;
  const captured = S5_CAPTURED_PIN_INSERTION[id];
  const stopDelta = Math.max(0, captured - S5_RETAINED_INSERTION_MIN - 2e-5);
  const retractNx = id === "PORT" ? 1 : id === "STARBOARD" ? -1 : 0;
  const retractNy = id === "PORT" || id === "STARBOARD" ? 0 : -1;
  const nBdotRetract = -seg.nx * retractNx - seg.ny * retractNy;
  const along = Math.abs(nBdotRetract);
  const runB = runA;
  const runBZero = Math.max(runA, captured * along);
  const innerA = seg.followerSupport + runA;
  const innerB = seg.followerSupport + runB;
  const innerBZero = seg.followerSupport + runBZero;
  const offA = innerA + thick / 2;
  const offB = innerB + thick / 2;
  const offBZero = innerBZero + thick / 2;
  const padAft = S5_TRACK_CAPTURE_PAD;
  const length = seg.len + padAft;
  // Shift half the added span toward p1: p0 remains an open approach mouth.
  const dShift = padAft / 2;
  const mid = {
    x: (seg.p0.x + seg.p1.x) / 2,
    y: (seg.p0.y + seg.p1.y) / 2,
    z: (seg.p0.z + seg.p1.z) / 2,
  };
  const spine = (off: number, sign: number): [number, number, number] => [
    mid.x + seg.dx * dShift + sign * seg.nx * off,
    mid.y + seg.dy * dShift + sign * seg.ny * off,
    mid.z + seg.dz * dShift + sign * seg.nz * off,
  ];
  let aPos = spine(offA, 1);
  let bPos = spine(offB, -1);
  let bPosZero = spine(offBZero, -1);
  if (lateral) {
    aPos = [aPos[0], 0.53, aPos[2]];
    bPos = [bPos[0], 0.53, bPos[2]];
    bPosZero = [bPosZero[0], 0.53, bPosZero[2]];
  } else {
    const jog = id === "TOP_PORT" ? 0.007 : -0.007;
    aPos = [mid.x + jog, aPos[1], aPos[2]];
    bPos = [mid.x + jog, bPos[1], bPos[2]];
    bPosZero = [mid.x + jog, bPosZero[1], bPosZero[2]];
  }
  const rot: [number, number, number] = lateral ? [0, seg.yaw, 0] : [seg.pitch, 0, 0];
  const aSize: [number, number, number] = lateral ? [thick, height, length] : [height, thick, length];
  const bSize: [number, number, number] = aSize;
  const shoeSize: [number, number, number] = lateral
    ? [S5_SHOE_THICK, S5_SHOE_BINORMAL, S5_SHOE_LENGTH]
    : [S5_SHOE_BINORMAL, S5_SHOE_THICK, S5_SHOE_LENGTH];
  return {
    id,
    p0: seg.p0,
    p1: seg.p1,
    dx: seg.dx,
    dy: seg.dy,
    dz: seg.dz,
    nx: seg.nx,
    ny: seg.ny,
    nz: seg.nz,
    len: seg.len,
    yaw: seg.yaw,
    pitch: seg.pitch,
    angleDeg: seg.angleDeg,
    followerSupport: seg.followerSupport,
    runClearanceA: runA,
    runClearanceB: runB,
    runClearanceBZero: runBZero,
    innerOffsetA: innerA,
    innerOffsetB: innerB,
    offA,
    offB,
    offBZero,
    thick,
    height,
    length,
    rot,
    aSize,
    bSize,
    aPos,
    bPos,
    bPosZero,
    shoeSize,
    stopDelta,
  };
}

export function s5AllTrackLayouts(): Record<S5SectorId, S5TrackLayout> {
  return {
    PORT: s5TrackLayout("PORT"),
    STARBOARD: s5TrackLayout("STARBOARD"),
    TOP_PORT: s5TrackLayout("TOP_PORT"),
    TOP_STARBOARD: s5TrackLayout("TOP_STARBOARD"),
  };
}

function s5PointAt(id: S5SectorId, extension: number, z: number): { x: number; y: number; z: number } {
  if (id === "PORT") {
    return {
      x: -S5_LOCK_PIN_RETRACT_X - S5_FOLLOWER_PORT.ox - extension,
      y: S5_LOCK_PORT_Y + S5_FOLLOWER_PORT.oy,
      z,
    };
  }
  if (id === "STARBOARD") {
    return {
      x: S5_LOCK_PIN_RETRACT_X + S5_FOLLOWER_PORT.ox + extension,
      y: S5_LOCK_PORT_Y + S5_FOLLOWER_PORT.oy,
      z,
    };
  }
  const s = id === "TOP_PORT" ? -1 : 1;
  return {
    x: s * (S5_LOCK_TOP_X + S5_FOLLOWER_TOP.ox),
    y: P.drive.y + S5_LOCK_PIN_RETRACT_Y_TOP + S5_FOLLOWER_TOP.oy + extension,
    z,
  };
}

function s5Piece(
  id: S5SectorId,
  kind: S5TrackPieceKind,
  p0: { x: number; y: number; z: number },
  p1: { x: number; y: number; z: number },
  aClearance: number,
  bClearance: number,
  railThickness = S5_TRACK_RAIL_THICK,
): S5TrackPieceLayout {
  const lateral = id === "PORT" || id === "STARBOARD";
  const vx = p1.x - p0.x;
  const vy = p1.y - p0.y;
  const vz = p1.z - p0.z;
  const length = Math.hypot(vx, vy, vz);
  const dx = vx / length;
  const dy = vy / length;
  const dz = vz / length;
  let nx = lateral ? dz : 0;
  let ny = lateral ? 0 : -dz;
  let nz = lateral ? -dx : dy;
  if (id === "STARBOARD") {
    nx = -nx;
    nz = -nz;
  }
  const h = lateral
    ? { sx: S5_SHOE_THICK, sy: S5_SHOE_BINORMAL, sz: S5_SHOE_LENGTH }
    : { sx: S5_SHOE_BINORMAL, sy: S5_SHOE_THICK, sz: S5_SHOE_LENGTH };
  const support = Math.abs(nx) * (h.sx / 2) + Math.abs(ny) * (h.sy / 2) + Math.abs(nz) * (h.sz / 2);
  const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2, z: (p0.z + p1.z) / 2 };
  const railPos = (clearance: number, sign: number): [number, number, number] => {
    const off = support + clearance + railThickness / 2;
    const raw: [number, number, number] = [mid.x + sign * nx * off, mid.y + sign * ny * off, mid.z + sign * nz * off];
    if (lateral) raw[1] = 0.53;
    else raw[0] = mid.x + (id === "TOP_PORT" ? 0.007 : -0.007);
    return raw;
  };
  const rot: [number, number, number] = lateral ? [0, Math.atan2(dx, dz), 0] : [Math.atan2(-dy, dz), 0, 0];
  const size: [number, number, number] = lateral
    ? [railThickness, S5_TRACK_RAIL_HEIGHT, length]
    : [S5_TRACK_RAIL_HEIGHT, railThickness, length];
  return {
    id,
    kind,
    p0,
    p1,
    dx,
    dy,
    dz,
    nx,
    ny,
    nz,
    length,
    rot,
    aSize: size,
    bSize: size,
    aPos: railPos(aClearance, 1),
    bPos: railPos(bClearance, -1),
    aClearance,
    bClearance,
    railThickness,
  };
}

/** Positive-thickness reciprocal mouth, steep working cam, and captured tail. */
export function s5TrackPieceLayouts(id: S5SectorId): S5TrackPieceLayout[] {
  const cam20 = s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION + 0.2 * (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION), S5_LOCK_A_JOIN_Z + 0.2 * (S5_LOCK_B_RAMP_Z1 - S5_LOCK_A_JOIN_Z));
  const cam80 = s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION + 0.8 * (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION), S5_LOCK_A_JOIN_Z + 0.8 * (S5_LOCK_B_RAMP_Z1 - S5_LOCK_A_JOIN_Z));
  return [
    s5Piece(
      id,
      "MOUTH",
      s5PointAt(id, 0, S5_LOCK_MOUTH_Z0),
      s5PointAt(id, 0, S5_LOCK_B_RAMP_Z0),
      S5_TRACK_MOUTH_RETURN_CLEARANCE,
      S5_TRACK_RUN_CLEARANCE,
    ),
    s5Piece(
      id,
      "LEAD",
      s5PointAt(id, 0, S5_LOCK_B_RAMP_Z0),
      s5PointAt(id, S5_LOCK_A_KNEE_EXTENSION, S5_LOCK_A_KNEE_Z),
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_RUN_CLEARANCE,
    ),
    s5Piece(
      id,
      "TRANSITION",
      s5PointAt(id, S5_LOCK_A_KNEE_EXTENSION, S5_LOCK_A_KNEE_Z),
      s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION, S5_LOCK_A_JOIN_Z),
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_RUN_CLEARANCE,
    ),
    s5Piece(
      id,
      "CAM_ENTRY",
      s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION, S5_LOCK_A_JOIN_Z),
      cam20,
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_TERMINAL_THICK,
    ),
    s5Piece(id, "CAM", cam20, cam80, S5_TRACK_RUN_CLEARANCE, S5_TRACK_RUN_CLEARANCE),
    s5Piece(
      id,
      "CAM_EXIT",
      cam80,
      s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_B_EXIT_Z1),
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_TERMINAL_THICK,
    ),
    s5Piece(
      id,
      "CAPTURE",
      s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_B_EXIT_Z1),
      s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_CAPTURE_Z1),
      S5_TRACK_RUN_CLEARANCE,
      S5_TRACK_CAPTURE_B_CLEARANCE,
    ),
  ];
}

/**
 * Face-specific physical pieces. The asymmetric A lead is the real S5H mouth
 * relief: its shallow surface is clear on forward entry and remains reciprocal
 * as the return face that finishes retraction on reverse.
 */
export function s5TrackFacePieceLayouts(id: S5SectorId, face: "A" | "B"): S5TrackPieceLayout[] {
  if (face === "A") {
    const cam20 = s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION + 0.2 * (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION), S5_LOCK_A_JOIN_Z + 0.2 * (S5_LOCK_RAMP_Z1 - S5_LOCK_A_JOIN_Z));
    const cam80 = s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION + 0.8 * (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION), S5_LOCK_A_JOIN_Z + 0.8 * (S5_LOCK_RAMP_Z1 - S5_LOCK_A_JOIN_Z));
    return [
      s5Piece(
        id,
        "MOUTH",
        s5PointAt(id, 0, S5_LOCK_MOUTH_Z0),
        s5PointAt(id, 0, S5_LOCK_A_LEAD_Z),
        S5_TRACK_MOUTH_RETURN_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
      ),
      s5Piece(
        id,
        "LEAD",
        s5PointAt(id, S5_LOCK_A_LEAD_EXTENSION, S5_LOCK_A_LEAD_Z),
        s5PointAt(id, S5_LOCK_A_KNEE_EXTENSION, S5_LOCK_A_KNEE_Z),
        S5_TRACK_MOUTH_RETURN_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
      ),
      s5Piece(
        id,
        "TRANSITION",
        s5PointAt(id, S5_LOCK_A_KNEE_EXTENSION, S5_LOCK_A_KNEE_Z),
        s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION, S5_LOCK_A_JOIN_Z),
        S5_TRACK_RUN_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
      ),
      s5Piece(
        id,
        "CAM_ENTRY",
        s5PointAt(id, S5_LOCK_A_JOIN_EXTENSION, S5_LOCK_A_JOIN_Z),
        cam20,
        S5_TRACK_CAPTURE_A_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
        S5_TRACK_TERMINAL_THICK,
      ),
      s5Piece(id, "CAM", cam20, cam80, S5_TRACK_CAPTURE_A_CLEARANCE, S5_TRACK_RUN_CLEARANCE),
      s5Piece(
        id,
        "CAM_EXIT",
        cam80,
        s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_RAMP_Z1),
        S5_TRACK_CAPTURE_A_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
        S5_TRACK_TERMINAL_THICK,
      ),
      s5Piece(
        id,
        "CAPTURE",
        s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_RAMP_Z1),
        s5PointAt(id, S5_LOCK_EXTEND, S5_LOCK_CAPTURE_Z1),
        S5_TRACK_CAPTURE_A_CLEARANCE,
        S5_TRACK_RUN_CLEARANCE,
      ),
    ];
  }
  return s5TrackPieceLayouts(id);
}

/**
 * Transverse corridor imposed by the actual S5H rail profile. `reverseJam` is
 * the packaged high-backlash fixture and matches the live outward A-rail shift.
 */
export function s5TrackBoundsAtZ(followerZ: number, reverseJam = false): S5TrackBounds {
  const entryProximityZ = S5_LOCK_MOUTH_Z0 + S5_SHOE_LENGTH / 2;
  const jam = reverseJam ? S5_REVERSE_JAM_A_OFFSET : 0;
  if (followerZ > entryProximityZ) {
    return { phase: "PRE_PICKUP", centerExtension: 0, lower: -Infinity, upper: Infinity };
  }
  const aCenter =
    followerZ > S5_LOCK_A_LEAD_Z
      ? 0
      : followerZ > S5_LOCK_A_KNEE_Z
        ? S5_LOCK_A_LEAD_EXTENSION +
          (S5_LOCK_A_KNEE_EXTENSION - S5_LOCK_A_LEAD_EXTENSION) *
            Math.min(1, Math.max(0, (S5_LOCK_A_LEAD_Z - followerZ) / (S5_LOCK_A_LEAD_Z - S5_LOCK_A_KNEE_Z)))
      : followerZ > S5_LOCK_A_JOIN_Z
        ? S5_LOCK_A_KNEE_EXTENSION +
          (S5_LOCK_A_JOIN_EXTENSION - S5_LOCK_A_KNEE_EXTENSION) *
            Math.min(1, Math.max(0, (S5_LOCK_A_KNEE_Z - followerZ) / (S5_LOCK_A_KNEE_Z - S5_LOCK_A_JOIN_Z)))
        : S5_LOCK_A_JOIN_EXTENSION +
          (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION) *
            Math.min(1, Math.max(0, (S5_LOCK_A_JOIN_Z - followerZ) / (S5_LOCK_A_JOIN_Z - S5_LOCK_RAMP_Z1)));
  const upper =
    aCenter +
    (followerZ > S5_LOCK_A_KNEE_Z
      ? S5_TRACK_MOUTH_RETURN_CLEARANCE
      : followerZ <= S5_LOCK_A_JOIN_Z
        ? S5_TRACK_CAPTURE_A_CLEARANCE
        : S5_TRACK_RUN_CLEARANCE) +
    jam;
  const bCenter =
    followerZ > S5_LOCK_B_RAMP_Z0
      ? 0
      : followerZ > S5_LOCK_A_KNEE_Z
        ? S5_LOCK_A_KNEE_EXTENSION *
          Math.min(1, Math.max(0, (S5_LOCK_B_RAMP_Z0 - followerZ) / (S5_LOCK_B_RAMP_Z0 - S5_LOCK_A_KNEE_Z)))
        : followerZ > S5_LOCK_A_JOIN_Z
          ? S5_LOCK_A_KNEE_EXTENSION +
            (S5_LOCK_A_JOIN_EXTENSION - S5_LOCK_A_KNEE_EXTENSION) *
              Math.min(1, Math.max(0, (S5_LOCK_A_KNEE_Z - followerZ) / (S5_LOCK_A_KNEE_Z - S5_LOCK_A_JOIN_Z)))
          : S5_LOCK_A_JOIN_EXTENSION +
            (S5_LOCK_EXTEND - S5_LOCK_A_JOIN_EXTENSION) *
              Math.min(1, Math.max(0, (S5_LOCK_A_JOIN_Z - followerZ) / (S5_LOCK_A_JOIN_Z - S5_LOCK_RAMP_Z1)));
  if (followerZ > S5_LOCK_B_RAMP_Z0) {
    return {
      phase: "MOUTH",
      centerExtension: 0,
      lower: -S5_TRACK_RUN_CLEARANCE,
      upper,
    };
  }
  if (followerZ > S5_LOCK_CAM_Z1) {
    return {
      phase: "ACTIVE",
      centerExtension: (aCenter + bCenter) / 2,
      lower: bCenter - S5_TRACK_RUN_CLEARANCE,
      upper,
    };
  }
  return {
    phase: "CAPTURED",
    centerExtension: S5_LOCK_EXTEND,
    lower: S5_LOCK_EXTEND - S5_TRACK_CAPTURE_B_CLEARANCE,
    upper: S5_LOCK_EXTEND + S5_TRACK_CAPTURE_A_CLEARANCE + jam,
  };
}

export function s5FollowerZ(driveT: number): number {
  return s5CanMouthZ(driveT) - 0.05;
}

export function s5DriveTForFollowerZ(z: number): number {
  return (P.drive.stowedZ + P.drive.l / 2 - 0.05 - z) / P.drive.stroke;
}

export function s5CanMouthZ(driveT: number): number {
  const t = Math.min(1, Math.max(0, driveT));
  return P.drive.stowedZ + P.drive.l / 2 - P.drive.stroke * t;
}

export function s5ReceiverInterval(driveT: number): { zAft: number; zFwd: number } {
  const zFwd = s5CanMouthZ(driveT);
  return { zAft: zFwd - S5P.receiverDepth, zFwd };
}

export function s5OverlapLength(a: { zAft: number; zFwd: number }, b: { zAft: number; zFwd: number }): number {
  return Math.max(0, Math.min(a.zFwd, b.zFwd) - Math.max(a.zAft, b.zAft));
}

export function s5SpigotInterval(length: number = S5P.spigotL): { zAft: number; zFwd: number } {
  return { zAft: S5P.spigotZFwd - length, zFwd: S5P.spigotZFwd };
}

export function s5Insertion(driveT: number, spigotLength: number = S5P.spigotL): number {
  return s5OverlapLength(s5SpigotInterval(spigotLength), s5ReceiverInterval(driveT));
}

/** machineT at which mapDrive yields the given driveT. Frozen map: 0.88→1 maps 0→1. */
export function s5MachineTForDriveT(driveT: number): number {
  return 0.88 + Math.min(1, Math.max(0, driveT)) * 0.12;
}
