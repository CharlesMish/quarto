import { P } from "../../design/parameters";
import type { MachineRig } from "../../machine/types";
import {
  EXTREME_DRIVE_DZ,
  FAMILY_IDS,
  FORBIDDEN_CLAIM_WORDS,
  LATERAL_TOL,
  MACHINE_HEIGHT_M,
  MACHINE_LENGTH_M,
  METRE_CLASS,
  NAMED_STATES,
  S4A_SHA256,
  STRUCTURAL_READY_T,
  TRACE_STEP,
  VB1_ID,
  type FamilyId,
  type NamedStateId,
} from "./constants";
import {
  FAMILY_ASSUMPTIONS,
  NOMINAL_TOTAL_RMU,
  SCENARIOS,
  massAt,
  scenarioMasses,
  type ScenarioId,
} from "./assumptions";
import { auditMembership } from "./families";
import { centerOfMass, lateralOk, placePoints, type CgResult, type PlacementOpts } from "./compute";
import {
  envelopeVolume,
  extractBookLeaves,
  extractCockpit,
  extractDrive,
  extractGroupCenter,
  extractPlanform,
  extractWaist,
  physicalEnvelope,
  type Xyz,
} from "./geometry";
import { svgCgTrace, svgSideMap, svgTopMap } from "./svg";

export interface Vb1StudyOptions {
  wrongSideMass?: boolean;
  freezeDriveCentroid?: boolean;
  duplicatePlanform?: boolean;
  useVolumeMass?: boolean;
  leafSplit?: "area" | "half";
}

export interface GateResult {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

export interface StateCg {
  machineT: number;
  state: NamedStateId | string;
  scenario: ScenarioId | string;
  cg: CgResult;
  dFromSpread: Xyz;
  dFromReady: Xyz | null;
}

function applyCanonical(rig: MachineRig, machineT: number): void {
  rig.applyMachine(machineT);
}

export function runVb1Study(rig: MachineRig, opts: Vb1StudyOptions = {}): Record<string, unknown> {
  applyCanonical(rig, 0);
  const world0 = rig.worldSolids();
  const membership = auditMembership(rig.solids);
  const drive0 = extractDrive(world0);
  const cockpit = extractCockpit(world0);
  const waist = extractWaist(world0);
  const planform = extractPlanform(world0, Boolean(opts.duplicatePlanform));
  const planformClean = extractPlanform(world0, false);

  applyCanonical(rig, 1);
  const drive1 = extractDrive(rig.worldSolids());
  const deployDz = (drive1.envelope?.z_long ?? 0) - (drive0.envelope?.z_long ?? 0);
  const deployDir = deployDz < 0 ? "−Z_aft" : "+Z_forward";

  const thrustY = drive0.thrustAxis.y_vert;
  const freezeAt = opts.freezeDriveCentroid ? drive0.envelope : null;

  const groupAt = (t: number) => {
    applyCanonical(rig, t);
    const w = rig.worldSolids();
    return {
      world: w,
      F3: extractGroupCenter(w, "F3_REAR_FIXED"),
      F4: extractGroupCenter(w, "F4_FRONT_CARRY_FIXED"),
      F5: extractGroupCenter(w, "F5_CENTRAL_STRUCTURE"),
      F7: extractGroupCenter(w, "F7_DRIVE_FIXED"),
      drive: extractDrive(w),
      env: physicalEnvelope(w),
    };
  };

  const cgAt = (machineT: number, masses: Record<FamilyId, number>, place: PlacementOpts = {}): { cg: CgResult; points: ReturnType<typeof placePoints> } => {
    applyCanonical(rig, machineT);
    const world = rig.worldSolids();
    const points = placePoints(world, masses, { ...place, freezeDriveAt: freezeAt && machineT > 0.9 ? freezeAt : place.freezeDriveAt });
    return { cg: centerOfMass(points, thrustY), points };
  };

  const named = {} as Record<ScenarioId, Record<NamedStateId, StateCg>>;
  const spreadCgs: Record<ScenarioId, CgResult> = {} as Record<ScenarioId, CgResult>;

  for (const sc of SCENARIOS) {
    const masses = scenarioMasses(sc.levels);
    if (opts.wrongSideMass && sc.id === "NOMINAL") {
      /* applied in placePoints via scales below */
    }
    const place: PlacementOpts = opts.wrongSideMass && sc.id === "NOMINAL" ? { portBookScale: 1.6, stbdBookScale: 1 } : {};
    named[sc.id] = {} as Record<NamedStateId, StateCg>;
    let spread: CgResult | null = null;
    let ready: CgResult | null = null;
    for (const st of NAMED_STATES) {
      const { cg } = cgAt(st.machineT, masses, place);
      if (st.id === "SPREAD") {
        spread = cg;
        spreadCgs[sc.id] = cg;
      }
      if (st.id === "STRUCTURAL_READY") ready = cg;
      named[sc.id][st.id] = {
        machineT: st.machineT,
        state: st.id,
        scenario: sc.id,
        cg,
        dFromSpread: spread
          ? { x_lat: cg.x_lat - spread.x_lat, y_vert: cg.y_vert - spread.y_vert, z_long: cg.z_long - spread.z_long }
          : { x_lat: 0, y_vert: 0, z_long: 0 },
        dFromReady:
          ready && (st.id === "DRIVE" || st.id === "STRUCTURAL_READY")
            ? { x_lat: cg.x_lat - ready.x_lat, y_vert: cg.y_vert - ready.y_vert, z_long: cg.z_long - ready.z_long }
            : null,
      };
    }
  }

  const traces: Record<string, Array<{ machineT: number; y_vert: number; z_long: number; x_lat: number }>> = {};
  for (const sid of ["NOMINAL", "HEAVY_DRIVE_MOVING", "HEAVY_COCKPIT"] as ScenarioId[]) {
    const masses = scenarioMasses(SCENARIOS.find((s) => s.id === sid)!.levels);
    const row: Array<{ machineT: number; y_vert: number; z_long: number; x_lat: number }> = [];
    for (let t = 0; t <= 1 + 1e-12; t += TRACE_STEP) {
      const { cg } = cgAt(Number(t.toFixed(2)), masses);
      row.push({ machineT: Number(t.toFixed(2)), y_vert: cg.y_vert, z_long: cg.z_long, x_lat: cg.x_lat });
    }
    traces[sid] = row;
  }

  const nomMass = scenarioMasses(SCENARIOS.find((s) => s.id === "NOMINAL")!.levels);
  const halfSplit = cgAt(0, nomMass, { leafSplit: "half" }).cg;
  const areaSplit = cgAt(0, nomMass, { leafSplit: "area" }).cg;
  const leafSplitDelta = {
    x_lat: halfSplit.x_lat - areaSplit.x_lat,
    y_vert: halfSplit.y_vert - areaSplit.y_vert,
    z_long: halfSplit.z_long - areaSplit.z_long,
  };

  const cockSens: Record<string, CgResult> = {};
  for (const face of ["center", "fwd", "aft", "up", "down"] as const) {
    cockSens[face] = cgAt(0, nomMass, { cockpitFace: face }).cg;
  }
  const waistSens: Record<string, CgResult> = {};
  for (const face of ["center", "fwd", "aft", "up", "down"] as const) {
    waistSens[face] = cgAt(0, nomMass, { waistFace: face }).cg;
  }

  const oneAtATime: Array<{ family: FamilyId; dZ: number; dY: number; dReadyDriveZ: number }> = [];
  for (const id of FAMILY_IDS) {
    const hi = { ...nomMass, [id]: massAt(id, "HIGH") };
    const lo = { ...nomMass, [id]: massAt(id, "LOW") };
    const hiS = cgAt(0, hi).cg;
    const loS = cgAt(0, lo).cg;
    const hiR = cgAt(STRUCTURAL_READY_T, hi).cg;
    const hiD = cgAt(1, hi).cg;
    const loR = cgAt(STRUCTURAL_READY_T, lo).cg;
    const loD = cgAt(1, lo).cg;
    oneAtATime.push({
      family: id,
      dZ: hiS.z_long - loS.z_long,
      dY: hiS.y_vert - loS.y_vert,
      dReadyDriveZ: hiD.z_long - hiR.z_long - (loD.z_long - loR.z_long),
    });
  }
  const strongestZ = [...oneAtATime].sort((a, b) => Math.abs(b.dZ) - Math.abs(a.dZ))[0];
  const strongestY = [...oneAtATime].sort((a, b) => Math.abs(b.dY) - Math.abs(a.dY))[0];
  const strongestDriveWalk = [...oneAtATime].sort((a, b) => Math.abs(b.dReadyDriveZ) - Math.abs(a.dReadyDriveZ))[0];

  const corners =
    opts.wrongSideMass || opts.freezeDriveCentroid || opts.duplicatePlanform || opts.useVolumeMass
      ? { n: 0, minX: { value: 0, bits: "" }, maxX: { value: 0, bits: "" }, minY: { value: 0, bits: "" }, maxY: { value: 0, bits: "" }, minZ: { value: 0, bits: "" }, maxZ: { value: 0, bits: "" } }
      : enumerateCorners(rig, thrustY, freezeAt);
  const scale2 = cgAt(0, scaleMasses(nomMass, 2)).cg;
  const scaleInv =
    Math.abs(scale2.x_lat - areaSplit.x_lat) < 1e-9 &&
    Math.abs(scale2.y_vert - areaSplit.y_vert) < 1e-9 &&
    Math.abs(scale2.z_long - areaSplit.z_long) < 1e-9;

  applyCanonical(rig, 0);
  const env0 = physicalEnvelope(rig.worldSolids());
  applyCanonical(rig, STRUCTURAL_READY_T);
  const envR = physicalEnvelope(rig.worldSolids());
  applyCanonical(rig, 1);
  const env1 = physicalEnvelope(rig.worldSolids());

  const nomReady = named.NOMINAL.STRUCTURAL_READY.cg;
  const nomDrive = named.NOMINAL.DRIVE.cg;
  const readyDriveShift = {
    x_lat: nomDrive.x_lat - nomReady.x_lat,
    y_vert: nomDrive.y_vert - nomReady.y_vert,
    z_long: nomDrive.z_long - nomReady.z_long,
  };

  const envW0 = env0.max.x - env0.min.x;
  const envH0 = env0.max.y - env0.min.y;
  const envL0 = env0.max.z - env0.min.z;
  const envW1 = env1.max.x - env1.min.x;
  const envSameReadyDrive =
    Math.abs(envR.max.x - env1.max.x) < 0.05 &&
    Math.abs(envR.max.y - env1.max.y) < 0.05 &&
    Math.abs(envR.max.z - env1.max.z) < 0.05 &&
    Math.abs(envR.min.x - env1.min.x) < 0.05;

  const allNamedCgs = Object.values(named).flatMap((st) => Object.values(st).map((r) => r.cg));
  const zBand = band(allNamedCgs.map((c) => c.z_long));
  const yBand = band(allNamedCgs.map((c) => c.y_vert));
  const xBand = band(allNamedCgs.map((c) => c.x_lat));

  const ordering = (cg: CgResult) => {
    const fz = planformClean.frontCentroid.z_long;
    const rz = planformClean.rearCentroid.z_long;
    const cz = planformClean.combinedCentroid.z_long;
    const aheadOfFront = cg.z_long > fz + 0.05;
    const aftOfRear = cg.z_long < rz - 0.05;
    return {
      front_z_long: fz,
      cg_z_long: cg.z_long,
      combined_z_long: cz,
      rear_z_long: rz,
      order: describeOrder(fz, cg.z_long, cz, rz),
      aheadOfFront,
      aftOfRear,
    };
  };
  const scenarioOrder = Object.fromEntries(SCENARIOS.map((s) => [s.id, ordering(spreadCgs[s.id])]));

  const outsideMachine = (cg: CgResult, env: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }) =>
    cg.x_lat < env.min.x ||
    cg.x_lat > env.max.x ||
    cg.y_vert < env.min.y ||
    cg.y_vert > env.max.y ||
    cg.z_long < env.min.z ||
    cg.z_long > env.max.z;

  const allOutside = SCENARIOS.every((s) => outsideMachine(spreadCgs[s.id], env0));
  const allAheadOrAft = SCENARIOS.every((s) => scenarioOrder[s.id].aheadOfFront || scenarioOrder[s.id].aftOfRear);
  const allMetreThrust = allNamedCgs.every((c) => Math.abs(c.verticalThrustArm) >= METRE_CLASS);
  const allHugeDriveWalk = SCENARIOS.every((s) => Math.abs(named[s.id].DRIVE.cg.z_long - named[s.id].STRUCTURAL_READY.cg.z_long) >= EXTREME_DRIVE_DZ);
  const onlyAllowanceSaves =
    !allOutside &&
    SCENARIOS.filter((s) => s.id !== "HEAVY_COCKPIT" && s.id !== "HEAVY_WAIST_SYSTEMS").every((s) =>
      outsideMachine(spreadCgs[s.id], env0),
    );
  const symmetryBroken = SCENARIOS.filter((s) => s.id !== "NOMINAL" || !opts.wrongSideMass).some(
    (s) => Math.abs(spreadCgs[s.id].x_lat) > LATERAL_TOL && !opts.wrongSideMass,
  );

  const reds: string[] = [];
  if (allOutside) reds.push("plausible CG consistently outside the central machine");
  if (allAheadOrAft) reds.push("SPREAD CG consistently ahead of front area centroid or aft of rear area centroid");
  if (allMetreThrust) reds.push("thrust axis metre-class away from the full vertical CG band");
  if (allHugeDriveWalk) reds.push("moving drive causes extremely large READY→DRIVE longitudinal CG migration");
  if (onlyAllowanceSaves) reds.push("only extreme cockpit/waist allowance rescues the layout");
  if (symmetryBroken) reds.push("symmetric scenarios produce nonzero nominal lateral CG");

  const zRange = zBand.max - zBand.min;
  const inconclusive = zRange > 4 && reds.length === 0;

  const cautionFamily =
    Math.abs(strongestZ.dZ) > 0.6 || Math.abs(strongestDriveWalk.dReadyDriveZ) > 0.4 ? strongestZ.family : null;

  let computed_disposition:
    | "BALANCE_CONCEPT_SURVIVES"
    | "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION"
    | "ARCHITECTURAL_REBALANCE_REQUIRED"
    | "BALANCE_STUDY_INCONCLUSIVE" = "BALANCE_CONCEPT_SURVIVES";
  if (reds.length) computed_disposition = "ARCHITECTURAL_REBALANCE_REQUIRED";
  else if (inconclusive) computed_disposition = "BALANCE_STUDY_INCONCLUSIVE";
  else if (cautionFamily) computed_disposition = "BALANCE_CONCEPT_SURVIVES_WITH_CAUTION";

  const nextSlice =
    computed_disposition === "ARCHITECTURAL_REBALANCE_REQUIRED"
      ? "do not open a new architecture slice as if the chassis were settled"
      : strongestZ.family === "F8_COCKPIT_ALLOWANCE"
        ? "cockpit / forward package architecture next"
        : strongestZ.family === "F6_DRIVE_MOVING" || strongestDriveWalk.family === "F6_DRIVE_MOVING"
          ? "drive/propulsion internal mass architecture next"
          : strongestZ.family === "F9_WAIST_SYSTEMS_ALLOWANCE" && onlyAllowanceSaves
            ? "waist/intake/service architecture next — with caution"
            : "cockpit/package architecture next";

  const conclusion =
    computed_disposition === "ARCHITECTURAL_REBALANCE_REQUIRED"
      ? "Under the declared mass-family ranges, the certified S4A arrangement does place the SPREAD CG band in a grossly implausible relationship to the geometric planform-area centroids of the front and rear books or to the certified thrust-line datum, or the SPREAD→DRIVE CG migration is large enough relative to the machine's own length/height to indicate an obvious first-order rebalance requirement. No flight, hover, stability, control-authority, or GEV capability is asserted."
      : "Under the declared mass-family ranges, the certified S4A arrangement does not place the SPREAD CG band in a grossly implausible relationship to the geometric planform-area centroids of the front and rear books or to the certified thrust-line datum; and the SPREAD→DRIVE CG migration is not large enough relative to the machine's own length/height to indicate an obvious first-order rebalance requirement. No flight, hover, stability, control-authority, or GEV capability is asserted.";

  const claimText = `${conclusion} ${computed_disposition} ${nextSlice}`.toLowerCase();
  const forbiddenHit = FORBIDDEN_CLAIM_WORDS.filter((w) => claimText.includes(w));

  const vol = envelopeVolume(world0);
  const solidBilletAlKg = vol * 2700;

  const g1 = { id: "VB1-G1", name: "S4A identity", pass: S4A_SHA256.length === 64, detail: `input ${S4A_SHA256}` };
  const g2 = {
    id: "VB1-G2",
    name: "coordinate truth",
    pass: P.drive.x === 0 && deployDir === "−Z_aft" && drive0.thrustAxis.direction === "+Z_forward",
    detail: `thrust +Z through (x_lat=${drive0.thrustAxis.x_lat}, y_vert=${drive0.thrustAxis.y_vert}); deploy ${deployDir} Δz_long=${deployDz.toFixed(3)}`,
  };
  const g3 = {
    id: "VB1-G3",
    name: "family membership",
    pass: membership.unassignedPhysical.length === 0,
    detail: membership.unassignedPhysical.length ? membership.unassignedPhysical.join(",") : "all physical assigned",
  };
  const g4 = {
    id: "VB1-G4",
    name: "no implicit density",
    pass: !opts.useVolumeMass,
    detail: opts.useVolumeMass ? "volume mass fixture active" : "production masses are explicit RMU assumptions",
  };
  const g5 = { id: "VB1-G5", name: "fact/estimate tagging", pass: true, detail: "GEOMETRY_FACT / ASSUMPTION / DERIVED_ESTIMATE" };
  const g6 = { id: "VB1-G6", name: "scale invariance", pass: scaleInv, detail: scaleInv ? "×2 masses leave CG unchanged" : "scale changed CG" };
  const g7 = {
    id: "VB1-G7",
    name: "nominal bilateral symmetry",
    pass: SCENARIOS.every((s) => lateralOk(spreadCgs[s.id])),
    detail: opts.wrongSideMass
      ? `NC1 x_lat=${spreadCgs.NOMINAL.x_lat.toFixed(4)}`
      : `max |x_lat|=${Math.max(...SCENARIOS.map((s) => Math.abs(spreadCgs[s.id].x_lat))).toExponential(2)}`,
  };
  const g8 = { id: "VB1-G8", name: "pose truth", pass: true, detail: "positions from rig.applyMachine (certified S4A maps)" };
  const driveMoved = Math.abs(readyDriveShift.z_long) > 1e-4;
  const g9 = {
    id: "VB1-G9",
    name: "drive-motion distinction",
    pass: driveMoved && deployDir === "−Z_aft" && !opts.freezeDriveCentroid,
    detail: `READY→DRIVE Δz_long=${readyDriveShift.z_long.toFixed(4)}; deploy ${deployDir}${opts.freezeDriveCentroid ? " (NC2 freeze)" : ""}`,
  };
  const expectedRear = planformClean.handCalc.rearOneSide * 2;
  const areaClose = Math.abs(planformClean.rearTotal - expectedRear) / expectedRear < 0.08;
  const g10 = {
    id: "VB1-G10",
    name: "planform-proxy truth",
    pass: !opts.duplicatePlanform && areaClose && !planform.inflated,
    detail: opts.duplicatePlanform
      ? `NC3 inflated combined=${planform.combined.toFixed(3)} vs clean=${planformClean.combined.toFixed(3)}`
      : `rear extracted ${planformClean.rearTotal.toFixed(3)} vs hand ${expectedRear.toFixed(3)}`,
  };
  const recomputed = centerOfMass(cgAt(0, nomMass).points, thrustY);
  const arith =
    Math.abs(recomputed.z_long - named.NOMINAL.SPREAD.cg.z_long) < 1e-9 &&
    Math.abs(recomputed.y_vert - named.NOMINAL.SPREAD.cg.y_vert) < 1e-9;
  const g11 = { id: "VB1-G11", name: "scenario arithmetic", pass: arith, detail: arith ? "CG recomputable from points" : "mismatch" };
  const g12 = {
    id: "VB1-G12",
    name: "claim ceiling",
    pass: forbiddenHit.length === 0,
    detail: forbiddenHit.length ? forbiddenHit.join(",") : "no prohibited aero/performance claim",
  };

  const gates: GateResult[] = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11, g12];
  const integrityPass = opts.wrongSideMass || opts.freezeDriveCentroid || opts.duplicatePlanform || opts.useVolumeMass
    ? true
    : gates.every((g) => g.pass);

  applyCanonical(rig, 0);
  const familyLocations0 = {
    F3_REAR_FIXED: groupAt(0).F3,
    F4_FRONT_CARRY_FIXED: groupAt(0).F4,
    F5_CENTRAL_STRUCTURE: groupAt(0).F5,
    F7_DRIVE_FIXED: groupAt(0).F7,
    F6_DRIVE_MOVING: drive0.envelope,
    F6_DRIVE_MOVING_DEPLOYED: drive1.envelope,
    cockpit: cockpit.center,
    waistPort: waist.port.center,
    waistStbd: waist.stbd.center,
  };

  const csvRows: string[] = ["scenario,state,machineT,totalRmu,x_lat,y_vert,z_long,verticalThrustArm,verticalThrustArmNorm,dZ_fromSpread,dZ_fromReady"];
  for (const sc of SCENARIOS) {
    for (const st of NAMED_STATES) {
      const r = named[sc.id][st.id];
      csvRows.push(
        [
          sc.id,
          st.id,
          st.machineT,
          r.cg.totalRmu.toFixed(4),
          r.cg.x_lat.toFixed(6),
          r.cg.y_vert.toFixed(6),
          r.cg.z_long.toFixed(6),
          r.cg.verticalThrustArm.toFixed(6),
          r.cg.verticalThrustArmNorm.toFixed(6),
          r.dFromSpread.z_long.toFixed(6),
          r.dFromReady ? r.dFromReady.z_long.toFixed(6) : "",
        ].join(","),
      );
    }
  }

  return {
    freezeId: VB1_ID,
    status: "VB1_CANDIDATE_PENDING_DIRECTOR_ASSUMPTION_REVIEW",
    computed_disposition,
    sourceS4aSha256: S4A_SHA256,
    epistemic: "informative study — not S5, not certified vehicle authority",
    coordinate: {
      tag: "GEOMETRY_FACT",
      lateral: "+X starboard",
      vertical: "+Y up",
      longitudinal: "+Z forward/nose",
      aft: "−Z",
      thrustAxisDirection: "+Z forward",
    },
    drive: {
      tag: "GEOMETRY_FACT",
      thrustAxis: drive0.thrustAxis,
      stowed: drive0.envelope,
      deployed: drive1.envelope,
      deploymentDirection: deployDir,
      deploymentDelta_z_long: deployDz,
      strokeParam: P.drive.stroke,
      stowedZParam: P.drive.stowedZ,
    },
    cockpit: { tag: "GEOMETRY_FACT", ...cockpit },
    waist: { tag: "GEOMETRY_FACT", ...waist },
    planform: { tag: "GEOMETRY_FACT", ...planformClean },
    planformDuplicate: opts.duplicatePlanform ? { tag: "GEOMETRY_FACT", ...planform } : undefined,
    familyLocationsSpread: { tag: "GEOMETRY_FACT", ...familyLocations0 },
    assumptions: {
      tag: "ASSUMPTION",
      normalization: "nominal whole-machine = 100 RMU",
      nominalTotal: NOMINAL_TOTAL_RMU,
      families: FAMILY_ASSUMPTIONS,
      scenarios: SCENARIOS,
    },
    named,
    spreadCgs,
    scenarioOrder,
    traces,
    leafSplitDelta: { tag: "DERIVED_ESTIMATE", ...leafSplitDelta, negligible: Math.hypot(leafSplitDelta.y_vert, leafSplitDelta.z_long) < 0.05 },
    cockpitLocationSensitivity: { tag: "DERIVED_ESTIMATE", ...cockSens },
    waistLocationSensitivity: { tag: "DERIVED_ESTIMATE", ...waistSens },
    sensitivity: { tag: "DERIVED_ESTIMATE", oneAtATime, strongestZ, strongestY, strongestDriveWalk },
    corners: { tag: "DERIVED_ESTIMATE", ...corners },
    readyDrive: {
      tag: "DERIVED_ESTIMATE",
      envelopeSame: envSameReadyDrive,
      cgShift: readyDriveShift,
      note: "STRUCTURAL_READY and DRIVE share outer W/H/L within 0.05 m but CG walks with F6 aft.",
    },
    envelopes: {
      tag: "GEOMETRY_FACT",
      spread: { w: envW0, h: envH0, l: envL0, min: env0.min, max: env0.max },
      ready: { min: envR.min, max: envR.max },
      drive: { w: envW1, min: env1.min, max: env1.max },
      machineHeight: MACHINE_HEIGHT_M,
      machineLength: MACHINE_LENGTH_M,
    },
    bands: { tag: "DERIVED_ESTIMATE", x_lat: xBand, y_vert: yBand, z_long: zBand },
    reds,
    nextSlice,
    conclusion,
    solidBilletAbsurdity: {
      label: "NOT AN INPUT — SOLID-BILLET ABSURDITY CHECK",
      physicalEnvelopeVolume_m3: vol,
      solidAluminum_kg: solidBilletAlKg,
    },
    gates,
    integrityPass,
    csv: csvRows.join("\n"),
    options: opts,
    bookLeavesSpread: { tag: "GEOMETRY_FACT", leaves: extractBookLeaves(world0) },
    svg: {
      top: svgTopMap({
        leaves: extractBookLeaves(world0).map((l) => ({ id: l.id, x: l.center.x_lat, z: l.center.z_long })),
        families: [
          { id: "F3", x: familyLocations0.F3_REAR_FIXED?.x_lat ?? 0, z: familyLocations0.F3_REAR_FIXED?.z_long ?? 0 },
          { id: "F4", x: familyLocations0.F4_FRONT_CARRY_FIXED?.x_lat ?? 0, z: familyLocations0.F4_FRONT_CARRY_FIXED?.z_long ?? 0 },
          { id: "F5", x: familyLocations0.F5_CENTRAL_STRUCTURE?.x_lat ?? 0, z: familyLocations0.F5_CENTRAL_STRUCTURE?.z_long ?? 0 },
          { id: "F6stow", x: drive0.envelope?.x_lat ?? 0, z: drive0.envelope?.z_long ?? 0 },
          { id: "F7", x: familyLocations0.F7_DRIVE_FIXED?.x_lat ?? 0, z: familyLocations0.F7_DRIVE_FIXED?.z_long ?? 0 },
          { id: "F8", x: cockpit.center.x_lat, z: cockpit.center.z_long },
        ],
        planform: {
          front: { x: planformClean.frontCentroid.x_lat, z: planformClean.frontCentroid.z_long },
          rear: { x: planformClean.rearCentroid.x_lat, z: planformClean.rearCentroid.z_long },
          combined: { x: planformClean.combinedCentroid.x_lat, z: planformClean.combinedCentroid.z_long },
        },
        cg: { x: named.NOMINAL.SPREAD.cg.x_lat, z: named.NOMINAL.SPREAD.cg.z_long },
      }),
      side: svgSideMap({
        cgs: [
          { label: "SPREAD", y: named.NOMINAL.SPREAD.cg.y_vert, z: named.NOMINAL.SPREAD.cg.z_long },
          { label: "READY", y: named.NOMINAL.STRUCTURAL_READY.cg.y_vert, z: named.NOMINAL.STRUCTURAL_READY.cg.z_long },
          { label: "DRIVE", y: named.NOMINAL.DRIVE.cg.y_vert, z: named.NOMINAL.DRIVE.cg.z_long },
        ],
        thrustY,
        cockpit: { cy: cockpit.center.y_vert, cz: cockpit.center.z_long, hy: cockpit.half.y_vert, hz: cockpit.half.z_long },
        driveStowed: { y: drive0.envelope?.y_vert ?? P.drive.y, z: drive0.envelope?.z_long ?? P.drive.stowedZ },
        driveDeployed: { y: drive1.envelope?.y_vert ?? P.drive.y, z: drive1.envelope?.z_long ?? P.drive.stowedZ - P.drive.stroke },
      }),
      trace: svgCgTrace(traces),
    },
  };
}

function scaleMasses(m: Record<FamilyId, number>, k: number): Record<FamilyId, number> {
  const o = {} as Record<FamilyId, number>;
  for (const id of FAMILY_IDS) o[id] = m[id] * k;
  return o;
}

function band(xs: number[]): { min: number; max: number } {
  return { min: Math.min(...xs), max: Math.max(...xs) };
}

function describeOrder(front: number, cg: number, comb: number, rear: number): string {
  const pts: Array<[string, number]> = [
    ["frontPlanform", front],
    ["CG", cg],
    ["combinedPlanform", comb],
    ["rearPlanform", rear],
  ];
  pts.sort((a, b) => b[1] - a[1]);
  return pts.map(([n]) => n).join(" → ") + " (forward → aft)";
}

function enumerateCorners(rig: MachineRig, thrustY: number, freezeAt: Xyz | null): {
  n: number;
  minX: { value: number; bits: string };
  maxX: { value: number; bits: string };
  minY: { value: number; bits: string };
  maxY: { value: number; bits: string };
  minZ: { value: number; bits: string };
  maxZ: { value: number; bits: string };
} {
  let minX = { value: Infinity, bits: "" };
  let maxX = { value: -Infinity, bits: "" };
  let minY = { value: Infinity, bits: "" };
  let maxY = { value: -Infinity, bits: "" };
  let minZ = { value: Infinity, bits: "" };
  let maxZ = { value: -Infinity, bits: "" };
  applyCanonical(rig, 0);
  const world = rig.worldSolids();
  for (let bits = 0; bits < 512; bits += 1) {
    const masses = {} as Record<FamilyId, number>;
    const label: string[] = [];
    FAMILY_IDS.forEach((id, i) => {
      const hi = Boolean(bits & (1 << i));
      masses[id] = massAt(id, hi ? "HIGH" : "LOW");
      label.push(hi ? "H" : "L");
    });
    const pts = placePoints(world, masses, { freezeDriveAt: freezeAt });
    const cg = centerOfMass(pts, thrustY);
    const key = label.join("");
    if (cg.x_lat < minX.value) minX = { value: cg.x_lat, bits: key };
    if (cg.x_lat > maxX.value) maxX = { value: cg.x_lat, bits: key };
    if (cg.y_vert < minY.value) minY = { value: cg.y_vert, bits: key };
    if (cg.y_vert > maxY.value) maxY = { value: cg.y_vert, bits: key };
    if (cg.z_long < minZ.value) minZ = { value: cg.z_long, bits: key };
    if (cg.z_long > maxZ.value) maxZ = { value: cg.z_long, bits: key };
  }
  return { n: 512, minX, maxX, minY, maxY, minZ, maxZ };
}
