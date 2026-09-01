import type { PackagingResult } from "./packaging";
import { PACKAGING_ASSUMPTIONS } from "./packaging";
import type { StationSet } from "./stations";

export const DP1A_ID = "MT1-DP1A";
export const SOURCE_DP1_SHA256 = "fc46ae8f55c2484273375a65fe2745a8977929738daf4a5a17e46ee5e7743761";

/** Original published DP1 length, retained for comparison. Not the selected DP1A assumption. */
export const PUBLISHED_SPIGOT_LENGTH = PACKAGING_ASSUMPTIONS.flowSpigotLength;

/**
 * Revised DP1A study assumption (director-reviewable).
 * 0.15 m only yields ~0.030 m insertion after the 0.120 m core→mouth bridge.
 * 0.24 m crosses that bridge and leaves 0.120 m of real overlap inside the
 * 0.18 m receiver, still forward of the aft-post station, with 0.060 m of
 * residual receiver aft of the tip so the lock register can share the
 * interface axially via a different radial zone.
 */
export const SELECTED_SPIGOT_LENGTH = 0.24;
export const SELECTED_RECEIVER_DEPTH = 0.18;

/** Insertion below this is treated as geometrically real but architecturally marginal. */
export const NONDEGENERATE_INSERTION = 0.05;

export type AxialInterval = { zAft: number; zFwd: number };

export function intervalLength(i: AxialInterval): number {
  return i.zFwd - i.zAft;
}

export function overlapLength(a: AxialInterval, b: AxialInterval): number {
  const zAft = Math.max(a.zAft, b.zAft);
  const zFwd = Math.min(a.zFwd, b.zFwd);
  return Math.max(0, zFwd - zAft);
}

export interface FlowHandover {
  tag: "DP1_DERIVED_ARCHITECTURE_RESULT";
  CORE_BULK_AFT_FACE: number;
  CAN_DEPLOYED_FORWARD_FACE: number;
  BAY_AFT_STATION: number;
  coreToCanMouthGap: number;
  coreToCanMouthGapSign: "positive_means_core_aft_face_is_forward_of_can_mouth";
  publishedSpigotLength: number;
  selectedSpigotLength: number;
  spigotLengthChanged: boolean;
  FLOW_SPIGOT_ROOT: number;
  FLOW_SPIGOT_AFT_TIP: number;
  FLOW_SPIGOT_INTERVAL: AxialInterval;
  CAN_RECEIVER_FORWARD_FACE: number;
  CAN_RECEIVER_AFT_EXTENT: number;
  CAN_RECEIVER_INTERVAL: AxialInterval;
  receiverDepth: number;
  publishedInsertionIfUnchanged: number;
  flowInsertion: number;
  remainingReceiverAftOfTip: number;
  remainingBayAftOfTip: number;
  axialPassageContinuous: boolean;
  allInterfaceMarginsNonNegative: boolean;
  nondegenerateInsertionThreshold: number;
  nondegenerate: boolean;
}

export function modelFlowHandover(
  s: StationSet,
  pack: PackagingResult,
  opts?: { spigotLength?: number; receiverDepth?: number; noReceiver?: boolean; blockPassage?: boolean },
): FlowHandover {
  const coreAft = pack.recommendedCoreBand.zAft;
  const canMouth = s.CAN_DEPLOYED_FORWARD_FACE;
  const bayAft = s.BAY_AFT_STATION ?? s.BAY_AFT_HOOP;
  const coreToCanMouthGap = coreAft - canMouth;
  const publishedTip = coreAft - PUBLISHED_SPIGOT_LENGTH;
  const publishedReceiver: AxialInterval = { zAft: canMouth - SELECTED_RECEIVER_DEPTH, zFwd: canMouth };
  const publishedInsertion = overlapLength({ zAft: publishedTip, zFwd: coreAft }, publishedReceiver);

  const spigotLen = opts?.spigotLength ?? SELECTED_SPIGOT_LENGTH;
  const recvDepth = opts?.noReceiver ? 0 : (opts?.receiverDepth ?? SELECTED_RECEIVER_DEPTH);
  const root = coreAft;
  const tip = root - spigotLen;
  const recvFwd = canMouth;
  const recvAft = canMouth - recvDepth;
  const spigot: AxialInterval = { zAft: tip, zFwd: root };
  const receiver: AxialInterval = { zAft: recvAft, zFwd: recvFwd };
  const insertion = overlapLength(spigot, receiver);
  const remainingReceiverAftOfTip = insertion > 0 ? tip - recvAft : 0;
  const remainingBayAftOfTip = tip - bayAft;
  const passageOpen = !opts?.blockPassage && pack.innerPassage.w > 0.4 && pack.innerPassage.h > 0.35;
  const marginsOk =
    insertion >= 0 &&
    recvDepth >= 0 &&
    coreToCanMouthGap >= 0 &&
    tip <= root &&
    remainingReceiverAftOfTip >= -1e-9 &&
    remainingBayAftOfTip >= -1e-9;
  const nondegenerate = insertion > NONDEGENERATE_INSERTION && recvDepth > 0 && passageOpen && marginsOk;

  return {
    tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
    CORE_BULK_AFT_FACE: coreAft,
    CAN_DEPLOYED_FORWARD_FACE: canMouth,
    BAY_AFT_STATION: bayAft,
    coreToCanMouthGap,
    coreToCanMouthGapSign: "positive_means_core_aft_face_is_forward_of_can_mouth",
    publishedSpigotLength: PUBLISHED_SPIGOT_LENGTH,
    selectedSpigotLength: spigotLen,
    spigotLengthChanged: Math.abs(spigotLen - PUBLISHED_SPIGOT_LENGTH) > 1e-9,
    FLOW_SPIGOT_ROOT: root,
    FLOW_SPIGOT_AFT_TIP: tip,
    FLOW_SPIGOT_INTERVAL: spigot,
    CAN_RECEIVER_FORWARD_FACE: recvFwd,
    CAN_RECEIVER_AFT_EXTENT: recvAft,
    CAN_RECEIVER_INTERVAL: receiver,
    receiverDepth: recvDepth,
    publishedInsertionIfUnchanged: publishedInsertion,
    flowInsertion: insertion,
    remainingReceiverAftOfTip,
    remainingBayAftOfTip,
    axialPassageContinuous: passageOpen,
    allInterfaceMarginsNonNegative: marginsOk,
    nondegenerateInsertionThreshold: NONDEGENERATE_INSERTION,
    nondegenerate,
  };
}

export interface SpigotCandidate {
  id: string;
  length: number;
  insertion: number;
  tip: number;
  remainingReceiverAftOfTip: number;
  nondegenerate: boolean;
  judgment: string;
}

export function enumerateSpigotCandidates(s: StationSet, pack: PackagingResult): SpigotCandidate[] {
  const rows: Array<{ id: string; length: number; judgment: string }> = [
    {
      id: "published_0.150",
      length: PUBLISHED_SPIGOT_LENGTH,
      judgment: "marginal — ~30 mm insertion after the 120 mm core-to-mouth bridge",
    },
    {
      id: "selected_0.240",
      length: SELECTED_SPIGOT_LENGTH,
      judgment: "selected DP1A assumption — 120 mm insertion with residual receiver for coaxial register",
    },
    {
      id: "receiver_fill_0.300",
      length: SELECTED_RECEIVER_DEPTH + 0.12,
      judgment: "longest useful for the 0.18 m receiver — fills the sleeve, no residual receiver",
    },
  ];
  return rows.map((row) => {
    const f = modelFlowHandover(s, pack, { spigotLength: row.length });
    return {
      id: row.id,
      length: row.length,
      insertion: f.flowInsertion,
      tip: f.FLOW_SPIGOT_AFT_TIP,
      remainingReceiverAftOfTip: f.remainingReceiverAftOfTip,
      nondegenerate: f.nondegenerate,
      judgment: row.judgment,
    };
  });
}

export type GraphEdgeKind =
  | "same_interface_station"
  | "overlapping_study_envelope"
  | "named_future_direct_splice"
  | "existing_s4a_physical_contact";

export interface GraphEdge {
  from: string;
  to: string;
  kind: GraphEdgeKind;
  note: string;
}

export interface StructuralHandover {
  tag: "DP1_ARCHITECTURE_ASSUMPTION";
  BAY_AFT_STATION: number;
  aftStructureLabel: "AFT_POST_PAIR";
  aftStructureMembers: string[];
  seat: {
    zFwd: number;
    zAft: number;
    lateralGapEach: number;
    verticalGapUpper: number;
    verticalGapLower: number;
    railFreeSectors: string[];
    excludedSectors: string[];
  };
  register: { zFwd: number; zAft: number; role: "INNER_ANNULUS" };
  lugs: { zFwd: number; zAft: number; sectors: string[]; count: number; role: "OUTER_SECTORS" };
  HANDOVER_FRAME_ENVELOPE: { zFwd: number; zAft: number; xHalf: number; yBot: number; yTop: number };
  graph: GraphEdge[];
  graphConnected: boolean;
  terminatesOnExistingS4a: boolean;
  railBypassComplete: boolean;
  lugClearsRails: boolean;
  coexistenceOk: boolean;
  zoning: {
    CENTER: string;
    INNER_ANNULUS: string;
    OUTER_SECTORS: string;
    EXCLUDED_SECTORS: string;
  };
  axialZoning: {
    coreBulkAft: number;
    spigot: AxialInterval;
    receiver: AxialInterval;
    seatRegister: AxialInterval;
    lugEngagement: AxialInterval;
    handoverFrame: AxialInterval;
    aftPostStation: number;
  };
}

export function modelStructuralHandover(
  s: StationSet,
  pack: PackagingResult,
  flow: FlowHandover,
  opts?: { noSeat?: boolean; noFrame?: boolean; railsOnly?: boolean; lugHitsRail?: boolean },
): StructuralHandover {
  const bayAft = s.BAY_AFT_STATION ?? s.BAY_AFT_HOOP;
  const canMouth = s.CAN_DEPLOYED_FORWARD_FACE;
  const latGap = s.bay.xHalf - s.outerCan.w / 2;
  const yCanTop = s.axis.y_vert + s.outerCan.h / 2;
  const yCanBot = s.axis.y_vert - s.outerCan.h / 2;
  const vertUp = s.bay.yTop - yCanTop;
  const vertDn = yCanBot - s.bay.yBot;
  const seatZFwd = canMouth;
  const seatZAft = canMouth - Math.min(pack.usableEngagement, 0.195);
  const lugClearsRails = !opts?.lugHitsRail;
  const railFree = lugClearsRails ? ["PORT", "STARBOARD", "TOP"] : [];
  const excluded = ["BOTTOM_RAIL_SHOE"];

  const frame = {
    zFwd: canMouth,
    zAft: bayAft,
    xHalf: s.bay.xHalf + 0.05,
    yBot: s.bay.yBot,
    yTop: s.bay.yTop,
  };

  const edges: GraphEdge[] = [];
  if (!opts?.noSeat && !opts?.railsOnly) {
    edges.push({
      from: "MOVING_CAN",
      to: "MOVING_LOCK_HALF",
      kind: "same_interface_station",
      note: "lugs/register on can mouth, coaxial with receiver",
    });
    edges.push({
      from: "MOVING_LOCK_HALF",
      to: "FIXED_REGISTER_SEAT",
      kind: "overlapping_study_envelope",
      note: "seat band shares axial interval with can mouth / receiver",
    });
  }
  if (!opts?.noFrame && !opts?.noSeat && !opts?.railsOnly) {
    edges.push({
      from: "FIXED_REGISTER_SEAT",
      to: "HANDOVER_FRAME",
      kind: "named_future_direct_splice",
      note: "future S5 frame starts at seat, not current S4A geometry",
    });
    edges.push({
      from: "HANDOVER_FRAME",
      to: "AFT_POST_PAIR",
      kind: "named_future_direct_splice",
      note: "frame aft end meets AFT_POST_PORT/STBD at BAY_AFT_STATION",
    });
    edges.push({
      from: "HANDOVER_FRAME",
      to: "BAY_WALL_PORT/STBD",
      kind: "named_future_direct_splice",
      note: "frame may splice to BAY_WALL_PORT/STBD",
    });
  }
  edges.push({
    from: "AFT_POST_PAIR",
    to: "BAY_WALL_PORT/STBD",
    kind: "existing_s4a_physical_contact",
    note: "AFT_POST_PORT/STBD physically contact the corresponding BAY_WALL_PORT/STBD solids",
  });
  edges.push({
    from: "BAY_WALL_PORT/STBD",
    to: "BULKHEAD_Z-1p70",
    kind: "existing_s4a_physical_contact",
    note: "BAY_WALL_PORT/STBD physically contact BULKHEAD_Z-1p70",
  });
  edges.push({
    from: "BULKHEAD_Z-1p70",
    to: "VENTRAL_KEEL",
    kind: "existing_s4a_physical_contact",
    note: "BULKHEAD_Z-1p70 physically contacts VENTRAL_KEEL",
  });
  if (opts?.railsOnly) {
    edges.push({
      from: "MOVING_CAN",
      to: "DRIVE_RAILS",
      kind: "existing_s4a_physical_contact",
      note: "shoes on rails — deployment guide only; not an operating-load path",
    });
  }

  const has = (a: string, b: string) => edges.some((e) => e.from === a && e.to === b);
  const bypass =
    !opts?.railsOnly &&
    has("MOVING_CAN", "MOVING_LOCK_HALF") &&
    has("MOVING_LOCK_HALF", "FIXED_REGISTER_SEAT") &&
    has("FIXED_REGISTER_SEAT", "HANDOVER_FRAME") &&
    has("HANDOVER_FRAME", "AFT_POST_PAIR") &&
    has("AFT_POST_PAIR", "BAY_WALL_PORT/STBD") &&
    has("BAY_WALL_PORT/STBD", "BULKHEAD_Z-1p70") &&
    has("BULKHEAD_Z-1p70", "VENTRAL_KEEL") &&
    !edges.some((e) => e.from === "DRIVE_RAILS" || e.to === "DRIVE_RAILS");
  const terminates = edges.some((e) => e.to === "VENTRAL_KEEL");
  const seatRegionOk = latGap > 0.05 && vertUp > 0.05 && vertDn > 0.05 && seatZFwd > seatZAft;
  const coexist =
    seatRegionOk &&
    lugClearsRails &&
    flow.flowInsertion > 0 &&
    flow.receiverDepth > 0 &&
    !opts?.noSeat &&
    !opts?.railsOnly;

  return {
    tag: "DP1_ARCHITECTURE_ASSUMPTION",
    BAY_AFT_STATION: bayAft,
    aftStructureLabel: "AFT_POST_PAIR",
    aftStructureMembers: [
      "AFT_POST_PORT",
      "AFT_POST_STBD",
      "BAY_WALL_PORT",
      "BAY_WALL_STBD",
      "BULKHEAD_Z-1p70",
      "VENTRAL_KEEL",
    ],
    seat: {
      zFwd: seatZFwd,
      zAft: seatZAft,
      lateralGapEach: latGap,
      verticalGapUpper: vertUp,
      verticalGapLower: vertDn,
      railFreeSectors: railFree,
      excludedSectors: excluded,
    },
    register: { zFwd: canMouth, zAft: canMouth - 0.12, role: "INNER_ANNULUS" },
    lugs: { zFwd: canMouth, zAft: canMouth - 0.16, sectors: railFree, count: 4, role: "OUTER_SECTORS" },
    HANDOVER_FRAME_ENVELOPE: frame,
    graph: edges,
    graphConnected: bypass,
    terminatesOnExistingS4a: terminates,
    railBypassComplete: bypass,
    lugClearsRails,
    coexistenceOk: Boolean(coexist),
    zoning: {
      CENTER: "continuous flow passage (inner bore)",
      INNER_ANNULUS: "spigot / can receiver / alignment register",
      OUTER_SECTORS: "structural lugs in PORT/STBD/TOP; coaxial with flow, not serial",
      EXCLUDED_SECTORS: "BOTTOM rail/shoe sector",
    },
    axialZoning: {
      coreBulkAft: flow.CORE_BULK_AFT_FACE,
      spigot: flow.FLOW_SPIGOT_INTERVAL,
      receiver: flow.CAN_RECEIVER_INTERVAL,
      seatRegister: { zAft: canMouth - 0.12, zFwd: canMouth },
      lugEngagement: { zAft: canMouth - 0.16, zFwd: canMouth },
      handoverFrame: { zAft: bayAft, zFwd: canMouth },
      aftPostStation: bayAft,
    },
  };
}
