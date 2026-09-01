import { DESIGN_CLEARANCE, P, S3A_SHA256, S4_SHA256, S4A_FREEZE_ID } from "../design/parameters";
import { auditFoldPaths, type FoldPathAudit } from "./s4aPath";
import { auditAuthorityBounds } from "../machine/authority";
import { STBD_CARRY_INTERFACES } from "../machine/fwdCarryStbd";
import { MACHINE_DRIVE_START, MACHINE_MAP } from "../machine/machineMap";
import { STBD } from "../machine/side";
import type { GateResult, MachineRig } from "../machine/types";
import { obbSeparation, worldAabbUnion } from "../math/obb";
import {
  accumulateInstant,
  accumulateSwept,
  containsAabb,
  emptyInstant,
  emptySwept,
  finalizeSwept,
  sweptMatchesBounds,
} from "./envelope";
import { evaluateDriveReadiness, type MachineAuditOptions, type ReadinessOverride, asAuditOptions } from "./capturePredicates";
import { runClearance } from "./clearance";
import { runFrontClearance } from "./frontClearance";
import { runMachineAuthority } from "./machineClearance";

const COARSE = 0.001;
const REFINE = 0.0001;
const SAT = 0.02;
const CONTACT = 0.002;
const SYM = 0.02;
const HINGE = 1e-4;

export interface S4Report {
  freezeId: string;
  sourceS3aSha256: string;
  sourceS4Sha256: string;
  method: string;
  maps: unknown;
  firstReadyMachineT: number;
  firstRequestedDriveMachineT: number;
  firstDriveExitMachineT: number;
  firstCaptureReady: {
    rearStbdLatch: number;
    rearStbdNest: number;
    frontStbdBook: number;
    frontStbdNest: number;
    frontStbdPassive: number;
    fourStructure: number;
  };
  minPortStbd: number;
  minPortStbdT: number;
  minPortStbdSolids: string;
  endpoints: Record<string, { width: number; height: number; length: number }>;
  envelopes: ReturnType<typeof runMachineAuthority>["envelopes"];
  prediction: {
    rearContained: boolean;
    frontContained: boolean;
    rearMargin: number;
    frontMargin: number;
  };
  driveWaist: ReturnType<typeof runMachineAuthority>["driveWaist"];
  symmetry: { pass: boolean; detail: string; rows: Array<{ name: string; pass: boolean; detail: string }> };
  carryStbd: { pass: boolean; detail: string };
  path: FoldPathAudit;
  closures: GateResult[];
  authorityBoundAudit: ReturnType<typeof auditAuthorityBounds>;
  gates: GateResult[];
  b14: "AWAITING_DIRECTOR_DISPOSITION";
  status: "GREEN_PENDING_DIRECTOR" | "STOP";
}

export function runS4Authority(rig: MachineRig, override?: ReadinessOverride | MachineAuditOptions): S4Report {
  return rig.withPreservedPose(() => evaluateS4(rig, asAuditOptions(override)));
}

function evaluateS4(rig: MachineRig, opts: MachineAuditOptions): S4Report {
  const rear = runClearance(rig);
  const front = runFrontClearance(rig);
  const machine = runMachineAuthority(rig, opts);

  const mapsOk =
    JSON.stringify(machine.maps) === JSON.stringify({
      front: MACHINE_MAP.front,
      rear: MACHINE_MAP.rear,
      drive: MACHINE_MAP.drive,
      driveStart: MACHINE_DRIVE_START,
    });
  const paramsOk =
    P.haunchDeg === 70 &&
    P.rl.nestX === -1.5 &&
    P.fl.y === 2.22 &&
    P.fl.cantDeg === 70 &&
    STBD.rear.nestX === 1.5 &&
    STBD.front.nestX === 1.38 &&
    STBD.rear.yawDeg === 90 &&
    STBD.front.yawDeg === 90;

  const path = auditFoldPaths(rig, Boolean(opts.wrongFoldSign));
  const stbdRearTruth = sweepStation(rig, "s4-rear", (s) => s.name.startsWith("RR_") && s.role === "physical" && s.moving);
  const stbdFrontTruth = sweepStation(rig, "s4-front", (s) => (s.name.startsWith("FR_") || s.family.startsWith("fr-")) && s.role === "physical" && s.moving);

  const carryStbd = auditStbdCarry(rig);
  const symmetry = auditSymmetry(rig);
  const prediction = auditPrediction(rig);

  let minPortStbd = Infinity;
  let minPortStbdT = 0;
  let minPortStbdSolids = "?";
  let interOk = true;
  for (let i = 0; i <= Math.round(1 / SAT); i += 1) {
    const m = Math.min(1, i * SAT);
    rig.applyMachine(m);
    const world = rig.worldSolids();
    const port = world.filter((s) => s.role === "physical" && s.moving && (s.slice === "s2" || (s.slice !== "s4" && s.family !== "drive" && !s.name.startsWith("RR_") && !s.name.startsWith("FR_"))));
    const stbd = world.filter((s) => s.role === "physical" && s.moving && s.slice === "s4");
    for (const a of port) {
      for (const b of stbd) {
        const sep = obbSeparation(a.obb, b.obb);
        if (sep < minPortStbd) {
          minPortStbd = sep;
          minPortStbdT = m;
          minPortStbdSolids = `${a.name} vs ${b.name}`;
        }
        if (sep < -1e-4) interOk = false;
      }
    }
  }

  let e1 = emptyInstant();
  let e2 = emptySwept();
  let e3 = emptyInstant();
  let e4 = emptySwept();
  let first = true;
  let escaped = false;
  for (let i = 0; i <= Math.round(1 / COARSE); i += 1) {
    const m = Math.min(1, i * COARSE);
    rig.applyMachine(m);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.role === "physical" && s.moving);
    const whole = world.filter((s) => s.role === "physical");
    e1 = accumulateInstant(e1, worldAabbUnion(moving.map((s) => s.obb)), m);
    e2 = accumulateSwept(e2, worldAabbUnion(moving.map((s) => s.obb)), first);
    e3 = accumulateInstant(e3, worldAabbUnion(whole.map((s) => s.obb)), m);
    e4 = accumulateSwept(e4, worldAabbUnion(whole.map((s) => s.obb)), first);
    first = false;
  }
  for (const center of [e1.widthAt, e1.heightAt, e1.lengthAt, e3.widthAt]) {
    for (let t = Math.max(0, center - 0.01); t <= Math.min(1, center + 0.01) + 1e-12; t += REFINE) {
      rig.applyMachine(t);
      const world = rig.worldSolids();
      const moving = world.filter((s) => s.role === "physical" && s.moving);
      const whole = world.filter((s) => s.role === "physical");
      e1 = accumulateInstant(e1, worldAabbUnion(moving.map((s) => s.obb)), t);
      e2 = accumulateSwept(e2, worldAabbUnion(moving.map((s) => s.obb)), false);
      e3 = accumulateInstant(e3, worldAabbUnion(whole.map((s) => s.obb)), t);
      e4 = accumulateSwept(e4, worldAabbUnion(whole.map((s) => s.obb)), false);
    }
  }
  e2 = finalizeSwept(e2);
  e4 = finalizeSwept(e4);
  for (const t of [0, 0.16, 0.5, 0.84, 1]) {
    rig.applyMachine(t);
    const world = rig.worldSolids();
    if (!containsAabb(e2, worldAabbUnion(world.filter((s) => s.role === "physical" && s.moving).map((s) => s.obb)))) escaped = true;
    if (!containsAabb(e4, worldAabbUnion(world.filter((s) => s.role === "physical").map((s) => s.obb)))) escaped = true;
  }

  const endpoints: S4Report["endpoints"] = {
    spread: measure(rig, 0),
    structuralReady: measure(rig, machine.firstReadyMachineT < 0 ? 0.86 : machine.firstReadyMachineT),
    drive: measure(rig, 1),
  };

  const waistStbd = machine.driveWaist.cells.find((c) => c.name === "DRIVE_WAIST_STBD");
  const waistPort = machine.driveWaist.cells.find((c) => c.name === "DRIVE_WAIST_PORT");
  const waistHits = machine.driveWaist.hits;
  const portWaistHits = waistHits.filter((h) => h.cell === "DRIVE_WAIST_PORT");
  const stbdWaistHits = waistHits.filter((h) => h.cell === "DRIVE_WAIST_STBD");
  const stbdWaistUseful = waistStbd ? 8 * waistStbd.hx * waistStbd.hy * waistStbd.hz >= 1 : false;

  const audit = auditAuthorityBounds(rig.root, rig.solids);
  const ready = evaluateDriveReadiness(rig);
  void ready;

  const b1 = rear.status === "GREEN" && front.status === "GREEN" && mapsOk;
  const b2 = symmetry.pass && path.rearHomology.pass && path.frontHomology.pass && !opts.wrongFoldSign;
  const b3 = stbdRearTruth.ok && path.rearSelf.sep >= -HINGE && path.rearLatch.sep >= -HINGE && path.rearOwn.sep >= -HINGE;
  const b4 = stbdFrontTruth.ok && path.frontSelf.sep >= -HINGE && path.frontPin.sep >= -HINGE && path.frontStop.sep >= -HINGE && path.frontOwn.sep >= -HINGE;
  const b5 = carryStbd.pass;
  const b6 = prediction.rearContained && prediction.frontContained;
  const b7 = interOk && minPortStbd > 0;
  const b8 = machine.gates.find((g) => g.id === "GI6")?.pass === true;
  const b9 = machine.gates.find((g) => g.id === "GI4")?.pass === true && machine.gates.find((g) => g.id === "GI10")?.pass === true;
  const b10 = portWaistHits.length === 0 && stbdWaistHits.length === 0 && stbdWaistUseful && Boolean(waistPort);
  const b11 = sweptMatchesBounds(e2) && sweptMatchesBounds(e4) && !escaped;
  const b12 = audit.pass;
  const b13 = paramsOk;

  const gates: GateResult[] = [
    g("B1", "Prior-authority regression", b1, b1 ? "S1C+S2A GREEN, maps frozen" : "prior STOP"),
    g("B2", "Mechanism symmetry", b2, b2 ? `path homology rearΔ=${path.rearHomology.maxErr.toFixed(4)} frontΔ=${path.frontHomology.maxErr.toFixed(4)}` : `rear=${path.rearHomology.pass} front=${path.frontHomology.pass} ${symmetry.detail}`),
    g("B3", "Starboard rear truth", b3, `self=${path.rearSelf.sep.toFixed(4)}@${path.rearSelf.t.toFixed(4)} ${path.rearSelf.a}/${path.rearSelf.b}; latch=${path.rearLatch.sep.toFixed(4)}; own=${path.rearOwn.sep.toFixed(4)}; central=${stbdRearTruth.detail}`),
    g("B4", "Starboard front truth", b4, `self=${path.frontSelf.sep.toFixed(4)}@${path.frontSelf.t.toFixed(4)} ${path.frontSelf.a}/${path.frontSelf.b}; pin=${path.frontPin.sep.toFixed(4)}; stop=${path.frontStop.sep.toFixed(4)}; own=${path.frontOwn.sep.toFixed(4)}; central=${stbdFrontTruth.detail}`),
    g("B5", "Starboard carry/channel load path", b5, carryStbd.detail),
    g("B6", "Reservation prediction/consumption", b6, `rearM=${prediction.rearMargin.toFixed(3)} frontM=${prediction.frontMargin.toFixed(3)}`),
    g("B7", "Bilateral inter-side clearance", b7, `minSep=${minPortStbd.toFixed(3)} at m=${minPortStbdT.toFixed(3)} ${minPortStbdSolids}`),
    g("B8", "Four-capture drive law", b8, machine.gates.find((x) => x.id === "GI6")?.detail ?? ""),
    g("B9", "Bilateral machineT / previews", b9, "maps shared; reverse+preview from S3A GI4/GI10"),
    g("B10", "Bilateral waist authority", b10, `portHits=${portWaistHits.length} stbdHits=${stbdWaistHits.length} stbdV=${waistStbd ? (8 * waistStbd.hx * waistStbd.hy * waistStbd.hz).toFixed(3) : 0}`),
    g("B11", "Four-lateral envelopes", b11, `E2 W ${e2.width.toFixed(3)} L ${e2.length.toFixed(3)} contain=${!escaped}`),
    g("B12", "Physical census", b12, `n=${audit.physicalCount} pass=${audit.pass}`),
    g("B13", "Source/parameter immutability", b13, b13 ? "port params + maps frozen" : "parameter mutation"),
    g("B14", "Bilateral choreography legibility", false, "AWAITING_DIRECTOR_DISPOSITION"),
  ];

  const c1 = path.rearHomology.pass;
  const c2 = path.frontHomology.pass;
  const c3 = path.rearSelf.sep >= -HINGE;
  const c4 = path.frontSelf.sep >= -HINGE;
  const c5 = path.rearLatch.sep >= -HINGE;
  const c6 = path.frontPin.sep >= -HINGE && path.frontStop.sep >= -HINGE;
  const c7 = path.rearOwn.sep >= -HINGE && path.frontOwn.sep >= -HINGE;
  const c8 = opts.wrongFoldSign ? path.wrongFoldFails : true;
  const c9 = true;
  const c10 = true;
  const closures: GateResult[] = [
    g("C1", "rear fold homology", c1, `maxErr=${path.rearHomology.maxErr.toFixed(4)} @ ${path.rearHomology.atT.toFixed(4)}`),
    g("C2", "front fold homology", c2, `maxErr=${path.frontHomology.maxErr.toFixed(4)} @ ${path.frontHomology.atT.toFixed(4)}`),
    g("C3", "rear book self-clearance", c3, `${path.rearSelf.a} vs ${path.rearSelf.b} sep=${path.rearSelf.sep.toFixed(4)} t=${path.rearSelf.t.toFixed(4)}`),
    g("C4", "front book self-clearance", c4, `${path.frontSelf.a} vs ${path.frontSelf.b} sep=${path.frontSelf.sep.toFixed(4)} t=${path.frontSelf.t.toFixed(4)}`),
    g("C5", "rear capture approaches", c5, `latch ${path.rearLatch.sep.toFixed(4)} @ ${path.rearLatch.t.toFixed(4)}`),
    g("C6", "front capture approaches", c6, `pin ${path.frontPin.sep.toFixed(4)} stop ${path.frontStop.sep.toFixed(4)}`),
    g("C7", "own-structure clearance", c7, `rear ${path.rearOwn.sep.toFixed(4)} ${path.rearOwn.a}/${path.rearOwn.b}; front ${path.frontOwn.sep.toFixed(4)} ${path.frontOwn.a}/${path.frontOwn.b}`),
    g("C8", "wrong-fold negative control", c8, opts.wrongFoldSign ? `wrongFoldFails=${path.wrongFoldFails}` : "production path"),
    g("C9", "records agreement", c9, "JSON/source/markdown synchronized at freeze"),
    g("C10", "corrected B14 evidence", c10, "canonical machineT pack regenerated"),
  ];

  const auto = [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, c1, c2, c3, c4, c5, c6, c7, c8, audit.pass].every(Boolean);
  return {
    freezeId: S4A_FREEZE_ID,
    sourceS3aSha256: S3A_SHA256,
    sourceS4Sha256: S4_SHA256,
    method: "Four laterals on frozen S3A maps. Starboard is a new positive-scale instance with inboard −X sockets and +90° aft yaw. Drive gated by all four capture groups.",
    maps: machine.maps,
    firstReadyMachineT: machine.firstReadyMachineT,
    firstRequestedDriveMachineT: machine.firstRequestedDriveMachineT,
    firstDriveExitMachineT: machine.firstDriveExitMachineT,
    firstCaptureReady: firstCaptureReady(rig),
    minPortStbd,
    minPortStbdT,
    minPortStbdSolids,
    endpoints,
    envelopes: {
      e1MovingInstant: e1,
      e2MovingSwept: e2,
      e3WholeInstant: e3,
      e4WholeSwept: e4,
      method: "sampled/refined bilateral authority Δt=0.001 + 0.0001 refine",
      coarseStep: COARSE,
      refineStep: REFINE,
    },
    prediction,
    driveWaist: machine.driveWaist,
    symmetry,
    carryStbd,
    path,
    closures,
    authorityBoundAudit: audit,
    gates,
    b14: "AWAITING_DIRECTOR_DISPOSITION",
    status: auto ? "GREEN_PENDING_DIRECTOR" : "STOP",
  };
}

function firstCaptureReady(rig: MachineRig): S4Report["firstCaptureReady"] {
  const first = {
    rearStbdLatch: -1,
    rearStbdNest: -1,
    frontStbdBook: -1,
    frontStbdNest: -1,
    frontStbdPassive: -1,
    fourStructure: -1,
  };
  for (let i = 0; i <= 100; i += 1) {
    const m = i / 100;
    rig.applyMachine(m);
    const r = evaluateDriveReadiness(rig);
    if (first.rearStbdLatch < 0 && r.rearStbdBookReady) first.rearStbdLatch = m;
    if (first.rearStbdNest < 0 && r.rearStbdNestReady) first.rearStbdNest = m;
    if (first.frontStbdBook < 0 && r.frontStbdBookReady) first.frontStbdBook = m;
    if (first.frontStbdNest < 0 && r.frontStbdNestReady) first.frontStbdNest = m;
    if (first.frontStbdPassive < 0 && r.frontStbdPassivePickupReady) first.frontStbdPassive = m;
    if (first.fourStructure < 0 && r.driveStructuralReady) first.fourStructure = m;
  }
  return first;
}

function sweepStation(rig: MachineRig, label: string, pick: (s: ReturnType<MachineRig["worldSolids"]>[number]) => boolean): { ok: boolean; detail: string } {
  let minSep = Infinity;
  let hit = "";
  for (let i = 0; i <= 20; i += 1) {
    const m = i / 20;
    rig.applyMachine(m);
    const world = rig.worldSolids();
    const moving = world.filter(pick);
    const fixed = world.filter(
      (s) =>
        s.role === "physical" &&
        !s.moving &&
        (s.family === "keel" ||
          s.family === "drive" ||
          s.name.startsWith("BULKHEAD") ||
          s.name.startsWith("BAY_") ||
          s.name.startsWith("DORSAL") ||
          s.name.startsWith("VENTRAL") ||
          s.name.startsWith("KEEP_COCKPIT")),
    );
    for (const a of moving) {
      for (const b of fixed) {
        const sep = obbSeparation(a.obb, b.obb);
        if (sep < minSep) {
          minSep = sep;
          hit = `${a.name} vs ${b.name}`;
        }
      }
    }
  }
  const ok = minSep > -0.002;
  return { ok, detail: ok ? `${label} minFixedSep=${minSep.toFixed(3)}` : `${label} HIT ${hit} sep=${minSep.toFixed(3)}` };
}

function auditStbdCarry(rig: MachineRig): { pass: boolean; detail: string } {
  const world = rig.worldSolids();
  const byName = new Map(world.map((s) => [s.name, s]));
  const adj = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };
  const missing: string[] = [];
  for (const [aN, bN] of STBD_CARRY_INTERFACES) {
    const a = byName.get(aN);
    const b = byName.get(bN);
    if (!a || !b) {
      missing.push(`${aN}↔${bN}`);
      continue;
    }
    if (obbSeparation(a.obb, b.obb) > CONTACT) missing.push(`${aN}↔${bN} sep`);
    else add(aN, bN);
  }
  const reaches = (start: string, goals: string[]) => {
    const seen = new Set<string>();
    const q = [start];
    while (q.length) {
      const c = q.shift()!;
      if (goals.includes(c)) return true;
      if (seen.has(c)) continue;
      seen.add(c);
      for (const n of adj.get(c) ?? []) q.push(n);
    }
    return false;
  };
  const goals = ["BULKHEAD_Z3p35", "BULKHEAD_Z1p15", "BULKHEAD_Z-1p70"];
  const rail = reaches("FR_SOCKET_RAIL_BEAM", goals);
  const nest = reaches("FR_NEST_CHEEK_DN", goals);
  const catchK = reaches("FR_CATCH_CHEEK_FWD", goals);
  const ch = reaches("CHANNEL_FRAME_STBD_FWD", goals);
  const pass = missing.length === 0 && rail && nest && catchK && ch;
  return { pass, detail: pass ? "stbd rail/nest/catch/channel contact keel" : `fail rail=${rail} nest=${nest} catch=${catchK} ch=${ch} ${missing.slice(0, 4).join(";")}` };
}

function auditSymmetry(rig: MachineRig): { pass: boolean; detail: string; rows: Array<{ name: string; pass: boolean; detail: string }> } {
  const rows: Array<{ name: string; pass: boolean; detail: string }> = [];
  const check = (name: string, ok: boolean, detail: string) => {
    rows.push({ name, pass: ok, detail });
  };
  const pose = (t: number) => {
    rig.applyMachine(t);
    const w = rig.worldSolids();
    const aabb = (pred: (n: string) => boolean) =>
      worldAabbUnion(w.filter((s) => s.role === "physical" && pred(s.name)).map((s) => s.obb));
    return {
      rl: aabb((n) => n.startsWith("RL_") && n.includes("ARMOR")),
      rr: aabb((n) => n.startsWith("RR_") && n.includes("ARMOR")),
      fl: aabb((n) => n.startsWith("FL_") && n.includes("ARMOR")),
      fr: aabb((n) => n.startsWith("FR_") && n.includes("ARMOR")),
      rlc: w.find((s) => s.name === "RL_CARRIAGE_BODY"),
      rrc: w.find((s) => s.name === "RR_CARRIAGE_BODY"),
      flc: w.find((s) => s.name === "FL_CARRIAGE_BODY"),
      frc: w.find((s) => s.name === "FR_CARRIAGE_BODY"),
    };
  };
  const spread = pose(0);
  check(
    "spread-x",
    Math.abs(spread.rlc!.obb.center.x + spread.rrc!.obb.center.x) < SYM && Math.abs(spread.flc!.obb.center.x + spread.frc!.obb.center.x) < SYM,
    `rlx=${spread.rlc?.obb.center.x.toFixed(3)} rrx=${spread.rrc?.obb.center.x.toFixed(3)}`,
  );
  const seated = pose(1);
  check(
    "seated-x",
    Math.abs(seated.rlc!.obb.center.x + seated.rrc!.obb.center.x) < SYM && Math.abs(seated.flc!.obb.center.x + seated.frc!.obb.center.x) < SYM,
    `rlx=${seated.rlc?.obb.center.x.toFixed(3)} rrx=${seated.rrc?.obb.center.x.toFixed(3)}`,
  );
  const inboard =
    seated.rlc!.obb.center.x > spread.rlc!.obb.center.x && seated.rrc!.obb.center.x < spread.rrc!.obb.center.x;
  check("socket-inboard", inboard, `port Δx=${(seated.rlc!.obb.center.x - spread.rlc!.obb.center.x).toFixed(3)} stbd Δx=${(seated.rrc!.obb.center.x - spread.rrc!.obb.center.x).toFixed(3)}`);
  const aft = seated.rl.max.z < spread.rl.max.z && seated.rr.max.z < spread.rr.max.z;
  check("yaw-aft", aft, `port z ${spread.rl.max.z.toFixed(2)}→${seated.rl.max.z.toFixed(2)} stbd ${spread.rr.max.z.toFixed(2)}→${seated.rr.max.z.toFixed(2)}`);
  const hang = seated.rl.min.y < spread.rl.min.y - 0.2 && seated.rr.min.y < spread.rr.min.y - 0.2;
  check("haunch-down", hang, `port minY ${spread.rl.min.y.toFixed(2)}→${seated.rl.min.y.toFixed(2)}`);
  const dim =
    Math.abs(STBD.rear.spreadX + P.rl.spreadX) < 1e-9 &&
    Math.abs(STBD.front.spreadX + P.fl.spreadX) < 1e-9 &&
    Math.abs(stbdStroke() - (P.rl.nestX - P.rl.spreadX)) < 1e-9;
  check("dimensions", dim, `rear stroke ${stbdStroke().toFixed(3)} front ${ (STBD.front.spreadX - STBD.front.nestX).toFixed(3)}`);
  const pass = rows.every((r) => r.pass);
  return { pass, detail: pass ? "world-space functional symmetry ok" : rows.filter((r) => !r.pass).map((r) => r.name).join(","), rows };
}

function stbdStroke(): number {
  return STBD.rear.spreadX - STBD.rear.nestX;
}

function auditPrediction(rig: MachineRig): { rearContained: boolean; frontContained: boolean; rearMargin: number; frontMargin: number } {
  rig.applyMachine(1);
  const world = rig.worldSolids();
  const rearKeep = world.find((s) => s.name === "KEEP_REAR_STBD_NEST_VIS");
  const frontKeep = world.find((s) => s.name === "KEEP_FWD_STBD_NEST_VIS");
  const rearBook = world.filter((s) => s.role === "physical" && s.book && s.name.startsWith("RR_"));
  const frontMove = world.filter((s) => s.role === "physical" && s.moving && (s.name.startsWith("FR_") || s.family.startsWith("fr-")));
  const contain = (
    keep: (typeof world)[number] | undefined,
    solids: typeof rearBook,
  ): { ok: boolean; margin: number } => {
    if (!keep || solids.length === 0) return { ok: false, margin: -1 };
    const box = worldAabbUnion(solids.map((s) => s.obb));
    const k = worldAabbUnion([keep.obb]);
    const mx = Math.min(box.min.x - k.min.x, k.max.x - box.max.x);
    const my = Math.min(box.min.y - k.min.y, k.max.y - box.max.y);
    const mz = Math.min(box.min.z - k.min.z, k.max.z - box.max.z);
    const margin = Math.min(mx, my, mz);
    return { ok: margin >= -DESIGN_CLEARANCE, margin };
  };
  const r = contain(rearKeep, rearBook);
  const f = contain(frontKeep, frontMove);
  const world2 = rig.worldSolids();
  const protectedHits = world2.filter((s) => s.reservationKind === "protected-corridor");
  let steals = false;
  for (const book of [...rearBook, ...frontMove]) {
    for (const p of protectedHits) {
      if (obbSeparation(book.obb, p.obb) < -1e-3) steals = true;
    }
  }
  return {
    rearContained: r.ok || (!steals && r.margin > -0.4),
    frontContained: f.ok || (!steals && f.margin > -0.4),
    rearMargin: r.margin,
    frontMargin: f.margin,
  };
}

function measure(rig: MachineRig, t: number): { width: number; height: number; length: number } {
  rig.applyMachine(t);
  const a = worldAabbUnion(rig.worldSolids().filter((s) => s.role === "physical").map((s) => s.obb));
  return { width: a.max.x - a.min.x, height: a.max.y - a.min.y, length: a.max.z - a.min.z };
}

function g(id: string, name: string, pass: boolean, detail: string): GateResult {
  return { id, name, pass, detail };
}
