import { P } from "../../design/parameters";
import type { MachineRig } from "../../machine/types";

export const DP1_ID = "MT1-DP1";
export const S4A_SHA256 = "95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8";

export interface StationSet {
  tag: "S4A_GEOMETRY_FACT";
  BAY_FORWARD_STATION: number;
  BAY_AFT_STATION: number;
  BAY_AFT_HOOP: number;
  CAN_STOWED_CENTER: number;
  CAN_STOWED_FORWARD_FACE: number;
  CAN_STOWED_AFT_FACE: number;
  CAN_DEPLOYED_CENTER: number;
  CAN_DEPLOYED_FORWARD_FACE: number;
  CAN_DEPLOYED_AFT_FACE: number;
  canLength: number;
  stroke: number;
  axis: { x_lat: number; y_vert: number };
  outerCan: { w: number; h: number };
  bay: { xHalf: number; yBot: number; yTop: number };
  rails: { xs: readonly number[]; y: number; zFwd: number; zAft: number; section: number; shoe: number };
}

/** Extract stations from frozen S4A parameters. +Z is forward. */
export function stationsFromParams(): StationSet {
  const halfL = P.drive.l / 2;
  const stowedC = P.drive.stowedZ;
  const deployedC = P.drive.stowedZ - P.drive.stroke;
  return {
    tag: "S4A_GEOMETRY_FACT",
    BAY_FORWARD_STATION: P.bay.zFwd,
    BAY_AFT_STATION: P.bay.zAft,
    BAY_AFT_HOOP: P.bay.zAft,
    CAN_STOWED_CENTER: stowedC,
    CAN_STOWED_FORWARD_FACE: stowedC + halfL,
    CAN_STOWED_AFT_FACE: stowedC - halfL,
    CAN_DEPLOYED_CENTER: deployedC,
    CAN_DEPLOYED_FORWARD_FACE: deployedC + halfL,
    CAN_DEPLOYED_AFT_FACE: deployedC - halfL,
    canLength: P.drive.l,
    stroke: P.drive.stroke,
    axis: { x_lat: P.drive.x, y_vert: P.drive.y },
    outerCan: { w: P.drive.w, h: P.drive.h },
    bay: { xHalf: P.bay.halfW, yBot: P.bay.yBot, yTop: P.bay.yTop },
    rails: {
      xs: P.driveRail.xs,
      y: P.driveRail.y,
      zFwd: P.driveRail.zFwd,
      zAft: P.driveRail.zAft,
      section: P.driveRail.section,
      shoe: P.driveRail.shoe,
    },
  };
}

export function canAtDriveT(s: StationSet, driveT: number): { center: number; forward: number; aft: number } {
  const t = Math.min(1, Math.max(0, driveT));
  const center = s.CAN_STOWED_CENTER + t * (s.CAN_DEPLOYED_CENTER - s.CAN_STOWED_CENTER);
  const half = s.canLength / 2;
  return { center, forward: center + half, aft: center - half };
}

/**
 * deployedCanForwardFace - bayAftHoop.
 * Positive => can forward face is forward of the hoop (still occupies the bay).
 */
export function deployedBayEngagement(s: StationSet): {
  tag: "S4A_GEOMETRY_FACT";
  value: number;
  sign: "positive_means_can_forward_face_is_forward_of_hoop";
  canOccupiesBayFrom: number;
  canOccupiesBayTo: number;
  interpretation: "mechanically_useful" | "neutral" | "contradictory";
} {
  const value = s.CAN_DEPLOYED_FORWARD_FACE - s.BAY_AFT_HOOP;
  return {
    tag: "S4A_GEOMETRY_FACT",
    value,
    sign: "positive_means_can_forward_face_is_forward_of_hoop",
    canOccupiesBayFrom: s.BAY_AFT_HOOP,
    canOccupiesBayTo: s.CAN_DEPLOYED_FORWARD_FACE,
    interpretation: value > 0.05 && value < 0.6 ? "mechanically_useful" : value >= 0 ? "neutral" : "contradictory",
  };
}

export function extractLiveCan(
  rig: MachineRig,
  machineT: number,
): { center: { x_lat: number; y_vert: number; z_long: number }; zFwd: number; zAft: number } | null {
  rig.applyMachine(machineT);
  const env = rig.worldSolids().find((s) => s.name === "DRIVE_ENVELOPE");
  if (!env) return null;
  const c = env.obb.center;
  const hz =
    Math.abs(env.obb.axisX.z) * env.obb.half.x +
    Math.abs(env.obb.axisY.z) * env.obb.half.y +
    Math.abs(env.obb.axisZ.z) * env.obb.half.z;
  return { center: { x_lat: c.x, y_vert: c.y, z_long: c.z }, zFwd: c.z + hz, zAft: c.z - hz };
}
