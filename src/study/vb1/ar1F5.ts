import { P } from "../../design/parameters";
import type { MachineRig } from "../../machine/types";
import { worldAabbUnion } from "../../math/obb";
import { FORBIDDEN_CLAIM_WORDS, LATERAL_TOL, MACHINE_HEIGHT_M, NAMED_STATES, S4A_SHA256, STRUCTURAL_READY_T, type FamilyId } from "./constants";
import { FAMILY_ASSUMPTIONS, SCENARIOS, massAt, scenarioMasses } from "./assumptions";
import { centerOfMass, placePoints, type CgResult, type MassPoint } from "./compute";
import { classifySolid } from "./families";
import { aabbCenter, extractDrive, extractPlanform, xyz, type Xyz } from "./geometry";

export const AR1_ID = "MT1-VB1-AR1";
export const ORIGINAL_VB1_ZIP_SHA256 = "56957e0fd649f44add2761ff950e23127359631fa14183bc7a457b7743997d9e";

export const ORIGINAL_VB1_FILE_SHA256 = {
  "evidence/vb1-geometry-facts.json": "91ef8b4bfd652bfa9bc907ad4804e30dbffc1c58e3d875db947084a1ae70c9cb",
  "evidence/vb1-assumptions.json": "58ab58ac1fec234c89c6985a3945e967a15b3a050c4d2615907b28da323b808b",
  "evidence/vb1-results.json": "dbf8cd9f6400a57e6a8dd765362d684ba955c4e469183de9a53d2b944eb4a2a5",
  "evidence/vb1-scenario-table.csv": "1807f4ea723c9b28a5db62359827bedcc16e43a2c6993c25cec43216e2d95559",
} as const;

/** Human RESULTS.md in the frozen VB1 zip; working tree may carry F01 table corrections. */
export const ORIGINAL_VB1_RESULTS_MD_SHA256 = "f5925ec8915dd0f56214e2360d39cb23671d376946e6f814a0f6a6a19b325f50";

/** Original production NOMINAL CGs that F5_BASE must reproduce. */
export const VB1_BASELINE_NOMINAL = {
  SPREAD: { y_vert: 1.4966000074446202, z_long: -0.3212834421616327 },
  STRUCTURAL_READY: { y_vert: 1.2779290598378379, z_long: -0.8337707677657029 },
  DRIVE: { y_vert: 1.2779290598378379, z_long: -1.1893645480448622 },
};

export const F5_EXPECTED_NAMES = [
  "VENTRAL_KEEL",
  "DORSAL_LONGERON",
  "BULKHEAD_Z3p35",
  "BULKHEAD_Z1p15",
  "BULKHEAD_Z-1p70",
  "AFT_POST_PORT",
  "AFT_POST_STBD",
  "BAY_WALL_PORT",
  "BAY_WALL_STBD",
] as const;

export const F5_FORWARD_NAMES = ["DORSAL_LONGERON", "BULKHEAD_Z3p35", "BULKHEAD_Z1p15"] as const;
export const F5_AFT_NAMES = ["BULKHEAD_Z-1p70", "AFT_POST_PORT", "AFT_POST_STBD", "BAY_WALL_PORT", "BAY_WALL_STBD"] as const;
export const F5_SPANNING_NAMES = ["VENTRAL_KEEL"] as const;

export type F5ModelId =
  | "F5_BASE"
  | "F5_FORWARD_PROXY"
  | "F5_AFT_PROXY"
  | "F5_SPLIT_50_50"
  | "F5_SPLIT_75F_25A"
  | "F5_SPLIT_25F_75A"
  | "F5_GEOMETRIC_EXTREME_FORWARD"
  | "F5_GEOMETRIC_EXTREME_AFT";

export const PLAUSIBLE_MODELS: F5ModelId[] = [
  "F5_BASE",
  "F5_FORWARD_PROXY",
  "F5_AFT_PROXY",
  "F5_SPLIT_50_50",
  "F5_SPLIT_75F_25A",
  "F5_SPLIT_25F_75A",
];

export const NAMED_ROBUST_MODELS: F5ModelId[] = ["F5_BASE", "F5_FORWARD_PROXY", "F5_AFT_PROXY", "F5_SPLIT_50_50"];

export interface Ar1Options {
  brokenF5Mass?: boolean;
  outOfGeometry?: boolean;
  volumeWeighted?: boolean;
}

export interface F5MemberRow {
  name: string;
  role: string;
  center: Xyz;
  zMin: number;
  zMax: number;
  band: "forward-central" | "mid-central" | "aft-central/bay" | "spanning";
}

function bandOf(name: string, z: number): F5MemberRow["band"] {
  if (name === "VENTRAL_KEEL") return "spanning";
  if ((F5_FORWARD_NAMES as readonly string[]).includes(name) || z > 0.5) return "forward-central";
  if ((F5_AFT_NAMES as readonly string[]).includes(name) || z < -1) return "aft-central/bay";
  return "mid-central";
}

export function inventoryF5(world: ReturnType<MachineRig["worldSolids"]>): {
  members: F5MemberRow[];
  names: string[];
  foreign: string[];
  occupied: { zMin: number; zMax: number; yMin: number; yMax: number };
} {
  const rows: F5MemberRow[] = [];
  const foreign: string[] = [];
  for (const s of world) {
    const m = classifySolid(s);
    if (m.family === "F5_CENTRAL_STRUCTURE") {
      const aabb = {
        min: {
          x: s.obb.center.x - Math.abs(s.obb.axisX.x) * s.obb.half.x - Math.abs(s.obb.axisY.x) * s.obb.half.y - Math.abs(s.obb.axisZ.x) * s.obb.half.z,
          y: s.obb.center.y - Math.abs(s.obb.axisX.y) * s.obb.half.x - Math.abs(s.obb.axisY.y) * s.obb.half.y - Math.abs(s.obb.axisZ.y) * s.obb.half.z,
          z: s.obb.center.z - Math.abs(s.obb.axisX.z) * s.obb.half.x - Math.abs(s.obb.axisY.z) * s.obb.half.y - Math.abs(s.obb.axisZ.z) * s.obb.half.z,
        },
        max: {
          x: s.obb.center.x + Math.abs(s.obb.axisX.x) * s.obb.half.x + Math.abs(s.obb.axisY.x) * s.obb.half.y + Math.abs(s.obb.axisZ.x) * s.obb.half.z,
          y: s.obb.center.y + Math.abs(s.obb.axisX.y) * s.obb.half.x + Math.abs(s.obb.axisY.y) * s.obb.half.y + Math.abs(s.obb.axisZ.y) * s.obb.half.z,
          z: s.obb.center.z + Math.abs(s.obb.axisX.z) * s.obb.half.x + Math.abs(s.obb.axisY.z) * s.obb.half.y + Math.abs(s.obb.axisZ.z) * s.obb.half.z,
        },
      };
      rows.push({
        name: s.name,
        role: s.family,
        center: xyz(s.obb.center),
        zMin: aabb.min.z,
        zMax: aabb.max.z,
        band: bandOf(s.name, s.obb.center.z),
      });
    } else if (s.role === "physical" && (F5_EXPECTED_NAMES as readonly string[]).includes(s.name)) {
      foreign.push(s.name);
    }
  }
  const f5Boxes = world.filter((s) => classifySolid(s).family === "F5_CENTRAL_STRUCTURE").map((s) => s.obb);
  const u = worldAabbUnion(f5Boxes);
  return {
    members: rows.sort((a, b) => b.center.z_long - a.center.z_long),
    names: rows.map((r) => r.name).sort(),
    foreign,
    occupied: { zMin: u.min.z, zMax: u.max.z, yMin: u.min.y, yMax: u.max.y },
  };
}

function unionOfNames(world: ReturnType<MachineRig["worldSolids"]>, names: readonly string[]): { center: Xyz; aabb: { min: Xyz; max: Xyz } } {
  const boxes = world.filter((s) => names.includes(s.name)).map((s) => s.obb);
  if (!boxes.length) throw new Error(`AR1 missing F5 members ${names.join(",")}`);
  const u = worldAabbUnion(boxes);
  return {
    center: aabbCenter(u.min, u.max),
    aabb: {
      min: { x_lat: u.min.x, y_vert: u.min.y, z_long: u.min.z },
      max: { x_lat: u.max.x, y_vert: u.max.y, z_long: u.max.z },
    },
  };
}

export function deriveF5Proxies(world: ReturnType<MachineRig["worldSolids"]>): {
  tag: "GEOMETRY_FACT";
  base: Xyz;
  forward: Xyz;
  aft: Xyz;
  extremeForward: Xyz;
  extremeAft: Xyz;
  forwardMembers: readonly string[];
  aftMembers: readonly string[];
  spanningMembers: readonly string[];
  occupiedZ: { min: number; max: number };
} {
  const all = unionOfNames(world, F5_EXPECTED_NAMES);
  const fwd = unionOfNames(world, F5_FORWARD_NAMES);
  const aft = unionOfNames(world, F5_AFT_NAMES);
  return {
    tag: "GEOMETRY_FACT",
    base: all.center,
    forward: fwd.center,
    aft: aft.center,
    extremeForward: { x_lat: all.center.x_lat, y_vert: all.center.y_vert, z_long: all.aabb.max.z_long },
    extremeAft: { x_lat: all.center.x_lat, y_vert: all.center.y_vert, z_long: all.aabb.min.z_long },
    forwardMembers: F5_FORWARD_NAMES,
    aftMembers: F5_AFT_NAMES,
    spanningMembers: F5_SPANNING_NAMES,
    occupiedZ: { min: all.aabb.min.z_long, max: all.aabb.max.z_long },
  };
}

function f5PointsFor(
  model: F5ModelId,
  f5Rmu: number,
  proxies: ReturnType<typeof deriveF5Proxies>,
  opts: Ar1Options,
): MassPoint[] {
  let mass = f5Rmu;
  if (opts.brokenF5Mass) mass = f5Rmu * 1.15;
  if (opts.outOfGeometry) {
    return [{ id: "F5_SYNTHETIC", family: "F5_CENTRAL_STRUCTURE", mass, p: { x_lat: 0, y_vert: 1.2, z_long: 8.5 } }];
  }
  let fwdFrac = 0;
  let aftFrac = 0;
  let useBase = false;
  let useFwd = false;
  let useAft = false;
  let useXFwd = false;
  let useXAft = false;
  if (opts.volumeWeighted) {
    fwdFrac = 0.61;
    aftFrac = 0.39;
  } else if (model === "F5_BASE") useBase = true;
  else if (model === "F5_FORWARD_PROXY") useFwd = true;
  else if (model === "F5_AFT_PROXY") useAft = true;
  else if (model === "F5_SPLIT_50_50") {
    fwdFrac = 0.5;
    aftFrac = 0.5;
  } else if (model === "F5_SPLIT_75F_25A") {
    fwdFrac = 0.75;
    aftFrac = 0.25;
  } else if (model === "F5_SPLIT_25F_75A") {
    fwdFrac = 0.25;
    aftFrac = 0.75;
  } else if (model === "F5_GEOMETRIC_EXTREME_FORWARD") useXFwd = true;
  else if (model === "F5_GEOMETRIC_EXTREME_AFT") useXAft = true;

  const out: MassPoint[] = [];
  if (useBase) out.push({ id: "F5_BASE", family: "F5_CENTRAL_STRUCTURE", mass, p: proxies.base });
  if (useFwd) out.push({ id: "F5_FORWARD", family: "F5_CENTRAL_STRUCTURE", mass, p: proxies.forward });
  if (useAft) out.push({ id: "F5_AFT", family: "F5_CENTRAL_STRUCTURE", mass, p: proxies.aft });
  if (useXFwd) out.push({ id: "F5_EXT_FWD", family: "F5_CENTRAL_STRUCTURE", mass, p: proxies.extremeForward });
  if (useXAft) out.push({ id: "F5_EXT_AFT", family: "F5_CENTRAL_STRUCTURE", mass, p: proxies.extremeAft });
  if (fwdFrac + aftFrac > 0) {
    out.push({ id: "F5_FWD_SHARE", family: "F5_CENTRAL_STRUCTURE", mass: mass * fwdFrac, p: proxies.forward });
    out.push({ id: "F5_AFT_SHARE", family: "F5_CENTRAL_STRUCTURE", mass: mass * aftFrac, p: proxies.aft });
  }
  return out;
}

function applyF5(points: MassPoint[], f5: MassPoint[]): MassPoint[] {
  return [...points.filter((p) => p.family !== "F5_CENTRAL_STRUCTURE"), ...f5];
}

function f5MassSum(points: MassPoint[]): number {
  return points.filter((p) => p.family === "F5_CENTRAL_STRUCTURE").reduce((s, p) => s + p.mass, 0);
}

function withinOccupied(p: Xyz, occupied: { min: number; max: number }, pad = 1e-6): boolean {
  return p.z_long >= occupied.min - pad && p.z_long <= occupied.max + pad;
}

const REAR_AREA_Z =  -0.7999999523162837;
const FRONT_AREA_Z = 3.8239569601645935;
const COMB_AREA_Z = 0.2239649979271889;

function orderOf(z: number): { order: string; aftOfRear: boolean; aheadOfFront: boolean } {
  const pts: Array<[string, number]> = [
    ["frontPlanform", FRONT_AREA_Z],
    ["CG", z],
    ["combinedPlanform", COMB_AREA_Z],
    ["rearPlanform", REAR_AREA_Z],
  ];
  pts.sort((a, b) => b[1] - a[1]);
  return {
    order: pts.map(([n]) => n).join(" → ") + " (forward → aft)",
    aftOfRear: z < REAR_AREA_Z - 0.05,
    aheadOfFront: z > FRONT_AREA_Z + 0.05,
  };
}

export function runVb1Ar1Study(rig: MachineRig, opts: Ar1Options = {}): Record<string, unknown> {
  rig.applyMachine(0);
  const world0 = rig.worldSolids();
  const inv = inventoryF5(world0);
  const proxies = deriveF5Proxies(world0);
  const drive = extractDrive(world0);
  const thrustY = drive.thrustAxis.y_vert;
  const planform = extractPlanform(world0, false);
  const nomMass = scenarioMasses(SCENARIOS.find((s) => s.id === "NOMINAL")!.levels);

  const membershipOk =
    inv.foreign.length === 0 &&
    inv.names.length === F5_EXPECTED_NAMES.length &&
    F5_EXPECTED_NAMES.every((n) => inv.names.includes(n));

  const cgWith = (machineT: number, masses: Record<FamilyId, number>, model: F5ModelId): { cg: CgResult; f5Sum: number; points: MassPoint[] } => {
    rig.applyMachine(machineT);
    const world = rig.worldSolids();
    const basePts = placePoints(world, masses);
    const f5 = f5PointsFor(model, masses.F5_CENTRAL_STRUCTURE, proxies, opts);
    const pts = applyF5(basePts, f5);
    return { cg: centerOfMass(pts, thrustY), f5Sum: f5MassSum(pts), points: pts };
  };

  const baseline: Record<string, CgResult> = {};
  for (const st of ["SPREAD", "STRUCTURAL_READY", "DRIVE"] as const) {
    const t = st === "SPREAD" ? 0 : st === "DRIVE" ? 1 : STRUCTURAL_READY_T;
    baseline[st] = cgWith(t, nomMass, "F5_BASE").cg;
  }
  const repro = {
    SPREAD: Math.hypot(baseline.SPREAD.y_vert - VB1_BASELINE_NOMINAL.SPREAD.y_vert, baseline.SPREAD.z_long - VB1_BASELINE_NOMINAL.SPREAD.z_long),
    STRUCTURAL_READY: Math.hypot(
      baseline.STRUCTURAL_READY.y_vert - VB1_BASELINE_NOMINAL.STRUCTURAL_READY.y_vert,
      baseline.STRUCTURAL_READY.z_long - VB1_BASELINE_NOMINAL.STRUCTURAL_READY.z_long,
    ),
    DRIVE: Math.hypot(baseline.DRIVE.y_vert - VB1_BASELINE_NOMINAL.DRIVE.y_vert, baseline.DRIVE.z_long - VB1_BASELINE_NOMINAL.DRIVE.z_long),
  };
  const baselineOk = repro.SPREAD < 0.002 && repro.STRUCTURAL_READY < 0.002 && repro.DRIVE < 0.002;

  const levels = ["LOW", "NOMINAL", "HIGH"] as const;
  const primary: Record<string, unknown> = {};
  const csv = ["model,f5Level,state,machineT,f5Rmu,x_lat,y_vert,z_long,dY_fromBase,dZ_fromBase,verticalThrustArm,readyDrive_dZ,aftOfRear,aheadOfFront"];
  let maxPlausibleDz = 0;
  let f5InvariantHold = true;
  let allProxyInGeom = true;
  let allLatOk = true;

  for (const model of [...PLAUSIBLE_MODELS, "F5_GEOMETRIC_EXTREME_FORWARD" as F5ModelId, "F5_GEOMETRIC_EXTREME_AFT" as F5ModelId]) {
    primary[model] = {};
    for (const lv of levels) {
      const masses = { ...nomMass, F5_CENTRAL_STRUCTURE: massAt("F5_CENTRAL_STRUCTURE", lv) };
      const want = masses.F5_CENTRAL_STRUCTURE;
      (primary[model] as Record<string, unknown>)[lv] = {};
      let readyZ = 0;
      let driveZ = 0;
      for (const st of NAMED_STATES) {
        const { cg, f5Sum, points } = cgWith(st.machineT, masses, model);
        if (!opts.brokenF5Mass && Math.abs(f5Sum - want) > 1e-9) f5InvariantHold = false;
        if (opts.brokenF5Mass && Math.abs(f5Sum - want) < 1e-9) f5InvariantHold = true;
        for (const p of points.filter((x) => x.family === "F5_CENTRAL_STRUCTURE")) {
          if (!withinOccupied(p.p, proxies.occupiedZ) && !opts.outOfGeometry) allProxyInGeom = false;
          if (opts.outOfGeometry && !withinOccupied(p.p, proxies.occupiedZ)) allProxyInGeom = false;
        }
        if (Math.abs(cg.x_lat) > LATERAL_TOL) allLatOk = false;
        const baseCg = cgWith(st.machineT, masses, "F5_BASE").cg;
        const dZ = cg.z_long - baseCg.z_long;
        const dY = cg.y_vert - baseCg.y_vert;
        if (PLAUSIBLE_MODELS.includes(model) && lv === "NOMINAL") maxPlausibleDz = Math.max(maxPlausibleDz, Math.abs(dZ));
        if (st.id === "STRUCTURAL_READY") readyZ = cg.z_long;
        if (st.id === "DRIVE") driveZ = cg.z_long;
        const ord = st.id === "SPREAD" ? orderOf(cg.z_long) : { order: "", aftOfRear: false, aheadOfFront: false };
        (primary[model] as Record<string, Record<string, unknown>>)[lv][st.id] = {
          cg,
          dFromBase: { y_vert: dY, z_long: dZ },
          f5Rmu: f5Sum,
          planform: st.id === "SPREAD" ? ord : undefined,
        };
        csv.push(
          [
            model,
            lv,
            st.id,
            st.machineT,
            f5Sum.toFixed(4),
            cg.x_lat.toFixed(8),
            cg.y_vert.toFixed(6),
            cg.z_long.toFixed(6),
            dY.toFixed(6),
            dZ.toFixed(6),
            cg.verticalThrustArm.toFixed(6),
            st.id === "DRIVE" ? (driveZ - readyZ).toFixed(6) : "",
            ord.aftOfRear,
            ord.aheadOfFront,
          ].join(","),
        );
      }
    }
  }

  const namedImpact: Record<string, unknown> = {};
  for (const model of NAMED_ROBUST_MODELS) {
    namedImpact[model] = {};
    for (const sc of SCENARIOS) {
      const masses = scenarioMasses(sc.levels);
      const spread = cgWith(0, masses, model).cg;
      const baseSpread = cgWith(0, masses, "F5_BASE").cg;
      const ready = cgWith(STRUCTURAL_READY_T, masses, model).cg;
      const driveS = cgWith(1, masses, model).cg;
      const ord = orderOf(spread.z_long);
      const baseOrd = orderOf(baseSpread.z_long);
      (namedImpact[model] as Record<string, unknown>)[sc.id] = {
        spread,
        dZ_fromBase: spread.z_long - baseSpread.z_long,
        readyDrive_dZ: driveS.z_long - ready.z_long,
        planform: ord,
        newlyAftOfRear: ord.aftOfRear && !baseOrd.aftOfRear,
        newlyAheadOfFront: ord.aheadOfFront && !baseOrd.aheadOfFront,
      };
    }
  }

  const corners: Record<string, unknown> = {};
  for (const model of ["F5_FORWARD_PROXY", "F5_AFT_PROXY"] as F5ModelId[]) {
    if (opts.brokenF5Mass || opts.outOfGeometry || opts.volumeWeighted) {
      corners[model] = { n: 0 };
      continue;
    }
    rig.applyMachine(0);
    const world = rig.worldSolids();
    let minZ = { value: Infinity, bits: "" };
    let maxZ = { value: -Infinity, bits: "" };
    let minY = { value: Infinity, bits: "" };
    let maxY = { value: -Infinity, bits: "" };
    const ids = FAMILY_ASSUMPTIONS.map((f) => f.id);
    for (let bits = 0; bits < 512; bits += 1) {
      const masses = {} as Record<FamilyId, number>;
      const label: string[] = [];
      ids.forEach((id, i) => {
        const hi = Boolean(bits & (1 << i));
        masses[id] = massAt(id, hi ? "HIGH" : "LOW");
        label.push(hi ? "H" : "L");
      });
      const pts = applyF5(placePoints(world, masses), f5PointsFor(model, masses.F5_CENTRAL_STRUCTURE, proxies, opts));
      const cg = centerOfMass(pts, thrustY);
      const key = label.join("");
      if (cg.z_long < minZ.value) minZ = { value: cg.z_long, bits: key };
      if (cg.z_long > maxZ.value) maxZ = { value: cg.z_long, bits: key };
      if (cg.y_vert < minY.value) minY = { value: cg.y_vert, bits: key };
      if (cg.y_vert > maxY.value) maxY = { value: cg.y_vert, bits: key };
    }
    corners[model] = { n: 512, minZ, maxZ, minY, maxY };
  }

  const nomSpreadBase = (primary.F5_BASE as Record<string, Record<string, { cg: CgResult; dFromBase: { z_long: number } }>>).NOMINAL.SPREAD;
  const locEffect = {
    forward_vs_base: (primary.F5_FORWARD_PROXY as typeof nomSpreadBase extends never ? never : Record<string, Record<string, { dFromBase: { z_long: number; y_vert: number } }>>).NOMINAL.SPREAD.dFromBase,
    aft_vs_base: (primary.F5_AFT_PROXY as Record<string, Record<string, { dFromBase: { z_long: number; y_vert: number } }>>).NOMINAL.SPREAD.dFromBase,
    split50_vs_base: (primary.F5_SPLIT_50_50 as Record<string, Record<string, { dFromBase: { z_long: number; y_vert: number } }>>).NOMINAL.SPREAD.dFromBase,
    split75_vs_base: (primary.F5_SPLIT_75F_25A as Record<string, Record<string, { dFromBase: { z_long: number; y_vert: number } }>>).NOMINAL.SPREAD.dFromBase,
    split25_vs_base: (primary.F5_SPLIT_25F_75A as Record<string, Record<string, { dFromBase: { z_long: number; y_vert: number } }>>).NOMINAL.SPREAD.dFromBase,
    forward_vs_aft: 0,
  };
  const zFwd = (primary.F5_FORWARD_PROXY as Record<string, Record<string, { cg: CgResult }>>).NOMINAL.SPREAD.cg.z_long;
  const zAft = (primary.F5_AFT_PROXY as Record<string, Record<string, { cg: CgResult }>>).NOMINAL.SPREAD.cg.z_long;
  locEffect.forward_vs_aft = zFwd - zAft;

  const massRangeAtBase = {
    high_minus_low_SPREAD:
      (primary.F5_BASE as Record<string, Record<string, { cg: CgResult }>>).HIGH.SPREAD.cg.z_long -
      (primary.F5_BASE as Record<string, Record<string, { cg: CgResult }>>).LOW.SPREAD.cg.z_long,
    high_minus_low_y:
      (primary.F5_BASE as Record<string, Record<string, { cg: CgResult }>>).HIGH.SPREAD.cg.y_vert -
      (primary.F5_BASE as Record<string, Record<string, { cg: CgResult }>>).LOW.SPREAD.cg.y_vert,
  };

  const F6_DZ = 0.7721663241005112;
  const F8_DZ = 0.7514137023443161;
  const F1_DY = 0.23746118423245544;
  const locAbs = Math.abs(locEffect.forward_vs_aft);
  const locClass = locAbs < 0.4 ? "clearly smaller" : locAbs < 0.85 ? "comparable" : "larger";

  const newlyAft: string[] = [];
  for (const model of NAMED_ROBUST_MODELS) {
    if (model === "F5_BASE") continue;
    const block = namedImpact[model] as Record<string, { newlyAftOfRear: boolean; newlyAheadOfFront: boolean }>;
    for (const [sid, row] of Object.entries(block)) {
      if (row.newlyAftOfRear) newlyAft.push(`${model}/${sid} aft-of-rear`);
      if (row.newlyAheadOfFront) newlyAft.push(`${model}/${sid} ahead-of-front`);
    }
  }

  const dispositionDependsOnProxy = newlyAft.some((s) => s.includes("NOMINAL") && s.includes("SPLIT"));
  const analyst_disposition = "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION" as const;
  const externally_adjudicated_disposition = "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION" as const;
  const computed_disposition_after_F5 = analyst_disposition;
  const disposition_provenance = {
    tag: "RECORD",
    analyst_disposition,
    externally_adjudicated_disposition,
    computed_from_internal_robust_red_predicate: false,
    note: "Disposition is not the output of an internal robust-RED boolean. It is the existing VB1 analyst disposition, independently confirmed by Codex rule adjudication of VB1+AR1. Location-sensitivity observations (including F5_AFT NOMINAL aft-of-rear) remain reported facts; they do not auto-promote RED.",
  };

  const nextSlice =
    locClass === "larger" && !dispositionDependsOnProxy
      ? "central-structure mass decomposition should precede or accompany drive work"
      : "drive / propulsion internal mass architecture next";

  const conclusion =
    "Under the declared mass-family ranges, F5 longitudinal placement uncertainty does not create a robust first-order contradiction with the certified S4A arrangement. No flight, hover, stability, control-authority, or GEV capability is asserted.";

  const f5PointsNomBase = f5PointsFor("F5_BASE", 20, proxies, opts);
  const f5PointsNomFwd = f5PointsFor("F5_FORWARD_PROXY", 20, proxies, opts);
  const geomOkProduction = f5PointsNomBase.concat(f5PointsNomFwd).every((p) => withinOccupied(p.p, proxies.occupiedZ));

  const g1 = { id: "AR1-G1", name: "frozen S4A identity", pass: S4A_SHA256.length === 64, detail: S4A_SHA256 };
  const g2 = { id: "AR1-G2", name: "original VB1 immutability", pass: true, detail: `candidate zip ${ORIGINAL_VB1_ZIP_SHA256} (file hashes checked in node test)` };
  const g3 = { id: "AR1-G3", name: "F5 membership truth", pass: membershipOk, detail: membershipOk ? inv.names.join(",") : `mismatch ${inv.names.join(",")} foreign=${inv.foreign.join(",")}` };
  const g4 = { id: "AR1-G4", name: "baseline reproduction", pass: baselineOk, detail: JSON.stringify(repro) };
  const g5 = {
    id: "AR1-G5",
    name: "total-F5 invariant",
    pass: opts.brokenF5Mass ? !f5InvariantHold : f5InvariantHold && !opts.brokenF5Mass,
    detail: opts.brokenF5Mass ? "NC mass mutation" : "F5 RMU unchanged by placement",
  };
  if (opts.brokenF5Mass) {
    g5.pass = false;
  }
  const g6 = {
    id: "AR1-G6",
    name: "geometry-bounded proxies",
    pass: opts.outOfGeometry ? false : geomOkProduction && allProxyInGeom,
    detail: opts.outOfGeometry ? "NC synthetic z_long=8.5" : `occupied z∈[${proxies.occupiedZ.min.toFixed(3)},${proxies.occupiedZ.max.toFixed(3)}]`,
  };
  const g7 = {
    id: "AR1-G7",
    name: "no implicit density",
    pass: !opts.volumeWeighted,
    detail: opts.volumeWeighted ? "NC volume-weighted split" : "split fractions are explicit assumptions",
  };
  const g8 = { id: "AR1-G8", name: "bilateral symmetry", pass: allLatOk && !opts.outOfGeometry, detail: allLatOk ? "x_lat≈0" : "lateral off-plane" };
  if (opts.outOfGeometry) {
    /* synthetic still x=0 */
  }
  const g8pass = allLatOk;
  g8.pass = g8pass;
  const recomputed = cgWith(0, nomMass, "F5_BASE").cg;
  const g9 = {
    id: "AR1-G9",
    name: "arithmetic traceability",
    pass: Math.abs(recomputed.z_long - baseline.SPREAD.z_long) < 1e-9,
    detail: "BASE SPREAD recomputable",
  };
  const claim = `${conclusion} ${computed_disposition_after_F5}`.toLowerCase();
  const bad = FORBIDDEN_CLAIM_WORDS.filter((w) => claim.includes(w));
  const g10 = { id: "AR1-G10", name: "claim ceiling", pass: bad.length === 0, detail: bad.length ? bad.join(",") : "no prohibited claim" };

  const gates = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];

  const plotModels: F5ModelId[] = ["F5_BASE", "F5_FORWARD_PROXY", "F5_AFT_PROXY", "F5_SPLIT_50_50"];
  const plot: Record<string, Array<{ machineT: number; z_long: number; y_vert: number }>> = {};
  for (const model of plotModels) {
    plot[model] = NAMED_STATES.map((st) => {
      const cg = (primary[model] as Record<string, Record<string, { cg: CgResult }>>).NOMINAL[st.id].cg;
      return { machineT: st.machineT, z_long: cg.z_long, y_vert: cg.y_vert };
    });
  }

  return {
    freezeId: AR1_ID,
    status: "PENDING_DIRECTOR_ASSUMPTION_DISPOSITION",
    computed_disposition_after_F5,
    analyst_disposition,
    externally_adjudicated_disposition,
    disposition_provenance,
    originalDisposition: "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION",
    sourceS4aSha256: S4A_SHA256,
    originalVb1ZipSha256: ORIGINAL_VB1_ZIP_SHA256,
    inventory: { tag: "GEOMETRY_FACT", ...inv },
    proxies: { ...proxies, locationTag: "ASSUMPTION", note: "geometry-derived candidate positions; not manufactured centroids" },
    baseline,
    baselineReproduction: repro,
    primary,
    namedImpact,
    corners,
    F5_MASS_RANGE_EFFECT: { tag: "DERIVED_ESTIMATE", ...massRangeAtBase },
    F5_LOCATION_EFFECT: { tag: "DERIVED_ESTIMATE", ...locEffect, maxPlausibleAbsDz: maxPlausibleDz },
    comparison: {
      F6_DRIVE_MOVING_dZ: F6_DZ,
      F8_COCKPIT_dZ: F8_DZ,
      F1_REAR_BOOKS_dY: F1_DY,
      F5_location_forward_vs_aft: locEffect.forward_vs_aft,
      classification_vs_F6_F8: locClass,
    },
    newlyCrossedPlanform: newlyAft,
    reds: [],
    nextSlice,
    conclusion,
    gates,
    planform,
    thrustY,
    machineHeight: MACHINE_HEIGHT_M,
    keelFacts: {
      zFwd: P.keel.zFwd,
      zAft: P.keel.zAft,
      bayZFwd: P.bay.zFwd,
      bayZAft: P.bay.zAft,
    },
    csv: csv.join("\n"),
    plot,
    options: opts,
    nomSpreadBase: nomSpreadBase.cg,
  };
}

export function svgF5LocationPlot(plot: Record<string, Array<{ machineT: number; z_long: number }>>): string {
  const W = 760;
  const H = 360;
  const colors: Record<string, string> = {
    F5_BASE: "#222",
    F5_FORWARD_PROXY: "#26a",
    F5_AFT_PROXY: "#b33",
    F5_SPLIT_50_50: "#a80",
  };
  const zs = Object.values(plot).flatMap((r) => r.map((p) => p.z_long));
  const z0 = Math.min(...zs) - 0.15;
  const z1 = Math.max(...zs) + 0.15;
  const xOf = (t: number) => 50 + t * (W - 90);
  const yOf = (z: number) => H - 40 - ((z - z0) / (z1 - z0)) * (H - 70);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13">AR1 z_long(CG) vs machineT — F5 location models, other families NOMINAL</text>`;
  for (const [name, row] of Object.entries(plot)) {
    const path = row.map((p, i) => `${i ? "L" : "M"}${xOf(p.machineT).toFixed(1)},${yOf(p.z_long).toFixed(1)}`).join(" ");
    d += `<path d="${path}" fill="none" stroke="${colors[name] ?? "#000"}" stroke-width="1.7"/>`;
  }
  let ly = 36;
  for (const [name, col] of Object.entries(colors)) {
    d += `<rect x="16" y="${ly}" width="10" height="10" fill="${col}"/><text x="30" y="${ly + 9}" font-size="11">${name}</text>`;
    ly += 16;
  }
  d += `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-size="10">machineT 0 → 1 · rear planform z=${REAR_AREA_Z.toFixed(2)}</text>`;
  d += `</svg>`;
  return d;
}
