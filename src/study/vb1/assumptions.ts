import type { FamilyId } from "./constants";

export type MassLevel = "LOW" | "NOMINAL" | "HIGH";

export interface FamilyAssumption {
  id: FamilyId;
  name: string;
  low: number;
  nominal: number;
  high: number;
  rationale: string;
  locationProxy: string;
  tag: "ASSUMPTION";
}

/** Nominal whole-machine assumed mass = 100 RMU. Director-reviewable, not authority. */
export const FAMILY_ASSUMPTIONS: FamilyAssumption[] = [
  {
    id: "F1_REAR_BOOKS",
    name: "REAR_BOOKS",
    low: 8,
    nominal: 16,
    high: 28,
    rationale: "Two large shell leaves; low = light panels, high = built-up structure. Not ±5%.",
    locationProxy: "Area-split inner/outer armor centers, 50/50 port/starboard; follows S4A leaf hierarchy.",
    tag: "ASSUMPTION",
  },
  {
    id: "F2_FRONT_BOOKS",
    name: "FRONT_BOOKS",
    low: 4,
    nominal: 8,
    high: 16,
    rationale: "Smaller planform than rear (~1/3 the SPREAD book area). Same construction-philosophy span.",
    locationProxy: "Area-split inner/outer armor-panel unions per side; follows S4A leaf hierarchy.",
    tag: "ASSUMPTION",
  },
  {
    id: "F3_REAR_FIXED",
    name: "REAR_FIXED",
    low: 6,
    nominal: 10,
    high: 16,
    rationale: "Two channels, rails, nest receivers. Frame family, not solid-filled boxes.",
    locationProxy: "Union-AABB center of named rear-fixed physicals.",
    tag: "ASSUMPTION",
  },
  {
    id: "F4_FRONT_CARRY_FIXED",
    name: "FRONT_CARRY_FIXED",
    low: 6,
    nominal: 10,
    high: 16,
    rationale: "Two FWD_CARRY assemblies plus rails/nests/catches. Same philosophy span as rear-fixed.",
    locationProxy: "Union-AABB center of named front-carry physicals.",
    tag: "ASSUMPTION",
  },
  {
    id: "F5_CENTRAL_STRUCTURE",
    name: "CENTRAL_STRUCTURE",
    low: 12,
    nominal: 20,
    high: 30,
    rationale: "Keel, bulkheads, dorsal, bay. Primary chassis; long in Z so proxy is a documented group center.",
    locationProxy: "Union-AABB center of keel/bulkhead/bay physicals.",
    tag: "ASSUMPTION",
  },
  {
    id: "F6_DRIVE_MOVING",
    name: "DRIVE_MOVING",
    low: 4,
    nominal: 14,
    high: 32,
    rationale: "Broadest range: empty stand-in vs dense machinery. Only the translating body/carriage.",
    locationProxy: "DRIVE_ENVELOPE center; follows certified −Z deployment.",
    tag: "ASSUMPTION",
  },
  {
    id: "F7_DRIVE_FIXED",
    name: "DRIVE_FIXED",
    low: 3,
    nominal: 6,
    high: 10,
    rationale: "Rails/guides that do not translate with the body.",
    locationProxy: "Union-AABB center of DRIVE_RAIL_P/S.",
    tag: "ASSUMPTION",
  },
  {
    id: "F8_COCKPIT_ALLOWANCE",
    name: "COCKPIT_ALLOWANCE",
    low: 2,
    nominal: 10,
    high: 22,
    rationale: "Future crew/forward systems inside KEEP_COCKPIT. Low = empty-ish, high = full package.",
    locationProxy: "KEEP_COCKPIT center; face slides are sensitivity, not geometry.",
    tag: "ASSUMPTION",
  },
  {
    id: "F9_WAIST_SYSTEMS_ALLOWANCE",
    name: "WAIST_SYSTEMS_ALLOWANCE",
    low: 1,
    nominal: 6,
    high: 12,
    rationale: "Symmetric future systems in two waist cells. High is still not 13 m³ of machinery.",
    locationProxy: "50/50 at the two certified waist-cell centers.",
    tag: "ASSUMPTION",
  },
];

export const NOMINAL_TOTAL_RMU = FAMILY_ASSUMPTIONS.reduce((s, f) => s + f.nominal, 0);

export type ScenarioId =
  | "ALL_LOW"
  | "NOMINAL"
  | "ALL_HIGH"
  | "HEAVY_AFT_LIGHT_FORWARD"
  | "HEAVY_FORWARD_LIGHT_AFT"
  | "HEAVY_DRIVE_MOVING"
  | "LIGHT_DRIVE_MOVING"
  | "HEAVY_COCKPIT"
  | "HEAVY_WAIST_SYSTEMS";

export interface ScenarioDef {
  id: ScenarioId;
  detail: string;
  levels: Record<FamilyId, MassLevel>;
}

const all = (level: MassLevel): Record<FamilyId, MassLevel> => {
  const o = {} as Record<FamilyId, MassLevel>;
  for (const f of FAMILY_ASSUMPTIONS) o[f.id] = level;
  return o;
};

const nomExcept = (patch: Partial<Record<FamilyId, MassLevel>>): Record<FamilyId, MassLevel> => ({
  ...all("NOMINAL"),
  ...patch,
});

export const SCENARIOS: ScenarioDef[] = [
  { id: "ALL_LOW", detail: "every family LOW", levels: all("LOW") },
  { id: "NOMINAL", detail: "every family NOMINAL; total 100 RMU", levels: all("NOMINAL") },
  { id: "ALL_HIGH", detail: "every family HIGH", levels: all("HIGH") },
  {
    id: "HEAVY_AFT_LIGHT_FORWARD",
    detail: "F1/F3/F6/F7 HIGH; F2/F4/F8 LOW; F5/F9 NOMINAL",
    levels: nomExcept({
      F1_REAR_BOOKS: "HIGH",
      F3_REAR_FIXED: "HIGH",
      F6_DRIVE_MOVING: "HIGH",
      F7_DRIVE_FIXED: "HIGH",
      F2_FRONT_BOOKS: "LOW",
      F4_FRONT_CARRY_FIXED: "LOW",
      F8_COCKPIT_ALLOWANCE: "LOW",
    }),
  },
  {
    id: "HEAVY_FORWARD_LIGHT_AFT",
    detail: "F2/F4/F8 HIGH; F1/F3/F6/F7 LOW; F5/F9 NOMINAL",
    levels: nomExcept({
      F2_FRONT_BOOKS: "HIGH",
      F4_FRONT_CARRY_FIXED: "HIGH",
      F8_COCKPIT_ALLOWANCE: "HIGH",
      F1_REAR_BOOKS: "LOW",
      F3_REAR_FIXED: "LOW",
      F6_DRIVE_MOVING: "LOW",
      F7_DRIVE_FIXED: "LOW",
    }),
  },
  {
    id: "HEAVY_DRIVE_MOVING",
    detail: "F6 HIGH; others NOMINAL",
    levels: nomExcept({ F6_DRIVE_MOVING: "HIGH" }),
  },
  {
    id: "LIGHT_DRIVE_MOVING",
    detail: "F6 LOW; others NOMINAL",
    levels: nomExcept({ F6_DRIVE_MOVING: "LOW" }),
  },
  {
    id: "HEAVY_COCKPIT",
    detail: "F8 HIGH; others NOMINAL",
    levels: nomExcept({ F8_COCKPIT_ALLOWANCE: "HIGH" }),
  },
  {
    id: "HEAVY_WAIST_SYSTEMS",
    detail: "F9 HIGH; others NOMINAL",
    levels: nomExcept({ F9_WAIST_SYSTEMS_ALLOWANCE: "HIGH" }),
  },
];

export function massAt(id: FamilyId, level: MassLevel): number {
  const f = FAMILY_ASSUMPTIONS.find((x) => x.id === id)!;
  if (level === "LOW") return f.low;
  if (level === "HIGH") return f.high;
  return f.nominal;
}

export function scenarioMasses(levels: Record<FamilyId, MassLevel>): Record<FamilyId, number> {
  const o = {} as Record<FamilyId, number>;
  for (const f of FAMILY_ASSUMPTIONS) o[f.id] = massAt(f.id, levels[f.id]);
  return o;
}
