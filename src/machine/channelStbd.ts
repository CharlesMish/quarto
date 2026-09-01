import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import { STBD, stbdChannelDepth } from "./side";
import type { DebugDatum } from "./types";

export interface ChannelStbdBuild {
  root: TransformNode;
  nestReceiver: TransformNode;
  socketRail: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

const fixed = { moving: false, book: false, keepoutSweep: false, slice: "s4" as const };

export function buildChannelStbd(scene: Scene, parent: TransformNode, mats: Materials): ChannelStbdBuild {
  const root = node("STBD_REAR_RECEIVE", scene, parent);
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const ch = STBD.channel;
  const chZ = (ch.zFwd + ch.zAft) * 0.5;
  const chL = ch.zFwd - ch.zAft;
  const chX = (ch.xIn + ch.xOut) * 0.5;
  const chW = stbdChannelDepth();
  const frameH = ch.yTop - ch.yBot;
  const frameY = (ch.yBot + ch.yTop) * 0.5;

  registerBox(
    solids,
    box(scene, "CHANNEL_FRAME_STBD_FWD", root, mats.frame, [chW, frameH, 0.06], [chX, frameY, ch.zFwd]),
    "keel-stbd",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "CHANNEL_FRAME_STBD_AFT", root, mats.frame, [chW, frameH, 0.06], [chX, frameY, ch.zAft]),
    "keel-stbd",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "STBD_CHANNEL_TIE_FWD", root, mats.frame, [0.1, 0.22, 0.08], [ch.xIn, 1.65, ch.zFwd]),
    "keel-stbd",
    fixed,
  );

  const nestReceiver = node("RR_NEST_RECEIVER", scene, root);
  const nr = STBD.nestReceiver;
  nestReceiver.position.set(nr.x, nr.y, nr.z);
  const [ox, oy, oz] = nr.outer;
  const [bx, by] = nr.bore;
  const cheekX = (ox - bx) / 4;
  const cheekCx = (ox + bx) / 4;
  registerBox(
    solids,
    box(scene, "RR_NEST_CHEEK_P", nestReceiver, mats.mechanism, [2 * cheekX, oy, oz], [-cheekCx, 0, 0]),
    "rr-nest-receiver",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "RR_NEST_CHEEK_S", nestReceiver, mats.mechanism, [2 * cheekX, oy, oz], [cheekCx, 0, 0]),
    "rr-nest-receiver",
    fixed,
  );
  const bridgeY = (oy - by) / 4;
  const bridgeCy = (oy + by) / 4;
  registerBox(
    solids,
    box(scene, "RR_NEST_BRIDGE_UP", nestReceiver, mats.mechanism, [bx, 2 * bridgeY, oz], [0, bridgeCy, 0]),
    "rr-nest-receiver",
    fixed,
  );
  registerBox(
    solids,
    box(scene, "RR_NEST_BRIDGE_DN", nestReceiver, mats.mechanism, [bx, 2 * bridgeY, oz], [0, -bridgeCy, 0]),
    "rr-nest-receiver",
    fixed,
  );
  datums.push({
    name: "RR_NEST_RECEIVER",
    kind: "lock",
    node: nestReceiver,
    note: "Starboard four-piece empty Z bore. Homologous to port NEST_RECEIVER.",
  });

  const socketRail = node("RR_SOCKET_RAIL", scene, root);
  const sr = STBD.socketRail;
  socketRail.position.set((sr.xOut + sr.xIn) * 0.5, sr.y, sr.z);
  const railLen = sr.xOut - sr.xIn;
  registerBox(
    solids,
    box(scene, "RR_SOCKET_RAIL_BEAM", socketRail, mats.rail, [railLen, sr.section, sr.section], [0, 0, 0]),
    "rr-rail",
    fixed,
  );
  registerBox(
    solids,
    cyl(scene, "RR_SOCKET_RAIL_STOP_OUT", socketRail, mats.mechanism, 0.04, 0.1, [railLen / 2, 0, 0], [0, 0, deg(90)]),
    "rr-rail",
    fixed,
  );
  registerBox(
    solids,
    cyl(scene, "RR_SOCKET_RAIL_STOP_IN", socketRail, mats.mechanism, 0.04, 0.1, [-(railLen / 2), 0, 0], [0, 0, deg(90)]),
    "rr-rail",
    fixed,
  );
  datums.push({
    name: "RR_SOCKET_RAIL",
    kind: "rail",
    node: socketRail,
    note: `Starboard inboard −X rail length=${railLen.toFixed(3)} m`,
  });

  const channelEmpty = node("CHANNEL_STBD_EMPTY_VOLUME", scene, root);
  box(
    scene,
    "CHANNEL_STBD_EMPTY_VIS",
    channelEmpty,
    mats.empty,
    [chW, ch.yTop - ch.yBot, chL],
    [chX, (ch.yBot + ch.yTop) * 0.5, chZ],
  );
  channelEmpty.setEnabled(false);
  datums.push({
    name: "CHANNEL_STBD_EMPTY_VOLUME",
    kind: "volume",
    node: channelEmpty,
    note: `Empty starboard channel depth ${chW.toFixed(2)} m`,
  });

  void P;
  return { root, nestReceiver, socketRail, datums, solids };
}
