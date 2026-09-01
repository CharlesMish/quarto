import type { MachineRig } from "../../machine/types";
import { FAMILY_IDS, LATERAL_TOL, MACHINE_HEIGHT_M, type FamilyId } from "./constants";
import { extractBookLeaves, extractCockpit, extractDrive, extractGroupCenter, extractWaist, type Xyz } from "./geometry";

export interface MassPoint {
  id: string;
  family: FamilyId;
  mass: number;
  p: Xyz;
}

export interface CgResult {
  tag: "DERIVED_ESTIMATE";
  totalRmu: number;
  x_lat: number;
  y_vert: number;
  z_long: number;
  verticalThrustArm: number;
  verticalThrustArmNorm: number;
}

export type LeafSplit = "area" | "half";
export type CockpitFace = "center" | "fwd" | "aft" | "up" | "down";
export type WaistFace = "center" | "fwd" | "aft" | "up" | "down";

export interface PlacementOpts {
  leafSplit?: LeafSplit;
  cockpitFace?: CockpitFace;
  waistFace?: WaistFace;
  portBookScale?: number;
  stbdBookScale?: number;
  freezeDriveAt?: Xyz | null;
}

export function placePoints(
  world: ReturnType<MachineRig["worldSolids"]>,
  masses: Record<FamilyId, number>,
  opts: PlacementOpts = {},
): MassPoint[] {
  const leafSplit = opts.leafSplit ?? "area";
  const portScale = opts.portBookScale ?? 1;
  const stbdScale = opts.stbdBookScale ?? 1;
  const leaves = extractBookLeaves(world);
  const drive = extractDrive(world);
  const cockpit = extractCockpit(world);
  const waist = extractWaist(world);
  const points: MassPoint[] = [];

  const addBooks = (station: "rear" | "front", family: FamilyId, total: number) => {
    const set = leaves.filter((l) => l.station === station);
    for (const side of ["port", "stbd"] as const) {
      const sideLeaves = set.filter((l) => l.side === side);
      const sideMass = (total / 2) * (side === "port" ? portScale : stbdScale);
      const inner = sideLeaves.find((l) => l.leaf === "inner");
      const outer = sideLeaves.find((l) => l.leaf === "outer");
      if (!inner || !outer) continue;
      const wInner = leafSplit === "half" ? 0.5 : inner.area / (inner.area + outer.area);
      points.push({ id: `${inner.id}`, family, mass: sideMass * wInner, p: inner.center });
      points.push({ id: `${outer.id}`, family, mass: sideMass * (1 - wInner), p: outer.center });
    }
  };
  addBooks("rear", "F1_REAR_BOOKS", masses.F1_REAR_BOOKS);
  addBooks("front", "F2_FRONT_BOOKS", masses.F2_FRONT_BOOKS);

  const f3 = extractGroupCenter(world, "F3_REAR_FIXED");
  const f4 = extractGroupCenter(world, "F4_FRONT_CARRY_FIXED");
  const f5 = extractGroupCenter(world, "F5_CENTRAL_STRUCTURE");
  const f7 = extractGroupCenter(world, "F7_DRIVE_FIXED");
  if (f3) points.push({ id: "REAR_FIXED", family: "F3_REAR_FIXED", mass: masses.F3_REAR_FIXED, p: f3 });
  if (f4) points.push({ id: "FRONT_CARRY_FIXED", family: "F4_FRONT_CARRY_FIXED", mass: masses.F4_FRONT_CARRY_FIXED, p: f4 });
  if (f5) points.push({ id: "CENTRAL_STRUCTURE", family: "F5_CENTRAL_STRUCTURE", mass: masses.F5_CENTRAL_STRUCTURE, p: f5 });
  if (f7) points.push({ id: "DRIVE_FIXED", family: "F7_DRIVE_FIXED", mass: masses.F7_DRIVE_FIXED, p: f7 });

  const driveP = opts.freezeDriveAt ?? drive.envelope;
  if (driveP) points.push({ id: "DRIVE_ENVELOPE", family: "F6_DRIVE_MOVING", mass: masses.F6_DRIVE_MOVING, p: driveP });

  const cockP = opts.cockpitFace && opts.cockpitFace !== "center" ? cockpit.faces[opts.cockpitFace] : cockpit.center;
  points.push({ id: "COCKPIT_ALLOWANCE", family: "F8_COCKPIT_ALLOWANCE", mass: masses.F8_COCKPIT_ALLOWANCE, p: cockP });

  const shiftWaist = (c: typeof waist.port, face: WaistFace) => {
    if (face === "fwd") return { ...c.center, z_long: c.center.z_long + c.half.z_long };
    if (face === "aft") return { ...c.center, z_long: c.center.z_long - c.half.z_long };
    if (face === "up") return { ...c.center, y_vert: c.center.y_vert + c.half.y_vert };
    if (face === "down") return { ...c.center, y_vert: c.center.y_vert - c.half.y_vert };
    return c.center;
  };
  const wf = opts.waistFace ?? "center";
  points.push({ id: "WAIST_PORT", family: "F9_WAIST_SYSTEMS_ALLOWANCE", mass: masses.F9_WAIST_SYSTEMS_ALLOWANCE / 2, p: shiftWaist(waist.port, wf) });
  points.push({ id: "WAIST_STBD", family: "F9_WAIST_SYSTEMS_ALLOWANCE", mass: masses.F9_WAIST_SYSTEMS_ALLOWANCE / 2, p: shiftWaist(waist.stbd, wf) });

  return points;
}

export function centerOfMass(points: MassPoint[], thrustY: number): CgResult {
  let m = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    m += p.mass;
    x += p.mass * p.p.x_lat;
    y += p.mass * p.p.y_vert;
    z += p.mass * p.p.z_long;
  }
  const cg = {
    tag: "DERIVED_ESTIMATE" as const,
    totalRmu: m,
    x_lat: m ? x / m : 0,
    y_vert: m ? y / m : 0,
    z_long: m ? z / m : 0,
    verticalThrustArm: 0,
    verticalThrustArmNorm: 0,
  };
  cg.verticalThrustArm = cg.y_vert - thrustY;
  cg.verticalThrustArmNorm = cg.verticalThrustArm / MACHINE_HEIGHT_M;
  return cg;
}

export function lateralOk(cg: CgResult): boolean {
  return Math.abs(cg.x_lat) <= LATERAL_TOL;
}

export function emptyMasses(): Record<FamilyId, number> {
  const o = {} as Record<FamilyId, number>;
  for (const id of FAMILY_IDS) o[id] = 0;
  return o;
}
