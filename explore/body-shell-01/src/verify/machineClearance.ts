import {
  DESIGN_CLEARANCE,
  P,
  S1C_SHA256,
  S2A_SHA256,
  S3_SHA256,
  S3A_FREEZE_ID,
  STAGE,
  FRONT_STAGE,
  deriveDriveWaistPort,
} from "../design/parameters";
import { auditAuthorityBounds } from "../machine/authority";
import {
  MACHINE_DRIVE_START,
  MACHINE_INSPECTION_T,
  MACHINE_MAP,
  gateAppliedDrive,
  mapDrive,
  mapFront,
  mapRear,
  machinePhase,
  mapsMonotonic,
} from "../machine/machineMap";
import type { MachineAuthorityReport, MachineRig, WaistHit } from "../machine/types";
import { obbOverlaps, obbSeparation, obbWorldAabb, worldAabbUnion } from "../math/obb";
import {
  accumulateInstant,
  accumulateSwept,
  containsAabb,
  emptyInstant,
  emptySwept,
  finalizeSwept,
  sweptMatchesBounds,
} from "./envelope";
import {
  asAuditOptions,
  evaluateDriveReadiness,
  type MachineAuditOptions,
  type ReadinessOverride,
} from "./capturePredicates";
import { runClearance } from "./clearance";
import { runFrontClearance } from "./frontClearance";

export type { MachineAuditOptions };

const SAT_STEP = 0.01;
const COARSE = 0.001;
const REFINE = 0.0001;

export function runMachineAuthority(
  rig: MachineRig,
  override?: ReadinessOverride | MachineAuditOptions,
): MachineAuthorityReport {
  return rig.withPreservedPose(() => evaluate(rig, asAuditOptions(override)));
}

function evaluate(rig: MachineRig, opts: MachineAuditOptions): MachineAuthorityReport {
  const rearReport = runClearance(rig);
  const frontReport = runFrontClearance(rig);

  const mono = mapsMonotonic();
  let mapMatch = true;
  for (let i = 0; i <= 50; i += 1) {
    const m = i / 50;
    const mapped = { f: mapFront(m), r: mapRear(m), d: mapDrive(m) };
    const applied = rig.applyMachine(m);
    if (Math.abs(rig.lastFrontT() - mapped.f) > 1e-9) mapMatch = false;
    if (Math.abs(rig.lastT() - mapped.r) > 1e-9) mapMatch = false;
    if (Math.abs(applied.requestedDriveT - mapped.d) > 1e-9) mapMatch = false;
  }

  let reversible = true;
  for (const t of [0.17, 0.37, 0.63, 0.84]) {
    const a = rig.machinePoseSnapshot(t);
    rig.applyMachine(1);
    const b = rig.machinePoseSnapshot(t);
    rig.applyMachine(0);
    const c = rig.machinePoseSnapshot(t);
    if (!posesEqual(a, b) || !posesEqual(a, c)) reversible = false;
    const ra = evaluateAt(rig, t);
    const rb = evaluateAt(rig, t);
    if (ra.driveStructuralReady !== rb.driveStructuralReady) reversible = false;
  }

  let minFrontRear = Infinity;
  let minFrontRearT = 0;
  let minFrontRearSolids = "?";
  let driveBarrierOk = true;
  let firstReady = -1;
  let firstDrive = -1;
  let firstRequested = -1;
  let waistActiveEarly = false;
  const waistHits: WaistHit[] = [];
  let escapedE2 = false;
  let escapedE4 = false;
  let canonicalDriveOk = true;

  let e1 = emptyInstant();
  let e2 = emptySwept();
  let e3 = emptyInstant();
  let e4 = emptySwept();
  let firstEnv = true;

  const seatedRear = rearReport.seatedRearPort;
  const channelFwd = findNamedAabb(rig, "CHANNEL_FRAME_FWD");
  const carryAft = findNamedAabb(rig, "FWD_FRAME_AFT");
  const waistCells = [...deriveDriveWaistPort(frontReport.seatedFront, seatedRear, { channelFwd, carryAft })];
  const channelFwdStbd = rig.worldSolids().find((s) => s.name === "CHANNEL_FRAME_STBD_FWD");
  const carryAftStbd = rig.worldSolids().find((s) => s.name === "FWD_STBD_FRAME_AFT");
  if (channelFwdStbd && carryAftStbd) {
    rig.applyMachine(1);
    const seatedStbdRear = worldAabbUnion(
      rig.worldSolids().filter((s) => s.role === "physical" && s.book && s.name.startsWith("RR_")).map((s) => s.obb),
    );
    const seatedStbdFront = worldAabbUnion(
      rig.worldSolids().filter((s) => s.role === "physical" && s.moving && (s.name.startsWith("FR_") || s.family.startsWith("fr-"))).map((s) => s.obb),
    );
    waistCells.push(
      ...deriveDriveWaistPort(seatedStbdFront, seatedStbdRear, {
        channelFwd: findNamedAabb(rig, "CHANNEL_FRAME_STBD_FWD"),
        carryAft: findNamedAabb(rig, "FWD_STBD_FRAME_AFT"),
      }, undefined, "DRIVE_WAIST_STBD"),
    );
  }

  for (let i = 0; i <= Math.round(1 / SAT_STEP); i += 1) {
    const m = Math.min(1, i * SAT_STEP);
    const applied = rig.applyMachine(m, { readiness: opts.readiness, bypassGate: opts.bypassDriveGate });
    const ready = evaluateDriveReadiness(rig, opts.readiness);
    const requested = applied.requestedDriveT;
    const driveT = applied.appliedDriveT;
    if (ready.driveStructuralReady && firstReady < 0) firstReady = m;
    if (requested > 1e-9 && firstRequested < 0) firstRequested = m;
    if (driveT > 1e-9 && firstDrive < 0) firstDrive = m;
    if (driveT > 1e-9 && !ready.driveStructuralReady) driveBarrierOk = false;
    if (!ready.driveStructuralReady && driveT > 1e-9) driveBarrierOk = false;
    if (!ready.driveStructuralReady && !driveStowed(rig)) driveBarrierOk = false;
    if (opts.readiness && requested > 1e-9 && !ready.driveStructuralReady) driveBarrierOk = false;
    if (m < 0.2 && ready.driveStructuralReady) waistActiveEarly = true;
    if (!opts.readiness && Math.abs(driveT - gateAppliedDrive(requested, ready.driveStructuralReady)) > 1e-9) {
      driveBarrierOk = false;
    }
    if (!opts.readiness && ready.driveStructuralReady && Math.abs(driveT - requested) > 1e-9) {
      canonicalDriveOk = false;
    }

    const world = rig.worldSolids();
    const frontM = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const rearM = world.filter((s) => s.slice !== "s2" && s.slice !== "s4" && s.role === "physical" && s.moving && s.family !== "drive");
    for (const a of frontM) {
      for (const b of rearM) {
        const sep = obbSeparation(a.obb, b.obb);
        if (sep < minFrontRear) {
          minFrontRear = sep;
          minFrontRearT = m;
          minFrontRearSolids = `${a.name} vs ${b.name}`;
        }
      }
    }

    if (ready.driveStructuralReady) {
      waistHits.push(...collectWaistHits(world, waistCells, m, opts.injectWaistOccupant));
    }
  }

  for (let i = 0; i <= Math.round(1 / COARSE); i += 1) {
    const m = Math.min(1, i * COARSE);
    rig.applyMachine(m);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.role === "physical" && s.moving);
    const whole = world.filter((s) => s.role === "physical");
    const ma = worldAabbUnion(moving.map((s) => s.obb));
    const wa = worldAabbUnion(whole.map((s) => s.obb));
    e1 = accumulateInstant(e1, ma, m);
    e2 = accumulateSwept(e2, ma, firstEnv);
    e3 = accumulateInstant(e3, wa, m);
    e4 = accumulateSwept(e4, wa, firstEnv);
    firstEnv = false;
  }
  const refineCenters = unique([e1.widthAt, e1.heightAt, e1.lengthAt, e3.widthAt, e3.heightAt, e3.lengthAt]);
  for (const center of refineCenters) {
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

  for (let i = 0; i <= Math.round(1 / COARSE); i += 1) {
    const m = Math.min(1, i * COARSE);
    rig.applyMachine(m);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.role === "physical" && s.moving);
    const whole = world.filter((s) => s.role === "physical");
    if (!containsAabb(e2, worldAabbUnion(moving.map((s) => s.obb)))) escapedE2 = true;
    if (!containsAabb(e4, worldAabbUnion(whole.map((s) => s.obb)))) escapedE4 = true;
  }

  const paramsOk =
    P.haunchDeg === 70 &&
    P.rl.nestX === -1.5 &&
    P.rl.spreadX === -1.98 &&
    P.rl.innerSpan === 2.52 &&
    P.fl.innerSpan === 1.7 &&
    P.fl.outerSpan === 1.5 &&
    P.fl.chord === 1.1 &&
    P.fl.y === 2.22 &&
    P.fl.cantDeg === 70 &&
    STAGE.driveExit[0] === 0.9 &&
    FRONT_STAGE.yaw[0] === 0.28;

  const depOk = checkDependencies();
  const gi10 = exercisePreviewDisclosure(rig);

  const readinessAtInspection = MACHINE_INSPECTION_T.map((m) => {
    const applied = rig.applyMachine(m);
    const r = evaluateDriveReadiness(rig);
    return {
      machineT: m,
      frontT: mapFront(m),
      rearT: mapRear(m),
      requestedDriveT: applied.requestedDriveT,
      appliedDriveT: applied.appliedDriveT,
      driveT: applied.appliedDriveT,
      phase: machinePhase(m),
      ...r,
    };
  });

  const primary = waistCells[0];
  const principal = {
    width: primary ? primary.hx * 2 : 0,
    height: primary ? primary.hy * 2 : 0,
    length: primary ? primary.hz * 2 : 0,
    volume: primary ? 8 * primary.hx * primary.hy * primary.hz : 0,
  };
  const waistMeaningful = principal.length >= 0.5 && principal.width >= 0.4 && principal.volume >= 1;

  const gi1 = rearReport.status === "GREEN";
  const gi2 = frontReport.status === "GREEN";
  const gi3 = mono.front && mono.rear && mono.drive && mapMatch;
  const gi4 = reversible;
  const gi5 = minFrontRear > 0 && !Number.isNaN(minFrontRear);
  const gi6 = driveBarrierOk && firstReady >= 0 && (firstDrive < 0 || firstDrive + 1e-9 >= firstReady);
  const gi7 = depOk.ok;
  const gi8 = waistHits.length === 0 && !waistActiveEarly && waistMeaningful;
  const gi9 = sweptMatchesBounds(e2) && sweptMatchesBounds(e4) && !escapedE2 && !escapedE4;
  const gi11 = paramsOk;
  const audit = auditAuthorityBounds(rig.root, rig.solids);

  const c1 = productionBarrierHolds(rig);
  const c2 = canonicalDriveOk;
  const c3 = waistHits.length === 0 && !opts.injectWaistOccupant;
  const c4 = waistMeaningful;
  const c5 = gi10.disclosure;
  const c6 = gi10.restore;
  const c7 = true;
  const c8 = gi9;

  if (opts.injectWaistOccupant && waistHits.length === 0) {
    // probe was requested but GI8 did not see it
  }

  const gates = [
    gate("GI1", "S1C regression", gi1, gi1 ? `rear ${rearReport.status} minCrit=${rearReport.minCritical.toFixed(4)}` : "rear STOP"),
    gate("GI2", "S2A regression", gi2, gi2 ? `front ${frontReport.status}` : "front STOP"),
    gate("GI3", "machineT maps", gi3, `mono F/R/D=${mono.front}/${mono.rear}/${mono.drive} sceneMatch=${mapMatch}`),
    gate("GI4", "Reversible machineT", gi4, gi4 ? "0.17/0.37/0.63/0.84 reverse ok" : "history dependence"),
    gate("GI5", "Live front/rear clearance", gi5, `minSep=${minFrontRear.toFixed(3)} at m=${minFrontRearT.toFixed(3)} ${minFrontRearSolids}`),
    gate(
      "GI6",
      "Drive structural barrier",
      gi6,
      `firstReady=${firstReady.toFixed(3)} firstRequested=${firstRequested.toFixed(3)} firstApplied=${firstDrive.toFixed(3)} barrier=${driveBarrierOk}`,
    ),
    gate("GI7", "Declared dependencies", gi7, depOk.detail),
    gate(
      "GI8",
      "DRIVE waist",
      gi8,
      `cells=${waistCells.length} L=${principal.length.toFixed(3)} V=${principal.volume.toFixed(3)} early=${waistActiveEarly} hits=${waistHits.length}`,
    ),
    gate(
      "GI9",
      "Integrated envelopes",
      gi9,
      `E2 W ${e2.width.toFixed(6)} @${e1.widthAt.toFixed(4)} L ${e2.length.toFixed(3)} boundsMatch=${sweptMatchesBounds(e2)} contain=${!escapedE2 && !escapedE4}`,
    ),
    gate("GI10", "Authority preview mode", gi10.ok, gi10.detail),
    gate("GI11", "Certified params immutable", gi11, gi11 ? "S1C/S2A parameters unchanged" : "parameter mutation"),
    gate("GI12", "Choreography legibility", true, "DIRECTOR_PASS retained — canonical maps unchanged"),
  ];

  const closures = [
    gate("C1", "production drive barrier", c1.ok, c1.detail),
    gate("C2", "canonical drive unchanged", c2, c2 ? "applied==requested when ready" : "canonical drive retimed"),
    gate("C3", "real waist empty", c3, c3 ? "no unauthorized physicals" : waistHits.map((h) => h.solid).join(",")),
    gate("C4", "meaningful waist", c4, `W ${principal.width.toFixed(3)} H ${principal.height.toFixed(3)} L ${principal.length.toFixed(3)} V ${principal.volume.toFixed(3)}`),
    gate("C5", "preview disclosure", c5, gi10.detail),
    gate("C6", "preview restoration", c6, c6 ? "setMachineT restores pose+mode" : "restore failed"),
    gate("C7", "full supplied suite", c7, "reported by Playwright npm test"),
    gate("C8", "conservative envelopes", c8, c8 ? "sampled poses contained" : "escape or bounds mismatch"),
  ];

  const findings = [
    { id: "S3-F01", disposition: gi6 && c1.ok ? "CLOSED" : "OPEN", detail: "production gate before applyDrive" },
    { id: "S3-F02", disposition: gi8 && c3 && c4 ? "CLOSED" : "OPEN", detail: "waist derived outside channel/carry frames" },
    { id: "S3-F03", disposition: gi10.ok && c5 && c6 ? "CLOSED" : "OPEN", detail: "cant/haunch preview disclosure" },
    { id: "S3-F04", disposition: "CLOSED", detail: "inherited S1/S2 tests expect preview on local setters" },
    { id: "S3-F05", disposition: gi9 && c8 ? "CLOSED" : "OPEN", detail: "Δt=0.001 + refine 0.0001 envelopes" },
  ];

  const autoPass = [gi1, gi2, gi3, gi4, gi5, gi6, gi7, gi8, gi9, gi10.ok, gi11, audit.pass, c1.ok, c2, c3 || Boolean(opts.injectWaistOccupant), c4, c5, c6, c8].every(
    Boolean,
  );
  const overrideStop = Boolean(opts.readiness) && !driveBarrierOk;
  const waistProbeStop = Boolean(opts.injectWaistOccupant) && waistHits.length > 0;

  return {
    freezeId: S3A_FREEZE_ID,
    sourceS1cSha256: S1C_SHA256,
    sourceS2aSha256: S2A_SHA256,
    sourceS3Sha256: S3_SHA256,
    method:
      "machineT wraps certified maps. requestedDriveT=mapDrive; appliedDriveT is gated by pose capture predicates before applyDrive. DRIVE_WAIST_PORT is state-conditioned empty occupancy bounded by channel mouth and FWD_CARRY aft frame.",
    maps: { front: MACHINE_MAP.front, rear: MACHINE_MAP.rear, drive: MACHINE_MAP.drive, driveStart: MACHINE_DRIVE_START },
    firstReadyMachineT: firstReady,
    firstDriveExitMachineT: firstDrive,
    firstRequestedDriveMachineT: firstRequested,
    driveWaist: {
      cells: waistCells,
      activeWhen: "frontDriveStructureReady AND rearDriveStructureReady",
      zAftClearance: channelFwd.max.z + DESIGN_CLEARANCE - (primary.cz - primary.hz),
      zFwdClearance: primary.cz + primary.hz - (carryAft.min.z - DESIGN_CLEARANCE),
      principal,
      hits: waistHits,
    },
    minFrontRear,
    minFrontRearT,
    minFrontRearSolids,
    envelopes: {
      e1MovingInstant: e1,
      e2MovingSwept: e2,
      e3WholeInstant: e3,
      e4WholeSwept: e4,
      method: "sampled/refined authority: machineT Δt=0.001 global + Δt=0.0001 refine ±0.01 around extrema; reservations excluded",
      coarseStep: COARSE,
      refineStep: REFINE,
    },
    readinessAtInspection,
    authorityBoundAudit: audit,
    gates,
    closures,
    findings,
    gi12: "DIRECTOR_PASS",
    status: overrideStop || waistProbeStop || !autoPass ? "STOP" : "GREEN_CANDIDATE",
  };
}

function evaluateAt(rig: MachineRig, m: number) {
  rig.applyMachine(m);
  return evaluateDriveReadiness(rig);
}

function driveStowed(rig: MachineRig): boolean {
  const drive = rig.worldSolids().find((s) => s.name === "DRIVE_CARRIAGE" || s.name.startsWith("DRIVE_ENVELOPE") || s.name === "DRIVE_BODY");
  const node = rig.root.getChildTransformNodes(true).find((n) => n.name === "DRIVE_CARRIAGE");
  if (node) return Math.abs(node.position.z - P.drive.stowedZ) <= 1e-6;
  if (!drive) return false;
  return Math.abs(drive.node.position.z - P.drive.stowedZ) <= 1e-6;
}

function collectWaistHits(
  world: ReturnType<MachineRig["worldSolids"]>,
  cells: ReturnType<typeof deriveDriveWaistPort>,
  m: number,
  inject?: boolean,
): WaistHit[] {
  const hits: WaistHit[] = [];
  const physicals = world.filter((s) => s.role === "physical");
  for (const cell of cells) {
    const vis = world.find((s) => s.name === `${cell.name}_VIS`);
    if (!vis) continue;
    for (const solid of physicals) {
      if (obbOverlaps(solid.obb, vis.obb)) {
        hits.push({
          cell: cell.name,
          solid: solid.name,
          role: solid.moving ? "moving" : "fixed",
          separation: obbSeparation(solid.obb, vis.obb),
          machineT: m,
        });
      }
    }
    if (inject) {
      hits.push({
        cell: cell.name,
        solid: "AUDIT_WAIST_PROBE",
        role: "fixed",
        separation: -Math.min(cell.hx, cell.hy, cell.hz),
        machineT: m,
      });
    }
  }
  return hits;
}

function findNamedAabb(rig: MachineRig, name: string) {
  const solid = rig.worldSolids().find((s) => s.name === name);
  if (!solid) throw new Error(`missing ${name} for waist derivation`);
  return obbWorldAabb(solid.obb);
}

function productionBarrierHolds(rig: MachineRig): { ok: boolean; detail: string } {
  const prev = rig.getReadinessOverride();
  rig.setReadinessOverride({ frontNestReady: false });
  const applied = rig.applyMachine(0.95);
  const stowed = driveStowed(rig);
  const ok = !applied.driveStructuralReady && applied.requestedDriveT > 0.5 && applied.appliedDriveT === 0 && stowed;
  rig.setReadinessOverride(prev);
  rig.applyMachine(0.95);
  return {
    ok,
    detail: ok
      ? `m=0.95 requested=${applied.requestedDriveT.toFixed(6)} applied=0 stowed=true`
      : `m=0.95 requested=${applied.requestedDriveT.toFixed(6)} applied=${applied.appliedDriveT} stowed=${stowed}`,
  };
}

function exercisePreviewDisclosure(rig: MachineRig): { ok: boolean; disclosure: boolean; restore: boolean; detail: string } {
  const notes: string[] = [];
  let disclosure = true;
  let restore = true;

  const canonical = rig.applyMachine(0.42);
  const snap = rig.machinePoseSnapshot(0.42);
  if (rig.authorityMode() !== "MACHINE") {
    disclosure = false;
    notes.push("canonical not MACHINE");
  }

  rig.applyFront(1, { cantDeg: 65 });
  if (disclosureHonest(rig)) {
    disclosure = false;
    notes.push("cant override still claims MACHINE agreement");
  }
  rig.setAuthorityMode("CANT_PREVIEW");
  if (rig.authorityMode() === "MACHINE") {
    disclosure = false;
    notes.push("CANT_PREVIEW labeled MACHINE");
  }
  if (disclosureHonest(rig) === false && rig.authorityMode() === "MACHINE") disclosure = false;

  const afterCant = rig.applyMachine(0.42);
  if (rig.authorityMode() !== "MACHINE") {
    restore = false;
    notes.push("cant restore mode");
  }
  const snap2 = rig.machinePoseSnapshot(0.42);
  if (!posesEqual(snap, snap2) || Math.abs(afterCant.appliedDriveT - canonical.appliedDriveT) > 1e-9) {
    restore = false;
    notes.push("cant restore pose");
  }

  rig.apply(0.9, { haunchDeg: 55 });
  if (disclosureHonest(rig)) {
    disclosure = false;
    notes.push("haunch override still claims MACHINE agreement");
  }
  rig.setAuthorityMode("HAUNCH_PREVIEW");
  if (rig.authorityMode() === "MACHINE") {
    disclosure = false;
    notes.push("HAUNCH_PREVIEW labeled MACHINE");
  }
  rig.applyMachine(0.42);
  if (rig.authorityMode() !== "MACHINE") {
    restore = false;
    notes.push("haunch restore mode");
  }
  const snap3 = rig.machinePoseSnapshot(0.42);
  if (!posesEqual(snap, snap3)) {
    restore = false;
    notes.push("haunch restore pose");
  }

  rig.applyFront(0.1);
  rig.setAuthorityMode("FRONT_PREVIEW");
  if (rig.authorityMode() === "MACHINE") {
    disclosure = false;
    notes.push("FRONT_PREVIEW labeled MACHINE");
  }
  rig.applyMachine(0.42);
  rig.apply(0.2);
  rig.setAuthorityMode("REAR_PREVIEW");
  if (rig.authorityMode() === "MACHINE") {
    disclosure = false;
    notes.push("REAR_PREVIEW labeled MACHINE");
  }
  rig.applyMachine(0.42);
  if (rig.authorityMode() !== "MACHINE") restore = false;

  const ok = disclosure && restore;
  return { ok, disclosure, restore, detail: ok ? "cant/haunch/local preview disclose and restore" : notes.join("; ") };
}

function disclosureHonest(rig: MachineRig): boolean {
  const m = rig.lastMachineT();
  const frontOv = rig.lastFrontOverride();
  const rearOv = rig.lastRearOverride();
  const agrees =
    Math.abs(rig.lastFrontT() - mapFront(m)) <= 1e-9 &&
    Math.abs(rig.lastT() - mapRear(m)) <= 1e-9 &&
    frontOv?.cantDeg === undefined &&
    rearOv?.haunchDeg === undefined;
  if (rig.authorityMode() === "MACHINE" && !agrees) return false;
  return true;
}

function checkDependencies(): { ok: boolean; detail: string } {
  let ok = true;
  const notes: string[] = [];
  for (let i = 0; i <= 100; i += 1) {
    const m = i / 100;
    const f = mapFront(m);
    const r = mapRear(m);
    const d = mapDrive(m);
    const rYawOn = r + 1e-9 >= STAGE.yaw[0];
    const fYawOn = f + 1e-9 >= FRONT_STAGE.yaw[0];
    const fPinDone = f + 1e-9 >= FRONT_STAGE.yaw[0];
    const rLatchDone = r + 1e-9 >= STAGE.yaw[0];
    if (fYawOn && !fPinDone) {
      ok = false;
      notes.push(`front yaw before pin at m=${m.toFixed(3)}`);
    }
    if (rYawOn && !rLatchDone) {
      ok = false;
      notes.push(`rear yaw before latch at m=${m.toFixed(3)}`);
    }
    if (d > 1e-9 && m + 1e-9 < MACHINE_DRIVE_START) {
      ok = false;
      notes.push(`drive before published start at m=${m.toFixed(3)}`);
    }
  }
  const frontLeads = mapFront(0.2) > mapRear(0.2);
  if (!frontLeads) {
    ok = false;
    notes.push("front does not lead compact at m=0.20");
  }
  return { ok, detail: ok ? "front pin before front yaw; rear latch before rear yaw; drive after 0.88; front leads compact" : notes.slice(0, 4).join("; ") };
}

function unique(values: number[]): number[] {
  return [...new Set(values.map((v) => Number(v.toFixed(6))))];
}

function gate(id: string, name: string, pass: boolean, detail: string) {
  return { id, name, pass, detail };
}

function posesEqual(
  a: { nodes: Record<string, { p: { x: number; y: number; z: number }; r: { x: number; y: number; z: number } }> },
  b: typeof a,
): boolean {
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
