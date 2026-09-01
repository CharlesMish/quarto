import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { P } from "../design/parameters";
import { STBD } from "../machine/side";
import { obbCorners, obbOverlaps, obbSeparation, obbWorldAabb, type OBB } from "../math/obb";
import type { MachineRig } from "../machine/types";

export interface DriveReadiness {
  rearBookReady: boolean;
  rearNestReady: boolean;
  rearDriveStructureReady: boolean;
  frontBookReady: boolean;
  frontNestReady: boolean;
  frontPassivePickupReady: boolean;
  frontDriveStructureReady: boolean;
  rearStbdBookReady: boolean;
  rearStbdNestReady: boolean;
  rearStbdDriveStructureReady: boolean;
  frontStbdBookReady: boolean;
  frontStbdNestReady: boolean;
  frontStbdPassivePickupReady: boolean;
  frontStbdDriveStructureReady: boolean;
  portRearReady: boolean;
  portFrontReady: boolean;
  stbdRearReady: boolean;
  stbdFrontReady: boolean;
  driveStructuralReady: boolean;
  detail: string;
}

export interface ReadinessOverride {
  rearBookReady?: boolean;
  rearNestReady?: boolean;
  frontBookReady?: boolean;
  frontNestReady?: boolean;
  frontPassivePickupReady?: boolean;
  rearStbdBookReady?: boolean;
  rearStbdNestReady?: boolean;
  frontStbdBookReady?: boolean;
  frontStbdNestReady?: boolean;
  frontStbdPassivePickupReady?: boolean;
}

export interface MachineAuditOptions {
  readiness?: ReadinessOverride;
  injectWaistOccupant?: boolean;
  bypassDriveGate?: boolean;
  wrongFoldSign?: boolean;
}

export function asAuditOptions(input?: ReadinessOverride | MachineAuditOptions): MachineAuditOptions {
  if (!input) return {};
  if ("readiness" in input || "injectWaistOccupant" in input || "bypassDriveGate" in input || "wrongFoldSign" in input) {
    return input as MachineAuditOptions;
  }
  return { readiness: input as ReadinessOverride };
}

function aabbInSpace(box: OBB, inv: Matrix): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of obbCorners(box)) {
    const p = Vector3.TransformCoordinates(new Vector3(c.x, c.y, c.z), inv);
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return { min, max };
}

function evalRearLatchReady(
  world: Array<{ name: string; family: string; obb: OBB; node: { parent: { parent?: { getWorldMatrix?: () => Matrix } | null } | null } }>,
  families = { keeper: "latch-keeper", hook: "latch-hook", jaw: "RL_LATCH_JAW", cheek: "RL_LATCH_CHEEK" },
): boolean {
  const keeper = world.find((s) => s.family === families.keeper);
  const hooks = world.filter((s) => s.family === families.hook);
  const jaw = world.find((s) => s.name === families.jaw);
  if (!keeper || hooks.length === 0 || !jaw) return false;
  for (const h of hooks) {
    if (obbOverlaps(keeper.obb, h.obb) || obbSeparation(keeper.obb, h.obb) <= 0) return false;
  }
  const latchNode = jaw.node.parent as { parent: { getWorldMatrix: () => Matrix } | null } | null;
  const spar = latchNode?.parent ?? null;
  if (!spar?.getWorldMatrix) return false;
  const inv = spar.getWorldMatrix().clone().invert();
  const k = aabbInSpace(keeper.obb, inv);
  const j = aabbInSpace(jaw.obb, inv);
  const cheeks = world.filter((s) => s.name.startsWith(families.cheek)).map((c) => aabbInSpace(c.obb, inv));
  if (cheeks.length < 2) return false;
  const ranked = [...cheeks].sort((a, b) => a.min.z + a.max.z - (b.min.z + b.max.z));
  const xMin = Math.max(...cheeks.map((c) => c.min.x));
  const xMax = Math.min(...cheeks.map((c) => c.max.x));
  const inThroat =
    k.min.z >= ranked[0].max.z - 1e-4 &&
    k.max.z <= ranked[1].min.z + 1e-4 &&
    k.min.x >= xMin - 1e-4 &&
    k.max.x <= xMax + 1e-4;
  const jawBehind = k.min.y > j.max.y + 1e-4;
  return inThroat && jawBehind;
}

function evalRearNestReady(
  world: Array<{ family: string; obb: OBB }>,
  spec: { pin: string; rec: string; box: { x: number; y: number; z: number; outer: readonly number[]; bore: readonly number[] } } = {
    pin: "nest-pin",
    rec: "nest-receiver",
    box: P.nestReceiver,
  },
): boolean {
  const pin = world.find((s) => s.family === spec.pin);
  const recs = world.filter((s) => s.family === spec.rec);
  if (!pin || recs.length === 0) return false;
  for (const r of recs) {
    if (obbOverlaps(pin.obb, r.obb)) return false;
  }
  const p = obbWorldAabb(pin.obb);
  const bore = {
    minX: spec.box.x - spec.box.bore[0] / 2,
    maxX: spec.box.x + spec.box.bore[0] / 2,
    minY: spec.box.y - spec.box.bore[1] / 2,
    maxY: spec.box.y + spec.box.bore[1] / 2,
    minZ: spec.box.z - spec.box.outer[2] / 2,
    maxZ: spec.box.z + spec.box.outer[2] / 2,
  };
  const inBore =
    p.min.x >= bore.minX - 1e-4 &&
    p.max.x <= bore.maxX + 1e-4 &&
    p.min.y >= bore.minY - 1e-4 &&
    p.max.y <= bore.maxY + 1e-4;
  const through = p.min.z < bore.minZ - 1e-4 && p.max.z > bore.maxZ + 1e-4;
  return inBore && through;
}

function evalFrontBookReady(
  world: Array<{ name: string; family: string; obb: OBB; node: { parent: { parent?: { getWorldMatrix?: () => Matrix } | null } | null } }>,
  families = { pin: "fl-book-pin", rec: "fl-book-receiver" },
): boolean {
  const pin = world.find((s) => s.family === families.pin);
  const recs = world.filter((s) => s.family === families.rec);
  if (!pin || recs.length === 0) return false;
  for (const r of recs) {
    if (obbOverlaps(pin.obb, r.obb)) return false;
  }
  const hinge = recs[0]?.node.parent;
  const spar = hinge && "parent" in hinge ? hinge.parent : null;
  const wm = spar && spar.getWorldMatrix ? spar.getWorldMatrix() : null;
  if (!wm) return false;
  const inv = wm.clone().invert();
  const p = aabbInSpace(pin.obb, inv);
  const frames = recs.map((r) => aabbInSpace(r.obb, inv));
  const yMin = Math.min(...frames.map((f) => f.min.y));
  const yMax = Math.max(...frames.map((f) => f.max.y));
  const [bx, bz] = P.fl.bookBore;
  const cx = (Math.min(...frames.map((f) => f.min.x)) + Math.max(...frames.map((f) => f.max.x))) / 2;
  const cz = (Math.min(...frames.map((f) => f.min.z)) + Math.max(...frames.map((f) => f.max.z))) / 2;
  const inBore =
    p.min.x >= cx - bx / 2 - 1e-4 &&
    p.max.x <= cx + bx / 2 + 1e-4 &&
    p.min.z >= cz - bz / 2 - 1e-4 &&
    p.max.z <= cz + bz / 2 + 1e-4;
  const through = p.min.y < yMin - 1e-4 && p.max.y > yMax + 1e-4;
  return inBore && through;
}

function evalFrontNestReady(
  world: Array<{ family: string; obb: OBB }>,
  spec: { pin: string; rec: string; box: { x: number; y: number; z: number; outer: readonly number[]; bore: readonly number[] } } = {
    pin: "fl-nest-pin",
    rec: "fl-nest-receiver",
    box: P.fl.nestReceiver,
  },
): boolean {
  const pin = world.find((s) => s.family === spec.pin);
  const recs = world.filter((s) => s.family === spec.rec);
  if (!pin || recs.length === 0) return false;
  for (const r of recs) {
    if (obbOverlaps(pin.obb, r.obb)) return false;
  }
  const p = obbWorldAabb(pin.obb);
  const nr = spec.box;
  const inBore =
    p.min.y >= nr.y - nr.bore[0] / 2 - 1e-4 &&
    p.max.y <= nr.y + nr.bore[0] / 2 + 1e-4 &&
    p.min.z >= nr.z - nr.bore[1] / 2 - 1e-4 &&
    p.max.z <= nr.z + nr.bore[1] / 2 + 1e-4;
  const through = p.min.x < nr.x - nr.outer[0] / 2 - 1e-4 && p.max.x > nr.x + nr.outer[0] / 2 + 1e-4;
  return inBore && through;
}

function evalFrontCatchReady(
  world: Array<{ name: string; family: string; obb: OBB; node: { parent: { getWorldMatrix?: () => Matrix } | null } }>,
  families = { keeper: "fl-catch-keeper", throat: "fl-catch-throat", inboard: 1 as 1 | -1 },
): boolean {
  const keeper = world.find((s) => s.family === families.keeper);
  const throat = world.filter((s) => s.family === families.throat);
  if (!keeper || throat.length < 3) return false;
  for (const t of throat) {
    if (obbOverlaps(keeper.obb, t.obb)) return false;
  }
  const root = throat[0]?.node.parent;
  if (!root?.getWorldMatrix) return false;
  const inv = root.getWorldMatrix().clone().invert();
  const k = aabbInSpace(keeper.obb, inv);
  const cheeks = throat.filter((s) => s.name.includes("CHEEK")).map((s) => aabbInSpace(s.obb, inv));
  const back = throat.find((s) => s.name.includes("BACK"));
  if (cheeks.length < 2 || !back) return false;
  const ranked = [...cheeks].sort((a, b) => a.min.z - b.min.z);
  const inZ = k.min.z >= ranked[0].max.z - 2e-3 && k.max.z <= ranked[1].min.z + 2e-3;
  const yMin = Math.max(...cheeks.map((c) => c.min.y));
  const yMax = Math.min(...cheeks.map((c) => c.max.y));
  const inY = k.min.y >= yMin - 2e-3 && k.max.y <= yMax + 2e-3;
  const b = aabbInSpace(back.obb, inv);
  const inX =
    families.inboard > 0
      ? k.max.x <= b.min.x + 2e-3 && k.min.x >= Math.min(...cheeks.map((c) => c.min.x)) - 2e-3
      : k.min.x >= b.max.x - 2e-3 && k.max.x <= Math.max(...cheeks.map((c) => c.max.x)) + 2e-3;
  return inZ && inY && inX;
}

export function evaluateDriveReadiness(rig: MachineRig, override?: ReadinessOverride): DriveReadiness {
  const world = rig.worldSolids();
  const rearBookReady = override?.rearBookReady ?? evalRearLatchReady(world);
  const rearNestReady = override?.rearNestReady ?? evalRearNestReady(world);
  const frontBookReady = override?.frontBookReady ?? evalFrontBookReady(world);
  const frontNestReady = override?.frontNestReady ?? evalFrontNestReady(world);
  const frontPassivePickupReady = override?.frontPassivePickupReady ?? evalFrontCatchReady(world);
  const hasStbdRear = world.some((s) => s.family === "rr-latch-keeper" || s.family === "rr-nest-pin");
  const hasStbdFront = world.some((s) => s.family === "fr-book-pin" || s.family === "fr-nest-pin");
  const rearStbdBookReady =
    override?.rearStbdBookReady ??
    (hasStbdRear
      ? evalRearLatchReady(world, {
          keeper: "rr-latch-keeper",
          hook: "rr-latch-hook",
          jaw: "RR_LATCH_JAW",
          cheek: "RR_LATCH_CHEEK",
        })
      : true);
  const rearStbdNestReady =
    override?.rearStbdNestReady ??
    (hasStbdRear
      ? evalRearNestReady(world, { pin: "rr-nest-pin", rec: "rr-nest-receiver", box: STBD.nestReceiver })
      : true);
  const frontStbdBookReady =
    override?.frontStbdBookReady ??
    (hasStbdFront ? evalFrontBookReady(world, { pin: "fr-book-pin", rec: "fr-book-receiver" }) : true);
  const frontStbdNestReady =
    override?.frontStbdNestReady ??
    (hasStbdFront
      ? evalFrontNestReady(world, { pin: "fr-nest-pin", rec: "fr-nest-receiver", box: STBD.flNestReceiver })
      : true);
  const frontStbdPassivePickupReady =
    override?.frontStbdPassivePickupReady ??
    (hasStbdFront
      ? evalFrontCatchReady(world, { keeper: "fr-catch-keeper", throat: "fr-catch-throat", inboard: -1 })
      : true);
  const portRearReady = rearBookReady && rearNestReady;
  const portFrontReady = frontBookReady && frontNestReady && frontPassivePickupReady;
  const stbdRearReady = rearStbdBookReady && rearStbdNestReady;
  const stbdFrontReady = frontStbdBookReady && frontStbdNestReady && frontStbdPassivePickupReady;
  const rearDriveStructureReady = portRearReady;
  const frontDriveStructureReady = portFrontReady;
  const driveStructuralReady = portRearReady && portFrontReady && stbdRearReady && stbdFrontReady;
  return {
    rearBookReady,
    rearNestReady,
    rearDriveStructureReady,
    frontBookReady,
    frontNestReady,
    frontPassivePickupReady,
    frontDriveStructureReady,
    rearStbdBookReady,
    rearStbdNestReady,
    rearStbdDriveStructureReady: stbdRearReady,
    frontStbdBookReady,
    frontStbdNestReady,
    frontStbdPassivePickupReady,
    frontStbdDriveStructureReady: stbdFrontReady,
    portRearReady,
    portFrontReady,
    stbdRearReady,
    stbdFrontReady,
    driveStructuralReady,
    detail: `pR=${rearBookReady}/${rearNestReady} pF=${frontBookReady}/${frontNestReady}/${frontPassivePickupReady} sR=${rearStbdBookReady}/${rearStbdNestReady} sF=${frontStbdBookReady}/${frontStbdNestReady}/${frontStbdPassivePickupReady}`,
  };
}
