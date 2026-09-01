import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import { STBD } from "./side";
import type { DebugDatum } from "./types";

export interface FwdCarryStbdBuild {
  root: TransformNode;
  socketRail: TransformNode;
  nestReceiver: TransformNode;
  catchRoot: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

const carry = { slice: "s4" as const, carryNode: "fwd-carry-stbd" };
const rail = { slice: "s4" as const, carryNode: "fwd-rail-stbd" };

function seatedSparWorldStbd(local: readonly [number, number, number]): { x: number; y: number; z: number } {
  const cant = deg(P.fl.cantDeg);
  const c = Math.cos(cant);
  const s = Math.sin(cant);
  const [x, y, z] = local;
  const y1 = y * c - z * s;
  const z1 = y * s + z * c;
  return {
    x: STBD.front.nestX + z1,
    y: P.fl.y + y1,
    z: P.fl.z - x,
  };
}

export const STBD_CARRY_INTERFACES: ReadonlyArray<readonly [string, string]> = [
  ["FWD_STBD_IFACE_FWD", "BULKHEAD_Z3p35"],
  ["FWD_STBD_IFACE_AFT", "BULKHEAD_Z1p15"],
  ["FWD_STBD_FRAME_FWD_IN", "FWD_STBD_IFACE_FWD"],
  ["FWD_STBD_FRAME_FWD_TOP", "FWD_STBD_FRAME_FWD_IN"],
  ["FWD_STBD_FRAME_AFT", "FWD_STBD_IFACE_AFT"],
  ["FWD_STBD_LONGERON_HIGH", "FWD_STBD_FRAME_FWD_IN"],
  ["FWD_STBD_LONGERON_HIGH", "FWD_STBD_FRAME_AFT"],
  ["FWD_STBD_LONGERON_LOW", "FWD_STBD_FRAME_FWD_IN"],
  ["FWD_STBD_LONGERON_LOW", "FWD_STBD_FRAME_AFT"],
  ["FWD_STBD_RAIL_BRACKET", "FWD_STBD_FRAME_FWD_TOP"],
  ["FWD_STBD_RAIL_BRACKET", "FR_SOCKET_RAIL_BEAM"],
  ["FWD_STBD_NEST_BRACKET", "FWD_STBD_RAIL_BRACKET"],
  ["FWD_STBD_NEST_BRACKET", "FR_NEST_CHEEK_DN"],
  ["FWD_STBD_CATCH_ARM", "FWD_STBD_FRAME_AFT"],
  ["FWD_STBD_CATCH_RISER_FWD", "FWD_STBD_CATCH_ARM"],
  ["FWD_STBD_CATCH_RISER_AFT", "FWD_STBD_CATCH_ARM"],
  ["FWD_STBD_CATCH_RISER_FWD", "FR_CATCH_CHEEK_FWD"],
  ["FWD_STBD_CATCH_RISER_AFT", "FR_CATCH_CHEEK_AFT"],
  ["STBD_CHANNEL_TIE_FWD", "BULKHEAD_Z-1p70"],
  ["CHANNEL_FRAME_STBD_FWD", "STBD_CHANNEL_TIE_FWD"],
];

export function buildFwdCarryStbd(scene: Scene, parent: TransformNode, mats: Materials): FwdCarryStbdBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const root = node("FWD_CARRY_STBD", scene, parent);
  const carryMat = mats.carry ?? mats.frame;

  registerBox(
    solids,
    box(scene, "FWD_STBD_IFACE_FWD", root, carryMat, [0.14, 0.5, 0.12], [0.82, 1.22, 3.35]),
    "fwd-stbd-iface",
    { ...carry, carryNode: "iface-fwd" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_IFACE_AFT", root, carryMat, [0.14, 0.5, 0.12], [0.82, 1.22, 1.15]),
    "fwd-stbd-iface",
    { ...carry, carryNode: "iface-aft" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_FRAME_FWD_IN", root, carryMat, [0.08, 1.56, 0.08], [0.79, 1.64, 3.35]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "frame-fwd" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_FRAME_FWD_TOP", root, carryMat, [0.42, 0.08, 0.08], [0.96, 2.36, 3.35]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "frame-fwd-top" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_FRAME_AFT", root, carryMat, [1.16, 1.56, 0.08], [1.37, 1.64, 1.15]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "frame-aft" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_LONGERON_HIGH", root, carryMat, [0.08, 0.08, 2.2], [0.79, 2.36, 2.25]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "longeron-high" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_LONGERON_LOW", root, carryMat, [0.08, 0.1, 2.2], [0.79, 0.88, 2.25]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "longeron-low" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_RAIL_BRACKET", root, carryMat, [0.38, 0.12, 0.12], [0.96, 2.28, 3.28]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "rail-bracket" },
  );

  const socketRail = node("FR_SOCKET_RAIL", scene, root);
  const fsr = STBD.flSocketRail;
  socketRail.position.set((fsr.xOut + fsr.xIn) * 0.5, fsr.y, fsr.z);
  const railLen = fsr.xOut - fsr.xIn;
  registerBox(
    solids,
    box(scene, "FR_SOCKET_RAIL_BEAM", socketRail, mats.rail, [railLen, fsr.section, fsr.section], [0, 0, 0]),
    "fwd-rail-stbd",
    rail,
  );
  registerBox(
    solids,
    cyl(scene, "FR_SOCKET_STOP_OUT", socketRail, mats.mechanism, 0.035, 0.09, [railLen / 2, 0, 0], [0, 0, deg(90)]),
    "fwd-rail-stbd",
    rail,
  );
  registerBox(
    solids,
    cyl(scene, "FR_SOCKET_STOP_IN", socketRail, mats.mechanism, 0.035, 0.09, [-(railLen / 2), 0, 0], [0, 0, deg(90)]),
    "fwd-rail-stbd",
    rail,
  );
  datums.push({
    name: "FR_SOCKET_RAIL",
    kind: "rail",
    node: socketRail,
    note: `Starboard front −X rail length=${railLen.toFixed(3)} m`,
  });

  const nestReceiver = node("FR_NEST_RECEIVER", scene, root);
  const nr = STBD.flNestReceiver;
  nestReceiver.position.set(nr.x, nr.y, nr.z);
  const [ox, oy, oz] = nr.outer;
  const [by, bz] = nr.bore;
  const cheekY = (oy - by) / 4;
  const cheekCy = (oy + by) / 4;
  registerBox(
    solids,
    box(scene, "FR_NEST_CHEEK_UP", nestReceiver, mats.mechanism, [ox, 2 * cheekY, oz], [0, cheekCy, 0]),
    "fr-nest-receiver",
    { slice: "s4", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FR_NEST_CHEEK_DN", nestReceiver, mats.mechanism, [ox, 2 * cheekY, oz], [0, -cheekCy, 0]),
    "fr-nest-receiver",
    { slice: "s4", carryNode: "nest-receiver" },
  );
  const bridgeZ = (oz - bz) / 4;
  const bridgeCz = (oz + bz) / 4;
  registerBox(
    solids,
    box(scene, "FR_NEST_BRIDGE_P", nestReceiver, mats.mechanism, [ox, by, 2 * bridgeZ], [0, 0, bridgeCz]),
    "fr-nest-receiver",
    { slice: "s4", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FR_NEST_BRIDGE_S", nestReceiver, mats.mechanism, [ox, by, 2 * bridgeZ], [0, 0, -bridgeCz]),
    "fr-nest-receiver",
    { slice: "s4", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_NEST_BRACKET", root, carryMat, [0.3, 0.06, 0.28], [1.08, 2.33, 3.38]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "nest-bracket" },
  );
  datums.push({
    name: "FR_NEST_RECEIVER",
    kind: "lock",
    node: nestReceiver,
    note: "Starboard four-piece −X bore above the socket rail.",
  });

  const keeperLocal: [number, number, number] = [-P.fl.catchKeeperSpar[0], P.fl.catchKeeperSpar[1], P.fl.catchKeeperSpar[2]];
  const keeper = seatedSparWorldStbd(keeperLocal);
  const catchRoot = node("FR_PASSIVE_CATCH", scene, root);
  catchRoot.position.set(keeper.x, keeper.y, keeper.z);
  const th = P.fl.catchThroat;
  registerBox(
    solids,
    box(scene, "FR_CATCH_CHEEK_FWD", catchRoot, mats.lock, [...th.cheek], [0, 0, th.offsetZ]),
    "fr-catch-throat",
    { slice: "s4", carryNode: "catch" },
  );
  registerBox(
    solids,
    box(scene, "FR_CATCH_CHEEK_AFT", catchRoot, mats.lock, [...th.cheek], [0, 0, -th.offsetZ]),
    "fr-catch-throat",
    { slice: "s4", carryNode: "catch" },
  );
  registerBox(
    solids,
    box(scene, "FR_CATCH_BACK", catchRoot, mats.lock, [...th.back], [-(th.cheek[0] / 2 + th.back[0] / 2), 0, 0]),
    "fr-catch-throat",
    { slice: "s4", carryNode: "catch" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_CATCH_ARM", root, carryMat, [0.08, 0.08, 0.34], [keeper.x, 0.9, 1.3]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "catch-arm" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_CATCH_RISER_FWD", root, carryMat, [0.05, keeper.y - 0.9, 0.025], [
      keeper.x,
      (keeper.y + 0.9) / 2,
      keeper.z + th.offsetZ,
    ]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "catch-riser" },
  );
  registerBox(
    solids,
    box(scene, "FWD_STBD_CATCH_RISER_AFT", root, carryMat, [0.05, keeper.y - 0.9, 0.025], [
      keeper.x,
      (keeper.y + 0.9) / 2,
      keeper.z - th.offsetZ,
    ]),
    "fwd-carry-stbd",
    { ...carry, carryNode: "catch-riser" },
  );
  datums.push({
    name: "FR_PASSIVE_CATCH",
    kind: "lock",
    node: catchRoot,
    note: "Starboard passive U-throat supported from below/aft.",
  });
  datums.push({
    name: "FWD_CARRY_STBD",
    kind: "pivot",
    node: root,
    note: "Starboard open framed receiver homologous to FWD_CARRY.",
  });

  return { root, socketRail, nestReceiver, catchRoot, datums, solids };
}
