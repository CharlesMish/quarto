import type { Scene } from "@babylonjs/core/scene";
import type { Materials } from "../scene/materials";
import {
  evalCamTrack,
  evaluateS5Handover,
  getPathCertificateState,
  markPathCertificateStale,
  probeAxialEscape,
} from "../verify/s5Capture";
import { createMachine } from "./createMachine";
import {
  applyDriveSupersession,
  bindS5AuthoritySemanticsToRegistrationIds,
  physicallySupersedeLegacy,
  physicallySupersedeLegacyByRegistrationId,
  reenableLegacyByRegistrationId,
} from "./s5Authority";
import { buildS5Propulsion, type S5Override } from "./s5Propulsion";
import type { MachineRig } from "./types";
import { registerS5AuthorityUniverse } from "./s5Identity";

export interface S5MachineRig extends MachineRig {
  applyS5Override: (value?: S5Override) => void;
  getS5Override: () => S5Override;
  lastDriveThrustReady: () => boolean;
  peekDriveThrustReady: () => boolean;
  evaluateDriveThrustReady: () => boolean;
  s5CanPort: () => import("@babylonjs/core/Meshes/mesh").Mesh;
  probeLockEscape: (engaged?: boolean) => { blocked: boolean; hits: string[] };
}

export function createS5Machine(scene: Scene, mats: Materials): S5MachineRig {
  const rig = createMachine(scene, mats);
  const body = scene.getTransformNodeByName("DRIVE_BODY");
  if (!body) throw new Error("S5 requires DRIVE_BODY");
  applyDriveSupersession(rig.solids.map((s) => s.name));
  physicallySupersedeLegacy(rig.solids);
  const s5 = buildS5Propulsion(scene, rig.root, body, mats);
  rig.solids.push(...s5.solids);
  rig.datums.push(...s5.datums);
  registerS5AuthorityUniverse(rig, rig.solids);
  bindS5AuthoritySemanticsToRegistrationIds(rig, rig.solids);
  s5.bindAuthorityRows(rig);

  let lastThrust = false;
  const poseLock = (driveT: number): void => {
    const ov = s5.currentOverride();
    s5.applyLockPose(driveT, ov.forceUnlock ? "retract" : ov.lockGap ? "gap" : ov.forceLock ? "extend" : undefined);
  };

  const innerDrive = rig.applyDrive.bind(rig);
  rig.applyDrive = (driveT: number) => {
    const d = innerDrive(driveT);
    poseLock(d);
    return d;
  };

  const innerApply = rig.applyMachine.bind(rig);
  rig.applyMachine = ((machineT, opts) => {
    const r = innerApply(machineT, opts);
    poseLock(r.appliedDriveT);
    if (getPathCertificateState(rig) === "STALE") evalCamTrack(rig);
    const thrust = evaluateS5Handover(rig, r.appliedDriveT);
    lastThrust = thrust.driveThrustReady;
    return { ...r, driveThrustReady: thrust.driveThrustReady };
  }) as MachineRig["applyMachine"];

  const innerPreserve = rig.withPreservedPose.bind(rig);
  rig.withPreservedPose = (fn) => {
    const ov = s5.currentOverride();
    const result = innerPreserve(fn);
    s5.applyOverride(ov);
    physicallySupersedeLegacyByRegistrationId(rig, rig.solids);
    if (ov.enableLegacyEnvelope) reenableLegacyByRegistrationId(rig, rig.solids, "DRIVE_ENVELOPE");
    if (ov.enableLegacyFace) reenableLegacyByRegistrationId(rig, rig.solids, "DRIVE_FACE_AFT");
    poseLock(rig.lastDriveT());
    markPathCertificateStale(rig);
    return result;
  };

  const ext = rig as S5MachineRig;
  ext.applyS5Override = (value) => {
    physicallySupersedeLegacyByRegistrationId(rig, rig.solids);
    s5.applyOverride(value ?? {});
    if (value?.enableLegacyEnvelope) reenableLegacyByRegistrationId(rig, rig.solids, "DRIVE_ENVELOPE");
    if (value?.enableLegacyFace) reenableLegacyByRegistrationId(rig, rig.solids, "DRIVE_FACE_AFT");
    poseLock(rig.lastDriveT());
    markPathCertificateStale(rig);
  };
  ext.getS5Override = () => s5.currentOverride();
  ext.lastDriveThrustReady = () => {
    if (getPathCertificateState(rig) === "STALE") evalCamTrack(rig);
    lastThrust = evaluateS5Handover(rig).driveThrustReady;
    return lastThrust;
  };
  ext.peekDriveThrustReady = () => lastThrust;
  ext.evaluateDriveThrustReady = () => ext.lastDriveThrustReady();
  ext.s5CanPort = () => s5.canPort;
  ext.probeLockEscape = (engaged?: boolean) => probeAxialEscape(rig, engaged);
  return ext;
}
