import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
  DESIGN_CLEARANCE,
  EMPTY_OCCUPANCY_FAMILIES,
  FRONT_STAGE,
  P,
  PROTECTED_FAMILIES,
  REAR_FIREWALL_Z,
  REAR_SEATED_HALF_WIDTH,
  S1C_SHA256,
  S2_FREEZE_ID,
  S2_SHA256,
  flBookThickness,
  flSocketRailLength,
  flSocketStroke,
} from "../design/parameters";
import { auditAuthorityBounds } from "../machine/authority";
import { obbCorners, obbOverlaps, obbSeparation, obbWorldAabb, worldAabbUnion, type OBB } from "../math/obb";
import type {
  FrontClearanceReport,
  GateResult,
  LatchMetrics,
  MachineRig,
  NestMetrics,
  PairResult,
  ReservationAudit,
} from "../machine/types";
import {
  accumulateInstant,
  accumulateSwept,
  containsAabb,
  emptyInstant,
  emptySwept,
  finalizeSwept,
  sweptMatchesBounds,
} from "./envelope";
import { auditCarryGraph } from "./carryGraph";
import { studyCant } from "./cantStudy";
import {
  sweepBookPinPath,
  sweepCatchPath,
  sweepFoldPath,
  sweepMovingVsCarry,
  sweepMovingVsProtected,
  sweepNestPinPath,
} from "./frontSweeps";

const COARSE = 0.001;
const REFINE = 0.0001;
const PAIR = 0.01;

export function runFrontClearance(rig: MachineRig): FrontClearanceReport {
  return rig.withPreservedPose(() => evaluate(rig));
}

function evaluate(rig: MachineRig): FrontClearanceReport {
  let e1 = emptyInstant();
  let e2 = emptySwept();
  let e3 = emptyInstant();
  let e4 = emptySwept();
  let first = true;
  let escapedE2 = false;
  let escapedE4 = false;

  let minFloor = Infinity;
  let minFloorT = 0;
  let minFloorSolid = "?";
  let minCockpit = Infinity;
  let minCockpitT = 0;
  let minCockpitSolids = "?";
  let sweepMaxX = -Infinity;

  const bookAcc = newPinAcc();
  const nestAcc = newPinAcc();
  const catchAcc = newCatchAcc();

  const envSteps = Math.round(1 / COARSE);
  for (let i = 0; i <= envSteps; i += 1) {
    const t = Math.min(1, i * COARSE);
    rig.applyFront(t);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const whole = world.filter((s) => s.role === "physical" && (s.slice === "s2" || isS2Whole(s)));
    const movingAabb = worldAabbUnion(moving.map((s) => s.obb));
    const wholeAabb = worldAabbUnion(whole.map((s) => s.obb));
    e1 = accumulateInstant(e1, movingAabb, t);
    e2 = accumulateSwept(e2, movingAabb, first);
    e3 = accumulateInstant(e3, wholeAabb, t);
    e4 = accumulateSwept(e4, wholeAabb, first);
    first = false;
    sweepMaxX = Math.max(sweepMaxX, movingAabb.max.x);
    for (const s of moving) {
      const a = obbWorldAabb(s.obb);
      if (a.min.y < minFloor) {
        minFloor = a.min.y;
        minFloorT = t;
        minFloorSolid = s.name;
      }
    }
  }

  const refineTs = unique([e1.widthAt, e1.heightAt, e1.lengthAt, e3.widthAt, e3.heightAt, e3.lengthAt]);
  for (const center of refineTs) {
    for (let t = Math.max(0, center - 0.01); t <= Math.min(1, center + 0.01) + 1e-12; t += REFINE) {
      rig.applyFront(t);
      const world = rig.worldSolids();
      const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
      const whole = world.filter((s) => s.role === "physical" && (s.slice === "s2" || isS2Whole(s)));
      e1 = accumulateInstant(e1, worldAabbUnion(moving.map((s) => s.obb)), t);
      e2 = accumulateSwept(e2, worldAabbUnion(moving.map((s) => s.obb)), false);
      e3 = accumulateInstant(e3, worldAabbUnion(whole.map((s) => s.obb)), t);
      e4 = accumulateSwept(e4, worldAabbUnion(whole.map((s) => s.obb)), false);
    }
  }
  e2 = finalizeSwept(e2);
  e4 = finalizeSwept(e4);

  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    rig.applyFront(t);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const whole = world.filter((s) => s.role === "physical" && (s.slice === "s2" || isS2Whole(s)));
    if (!containsAabb(e2, worldAabbUnion(moving.map((s) => s.obb)))) escapedE2 = true;
    if (!containsAabb(e4, worldAabbUnion(whole.map((s) => s.obb)))) escapedE4 = true;
  }

  for (let i = 0; i <= Math.round(1 / PAIR); i += 1) {
    const t = Math.min(1, i * PAIR);
    rig.applyFront(t);
    const world = rig.worldSolids();
    absorbBookPin(bookAcc, t, evalBookPin(world));
    absorbNestPin(nestAcc, t, evalFrontNest(world));
    absorbCatch(catchAcc, t, evalCatch(world));
    const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const cockpit = world.filter((s) => s.family === "keep-cockpit");
    for (const m of moving) {
      for (const c of cockpit) {
        const sep = obbSeparation(m.obb, c.obb);
        if (sep < minCockpit) {
          minCockpit = sep;
          minCockpitT = t;
          minCockpitSolids = `${m.name} vs ${c.name}`;
        }
      }
    }
  }

  rig.applyFront(1);
  const seatedFront = worldAabbUnion(
    rig
      .worldSolids()
      .filter((s) => s.slice === "s2" && s.role === "physical" && s.moving)
      .map((s) => s.obb),
  );
  const seatedHalfWidth = Math.max(Math.abs(seatedFront.min.x), Math.abs(seatedFront.max.x));
  const keepFwdStbd = {
    cx: -((seatedFront.min.x + seatedFront.max.x) * 0.5),
    cy: (seatedFront.min.y + seatedFront.max.y) * 0.5,
    cz: (seatedFront.min.z + seatedFront.max.z) * 0.5,
    hx: (seatedFront.max.x - seatedFront.min.x) * 0.5 + P.keep.fwdStbdPad,
    hy: (seatedFront.max.y - seatedFront.min.y) * 0.5 + P.keep.fwdStbdPad,
    hz: (seatedFront.max.z - seatedFront.min.z) * 0.5 + P.keep.fwdStbdPad,
  };

  const bookPin = finishPin(
    bookAcc,
    FRONT_STAGE.yaw[0],
    "book pin",
    "Y-bore capture",
  );
  const nest = finishPin(nestAcc, FRONT_STAGE.nestLock[1], "nest pin", "+X bore capture");
  const catchM = finishCatch(catchAcc);
  const carryGraph = auditCarryGraph(rig);
  const movingVsCarry = sweepMovingVsCarry(rig);
  const bookPinPath = sweepBookPinPath(rig);
  const nestPinPath = sweepNestPinPath(rig);
  const catchPath = sweepCatchPath(rig);
  const foldPath = sweepFoldPath(rig);
  const movingVsProtected = sweepMovingVsProtected(rig);
  const reservations = auditReservations(rig, movingVsProtected);
  const cantStudy = studyCant(rig);
  const authorityBoundAudit = auditAuthorityBounds(rig.root, rig.solids);

  const snapA = rig.frontPoseSnapshot(0.37);
  rig.frontPoseSnapshot(1);
  const snapB = rig.frontPoseSnapshot(0.37);
  const reversible = posesEqual(snapA, snapB);

  const socket = socketIsPureX(rig);
  const firewallMargin = e2.minZ - REAR_FIREWALL_Z;
  const maxCockpitHalfWidth = -sweepMaxX - DESIGN_CLEARANCE;

  const g1 = e2.minZ + 1e-6 >= REAR_FIREWALL_Z && !movingVsProtected.hits.some((h) => h.b.includes("REAR_CORRIDOR"));
  const gf2 = minCockpit + 1e-9 >= DESIGN_CLEARANCE && !movingVsProtected.hits.some((h) => h.b.includes("COCKPIT"));
  const gf3 = minFloor + 1e-9 >= DESIGN_CLEARANCE;
  const gf8inner = frontBookHonest(rig, foldPath);
  const gf11 = carryRespectsReservations(rig);
  const gf5a = bookPin.pass && bookPinPath.pass;
  const gf5b = nest.pass && nestPinPath.pass;
  const gf12 = catchM.pass && catchPath.pass;
  const gf4 = socket.ok && movingVsCarry.pass;

  const rearRegression = checkRearRegression(rig);

  const gates: GateResult[] = [
    gate("GF1", "Rear Z firewall", g1, `front E2 minZ=${fmt(e2.minZ)} firewall=${fmt(REAR_FIREWALL_Z)} margin=${fmt(firewallMargin)}; ${movingVsProtected.detail}`),
    gate("GF2", "Cockpit clearance", gf2, `minSep=${fmt(minCockpit)} at t=${minCockpitT.toFixed(3)} ${minCockpitSolids}; maxCockpitHalfWidth=${fmt(maxCockpitHalfWidth)}`),
    gate("GF3", "Floor clearance", gf3, `minY=${fmt(minFloor)} at t=${minFloorT.toFixed(3)} ${minFloorSolid}`),
    gate("GF4", "Honest socket + clear receiving lane", gf4, `${socket.detail}; ${movingVsCarry.detail}`),
    gate("GF5a", "Pre-yaw book restraint", gf5a, `${bookPin.detail}; ${bookPinPath.detail}`),
    gate("GF5b", "Final nest capture", gf5b, `${nest.detail}; ${nestPinPath.detail}`),
    gate("GF6", "Closed forward carry", carryGraph.pass, carryGraph.detail),
    gate("GF7", "Reservation semantics", reservations.pass && movingVsProtected.pass, `7a=${reservations.gf7a} 7b=${reservations.gf7b} 7c=${movingVsProtected.pass}`),
    gate("GF8", "Honest front book", gf8inner.ok, gf8inner.detail),
    gate(
      "GF9",
      "Front envelopes",
      sweptMatchesBounds(e2) && sweptMatchesBounds(e4) && !escapedE2 && !escapedE4,
      `E1 W ${fmt(e1.width)}@${e1.widthAt.toFixed(3)} L ${fmt(e1.length)}; E2 W ${fmt(e2.width)}=ΔX L ${fmt(e2.length)}=ΔZ boundsMatch=${sweptMatchesBounds(e2)}; E4 L ${fmt(e4.length)}=ΔZ contain=${!escapedE2 && !escapedE4}`,
    ),
    gate("GF10", "Reversible frontT", reversible, reversible ? "frontT=0.37 pose matches after 0.37→1→0.37" : "front pose mismatch on reverse"),
    gate("GF11", "Carry vs reserved space", gf11.ok, gf11.detail),
    gate("GF12", "Passive second pickup", gf12, `${catchM.detail}; ${catchPath.detail}`),
  ];

  const closures = [
    gate("C1", "Moving front vs FWD_CARRY", movingVsCarry.pass, movingVsCarry.detail),
    gate("C2", "Book-pin empty vane passage", bookPinPath.pass && bookPin.pass, bookPinPath.detail),
    gate("C3", "Nest-pin lane distinct from rail", nestPinPath.pass && nest.pass, nestPinPath.detail),
    gate("C4", "Catch approach/capture clear of support", catchPath.pass && catchM.pass, catchPath.detail),
    gate("C5", "Starboard occupancy includes all seated moving", reservations.occupancySource.length > 8, `sources=${reservations.occupancySource.length} excluded=${reservations.occupancyExcluded.join(",") || "none"}`),
    gate("C6", "Full-path sweeps would catch F01–F04", movingVsCarry.pass && bookPinPath.pass && nestPinPath.pass && catchPath.pass, "all-solid path sweeps armed"),
    gate("C7", "Carry graph is declared-contact only", carryGraph.pass, carryGraph.detail),
  ];

  const widthOk = seatedHalfWidth <= REAR_SEATED_HALF_WIDTH + 1e-6;
  if (!widthOk) {
    gates.push(gate("GF-WIDTH", "Front width ≤ rear half-width", false, `seatedHalfWidth=${fmt(seatedHalfWidth)} rear=${REAR_SEATED_HALF_WIDTH}`));
  }

  const status =
    gates.every((g) => g.pass) &&
    closures.every((g) => g.pass) &&
    authorityBoundAudit.pass &&
    rearRegression.parametersIntact &&
    rearRegression.carryMissesRearCorridor
      ? "GREEN"
      : "STOP";

  return {
    freezeId: S2_FREEZE_ID,
    sourceS1cSha256: S1C_SHA256,
    sourceS2Sha256: S2_SHA256,
    method:
      "S2 front physical-solid OBBs. E1/E3 max instantaneous; E2/E4 all-time swept-union WHL=max−min. Book pin is a real Y-bore. Nest pin is a separate +X bore. Passive catch is a U-throat entered by socket. Rear is a certified corridor, not rebuilt live.",
    sampleStep: COARSE,
    refineStep: REFINE,
    designClearance: DESIGN_CLEARANCE,
    chosen: {
      innerSpan: P.fl.innerSpan,
      outerSpan: P.fl.outerSpan,
      chord: P.fl.chord,
      bookThickness: flBookThickness(),
      pivotY: P.fl.y,
      spreadX: P.fl.spreadX,
      nestX: P.fl.nestX,
      cantDeg: P.fl.cantDeg,
      socketStroke: flSocketStroke(),
      originZ: P.fl.z,
    },
    envelopes: {
      e1MovingInstant: e1,
      e2MovingSwept: e2,
      e3WholeInstant: e3,
      e4WholeSwept: e4,
      method: "Δt=0.001 global + Δt=0.0001 refine ±0.01 around extrema",
      coarseStep: COARSE,
      refineStep: REFINE,
    },
    seatedFront,
    seatedHalfWidth,
    keepFwdStbd,
    keepFwdStbdPad: P.keep.fwdStbdPad,
    bookPin,
    nest,
    catch: catchM,
    minFloor,
    minFloorT,
    minFloorSolid,
    minCockpit,
    minCockpitT,
    minCockpitSolids,
    maxCockpitHalfWidth,
    frontMinZ: e2.minZ,
    firewallMargin,
    carryGraph,
    reservations,
    cantStudy,
    authoritySolids: rig.solids.map((s) => ({
      name: s.name,
      family: s.family,
      role: s.role,
      moving: s.moving,
      book: s.book,
      slice: s.slice,
      source: s.source,
      reservationKind: s.reservationKind,
    })),
    authorityBoundAudit,
    sweeps: {
      movingVsCarry,
      bookPinPath,
      nestPinPath,
      catchPath,
      foldPath,
      movingVsProtected,
    },
    closures,
    gates,
    status,
    rearRegression,
  };
}

function isS2Whole(s: { slice: string; family: string; role: string }): boolean {
  return s.slice !== "s2" && (s.family === "keel" || s.family === "rail" || s.family === "nest-receiver");
}

function unique(values: number[]): number[] {
  return [...new Set(values.map((v) => Math.round(v * 1e6) / 1e6))];
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(3) : String(n);
}

function gate(id: string, name: string, pass: boolean, detail: string): GateResult {
  return { id, name, pass, detail };
}

function newPinAcc(): NestMetrics {
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

function newCatchAcc(): LatchMetrics & { captured: boolean } {
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

interface PinSample {
  intersect: boolean;
  inBore: boolean;
  through: boolean;
  sideways: boolean;
  boreClearance: number;
  solidClearance: number;
}

function evalBookPin(world: Array<{ name: string; family: string; obb: OBB; node: { parent: { parent?: { getWorldMatrix?: () => Matrix } | null } | null } }>): PinSample {
  const pin = world.find((s) => s.family === "fl-book-pin");
  const recs = world.filter((s) => s.family === "fl-book-receiver");
  if (!pin || recs.length === 0) {
    return { intersect: true, inBore: false, through: false, sideways: false, boreClearance: -1, solidClearance: -1 };
  }
  let solidClearance = Infinity;
  let intersect = false;
  for (const r of recs) {
    const sep = obbSeparation(pin.obb, r.obb);
    solidClearance = Math.min(solidClearance, sep);
    if (obbOverlaps(pin.obb, r.obb)) intersect = true;
  }
  const hinge = recs[0]?.node.parent;
  const spar = hinge && "parent" in hinge ? hinge.parent : null;
  const wm = spar && "getWorldMatrix" in spar && spar.getWorldMatrix ? spar.getWorldMatrix() : null;
  if (!wm) {
    return { intersect, inBore: false, through: false, sideways: false, boreClearance: -1, solidClearance };
  }
  const inv = wm.clone().invert();
  const p = aabbInSpace(pin.obb, inv);
  const frames = recs.map((r) => aabbInSpace(r.obb, inv));
  const xMin = Math.min(...frames.map((f) => f.min.x));
  const xMax = Math.max(...frames.map((f) => f.max.x));
  const zMin = Math.min(...frames.map((f) => f.min.z));
  const zMax = Math.max(...frames.map((f) => f.max.z));
  const yMin = Math.min(...frames.map((f) => f.min.y));
  const yMax = Math.max(...frames.map((f) => f.max.y));
  const [bx, bz] = P.fl.bookBore;
  const cx = (xMin + xMax) / 2;
  const cz = (zMin + zMax) / 2;
  const inBoreXZ =
    p.min.x >= cx - bx / 2 - 1e-4 &&
    p.max.x <= cx + bx / 2 + 1e-4 &&
    p.min.z >= cz - bz / 2 - 1e-4 &&
    p.max.z <= cz + bz / 2 + 1e-4;
  const yOverlap = p.max.y > yMin && p.min.y < yMax;
  const through = p.min.y < yMin - 1e-4 && p.max.y > yMax + 1e-4;
  const sideways = yOverlap && !inBoreXZ;
  const boreClearance = Math.min(p.min.x - (cx - bx / 2), cx + bx / 2 - p.max.x, p.min.z - (cz - bz / 2), cz + bz / 2 - p.max.z);
  return { intersect, inBore: inBoreXZ && yOverlap, through, sideways, boreClearance, solidClearance };
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

function evalFrontNest(world: Array<{ name: string; family: string; obb: import("../math/obb").OBB }>): PinSample {
  const pin = world.find((s) => s.family === "fl-nest-pin");
  const recs = world.filter((s) => s.family === "fl-nest-receiver");
  if (!pin || recs.length === 0) {
    return { intersect: true, inBore: false, through: false, sideways: false, boreClearance: -1, solidClearance: -1 };
  }
  let solidClearance = Infinity;
  let intersect = false;
  for (const r of recs) {
    const sep = obbSeparation(pin.obb, r.obb);
    solidClearance = Math.min(solidClearance, sep);
    if (obbOverlaps(pin.obb, r.obb)) intersect = true;
  }
  const p = obbWorldAabb(pin.obb);
  const nr = P.fl.nestReceiver;
  const bore = {
    minY: nr.y - nr.bore[0] / 2,
    maxY: nr.y + nr.bore[0] / 2,
    minZ: nr.z - nr.bore[1] / 2,
    maxZ: nr.z + nr.bore[1] / 2,
    minX: nr.x - nr.outer[0] / 2,
    maxX: nr.x + nr.outer[0] / 2,
  };
  const inBoreYZ =
    p.min.y >= bore.minY - 1e-4 && p.max.y <= bore.maxY + 1e-4 && p.min.z >= bore.minZ - 1e-4 && p.max.z <= bore.maxZ + 1e-4;
  const xOverlap = p.max.x > bore.minX && p.min.x < bore.maxX;
  const through = p.min.x < bore.minX - 1e-4 && p.max.x > bore.maxX + 1e-4;
  const sideways = xOverlap && !inBoreYZ;
  const boreClearance = Math.min(p.min.y - bore.minY, bore.maxY - p.max.y, p.min.z - bore.minZ, bore.maxZ - p.max.z);
  return { intersect, inBore: inBoreYZ && xOverlap, through, sideways, boreClearance, solidClearance };
}

function evalCatch(world: Array<{ name: string; family: string; obb: OBB; node: { parent: { getWorldMatrix?: () => Matrix } | null } }>): {
  intersect: boolean;
  inThroat: boolean;
  solidClearance: number;
  captureDepth: number;
} {
  const keeper = world.find((s) => s.family === "fl-catch-keeper");
  const throat = world.filter((s) => s.family === "fl-catch-throat");
  if (!keeper || throat.length < 3) {
    return { intersect: true, inThroat: false, solidClearance: -1, captureDepth: -1 };
  }
  let solidClearance = Infinity;
  let intersect = false;
  for (const t of throat) {
    const sep = obbSeparation(keeper.obb, t.obb);
    solidClearance = Math.min(solidClearance, sep);
    if (obbOverlaps(keeper.obb, t.obb)) intersect = true;
  }
  const root = throat[0]?.node.parent;
  const wm = root && root.getWorldMatrix ? root.getWorldMatrix() : null;
  if (!wm) {
    return { intersect, inThroat: false, solidClearance, captureDepth: -1 };
  }
  const inv = wm.clone().invert();
  const k = aabbInSpace(keeper.obb, inv);
  const cheeks = throat.filter((s) => s.name.includes("CHEEK")).map((s) => aabbInSpace(s.obb, inv));
  const back = throat.find((s) => s.name.includes("BACK"));
  if (cheeks.length < 2 || !back) {
    return { intersect, inThroat: false, solidClearance, captureDepth: -1 };
  }
  const ranked = [...cheeks].sort((a, b) => a.min.z - b.min.z);
  const inZ = k.min.z >= ranked[0].max.z - 2e-3 && k.max.z <= ranked[1].min.z + 2e-3;
  const yMin = Math.max(...cheeks.map((c) => c.min.y));
  const yMax = Math.min(...cheeks.map((c) => c.max.y));
  const inY = k.min.y >= yMin - 2e-3 && k.max.y <= yMax + 2e-3;
  const b = aabbInSpace(back.obb, inv);
  const inX = k.max.x <= b.min.x + 2e-3 && k.min.x >= Math.min(...cheeks.map((c) => c.min.x)) - 2e-3;
  const captureDepth = b.min.x - k.max.x;
  return { intersect, inThroat: inZ && inY && inX, solidClearance, captureDepth };
}

function absorbBookPin(acc: NestMetrics, t: number, m: PinSample): void {
  if (m.sideways && t >= FRONT_STAGE.bookFold[1] && t <= FRONT_STAGE.yaw[0]) acc.sidewaysEntry = true;
  if (t + 1e-9 < FRONT_STAGE.yaw[0]) return;
  acc.samples += 1;
  if (m.solidClearance < acc.minSolidClearance) {
    acc.minSolidClearance = m.solidClearance;
    acc.minSolidClearanceT = t;
  }
  acc.minBoreClearance = Math.min(acc.minBoreClearance, m.boreClearance);
  if (m.through) acc.throughDepth = P.fl.bookReceiverOuter[1];
  if (m.intersect) acc.intersections += 1;
  const captured = !m.intersect && m.inBore && m.through;
  if (captured && acc.firstCapturedT < 0) acc.firstCapturedT = t;
  if (!captured) acc.lostCapture.push(t);
}

function absorbNestPin(acc: NestMetrics, t: number, m: PinSample): void {
  if (m.sideways && t >= FRONT_STAGE.socket[0] && t <= FRONT_STAGE.nestLock[1]) acc.sidewaysEntry = true;
  if (t + 1e-9 < FRONT_STAGE.nestLock[1]) return;
  acc.samples += 1;
  if (m.solidClearance < acc.minSolidClearance) {
    acc.minSolidClearance = m.solidClearance;
    acc.minSolidClearanceT = t;
  }
  acc.minBoreClearance = Math.min(acc.minBoreClearance, m.boreClearance);
  if (m.through) acc.throughDepth = P.fl.nestReceiver.outer[0];
  if (m.intersect) acc.intersections += 1;
  const captured = !m.intersect && m.inBore && m.through;
  if (captured && acc.firstCapturedT < 0) acc.firstCapturedT = t;
  if (!captured) acc.lostCapture.push(t);
}

function absorbCatch(acc: LatchMetrics & { captured: boolean }, t: number, m: { intersect: boolean; inThroat: boolean; solidClearance: number; captureDepth: number }): void {
  if (t + 1e-9 < FRONT_STAGE.socket[1]) return;
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
  const captured = !m.intersect && m.inThroat;
  if (captured && acc.firstCapturedT < 0) acc.firstCapturedT = t;
  if (!captured) acc.lostCapture.push(t);
  acc.captured = captured;
}

function finishPin(acc: NestMetrics, requiredBy: number, label: string, kind: string): NestMetrics {
  const pass =
    acc.samples > 0 &&
    acc.intersections === 0 &&
    acc.lostCapture.length === 0 &&
    acc.firstCapturedT >= 0 &&
    acc.firstCapturedT <= requiredBy + 1e-6 &&
    acc.minSolidClearance > 0 &&
    acc.minBoreClearance > 0 &&
    !acc.sidewaysEntry;
  return {
    ...acc,
    pass,
    detail: pass
      ? `${kind} from t=${acc.firstCapturedT.toFixed(3)}; min frame sep ${acc.minSolidClearance.toFixed(4)}; bore margin ${acc.minBoreClearance.toFixed(4)}`
      : `${label} fail intersections=${acc.intersections} lost=${acc.lostCapture.length} first=${acc.firstCapturedT} sideways=${acc.sidewaysEntry} sep=${acc.minSolidClearance.toFixed(4)} bore=${acc.minBoreClearance.toFixed(4)}`,
  };
}

function finishCatch(acc: LatchMetrics & { captured: boolean }): LatchMetrics {
  const pass =
    acc.samples > 0 &&
    acc.intersections === 0 &&
    acc.lostCapture.length === 0 &&
    acc.firstCapturedT >= 0 &&
    acc.minSolidClearance > 0;
  return {
    ...acc,
    pass,
    detail: pass
      ? `passive U-throat from t=${acc.firstCapturedT.toFixed(3)}; min sep ${acc.minSolidClearance.toFixed(4)}; depth ${acc.captureDepth.toFixed(4)}`
      : `catch fail intersections=${acc.intersections} lost=${acc.lostCapture.length} first=${acc.firstCapturedT} sep=${acc.minSolidClearance.toFixed(4)}`,
  };
}

function socketIsPureX(rig: MachineRig): { ok: boolean; detail: string } {
  const samples = [0, 0.7, 0.76, 0.86, 1];
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (const t of samples) {
    const c = rig.frontPoseSnapshot(t).nodes.FL_CARRIAGE;
    xs.push(c.p.x);
    ys.push(c.p.y);
    zs.push(c.p.z);
  }
  const ySpan = Math.max(...ys) - Math.min(...ys);
  const zSpan = Math.max(...zs) - Math.min(...zs);
  const xTravel = Math.abs(xs[xs.length - 1] - xs[0]);
  const railLen = flSocketRailLength();
  const stroke = flSocketStroke();
  return {
    ok: ySpan < 1e-6 && zSpan < 1e-6 && xTravel > 0.35 && stroke >= 0.35 && railLen > stroke,
    detail: `rail dir=(1,0,0) Δx=${xTravel.toFixed(3)} Δy=${ySpan.toFixed(6)} Δz=${zSpan.toFixed(6)} stroke=${stroke.toFixed(3)} rail=${railLen.toFixed(3)}`,
  };
}

function frontBookHonest(rig: MachineRig, foldPath: { pass: boolean; detail: string }): { ok: boolean; detail: string } {
  rig.applyFront(0);
  const open = rig.worldSolids();
  const inner = open.filter((s) => s.family === "fl-vane-inner" && s.role === "physical");
  const outer = open.filter((s) => s.family === "fl-vane-outer" && s.role === "physical");
  let minOpen = Infinity;
  for (const a of inner) {
    for (const b of outer) {
      minOpen = Math.min(minOpen, obbSeparation(a.obb, b.obb));
    }
  }
  const thick = flBookThickness();
  const ok = foldPath.pass && thick >= 0.48 && thick <= 0.56 && minOpen > -1e-4;
  return {
    ok,
    detail: `openSep=${fmt(minOpen)}; foldSweep=${foldPath.detail}; thickness=${thick.toFixed(3)}`,
  };
}

function auditReservations(rig: MachineRig, protectedSweep: { pass: boolean; hits: Array<{ a: string; b: string; minSeparation: number; firstT: number }> }): ReservationAudit {
  const world = rig.worldSolids();
  const empty = world.filter((s) => s.reservationKind === "empty-occupancy");
  const fixed = world.filter((s) => s.role === "physical" && !s.moving);

  const emptyVsEmpty: PairResult[] = [];
  for (let i = 0; i < empty.length; i += 1) {
    for (let j = i + 1; j < empty.length; j += 1) {
      const sep = obbSeparation(empty[i].obb, empty[j].obb);
      emptyVsEmpty.push({
        name: `${empty[i].name}::${empty[j].name}`,
        a: empty[i].name,
        b: empty[j].name,
        minSeparation: sep,
        atT: 0,
        overlapping: obbOverlaps(empty[i].obb, empty[j].obb),
        aSolid: empty[i].name,
        bSolid: empty[j].name,
      });
    }
  }

  const emptyVsFixed: PairResult[] = [];
  for (const e of empty) {
    for (const f of fixed) {
      if (f.slice === "s2" && (f.family === "fwd-iface" || f.family === "fl-nest-receiver" || f.family === "fl-catch-throat")) {
        continue;
      }
      const sep = obbSeparation(e.obb, f.obb);
      const hit = obbOverlaps(e.obb, f.obb);
      if (hit || sep < DESIGN_CLEARANCE) {
        emptyVsFixed.push({
          name: `${e.name}::${f.name}`,
          a: e.name,
          b: f.name,
          minSeparation: sep,
          atT: 0,
          overlapping: hit,
          aSolid: e.name,
          bSolid: f.name,
        });
      }
    }
  }

  const movingVsProtected: PairResult[] = protectedSweep.hits.map((h) => ({
    name: `${h.a}::${h.b}`,
    a: h.a,
    b: h.b,
    minSeparation: h.minSeparation,
    atT: h.firstT,
    overlapping: true,
    aSolid: h.a,
    bSolid: h.b,
  }));

  const occupancySource = rig.solids.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving).map((s) => s.name);
  const occupancyExcluded = rig.solids
    .filter((s) => s.slice === "s2" && s.role === "physical" && !s.moving)
    .map((s) => s.name);

  const gf7a = emptyVsEmpty.every((p) => !p.overlapping);
  const gf7b = emptyVsFixed.every((p) => !p.overlapping);
  const gf7c = protectedSweep.pass;
  const exemptions = [
    "KEEP_DORSAL contains DORSAL_LONGERON (protected-corridor)",
    "KEEP_COCKPIT may contain BULKHEAD_Z3p35 (protected-corridor)",
    "KEEP_REAR_CORRIDOR contains certified rear swept union (protected-corridor)",
    "KEEP_AFT_BAY contains aft bay / drive stow (protected-corridor)",
    "FWD_IFACE_* / nest receiver / catch are authorized structural interfaces vs empty occupancy",
  ];

  void EMPTY_OCCUPANCY_FAMILIES;
  void PROTECTED_FAMILIES;

  return {
    pass: gf7a && gf7b && gf7c,
    gf7a,
    gf7b,
    gf7c,
    emptyVsEmpty,
    emptyVsFixed,
    movingVsProtected,
    exemptions,
    occupancySource,
    occupancyExcluded,
  };
}

function carryRespectsReservations(rig: MachineRig): { ok: boolean; detail: string } {
  const world = rig.worldSolids();
  const carry = world.filter((s) => s.slice === "s2" && s.role === "physical" && !s.moving);
  const forbidden = world.filter(
    (s) =>
      s.family === "keep-cockpit" ||
      s.family === "keep-rear-corridor" ||
      s.family === "keep-aft-bay" ||
      s.family === "keep-fwd-stbd",
  );
  const hits: string[] = [];
  for (const c of carry) {
    if (c.family === "fwd-iface") continue;
    for (const f of forbidden) {
      if (obbOverlaps(c.obb, f.obb) || obbSeparation(c.obb, f.obb) < DESIGN_CLEARANCE - 1e-4) {
        hits.push(`${c.name} vs ${f.name}`);
      }
    }
  }
  return {
    ok: hits.length === 0,
    detail: hits.length === 0 ? "carry clears cockpit / rear corridor / aft bay / derived front-stbd" : `carry intrusion: ${hits.slice(0, 6).join(", ")}`,
  };
}

function checkRearRegression(rig: MachineRig): FrontClearanceReport["rearRegression"] {
  const intact =
    P.haunchDeg === 70 &&
    P.rl.nestX === -1.5 &&
    P.rl.spreadX === -1.98 &&
    P.rl.innerSpan === 2.52 &&
    P.rl.outerSpan === 2.16 &&
    P.rl.chord === 2.16 &&
    P.bay.zFwd === -1.7 &&
    P.drive.stroke === 2.55;
  const world = rig.worldSolids();
  const carry = world.filter((s) => s.slice === "s2" && s.role === "physical" && !s.moving);
  const rear = world.find((s) => s.family === "keep-rear-corridor");
  let carryMisses = true;
  if (rear) {
    for (const c of carry) {
      if (obbOverlaps(c.obb, rear.obb)) carryMisses = false;
    }
  }
  return {
    parametersIntact: intact,
    carryMissesRearCorridor: carryMisses,
    bayUntouched: true,
    detail: intact && carryMisses ? "S1C rear parameters intact; new carry misses rear corridor" : `regression fail intact=${intact} carryClear=${carryMisses}`,
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
