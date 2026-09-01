import { P } from "../../design/parameters";
import { S4A_SHA256, S5P } from "../../design/s5Parameters";
import type { MachineRig } from "../../machine/types";
import { obbWorldAabb } from "../../math/obb";
import { svgUs1Long, svgUs1Top } from "./svg";

export type Us1Class =
  | "OCCUPIED_STRUCTURE"
  | "OCCUPIED_MECHANISM"
  | "MUST_REMAIN_CLEAR"
  | "SERVICE_INTERFACE"
  | "ROUTING_CANDIDATE"
  | "UNCLAIMED_BUT_PROTECTED"
  | "UNKNOWN";

export type EpistemicTag =
  | "FROZEN_FACT"
  | "GAMEPLAY_SEMANTIC"
  | "DERIVED_OBLIGATION"
  | "ARCHITECTURE_HYPOTHESIS"
  | "UNKNOWN";

type Keep = { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number };

const REGIONS: Array<{
  id: string;
  name: string;
  box: Keep;
  occupantsHint: string[];
  reservation: string;
  cls: Us1Class;
  routeThrough: string;
  occupyVolume: string;
  access: string;
  forbiddenIfConsumed: string;
  tag: EpistemicTag;
  note: string;
}> = [
  {
    id: "front-reserved-box",
    name: "front reserved box (KEEP_COCKPIT, historical name only)",
    box: P.keep.cockpit,
    occupantsHint: [],
    reservation: "KEEP_COCKPIT protected-corridor; protects BULKHEAD_Z3p35",
    cls: "UNCLAIMED_BUT_PROTECTED",
    routeThrough: "No. Not a free longitudinal tunnel. Not an operator assignment.",
    occupyVolume: "No arbitrary hardware. Occupant remains UNKNOWN.",
    access: "Protected; must not be shrunk to pass laterals.",
    forbiddenIfConsumed: "Would pre-empt occupancy-requirement work and fake a cockpit.",
    tag: "FROZEN_FACT",
    note: "Historical name does not establish crew/operator. BODY-SHELL-03.1 nose is visualization only.",
  },
  {
    id: "ventral-keel",
    name: "ventral keel (longitudinal centerline member)",
    box: { cx: 0, cy: P.keel.ventralY, cz: (P.keel.zFwd + P.keel.zAft) * 0.5, hx: 0.15, hy: 0.07, hz: (P.keel.zFwd - P.keel.zAft) * 0.5 },
    occupantsHint: ["VENTRAL_KEEL"],
    reservation: "none (physical structure)",
    cls: "OCCUPIED_STRUCTURE",
    routeThrough: "Along the member only, not through it as an empty box.",
    occupyVolume: "Already occupied. Future routes may ride it (carrier), not replace it.",
    access: "External faces of the bar.",
    forbiddenIfConsumed: "Would delete the lowest primary structure / GE1 minY datum.",
    tag: "FROZEN_FACT",
    note: "Utility spine does not mean the keel is hollow.",
  },
  {
    id: "dorsal-longeron",
    name: "dorsal longeron (fwd of bay)",
    box: {
      cx: 0,
      cy: P.keel.dorsalY,
      cz: (P.keel.zFwd + P.bay.zFwd) * 0.5,
      hx: P.keel.longeronW / 2,
      hy: P.keel.longeronH / 2,
      hz: (P.keel.zFwd - P.bay.zFwd) / 2,
    },
    occupantsHint: ["DORSAL_LONGERON"],
    reservation: "none (physical structure); dorsal keep sits immediately above",
    cls: "OCCUPIED_STRUCTURE",
    routeThrough: "Along the member. Not a substitute for the dorsal keep.",
    occupyVolume: "Already occupied.",
    access: "Sides/underside; topside abuts dorsal keep.",
    forbiddenIfConsumed: "Would remove the forward dorsal spine.",
    tag: "FROZEN_FACT",
    note: "Runs z from bay mouth to keel nose.",
  },
  {
    id: "bulkhead-3p35",
    name: "BULKHEAD_Z3.35",
    box: { cx: 0, cy: (P.keel.dorsalY + P.keel.ventralY) * 0.5, cz: 3.35, hx: P.keel.halfWidth, hy: (P.keel.dorsalY - P.keel.ventralY + 0.12) / 2, hz: 0.04 },
    occupantsHint: ["BULKHEAD_Z3p35"],
    reservation: "KEEP_COCKPIT lists this bulkhead as protected from shrinkage",
    cls: "SERVICE_INTERFACE",
    routeThrough: "Only as a declared crossing/penetration. The plate is solid.",
    occupyVolume: "No. Occupied structure.",
    access: "Station face; any future penetration is an interface study.",
    forbiddenIfConsumed: "Would erase a frozen station and collide with the front reserved box protection.",
    tag: "FROZEN_FACT",
    note: "First centerline interruption aft of the nose / through the reserved box band.",
  },
  {
    id: "bulkhead-1p15",
    name: "BULKHEAD_Z1.15",
    box: { cx: 0, cy: (P.keel.dorsalY + P.keel.ventralY) * 0.5, cz: 1.15, hx: P.keel.halfWidth, hy: (P.keel.dorsalY - P.keel.ventralY + 0.12) / 2, hz: 0.04 },
    occupantsHint: ["BULKHEAD_Z1p15"],
    reservation: "none beyond being frozen structure",
    cls: "SERVICE_INTERFACE",
    routeThrough: "Crossing only.",
    occupyVolume: "No.",
    access: "Station face.",
    forbiddenIfConsumed: "Would remove the mid-keel station.",
    tag: "FROZEN_FACT",
    note: "Second solid plate on the centerline.",
  },
  {
    id: "bulkhead-bay-fwd",
    name: "BULKHEAD_Z-1.70 (bay forward station)",
    box: { cx: 0, cy: (P.keel.dorsalY + P.keel.ventralY) * 0.5, cz: P.bay.zFwd, hx: P.keel.halfWidth, hy: (P.keel.dorsalY - P.keel.ventralY + 0.12) / 2, hz: 0.04 },
    occupantsHint: ["BULKHEAD_Z-1p70"],
    reservation: "bay forward station; DP1 load-path mentions this bulkhead",
    cls: "SERVICE_INTERFACE",
    routeThrough: "Crossing only. Aft of this plate is the propulsion bay.",
    occupyVolume: "No.",
    access: "Bay-forward face.",
    forbiddenIfConsumed: "Would collapse the bay/keel station split.",
    tag: "FROZEN_FACT",
    note: "Dominant handoff from keel-carrier to propulsion bay.",
  },
  {
    id: "dorsal-keep",
    name: "dorsal protected / service corridor",
    box: P.keep.dorsal,
    occupantsHint: [],
    reservation: "KEEP_DORSAL protected-corridor",
    cls: "MUST_REMAIN_CLEAR",
    routeThrough: "No occupation. Not a utility duct because it looks empty.",
    occupyVolume: "No.",
    access: "Protected corridor only.",
    forbiddenIfConsumed: "Would violate a certified protected corridor.",
    tag: "FROZEN_FACT",
    note: "Clear corridor. Do not use.",
  },
  {
    id: "drive-waist",
    name: "DRIVE waist (port + starboard)",
    box: { cx: 0, cy: 1.475, cz: -0.29, hx: 2.238, hy: 0.875, hz: 1.34 },
    occupantsHint: [],
    reservation: "DRIVE_WAIST_PORT / DRIVE_WAIST_STBD state-conditioned empty occupancy",
    cls: "MUST_REMAIN_CLEAR",
    routeThrough: "No. Not centerline spine space. Outboard of keel half-width.",
    occupyVolume: "No future hardware while the empty occupancy is active.",
    access: "None for utilities.",
    forbiddenIfConsumed: "Would violate certified seated-lateral empty occupancy.",
    tag: "FROZEN_FACT",
    note: "Listed only to keep it out of the spine. Nested books occupy the flanks, not this cell.",
  },
  {
    id: "bay-walls",
    name: "bay walls + aft posts",
    box: {
      cx: 0,
      cy: (P.bay.yBot + P.bay.yTop) * 0.5,
      cz: (P.bay.zFwd + P.bay.zAft) * 0.5,
      hx: P.bay.halfW + P.keel.wallT,
      hy: (P.bay.yTop - P.bay.yBot) / 2,
      hz: (P.bay.zFwd - P.bay.zAft) / 2,
    },
    occupantsHint: ["BAY_WALL_PORT", "BAY_WALL_STBD", "AFT_POST_PORT", "AFT_POST_STBD"],
    reservation: "none (physical structure)",
    cls: "OCCUPIED_STRUCTURE",
    routeThrough: "Along walls/posts as carrier faces. Not through the interior corridor.",
    occupyVolume: "Walls/posts already occupied. Interior is the can/core corridor.",
    access: "Outer faces; inner faces see the can.",
    forbiddenIfConsumed: "Would delete the propulsion bay.",
    tag: "FROZEN_FACT",
    note: "Structure around a mechanism volume.",
  },
  {
    id: "fixed-core",
    name: "fixed propulsion core / support region",
    box: {
      cx: 0,
      cy: P.drive.y,
      cz: (S5P.coreZAft + S5P.coreZFwd) * 0.5,
      hx: S5P.coreW / 2,
      hy: S5P.coreH / 2,
      hz: S5P.coreL / 2,
    },
    occupantsHint: ["S5_CORE", "S5_SUPPORT", "S5_SPIGOT"],
    reservation: "physical S5 core; not a keepout",
    cls: "OCCUPIED_MECHANISM",
    routeThrough: "Around supports only. Not through the core section.",
    occupyVolume: "No utilities inside the core envelope.",
    access: "Mounts/supports already on the load path to the keel.",
    forbiddenIfConsumed: "Would violate frozen S5 core/handover.",
    tag: "FROZEN_FACT",
    note: "z ∈ [−4.405, −2.605].",
  },
  {
    id: "can-corridor",
    name: "can translation corridor",
    box: {
      cx: 0,
      cy: P.drive.y,
      cz: P.drive.stowedZ - P.drive.stroke / 2,
      hx: P.drive.w / 2,
      hy: P.drive.h / 2,
      hz: (P.drive.l + P.drive.stroke) / 2,
    },
    occupantsHint: ["DRIVE_ENVELOPE", "S5_CAN"],
    reservation: "moving drive/can; E2 includes seated-can aft",
    cls: "OCCUPIED_MECHANISM",
    routeThrough: "No utility occupation across the stroke.",
    occupyVolume: "No.",
    access: "Handover/inspection from the open stern and dorsal service slot (presentation).",
    forbiddenIfConsumed: "Would block certified can translation / handover.",
    tag: "FROZEN_FACT",
    note: "GE1: can deployment is not another lateral packaging event.",
  },
  {
    id: "root-stations",
    name: "four root / interface stations (centerline meeting)",
    box: { cx: 0, cy: 2.0, cz: (P.fl.z + P.rl.z) * 0.5, hx: P.keel.halfWidth + 0.4, hy: 1.0, hz: 3.0 },
    occupantsHint: ["SOCKET_RAIL", "NEST_", "FL_SOCKET", "RL socket/channel frames"],
    reservation: "none as a single keep; local nest/channel structure",
    cls: "SERVICE_INTERFACE",
    routeThrough: "At the keel edge only. Flank book envelopes are not spine space.",
    occupyVolume: "Root hardware already there. No new central volume.",
    access: "Hinge/rail/nest faces.",
    forbiddenIfConsumed: "Would orphan certified laterals.",
    tag: "FROZEN_FACT",
    note: "Books remain machinery. BODY-SHELL-03.1 pockets are not structural ownership.",
  },
  {
    id: "open-stern",
    name: "open stern / service throat",
    box: { cx: 0, cy: P.drive.y, cz: P.drive.stowedZ - P.drive.stroke - 0.2, hx: 0.7, hy: 0.7, hz: 0.4 },
    occupantsHint: ["AFT_POST_PORT", "AFT_POST_STBD"],
    reservation: "none; inspection/handover requirement",
    cls: "MUST_REMAIN_CLEAR",
    routeThrough: "Inspection/access only. No cap, no utility occupation of the throat.",
    occupyVolume: "No.",
    access: "Required open/inspectable.",
    forbiddenIfConsumed: "Would hide the propulsion handover.",
    tag: "FROZEN_FACT",
    note: "BODY-SHELL-03.1 collar frames this and does not own it.",
  },
  {
    id: "interstitial-keel",
    name: "interstitial volume between bulkheads, inside keel half-width, between ventral keel and dorsal longeron",
    box: {
      cx: 0,
      cy: (P.keel.ventralY + P.keel.dorsalY) * 0.5,
      cz: 1.15,
      hx: P.keel.halfWidth,
      hy: (P.keel.dorsalY - P.keel.ventralY) / 2 - 0.1,
      hz: 1.0,
    },
    occupantsHint: [],
    reservation: "none. Not a certified empty occupancy. Not AVAILABLE.",
    cls: "ROUTING_CANDIDATE",
    routeThrough: "Possible along existing members; blocked as a tunnel by solid bulkheads.",
    occupyVolume: "Not granted as a room. Occupying it is UNKNOWN without a crossing study.",
    access: "Only via bulkhead interfaces or external keel faces.",
    forbiddenIfConsumed: "Would pretend a hollow spine that the frozen plates do not provide.",
    tag: "ARCHITECTURE_HYPOTHESIS",
    note: "Candidate for routes-on-structure, not for stuffing utilities into a void.",
  },
];

function overlapsKeep(aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }, k: Keep): boolean {
  return (
    aabb.min.x <= k.cx + k.hx &&
    aabb.max.x >= k.cx - k.hx &&
    aabb.min.y <= k.cy + k.hy &&
    aabb.max.y >= k.cy - k.hy &&
    aabb.min.z <= k.cz + k.hz &&
    aabb.max.z >= k.cz - k.hz
  );
}

export function runUs1Study(rig: MachineRig): Record<string, unknown> {
  return rig.withPreservedPose(() => {
    const poses = [
      { label: "SPREAD", t: 0 },
      { label: "STRUCTURAL_READY", t: 0.84 },
      { label: "DRIVE", t: 1 },
    ];
    const occupants: Record<string, Record<string, string[]>> = {};
    for (const pose of poses) {
      rig.applyMachine(pose.t);
      const physical = rig.worldSolids().filter((s) => s.role === "physical");
      occupants[pose.label] = {};
      for (const region of REGIONS) {
        const hits = physical
          .filter((s) => overlapsKeep(obbWorldAabb(s.obb), region.box))
          .map((s) => s.name)
          .slice(0, 24);
        occupants[pose.label][region.id] = hits;
      }
    }

    const coherentVoid =
      "No continuous unoccupied longitudinal void exists. Ventral keel and dorsal longeron are occupied structure. Three bulkheads are solid plates. The bay is a can/core corridor. Dorsal keep and DRIVE waist must stay clear. Front reserved box is unassigned and protected.";

    const nextSlice = {
      id: "keel-carrier-crossing",
      title: "Keel-carrier crossing interfaces",
      reason:
        "The frozen centerline is mostly structure and mechanism, not an empty spine. A route may ride the ventral keel / dorsal longeron, but it is fragmented by BULKHEAD_Z3.35, BULKHEAD_Z1.15, BULKHEAD_Z-1.70, and the propulsion bay. That crossing problem is the next bounded slice. Not occupancy of KEEP_COCKPIT. Not ground hardware. Not another shell. Not utility-component assignment.",
      notRecommended: [
        "BODY-SHELL-04",
        "cockpit/operator because of KEEP_COCKPIT",
        "wheels/skids/hover (GE1 closed)",
        "fuel/batteries/avionics assignment",
        "S6",
      ],
    };

    const report = {
      studyId: "MT1-US1",
      title: "Utility Spine Zoning",
      freezeId: "MT1-S5HR3R1",
      sourceS4aSha256: S4A_SHA256,
      participatesInAuthority: false,
      addsVehicleGeometry: false,
      mutatesGe1: false,
      bodyShell: "MT1-BODY-SHELL-03.1 presentation context only",
      ge1Closed: {
        spread: "13.320 × 2.895 × 11.700 m",
        readyDrive: "4.600 × 2.895 × 11.700 m",
        floor: "y=0 fold/environment datum, not contact plane",
        keelMinY: 0.03,
        movingMinY: 0.26,
        groundAware: "lightly; no contact mechanism selected",
      },
      coherentLongitudinalVoid: false,
      coherentVoidNote: coherentVoid,
      regions: REGIONS.map(({ box, occupantsHint, ...rest }) => ({ ...rest, box, occupantsHint })),
      liveOccupants: occupants,
      professionsAssigned: [],
      nextSlice,
      svg: { long: "", top: "" },
    };
    report.svg = { long: svgUs1Long(report), top: svgUs1Top(report) };
    return report;
  });
}
