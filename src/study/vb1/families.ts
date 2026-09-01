import type { AuthoritySolid } from "../../machine/authority";
import type { FamilyId } from "./constants";

export type MembershipKind = "proxy" | "represented" | "excluded";

export interface Membership {
  name: string;
  family: FamilyId | null;
  kind: MembershipKind;
  reason: string;
}

function isExcludedSolid(s: AuthoritySolid): boolean {
  if (s.role !== "physical") return true;
  const n = s.name;
  return (
    n.includes("_VIS") ||
    n.startsWith("KEEP_") ||
    n.includes("EMPTY") ||
    n.includes("CORRIDOR") ||
    n.startsWith("DRIVE_WAIST") ||
    n.startsWith("S5_") ||
    n.endsWith("_ax") ||
    n.endsWith("_ay") ||
    n.endsWith("_az") ||
    n.endsWith("_hub")
  );
}

/** Named family membership. Every physical is proxy, represented, or excluded. */
export function classifySolid(s: AuthoritySolid): Membership {
  const n = s.name;
  if (isExcludedSolid(s)) {
    return { name: n, family: null, kind: "excluded", reason: `role=${s.role} reservation/diagnostic` };
  }

  if (n === "DRIVE_ENVELOPE") {
    return { name: n, family: "F6_DRIVE_MOVING", kind: "proxy", reason: "certified moving drive-body center" };
  }
  if (n.startsWith("DRIVE_SPINE") || n.startsWith("DRIVE_FACE") || n.startsWith("DRIVE_SHOE")) {
    return { name: n, family: "F6_DRIVE_MOVING", kind: "represented", reason: "translates with drive body; mass at ENVELOPE" };
  }
  if (n.startsWith("DRIVE_RAIL_")) {
    return { name: n, family: "F7_DRIVE_FIXED", kind: "proxy", reason: "non-translating drive rail" };
  }

  if (
    n === "VENTRAL_KEEL" ||
    n.startsWith("DORSAL_") ||
    n.startsWith("BULKHEAD_") ||
    n.startsWith("AFT_POST_") ||
    n.startsWith("BAY_WALL_")
  ) {
    return { name: n, family: "F5_CENTRAL_STRUCTURE", kind: "proxy", reason: "central primary structure" };
  }

  if (
    n.startsWith("CHANNEL_FRAME") ||
    n.startsWith("STBD_CHANNEL") ||
    n === "NEST_CHEEK_P" ||
    n === "NEST_CHEEK_S" ||
    n === "NEST_BRIDGE_UP" ||
    n === "NEST_BRIDGE_DN" ||
    n.startsWith("RR_NEST_") ||
    n.startsWith("SOCKET_RAIL") ||
    n.startsWith("RR_SOCKET_")
  ) {
    return { name: n, family: "F3_REAR_FIXED", kind: "proxy", reason: "rear receiving/channel/rail" };
  }

  if (
    n.startsWith("FWD_") ||
    n.startsWith("FL_SOCKET") ||
    n.startsWith("FR_SOCKET") ||
    n.startsWith("FL_NEST_") ||
    n.startsWith("FR_NEST_") ||
    n.startsWith("FL_PASSIVE") ||
    n.startsWith("FR_PASSIVE") ||
    n.startsWith("FL_CATCH_THROAT") ||
    n.startsWith("FR_CATCH_THROAT") ||
    n.startsWith("FL_CATCH_CHEEK") ||
    n.startsWith("FR_CATCH_CHEEK") ||
    n.startsWith("FL_CATCH_BRIDGE") ||
    n.startsWith("FR_CATCH_BRIDGE") ||
    n === "FL_CATCH_BACK" ||
    n === "FR_CATCH_BACK"
  ) {
    return { name: n, family: "F4_FRONT_CARRY_FIXED", kind: "proxy", reason: "front carry / nest / catch structure" };
  }

  if (n.startsWith("RL_") || n.startsWith("RR_")) {
    const leaf = /_(INNER|OUTER)_ARMOR/.test(n) && !n.includes("UNDER");
    return {
      name: n,
      family: "F1_REAR_BOOKS",
      kind: leaf ? "proxy" : "represented",
      reason: leaf ? "rear leaf planform proxy" : "rear moving hardware represented by leaf centers",
    };
  }

  if (n.startsWith("FL_") || n.startsWith("FR_")) {
    const leaf = /_(INNER|OUTER)_ARMOR/.test(n) && !n.includes("UNDER");
    return {
      name: n,
      family: "F2_FRONT_BOOKS",
      kind: leaf ? "proxy" : "represented",
      reason: leaf ? "front leaf planform proxy" : "front moving hardware represented by leaf centers",
    };
  }

  return { name: n, family: null, kind: "excluded", reason: "unclassified physical — G3 fail if role=physical" };
}

export function auditMembership(solids: AuthoritySolid[]): {
  rows: Membership[];
  unassignedPhysical: string[];
  excludedVisuals: string[];
} {
  const rows = solids.map(classifySolid);
  const unassignedPhysical: string[] = [];
  const excludedVisuals: string[] = [];
  for (const s of solids) {
    const m = classifySolid(s);
    if (s.role === "physical" && m.family === null && m.kind === "excluded" && !isExcludedSolid(s)) {
      unassignedPhysical.push(s.name);
    }
    if (m.kind === "excluded" && s.role !== "physical") excludedVisuals.push(s.name);
  }
  return { rows, unassignedPhysical, excludedVisuals };
}
