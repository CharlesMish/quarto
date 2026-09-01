import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { KeepBox, WaistCell } from "../design/parameters";
import type { OBB } from "../math/obb";
import type { V3 } from "../math/vec";
import type { AuthoritySolid } from "./authority";

export interface Stages {
  prep: number;
  bookFold: number;
  bookLatch: number;
  yaw: number;
  roll: number;
  socket: number;
  nestLock: number;
  driveExit: number;
}

export interface ApplyOverrides {
  haunchDeg?: number;
  foldDeg?: number;
}

export interface FrontStages {
  prep: number;
  bookFold: number;
  bookPin: number;
  yaw: number;
  cant: number;
  socket: number;
  nestLock: number;
}

export interface ApplyFrontOverrides {
  cantDeg?: number;
  pivotY?: number;
  foldDeg?: number;
}

export interface DebugDatum {
  name: string;
  kind: "pivot" | "rail" | "lock" | "keep" | "volume";
  node: TransformNode;
  note: string;
}

export interface PoseSnapshot {
  t: number;
  nodes: Record<string, { p: V3; r: V3 }>;
}

export interface PairResult {
  name: string;
  a: string;
  b: string;
  minSeparation: number;
  atT: number;
  overlapping: boolean;
  aSolid?: string;
  bSolid?: string;
}

export interface InstantEnvelope {
  width: number;
  height: number;
  length: number;
  widthAt: number;
  heightAt: number;
  lengthAt: number;
}

export interface SweptEnvelope {
  width: number;
  height: number;
  length: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface EnvelopeRecord {
  e1MovingInstant: InstantEnvelope;
  e2MovingSwept: SweptEnvelope;
  e3WholeInstant: InstantEnvelope;
  e4WholeSwept: SweptEnvelope;
  method: string;
  coarseStep: number;
  refineStep: number;
}

export interface CantCandidate {
  deg: number;
  seatedHalfWidth: number;
  seatedHeight: number;
  seatedMinX: number;
  seatedMaxX: number;
  seatedMinY: number;
  seatedMaxY: number;
  minFloor: number;
  minCockpit: number;
  inboardMaxX: number;
  cockpitHit: boolean;
  floorHit: boolean;
  widthOk: boolean;
}

export interface CarryGraphNode {
  name: string;
  contacts: string[];
}

export interface CarryGraphAudit {
  pass: boolean;
  nodes: CarryGraphNode[];
  railReachesKeel: boolean;
  receiverReachesKeel: boolean;
  catchReachesKeel: boolean;
  missing: string[];
  detail: string;
}

export interface ReservationAudit {
  pass: boolean;
  gf7a: boolean;
  gf7b: boolean;
  gf7c: boolean;
  emptyVsEmpty: PairResult[];
  emptyVsFixed: PairResult[];
  movingVsProtected: PairResult[];
  exemptions: string[];
  occupancySource: string[];
  occupancyExcluded: string[];
}

export interface SweepHit {
  a: string;
  b: string;
  firstT: number;
  lastT: number;
  minSeparation: number;
}

export interface SweepResult {
  pass: boolean;
  hits: SweepHit[];
  samples: number;
  detail: string;
}

export interface ClosureRow {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

export interface HaunchCandidate {
  deg: number;
  seatedWidth: number;
  seatedHeight: number;
  seatedMaxX: number;
  seatedMinX: number;
  rollSweepWidth: number;
  minKeelClearance: number;
  minDriveClearance: number;
  inboardInChannel: boolean;
  keelHit: boolean;
  driveHit: boolean;
}

export interface GateResult {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

export interface LatchMetrics {
  pass: boolean;
  detail: string;
  minSolidClearance: number;
  minSolidClearanceT: number;
  captureDepth: number;
  captureDepthT: number;
  firstCapturedT: number;
  samples: number;
  intersections: number;
  lostCapture: number[];
}

export interface NestMetrics {
  pass: boolean;
  detail: string;
  minBoreClearance: number;
  minSolidClearance: number;
  minSolidClearanceT: number;
  throughDepth: number;
  firstCapturedT: number;
  samples: number;
  intersections: number;
  sidewaysEntry: boolean;
  lostCapture: number[];
}

export interface AuthorityBoundRow {
  name: string;
  source: string;
  registered: boolean;
  conservativeOrExact: boolean;
  meshHalf: V3;
  authorityHalf: V3;
}

export interface AuthorityBoundAudit {
  pass: boolean;
  physicalCount: number;
  unregisteredPhysical: string[];
  underbound: string[];
  rows: AuthorityBoundRow[];
}

export interface DriveMargins {
  zAft: number;
  zFwd: number;
  x: number;
  yBot: number;
  yTop: number;
  driveZ: [number, number];
  bayZ: [number, number];
}

export interface ClearanceReport {
  freezeId: string;
  sourceS1aSha256: string;
  sourceS1bSha256: string;
  method: string;
  sampleStep: number;
  refineStep: number;
  designClearance: number;
  pairs: PairResult[];
  minCritical: number;
  minCriticalPair: string;
  minCriticalSolids: string;
  minCriticalT: number;
  envelope: SweptEnvelope;
  envelopes: EnvelopeRecord;
  keepRearStbd: KeepBox;
  seatedRearPort: { min: V3; max: V3 };
  keepRearStbdPad: number;
  driveMargins: DriveMargins;
  latch: LatchMetrics;
  nest: NestMetrics;
  g8Inclusions: string[];
  g8Exemptions: string[];
  authoritySolids: Array<{
    name: string;
    family: string;
    role: string;
    moving: boolean;
    book: boolean;
    keepoutSweep: boolean;
    source: string;
  }>;
  authorityBoundAudit: AuthorityBoundAudit;
  gates: GateResult[];
  status: "GREEN" | "STOP";
  haunch: HaunchCandidate[];
  chosenHaunch: number;
}

export interface FrontClearanceReport {
  freezeId: string;
  sourceS1cSha256: string;
  sourceS2Sha256?: string;
  method: string;
  sampleStep: number;
  refineStep: number;
  designClearance: number;
  chosen: {
    innerSpan: number;
    outerSpan: number;
    chord: number;
    bookThickness: number;
    pivotY: number;
    spreadX: number;
    nestX: number;
    cantDeg: number;
    socketStroke: number;
    originZ: number;
  };
  envelopes: EnvelopeRecord;
  seatedFront: { min: V3; max: V3 };
  seatedHalfWidth: number;
  keepFwdStbd: KeepBox;
  keepFwdStbdPad: number;
  bookPin: NestMetrics;
  nest: NestMetrics;
  catch: LatchMetrics;
  minFloor: number;
  minFloorT: number;
  minFloorSolid: string;
  minCockpit: number;
  minCockpitT: number;
  minCockpitSolids: string;
  maxCockpitHalfWidth: number;
  frontMinZ: number;
  firewallMargin: number;
  carryGraph: CarryGraphAudit;
  reservations: ReservationAudit;
  cantStudy: CantCandidate[];
  authoritySolids: Array<{
    name: string;
    family: string;
    role: string;
    moving: boolean;
    book: boolean;
    slice: string;
    source: string;
    reservationKind?: string;
  }>;
  authorityBoundAudit: AuthorityBoundAudit;
  sweeps: {
    movingVsCarry: SweepResult;
    bookPinPath: SweepResult;
    nestPinPath: SweepResult;
    catchPath: SweepResult;
    foldPath: SweepResult;
    movingVsProtected: SweepResult;
  };
  closures: ClosureRow[];
  gates: GateResult[];
  status: "GREEN" | "STOP";
  rearRegression: {
    parametersIntact: boolean;
    carryMissesRearCorridor: boolean;
    bayUntouched: boolean;
    detail: string;
  };
}

export interface MachineRig {
  root: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
  keepoutNodes: TransformNode[];
  emptyVolumeNodes: TransformNode[];
  lastT: () => number;
  lastFrontT: () => number;
  lastRearStbdT: () => number;
  lastFrontStbdT: () => number;
  lastDriveT: () => number;
  lastRequestedDriveT: () => number;
  lastMachineT: () => number;
  lastFrontOverride: () => ApplyFrontOverrides | undefined;
  lastRearOverride: () => ApplyOverrides | undefined;
  authorityMode: () => import("./machineMap").AuthorityMode;
  setAuthorityMode: (mode: import("./machineMap").AuthorityMode) => void;
  setReadinessOverride: (value?: import("../verify/capturePredicates").ReadinessOverride) => void;
  getReadinessOverride: () => import("../verify/capturePredicates").ReadinessOverride | undefined;
  apply(t: number, overrides?: ApplyOverrides): Stages;
  applyFront(t: number, overrides?: ApplyFrontOverrides): FrontStages;
  applyRearStbd(t: number, overrides?: ApplyOverrides): Stages;
  applyFrontStbd(t: number, overrides?: ApplyFrontOverrides): FrontStages;
  applyDrive(driveT: number): number;
  applyMachine(
    machineT: number,
    opts?: { readiness?: import("../verify/capturePredicates").ReadinessOverride; bypassGate?: boolean },
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
  };
  evaluate(t: number): Stages;
  evaluateFront(t: number): FrontStages;
  withPreservedPose<T>(fn: () => T): T;
  worldSolids(): Array<AuthoritySolid & { obb: OBB }>;
  poseSnapshot(t: number): PoseSnapshot;
  frontPoseSnapshot(t: number): PoseSnapshot;
  drivePoseSnapshot(t: number): PoseSnapshot;
  machinePoseSnapshot(t: number): PoseSnapshot;
}

export interface WaistHit {
  cell: string;
  solid: string;
  role: "fixed" | "moving";
  separation: number;
  machineT: number;
}

export interface MachineAuthorityReport {
  freezeId: string;
  sourceS1cSha256: string;
  sourceS2aSha256: string;
  sourceS3Sha256: string;
  method: string;
  maps: {
    front: unknown;
    rear: unknown;
    drive: unknown;
    driveStart: number;
  };
  firstReadyMachineT: number;
  firstDriveExitMachineT: number;
  firstRequestedDriveMachineT: number;
  driveWaist: {
    cells: WaistCell[];
    activeWhen: string;
    zAftClearance: number;
    zFwdClearance: number;
    principal: { width: number; height: number; length: number; volume: number };
    hits: WaistHit[];
  };
  minFrontRear: number;
  minFrontRearT: number;
  minFrontRearSolids: string;
  envelopes: EnvelopeRecord;
  readinessAtInspection: Array<Record<string, unknown>>;
  authorityBoundAudit: AuthorityBoundAudit;
  gates: GateResult[];
  closures: GateResult[];
  findings: Array<{ id: string; disposition: string; detail: string }>;
  gi12: "DIRECTOR_PASS";
  status: "GREEN_CANDIDATE" | "STOP";
}

export interface Mt1Hooks {
  setT(t: number): void;
  getT(): number;
  setFrontT(t: number): void;
  getFrontT(): number;
  setFrontStbdT(t: number): void;
  getFrontStbdT(): number;
  setRearStbdT(t: number): void;
  getRearStbdT(): number;
  setMachineT(t: number): void;
  getMachineT(): number;
  getDriveT(): number;
  getRequestedDriveT(): number;
  getAppliedDriveT(): number;
  getAuthorityMode(): string;
  setReadinessOverride(value?: import("../verify/capturePredicates").ReadinessOverride): void;
  getStages(): Stages;
  getFrontStages(): FrontStages;
  getParams(): unknown;
  getReadiness(): import("../verify/capturePredicates").DriveReadiness;
  poseSnapshot(t?: number): PoseSnapshot;
  frontPoseSnapshot(t?: number): PoseSnapshot;
  machinePoseSnapshot(t?: number): PoseSnapshot;
  runClearance(): ClearanceReport;
  runFrontClearance(): FrontClearanceReport;
  runS4Authority(
    override?:
      | import("../verify/capturePredicates").ReadinessOverride
      | import("../verify/capturePredicates").MachineAuditOptions,
  ): import("../verify/s4Clearance").S4Report;
  runMachineAuthority(
    override?:
      | import("../verify/capturePredicates").ReadinessOverride
      | import("../verify/capturePredicates").MachineAuditOptions,
  ): MachineAuthorityReport;
  applyDrive(driveT: number): number;
  runHaunchStudy(): HaunchCandidate[];
  runCantStudy(): CantCandidate[];
  setCamera(preset: string): void;
  setDebug(on: boolean): void;
  setSection(on: boolean): void;
  previewHaunch(deg: number): void;
  previewCant(deg: number): void;
  clearPreview(): void;
  isPreview(): boolean;
  auditAuthority(): AuthorityBoundAudit;
}
