import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
  S5P,
  S5_DOG_IDS,
  S5_FOLLOWER_PORT,
  S5_FOLLOWER_TOP,
  S5_LOCK_CAM_Z1,
  S5_LOCK_EXTEND,
  S5_LOCK_PIN_RETRACT_X,
  S5_LOCK_PIN_RETRACT_Y_TOP,
  S5_LOCK_PIN_Z_LOCAL,
  S5_LOCK_PORT_Y,
  S5_LOCK_TOP_X,
  S5_PIN_SIZE,
  S5_REVERSE_JAM_A_OFFSET,
  s5GuideAperture,
  s5LockExtension,
  s5TrackLayout,
  s5TrackFacePieceLayouts,
  type S5DogId,
} from "../design/s5Parameters";
import { P } from "../design/parameters";
import { box, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import { markS5Class } from "./s5Authority";
import {
  auditS5AuthorityIdentity,
  getS5AuthorityIdentityBinding,
  registrationIdOf,
} from "./s5Identity";
import type { DebugDatum } from "./types";

export interface S5Override {
  blockPassage?: boolean;
  oversizedCore?: boolean;
  shortSpigot?: boolean;
  blockReceiver?: boolean;
  removeDog?: S5DogId;
  removeLock?: S5DogId;
  bottomDog?: boolean;
  disconnectFrame?: boolean;
  railsOnly?: boolean;
  enableLegacyEnvelope?: boolean;
  enableLegacyFace?: boolean;
  forceLock?: boolean;
  forceUnlock?: boolean;
  oldTopFrame?: boolean;
  envProtrusion?: boolean;
  lockGap?: boolean;
  floatShoulder?: S5DogId;
  camGap?: S5DogId;
  openCam?: S5DogId;
  solidGuide?: boolean;
  trackFloat?: boolean;
  zeroMargin?: boolean;
  railIntrude?: boolean;
  backingPlug?: boolean;
  namedIntrude?: boolean;
  unclassifiedIntrude?: boolean;
  /** Disable the required PORT B CAM piece without changing nominal geometry. */
  missingTrackPiece?: boolean;
  /** Disable every required PORT B piece except MOUTH. */
  missingBFaces?: boolean;
  /** Enable a real corridor obstruction with all lock/track metadata removed. */
  untaggedCorridorSolid?: boolean;
  /** Alias for the existing physical middle-path intrusion fixture. */
  middlePathIntruder?: boolean;
  /** Moving untagged matter that crosses PORT A CAM before capture. */
  pathMovingUntagged?: boolean;
  /** Physical rail obstruction carrying a forged approved-looking family. */
  forgedSurroundingFamily?: boolean;
  /** Untagged row enabled only while it crosses PORT CAM at mid-path. */
  midpathTransientRow?: boolean;
  /** Registered moving fixture whose live authority name aliases S5_LOCK_PIN_PORT. */
  duplicateAuthorityName?: boolean;
  /** Distinct registered moving row overlapping the PORT pin under a unique name. */
  duplicateMovingRow?: boolean;
  /** Contract-conformance probe: move the registered STBD spigot onto the PORT interface. */
  wrongSectorSpigotReceiver?: boolean;
  entryBlock?: boolean;
  reverseJam?: boolean;
}

const s5 = { moving: false, book: false, keepoutSweep: false, slice: "shared" as const };
const s5m = { ...s5, moving: true, keepoutSweep: true };

export type S5LockAssembly = "MOVING_LOCK_ASSEMBLY" | "FIXED_TRACK_ASSEMBLY";

function tagAssembly(mesh: Mesh, assembly: S5LockAssembly): Mesh {
  mesh.metadata = { ...(mesh.metadata ?? {}), assembly, subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
  return mesh;
}

function reg(
  solids: AuthoritySolid[],
  mesh: ReturnType<typeof box>,
  family: string,
  opts: Parameters<typeof registerBox>[3],
) {
  const m = registerBox(solids, mesh, family, opts);
  markS5Class(m.name, "NEW_S5_PHYSICAL");
  return m;
}

export interface S5Build {
  root: TransformNode;
  canPort: Mesh;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
  applyOverride: (opts: S5Override) => void;
  bindAuthorityRows: (owner: object) => void;
  currentOverride: () => S5Override;
  applyLockPose: (driveT: number, force?: "extend" | "retract" | "gap") => void;
  pins: Record<S5DogId, Mesh>;
}



export function buildS5Propulsion(
  scene: Scene,
  parent: TransformNode,
  driveBody: TransformNode,
  mats: Materials,
): S5Build {
  const root = node("S5_PROPULSION", scene, parent);
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const coreY = P.drive.y;
  const halfL = P.drive.l / 2;

  const canPort = addSegmentedCanWalls(scene, driveBody, mats, solids);

  const recvZ = halfL - S5P.receiverDepth / 2;
  const recvWallX = (S5P.receiverOuterW - S5P.receiverInnerW) / 2;
  const recvWallY = (S5P.receiverOuterH - S5P.receiverInnerH) / 2;
  const receiverPort = reg(
    solids,
    box(scene, "S5_RECEIVER_PORT", driveBody, mats.mechanism, [recvWallX, S5P.receiverOuterH, S5P.receiverDepth], [
      -(S5P.receiverOuterW + S5P.receiverInnerW) / 4,
      0,
      recvZ,
    ]),
    "s5-receiver",
    s5m,
  );
  reg(
    solids,
    box(scene, "S5_RECEIVER_STBD", driveBody, mats.mechanism, [recvWallX, S5P.receiverOuterH, S5P.receiverDepth], [
      (S5P.receiverOuterW + S5P.receiverInnerW) / 4,
      0,
      recvZ,
    ]),
    "s5-receiver",
    s5m,
  );
  reg(
    solids,
    box(scene, "S5_RECEIVER_TOP", driveBody, mats.mechanism, [S5P.receiverInnerW, recvWallY, S5P.receiverDepth], [
      0,
      (S5P.receiverOuterH + S5P.receiverInnerH) / 4,
      recvZ,
    ]),
    "s5-receiver",
    s5m,
  );
  reg(
    solids,
    box(scene, "S5_RECEIVER_BOT", driveBody, mats.mechanism, [S5P.receiverInnerW, recvWallY, S5P.receiverDepth], [
      0,
      -(S5P.receiverOuterH + S5P.receiverInnerH) / 4,
      recvZ,
    ]),
    "s5-receiver",
    s5m,
  );

  const dogZ = halfL - S5P.dogL / 2;
  const dogs: Record<S5DogId, Mesh> = {
    PORT: reg(
      solids,
      box(scene, "S5_SEAT_TONGUE_PORT", driveBody, mats.lock, [S5P.dogW, S5P.dogH, S5P.dogL], [-(P.drive.w - S5P.dogW) / 2, 0, dogZ]),
      "s5-seat-tongue",
      s5m,
    ),
    STARBOARD: reg(
      solids,
      box(scene, "S5_SEAT_TONGUE_STARBOARD", driveBody, mats.lock, [S5P.dogW, S5P.dogH, S5P.dogL], [(P.drive.w - S5P.dogW) / 2, 0, dogZ]),
      "s5-seat-tongue",
      s5m,
    ),
    TOP_PORT: reg(
      solids,
      box(scene, "S5_SEAT_TONGUE_TOP_PORT", driveBody, mats.lock, [S5P.dogH, S5P.dogW, S5P.dogL], [-0.22, (P.drive.h - S5P.dogW) / 2, dogZ]),
      "s5-seat-tongue",
      s5m,
    ),
    TOP_STARBOARD: reg(
      solids,
      box(scene, "S5_SEAT_TONGUE_TOP_STARBOARD", driveBody, mats.lock, [S5P.dogH, S5P.dogW, S5P.dogL], [0.22, (P.drive.h - S5P.dogW) / 2, dogZ]),
      "s5-seat-tongue",
      s5m,
    ),
  };

  const pinZ = S5_LOCK_PIN_Z_LOCAL;
  const pr = S5_PIN_SIZE.radial;
  const ph = S5_PIN_SIZE.height;
  const pa = S5_PIN_SIZE.axial;
  const pinLocalYPort = S5_LOCK_PORT_Y - P.drive.y;
  const pins: Record<S5DogId, Mesh> = {
    PORT: tagAssembly(
      reg(
        solids,
        box(scene, "S5_LOCK_PIN_PORT", driveBody, mats.lock, [pr, ph, pa], [-S5_LOCK_PIN_RETRACT_X, pinLocalYPort, pinZ]),
        "s5-lock",
        s5m,
      ),
      "MOVING_LOCK_ASSEMBLY",
    ),
    STARBOARD: tagAssembly(
      reg(
        solids,
        box(scene, "S5_LOCK_PIN_STARBOARD", driveBody, mats.lock, [pr, ph, pa], [S5_LOCK_PIN_RETRACT_X, pinLocalYPort, pinZ]),
        "s5-lock",
        s5m,
      ),
      "MOVING_LOCK_ASSEMBLY",
    ),
    TOP_PORT: tagAssembly(
      reg(
        solids,
        box(scene, "S5_LOCK_PIN_TOP_PORT", driveBody, mats.lock, [ph, pr, pa], [-S5_LOCK_TOP_X, S5_LOCK_PIN_RETRACT_Y_TOP, pinZ]),
        "s5-lock",
        s5m,
      ),
      "MOVING_LOCK_ASSEMBLY",
    ),
    TOP_STARBOARD: tagAssembly(
      reg(
        solids,
        box(scene, "S5_LOCK_PIN_TOP_STARBOARD", driveBody, mats.lock, [ph, pr, pa], [S5_LOCK_TOP_X, S5_LOCK_PIN_RETRACT_Y_TOP, pinZ]),
        "s5-lock",
        s5m,
      ),
      "MOVING_LOCK_ASSEMBLY",
    ),
  };
  const fp = S5_FOLLOWER_PORT;
  const ft = S5_FOLLOWER_TOP;
  const shoes: Record<S5DogId, Mesh> = {
    PORT: addCamShoe(scene, pins.PORT, mats, solids, "PORT", [-fp.ox, fp.oy, 0]),
    STARBOARD: addCamShoe(scene, pins.STARBOARD, mats, solids, "STARBOARD", [fp.ox, fp.oy, 0]),
    TOP_PORT: addCamShoe(scene, pins.TOP_PORT, mats, solids, "TOP_PORT", [-ft.ox, ft.oy, 0]),
    TOP_STARBOARD: addCamShoe(scene, pins.TOP_STARBOARD, mats, solids, "TOP_STARBOARD", [ft.ox, ft.oy, 0]),
  };

  const coreZ = (S5P.coreZAft + S5P.coreZFwd) / 2;
  const core = reg(
    solids,
    box(scene, "S5_CORE_PROXY", root, mats.mechanism, [S5P.coreW, S5P.coreH, S5P.coreL], [0, coreY, coreZ]),
    "s5-core",
    s5,
  );
  box(scene, "S5_CORE_ROBUST_REF_VIS", root, mats.empty, [S5P.robustW, S5P.robustH, S5P.coreL], [0, coreY, coreZ]);

  const supportLen = S5P.coreZFwd - 0.095 - (P.bay.zFwd - 0.02);
  const supportZ0 = (S5P.coreZFwd - 0.095 + (P.bay.zFwd - 0.02)) / 2;
  reg(
    solids,
    box(scene, "S5_CORE_SUPPORT_PORT", root, mats.frame, [S5P.supportSec, S5P.supportSec, Math.abs(supportLen)], [
      -0.2,
      coreY + 0.12,
      supportZ0,
    ]),
    "s5-core",
    s5,
  );
  reg(
    solids,
    box(scene, "S5_CORE_SUPPORT_STBD", root, mats.frame, [S5P.supportSec, S5P.supportSec, Math.abs(supportLen)], [
      0.2,
      coreY + 0.12,
      supportZ0,
    ]),
    "s5-core",
    s5,
  );
  reg(
    solids,
    box(scene, "S5_CORE_REACTION_FRAME", root, mats.frame, [0.7, 0.52, 0.08], [0, coreY, P.bay.zFwd]),
    "s5-core",
    s5,
  );

  const spigotZ = (S5P.spigotZAft + S5P.spigotZFwd) / 2;
  const spigotInnerW = S5P.spigotOuterW - 2 * S5P.spigotWall;
  const spigotInnerH = S5P.spigotOuterH - 2 * S5P.spigotWall;
  const spigotWalls = addHollowSleeve(
    scene,
    root,
    mats,
    solids,
    "S5_SPIGOT",
    "s5-spigot",
    S5P.spigotOuterW,
    S5P.spigotOuterH,
    spigotInnerW,
    spigotInnerH,
    S5P.spigotL,
    0,
    coreY,
    spigotZ,
    s5,
  );
  const spigotWallRest = spigotWalls.map((mesh) => mesh.position.clone());

  addPocket(
    scene,
    root,
    mats,
    solids,
    "S5_POCKET_PORT",
    -(P.drive.w / 2 + 0.055),
    coreY,
    -4.63,
    "xNeg",
  );
  addPocket(
    scene,
    root,
    mats,
    solids,
    "S5_POCKET_STARBOARD",
    P.drive.w / 2 + 0.055,
    coreY,
    -4.63,
    "xPos",
  );
  addPocket(
    scene,
    root,
    mats,
    solids,
    "S5_POCKET_TOP_PORT",
    -0.22,
    P.drive.y + P.drive.h / 2 + 0.04,
    -4.63,
    "yPos",
  );
  addPocket(
    scene,
    root,
    mats,
    solids,
    "S5_POCKET_TOP_STARBOARD",
    0.22,
    P.drive.y + P.drive.h / 2 + 0.04,
    -4.63,
    "yPos",
  );

  const framePort = reg(
    solids,
    box(scene, "S5_FRAME_PORT", root, mats.frame, [0.1, 0.24, 0.3], [-(P.bay.halfW - 0.04), 0.86, -4.66]),
    "s5-seat",
    s5,
  );
  const frameStbd = reg(
    solids,
    box(scene, "S5_FRAME_STBD", root, mats.frame, [0.1, 0.24, 0.3], [P.bay.halfW - 0.04, 0.86, -4.66]),
    "s5-seat",
    s5,
  );
  const frameTop = reg(
    solids,
    box(scene, "S5_FRAME_TOP_CROSS", root, mats.frame, [P.bay.halfW * 2 + 0.12, 0.05, 0.1], [0, 1.25, P.bay.zAft]),
    "s5-seat",
    s5,
  );
  const topDropP = reg(
    solids,
    box(scene, "S5_FRAME_TOP_PORT", root, mats.frame, [0.08, 0.05, 0.24], [-0.22, 1.245, -4.64]),
    "s5-seat",
    s5,
  );
  const topDropS = reg(
    solids,
    box(scene, "S5_FRAME_TOP_STBD", root, mats.frame, [0.08, 0.05, 0.24], [0.22, 1.245, -4.64]),
    "s5-seat",
    s5,
  );

  addLockStation(scene, root, mats, solids, "PORT", -(P.drive.w / 2 + 0.025), S5_LOCK_PORT_Y, "xNeg");
  addLockStation(scene, root, mats, solids, "STARBOARD", P.drive.w / 2 + 0.025, S5_LOCK_PORT_Y, "xPos");
  addLockStation(scene, root, mats, solids, "TOP_PORT", -S5_LOCK_TOP_X, P.drive.y + P.drive.h / 2 + 0.034, "yPos");
  addLockStation(scene, root, mats, solids, "TOP_STARBOARD", S5_LOCK_TOP_X, P.drive.y + P.drive.h / 2 + 0.034, "yPos");

  const portCam = s5TrackFacePieceLayouts("PORT", "A").find((piece) => piece.kind === "CAM");
  if (!portCam) throw new Error("S5 PORT A CAM layout missing");
  const pathCrossingDriveT = 0.98475;
  const pathCrossingCarriageZ = P.drive.stowedZ - P.drive.stroke * pathCrossingDriveT;
  const movingPathIntruder = reg(
    solids,
    box(
      scene,
      "S5_NC_PATH_MOVING_UNTAGGED_VIS",
      driveBody,
      mats.lock,
      [0.006, 0.01, 0.006],
      [portCam.aPos[0] - P.drive.x, portCam.aPos[1] - P.drive.y, portCam.aPos[2] - pathCrossingCarriageZ],
    ),
    "s5-nc",
    { ...s5m, role: "diagnostic" },
  );
  movingPathIntruder.setEnabled(false);
  const forgedFamilyIntruder = reg(
    solids,
    box(scene, "S5_NC_FORGED_SURROUNDING_VIS", root, mats.lock, [0.006, 0.01, 0.006], portCam.aPos),
    "s5-can",
    { ...s5, role: "diagnostic" },
  );
  forgedFamilyIntruder.setEnabled(false);
  const transientIntruder = reg(
    solids,
    box(scene, "S5_NC_MIDPATH_TRANSIENT_VIS", root, mats.lock, [0.006, 0.01, 0.006], portCam.aPos),
    "s5-nc",
    { ...s5, role: "diagnostic" },
  );
  transientIntruder.metadata = { ...(transientIntruder.metadata ?? {}), assembly: undefined, subsystem: undefined };
  transientIntruder.setEnabled(false);
  const duplicateNameMesh = tagAssembly(
    reg(
      solids,
      box(scene, "S5_NC_DUPLICATE_AUTHORITY_NAME_VIS", pins.PORT, mats.lock, [pr, ph, pa], [0, 0, 0]),
      "s5-nc",
      { ...s5m, role: "diagnostic" },
    ),
    "MOVING_LOCK_ASSEMBLY",
  );
  duplicateNameMesh.setEnabled(false);
  const duplicateMovingMesh = tagAssembly(
    reg(
      solids,
      box(scene, "S5_NC_DUPLICATE_MOVING_ROW_VIS", pins.PORT, mats.lock, [pr, ph, pa], [0, 0, 0]),
      "s5-nc",
      { ...s5m, role: "diagnostic" },
    ),
    "MOVING_LOCK_ASSEMBLY",
  );
  duplicateMovingMesh.setEnabled(false);

  reg(
    solids,
    box(scene, "S5_REG_PAD_PORT", root, mats.mechanism, [0.02, 0.1, 0.08], [-(P.drive.w / 2 + 0.02), coreY, -4.56]),
    "s5-register",
    s5,
  );
  reg(
    solids,
    box(scene, "S5_REG_PAD_STARBOARD", root, mats.mechanism, [0.02, 0.1, 0.08], [P.drive.w / 2 + 0.02, coreY, -4.56]),
    "s5-register",
    s5,
  );
  reg(
    solids,
    box(scene, "S5_REG_PAD_TOP", root, mats.mechanism, [0.16, 0.02, 0.08], [0, P.drive.y + P.drive.h / 2 + 0.02, -4.56]),
    "s5-register",
    s5,
  );

  const legacyRef = box(
    scene,
    "S5_LEGACY_DRIVE_ENVELOPE_REF_VIS",
    driveBody,
    mats.empty,
    [P.drive.w, P.drive.h, P.drive.l],
    [0, 0, 0],
  );
  legacyRef.setEnabled(false);

  const envSpike = reg(
    solids,
    box(scene, "S5_NC_ENV_SPIKE_VIS", root, mats.lock, [0.04, 0.04, 0.04], [0, 3.4, 0]),
    "s5-nc",
    { ...s5, role: "diagnostic" },
  );
  envSpike.setEnabled(false);
  reg(
    solids,
    box(scene, "S5_FRAME_WALL_PORT", root, mats.frame, [0.08, 0.24, 0.16], [-(P.bay.halfW - 0.02), 0.86, -4.72]),
    "s5-seat",
    s5,
  );
  reg(
    solids,
    box(scene, "S5_FRAME_WALL_STBD", root, mats.frame, [0.08, 0.24, 0.16], [P.bay.halfW - 0.02, 0.86, -4.72]),
    "s5-seat",
    s5,
  );

  const passagePlate = reg(
    solids,
    box(scene, "S5_NC_PASSAGE_PLATE_VIS", driveBody, mats.lock, [0.02, 0.02, 0.02], [0, (P.drive.h - S5P.canWall) / 2, 0]),
    "s5-nc",
    { ...s5m, role: "diagnostic" },
  );
  const receiverBlock = reg(
    solids,
    box(scene, "S5_NC_RECEIVER_BLOCK_VIS", driveBody, mats.lock, [0.02, 0.02, 0.02], [0, (P.drive.h - S5P.canWall) / 2, recvZ]),
    "s5-nc",
    { ...s5m, role: "diagnostic" },
  );
  const bottomDog = reg(
    solids,
    box(scene, "S5_DOG_BOTTOM_VIS", driveBody, mats.lock, [S5P.dogH, S5P.dogW, S5P.dogL], [0, -(P.drive.h - S5P.dogW) / 2, dogZ]),
    "s5-nc",
    { ...s5m, role: "diagnostic" },
  );
  passagePlate.setEnabled(false);
  receiverBlock.setEnabled(false);
  bottomDog.setEnabled(false);

  let live: S5Override = {};
  let authorityRowsBySemanticName: Readonly<Record<string, AuthoritySolid>> | undefined;

  const bindAuthorityRows = (owner: object): void => {
    const audit = auditS5AuthorityIdentity(solids);
    if (!audit.pass) throw new Error("S5 propulsion mutation binding requires successful identity preflight");
    const binding = getS5AuthorityIdentityBinding(owner);
    const rowsById = new Map(solids.map((row) => [registrationIdOf(row), row]));
    authorityRowsBySemanticName = Object.freeze(
      Object.fromEntries(
        Object.entries(binding.registrationIdBySemanticName).flatMap(([semanticName, registrationId]) => {
          const row = rowsById.get(registrationId);
          return row ? [[semanticName, row] as const] : [];
        }),
      ),
    );
  };

  const authorityRow = (semanticName: string): AuthoritySolid | undefined => {
    if (!authorityRowsBySemanticName) throw new Error("S5 propulsion mutation identity binding is absent");
    return authorityRowsBySemanticName[semanticName];
  };

  const applyLockPose = (driveT: number, force?: "extend" | "retract" | "gap"): void => {
    const transientOn = Boolean(live.midpathTransientRow) && driveT >= 0.98470 && driveT <= 0.98480;
    transientIntruder.setEnabled(transientOn);
    if (live.wrongSectorSpigotReceiver) {
      receiverPort.computeWorldMatrix(true);
      spigotWalls[1]!.setAbsolutePosition(receiverPort.getAbsolutePosition());
    }
    if (force === "gap") {
      pins.PORT.position.x = -S5_LOCK_PIN_RETRACT_X + 0.008;
      pins.STARBOARD.position.x = S5_LOCK_PIN_RETRACT_X - 0.008;
      pins.TOP_PORT.position.y = S5_LOCK_PIN_RETRACT_Y_TOP - 0.008;
      pins.TOP_STARBOARD.position.y = S5_LOCK_PIN_RETRACT_Y_TOP - 0.008;
      return;
    }
    const u = force === "extend" ? 1 : force === "retract" ? 0 : s5LockExtension(driveT);
    pins.PORT.position.x = -S5_LOCK_PIN_RETRACT_X - u * S5_LOCK_EXTEND;
    pins.STARBOARD.position.x = S5_LOCK_PIN_RETRACT_X + u * S5_LOCK_EXTEND;
    pins.TOP_PORT.position.y = S5_LOCK_PIN_RETRACT_Y_TOP + u * S5_LOCK_EXTEND;
    pins.TOP_STARBOARD.position.y = S5_LOCK_PIN_RETRACT_Y_TOP + u * S5_LOCK_EXTEND;
  };

  const applyOverride = (opts: S5Override): void => {
    live = { ...opts };
    const coreScale = opts.oversizedCore ? 1.8 : 1;
    resizeBox(core, solids, [S5P.coreW * coreScale, S5P.coreH * coreScale, S5P.coreL], [0, coreY, coreZ]);

    const spigotLen = opts.shortSpigot ? 0.15 : S5P.spigotL;
    const tip = S5P.spigotZFwd - spigotLen;
    const mid = (tip + S5P.spigotZFwd) / 2;
    for (const [index, mesh] of spigotWalls.entries()) {
      const spec = registeredSpecForMesh(mesh, solids);
      if (!spec) continue;
      const size = mesh.metadata.size as [number, number, number];
      const rest = spigotWallRest[index]!;
      resizeBox(mesh, solids, [size[0], size[1], spigotLen], [rest.x, rest.y, mid]);
    }

    setNcSolid(passagePlate, solids, Boolean(opts.blockPassage), [S5P.innerW - 0.04, S5P.innerH - 0.04, 0.04], [0, 0, recvZ]);
    setNcSolid(receiverBlock, solids, Boolean(opts.blockReceiver), [S5P.receiverInnerW - 0.02, S5P.receiverInnerH - 0.02, 0.04], [
      0,
      0,
      recvZ,
    ]);
    setNcSolid(bottomDog, solids, Boolean(opts.bottomDog), [S5P.dogH, S5P.dogW, S5P.dogL], [
      0,
      -(P.drive.h - S5P.dogW) / 2,
      dogZ,
    ]);

    for (const id of S5_DOG_IDS) {
      const hideTongue = opts.removeDog === id;
      dogs[id].setEnabled(!hideTongue);
      const tspec = authorityRow(`S5_SEAT_TONGUE_${id}`);
      if (tspec) tspec.role = hideTongue ? "diagnostic" : "physical";
      const hideLock = opts.removeLock === id;
      pins[id].setEnabled(!hideLock);
      shoes[id].setEnabled(!hideLock);
      const pspec = authorityRow(`S5_LOCK_PIN_${id}`);
      if (pspec) pspec.role = hideLock ? "diagnostic" : "physical";
      const fspec = authorityRow(`S5_LOCK_CAM_SHOE_${id}`);
      if (fspec) fspec.role = hideLock ? "diagnostic" : "physical";
    }
    applyLockPose(1, opts.forceUnlock ? "retract" : opts.lockGap ? "gap" : opts.forceLock ? "extend" : undefined);

    if (opts.oldTopFrame) {
      resizeBox(topDropP, solids, [0.08, 0.12, 0.22], [-0.22, 1.18, -4.69]);
      resizeBox(topDropS, solids, [0.08, 0.12, 0.22], [0.22, 1.18, -4.69]);
    } else {
      resizeBox(topDropP, solids, [0.08, 0.05, 0.24], [-0.22, 1.245, -4.64]);
      resizeBox(topDropS, solids, [0.08, 0.05, 0.24], [0.22, 1.245, -4.64]);
    }
    setNcSolid(envSpike, solids, Boolean(opts.envProtrusion), [0.2, 0.2, 0.2], [7.2, 1.5, 0]);

    const hideFrame = Boolean(opts.disconnectFrame || opts.railsOnly);
    for (const name of [
      "S5_FRAME_PORT",
      "S5_FRAME_STBD",
      "S5_FRAME_TOP_CROSS",
      "S5_FRAME_TOP_PORT",
      "S5_FRAME_TOP_STBD",
      "S5_FRAME_WALL_PORT",
      "S5_FRAME_WALL_STBD",
      "S5_LOCK_POST_PORT",
      "S5_LOCK_POST_STARBOARD",
      "S5_LOCK_POST_TOP_PORT",
      "S5_LOCK_POST_TOP_STARBOARD",
      "S5_LOCK_WEB_PORT",
      "S5_LOCK_WEB_STARBOARD",
      "S5_LOCK_WEB_TOP_PORT",
      "S5_LOCK_WEB_TOP_STARBOARD",
    ]) {
      const spec = authorityRow(name);
      if (spec) {
        spec.role = hideFrame ? "diagnostic" : "physical";
        spec.node.setEnabled(!hideFrame);
      }
    }
    for (const id of S5_DOG_IDS) {
      const web = authorityRow(`S5_LOCK_WEB_${id}`);
      const hideWeb = Boolean(opts.disconnectFrame || opts.railsOnly || opts.floatShoulder === id);
      if (web) {
        web.role = hideWeb ? "diagnostic" : "physical";
        web.node.setEnabled(!hideWeb);
      }
      const layout = s5TrackLayout(id);
      const railNames = ["A", "B"].flatMap((face) =>
        s5TrackFacePieceLayouts(id, face as "A" | "B").map((piece) => `S5_LOCK_RAIL_${face}_${id}_${piece.kind}`),
      );
      const rails = railNames.map(authorityRow).filter(Boolean) as AuthoritySolid[];
      for (const rail of rails) {
        const rest = (rail.node as Mesh).metadata?.rest as [number, number, number] | undefined;
        if (rest) {
          const gap = opts.camGap === id;
          const dx = id === "PORT" ? -0.03 : id === "STARBOARD" ? 0.03 : 0;
          const dy = id.startsWith("TOP") && gap ? 0.03 : 0;
          const trackFace = (rail.node as Mesh).metadata?.trackFace as "A" | "B" | undefined;
          const zero = Boolean(opts.zeroMargin) && trackFace === "B" && (id === "PORT" || id === "STARBOARD");
          const zeroDeltaScale = 3;
          const zeroDelta: [number, number, number] = [
            zeroDeltaScale * (layout.bPosZero[0] - layout.bPos[0]),
            zeroDeltaScale * (layout.bPosZero[1] - layout.bPos[1]),
            zeroDeltaScale * (layout.bPosZero[2] - layout.bPos[2]),
          ];
          const zp: [number, number, number] = zero
            ? [rest[0] + zeroDelta[0], rest[1] + zeroDelta[1], rest[2] + zeroDelta[2]]
            : rest;
          const normal = ((rail.node as Mesh).metadata?.trackNormal ?? [0, 0, 0]) as [number, number, number];
          const jam = Boolean(opts.reverseJam && trackFace === "A") ? S5_REVERSE_JAM_A_OFFSET : 0;
          rail.node.position.set(
            zp[0] + (gap ? dx : 0) + normal[0] * jam,
            zp[1] + dy + normal[1] * jam,
            zp[2] + normal[2] * jam,
          );
        }
        const trackFace = (rail.node as Mesh).metadata?.trackFace as "A" | "B" | undefined;
        const trackPiece = (rail.node as Mesh).metadata?.trackPiece as string | undefined;
        const trackSector = (rail.node as Mesh).metadata?.trackSector as S5DogId | undefined;
        const open = opts.openCam === id && trackFace === "B";
        const missingOne = Boolean(opts.missingTrackPiece) && trackFace === "B" && trackSector === "PORT" && trackPiece === "CAM";
        const missingB =
          Boolean(opts.missingBFaces) &&
          trackFace === "B" &&
          trackSector === "PORT" &&
          trackPiece !== "MOUTH";
        const missing = open || missingOne || missingB;
        rail.role = missing ? "diagnostic" : "physical";
        rail.node.setEnabled(!missing);
      }
      const backingNames = id === "PORT" || id === "STARBOARD"
        ? [`S5_LOCK_TRACK_BACK_${id}`]
        : [
            `S5_LOCK_TRACK_BACK_AFT_${id}`,
            `S5_LOCK_TRACK_BACK_${id}`,
            `S5_LOCK_TRACK_BACK_MOUTH_${id}`,
            `S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_${id}`,
          ];
      const backs = backingNames.map(authorityRow).filter(Boolean) as AuthoritySolid[];
      for (const back of backs) {
        const hide = Boolean(opts.trackFloat && id === "PORT");
        back.role = hide ? "diagnostic" : "physical";
        back.node.setEnabled(!hide);
      }
    }
    const plug = authorityRow("S5_CAN_PORT_GUIDE_PLUG_VIS");
    if (plug) {
      const on = Boolean(opts.solidGuide);
      plug.role = on ? "physical" : "diagnostic";
      plug.node.setEnabled(on);
    }
    const intrude = authorityRow("S5_LOCK_RAIL_INTRUDE_PORT_VIS");
    if (intrude) {
      const on = Boolean(opts.railIntrude || opts.middlePathIntruder);
      intrude.role = on ? "physical" : "diagnostic";
      (intrude.node as Mesh).metadata = {
        ...((intrude.node as Mesh).metadata ?? {}),
        assembly: on ? "FIXED_TRACK_ASSEMBLY" : undefined,
        subsystem: on ? "S5_LOCK_TRACK_SUBSYSTEM" : undefined,
      };
      intrude.node.setEnabled(on);
    }
    const named = authorityRow("S5_NC_TRACK_WEDGE_VIS");
    if (named) {
      const on = Boolean(opts.namedIntrude);
      named.role = on ? "physical" : "diagnostic";
      (named.node as Mesh).metadata = {
        ...((named.node as Mesh).metadata ?? {}),
        assembly: on ? "FIXED_TRACK_ASSEMBLY" : undefined,
        subsystem: on ? "S5_LOCK_TRACK_SUBSYSTEM" : undefined,
      };
      named.node.setEnabled(on);
    }
    const backPlug = authorityRow("S5_LOCK_BACKING_PLUG_PORT_VIS");
    if (backPlug) {
      const on = Boolean(opts.backingPlug);
      backPlug.role = on ? "physical" : "diagnostic";
      (backPlug.node as Mesh).metadata = {
        ...((backPlug.node as Mesh).metadata ?? {}),
        assembly: on ? "FIXED_TRACK_ASSEMBLY" : undefined,
        subsystem: on ? "S5_LOCK_TRACK_SUBSYSTEM" : undefined,
      };
      backPlug.node.setEnabled(on);
    }
    const entryBlock = authorityRow("S5_NC_ENTRY_MOUTH_BLOCK_VIS");
    if (entryBlock) {
      const on = Boolean(opts.entryBlock);
      entryBlock.role = on ? "physical" : "diagnostic";
      (entryBlock.node as Mesh).metadata = {
        ...((entryBlock.node as Mesh).metadata ?? {}),
        assembly: on ? "FIXED_TRACK_ASSEMBLY" : undefined,
        subsystem: on ? "S5_LOCK_TRACK_SUBSYSTEM" : undefined,
      };
      entryBlock.node.setEnabled(on);
    }
    const unclassified = authorityRow("S5_NC_UNCLASSIFIED_INTRUDER_VIS");
    if (unclassified) {
      const on = Boolean(opts.unclassifiedIntrude || opts.untaggedCorridorSolid);
      unclassified.role = on ? "physical" : "diagnostic";
      (unclassified.node as Mesh).metadata = {
        ...((unclassified.node as Mesh).metadata ?? {}),
        assembly: undefined,
        subsystem: opts.unclassifiedIntrude ? "S5_LOCK_TRACK_SUBSYSTEM" : undefined,
      };
      unclassified.node.setEnabled(on);
    }
    for (const [solid, on] of [
      [movingPathIntruder, Boolean(opts.pathMovingUntagged)],
      [forgedFamilyIntruder, Boolean(opts.forgedSurroundingFamily)],
    ] as const) {
      const spec = registeredSpecForMesh(solid, solids);
      if (spec) spec.role = on ? "physical" : "diagnostic";
      solid.metadata = { ...(solid.metadata ?? {}), assembly: undefined, subsystem: undefined };
      solid.setEnabled(on);
    }
    const transientSpec = authorityRow("S5_NC_MIDPATH_TRANSIENT_VIS");
    if (transientSpec) transientSpec.role = opts.midpathTransientRow ? "physical" : "diagnostic";
    transientIntruder.metadata = { ...(transientIntruder.metadata ?? {}), assembly: undefined, subsystem: undefined };
    transientIntruder.setEnabled(false);

    const duplicateNameOn = Boolean(opts.duplicateAuthorityName);
    const duplicateNameSpec = authorityRow("S5_NC_DUPLICATE_AUTHORITY_NAME_VIS");
    if (!duplicateNameSpec) throw new Error("duplicate-name authority fixture binding missing");
    duplicateNameSpec.role = duplicateNameOn ? "physical" : "diagnostic";
    duplicateNameSpec.name = duplicateNameOn ? "S5_LOCK_PIN_PORT" : "S5_NC_DUPLICATE_AUTHORITY_NAME_VIS";
    duplicateNameMesh.name = duplicateNameSpec.name;
    duplicateNameMesh.setEnabled(duplicateNameOn);

    const duplicateMovingOn = Boolean(opts.duplicateMovingRow);
    const duplicateMovingSpec = authorityRow("S5_NC_DUPLICATE_MOVING_ROW_VIS");
    if (!duplicateMovingSpec) throw new Error("duplicate-moving authority fixture binding missing");
    duplicateMovingSpec.role = duplicateMovingOn ? "physical" : "diagnostic";
    duplicateMovingMesh.setEnabled(duplicateMovingOn);
    applyLockPose(1, opts.forceUnlock ? "retract" : opts.lockGap ? "gap" : opts.forceLock ? "extend" : undefined);
    void framePort;
    void frameStbd;
    void frameTop;
  };

  datums.push({
    name: "S5_PROPULSION",
    kind: "volume",
    node: root,
    note: "S5 B′ propulsion architecture — fixed core + hollow can + handover",
  });

  return { root, canPort, datums, solids, applyOverride, bindAuthorityRows, currentOverride: () => live, applyLockPose, pins };
}

function addSegmentedCanWalls(
  scene: Scene,
  driveBody: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
): Mesh {
  const ap = s5GuideAperture();
  const wallX = -(P.drive.w - S5P.canWall) / 2;
  const wallY = (P.drive.h - S5P.canWall) / 2;
  const halfL = P.drive.l / 2;
  const pinY = S5_LOCK_PORT_Y - P.drive.y;
  const pinZ = S5_LOCK_PIN_Z_LOCAL;
  const zFwdLen = pinZ - ap.z / 2 - -halfL;
  const zFwdC = (-halfL + (pinZ - ap.z / 2)) / 2;
  const zMouthLen = halfL - (pinZ + ap.z / 2);
  const zMouthC = (pinZ + ap.z / 2 + halfL) / 2;
  const yAboveH = P.drive.h / 2 - (pinY + ap.y / 2);
  const yAboveC = (pinY + ap.y / 2 + P.drive.h / 2) / 2;
  const yBelowH = pinY - ap.y / 2 - -P.drive.h / 2;
  const yBelowC = (-P.drive.h / 2 + (pinY - ap.y / 2)) / 2;

  const canPort = reg(
    solids,
    box(scene, "S5_CAN_PORT", driveBody, mats.drive, [S5P.canWall, P.drive.h, zFwdLen], [wallX, 0, zFwdC]),
    "s5-can",
    s5m,
  );
  reg(solids, box(scene, "S5_CAN_PORT_MOUTH", driveBody, mats.drive, [S5P.canWall, P.drive.h, zMouthLen], [wallX, 0, zMouthC]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_PORT_ABOVE", driveBody, mats.drive, [S5P.canWall, yAboveH, ap.z], [wallX, yAboveC, pinZ]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_PORT_BELOW", driveBody, mats.drive, [S5P.canWall, yBelowH, ap.z], [wallX, yBelowC, pinZ]), "s5-can", s5m);
  const plug = reg(
    solids,
    box(scene, "S5_CAN_PORT_GUIDE_PLUG_VIS", driveBody, mats.lock, [S5P.canWall, ap.y, ap.z], [wallX, pinY, pinZ]),
    "s5-nc",
    { ...s5m, role: "diagnostic" },
  );
  plug.setEnabled(false);

  const stbdX = -wallX;
  reg(solids, box(scene, "S5_CAN_STBD", driveBody, mats.drive, [S5P.canWall, P.drive.h, zFwdLen], [stbdX, 0, zFwdC]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_STBD_MOUTH", driveBody, mats.drive, [S5P.canWall, P.drive.h, zMouthLen], [stbdX, 0, zMouthC]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_STBD_ABOVE", driveBody, mats.drive, [S5P.canWall, yAboveH, ap.z], [stbdX, yAboveC, pinZ]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_STBD_BELOW", driveBody, mats.drive, [S5P.canWall, yBelowH, ap.z], [stbdX, yBelowC, pinZ]), "s5-can", s5m);

  const topY = wallY;
  const apX = ap.xTop;
  const xPort = -S5_LOCK_TOP_X;
  const xStbd = S5_LOCK_TOP_X;
  const xOutW = xPort - apX / 2 - -P.drive.w / 2;
  const xOutC = (-P.drive.w / 2 + (xPort - apX / 2)) / 2;
  const xMidW = xStbd - apX / 2 - (xPort + apX / 2);
  const xMidC = (xPort + apX / 2 + (xStbd - apX / 2)) / 2;
  reg(solids, box(scene, "S5_CAN_TOP", driveBody, mats.drive, [P.drive.w, S5P.canWall, zFwdLen], [0, topY, zFwdC]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_TOP_MOUTH", driveBody, mats.drive, [P.drive.w, S5P.canWall, zMouthLen], [0, topY, zMouthC]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_TOP_PORT_OUT", driveBody, mats.drive, [xOutW, S5P.canWall, ap.z], [xOutC, topY, pinZ]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_TOP_MID", driveBody, mats.drive, [xMidW, S5P.canWall, ap.z], [xMidC, topY, pinZ]), "s5-can", s5m);
  reg(solids, box(scene, "S5_CAN_TOP_STBD_OUT", driveBody, mats.drive, [xOutW, S5P.canWall, ap.z], [-xOutC, topY, pinZ]), "s5-can", s5m);

  reg(solids, box(scene, "S5_CAN_BOT", driveBody, mats.drive, [P.drive.w, S5P.canWall, P.drive.l], [0, -wallY, 0]), "s5-can", s5m);
  return canPort;
}

function addCamShoe(
  scene: Scene,
  pin: Mesh,
  mats: Materials,
  solids: AuthoritySolid[],
  id: S5DogId,
  local: [number, number, number],
): Mesh {
  const layout = s5TrackLayout(id);
  const shoe = reg(
    solids,
    box(scene, `S5_LOCK_CAM_SHOE_${id}`, pin, mats.rail, layout.shoeSize, local),
    "s5-lock",
    s5m,
  );
  return tagAssembly(shoe, "MOVING_LOCK_ASSEMBLY");
}

function addClosedTrack(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
  id: S5DogId,
): void {
  const layout = s5TrackLayout(id);
  for (const piece of s5TrackFacePieceLayouts(id, "A")) {
    const a = tagAssembly(
      reg(
        solids,
        box(scene, `S5_LOCK_RAIL_A_${id}_${piece.kind}`, parent, mats.rail, piece.aSize, piece.aPos, { rotation: piece.rot }),
        "s5-lock-fixed",
        s5,
      ),
      "FIXED_TRACK_ASSEMBLY",
    );
    a.metadata = {
      ...(a.metadata ?? {}),
      rest: piece.aPos,
      assembly: "FIXED_TRACK_ASSEMBLY",
      subsystem: "S5_LOCK_TRACK_SUBSYSTEM",
      trackFace: "A",
      trackSector: id,
      trackPiece: piece.kind,
      trackNormal: [piece.nx, piece.ny, piece.nz],
    };
  }
  for (const piece of s5TrackFacePieceLayouts(id, "B")) {
    const b = tagAssembly(
      reg(
        solids,
        box(scene, `S5_LOCK_RAIL_B_${id}_${piece.kind}`, parent, mats.rail, piece.bSize, piece.bPos, { rotation: piece.rot }),
        "s5-lock-fixed",
        s5,
      ),
      "FIXED_TRACK_ASSEMBLY",
    );
    b.metadata = {
      ...(b.metadata ?? {}),
      rest: piece.bPos,
      assembly: "FIXED_TRACK_ASSEMBLY",
      subsystem: "S5_LOCK_TRACK_SUBSYSTEM",
      trackFace: "B",
      trackSector: id,
      trackPiece: piece.kind,
      trackNormal: [piece.nx, piece.ny, piece.nz],
    };
  }

  if (id === "PORT" || id === "STARBOARD") {
    const s = id === "PORT" ? -1 : 1;
    const backPos: [number, number, number] = [s * 0.543, 0.554, -4.572];
    const backSize: [number, number, number] = [0.052, 0.028, 0.04];
    const back = tagAssembly(
      reg(solids, box(scene, `S5_LOCK_TRACK_BACK_${id}`, parent, mats.frame, backSize, backPos), "s5-lock-fixed", s5),
      "FIXED_TRACK_ASSEMBLY",
    );
    back.metadata = { ...(back.metadata ?? {}), rest: backPos, assembly: "FIXED_TRACK_ASSEMBLY", subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
  } else {
    const s = id === "TOP_PORT" ? -1 : 1;
    const aftPos: [number, number, number] = [s * 0.33, 1.228, -4.608];
    const aftSize: [number, number, number] = [0.16, 0.044, 0.036];
    const aft = reg(
      solids,
      box(scene, `S5_LOCK_TRACK_BACK_AFT_${id}`, parent, mats.frame, aftSize, aftPos),
      "s5-lock-fixed",
      s5,
    );
    tagAssembly(aft, "FIXED_TRACK_ASSEMBLY");
    aft.metadata = { ...(aft.metadata ?? {}), rest: aftPos, assembly: "FIXED_TRACK_ASSEMBLY", subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
    const highPos: [number, number, number] = [s * 0.29, 1.252, -4.572];
    const highSize: [number, number, number] = [0.21, 0.022, 0.04];
    const high = reg(
      solids,
      box(scene, `S5_LOCK_TRACK_BACK_${id}`, parent, mats.frame, highSize, highPos),
      "s5-lock-fixed",
      s5,
    );
    tagAssembly(high, "FIXED_TRACK_ASSEMBLY");
    high.metadata = { ...(high.metadata ?? {}), rest: highPos, assembly: "FIXED_TRACK_ASSEMBLY", subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
    const mouthPos: [number, number, number] = [s * 0.414, 1.218, -4.563];
    const mouthSize: [number, number, number] = [0.014, 0.045, 0.045];
    const mouth = tagAssembly(
      reg(
        solids,
        box(scene, `S5_LOCK_TRACK_BACK_MOUTH_${id}`, parent, mats.frame, mouthSize, mouthPos),
        "s5-lock-fixed",
        s5,
      ),
      "FIXED_TRACK_ASSEMBLY",
    );
    mouth.metadata = { ...(mouth.metadata ?? {}), rest: mouthPos, assembly: "FIXED_TRACK_ASSEMBLY", subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
    const bridgePos: [number, number, number] = [s * 0.352, 1.246, -4.563];
    const bridgeSize: [number, number, number] = [0.124, 0.012, 0.045];
    const bridge = tagAssembly(
      reg(
        solids,
        box(scene, `S5_LOCK_TRACK_BACK_MOUTH_BRIDGE_${id}`, parent, mats.frame, bridgeSize, bridgePos),
        "s5-lock-fixed",
        s5,
      ),
      "FIXED_TRACK_ASSEMBLY",
    );
    bridge.metadata = { ...(bridge.metadata ?? {}), rest: bridgePos, assembly: "FIXED_TRACK_ASSEMBLY", subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
  }

  const sweep = lockSweepEnvelope(id);
  const vis = reg(
    solids,
    box(scene, `S5_LOCK_MOVING_SWEEP_CORRIDOR_${id}_VIS`, parent, mats.empty, sweep.size, sweep.pos),
    "s5-nc",
    { ...s5, role: "diagnostic" },
  );
  vis.setEnabled(false);

  if (id === "PORT") {
    const mid = {
      x: (layout.p0.x + layout.p1.x) / 2,
      y: layout.p0.y,
      z: (layout.p0.z + layout.p1.z) / 2,
    };
    const ghost = reg(
      solids,
      box(scene, "S5_LOCK_RAIL_INTRUDE_PORT_VIS", parent, mats.lock, [0.004, 0.008, 0.004], [mid.x, mid.y, mid.z]),
      "s5-nc",
      { ...s5, role: "diagnostic" },
    );
    ghost.setEnabled(false);
    const wedge = reg(
      solids,
      box(scene, "S5_NC_TRACK_WEDGE_VIS", parent, mats.lock, [0.004, 0.008, 0.004], [mid.x, mid.y, mid.z + 0.001]),
      "s5-nc",
      { ...s5, role: "diagnostic" },
    );
    wedge.setEnabled(false);
    const plug = reg(
      solids,
      box(scene, "S5_LOCK_BACKING_PLUG_PORT_VIS", parent, mats.lock, [0.018, 0.02, 0.03], [-0.505, 0.56, -4.57]),
      "s5-nc",
      { ...s5, role: "diagnostic" },
    );
    plug.setEnabled(false);
    const entryBlock = reg(
      solids,
      box(scene, "S5_NC_ENTRY_MOUTH_BLOCK_VIS", parent, mats.lock, [0.008, 0.012, 0.006], [layout.p0.x, layout.p0.y, -4.555]),
      "s5-lock-fixed",
      { ...s5, role: "diagnostic" },
    );
    entryBlock.metadata = { ...(entryBlock.metadata ?? {}), subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
    entryBlock.setEnabled(false);
    const unclassified = reg(
      solids,
      box(scene, "S5_NC_UNCLASSIFIED_INTRUDER_VIS", parent, mats.lock, [0.005, 0.01, 0.005], [mid.x, mid.y, mid.z]),
      "s5-lock-fixed",
      { ...s5, role: "diagnostic" },
    );
    unclassified.metadata = { ...(unclassified.metadata ?? {}), subsystem: "S5_LOCK_TRACK_SUBSYSTEM" };
    unclassified.setEnabled(false);
  }
}

function lockSweepEnvelope(id: S5DogId): { size: [number, number, number]; pos: [number, number, number] } {
  if (id === "PORT") return { size: [0.1, 0.06, 0.055], pos: [-0.511, 0.548, -4.562] };
  if (id === "STARBOARD") return { size: [0.1, 0.06, 0.055], pos: [0.511, 0.548, -4.562] };
  if (id === "TOP_PORT") return { size: [0.07, 0.055, 0.055], pos: [-0.38, 1.193, -4.562] };
  return { size: [0.07, 0.055, 0.055], pos: [0.38, 1.193, -4.562] };
}

function addLockStation(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
  id: string,
  x: number,
  y: number,
  facing: "xNeg" | "xPos" | "yPos",
): void {
  const z = S5_LOCK_CAM_Z1;
  const fixed = (mesh: Mesh): Mesh => tagAssembly(mesh, "FIXED_TRACK_ASSEMBLY");
  if (facing === "xNeg" || facing === "xPos") {
    const s = facing === "xNeg" ? -1 : 1;
    const cavityX = x - s * 0.01;
    fixed(reg(solids, box(scene, `S5_LOCK_RECV_${id}`, parent, mats.lock, [0.01, 0.04, 0.036], [x, y, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_GUIDE_A_${id}`, parent, mats.lock, [0.018, 0.008, 0.036], [cavityX, y + 0.02, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_GUIDE_B_${id}`, parent, mats.lock, [0.018, 0.008, 0.036], [cavityX, y - 0.02, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_SHOULDER_${id}`, parent, mats.lock, [0.018, 0.04, 0.01], [cavityX, y, z + 0.027]), "s5-lock-fixed", s5));
    addClosedTrack(scene, parent, mats, solids, id as S5DogId);
    fixed(reg(solids, box(scene, `S5_LOCK_WEB_${id}`, parent, mats.frame, [0.012, 0.04, 0.012], [cavityX + s * 0.007, y, z + 0.02]), "s5-lock-fixed", s5));
    const postX = s < 0 ? -0.545 : 0.545;
    tagAssembly(
      reg(solids, box(scene, `S5_LOCK_POST_${id}`, parent, mats.frame, [0.04, 0.3, 0.05], [postX, 0.71, -4.607]), "s5-lock-fixed", s5),
      "FIXED_TRACK_ASSEMBLY",
    );
  } else {
    const cavityY = y - 0.016;
    fixed(reg(solids, box(scene, `S5_LOCK_RECV_${id}`, parent, mats.lock, [0.04, 0.008, 0.036], [x, y, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_GUIDE_A_${id}`, parent, mats.lock, [0.008, 0.024, 0.036], [x + 0.02, cavityY, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_GUIDE_B_${id}`, parent, mats.lock, [0.008, 0.024, 0.036], [x - 0.02, cavityY, z]), "s5-lock-fixed", s5));
    fixed(reg(solids, box(scene, `S5_LOCK_SHOULDER_${id}`, parent, mats.lock, [0.04, 0.024, 0.01], [x, cavityY, z + 0.027]), "s5-lock-fixed", s5));
    addClosedTrack(scene, parent, mats, solids, id as S5DogId);
    fixed(reg(solids, box(scene, `S5_LOCK_WEB_${id}`, parent, mats.frame, [0.04, 0.008, 0.012], [x, cavityY + 0.014, z + 0.02]), "s5-lock-fixed", s5));
    const postX = x < 0 ? -0.29 : 0.29;
    tagAssembly(
      reg(solids, box(scene, `S5_LOCK_POST_${id}`, parent, mats.frame, [0.16, 0.03, 0.08], [postX, 1.235, -4.61]), "s5-lock-fixed", s5),
      "FIXED_TRACK_ASSEMBLY",
    );
  }
}

function addHollowSleeve(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
  prefix: string,
  family: string,
  outerW: number,
  outerH: number,
  innerW: number,
  innerH: number,
  length: number,
  x: number,
  y: number,
  z: number,
  opts: Parameters<typeof registerBox>[3],
): Mesh[] {
  const wallX = (outerW - innerW) / 2;
  const wallY = (outerH - innerH) / 2;
  const meshes = [
    reg(
      solids,
      box(scene, `${prefix}_PORT`, parent, mats.mechanism, [wallX, outerH, length], [x - (outerW + innerW) / 4, y, z]),
      family,
      opts,
    ),
    reg(
      solids,
      box(scene, `${prefix}_STBD`, parent, mats.mechanism, [wallX, outerH, length], [x + (outerW + innerW) / 4, y, z]),
      family,
      opts,
    ),
    reg(
      solids,
      box(scene, `${prefix}_TOP`, parent, mats.mechanism, [innerW, wallY, length], [x, y + (outerH + innerH) / 4, z]),
      family,
      opts,
    ),
    reg(
      solids,
      box(scene, `${prefix}_BOT`, parent, mats.mechanism, [innerW, wallY, length], [x, y - (outerH + innerH) / 4, z]),
      family,
      opts,
    ),
  ];
  return meshes;
}

function addPocket(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
  prefix: string,
  x: number,
  y: number,
  z: number,
  facing: "xNeg" | "xPos" | "yPos",
): void {
  const L = 0.18;
  if (facing === "xNeg" || facing === "xPos") {
    const s = facing === "xNeg" ? -1 : 1;
    reg(
      solids,
      box(scene, `${prefix}_OUTER`, parent, mats.lock, [0.03, 0.12, L], [x + s * 0.03, y, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_TOP`, parent, mats.lock, [0.07, 0.025, L], [x, y + 0.055, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_BOT`, parent, mats.lock, [0.07, 0.025, L], [x, y - 0.055, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_AFT`, parent, mats.lock, [0.07, 0.12, 0.025], [x, y, z - L / 2 + 0.012]),
      "s5-seat",
      s5,
    );
  } else {
    reg(
      solids,
      box(scene, `${prefix}_OUTER`, parent, mats.lock, [0.12, 0.03, L], [x, y + 0.025, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_PORT`, parent, mats.lock, [0.025, 0.06, L], [x - 0.05, y, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_STBD`, parent, mats.lock, [0.025, 0.06, L], [x + 0.05, y, z]),
      "s5-seat",
      s5,
    );
    reg(
      solids,
      box(scene, `${prefix}_AFT`, parent, mats.lock, [0.12, 0.06, 0.025], [x, y, z - L / 2 + 0.012]),
      "s5-seat",
      s5,
    );
  }
}

function resizeBox(mesh: Mesh, solids: AuthoritySolid[], size: [number, number, number], pos: [number, number, number]): void {
  mesh.scaling.set(1, 1, 1);
  const prev = mesh.metadata?.size as [number, number, number] | undefined;
  if (prev) {
    mesh.scaling.set(size[0] / prev[0], size[1] / prev[1], size[2] / prev[2]);
  }
  mesh.position.set(...pos);
  mesh.metadata = { ...(mesh.metadata ?? {}), size, kind: "box" };
  const spec = registeredSpecForMesh(mesh, solids);
  if (spec) {
    spec.localHalf = { x: size[0] / 2, y: size[1] / 2, z: size[2] / 2 };
  }
}

function setNcSolid(
  mesh: Mesh,
  solids: AuthoritySolid[],
  on: boolean,
  size: [number, number, number],
  pos: [number, number, number],
): void {
  const spec = registeredSpecForMesh(mesh, solids);
  if (on) {
    resizeBox(mesh, solids, size, pos);
    mesh.setEnabled(true);
    if (spec) spec.role = "physical";
  } else {
    resizeBox(mesh, solids, [0.02, 0.02, 0.02], pos);
    mesh.setEnabled(false);
    if (spec) spec.role = "diagnostic";
  }
}

function registeredSpecForMesh(mesh: Mesh, solids: AuthoritySolid[]): AuthoritySolid | undefined {
  const registrationId = (mesh.metadata as { authorityRegistrationId?: string } | undefined)?.authorityRegistrationId;
  if (!registrationId) return undefined;
  return solids.find((row) => registrationIdOf(row) === registrationId);
}
