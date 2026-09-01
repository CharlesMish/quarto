import { DESIGN_CLEARANCE, P } from "../../design/parameters";
import { S4A_SHA256 } from "../../design/s5Parameters";
import type { MachineRig } from "../../machine/types";
import { obbWorldAabb } from "../../math/obb";
import { svgKc1Long, svgKc1Top } from "./svg";

export type CrossingClass =
  | "EXISTING_PASSAGE"
  | "EDGE_BYPASS"
  | "SURFACE_HANDOFF"
  | "DECLARED_SLEEVE_REQUIRED"
  | "PENETRATION_REQUIRED"
  | "NO_ROUTE"
  | "UNKNOWN";

export type EpistemicTag =
  | "FROZEN_FACT"
  | "GAMEPLAY_SEMANTIC"
  | "DERIVED_OBLIGATION"
  | "ARCHITECTURE_HYPOTHESIS"
  | "UNKNOWN";

const BULK = [
  { id: "BULKHEAD_Z3p35", z: 3.35, name: "BULKHEAD_Z3.35" },
  { id: "BULKHEAD_Z1p15", z: 1.15, name: "BULKHEAD_Z1.15" },
  { id: "BULKHEAD_Z-1p70", z: P.bay.zFwd, name: "BULKHEAD_Z-1.70" },
] as const;

const KEEP_COCKPIT = P.keep.cockpit;
const KEEP_DORSAL = P.keep.dorsal;
const WAIST_X_IN = P.keel.halfWidth + DESIGN_CLEARANCE;
const CAN_Y_BOT = P.drive.y - P.drive.h / 2;
const KEEL_X = 0.15;
const KEEL_Y_TOP = P.keel.ventralY + 0.07;
const LONGERON_Y_BOT = P.keel.dorsalY - P.keel.longeronH / 2;

type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };

function overlaps(a: Box, b: Box): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}

function aabbOfObb(o: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }): Box {
  return { minX: o.min.x, maxX: o.max.x, minY: o.min.y, maxY: o.max.y, minZ: o.min.z, maxZ: o.max.z };
}

export function runKc1Study(rig: MachineRig): Record<string, unknown> {
  return rig.withPreservedPose(() => {
    const vkLanePort: Box = { minX: -KEEL_X - 0.03, maxX: -KEEL_X, minY: 0.04, maxY: KEEL_Y_TOP, minZ: P.keel.zAft + 0.05, maxZ: P.keel.zFwd - 0.05 };
    const vkLaneStbd: Box = { minX: KEEL_X, maxX: KEEL_X + 0.03, minY: 0.04, maxY: KEEL_Y_TOP, minZ: P.keel.zAft + 0.05, maxZ: P.keel.zFwd - 0.05 };
    const dlLane: Box = {
      minX: -P.keel.longeronW / 2,
      maxX: P.keel.longeronW / 2,
      minY: LONGERON_Y_BOT - 0.03,
      maxY: LONGERON_Y_BOT,
      minZ: P.bay.zFwd + 0.05,
      maxZ: KEEP_COCKPIT.cz - KEEP_COCKPIT.hz - 0.02,
    };

    const poses = [
      { label: "SPREAD", t: 0 },
      { label: "STRUCTURAL_READY", t: 0.84 },
      { label: "DRIVE", t: 1 },
    ];

    const liveConflicts: Record<string, Record<string, string[]>> = {};
    for (const pose of poses) {
      rig.applyMachine(pose.t);
      const moving = rig.worldSolids().filter((s) => s.role === "physical" && s.moving);
      liveConflicts[pose.label] = { vkPort: [], vkStbd: [], dl: [] };
      for (const s of moving) {
        const b = aabbOfObb(obbWorldAabb(s.obb));
        if (overlaps(b, vkLanePort) && !s.name.startsWith("DRIVE_SHOE")) liveConflicts[pose.label].vkPort.push(s.name);
        if (overlaps(b, vkLaneStbd) && !s.name.startsWith("DRIVE_SHOE")) liveConflicts[pose.label].vkStbd.push(s.name);
        if (overlaps(b, dlLane)) liveConflicts[pose.label].dl.push(s.name);
      }
    }

    const lanes = [
      {
        id: "VK",
        name: "ventral-keel side faces (bilateral)",
        start: "keel nose, under front reserved box (y below KEEP_COCKPIT)",
        end: "keel aft end z=−4.95, under bay, short of open stern",
        carrier: "VENTRAL_KEEL port/starboard faces |x|=0.15, y∈[0.03, 0.17]",
        continuity: "Physical bar is continuous z∈[−4.95, 4.55]. Three bulkhead plates occupy the same YX at their stations, so along-face continuity is interrupted every 80 mm.",
        handoffs: BULK.map((st) => st.name),
        proximity: {
          keepCockpit: "Below keep ymin=0.30. Forward segment does not enter KEEP_COCKPIT.",
          keepDorsal: "Far below KEEP_DORSAL ymin=1.56.",
          waist: "Lane |x|≈0.15; certified waist xIn=" + WAIST_X_IN + ". Inboard of waist.",
          can: "Keel top 0.17; can bottom " + CAN_Y_BOT.toFixed(3) + ". Lane stays under the can envelope through the bay.",
          openStern: "Terminates at keel aft; does not occupy the throat.",
          books: "DRIVE nested books minY 0.531 / 1.002. Lane y≤0.17. Fold-path XY at bulkhead 3.35 / −1.70 is residual UNKNOWN.",
        },
        spreadDrive: "Fixed carrier. Survives both endpoint poses. Fold-sweep XY at the three 80 mm wraps remains UNKNOWN.",
        tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag,
        liveMovingConflicts: {
          SPREAD: [...liveConflicts.SPREAD.vkPort, ...liveConflicts.SPREAD.vkStbd],
          STRUCTURAL_READY: [...liveConflicts.STRUCTURAL_READY.vkPort, ...liveConflicts.STRUCTURAL_READY.vkStbd],
          DRIVE: [...liveConflicts.DRIVE.vkPort, ...liveConflicts.DRIVE.vkStbd],
        },
      },
      {
        id: "DL",
        name: "dorsal-longeron underside, aft of reserved box only",
        start: "z just aft of KEEP_COCKPIT (z≈2.48)",
        end: "bay forward station z=−1.70 (longeron ends)",
        carrier: "DORSAL_LONGERON underside y≈" + LONGERON_Y_BOT.toFixed(3),
        continuity: "Member exists z∈[−1.70, 4.55], but the forward part lies inside KEEP_COCKPIT AABB and is not used. Remaining run still meets BULKHEAD_Z1.15.",
        handoffs: ["BULKHEAD_Z1.15", "BULKHEAD_Z-1.70 (down the bay-forward face to VK)"],
        proximity: {
          keepCockpit: "Forward longeron is inside the reserved box — lane truncated. Not consumed.",
          keepDorsal: "Underside is below KEEP_DORSAL ymin=1.56. Top of longeron is not used.",
          waist: "On centerline, inboard of waist.",
          can: "Ends at bay mouth; does not enter can corridor.",
          openStern: "Does not reach the stern.",
          books: "High on centerline; nested books are outboard.",
        },
        spreadDrive: "Fixed carrier. Endpoint-compatible. Does not by itself make a nose-to-stern route.",
        tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag,
        liveMovingConflicts: {
          SPREAD: liveConflicts.SPREAD.dl,
          STRUCTURAL_READY: liveConflicts.STRUCTURAL_READY.dl,
          DRIVE: liveConflicts.DRIVE.dl,
        },
      },
    ];

    const crossings = [
      {
        station: "BULKHEAD_Z3.35",
        questions: "Continue across/around without consuming KEEP_COCKPIT?",
        facts: [
          "Solid plate 1.50 × ~1.54 × 0.08 at z=3.35, x∈[−0.75, 0.75], y∈[~0.04, ~1.58].",
          "VENTRAL_KEEL already intersects the plate bottom (overlapping AABBs). That is structure coincidence, not a third-party passage.",
          "KEEP_COCKPIT z∈[2.50, 4.60], y∈[0.30, 2.20], x∈[−0.68, 0.68]. Over-the-plate (y>1.58) is inside the keep.",
          "Dorsal longeron through this station is inside the keep AABB.",
        ],
        candidates: [
          { id: "over-plate", cls: "NO_ROUTE" as CrossingClass, tag: "FROZEN_FACT" as EpistemicTag, note: "Would occupy KEEP_COCKPIT." },
          { id: "through-plate", cls: "PENETRATION_REQUIRED" as CrossingClass, tag: "DERIVED_OBLIGATION" as EpistemicTag, note: "No existing hole. Not authorized." },
          { id: "keel-intersection-sleeve", cls: "DECLARED_SLEEVE_REQUIRED" as CrossingClass, tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag, note: "A future sleeve at the existing keel/plate intersection would restore along-keel continuity. Study finding only." },
          { id: "keel-height-edge-wrap", cls: "EDGE_BYPASS" as CrossingClass, tag: "UNKNOWN" as EpistemicTag, note: "Walk around the 80 mm plate at x≈±0.75, y≈0.10 (outside keep x and below keep y). Unmarked interstitial, not a reservation. Front hinge z=3.22; fold-path XY is UNKNOWN." },
        ],
        selectedForSkeleton: "DECLARED_SLEEVE_REQUIRED at existing keel/plate intersection",
      },
      {
        station: "BULKHEAD_Z1.15",
        questions: "Cross mid-keel using existing edges/faces without inventing a tunnel?",
        facts: [
          "Same solid plate recipe at z=1.15. Aft of KEEP_COCKPIT.",
          "KEEP_DORSAL includes this z. Keep is y≥1.56, |x|≤0.20 — above the keel-height wrap.",
          "Certified DRIVE waist is outboard of x=" + WAIST_X_IN + ", not the US1 keel-centered diagnostic AABB.",
        ],
        candidates: [
          { id: "dorsal-keep-duct", cls: "NO_ROUTE" as CrossingClass, tag: "FROZEN_FACT" as EpistemicTag, note: "KEEP_DORSAL must remain clear." },
          { id: "through-plate", cls: "PENETRATION_REQUIRED" as CrossingClass, tag: "DERIVED_OBLIGATION" as EpistemicTag, note: "No existing hole." },
          { id: "keel-intersection-sleeve", cls: "DECLARED_SLEEVE_REQUIRED" as CrossingClass, tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag, note: "Same as 3.35: sleeve at keel/plate meeting." },
          { id: "keel-height-edge-wrap", cls: "EDGE_BYPASS" as CrossingClass, tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag, note: "Around plate at x≈±0.75, y≈0.10; inboard of waist; below dorsal keep. Unmarked, not granted AVAILABLE." },
        ],
        selectedForSkeleton: "DECLARED_SLEEVE_REQUIRED at existing keel/plate intersection",
      },
      {
        station: "BULKHEAD_Z-1.70",
        questions: "Hand from forward keel-carrier into/around the bay without entering core or can corridor?",
        facts: [
          "Bay-forward station. Dorsal longeron ends. Ventral keel continues to z=−4.95 under the bay.",
          "Bay interior y∈[0.28, 1.28]. Keel top y=0.17. Can bottom y=" + CAN_Y_BOT.toFixed(3) + ".",
          "Therefore the ventral keel already passes under the can envelope — that is frozen structure, not a new tunnel.",
        ],
        candidates: [
          { id: "enter-can", cls: "NO_ROUTE" as CrossingClass, tag: "FROZEN_FACT" as EpistemicTag, note: "Can stroke/corridor must stay mechanism." },
          { id: "enter-core", cls: "NO_ROUTE" as CrossingClass, tag: "FROZEN_FACT" as EpistemicTag, note: "Fixed core is occupied mechanism." },
          { id: "down-plate-to-keel", cls: "SURFACE_HANDOFF" as CrossingClass, tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag, note: "DL lane (if used) can drop on the bay-forward bulkhead face to VK. Face-riding, no new plate." },
          { id: "keel-under-bay", cls: "SURFACE_HANDOFF" as CrossingClass, tag: "FROZEN_FACT" as EpistemicTag, note: "VK already continues under the bay. Still needs a declared crossing of this 80 mm plate, same as the other bulkheads." },
          { id: "keel-intersection-sleeve", cls: "DECLARED_SLEEVE_REQUIRED" as CrossingClass, tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag, note: "Third required station if VK is the skeleton." },
        ],
        selectedForSkeleton: "SURFACE_HANDOFF under the bay on existing keel, plus DECLARED_SLEEVE_REQUIRED through this plate at the keel intersection",
      },
    ];

    const bayAft = {
      question: "Continue aft on BAY_WALL_* / AFT_POST_* while preserving open stern and can stroke?",
      outboardBayWall: {
        cls: "NO_ROUTE" as CrossingClass,
        tag: "FROZEN_FACT" as EpistemicTag,
        note: "Outboard bay-wall faces sit in the DRIVE book-flank envelopes (nested rear minY 0.531). Not spine space.",
      },
      inboardBayWall: {
        cls: "NO_ROUTE" as CrossingClass,
        tag: "FROZEN_FACT" as EpistemicTag,
        note: "Inner faces bound the can corridor.",
      },
      aftPosts: {
        cls: "NO_ROUTE" as CrossingClass,
        tag: "DERIVED_OBLIGATION" as EpistemicTag,
        note: "Local structure at the throat. Riding them as a through-route would crowd the open stern.",
      },
      vkUnderBay: {
        cls: "SURFACE_HANDOFF" as CrossingClass,
        tag: "FROZEN_FACT" as EpistemicTag,
        note: "Existing VENTRAL_KEEL to z=−4.95 under the can. Terminate before the open throat. Not a transom utility.",
      },
    };

    const outcome = {
      code: "B" as const,
      name: "CONTINUOUS_ROUTE_REQUIRES_DECLARED_CROSSINGS",
      rationale:
        "A coherent forward→aft carrier exists: the ventral keel bar already runs under KEEP_COCKPIT and under the can. No empty spine. No existing holes in the three bulkhead plates. Continuity along that carrier therefore requires a declared crossing at each of BULKHEAD_Z3.35, BULKHEAD_Z1.15, and BULKHEAD_Z-1.70 — ideally sleeves at the already-overlapping keel/plate intersections. Edge-wraps in unmarked interstitial are not treated as granted passages. This does not authorize cutting.",
    };

    const nextSlice = {
      id: "keel-plate-sleeves",
      title: "Declared keel/bulkhead crossing sleeves (three stations)",
      reason:
        "Outcome B: the minimum future architecture is a bounded crossing/sleeve study at the three frozen plates where VENTRAL_KEEL already meets them — still without utility professions, without a hollow fuselage, without KEEP_COCKPIT occupancy, and without ground hardware.",
      requiredCrossings: ["BULKHEAD_Z3.35", "BULKHEAD_Z1.15", "BULKHEAD_Z-1.70"],
      notRecommended: ["BODY-SHELL-04", "cockpit/operator", "wheels/skids/hover", "fuel/batteries/harness assignment", "S6", "new routing tunnel"],
    };

    const report = {
      studyId: "MT1-KC1",
      title: "Keel-Carrier Crossing Interfaces",
      freezeId: "MT1-S5HR3R1",
      sourceS4aSha256: S4A_SHA256,
      participatesInAuthority: false,
      addsVehicleGeometry: false,
      mutatesUs1: false,
      professionsAssigned: [],
      us1Closed: "No empty longitudinal spine. Carrier plus interruptions.",
      keepBoxes: { cockpit: KEEP_COCKPIT, dorsal: KEEP_DORSAL, waistXIn: WAIST_X_IN, canYBot: CAN_Y_BOT },
      lanes,
      crossings,
      bayAft,
      liveConflicts,
      outcome,
      nextSlice,
      protectedConflicts: [
        "KEEP_COCKPIT blocks over-plate and forward-dorsal routes at z=3.35.",
        "KEEP_DORSAL blocks using the longeron top / keep volume as a duct.",
        "DRIVE waist is the outboard empty cell (xIn=" + WAIST_X_IN + "), not a centerline volume.",
        "Can corridor / core remain mechanism.",
        "Open stern remains inspectable void.",
        "Book flanks are not carrier lanes.",
      ],
      svg: { long: "", top: "" },
    };
    report.svg = { long: svgKc1Long(report), top: svgKc1Top(report) };
    return report;
  });
}
