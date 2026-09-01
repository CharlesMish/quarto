import { P } from "../../design/parameters";
import type { MachineRig } from "../../machine/types";
import { obbCorners, worldAabbUnion, type OBB } from "../../math/obb";
import type { V3 } from "../../math/vec";
import { classifySolid } from "./families";

export interface Xyz {
  x_lat: number;
  y_vert: number;
  z_long: number;
}

export const tagFact = <T extends object>(v: T): T & { tag: "GEOMETRY_FACT" } => ({ ...v, tag: "GEOMETRY_FACT" });

export function xyz(p: { x: number; y: number; z: number }): Xyz {
  return { x_lat: p.x, y_vert: p.y, z_long: p.z };
}

export function aabbCenter(min: V3, max: V3): Xyz {
  return { x_lat: (min.x + max.x) / 2, y_vert: (min.y + max.y) / 2, z_long: (min.z + max.z) / 2 };
}

export function unionCenter(obbs: OBB[]): Xyz | null {
  if (!obbs.length) return null;
  const u = worldAabbUnion(obbs);
  return aabbCenter(u.min, u.max);
}

function hull2d(points: Array<{ x: number; z: number }>): Array<{ x: number; z: number }> {
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const cross = (o: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: Array<{ x: number; z: number }> = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Array<{ x: number; z: number }> = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function shoelace(poly: Array<{ x: number; z: number }>): { area: number; cx: number; cz: number } {
  if (poly.length < 3) return { area: 0, cx: 0, cz: 0 };
  let a = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const j = (i + 1) % poly.length;
    const cross = poly[i].x * poly[j].z - poly[j].x * poly[i].z;
    a += cross;
    cx += (poly[i].x + poly[j].x) * cross;
    cz += (poly[i].z + poly[j].z) * cross;
  }
  const area = Math.abs(a) / 2;
  if (area < 1e-12) return { area: 0, cx: poly[0].x, cz: poly[0].z };
  return { area, cx: cx / (6 * (a > 0 ? 1 : -1) * (area * 2) / 2), cz: cz / (6 * (a === 0 ? 1 : a) ) };
}

/** Robust centroid: use signed area form. */
function shoelaceSafe(poly: Array<{ x: number; z: number }>): { area: number; cx: number; cz: number } {
  if (poly.length < 3) return { area: 0, cx: 0, cz: 0 };
  let twice = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const j = (i + 1) % poly.length;
    const cross = poly[i].x * poly[j].z - poly[j].x * poly[i].z;
    twice += cross;
    cx += (poly[i].x + poly[j].x) * cross;
    cz += (poly[i].z + poly[j].z) * cross;
  }
  const area = Math.abs(twice) / 2;
  if (area < 1e-12) {
    const mx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const mz = poly.reduce((s, p) => s + p.z, 0) / poly.length;
    return { area: 0, cx: mx, cz: mz };
  }
  return { area, cx: cx / (3 * twice), cz: cz / (3 * twice) };
}

export function projectedXz(obb: OBB): { area: number; cx: number; cz: number } {
  const pts = obbCorners(obb).map((p) => ({ x: p.x, z: p.z }));
  return shoelaceSafe(hull2d(pts));
}

export interface LeafProxy {
  id: string;
  side: "port" | "stbd";
  leaf: "inner" | "outer";
  station: "rear" | "front";
  center: Xyz;
  area: number;
}

export function extractBookLeaves(world: ReturnType<MachineRig["worldSolids"]>): LeafProxy[] {
  const groups: Array<{ id: string; side: "port" | "stbd"; leaf: "inner" | "outer"; station: "rear" | "front"; match: (n: string) => boolean }> = [
    { id: "RL_INNER", side: "port", leaf: "inner", station: "rear", match: (n) => n === "RL_INNER_ARMOR" },
    { id: "RL_OUTER", side: "port", leaf: "outer", station: "rear", match: (n) => n === "RL_OUTER_ARMOR" },
    { id: "RR_INNER", side: "stbd", leaf: "inner", station: "rear", match: (n) => n === "RR_INNER_ARMOR" },
    { id: "RR_OUTER", side: "stbd", leaf: "outer", station: "rear", match: (n) => n === "RR_OUTER_ARMOR" },
    { id: "FL_INNER", side: "port", leaf: "inner", station: "front", match: (n) => n.startsWith("FL_INNER_ARMOR") },
    { id: "FL_OUTER", side: "port", leaf: "outer", station: "front", match: (n) => n.startsWith("FL_OUTER_ARMOR") },
    { id: "FR_INNER", side: "stbd", leaf: "inner", station: "front", match: (n) => n.startsWith("FR_INNER_ARMOR") },
    { id: "FR_OUTER", side: "stbd", leaf: "outer", station: "front", match: (n) => n.startsWith("FR_OUTER_ARMOR") },
  ];
  const out: LeafProxy[] = [];
  for (const g of groups) {
    const boxes = world.filter((s) => s.role === "physical" && g.match(s.name));
    if (!boxes.length) continue;
    let area = 0;
    let ax = 0;
    let ay = 0;
    let az = 0;
    for (const s of boxes) {
      const pr = projectedXz(s.obb);
      area += pr.area;
      ax += pr.cx * pr.area;
      az += pr.cz * pr.area;
      ay += s.obb.center.y * pr.area;
    }
    const c =
      area > 1e-12
        ? { x_lat: ax / area, y_vert: ay / area, z_long: az / area }
        : xyz(boxes[0].obb.center);
    out.push({ id: g.id, side: g.side, leaf: g.leaf, station: g.station, center: c, area });
  }
  return out;
}

export function extractPlanform(
  world: ReturnType<MachineRig["worldSolids"]>,
  duplicateUnder = false,
): {
  PLANFORM_PROXY_SET: string[];
  rearPort: number;
  rearStbd: number;
  rearTotal: number;
  frontPort: number;
  frontStbd: number;
  frontTotal: number;
  combined: number;
  frontCentroid: Xyz;
  rearCentroid: Xyz;
  combinedCentroid: Xyz;
  handCalc: {
    rearInner: number;
    rearOuter: number;
    rearOneSide: number;
    frontInner: number;
    frontOuter: number;
    frontOneSide: number;
  };
  inflated: boolean;
} {
  const proxy = world.filter((s) => {
    if (s.role !== "physical") return false;
    if (/_(INNER|OUTER)_ARMOR/.test(s.name) && !s.name.includes("UNDER")) return true;
    if (duplicateUnder && /_(INNER|OUTER)_UNDER/.test(s.name)) return true;
    return false;
  });
  const areaOf = (pred: (n: string) => boolean) => {
    let a = 0;
    let ax = 0;
    let ay = 0;
    let az = 0;
    for (const s of proxy.filter((x) => pred(x.name))) {
      const pr = projectedXz(s.obb);
      a += pr.area;
      ax += pr.cx * pr.area;
      az += pr.cz * pr.area;
      ay += s.obb.center.y * pr.area;
    }
    return { area: a, c: a > 1e-12 ? { x_lat: ax / a, y_vert: ay / a, z_long: az / a } : { x_lat: 0, y_vert: 0, z_long: 0 } };
  };
  const rp = areaOf((n) => n.startsWith("RL_INNER_ARMOR") || n.startsWith("RL_OUTER_ARMOR") || (duplicateUnder && n.startsWith("RL_") && n.includes("UNDER")));
  const rs = areaOf((n) => n.startsWith("RR_INNER_ARMOR") || n.startsWith("RR_OUTER_ARMOR") || (duplicateUnder && n.startsWith("RR_") && n.includes("UNDER")));
  const fp = areaOf((n) => n.startsWith("FL_INNER_ARMOR") || n.startsWith("FL_OUTER_ARMOR") || (duplicateUnder && n.startsWith("FL_") && n.includes("UNDER")));
  const fs = areaOf((n) => n.startsWith("FR_INNER_ARMOR") || n.startsWith("FR_OUTER_ARMOR") || (duplicateUnder && n.startsWith("FR_") && n.includes("UNDER")));
  const rear = rp.area + rs.area;
  const front = fp.area + fs.area;
  const rearC =
    rear > 1e-12
      ? {
          x_lat: (rp.c.x_lat * rp.area + rs.c.x_lat * rs.area) / rear,
          y_vert: (rp.c.y_vert * rp.area + rs.c.y_vert * rs.area) / rear,
          z_long: (rp.c.z_long * rp.area + rs.c.z_long * rs.area) / rear,
        }
      : { x_lat: 0, y_vert: 0, z_long: 0 };
  const frontC =
    front > 1e-12
      ? {
          x_lat: (fp.c.x_lat * fp.area + fs.c.x_lat * fs.area) / front,
          y_vert: (fp.c.y_vert * fp.area + fs.c.y_vert * fs.area) / front,
          z_long: (fp.c.z_long * fp.area + fs.c.z_long * fs.area) / front,
        }
      : { x_lat: 0, y_vert: 0, z_long: 0 };
  const comb = rear + front;
  const combC =
    comb > 1e-12
      ? {
          x_lat: (rearC.x_lat * rear + frontC.x_lat * front) / comb,
          y_vert: (rearC.y_vert * rear + frontC.y_vert * front) / comb,
          z_long: (rearC.z_long * rear + frontC.z_long * front) / comb,
        }
      : { x_lat: 0, y_vert: 0, z_long: 0 };
  return {
    PLANFORM_PROXY_SET: proxy.map((s) => s.name).sort(),
    rearPort: rp.area,
    rearStbd: rs.area,
    rearTotal: rear,
    frontPort: fp.area,
    frontStbd: fs.area,
    frontTotal: front,
    combined: comb,
    frontCentroid: frontC,
    rearCentroid: rearC,
    combinedCentroid: combC,
    handCalc: {
      rearInner: P.rl.innerSpan * P.rl.chord,
      rearOuter: P.rl.outerSpan * P.rl.chord,
      rearOneSide: P.rl.innerSpan * P.rl.chord + P.rl.outerSpan * P.rl.chord,
      frontInner: P.fl.innerSpan * P.fl.chord,
      frontOuter: P.fl.outerSpan * P.fl.chord,
      frontOneSide: P.fl.innerSpan * P.fl.chord + P.fl.outerSpan * P.fl.chord,
    },
    inflated: duplicateUnder,
  };
}

export function extractDrive(world: ReturnType<MachineRig["worldSolids"]>): {
  envelope: Xyz | null;
  rails: Xyz | null;
  thrustAxis: { x_lat: number; y_vert: number; direction: "+Z_forward" };
} {
  const env = world.find((s) => s.name === "DRIVE_ENVELOPE");
  const rails = world.filter((s) => s.name.startsWith("DRIVE_RAIL_"));
  return {
    envelope: env ? xyz(env.obb.center) : null,
    rails: unionCenter(rails.map((s) => s.obb)),
    thrustAxis: { x_lat: P.drive.x, y_vert: P.drive.y, direction: "+Z_forward" },
  };
}

export function extractCockpit(world: ReturnType<MachineRig["worldSolids"]>): {
  center: Xyz;
  half: Xyz;
  faces: Record<"fwd" | "aft" | "up" | "down", Xyz>;
} {
  const box = P.keep.cockpit;
  const live = world.find((s) => s.name === "KEEP_COCKPIT" || s.name === "KEEP_COCKPIT_VIS");
  const center = live ? xyz(live.obb.center) : { x_lat: box.cx, y_vert: box.cy, z_long: box.cz };
  const half = live
    ? { x_lat: live.obb.half.x, y_vert: live.obb.half.y, z_long: live.obb.half.z }
    : { x_lat: box.hx, y_vert: box.hy, z_long: box.hz };
  return {
    center,
    half,
    faces: {
      fwd: { ...center, z_long: center.z_long + half.z_long },
      aft: { ...center, z_long: center.z_long - half.z_long },
      up: { ...center, y_vert: center.y_vert + half.y_vert },
      down: { ...center, y_vert: center.y_vert - half.y_vert },
    },
  };
}

export function extractWaist(world: ReturnType<MachineRig["worldSolids"]>): {
  port: { center: Xyz; half: Xyz };
  stbd: { center: Xyz; half: Xyz };
} {
  const pick = (name: string) => world.find((s) => s.name === name || s.name === `${name}_VIS`);
  const portS = pick("DRIVE_WAIST_PORT");
  const stbdS = pick("DRIVE_WAIST_STBD");
  const fallback = (sx: number) => ({
    center: { x_lat: sx * 1.5243817628306766, y_vert: 1.475, z_long: -0.29 },
    half: { x_lat: 0.7143817628306766, y_vert: 0.875, z_long: 1.34 },
  });
  const from = (s: (typeof world)[number] | undefined, fb: ReturnType<typeof fallback>) =>
    s
      ? {
          center: xyz(s.obb.center),
          half: { x_lat: s.obb.half.x, y_vert: s.obb.half.y, z_long: s.obb.half.z },
        }
      : fb;
  return { port: from(portS, fallback(-1)), stbd: from(stbdS, fallback(1)) };
}

export function extractGroupCenter(world: ReturnType<MachineRig["worldSolids"]>, family: "F3_REAR_FIXED" | "F4_FRONT_CARRY_FIXED" | "F5_CENTRAL_STRUCTURE" | "F7_DRIVE_FIXED"): Xyz | null {
  const boxes = world.filter((s) => classifySolid(s).family === family && classifySolid(s).kind === "proxy").map((s) => s.obb);
  return unionCenter(boxes);
}

export function physicalEnvelope(world: ReturnType<MachineRig["worldSolids"]>): { min: V3; max: V3 } {
  return worldAabbUnion(world.filter((s) => s.role === "physical").map((s) => s.obb));
}

export function envelopeVolume(world: ReturnType<MachineRig["worldSolids"]>): number {
  let v = 0;
  for (const s of world.filter((s) => s.role === "physical")) {
    v += 8 * s.obb.half.x * s.obb.half.y * s.obb.half.z;
  }
  return v;
}

void shoelace;
