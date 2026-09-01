import { DESIGN_CLEARANCE, P } from "../../design/parameters";
import { S4A_SHA256 } from "../../design/s5Parameters";
import type { MachineRig } from "../../machine/types";
import { makeObb, obbOverlaps, obbSeparation, obbWorldAabb, type OBB } from "../../math/obb";
import { svgKs1Long, svgKs1Stations, svgKs1Top } from "./svg";

export type CrossingClass =
  | "EXISTING_PASSAGE"
  | "EDGE_BYPASS"
  | "SURFACE_HANDOFF"
  | "BOUNDED_SLEEVE_CANDIDATE"
  | "PENETRATION_REQUIRED_BUT_UNRESOLVED"
  | "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE"
  | "UNKNOWN";

export type EpistemicTag =
  | "FROZEN_FACT"
  | "GAMEPLAY_SEMANTIC"
  | "DERIVED_OBLIGATION"
  | "ARCHITECTURE_HYPOTHESIS"
  | "UNKNOWN";

type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };

const STEP = 0.01;
const REFINE = 0.002;
const NEAR = 0.25;
const WAIST_X_IN = P.keel.halfWidth + DESIGN_CLEARANCE;
const KEEP_COCKPIT = P.keep.cockpit;
const KEEP_DORSAL = P.keep.dorsal;
const CAN_Y_BOT = P.drive.y - P.drive.h / 2;
const CAN_Y_TOP = P.drive.y + P.drive.h / 2;
const SLEEVE_W = 0.08;
const SLEEVE_H = 0.06;
const FACE_INSET = 0.002;
const WAIST_PORT: Box = { minX: -6.7, maxX: -WAIST_X_IN, minY: 0.6, maxY: 2.35, minZ: -1.63, maxZ: 1.05 };
const WAIST_STBD: Box = { minX: WAIST_X_IN, maxX: 6.7, minY: 0.6, maxY: 2.35, minZ: -1.63, maxZ: 1.05 };

const STATIONS = [
  { id: "Z3p35", z: 3.35, solid: "BULKHEAD_Z3p35", name: "BULKHEAD_Z3.35" },
  { id: "Z1p15", z: 1.15, solid: "BULKHEAD_Z1p15", name: "BULKHEAD_Z1.15" },
  { id: "Zm1p70", z: P.bay.zFwd, solid: "BULKHEAD_Z-1p70", name: "BULKHEAD_Z-1.70" },
] as const;



function round(v: number, d = 4): number {
  const p = 10 ** d;
  return Math.round(v * p) / p;
}

function aabbFromObb(o: OBB): Box {
  const a = obbWorldAabb(o);
  return { minX: a.min.x, maxX: a.max.x, minY: a.min.y, maxY: a.max.y, minZ: a.min.z, maxZ: a.max.z };
}

function boxObb(name: string, b: Box): OBB {
  return makeObb(
    name,
    "ks1-diagnostic",
    { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, z: (b.minZ + b.maxZ) / 2 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: (b.maxX - b.minX) / 2, y: (b.maxY - b.minY) / 2, z: (b.maxZ - b.minZ) / 2 },
  );
}

function overlaps(a: Box, b: Box): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}

function aabbGap(a: Box, b: Box): number {
  const dx = a.maxX < b.minX ? b.minX - a.maxX : b.maxX < a.minX ? a.minX - b.maxX : 0;
  const dy = a.maxY < b.minY ? b.minY - a.maxY : b.maxY < a.minY ? a.minY - b.maxY : 0;
  const dz = a.maxZ < b.minZ ? b.minZ - a.maxZ : b.maxZ < a.minZ ? a.minZ - b.maxZ : 0;
  if (dx === 0 && dy === 0 && dz === 0) {
    const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
    const oy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
    const oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
    return -Math.min(ox, oy, oz);
  }
  return Math.hypot(dx, dy, dz);
}

function keepBox(k: { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number }): Box {
  return { minX: k.cx - k.hx, maxX: k.cx + k.hx, minY: k.cy - k.hy, maxY: k.cy + k.hy, minZ: k.cz - k.hz, maxZ: k.cz + k.hz };
}

function namedAabb(rig: MachineRig, name: string): Box | null {
  const row = rig.worldSolids().find((s) => s.name === name && s.role === "physical");
  return row ? aabbFromObb(row.obb) : null;
}

function edgeBypass(z: number, side: -1 | 1): Box {
  const x0 = side * (P.keel.halfWidth + FACE_INSET);
  const x1 = side * (WAIST_X_IN - 0.005);
  return {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minY: 0.05,
    maxY: 0.16,
    minZ: z - 0.06,
    maxZ: z + 0.06,
  };
}

function axisClearance(a: Box, b: Box): { dx: number; dy: number; dz: number; hypot: number; overlapping: boolean } {
  const ax = (loA: number, hiA: number, loB: number, hiB: number): number => {
    if (hiA < loB) return loB - hiA;
    if (hiB < loA) return loA - hiB;
    return -(Math.min(hiA, hiB) - Math.max(loA, loB));
  };
  const dx = round(ax(a.minX, a.maxX, b.minX, b.maxX), 4);
  const dy = round(ax(a.minY, a.maxY, b.minY, b.maxY), 4);
  const dz = round(ax(a.minZ, a.maxZ, b.minZ, b.maxZ), 4);
  const overlapping = dx <= 0 && dy <= 0 && dz <= 0;
  const hypot = overlapping
    ? round(-Math.min(-dx, -dy, -dz), 4)
    : round(Math.hypot(Math.max(0, dx), Math.max(0, dy), Math.max(0, dz)), 4);
  return { dx, dy, dz, hypot, overlapping };
}

function waistClearance(b: Box, side: -1 | 1): Record<string, unknown> {
  const cell = side < 0 ? WAIST_PORT : WAIST_STBD;
  const axes = axisClearance(b, cell);
  const planeX = side * WAIST_X_IN;
  const stripOutboardX = side < 0 ? b.minX : b.maxX;
  const deltaXToXIn = round(side < 0 ? stripOutboardX - planeX : planeX - stripOutboardX, 4);
  return {
    cell: side < 0 ? "DRIVE_WAIST_PORT" : "DRIVE_WAIST_STBD",
    xIn: WAIST_X_IN,
    stripOutboardX: round(stripOutboardX, 4),
    deltaXToXIn,
    dx: axes.dx,
    dy: axes.dy,
    dz: axes.dz,
    hypot: axes.hypot,
    overlapping: axes.overlapping,
  };
}

function doglegLegs(keel: Box, plate: Box, wrap: Box, side: -1 | 1): { fore: Box; aft: Box; zOffset: number; zThickness: number } {
  const keelFace = side < 0 ? keel.minX - FACE_INSET : keel.maxX + FACE_INSET;
  const wrapIn = side < 0 ? wrap.maxX : wrap.minX;
  const trans: Pick<Box, "minX" | "maxX" | "minY" | "maxY"> = {
    minX: Math.min(keelFace, wrapIn),
    maxX: Math.max(keelFace, wrapIn),
    minY: wrap.minY,
    maxY: wrap.maxY,
  };
  const fore: Box = { ...trans, minZ: plate.maxZ + FACE_INSET, maxZ: wrap.maxZ };
  const aft: Box = { ...trans, minZ: wrap.minZ, maxZ: plate.minZ - FACE_INSET };
  return {
    fore,
    aft,
    zOffset: FACE_INSET,
    zThickness: round(Math.min(fore.maxZ - fore.minZ, aft.maxZ - aft.minZ), 4),
  };
}

function sleeveAboveKeel(keel: Box, z: number): Box {
  const y0 = keel.maxY + 0.002;
  return {
    minX: -SLEEVE_W / 2,
    maxX: SLEEVE_W / 2,
    minY: y0,
    maxY: y0 + SLEEVE_H,
    minZ: z - 0.05,
    maxZ: z + 0.05,
  };
}

function handoffStrip(plate: Box): Box {
  return {
    minX: -0.08,
    maxX: 0.08,
    minY: 0.17,
    maxY: P.keel.dorsalY - P.keel.longeronH / 2,
    minZ: plate.maxZ,
    maxZ: plate.maxZ + 0.02,
  };
}

function underPlateAir(keel: Box, plate: Box, side: -1 | 1): Box {
  if (side < 0) {
    return { minX: plate.minX, maxX: keel.minX, minY: 0, maxY: plate.minY, minZ: plate.minZ, maxZ: plate.maxZ };
  }
  return { minX: keel.maxX, maxX: plate.maxX, minY: 0, maxY: plate.minY, minZ: plate.minZ, maxZ: plate.maxZ };
}

const OPEN_STERN: Box = {
  minX: -0.7,
  maxX: 0.7,
  minY: P.drive.y - 0.7,
  maxY: P.drive.y + 0.7,
  minZ: P.drive.stowedZ - P.drive.stroke - 0.6,
  maxZ: P.drive.stowedZ - P.drive.stroke + 0.2,
};

function protectedHits(b: Box): string[] {
  const hits: string[] = [];
  if (overlaps(b, keepBox(KEEP_COCKPIT))) hits.push("KEEP_COCKPIT");
  if (overlaps(b, keepBox(KEEP_DORSAL))) hits.push("KEEP_DORSAL");
  if (overlaps(b, WAIST_PORT) || overlaps(b, WAIST_STBD)) hits.push("DRIVE_WAIST");
  const can: Box = {
    minX: -P.drive.w / 2,
    maxX: P.drive.w / 2,
    minY: CAN_Y_BOT,
    maxY: CAN_Y_TOP,
    minZ: P.drive.stowedZ - P.drive.stroke - 0.3,
    maxZ: P.drive.stowedZ + P.drive.l / 2,
  };
  if (overlaps(b, can)) hits.push("CAN_CORRIDOR");
  const core: Box = { minX: -0.35, maxX: 0.35, minY: P.drive.y - 0.26, maxY: P.drive.y + 0.26, minZ: -4.405, maxZ: -2.605 };
  if (overlaps(b, core)) hits.push("FIXED_CORE");
  if (overlaps(b, OPEN_STERN)) hits.push("OPEN_STERN");
  return hits;
}

function keepMargins(b: Box): Record<string, number | null> {
  const margin = (k: Box): number => {
    if (overlaps(b, k)) return round(-aabbGap(b, k));
    return round(aabbGap(b, k));
  };
  return {
    KEEP_COCKPIT: margin(keepBox(KEEP_COCKPIT)),
    KEEP_DORSAL: margin(keepBox(KEEP_DORSAL)),
    DRIVE_WAIST: Math.min(margin(WAIST_PORT), margin(WAIST_STBD)),
    CAN_CORRIDOR: margin({
      minX: -P.drive.w / 2,
      maxX: P.drive.w / 2,
      minY: CAN_Y_BOT,
      maxY: CAN_Y_TOP,
      minZ: P.drive.stowedZ - P.drive.stroke - 0.3,
      maxZ: P.drive.stowedZ + P.drive.l / 2,
    }),
    FIXED_CORE: margin({ minX: -0.35, maxX: 0.35, minY: P.drive.y - 0.26, maxY: P.drive.y + 0.26, minZ: -4.405, maxZ: -2.605 }),
    OPEN_STERN: margin(OPEN_STERN),
  };
}

type MotionHit = {
  status: "CLEAR" | "CONTACT" | "UNKNOWN";
  firstT: number | null;
  minSep: number | null;
  minSepT: number | null;
  solid: string | null;
  bookRootHit: boolean;
};

function emptyHit(): MotionHit {
  return { status: "CLEAR", firstT: null, minSep: null, minSepT: null, solid: null, bookRootHit: false };
}

function isBookName(name: string): boolean {
  return /^(FL|FR|RL|RR)_/.test(name);
}

function consider(row: MotionHit, t: number, sep: number, name: string): void {
  if (row.minSep === null || sep < row.minSep) {
    row.minSep = sep;
    row.minSepT = t;
    row.solid = name;
  }
  if (sep < 0 && row.firstT === null) {
    row.firstT = t;
    row.status = "CONTACT";
  }
  if (sep < 0 && isBookName(name)) row.bookRootHit = true;
}

function screenAll(rig: MachineRig, candidates: Record<string, OBB>, times: number[]): Record<string, MotionHit> {
  const hits: Record<string, MotionHit> = {};
  const boxes: Record<string, Box> = {};
  for (const [key, cand] of Object.entries(candidates)) {
    hits[key] = emptyHit();
    boxes[key] = aabbFromObb(cand);
  }
  for (const t of times) {
    rig.applyMachine(t);
    const moving = rig.worldSolids().filter((s) => s.role === "physical" && s.moving);
    for (const [key, cand] of Object.entries(candidates)) {
      const row = hits[key];
      const cb = boxes[key];
      for (const s of moving) {
        const sb = aabbFromObb(s.obb);
        const gap = aabbGap(cb, sb);
        if (gap > NEAR) {
          consider(row, t, gap, s.name);
          continue;
        }
        if (gap > 0) {
          consider(row, t, gap, s.name);
          continue;
        }
        if (!obbOverlaps(cand, s.obb)) {
          consider(row, t, Math.max(0, obbSeparation(cand, s.obb)), s.name);
          continue;
        }
        consider(row, t, obbSeparation(cand, s.obb), s.name);
      }
    }
  }
  for (const row of Object.values(hits)) {
    if (row.minSep !== null) row.minSep = round(row.minSep, 5);
    if (row.firstT !== null) row.firstT = round(row.firstT, 4);
    if (row.minSepT !== null) row.minSepT = round(row.minSepT, 4);
  }
  return hits;
}

function uniqueTimes(values: number[]): number[] {
  const s = new Set(values.map((t) => round(Math.min(1, Math.max(0, t)), 4)));
  return [...s].sort((a, b) => a - b);
}

function globalTimes(): number[] {
  const ts: number[] = [];
  for (let i = 0; i <= Math.round(1 / STEP); i += 1) ts.push(round(i * STEP, 4));
  return ts;
}

function refineTimes(hits: Record<string, MotionHit>): number[] {
  const extra: number[] = [];
  const foldCenters = [0.14, 0.61, 0.77];
  const centers: number[] = [...foldCenters];
  for (const row of Object.values(hits)) {
    if (row.firstT !== null) centers.push(row.firstT);
    if (row.minSepT !== null) centers.push(row.minSepT);
  }
  for (const c of centers) {
    for (let t = c - STEP; t <= c + STEP + 1e-9; t += REFINE) extra.push(t);
  }
  return uniqueTimes(extra);
}

function serializeBox(b: Box): Box {
  return {
    minX: round(b.minX),
    maxX: round(b.maxX),
    minY: round(b.minY),
    maxY: round(b.maxY),
    minZ: round(b.minZ),
    maxZ: round(b.maxZ),
  };
}

function motionOk(m: MotionHit): boolean {
  return m.status === "CLEAR";
}

function segmentOk(
  box: Box,
  motionHit: MotionHit,
  keeps: string[],
  fixed: string[],
  plate: Box,
): { ok: boolean; keeps: string[]; fixed: string[]; motion: MotionHit; intersectsPlate: boolean } {
  const intersectsPlate = overlaps(box, plate) && aabbGap(box, plate) <= 0;
  return {
    ok: keeps.length === 0 && motionOk(motionHit) && fixed.length === 0 && !intersectsPlate,
    keeps,
    fixed,
    motion: motionHit,
    intersectsPlate,
  };
}

function fixedOccupants(rig: MachineRig, box: Box, ignore: string[]): string[] {
  const hits: string[] = [];
  for (const s of rig.worldSolids()) {
    if (s.role !== "physical" || s.moving) continue;
    if (ignore.includes(s.name)) continue;
    const b = aabbFromObb(s.obb);
    if (overlaps(box, b) && aabbGap(box, b) <= 0) hits.push(s.name);
  }
  return hits;
}

export function runKs1Study(rig: MachineRig): Record<string, unknown> {
  return rig.withPreservedPose(() => {
    rig.applyMachine(0);
    const keel = namedAabb(rig, "VENTRAL_KEEL");
    if (!keel) throw new Error("KS1 requires VENTRAL_KEEL");
    const plates = STATIONS.map((st) => ({ ...st, aabb: namedAabb(rig, st.solid) }));

    const candidates: Record<string, OBB> = {};
    const envelopes: Record<string, Box> = {};
    const register = (key: string, box: Box) => {
      envelopes[key] = box;
      candidates[key] = boxObb(`KS1_${key}`, box);
    };

    for (const st of plates) {
      if (!st.aabb) continue;
      register(`BYPASS_${st.id}_P`, edgeBypass(st.z, -1));
      register(`BYPASS_${st.id}_S`, edgeBypass(st.z, 1));
      const wrapP0 = envelopes[`BYPASS_${st.id}_P`];
      const wrapS0 = envelopes[`BYPASS_${st.id}_S`];
      const legsP0 = doglegLegs(keel, st.aabb, wrapP0, -1);
      const legsS0 = doglegLegs(keel, st.aabb, wrapS0, 1);
      register(`FORE_${st.id}_P`, legsP0.fore);
      register(`AFT_${st.id}_P`, legsP0.aft);
      register(`FORE_${st.id}_S`, legsS0.fore);
      register(`AFT_${st.id}_S`, legsS0.aft);
      register(`SLEEVE_${st.id}`, sleeveAboveKeel(keel, st.z));
      register(`UNDERPLATE_${st.id}_P`, underPlateAir(keel, st.aabb, -1));
      register(`UNDERPLATE_${st.id}_S`, underPlateAir(keel, st.aabb, 1));
      if (st.id === "Zm1p70") {
        register("HANDOFF_ZM170", handoffStrip(st.aabb));
        register("HANDOFF_ZM170_P", {
          minX: -0.5,
          maxX: -0.36,
          minY: 0.17,
          maxY: P.keel.dorsalY - P.keel.longeronH / 2,
          minZ: st.aabb.maxZ,
          maxZ: st.aabb.maxZ + 0.02,
        });
        register("HANDOFF_ZM170_S", {
          minX: 0.36,
          maxX: 0.5,
          minY: 0.17,
          maxY: P.keel.dorsalY - P.keel.longeronH / 2,
          minZ: st.aabb.maxZ,
          maxZ: st.aabb.maxZ + 0.02,
        });
      }
    }

    const motion = screenAll(rig, candidates, globalTimes());
    const extra = refineTimes(motion);
    const refined = extra.length ? screenAll(rig, candidates, extra) : motion;
    for (const [key, row] of Object.entries(refined)) {
      const g = motion[key];
      if (!g) continue;
      if (row.minSep !== null && (g.minSep === null || row.minSep < g.minSep)) {
        g.minSep = row.minSep;
        g.minSepT = row.minSepT;
        g.solid = row.solid;
      }
      if (row.status === "CONTACT") {
        g.status = "CONTACT";
        g.bookRootHit = g.bookRootHit || row.bookRootHit;
        if (row.firstT !== null && (g.firstT === null || row.firstT < g.firstT)) g.firstT = row.firstT;
      }
    }

    const stations = plates.map((st) => {
      if (!st.aabb) {
        return {
          id: st.id,
          name: st.name,
          z: st.z,
          selected: "UNKNOWN" as CrossingClass,
          remainingUnknowns: ["bulkhead solid not found"],
        };
      }
      const plate = serializeBox(st.aabb);
      const gapUnderPlate = round(st.aabb.minY - keel.minY);
      const bypassP = envelopes[`BYPASS_${st.id}_P`];
      const bypassS = envelopes[`BYPASS_${st.id}_S`];
      const sleeve = envelopes[`SLEEVE_${st.id}`];
      const underP = envelopes[`UNDERPLATE_${st.id}_P`];
      const underS = envelopes[`UNDERPLATE_${st.id}_S`];
      const bypassKeepsP = protectedHits(bypassP);
      const bypassKeepsS = protectedHits(bypassS);
      const bypassKeeps = [...new Set([...bypassKeepsP, ...bypassKeepsS])];
      const sleeveKeeps = protectedHits(sleeve);
      const underKeeps = [...new Set([...protectedHits(underP), ...protectedHits(underS)])];
      const mBypassP = motion[`BYPASS_${st.id}_P`];
      const mBypassS = motion[`BYPASS_${st.id}_S`];
      const mSleeve = motion[`SLEEVE_${st.id}`];
      const mUnderP = motion[`UNDERPLATE_${st.id}_P`];
      const mUnderS = motion[`UNDERPLATE_${st.id}_S`];
      const ignorePlate = [st.solid, "VENTRAL_KEEL"];
      const fixedBypassP = fixedOccupants(rig, bypassP, ignorePlate);
      const fixedBypassS = fixedOccupants(rig, bypassS, ignorePlate);
      const fixedSleeve = fixedOccupants(rig, sleeve, [st.solid, "VENTRAL_KEEL"]);
      const portBypassOk = bypassKeepsP.length === 0 && motionOk(mBypassP) && fixedBypassP.length === 0;
      const stbdBypassOk = bypassKeepsS.length === 0 && motionOk(mBypassS) && fixedBypassS.length === 0;
      const oneBypassClear = portBypassOk || stbdBypassOk;
      const bothBypassClear = portBypassOk && stbdBypassOk;
      const sleeveClear = sleeveKeeps.length === 0 && motionOk(mSleeve) && fixedSleeve.length === 0;
      const legsP = doglegLegs(keel, st.aabb, bypassP, -1);
      const legsS = doglegLegs(keel, st.aabb, bypassS, 1);
      const ignoreDogleg = ignorePlate;
      const portFore = segmentOk(
        legsP.fore,
        motion[`FORE_${st.id}_P`],
        protectedHits(legsP.fore),
        fixedOccupants(rig, legsP.fore, ignoreDogleg),
        st.aabb,
      );
      const portAft = segmentOk(
        legsP.aft,
        motion[`AFT_${st.id}_P`],
        protectedHits(legsP.aft),
        fixedOccupants(rig, legsP.aft, ignoreDogleg),
        st.aabb,
      );
      const stbdFore = segmentOk(
        legsS.fore,
        motion[`FORE_${st.id}_S`],
        protectedHits(legsS.fore),
        fixedOccupants(rig, legsS.fore, ignoreDogleg),
        st.aabb,
      );
      const stbdAft = segmentOk(
        legsS.aft,
        motion[`AFT_${st.id}_S`],
        protectedHits(legsS.aft),
        fixedOccupants(rig, legsS.aft, ignoreDogleg),
        st.aabb,
      );
      const portDoglegOk = portBypassOk && portFore.ok && portAft.ok;
      const stbdDoglegOk = stbdBypassOk && stbdFore.ok && stbdAft.ok;
      const oneDoglegOk = portDoglegOk || stbdDoglegOk;
      const bothDoglegOk = portDoglegOk && stbdDoglegOk;
      const existingHole = false;
      const underPlateIsCarrier = false;

      let selected: CrossingClass;
      if (existingHole) selected = "EXISTING_PASSAGE";
      else if (bothBypassClear || oneBypassClear) selected = "EDGE_BYPASS";
      else if (sleeveClear) selected = "BOUNDED_SLEEVE_CANDIDATE";
      else if (mBypassP.status === "UNKNOWN" || mSleeve.status === "UNKNOWN") selected = "UNKNOWN";
      else if (!sleeveClear && bypassKeeps.length === 0 && (mBypassP.status === "CONTACT" || mBypassS.status === "CONTACT")) {
        selected = sleeveKeeps.length ? "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE" : "PENETRATION_REQUIRED_BUT_UNRESOLVED";
      } else selected = "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE";

      const approachUnknown =
        portFore.motion.status === "UNKNOWN" ||
        portAft.motion.status === "UNKNOWN" ||
        stbdFore.motion.status === "UNKNOWN" ||
        stbdAft.motion.status === "UNKNOWN";
      let doglegClosure: "COMPLETE_DOGLEG_CLEAR" | "EDGE_STRIP_CLEAR_BUT_APPROACH_FAILS" | "UNKNOWN" | "NOT_SELECTED" =
        "NOT_SELECTED";
      if (selected === "EDGE_BYPASS") {
        if (oneDoglegOk) doglegClosure = "COMPLETE_DOGLEG_CLEAR";
        else if (approachUnknown) doglegClosure = "UNKNOWN";
        else {
          doglegClosure = "EDGE_STRIP_CLEAR_BUT_APPROACH_FAILS";
          if (sleeveClear) selected = "BOUNDED_SLEEVE_CANDIDATE";
          else if (sleeveKeeps.length) selected = "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE";
          else selected = "PENETRATION_REQUIRED_BUT_UNRESOLVED";
        }
      }

      let handoff: Record<string, unknown> | null = null;
      if (st.id === "Zm1p70") {
        const strip = envelopes.HANDOFF_ZM170;
        const stripKeeps = protectedHits(strip);
        const stripMotion = motion.HANDOFF_ZM170;
        const fixedHandoff = fixedOccupants(rig, strip, [st.solid, "VENTRAL_KEEL", "DORSAL_LONGERON"]);
        const offsetP = envelopes.HANDOFF_ZM170_P;
        const offsetS = envelopes.HANDOFF_ZM170_S;
        const offsetKeepsP = protectedHits(offsetP);
        const offsetKeepsS = protectedHits(offsetS);
        const offsetFixedP = fixedOccupants(rig, offsetP, [st.solid, "VENTRAL_KEEL", "DORSAL_LONGERON"]);
        const offsetFixedS = fixedOccupants(rig, offsetS, [st.solid, "VENTRAL_KEEL", "DORSAL_LONGERON"]);
        const offsetPOk = offsetKeepsP.length === 0 && motionOk(motion.HANDOFF_ZM170_P) && offsetFixedP.length === 0;
        const offsetSOk = offsetKeepsS.length === 0 && motionOk(motion.HANDOFF_ZM170_S) && offsetFixedS.length === 0;
        const centerlineOk = stripKeeps.length === 0 && motionOk(stripMotion) && fixedHandoff.length === 0;
        const vkUnderBay = {
          cls: "SURFACE_HANDOFF" as CrossingClass,
          tag: "FROZEN_FACT" as EpistemicTag,
          note: "VENTRAL_KEEL already continues under the bay to z=−4.95. Keel top 0.17 m, can bottom " + CAN_Y_BOT.toFixed(3) + " m. That is frozen structure, not a new tunnel, and it does not by itself cross this 80 mm plate.",
        };
        const offsetWorks = offsetPOk || offsetSOk;
        handoff = {
          cls: centerlineOk || offsetWorks ? "SURFACE_HANDOFF" : "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE",
          tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag,
          envelope: serializeBox(centerlineOk ? strip : offsetPOk ? offsetP : offsetS),
          centerlineFace: {
            envelope: serializeBox(strip),
            keeps: stripKeeps,
            motion: stripMotion,
            fixedOccupants: fixedHandoff,
            clear: centerlineOk,
            note: "Full-height centerline drop on the +Z face. Blocked if S5_CORE_REACTION_FRAME occupies that face (it is registered at this station z).",
          },
          offsetPort: {
            envelope: serializeBox(offsetP),
            keeps: offsetKeepsP,
            motion: motion.HANDOFF_ZM170_P,
            fixedOccupants: offsetFixedP,
            clear: offsetPOk,
          },
          offsetStbd: {
            envelope: serializeBox(offsetS),
            keeps: offsetKeepsS,
            motion: motion.HANDOFF_ZM170_S,
            fixedOccupants: offsetFixedS,
            clear: offsetSOk,
          },
          keeps: centerlineOk ? stripKeeps : offsetPOk ? offsetKeepsP : offsetKeepsS,
          keepMargins: keepMargins(centerlineOk ? strip : offsetPOk ? offsetP : offsetS),
          vkUnderBay,
          note: centerlineOk
            ? "Ride the bay-forward (+Z) face of BULKHEAD_Z-1.70 from the dorsal-longeron underside down to the ventral keel. Face-riding only. Does not enter can, core, or bay interior."
            : offsetWorks
              ? "Centerline +Z face is occupied by S5_CORE_REACTION_FRAME (same station z as the plate). A face-offset drop outboard of that frame, still on the plate face and inboard of the plate edge, is the SURFACE_HANDOFF candidate. Not through the core or can."
              : "Neither the centerline face nor the offset face-drop is clear.",
        };
      }

      const plateCrossing = selected;
      const selectedBundle =
        st.id === "Zm1p70" && handoff && handoff.cls === "SURFACE_HANDOFF" && selected === "BOUNDED_SLEEVE_CANDIDATE"
          ? "SURFACE_HANDOFF + BOUNDED_SLEEVE_CANDIDATE"
          : st.id === "Zm1p70" && handoff && handoff.cls === "SURFACE_HANDOFF" && selected === "EDGE_BYPASS"
            ? "SURFACE_HANDOFF + EDGE_BYPASS"
            : selected;

      const remainingUnknowns = [
        "No stress, fatigue, sealing, or manufacturing claim.",
        "Sleeve, if hypothesized, is ARCHITECTURE_HYPOTHESIS only — not an authorized hole.",
        gapUnderPlate > 0.001
          ? "Keel underside protrudes ~10 mm below plate minY; that occupied bar is not a through-passage."
          : null,
      ].filter(Boolean);

      return {
        id: st.id,
        name: st.name,
        z: st.z,
        plate,
        keel: serializeBox(keel),
        gapUnderPlate,
        frozenFacts: [
          `${st.name} is a solid box plate ~1.50 × 1.54 × 0.08 m at z=${st.z.toFixed(2)}, x∈[−0.75, 0.75], y∈[~0.04, ~1.58].`,
          "No certified hole, bore, or sleeve exists in this plate.",
          "VENTRAL_KEEL AABB overlaps the plate at the bottom center. Overlap is occupied structure, not a third-party passage.",
          st.id === "Z3p35"
            ? "KEEP_COCKPIT occupies the over-plate / forward-dorsal region (y≥0.30, |x|≤0.68, z∈[2.50, 4.60]). Over-plate is already NO_ROUTE."
            : st.id === "Z1p15"
              ? "Aft of KEEP_COCKPIT. KEEP_DORSAL covers this z only at y≥1.56. Certified DRIVE waist is outboard of x=0.81."
              : "Bay-forward station. Dorsal longeron ends. Ventral keel continues under the propulsion bay. Can/core sit above the keel route.",
        ],
        existingPassage: {
          cls: existingHole ? "EXISTING_PASSAGE" : "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE",
          tag: "FROZEN_FACT" as EpistemicTag,
          holeInPlate: false,
          keelPlateOverlapIsPassage: false,
          underPlateAirOutboardOfKeel: {
            port: serializeBox(underP),
            stbd: serializeBox(underS),
            height: round(st.aabb.minY),
            keeps: underKeeps,
            motionPort: mUnderP,
            motionStbd: mUnderS,
            treatedAsCarrier: underPlateIsCarrier,
            note: "Air exists under the plate outboard of the keel (y below plate.minY ≈ 0.04). It is floor-adjacent, leaves the keel-side-face carrier, and is not a hole in the plate. Not promoted to EXISTING_PASSAGE.",
          },
          gapUnderPlate,
          note:
            gapUnderPlate > 0.001
              ? `Plate minY ${st.aabb.minY.toFixed(4)} is ${gapUnderPlate.toFixed(4)} m above keel minY ${keel.minY.toFixed(4)}. That strip is occupied keel bar, not an opening.`
              : "Plate covers or matches keel underside; no uncovered face.",
        },
        edgeBypass: {
          cls: bothBypassClear || oneBypassClear ? "EDGE_BYPASS" : bypassKeeps.length ? "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE" : mBypassP.status === "CONTACT" || mBypassS.status === "CONTACT" ? "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE" : "UNKNOWN",
          tag: (bothBypassClear || oneBypassClear ? "ARCHITECTURE_HYPOTHESIS" : "UNKNOWN") as EpistemicTag,
          envelopePort: serializeBox(bypassP),
          envelopeStbd: serializeBox(bypassS),
          keeps: bypassKeeps,
          keepMarginsPort: keepMargins(bypassP),
          keepMarginsStbd: keepMargins(bypassS),
          motionPort: mBypassP,
          motionStbd: mBypassS,
          bothSidesClear: bothBypassClear,
          oneSideClear: oneBypassClear,
          fixedOccupantsPort: fixedBypassP,
          fixedOccupantsStbd: fixedBypassS,
          structureChangeIfBuilt: false,
          note: `Wrap the 80 mm plate in the ~${Math.round((WAIST_X_IN - P.keel.halfWidth) * 1000)} mm strip between plate edge x=±${P.keel.halfWidth} and waist xIn=±${WAIST_X_IN}, y∈[0.05, 0.16] (keel height). Inboard of certified waist. Below KEEP_COCKPIT / KEEP_DORSAL.`,
        },
        surfaceHandoff: handoff,
        boundedSleeve: {
          cls: sleeveClear ? "BOUNDED_SLEEVE_CANDIDATE" : "PENETRATION_REQUIRED_BUT_UNRESOLVED",
          tag: "ARCHITECTURE_HYPOTHESIS" as EpistemicTag,
          envelope: serializeBox(sleeve),
          opening: {
            width: SLEEVE_W,
            height: SLEEVE_H,
            through: 0.1,
            cx: 0,
            cy: round((sleeve.minY + sleeve.maxY) / 2),
            cz: st.z,
            y0: round(sleeve.minY),
            y1: round(sleeve.maxY),
          },
          keelModified: false,
          plateModifiedIfBuilt: true,
          structureChangeIfBuilt: true,
          remainingLigaments:
            "Plate remains full 1.50 m width except a bottom-center opening 0.08 × 0.06 m immediately above the keel bar. Side ligaments ≈ 0.71 m each. Material above the opening remains ≈ plate.maxY − sleeve.maxY. Keel bar is not cut.",
          relationshipToKeel: "Adjacent, immediately above VENTRAL_KEEL top face. Opening does not enter the keel solid.",
          keeps: sleeveKeeps,
          keepMargins: keepMargins(sleeve),
          motion: mSleeve,
          fixedOccupants: fixedSleeve,
          authorizedHole: false,
        },
        denseMotion: {
          method: "Single canonical applyMachine loop, Δt=0.01 globally, then local refine Δt=0.002 around first-contact, min-separation, and fold windows [0.06,0.22]/[0.50,0.72]/[0.66,0.88]. Candidate OBB vs moving physical authority solids. AABB broadphase; SAT/OBB only when near. Feasibility screening, not a new authority certificate.",
          samplesGlobal: Math.round(1 / STEP) + 1,
          bypassPort: mBypassP,
          bypassStbd: mBypassS,
          sleeve: mSleeve,
          bookRootHit: Boolean(mBypassP.bookRootHit || mBypassS.bookRootHit || mSleeve.bookRootHit),
        },
        protectedVolume: {
          bypass: bypassKeeps,
          sleeve: sleeveKeeps,
          handoff: handoff ? (handoff.keeps as string[]) : [],
          failIfOccupied: "A candidate that occupies KEEP_COCKPIT, KEEP_DORSAL, DRIVE waist, can/core, or open stern is FAIL. No reservation trading.",
          marginsSleeve: keepMargins(sleeve),
          marginsBypassPort: keepMargins(bypassP),
          marginsBypassStbd: keepMargins(bypassS),
        },
        plateCrossing,
        selected,
        selectedBundle,
        completeDogleg: {
          closure: doglegClosure,
          zOffsetFromPlate: legsP.zOffset,
          zThickness: legsP.zThickness,
          vkFaceX: [round(keel.minX), round(keel.maxX)],
          wrapOutboardX: [round(bypassP.minX), round(bypassS.maxX)],
          waistXIn: WAIST_X_IN,
          port: {
            ok: portDoglegOk,
            wrap: { envelope: serializeBox(bypassP), ok: portBypassOk, waist: waistClearance(bypassP, -1), motion: mBypassP, keeps: bypassKeepsP, fixed: fixedBypassP },
            outboundFore: { envelope: serializeBox(legsP.fore), ...portFore, waist: waistClearance(legsP.fore, -1) },
            inboundAft: { envelope: serializeBox(legsP.aft), ...portAft, waist: waistClearance(legsP.aft, -1) },
          },
          stbd: {
            ok: stbdDoglegOk,
            wrap: { envelope: serializeBox(bypassS), ok: stbdBypassOk, waist: waistClearance(bypassS, 1), motion: mBypassS, keeps: bypassKeepsS, fixed: fixedBypassS },
            outboundFore: { envelope: serializeBox(legsS.fore), ...stbdFore, waist: waistClearance(legsS.fore, 1) },
            inboundAft: { envelope: serializeBox(legsS.aft), ...stbdAft, waist: waistClearance(legsS.aft, 1) },
          },
          bothSidesClear: bothDoglegOk,
          oneSideClear: oneDoglegOk,
          note: "Transverse legs sit immediately fore/aft of the 80 mm plate at Z offset 2 mm (smallest inset that does not occupy the plate). They span from the ventral-keel side face |x|≈0.15 to the existing plate-edge wrap. Route was not widened. Strip outboard X is 0.805 vs certified waist xIn=0.81 (5 mm by construction).",
        },
        remainingUnknowns,
      };
    });

    const doglegClosures = stations.map(
      (s) => (s as { completeDogleg?: { closure: string } }).completeDogleg?.closure ?? "UNKNOWN",
    );
    const allDoglegsClear = doglegClosures.every((c) => c === "COMPLETE_DOGLEG_CLEAR");
    const anyApproachFail = doglegClosures.some((c) => c === "EDGE_STRIP_CLEAR_BUT_APPROACH_FAILS");
    const anyDoglegUnknown = doglegClosures.some((c) => c === "UNKNOWN");
    const selected = stations.map((s) => (s as { selected: CrossingClass }).selected);
    const allBypass = selected.every((s) => s === "EDGE_BYPASS");
    const allSleeve = selected.every((s) => s === "BOUNDED_SLEEVE_CANDIDATE");
    const allExisting = selected.every((s) => s === "EXISTING_PASSAGE" || s === "EDGE_BYPASS" || s === "SURFACE_HANDOFF");
    const anyFail = selected.some(
      (s) => s === "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE" || s === "PENETRATION_REQUIRED_BUT_UNRESOLVED",
    );
    const anyUnknown = selected.some((s) => s === "UNKNOWN");
    const mixed = new Set(selected).size > 1;

    let outcome: { code: string; name: string; rationale: string };
    if (anyUnknown && !anyFail && !allBypass && !allSleeve && !allExisting) {
      outcome = { code: "F", name: "UNKNOWN", rationale: "At least one station cannot be classified from the frozen representation." };
    } else if (anyFail && selected.some((s) => s === "NO_FEASIBLE_CROSSING_WITHOUT_STRUCTURE_CHANGE")) {
      outcome = {
        code: "D",
        name: "CROSSING_REQUIRES_MATERIAL_STRUCTURE_CHANGE",
        rationale: "At least one station cannot be crossed by existing passage, edge bypass, surface handoff, or a bounded geometrically-clear sleeve without altering frozen keel/bulkhead architecture.",
      };
    } else if (anyFail) {
      outcome = {
        code: "D",
        name: "CROSSING_REQUIRES_MATERIAL_STRUCTURE_CHANGE",
        rationale: "A required station is penetration-unresolved: no honest bypass and the bounded sleeve candidate is not geometrically clear.",
      };
    } else if (allExisting) {
      outcome = {
        code: "A",
        name: "CROSSINGS_FEASIBLE_WITHOUT_STRUCTURE_CHANGE",
        rationale: "All three plate crossings can use existing passage, edge bypass, and/or surface handoff. No sleeve is required.",
      };
    } else if (allSleeve) {
      outcome = {
        code: "B",
        name: "MINIMAL_DECLARED_SLEEVES_GEOMETRICALLY_FEASIBLE",
        rationale: "Each station needs a bounded sleeve at the keel/plate intersection. Those openings are geometrically clear of keepouts and of the dense moving-solid screen. No cut is authorized.",
      };
    } else if (mixed) {
      outcome = {
        code: "C",
        name: "MIXED_CROSSING_TOPOLOGY",
        rationale: "The three stations do not share one plate-crossing topology. Asymmetry is retained; it is not standardized.",
      };
    } else if (allBypass) {
      outcome = {
        code: "A",
        name: "CROSSINGS_FEASIBLE_WITHOUT_STRUCTURE_CHANGE",
        rationale: "Edge bypass at keel height clears keepouts and the dense motion screen at every station.",
      };
    } else {
      outcome = { code: "F", name: "UNKNOWN", rationale: "Classification did not collapse to A–E." };
    }

    const nextBy: Record<string, { id: string; title: string; reason: string }> = {
      A: {
        id: "service-route-architecture",
        title: "Generic service-route architecture on the proven edge-bypass skeleton",
        reason: "All three stations can be crossed by keel-height edge bypass without changing frozen plates or keel. Next is route architecture on that skeleton, still without professions.",
      },
      B: {
        id: "keel-plate-sleeve-reservation",
        title: "Minimum sleeve / local structural reservation at required plates",
        reason: "Sleeves are geometrically clear above the keel but would alter frozen plates if built. Next is a reservation study, not a cut, and not utility assignment.",
      },
      C: {
        id: "mixed-crossing-architecture",
        title: "Formalize mixed crossing architecture as one interface slice",
        reason: "Stations do not share one topology. Capture the mix as a single bounded interface definition, still without professions or authorized holes.",
      },
      D: {
        id: "director-station-reopen",
        title: "Director decision whether to reopen a frozen station",
        reason: "At least one station cannot be crossed without material structure change. Stop before mutating authority.",
      },
      E: {
        id: "fragmented-local-routing",
        title: "Abandon continuous-spine assumption; return to fragmented/local routing",
        reason: "The KC1 skeleton cannot be completed honestly under current frozen geometry.",
      },
      F: {
        id: "ks1-measurement",
        title: "Smallest measurement study to resolve the unknown",
        reason: "Representation is insufficient.",
      },
    };

    const report = {
      studyId: "MT1-KS1",
      title: "Keel/Bulkhead Crossing Feasibility",
      freezeId: "MT1-S5HR3R1",
      sourceS4aSha256: S4A_SHA256,
      participatesInAuthority: false,
      addsVehicleGeometry: false,
      mutatesKc1: false,
      professionsAssigned: [],
      kc1Closed: "B — CONTINUOUS_ROUTE_REQUIRES_DECLARED_CROSSINGS. Do not reopen.",
      method: {
        motion: "applyMachine Δt=0.01 vs all candidate OBBs in one loop; local Δt=0.002 refine around first contact, min separation, and fold windows. Feasibility screening, not a new authority certificate.",
        waist: "Certified DRIVE waist treated as OUTBOARD empty cells (xIn=" + WAIST_X_IN + "), not the US1 keel-centered diagnostic AABB.",
        sleeve: "ARCHITECTURE_HYPOTHESIS only. Not an authorized hole. No stress/manufacturing/profession claim.",
      },
      keel: serializeBox(keel),
      plates: plates.map((p) => ({ id: p.id, aabb: p.aabb ? serializeBox(p.aabb) : null })),
      stations,
      closureCheck: {
        result: allDoglegsClear
          ? "COMPLETE_DOGLEG_CLEAR"
          : anyApproachFail
            ? "EDGE_STRIP_CLEAR_BUT_APPROACH_FAILS"
            : anyDoglegUnknown
              ? "UNKNOWN"
              : "COMPLETE_DOGLEG_CLEAR",
        ks1OutcomeStands: allDoglegsClear && outcome.code === "A",
        stations: doglegClosures,
        waistXIn: WAIST_X_IN,
        stripOutboardAbsX: WAIST_X_IN - 0.005,
        deltaXStripToWaistXIn: 0.005,
        note: allDoglegsClear
          ? "Complete doglegs (outbound + wrap + inbound) are keepout-clear, fixed-clear, and motion-CLEAR at all three stations. Outcome A stands. Route was not widened. Strip max |x|=0.805 vs certified waist xIn=0.81."
          : anyApproachFail
            ? "Plate-edge strip remains clear, but at least one station's approach/return leg fails. That station's selected topology and the KS1 outcome were revised. Route was not widened to manufacture clearance."
            : "Dogleg representation or motion status is insufficient at a station.",
      },
      outcome,
      nextSlice: nextBy[outcome.code],
      svg: { long: "", top: "", stations: "" },
    };
    report.svg = { long: svgKs1Long(report), top: svgKs1Top(report), stations: svgKs1Stations(report) };
    return report;
  });
}
