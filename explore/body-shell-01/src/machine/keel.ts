import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, bayInterior, channelDepth } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import type { DebugDatum } from "./types";

export interface KeelBuild {
  root: TransformNode;
  nestReceiver: TransformNode;
  socketRail: TransformNode;
  driveRails: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

export function buildKeel(scene: Scene, parent: TransformNode, mats: Materials): KeelBuild {
  const root = node("KEEL_FRAME", scene, parent);
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const fixed = { moving: false, book: false, keepoutSweep: false };

  const zMid = (P.keel.zFwd + P.keel.zAft) * 0.5;
  const keelLen = P.keel.zFwd - P.keel.zAft;

  registerBox(solids, box(scene, "VENTRAL_KEEL", root, mats.frame, [0.3, 0.14, keelLen], [0, P.keel.ventralY, zMid]), "keel", fixed);

  const dorsalLen = P.bay.zFwd - (P.keel.zAft + keelLen) + (P.keel.zFwd - P.bay.zFwd);
  const dorsalZ0 = (P.keel.zFwd + P.bay.zFwd) * 0.5;
  registerBox(
    solids,
    box(scene, "DORSAL_LONGERON", root, mats.frame, [P.keel.longeronW, P.keel.longeronH, P.keel.zFwd - P.bay.zFwd], [
      0,
      P.keel.dorsalY,
      dorsalZ0,
    ]),
    "keel",
    fixed,
  );
  void dorsalLen;

  const bulkZs = [3.35, 1.15, P.bay.zFwd];
  for (const z of bulkZs) {
    const h = P.keel.dorsalY - P.keel.ventralY + 0.12;
    const y = (P.keel.dorsalY + P.keel.ventralY) * 0.5;
    registerBox(
      solids,
      box(scene, `BULKHEAD_Z${z.toFixed(2).replace(".", "p")}`, root, mats.frame, [P.keel.halfWidth * 2, h, 0.08], [0, y, z]),
      "keel",
      fixed,
    );
  }

  const aftHoopY = (P.bay.yBot + P.bay.yTop) * 0.5;
  const aftHoopH = P.bay.yTop - P.bay.yBot;
  registerBox(
    solids,
    box(scene, "AFT_POST_PORT", root, mats.frame, [0.1, aftHoopH, 0.1], [-(P.bay.halfW + 0.05), aftHoopY, P.bay.zAft]),
    "keel",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "AFT_POST_STBD", root, mats.frame, [0.1, aftHoopH, 0.1], [P.bay.halfW + 0.05, aftHoopY, P.bay.zAft]),
    "keel",
    fixed,
  );

  const bayZmid = (P.bay.zFwd + P.bay.zAft) * 0.5;
  const bayL = P.bay.zFwd - P.bay.zAft;
  const bayH = P.bay.yTop - P.bay.yBot;
  const wallX = P.bay.halfW + P.keel.wallT / 2;
  const wallY = (P.bay.yBot + P.bay.yTop) * 0.5;

  registerBox(
    solids,
    box(scene, "BAY_WALL_PORT", root, mats.frame, [P.keel.wallT, bayH, bayL], [-wallX, wallY, bayZmid]),
    "keel",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "BAY_WALL_STBD", root, mats.frame, [P.keel.wallT, bayH, bayL], [wallX, wallY, bayZmid]),
    "keel",
    fixed,
  );

  const chZ = (P.channel.zFwd + P.channel.zAft) * 0.5;
  const chL = P.channel.zFwd - P.channel.zAft;
  const chX = (P.channel.xIn + P.channel.xOut) * 0.5;
  const chW = channelDepth();

  const frameH = P.channel.yTop - P.channel.yBot;
  const frameY = (P.channel.yBot + P.channel.yTop) * 0.5;
  registerBox(
    solids,
    box(scene, "CHANNEL_FRAME_FWD", root, mats.frame, [chW, frameH, 0.06], [chX, frameY, P.channel.zFwd]),
    "keel",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "CHANNEL_FRAME_AFT", root, mats.frame, [chW, frameH, 0.06], [chX, frameY, P.channel.zAft]),
    "keel",
    fixed,
  );

  const nestReceiver = node("NEST_RECEIVER", scene, root);
  nestReceiver.position.set(P.nestReceiver.x, P.nestReceiver.y, P.nestReceiver.z);
  const [ox, oy, oz] = P.nestReceiver.outer;
  const [bx, by] = P.nestReceiver.bore;
  const cheekX = (ox - bx) / 4;
  const cheekCx = (ox + bx) / 4;
  registerBox(
    solids,
    box(scene, "NEST_CHEEK_P", nestReceiver, mats.mechanism, [2 * cheekX, oy, oz], [-cheekCx, 0, 0]),
    "nest-receiver",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "NEST_CHEEK_S", nestReceiver, mats.mechanism, [2 * cheekX, oy, oz], [cheekCx, 0, 0]),
    "nest-receiver",
    fixed,
  );
  const bridgeY = (oy - by) / 4;
  const bridgeCy = (oy + by) / 4;
  registerBox(
    solids,
    box(scene, "NEST_BRIDGE_UP", nestReceiver, mats.mechanism, [bx, 2 * bridgeY, oz], [0, bridgeCy, 0]),
    "nest-receiver",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "NEST_BRIDGE_DN", nestReceiver, mats.mechanism, [bx, 2 * bridgeY, oz], [0, -bridgeCy, 0]),
    "nest-receiver",
    fixed,
  );
  datums.push({
    name: "NEST_RECEIVER",
    kind: "lock",
    node: nestReceiver,
    note: "Four-piece frame around a real empty Z bore. Pin travels through the opening, not through solid.",
  });

  const socketRail = node("SOCKET_RAIL", scene, root);
  socketRail.position.set(
    (P.socketRail.xOut + P.socketRail.xIn) * 0.5,
    P.socketRail.y,
    P.socketRail.z,
  );
  const railLen = P.socketRail.xIn - P.socketRail.xOut;
  registerBox(
    solids,
    box(scene, "SOCKET_RAIL_BEAM", socketRail, mats.rail, [railLen, P.socketRail.section, P.socketRail.section], [0, 0, 0]),
    "rail",
    fixed,
  );
  registerBox(
    solids,
    cyl(scene, "SOCKET_RAIL_STOP_OUT", socketRail, mats.mechanism, 0.04, 0.1, [-(railLen / 2), 0, 0], [0, 0, deg(90)]),
    "rail",
    fixed,
  );
  registerBox(
    solids,
    cyl(scene, "SOCKET_RAIL_STOP_IN", socketRail, mats.mechanism, 0.04, 0.1, [railLen / 2, 0, 0], [0, 0, deg(90)]),
    "rail",
    fixed,
  );
  datums.push({
    name: "SOCKET_RAIL",
    kind: "rail",
    node: socketRail,
    note: `Fixed +X rail dir=(1,0,0) length=${railLen.toFixed(3)} m`,
  });

  const driveRails = node("DRIVE_RAILS", scene, root);
  const driveRailLen = P.driveRail.zFwd - P.driveRail.zAft;
  const driveRailZ = (P.driveRail.zFwd + P.driveRail.zAft) * 0.5;
  for (const x of P.driveRail.xs) {
    registerBox(
      solids,
      box(scene, `DRIVE_RAIL_${x < 0 ? "P" : "S"}`, driveRails, mats.rail, [
        P.driveRail.section,
        P.driveRail.section,
        driveRailLen,
      ], [x, P.driveRail.y, driveRailZ]),
      "rail",
      fixed,
    );
  }
  datums.push({
    name: "DRIVE_RAILS",
    kind: "rail",
    node: driveRails,
    note: `Fixed −Z rails dir=(0,0,-1) length=${driveRailLen.toFixed(3)} m`,
  });

  const bayEmpty = node("BAY_EMPTY_VOLUME", scene, root);
  const bay = bayInterior();
  box(
    scene,
    "BAY_EMPTY_VIS",
    bayEmpty,
    mats.empty,
    [bay.w, bay.h, bay.l],
    [0, (P.bay.yBot + P.bay.yTop) * 0.5, bayZmid],
  );
  bayEmpty.setEnabled(false);
  datums.push({
    name: "BAY_EMPTY_VOLUME",
    kind: "volume",
    node: bayEmpty,
    note: `Empty aft bay ${bay.w.toFixed(2)}×${bay.h.toFixed(2)}×${bay.l.toFixed(2)} m`,
  });

  const channelEmpty = node("CHANNEL_EMPTY_VOLUME", scene, root);
  box(
    scene,
    "CHANNEL_EMPTY_VIS",
    channelEmpty,
    mats.empty,
    [chW, P.channel.yTop - P.channel.yBot, chL],
    [chX, (P.channel.yBot + P.channel.yTop) * 0.5, chZ],
  );
  channelEmpty.setEnabled(false);
  datums.push({
    name: "CHANNEL_EMPTY_VOLUME",
    kind: "volume",
    node: channelEmpty,
    note: `Empty port channel depth ${chW.toFixed(2)} m`,
  });

  return { root, nestReceiver, socketRail, driveRails, datums, solids };
}
