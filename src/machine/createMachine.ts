import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";
import { deriveDriveWaistPort, mirrorSeatedRearKeepout, P } from "../design/parameters";
import { gateAppliedDrive, mapDrive, mapFront, mapRear, type AuthorityMode } from "./machineMap";
import { makeObb, obbWorldAabb, worldAabbUnion, type OBB } from "../math/obb";
import { evaluateDriveReadiness, type ReadinessOverride } from "../verify/capturePredicates";
import { deg, mix } from "../math/stage";
import type { Materials } from "../scene/materials";
import type { AuthoritySolid } from "./authority";
import { buildChannelStbd } from "./channelStbd";
import { buildDrive } from "./drive";
import { buildFrontLeft } from "./frontLeft";
import { buildFrontRight } from "./frontRight";
import { evaluateFrontStages } from "./frontTransform";
import { buildFwdCarry } from "./fwdCarry";
import { buildFwdCarryStbd } from "./fwdCarryStbd";
import { buildKeel } from "./keel";
import { buildReservations } from "./reservations";
import { buildRearLeft } from "./rearLeft";
import { buildRearRight } from "./rearRight";
import { STBD } from "./side";
import { evaluateStages } from "./transform";
import type {
  ApplyFrontOverrides,
  ApplyOverrides,
  DebugDatum,
  FrontStages,
  MachineRig,
  PoseSnapshot,
  Stages,
} from "./types";

export function createMachine(scene: Scene, mats: Materials): MachineRig {
  const root = new TransformNode("MT1_S2_ROOT", scene);

  const keel = buildKeel(scene, root, mats);
  const rl = buildRearLeft(scene, root, mats);
  const rr = buildRearRight(scene, root, mats);
  const drive = buildDrive(scene, root, mats);
  const fl = buildFrontLeft(scene, root, mats);
  const fr = buildFrontRight(scene, root, mats);
  const carry = buildFwdCarry(scene, root, mats);
  const carryStbd = buildFwdCarryStbd(scene, root, mats);
  const channelStbd = buildChannelStbd(scene, root, mats);

  poseRearLeft(rl, 0.9);
  poseFrontLeft(fl, 1);
  poseRearRight(rr, 0.9);
  poseFrontRight(fr, 1);
  forceWorldTree(root);
  const seatedPort = worldAabbUnion(
    rl.solids.filter((s) => s.book && s.role === "physical").map((s) => solidToObb(s)),
  );
  const rearStbdKeep = mirrorSeatedRearKeepout(seatedPort.min, seatedPort.max);
  const seatedFront = worldAabbUnion(
    fl.solids.filter((s) => s.role === "physical" && s.moving).map((s) => solidToObb(s)),
  );
  const fwdStbdKeep = mirrorSeatedRearKeepout(seatedFront.min, seatedFront.max, P.keep.fwdStbdPad);
  const seatedRearStbd = worldAabbUnion(
    rr.solids.filter((s) => s.book && s.role === "physical").map((s) => solidToObb(s)),
  );
  const seatedFrontStbd = worldAabbUnion(
    fr.solids.filter((s) => s.role === "physical" && s.moving).map((s) => solidToObb(s)),
  );
  const channelFwd = keel.solids.find((s) => s.name === "CHANNEL_FRAME_FWD");
  const carryAft = carry.solids.find((s) => s.name === "FWD_FRAME_AFT");
  const channelFwdStbd = channelStbd.solids.find((s) => s.name === "CHANNEL_FRAME_STBD_FWD");
  const carryAftStbd = carryStbd.solids.find((s) => s.name === "FWD_STBD_FRAME_AFT");
  if (!channelFwd || !carryAft) throw new Error("waist derivation missing CHANNEL_FRAME_FWD or FWD_FRAME_AFT");
  if (!channelFwdStbd || !carryAftStbd) throw new Error("starboard waist derivation missing frames");
  const driveWaistPort = deriveDriveWaistPort(seatedFront, seatedPort, {
    channelFwd: obbWorldAabb(solidToObb(channelFwd)),
    carryAft: obbWorldAabb(solidToObb(carryAft)),
  });
  const driveWaistStbd = deriveDriveWaistPort(
    seatedFrontStbd,
    seatedRearStbd,
    {
      channelFwd: obbWorldAabb(solidToObb(channelFwdStbd)),
      carryAft: obbWorldAabb(solidToObb(carryAftStbd)),
    },
    undefined,
    "DRIVE_WAIST_STBD",
  );
  const keep = buildReservations(scene, root, mats, rearStbdKeep, fwdStbdKeep, [...driveWaistPort, ...driveWaistStbd], true);

  const datums: DebugDatum[] = [
    { name: "MT1_S4_ROOT", kind: "pivot", node: root, note: "Bilateral machine datum" },
    ...keel.datums,
    ...channelStbd.datums,
    ...rl.datums,
    ...rr.datums,
    ...drive.datums,
    ...fl.datums,
    ...fr.datums,
    ...carry.datums,
    ...carryStbd.datums,
    ...keep.datums,
  ];
  const solids: AuthoritySolid[] = [
    ...keel.solids,
    ...channelStbd.solids,
    ...rl.solids,
    ...rr.solids,
    ...drive.solids,
    ...fl.solids,
    ...fr.solids,
    ...carry.solids,
    ...carryStbd.solids,
    ...keep.solids,
  ];
  const emptyVolumeNodes = keel.datums.filter((d) => d.kind === "volume").map((d) => d.node);
  emptyVolumeNodes.push(...channelStbd.datums.filter((d) => d.kind === "volume").map((d) => d.node));
  emptyVolumeNodes.push(...drive.datums.filter((d) => d.kind === "volume").map((d) => d.node));

  const rearMoving = [
    rl.carriage,
    rl.yaw,
    rl.roll,
    rl.bookHinge,
    rl.bookLatch,
    rl.spreadLock,
    rl.nestBolt,
    drive.carriage,
  ];
  const rearStbdMoving = [rr.carriage, rr.yaw, rr.roll, rr.bookHinge, rr.bookLatch, rr.spreadLock, rr.nestBolt];
  const frontMoving = [fl.carriage, fl.yaw, fl.cant, fl.bookHinge, fl.bookPin, fl.nestPin, fl.spreadLock];
  const frontStbdMoving = [fr.carriage, fr.yaw, fr.cant, fr.bookHinge, fr.bookPin, fr.nestPin, fr.spreadLock];
  const driveMoving = [drive.carriage];

  let appliedT = 0;
  let appliedFrontT = 0;
  let appliedRearStbdT = 0;
  let appliedFrontStbdT = 0;
  let appliedDriveT = 0;
  let requestedDriveT = 0;
  let appliedMachineT = 0;
  let authorityMode: AuthorityMode = "MACHINE";
  let appliedOverride: ApplyOverrides | undefined;
  let appliedFrontOverride: ApplyFrontOverrides | undefined;
  let readinessOverride: ReadinessOverride | undefined;

  const apply = (t: number, overrides?: ApplyOverrides): Stages => {
    const s = evaluateStages(t);
    const haunch = overrides?.haunchDeg ?? P.haunchDeg;
    rl.spreadLock.rotation.z = s.prep * deg(P.rl.spreadLockDeg);
    rl.bookHinge.rotation.z = s.bookFold * deg(P.rl.foldDeg);
    rl.bookLatch.rotation.z = s.bookLatch * deg(P.rl.latchDeg);
    rl.yaw.rotation.y = s.yaw * deg(P.rl.yawDeg);
    rl.roll.rotation.x = s.roll * deg(haunch);
    rl.carriage.position.x = mix(P.rl.spreadX, P.rl.nestX, s.socket);
    rl.carriage.position.y = P.rl.y;
    rl.carriage.position.z = P.rl.z;
    rl.nestBolt.position.z = mix(P.rl.nestBoltRetractZ, P.rl.nestBoltExtendZ, s.nestLock);
    drive.carriage.position.x = P.drive.x;
    drive.carriage.position.y = P.driveRail.y;
    drive.carriage.position.z = mix(P.drive.stowedZ, P.drive.stowedZ - P.drive.stroke, s.driveExit);
    forceWorldTree(root);
    appliedT = t;
    appliedOverride = overrides;
    return s;
  };

  const applyFront = (t: number, overrides?: ApplyFrontOverrides): FrontStages => {
    const s = evaluateFrontStages(t);
    const cantDeg = overrides?.cantDeg ?? P.fl.cantDeg;
    const pivotY = overrides?.pivotY ?? P.fl.y;
    fl.spreadLock.rotation.z = s.prep * deg(P.fl.spreadLockDeg);
    fl.bookHinge.rotation.z = s.bookFold * deg(P.fl.foldDeg);
    fl.bookPin.position.y = mix(P.fl.bookPinRetractY, P.fl.bookPinExtendY, s.bookPin);
    fl.yaw.rotation.y = s.yaw * deg(P.fl.yawDeg);
    fl.cant.rotation.x = s.cant * deg(cantDeg);
    fl.carriage.position.x = mix(P.fl.spreadX, P.fl.nestX, s.socket);
    fl.carriage.position.y = pivotY;
    fl.carriage.position.z = P.fl.z;
    fl.nestPin.position.x = mix(P.fl.nestPinRetractX, P.fl.nestPinExtendX, s.nestLock);
    forceWorldTree(root);
    appliedFrontT = t;
    appliedFrontOverride = overrides;
    return s;
  };

  const applyRearStbd = (t: number, overrides?: ApplyOverrides): Stages => {
    const s = evaluateStages(t);
    const haunch = overrides?.haunchDeg ?? P.haunchDeg;
    rr.spreadLock.rotation.z = s.prep * deg(P.rl.spreadLockDeg);
    rr.bookHinge.rotation.z = s.bookFold * deg(overrides?.foldDeg ?? STBD.rear.foldDeg);
    rr.bookLatch.rotation.z = s.bookLatch * deg(STBD.rear.latchDeg);
    rr.yaw.rotation.y = s.yaw * deg(STBD.rear.yawDeg);
    rr.roll.rotation.x = s.roll * deg(haunch);
    rr.carriage.position.x = mix(STBD.rear.spreadX, STBD.rear.nestX, s.socket);
    rr.carriage.position.y = P.rl.y;
    rr.carriage.position.z = P.rl.z;
    rr.nestBolt.position.z = mix(P.rl.nestBoltRetractZ, P.rl.nestBoltExtendZ, s.nestLock);
    forceWorldTree(root);
    appliedRearStbdT = t;
    return s;
  };

  const applyFrontStbd = (t: number, overrides?: ApplyFrontOverrides): FrontStages => {
    const s = evaluateFrontStages(t);
    const cantDeg = overrides?.cantDeg ?? P.fl.cantDeg;
    const pivotY = overrides?.pivotY ?? P.fl.y;
    fr.spreadLock.rotation.z = s.prep * deg(P.fl.spreadLockDeg);
    fr.bookHinge.rotation.z = s.bookFold * deg(overrides?.foldDeg ?? STBD.front.foldDeg);
    fr.bookPin.position.y = mix(P.fl.bookPinRetractY, P.fl.bookPinExtendY, s.bookPin);
    fr.yaw.rotation.y = s.yaw * deg(STBD.front.yawDeg);
    fr.cant.rotation.x = s.cant * deg(cantDeg);
    fr.carriage.position.x = mix(STBD.front.spreadX, STBD.front.nestX, s.socket);
    fr.carriage.position.y = pivotY;
    fr.carriage.position.z = P.fl.z;
    fr.nestPin.position.x = mix(STBD.front.nestPinRetractX, STBD.front.nestPinExtendX, s.nestLock);
    forceWorldTree(root);
    appliedFrontStbdT = t;
    return s;
  };

  const liveWorld = () => {
    forceWorldTree(root);
    return solids.map((spec) => ({ ...spec, obb: solidToObb(spec) }));
  };

  const applyDrive = (driveT: number): number => {
    const d = Math.min(1, Math.max(0, driveT));
    drive.carriage.position.x = P.drive.x;
    drive.carriage.position.y = P.driveRail.y;
    drive.carriage.position.z = mix(P.drive.stowedZ, P.drive.stowedZ - P.drive.stroke, d);
    forceWorldTree(root);
    appliedDriveT = d;
    return d;
  };

  const applyMachine = (
    machineT: number,
    opts?: { readiness?: ReadinessOverride; bypassGate?: boolean },
  ): {
    machineT: number;
    frontT: number;
    rearT: number;
    frontPortT: number;
    frontStbdT: number;
    rearPortT: number;
    rearStbdT: number;
    driveT: number;
    requestedDriveT: number;
    appliedDriveT: number;
    driveStructuralReady: boolean;
  } => {
    const m = Math.min(1, Math.max(0, machineT));
    const rearT = mapRear(m);
    const frontT = mapFront(m);
    requestedDriveT = mapDrive(m);
    apply(rearT);
    applyFront(frontT);
    applyRearStbd(rearT);
    applyFrontStbd(frontT);
    forceWorldTree(root);
    const ready = evaluateDriveReadiness(
      { worldSolids: liveWorld } as MachineRig,
      opts?.readiness ?? readinessOverride,
    );
    const gated = opts?.bypassGate ? requestedDriveT : gateAppliedDrive(requestedDriveT, ready.driveStructuralReady);
    applyDrive(gated);
    appliedMachineT = m;
    authorityMode = "MACHINE";
    return {
      machineT: m,
      frontT,
      rearT,
      frontPortT: frontT,
      frontStbdT: frontT,
      rearPortT: rearT,
      rearStbdT: rearT,
      driveT: gated,
      requestedDriveT,
      appliedDriveT: gated,
      driveStructuralReady: ready.driveStructuralReady,
    };
  };

  const withPreservedPose = <T>(fn: () => T): T => {
    const t = appliedT;
    const ft = appliedFrontT;
    const rst = appliedRearStbdT;
    const fst = appliedFrontStbdT;
    const dt = appliedDriveT;
    const req = requestedDriveT;
    const mt = appliedMachineT;
    const mode = authorityMode;
    const o = appliedOverride;
    const fo = appliedFrontOverride;
    const result = fn();
    apply(t, o);
    applyFront(ft, fo);
    applyRearStbd(rst);
    applyFrontStbd(fst);
    applyDrive(dt);
    requestedDriveT = req;
    appliedMachineT = mt;
    authorityMode = mode;
    return result;
  };

  applyMachine(0);

  return {
    root,
    datums,
    solids,
    keepoutNodes: keep.nodes,
    emptyVolumeNodes,
    lastT: () => appliedT,
    lastFrontT: () => appliedFrontT,
    lastRearStbdT: () => appliedRearStbdT,
    lastFrontStbdT: () => appliedFrontStbdT,
    lastDriveT: () => appliedDriveT,
    lastRequestedDriveT: () => requestedDriveT,
    lastMachineT: () => appliedMachineT,
    lastFrontOverride: () => appliedFrontOverride,
    lastRearOverride: () => appliedOverride,
    authorityMode: () => authorityMode,
    setAuthorityMode: (mode: AuthorityMode) => {
      authorityMode = mode;
    },
    setReadinessOverride: (value?: ReadinessOverride) => {
      readinessOverride = value;
    },
    getReadinessOverride: () => readinessOverride,
    apply,
    applyFront,
    applyRearStbd,
    applyFrontStbd,
    applyDrive,
    applyMachine,
    evaluate: evaluateStages,
    evaluateFront: evaluateFrontStages,
    withPreservedPose,
    worldSolids: liveWorld,
    poseSnapshot(t: number): PoseSnapshot {
      return withPreservedPose(() => {
        apply(t);
        return snapshotOf(t, rearMoving);
      });
    },
    frontPoseSnapshot(t: number): PoseSnapshot {
      return withPreservedPose(() => {
        applyFront(t);
        return snapshotOf(t, frontMoving);
      });
    },
    drivePoseSnapshot(t: number): PoseSnapshot {
      return withPreservedPose(() => {
        applyDrive(t);
        return snapshotOf(t, driveMoving);
      });
    },
    machinePoseSnapshot(t: number): PoseSnapshot {
      return withPreservedPose(() => {
        applyMachine(t);
        return snapshotOf(t, [...rearMoving, ...rearStbdMoving, ...frontMoving, ...frontStbdMoving, ...driveMoving]);
      });
    },
  };
}

function snapshotOf(t: number, moving: TransformNode[]): PoseSnapshot {
  const nodes: PoseSnapshot["nodes"] = {};
  for (const n of moving) {
    nodes[n.name] = {
      p: { x: n.position.x, y: n.position.y, z: n.position.z },
      r: { x: n.rotation.x, y: n.rotation.y, z: n.rotation.z },
    };
  }
  return { t, nodes };
}

function poseRearLeft(rl: ReturnType<typeof buildRearLeft>, t: number): void {
  const s = evaluateStages(t);
  rl.spreadLock.rotation.z = s.prep * deg(P.rl.spreadLockDeg);
  rl.bookHinge.rotation.z = s.bookFold * deg(P.rl.foldDeg);
  rl.bookLatch.rotation.z = s.bookLatch * deg(P.rl.latchDeg);
  rl.yaw.rotation.y = s.yaw * deg(P.rl.yawDeg);
  rl.roll.rotation.x = s.roll * deg(P.haunchDeg);
  rl.carriage.position.x = mix(P.rl.spreadX, P.rl.nestX, s.socket);
  rl.carriage.position.y = P.rl.y;
  rl.carriage.position.z = P.rl.z;
  rl.nestBolt.position.z = mix(P.rl.nestBoltRetractZ, P.rl.nestBoltExtendZ, s.nestLock);
}

function poseRearRight(rr: ReturnType<typeof buildRearRight>, t: number): void {
  const s = evaluateStages(t);
  rr.spreadLock.rotation.z = s.prep * deg(P.rl.spreadLockDeg);
  rr.bookHinge.rotation.z = s.bookFold * deg(STBD.rear.foldDeg);
  rr.bookLatch.rotation.z = s.bookLatch * deg(STBD.rear.latchDeg);
  rr.yaw.rotation.y = s.yaw * deg(STBD.rear.yawDeg);
  rr.roll.rotation.x = s.roll * deg(P.haunchDeg);
  rr.carriage.position.x = mix(STBD.rear.spreadX, STBD.rear.nestX, s.socket);
  rr.carriage.position.y = P.rl.y;
  rr.carriage.position.z = P.rl.z;
  rr.nestBolt.position.z = mix(P.rl.nestBoltRetractZ, P.rl.nestBoltExtendZ, s.nestLock);
}

function poseFrontRight(fr: ReturnType<typeof buildFrontRight>, t: number): void {
  const s = evaluateFrontStages(t);
  fr.spreadLock.rotation.z = s.prep * deg(P.fl.spreadLockDeg);
  fr.bookHinge.rotation.z = s.bookFold * deg(STBD.front.foldDeg);
  fr.bookPin.position.y = mix(P.fl.bookPinRetractY, P.fl.bookPinExtendY, s.bookPin);
  fr.yaw.rotation.y = s.yaw * deg(STBD.front.yawDeg);
  fr.cant.rotation.x = s.cant * deg(P.fl.cantDeg);
  fr.carriage.position.x = mix(STBD.front.spreadX, STBD.front.nestX, s.socket);
  fr.carriage.position.y = P.fl.y;
  fr.carriage.position.z = P.fl.z;
  fr.nestPin.position.x = mix(STBD.front.nestPinRetractX, STBD.front.nestPinExtendX, s.nestLock);
}

function poseFrontLeft(fl: ReturnType<typeof buildFrontLeft>, t: number): void {
  const s = evaluateFrontStages(t);
  fl.spreadLock.rotation.z = s.prep * deg(P.fl.spreadLockDeg);
  fl.bookHinge.rotation.z = s.bookFold * deg(P.fl.foldDeg);
  fl.bookPin.position.y = mix(P.fl.bookPinRetractY, P.fl.bookPinExtendY, s.bookPin);
  fl.yaw.rotation.y = s.yaw * deg(P.fl.yawDeg);
  fl.cant.rotation.x = s.cant * deg(P.fl.cantDeg);
  fl.carriage.position.x = mix(P.fl.spreadX, P.fl.nestX, s.socket);
  fl.carriage.position.y = P.fl.y;
  fl.carriage.position.z = P.fl.z;
  fl.nestPin.position.x = mix(P.fl.nestPinRetractX, P.fl.nestPinExtendX, s.nestLock);
}

export function forceWorldTree(node: Node): void {
  if ("computeWorldMatrix" in node) {
    (node as TransformNode).computeWorldMatrix(true);
  }
  for (const child of node.getChildren()) {
    forceWorldTree(child);
  }
}

export function solidToObb(spec: AuthoritySolid): OBB {
  const wm = spec.node.getWorldMatrix();
  const center = Vector3.TransformCoordinates(
    new Vector3(spec.localCenter.x, spec.localCenter.y, spec.localCenter.z),
    wm,
  );
  const axisX = Vector3.TransformNormal(new Vector3(1, 0, 0), wm);
  const axisY = Vector3.TransformNormal(new Vector3(0, 1, 0), wm);
  const axisZ = Vector3.TransformNormal(new Vector3(0, 0, 1), wm);
  return makeObb(
    spec.name,
    spec.family,
    { x: center.x, y: center.y, z: center.z },
    { x: axisX.x, y: axisX.y, z: axisX.z },
    { x: axisY.x, y: axisY.y, z: axisY.z },
    { x: axisZ.x, y: axisZ.y, z: axisZ.z },
    spec.localHalf,
  );
}
