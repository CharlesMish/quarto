import type { StationSet } from "./stations";
import { canAtDriveT } from "./stations";

/** Director-reviewable architectural allowances. Not manufacturing tolerances. */
export const PACKAGING_ASSUMPTIONS = {
  tag: "DP1_ARCHITECTURE_ASSUMPTION" as const,
  canWallPerFace: 0.06,
  canWallRange: [0.05, 0.08] as const,
  runningClearancePerFace: 0.04,
  runningClearanceRange: [0.03, 0.05] as const,
  alignmentThermalPerFace: 0.03,
  alignmentThermalRange: [0.02, 0.04] as const,
  endWallAllowance: 0.06,
  engagementMarginEachEnd: 0.04,
  flowSpigotLength: 0.15,
  recommendedCoreLength: 1.8,
  note: "Study-level allowances for wall, running gap, and alignment. Not a BOM.",
};

export interface PackagingResult {
  tag: "DP1_DERIVED_ARCHITECTURE_RESULT";
  outerCan: { w: number; h: number };
  innerPassage: { w: number; h: number };
  maxCoreSection: { w: number; h: number };
  recommendedCoreSection: { w: number; h: number };
  shoeIntrudesEnvelope: boolean;
  shoeEnvelopeGap: number;
  maxCoreBand: { zAft: number; zFwd: number; length: number };
  recommendedCoreBand: { zAft: number; zFwd: number; length: number };
  handoverStation: number;
  rawBayEngagement: number;
  usableEngagement: number;
  minRadialClearanceOverStroke: number;
  coreClearsCanInteriorOverStroke: boolean;
  canFullyLeavesCoreBulk: boolean;
  canFullyLeavesBay: boolean;
  overlapSamples: Array<{ driveT: number; overlapLength: number; radialClearance: number }>;
}

export interface AllowanceCorner {
  id: string;
  wall: "LOW" | "HIGH";
  running: "LOW" | "HIGH";
  align: "LOW" | "HIGH";
  wall_m: number;
  running_m: number;
  align_m: number;
  maxCoreW: number;
  maxCoreH: number;
  admitsNominalRecommended: boolean;
}

function r4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

export function maxCoreSectionFor(
  outerW: number,
  outerH: number,
  wall: number,
  running: number,
  align: number,
): { w: number; h: number } {
  return {
    w: r4(Math.max(0, outerW - 2 * (wall + running + align))),
    h: r4(Math.max(0, outerH - 2 * (wall + running + align))),
  };
}

/** Eight low/high corners of the published allowance ranges. Does not change those ranges. */
export function enumerateAllowanceCorners(outerW: number, outerH: number, recommended: { w: number; h: number }): {
  tag: "DP1_DERIVED_ARCHITECTURE_RESULT";
  corners: AllowanceCorner[];
  favorable: { w: number; h: number; id: string };
  nominalPublished: { w: number; h: number };
  conservative: { w: number; h: number; id: string };
  NOMINAL_CORE_PROXY: { w: number; h: number };
  RANGE_ROBUST_CORE_PROXY: { w: number; h: number };
  recommendedIsRangeRobust: boolean;
} {
  const a = PACKAGING_ASSUMPTIONS;
  const walls = { LOW: a.canWallRange[0], HIGH: a.canWallRange[1] };
  const runs = { LOW: a.runningClearanceRange[0], HIGH: a.runningClearanceRange[1] };
  const aligns = { LOW: a.alignmentThermalRange[0], HIGH: a.alignmentThermalRange[1] };
  const corners: AllowanceCorner[] = [];
  for (const wall of ["LOW", "HIGH"] as const) {
    for (const running of ["LOW", "HIGH"] as const) {
      for (const align of ["LOW", "HIGH"] as const) {
        const sec = maxCoreSectionFor(outerW, outerH, walls[wall], runs[running], aligns[align]);
        const id = `W${wall[0]}R${running[0]}A${align[0]}`;
        corners.push({
          id,
          wall,
          running,
          align,
          wall_m: walls[wall],
          running_m: runs[running],
          align_m: aligns[align],
          maxCoreW: sec.w,
          maxCoreH: sec.h,
          admitsNominalRecommended: sec.w + 1e-12 >= recommended.w && sec.h + 1e-12 >= recommended.h,
        });
      }
    }
  }
  const byArea = [...corners].sort((p, q) => q.maxCoreW * q.maxCoreH - p.maxCoreW * p.maxCoreH);
  const fav = byArea[0];
  const cons = byArea[byArea.length - 1];
  const nominalPublished = maxCoreSectionFor(
    outerW,
    outerH,
    a.canWallPerFace,
    a.runningClearancePerFace,
    a.alignmentThermalPerFace,
  );
  const recommendedIsRangeRobust = corners.every((c) => c.admitsNominalRecommended);
  return {
    tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
    corners,
    favorable: { w: fav.maxCoreW, h: fav.maxCoreH, id: fav.id },
    nominalPublished,
    conservative: { w: cons.maxCoreW, h: cons.maxCoreH, id: cons.id },
    NOMINAL_CORE_PROXY: { w: recommended.w, h: recommended.h },
    RANGE_ROBUST_CORE_PROXY: { w: cons.maxCoreW, h: cons.maxCoreH },
    recommendedIsRangeRobust,
  };
}

export function derivePackaging(s: StationSet, opts?: { coreScale?: number; solidCan?: boolean; noSeat?: boolean }): PackagingResult {
  const a = PACKAGING_ASSUMPTIONS;
  const scale = opts?.coreScale ?? 1;
  const innerW = opts?.solidCan ? 0 : s.outerCan.w - 2 * a.canWallPerFace;
  const innerH = opts?.solidCan ? 0 : s.outerCan.h - 2 * a.canWallPerFace;
  const maxCoreW = Math.max(0, innerW - 2 * a.runningClearancePerFace - 2 * a.alignmentThermalPerFace) * scale;
  const maxCoreH = Math.max(0, innerH - 2 * a.runningClearancePerFace - 2 * a.alignmentThermalPerFace) * scale;
  const recW = Math.max(0, maxCoreW - 0.04);
  const recH = Math.max(0, maxCoreH - 0.04);

  const envYMin = s.axis.y_vert - s.outerCan.h / 2;
  const shoeYMax = s.rails.y + s.rails.shoe / 2;
  const shoeGap = envYMin - shoeYMax;

  const handover = s.CAN_DEPLOYED_FORWARD_FACE;
  const rawEng = handover - s.BAY_AFT_HOOP;
  const usable = rawEng - 2 * a.engagementMarginEachEnd;

  const innerFwdStowed = s.CAN_STOWED_FORWARD_FACE - a.endWallAllowance;
  const coreZFwd = innerFwdStowed - a.runningClearancePerFace;
  const coreZAftMax = handover;
  const maxLen = coreZFwd - coreZAftMax;
  const recLen = Math.min(a.recommendedCoreLength, Math.max(0.6, maxLen - 0.3));
  const recZAft = handover + 0.12;
  const recZFwd = recZAft + recLen;

  const radial = opts?.solidCan ? -1 : a.runningClearancePerFace + a.alignmentThermalPerFace;
  const samples: PackagingResult["overlapSamples"] = [];
  let minRad = radial;
  let alwaysInterior = !opts?.solidCan && maxCoreW > 0.25 && maxCoreH > 0.25;
  for (let i = 0; i <= 20; i += 1) {
    const driveT = i / 20;
    const can = canAtDriveT(s, driveT);
    const coreAft = recZAft;
    const coreFwd = recZFwd;
    const oAft = Math.max(can.aft, coreAft);
    const oFwd = Math.min(can.forward, coreFwd);
    const overlap = Math.max(0, oFwd - oAft);
    samples.push({ driveT, overlapLength: overlap, radialClearance: overlap > 0 ? radial : Infinity });
    if (overlap > 1e-9) minRad = Math.min(minRad, radial);
    if (opts?.solidCan && overlap > 1e-9) alwaysInterior = false;
  }

  const deployed = canAtDriveT(s, 1);
  const canFullyLeavesBay = deployed.forward <= s.BAY_AFT_HOOP + 1e-9;
  const canFullyLeavesCoreBulk = deployed.forward <= recZAft + usable + 1e-6;

  return {
    tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
    outerCan: { ...s.outerCan },
    innerPassage: { w: innerW, h: innerH },
    maxCoreSection: { w: maxCoreW, h: maxCoreH },
    recommendedCoreSection: { w: recW, h: recH },
    shoeIntrudesEnvelope: shoeGap < 0,
    shoeEnvelopeGap: shoeGap,
    maxCoreBand: { zAft: coreZAftMax, zFwd: coreZFwd, length: maxLen },
    recommendedCoreBand: { zAft: recZAft, zFwd: recZFwd, length: recLen },
    handoverStation: handover,
    rawBayEngagement: rawEng,
    usableEngagement: usable,
    minRadialClearanceOverStroke: minRad,
    coreClearsCanInteriorOverStroke: alwaysInterior && minRad > 0,
    canFullyLeavesCoreBulk,
    canFullyLeavesBay,
    overlapSamples: samples,
  };
}
