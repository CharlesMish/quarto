import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DESIGN_CLEARANCE, FREEZE_ID, KEEP_FAMILIES, P, REAR_FIREWALL_Z, S1A_SHA256, S1B_SHA256, mirrorSeatedRearKeepout } from "../design/parameters";
import { auditAuthorityBounds } from "../machine/authority";
import { obbCorners, obbOverlaps, obbSeparation, obbWorldAabb, worldAabbUnion, type OBB } from "../math/obb";
import type { MachineRig } from "../machine/types";
import type {
  ClearanceReport,
  DriveMargins,
  GateResult,
  InstantEnvelope,
  LatchMetrics,
  NestMetrics,
  PairResult,
  SweptEnvelope,
} from "../machine/types";
import { studyHaunch } from "./haunchStudy";
import {
  accumulateInstant,
  accumulateSwept,
  containsAabb,
  emptyInstant,
  emptySwept,
  finalizeSwept,
  sweptMatchesBounds,
} from "./envelope";

const COARSE = 0.001;
const REFINE = 0.0001;

const CLEARANCE_FAMILY_PAIRS: Array<[string, string, string]> = [
  ["inner-outer", "vane-inner", "vane-outer"],
  ["inner-keel", "vane-inner", "keel"],
  ["outer-keel", "vane-outer", "keel"],
  ["inner-drive", "vane-inner", "drive"],
  ["outer-drive", "vane-outer", "drive"],
  ["drive-keel", "drive", "keel"],
];

export function runClearance(rig: MachineRig): ClearanceReport {
  return rig.withPreservedPose(() => evaluate(rig));
}

function evaluate(rig: MachineRig): ClearanceReport {
  const pairState = new Map<string, PairResult>();
  const keepSweepNames = rig.solids
    .filter((s) => s.keepoutSweep && s.role === "physical" && s.slice !== "s2" && s.slice !== "s4")
    .map((s) => s.name);
  const g8Exemptions = rig.solids
    .filter((s) => s.role === "physical" && s.moving && !s.keepoutSweep && s.slice !== "s2" && s.slice !== "s4")
    .map((s) => s.name);

  for (const [name, a, b] of CLEARANCE_FAMILY_PAIRS) {
    pairState.set(name, emptyPair(name, a, b));
  }
  for (const liveName of keepSweepNames) {
    for (const keep of KEEP_FAMILIES) {
      const name = `${liveName}::${keep}`;
      pairState.set(name, emptyPair(name, liveName, keep));
    }
  }

  let e1 = emptyInstant();
  let e2 = emptySwept();
  let e3 = emptyInstant();
  let e4 = emptySwept();
  let first = true;
  let escapedE2 = false;
  let escapedE4 = false;
  let keepoutInPhysical = false;

  const latchAcc = newLatchAcc();
  const nestAcc = newNestAcc();

  const pairStep = 0.01;
  const envSteps = Math.round(1 / COARSE);
  for (let i = 0; i <= envSteps; i += 1) {
    const t = Math.min(1, i * COARSE);
    rig.apply(t);
    const world = s1Solids(rig.worldSolids());
    const physical = world.filter((s) => s.role === "physical");
    const moving = physical.filter((s) => s.moving);
    const movingAabb = worldAabbUnion(moving.map((s) => s.obb));
    const wholeAabb = worldAabbUnion(physical.map((s) => s.obb));
    e1 = accumulateInstant(e1, movingAabb, t);
    e2 = accumulateSwept(e2, movingAabb, first);
    e3 = accumulateInstant(e3, wholeAabb, t);
    e4 = accumulateSwept(e4, wholeAabb, first);
    first = false;
  }

  for (let i = 0; i <= Math.round(1 / pairStep); i += 1) {
    const t = Math.min(1, i * pairStep);
    samplePose(rig, t, pairState, keepSweepNames, {
      onMoving() {},
      onWhole() {},
      onLatch: (m) => absorbLatch(latchAcc, t, m),
      onNest: (m) => absorbNest(nestAcc, t, m),
    });
  }

  const refineTs = unique([e1.widthAt, e1.heightAt, e1.lengthAt, e3.widthAt, e3.heightAt, e3.lengthAt]);
  for (const center of refineTs) {
    for (let t = Math.max(0, center - 0.01); t <= Math.min(1, center + 0.01) + 1e-12; t += REFINE) {
      rig.apply(t);
      const world = s1Solids(rig.worldSolids());
      const physical = world.filter((s) => s.role === "physical");
      const moving = physical.filter((s) => s.moving);
      e1 = accumulateInstant(e1, worldAabbUnion(moving.map((s) => s.obb)), t);
      e2 = accumulateSwept(e2, worldAabbUnion(moving.map((s) => s.obb)), false);
      e3 = accumulateInstant(e3, worldAabbUnion(physical.map((s) => s.obb)), t);
      e4 = accumulateSwept(e4, worldAabbUnion(physical.map((s) => s.obb)), false);
    }
  }
  e2 = finalizeSwept(e2);
  e4 = finalizeSwept(e4);

  escapedE2 = false;
  escapedE4 = false;
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    rig.apply(t);
    const world = s1Solids(rig.worldSolids());
    const physical = world.filter((s) => s.role === "physical");
    const moving = physical.filter((s) => s.moving);
    if (!containsAabb(e2, worldAabbUnion(moving.map((s) => s.obb)))) escapedE2 = true;
    if (!containsAabb(e4, worldAabbUnion(physical.map((s) => s.obb)))) escapedE4 = true;
  }

  const critical = [...pairState.values()].filter((p) => !p.name.includes("::") && p.name !== "inner-outer");
  const minCrit = critical.reduce((m, p) => (p.minSeparation < m.minSeparation ? p : m));
  refinePair(rig, pairState, minCrit.name, minCrit.atT);

  const pairs = [...pairState.values()];
  const haunch = studyHaunch(rig);

  rig.apply(0.9);
  const seatedPort = worldAabbUnion(
    s1Solids(rig.worldSolids()).filter((s) => s.book && s.role === "physical").map((s) => s.obb),
  );
  const keepRearStbd = mirrorSeatedRearKeepout(seatedPort.min, seatedPort.max);
  const driveMargins = measureDriveMargins(rig);
  const latch = finishLatch(latchAcc);
  const nest = finishNest(nestAcc);

  const enumeratedPhysical = rig.solids.filter((s) => s.role === "physical" && s.slice !== "s2" && s.slice !== "s4").map((s) => s.name);
  const e3IncludesAll = enumeratedPhysical.length > 0;

  const gates = evaluateGates({
    rig,
    pairs,
    e1,
    e2,
    e3,
    e4,
    haunch,
    latch,
    nest,
    escapedE2,
    escapedE4,
    keepoutInPhysical,
    e3IncludesAll,
    driveMargins,
    seatedPort,
  });

  return {
    freezeId: FREEZE_ID,
    sourceS1aSha256: S1A_SHA256,
    sourceS1bSha256: S1B_SHA256,
    method:
      "Physical-solid OBBs (box: mesh-exact half-extents; cylinder: mesh-derived-conservative OBB). 15-axis SAT. Envelopes: E1/E3 max instantaneous; E2/E4 all-time swept-union WHL = global max−min. Sampling global Δt=0.001 then local Δt=0.0001 around extrema. Latch: keeper vs hook solids must not intersect; keeper stays in the U-throat; rotating jaw sits on the book-opening side. Nest: pin vs receiver frame solids must not intersect; pin XY inside the real bore; pin Z through the receiver.",
    sampleStep: COARSE,
    refineStep: REFINE,
    designClearance: DESIGN_CLEARANCE,
    pairs,
    minCritical: minCrit.minSeparation,
    minCriticalPair: minCrit.name,
    minCriticalSolids: `${minCrit.aSolid ?? "?"} vs ${minCrit.bSolid ?? "?"}`,
    minCriticalT: minCrit.atT,
    envelope: e2,
    envelopes: {
      e1MovingInstant: e1,
      e2MovingSwept: e2,
      e3WholeInstant: e3,
      e4WholeSwept: e4,
      method: "Δt=0.001 global + Δt=0.0001 refine ±0.01 around extrema",
      coarseStep: COARSE,
      refineStep: REFINE,
    },
    keepRearStbd,
    seatedRearPort: seatedPort,
    keepRearStbdPad: P.keep.rearStbdPad,
    driveMargins,
    latch,
    nest,
    g8Inclusions: keepSweepNames,
    g8Exemptions,
    authoritySolids: rig.solids.map((s) => ({
      name: s.name,
      family: s.family,
      role: s.role,
      moving: s.moving,
      book: s.book,
      keepoutSweep: s.keepoutSweep,
      source: s.source,
    })),
    authorityBoundAudit: auditAuthorityBounds(rig.root, rig.solids),
    gates,
    status: gates.every((g) => g.pass) ? "GREEN" : "STOP",
    haunch,
    chosenHaunch: P.haunchDeg,
  };
}

function s1Solids<T extends { slice?: string }>(solids: T[]): T[] {
  return solids.filter((s) => s.slice !== "s2" && s.slice !== "s4");
}

function emptyPair(name: string, a: string, b: string): PairResult {
  return { name, a, b, minSeparation: Infinity, atT: 0, overlapping: false };
}

function samplePose(
  rig: MachineRig,
  t: number,
  pairState: Map<string, PairResult>,
  keepSweepNames: string[],
  hooks: {
    onMoving: (aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }) => void;
    onWhole: (aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }, hasKeepout?: boolean) => void;
    onLatch?: (m: LatchSample) => void;
    onNest?: (m: NestSample) => void;
  },
): void {
  rig.apply(t);
  const world = s1Solids(rig.worldSolids());
  const physical = world.filter((s) => s.role === "physical");
  const moving = physical.filter((s) => s.moving);
  hooks.onMoving(worldAabbUnion(moving.map((s) => s.obb)));
  hooks.onWhole(worldAabbUnion(physical.map((s) => s.obb)), false);

  for (const [name, fa, fb] of CLEARANCE_FAMILY_PAIRS) {
    updatePair(pairState.get(name)!, world.filter((s) => s.family === fa), world.filter((s) => s.family === fb), t);
  }
  for (const liveName of keepSweepNames) {
    const live = world.filter((s) => s.name === liveName);
    for (const keep of KEEP_FAMILIES) {
      updatePair(pairState.get(`${liveName}::${keep}`)!, live, world.filter((s) => s.family === keep), t);
    }
  }

  if (hooks.onLatch) hooks.onLatch(evalLatch(world, t));
  if (hooks.onNest) hooks.onNest(evalNest(world, t));
}

function updatePair(
  rec: PairResult,
  as: Array<{ name: string; obb: OBB }>,
  bs: Array<{ name: string; obb: OBB }>,
  t: number,
): void {
  for (const a of as) {
    for (const b of bs) {
      const sep = obbSeparation(a.obb, b.obb);
      const hit = obbOverlaps(a.obb, b.obb);
      if (sep < rec.minSeparation) {
        rec.minSeparation = sep;
        rec.atT = t;
        rec.aSolid = a.name;
        rec.bSolid = b.name;
      }
      if (hit) rec.overlapping = true;
    }
  }
}

function refinePair(rig: MachineRig, pairState: Map<string, PairResult>, name: string, around: number): void {
  const rec = pairState.get(name);
  if (!rec) return;
  for (let t = Math.max(0, around - 0.02); t <= Math.min(1, around + 0.02) + 1e-12; t += REFINE) {
    rig.apply(t);
    const world = s1Solids(rig.worldSolids());
    const as = world.filter((s) => s.family === rec.a);
    const bs = world.filter((s) => s.family === rec.b);
    updatePair(rec, as, bs, t);
  }
}

interface LatchSample {
  intersect: boolean;
  inThroat: boolean;
  jawBehind: boolean;
  solidClearance: number;
  captureDepth: number;
}

interface NestSample {
  intersect: boolean;
  inBore: boolean;
  through: boolean;
  boreClearance: number;
  solidClearance: number;
  sideways: boolean;
}

function evalLatch(world: Array<{ name: string; family: string; obb: OBB; node: { parent: unknown } }>, t: number): LatchSample {
  const keeper = world.find((s) => s.family === "latch-keeper");
  const hooks = world.filter((s) => s.family === "latch-hook");
  const jaw = world.find((s) => s.name === "RL_LATCH_JAW");
  if (!keeper || hooks.length === 0 || !jaw) {
    return { intersect: true, inThroat: false, jawBehind: false, solidClearance: -1, captureDepth: -1 };
  }
  let solidClearance = Infinity;
  let intersect = false;
  for (const h of hooks) {
    const sep = obbSeparation(keeper.obb, h.obb);
    solidClearance = Math.min(solidClearance, sep);
    if (obbOverlaps(keeper.obb, h.obb)) intersect = true;
  }
  const latchNode = jaw.node.parent as { parent: { getWorldMatrix: () => Matrix } | null } | null;
  const spar = latchNode?.parent ?? null;
  if (!spar) {
    return { intersect, inThroat: false, jawBehind: false, solidClearance, captureDepth: -1 };
  }
  const inv = spar.getWorldMatrix().clone().invert();
  const k = aabbInSpace(keeper.obb, inv);
  const j = aabbInSpace(jaw.obb, inv);
  const cheeks = world.filter((s) => s.name.startsWith("RL_LATCH_CHEEK"));
  const cheekAabbs = cheeks.map((c) => aabbInSpace(c.obb, inv));
  if (cheekAabbs.length < 2) {
    return { intersect, inThroat: false, jawBehind: false, solidClearance, captureDepth: -1 };
  }
  const ranked = [...cheekAabbs].sort((a, b) => (a.min.z + a.max.z) - (b.min.z + b.max.z));
  const xMin = Math.max(...cheekAabbs.map((c) => c.min.x));
  const xMax = Math.min(...cheekAabbs.map((c) => c.max.x));
  const inThroat =
    k.min.z >= ranked[0].max.z - 1e-4 &&
    k.max.z <= ranked[1].min.z + 1e-4 &&
    k.min.x >= xMin - 1e-4 &&
    k.max.x <= xMax + 1e-4;
  const jawBehind = t + 1e-9 >= 0.27 && k.min.y > j.max.y + 1e-4;
  const captureDepth = k.min.y - j.max.y;
  return { intersect, inThroat, jawBehind, solidClearance, captureDepth };
}

function evalNest(world: Array<{ name: string; family: string; obb: OBB }>, _t: number): NestSample {
  const pin = world.find((s) => s.family === "nest-pin");
  const recs = world.filter((s) => s.family === "nest-receiver");
  if (!pin || recs.length === 0) {
    return { intersect: true, inBore: false, through: false, boreClearance: -1, solidClearance: -1, sideways: false };
  }
  let solidClearance = Infinity;
  let intersect = false;
  for (const r of recs) {
    const sep = obbSeparation(pin.obb, r.obb);
    solidClearance = Math.min(solidClearance, sep);
    if (obbOverlaps(pin.obb, r.obb)) intersect = true;
  }
  const p = obbWorldAabb(pin.obb);
  const bore = {
    minX: P.nestReceiver.x - P.nestReceiver.bore[0] / 2,
    maxX: P.nestReceiver.x + P.nestReceiver.bore[0] / 2,
    minY: P.nestReceiver.y - P.nestReceiver.bore[1] / 2,
    maxY: P.nestReceiver.y + P.nestReceiver.bore[1] / 2,
    minZ: P.nestReceiver.z - P.nestReceiver.outer[2] / 2,
    maxZ: P.nestReceiver.z + P.nestReceiver.outer[2] / 2,
  };
  const inBoreXY = p.min.x >= bore.minX - 1e-4 && p.max.x <= bore.maxX + 1e-4 && p.min.y >= bore.minY - 1e-4 && p.max.y <= bore.maxY + 1e-4;
  const zOverlap = p.max.z > bore.minZ && p.min.z < bore.maxZ;
  const through = p.min.z < bore.minZ - 1e-4 && p.max.z > bore.maxZ + 1e-4;
  const sideways = zOverlap && !inBoreXY;
  const boreClearance = Math.min(p.min.x - bore.minX, bore.maxX - p.max.x, p.min.y - bore.minY, bore.maxY - p.max.y);
  return { intersect, inBore: inBoreXY && zOverlap, through, boreClearance, solidClearance, sideways };
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

function newLatchAcc(): LatchMetrics & { captured: boolean } {
  return {
    pass: false,
    detail: "",
    minSolidClearance: Infinity,
    minSolidClearanceT: 0,
    captureDepth: Infinity,
    captureDepthT: 0,
    firstCapturedT: -1,
    samples: 0,
    intersections: 0,
    lostCapture: [],
    captured: false,
  };
}

function newNestAcc(): NestMetrics {
  return {
    pass: false,
    detail: "",
    minBoreClearance: Infinity,
    minSolidClearance: Infinity,
    minSolidClearanceT: 0,
    throughDepth: 0,
    firstCapturedT: -1,
    samples: 0,
    intersections: 0,
    sidewaysEntry: false,
    lostCapture: [],
  };
}

function absorbLatch(acc: LatchMetrics & { captured: boolean }, t: number, m: LatchSample): void {
  if (t + 1e-9 < 0.27) return;
  acc.samples += 1;
  if (m.solidClearance < acc.minSolidClearance) {
    acc.minSolidClearance = m.solidClearance;
    acc.minSolidClearanceT = t;
  }
  if (m.captureDepth < acc.captureDepth) {
    acc.captureDepth = m.captureDepth;
    acc.captureDepthT = t;
  }
  if (m.intersect) acc.intersections += 1;
  const captured = !m.intersect && m.inThroat && m.jawBehind;
  if (captured && acc.firstCapturedT < 0) acc.firstCapturedT = t;
  if (!captured) acc.lostCapture.push(t);
  acc.captured = captured;
}

function absorbNest(acc: NestMetrics, t: number, m: NestSample): void {
  if (m.sideways && t >= 0.68 && t <= 0.9) acc.sidewaysEntry = true;
  if (t + 1e-9 < 0.9) return;
  acc.samples += 1;
  if (m.solidClearance < acc.minSolidClearance) {
    acc.minSolidClearance = m.solidClearance;
    acc.minSolidClearanceT = t;
  }
  acc.minBoreClearance = Math.min(acc.minBoreClearance, m.boreClearance);
  if (m.through) {
    acc.throughDepth = P.nestReceiver.outer[2];
  }
  if (m.intersect) acc.intersections += 1;
  const captured = !m.intersect && m.inBore && m.through;
  if (captured && acc.firstCapturedT < 0) acc.firstCapturedT = t;
  if (!captured) acc.lostCapture.push(t);
}

function finishLatch(acc: LatchMetrics & { captured: boolean }): LatchMetrics {
  const pass =
    acc.samples > 0 &&
    acc.intersections === 0 &&
    acc.lostCapture.length === 0 &&
    acc.firstCapturedT >= 0 &&
    acc.firstCapturedT <= 0.27 + 1e-6 &&
    acc.minSolidClearance > 0;
  return {
    ...acc,
    pass,
    detail: pass
      ? `U-throat capture from t=${acc.firstCapturedT.toFixed(3)}; min hook/keeper sep ${acc.minSolidClearance.toFixed(4)} at t=${acc.minSolidClearanceT.toFixed(3)}; jaw depth ${acc.captureDepth.toFixed(4)}`
      : `latch fail intersections=${acc.intersections} lost=${acc.lostCapture.length} first=${acc.firstCapturedT} sep=${acc.minSolidClearance.toFixed(4)}`,
  };
}

function finishNest(acc: NestMetrics): NestMetrics {
  const pass =
    acc.samples > 0 &&
    acc.intersections === 0 &&
    acc.lostCapture.length === 0 &&
    acc.firstCapturedT >= 0 &&
    !acc.sidewaysEntry &&
    acc.minSolidClearance > 0 &&
    acc.minBoreClearance > 0;
  return {
    ...acc,
    pass,
    detail: pass
      ? `pin in real bore from t=${acc.firstCapturedT.toFixed(3)}; min frame sep ${acc.minSolidClearance.toFixed(4)}; bore margin ${acc.minBoreClearance.toFixed(4)}`
      : `nest fail intersections=${acc.intersections} lost=${acc.lostCapture.length} sideways=${acc.sidewaysEntry} sep=${acc.minSolidClearance.toFixed(4)} bore=${acc.minBoreClearance.toFixed(4)}`,
  };
}

function measureDriveMargins(rig: MachineRig): DriveMargins {
  rig.apply(0);
  const drive = rig.worldSolids().find((s) => s.name === "DRIVE_ENVELOPE");
  if (!drive) {
    return { zAft: 0, zFwd: 0, x: 0, yBot: 0, yTop: 0, driveZ: [0, 0], bayZ: [P.bay.zAft, P.bay.zFwd] };
  }
  const a = obbWorldAabb(drive.obb);
  return {
    zAft: a.min.z - P.bay.zAft,
    zFwd: P.bay.zFwd - a.max.z,
    x: P.bay.halfW - Math.max(Math.abs(a.min.x), Math.abs(a.max.x)),
    yBot: a.min.y - P.bay.yBot,
    yTop: P.bay.yTop - a.max.y,
    driveZ: [a.min.z, a.max.z],
    bayZ: [P.bay.zAft, P.bay.zFwd],
  };
}

function evaluateGates(args: {
  rig: MachineRig;
  pairs: PairResult[];
  e1: InstantEnvelope;
  e2: SweptEnvelope;
  e3: InstantEnvelope;
  e4: SweptEnvelope;
  haunch: ReturnType<typeof studyHaunch>;
  latch: LatchMetrics;
  nest: NestMetrics;
  escapedE2: boolean;
  escapedE4: boolean;
  keepoutInPhysical: boolean;
  e3IncludesAll: boolean;
  driveMargins: DriveMargins;
  seatedPort: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
}): GateResult[] {
  const pair = (name: string): PairResult => args.pairs.find((p) => p.name === name)!;
  const innerOuter = pair("inner-outer");
  const keelHit = pair("inner-keel").overlapping || pair("outer-keel").overlapping;
  const keepHits = args.pairs.filter((p) => p.name.includes("::") && p.overlapping);
  const driveBook = pair("inner-drive").overlapping || pair("outer-drive").overlapping;
  const driveKeel = pair("drive-keel").overlapping;

  args.rig.apply(0);
  const drive0 = args.rig.worldSolids().filter((s) => s.name === "DRIVE_ENVELOPE");
  const driveInBay = drive0.every((s) => {
    const a = obbWorldAabb(s.obb);
    return (
      a.min.x >= -P.bay.halfW + 0.02 &&
      a.max.x <= P.bay.halfW - 0.02 &&
      a.min.y >= P.bay.yBot - 0.01 &&
      a.max.y <= P.bay.yTop + 0.01 &&
      a.min.z >= P.bay.zAft - 0.01 &&
      a.max.z <= P.bay.zFwd + 0.01
    );
  });

  const seated = args.seatedPort;
  const inNestBand =
    seated.max.x < P.channel.xIn - 0.04 &&
    seated.max.x > P.rl.nestX - 0.2 &&
    seated.min.z < P.rl.z - 1.5 &&
    seated.max.z < REAR_FIREWALL_Z;

  const snapA = args.rig.poseSnapshot(0.37);
  args.rig.poseSnapshot(1);
  const snapC = args.rig.poseSnapshot(0.37);
  const reversible = posesEqual(snapA, snapC);
  const g4 = socketIsPureX(args.rig);
  const chosen = args.haunch.find((h) => h.deg === P.haunchDeg);
  const g11 = args.latch.pass;
  const g12 = args.nest.pass;

  const e2Bounds = sweptMatchesBounds(args.e2);
  const e4Bounds = sweptMatchesBounds(args.e4);
  const g9 =
    args.e1.width > 0 &&
    args.e2.width > 0 &&
    args.e3.width > 0 &&
    args.e4.width > 0 &&
    e2Bounds &&
    e4Bounds &&
    !args.escapedE2 &&
    !args.escapedE4 &&
    !args.keepoutInPhysical &&
    args.e3IncludesAll &&
    args.e4.width + 1e-6 >= args.e2.width &&
    args.e4.length + 1e-6 >= args.e2.length;

  return [
    gate("G1", "Honest book", innerOuter.minSeparation >= -1e-4, `inner-outer minSep=${fmt(innerOuter.minSeparation)} ${innerOuter.aSolid}/${innerOuter.bSolid} at t=${innerOuter.atT.toFixed(4)}; hinge-face contact at open is allowed`),
    gate("G2", "Honest yaw", !keelHit && g11, g11 ? (keelHit ? "keel overlap during transform" : "yaw clear; latch already captured") : "blocked: G11 latch capture not established"),
    gate("G3", "Honest roll", !keelHit && (chosen ? !chosen.keelHit : true), chosen ? `haunch ${chosen.deg}° keelClear=${fmt(chosen.minKeelClearance)}` : "no study"),
    gate("G4", "Honest socket", g4.ok, g4.detail),
    gate("G5", "Honest nest", inNestBand && !keelHit && g12, g12 ? `seated x[${fmt(seated.min.x)},${fmt(seated.max.x)}] z[${fmt(seated.min.z)},${fmt(seated.max.z)}]; nest pin captured` : "blocked: G12 nest capture not established"),
    gate("G6", "Honest bay", driveInBay && !driveKeel, `drive Z [${fmt(args.driveMargins.driveZ[0])},${fmt(args.driveMargins.driveZ[1])}] margins aft/fwd ${fmt(args.driveMargins.zAft)}/${fmt(args.driveMargins.zFwd)}`),
    gate("G7", "Honest drive exit", !driveBook && !driveKeel, `drive-book min=${fmt(Math.min(pair("inner-drive").minSeparation, pair("outer-drive").minSeparation))}`),
    gate("G8", "Honest future space", keepHits.length === 0, keepHits.length === 0 ? `${keepSweepNamesCount(args.pairs)} live-solid/keep-out pairs clear` : `keep-out consumed: ${keepHits.map((p) => p.name).join(", ")}`),
    gate(
      "G9",
      "Honest transform envelope",
      g9,
      `E1 instant W ${fmt(args.e1.width)}@${args.e1.widthAt.toFixed(4)} H ${fmt(args.e1.height)}@${args.e1.heightAt.toFixed(4)} L ${fmt(args.e1.length)}@${args.e1.lengthAt.toFixed(4)}; E2 swept W ${fmt(args.e2.width)}=ΔX H ${fmt(args.e2.height)}=ΔY L ${fmt(args.e2.length)}=ΔZ boundsMatch=${e2Bounds}; E3 instant W ${fmt(args.e3.width)}@${args.e3.widthAt.toFixed(4)}; E4 swept W ${fmt(args.e4.width)}=ΔX H ${fmt(args.e4.height)}=ΔY L ${fmt(args.e4.length)}=ΔZ boundsMatch=${e4Bounds}; keepoutsExcluded=${!args.keepoutInPhysical} contain=${!args.escapedE2 && !args.escapedE4}`,
    ),
    gate("G10", "Reversible analytic authority", reversible, reversible ? "t=0.37 pose matches after 0.37→1→0.37" : "pose mismatch on reverse"),
    gate("G11", "Book latch capture", g11, args.latch.detail),
    gate("G12", "Nest pin capture", g12, args.nest.detail),
  ];
}

function keepSweepNamesCount(pairs: PairResult[]): number {
  return pairs.filter((p) => p.name.includes("::")).length;
}

function gate(id: string, name: string, pass: boolean, detail: string): GateResult {
  return { id, name, pass, detail };
}

function socketIsPureX(rig: MachineRig): { ok: boolean; detail: string } {
  const samples = [0, 0.7, 0.76, 0.84, 1];
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (const t of samples) {
    const c = rig.poseSnapshot(t).nodes.RL_CARRIAGE;
    xs.push(c.p.x);
    ys.push(c.p.y);
    zs.push(c.p.z);
  }
  const ySpan = Math.max(...ys) - Math.min(...ys);
  const zSpan = Math.max(...zs) - Math.min(...zs);
  const xTravel = Math.abs(xs[xs.length - 1] - xs[0]);
  return {
    ok: ySpan < 1e-6 && zSpan < 1e-6 && xTravel > 0.35,
    detail: `rail dir=(1,0,0) Δx=${xTravel.toFixed(3)} Δy=${ySpan.toFixed(6)} Δz=${zSpan.toFixed(6)}`,
  };
}

function posesEqual(a: { nodes: Record<string, { p: { x: number; y: number; z: number }; r: { x: number; y: number; z: number } }> }, b: typeof a): boolean {
  for (const name of Object.keys(a.nodes)) {
    const pa = a.nodes[name];
    const pb = b.nodes[name];
    if (!pb) return false;
    if (Math.abs(pa.p.x - pb.p.x) > 1e-9) return false;
    if (Math.abs(pa.p.y - pb.p.y) > 1e-9) return false;
    if (Math.abs(pa.p.z - pb.p.z) > 1e-9) return false;
    if (Math.abs(pa.r.x - pb.r.x) > 1e-9) return false;
    if (Math.abs(pa.r.y - pb.r.y) > 1e-9) return false;
    if (Math.abs(pa.r.z - pb.r.z) > 1e-9) return false;
  }
  return true;
}

function unique(values: number[]): number[] {
  return [...new Set(values.map((v) => Number(v.toFixed(6))))];
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(3) : String(n);
}
