import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, flSocketRailLength } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import type { DebugDatum } from "./types";

export interface FwdCarryBuild {
  root: TransformNode;
  socketRail: TransformNode;
  nestReceiver: TransformNode;
  catchRoot: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

const carry = { slice: "s2" as const, carryNode: "fwd-carry" };
const rail = { slice: "s2" as const, carryNode: "fwd-rail" };

function seatedSparWorld(local: readonly [number, number, number]): { x: number; y: number; z: number } {
  const cant = deg(P.fl.cantDeg);
  const c = Math.cos(cant);
  const s = Math.sin(cant);
  const [x, y, z] = local;
  const y1 = y * c - z * s;
  const z1 = y * s + z * c;
  return {
    x: P.fl.nestX - z1,
    y: P.fl.y + y1,
    z: P.fl.z + x,
  };
}

export function buildFwdCarry(scene: Scene, parent: TransformNode, mats: Materials): FwdCarryBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const root = node("FWD_CARRY", scene, parent);
  const carryMat = mats.carry ?? mats.frame;

  registerBox(
    solids,
    box(scene, "FWD_IFACE_FWD", root, carryMat, [0.14, 0.5, 0.12], [-0.82, 1.22, 3.35]),
    "fwd-iface",
    { ...carry, carryNode: "iface-fwd" },
  );
  registerBox(
    solids,
    box(scene, "FWD_IFACE_AFT", root, carryMat, [0.14, 0.5, 0.12], [-0.82, 1.22, 1.15]),
    "fwd-iface",
    { ...carry, carryNode: "iface-aft" },
  );

  registerBox(
    solids,
    box(scene, "FWD_FRAME_FWD_IN", root, carryMat, [0.08, 1.56, 0.08], [-0.79, 1.64, 3.35]),
    "fwd-carry",
    { ...carry, carryNode: "frame-fwd" },
  );
  registerBox(
    solids,
    box(scene, "FWD_FRAME_FWD_TOP", root, carryMat, [0.42, 0.08, 0.08], [-0.96, 2.36, 3.35]),
    "fwd-carry",
    { ...carry, carryNode: "frame-fwd-top" },
  );
  registerBox(
    solids,
    box(scene, "FWD_FRAME_AFT", root, carryMat, [1.16, 1.56, 0.08], [-1.37, 1.64, 1.15]),
    "fwd-carry",
    { ...carry, carryNode: "frame-aft" },
  );

  registerBox(
    solids,
    box(scene, "FWD_LONGERON_HIGH", root, carryMat, [0.08, 0.08, 2.2], [-0.79, 2.36, 2.25]),
    "fwd-carry",
    { ...carry, carryNode: "longeron-high" },
  );
  registerBox(
    solids,
    box(scene, "FWD_LONGERON_LOW", root, carryMat, [0.08, 0.1, 2.2], [-0.79, 0.88, 2.25]),
    "fwd-carry",
    { ...carry, carryNode: "longeron-low" },
  );

  registerBox(
    solids,
    box(scene, "FWD_RAIL_BRACKET", root, carryMat, [0.38, 0.12, 0.12], [-0.96, 2.28, 3.28]),
    "fwd-carry",
    { ...carry, carryNode: "rail-bracket" },
  );

  const socketRail = node("FL_SOCKET_RAIL", scene, root);
  socketRail.position.set((P.flSocketRail.xOut + P.flSocketRail.xIn) * 0.5, P.flSocketRail.y, P.flSocketRail.z);
  const railLen = flSocketRailLength();
  registerBox(
    solids,
    box(scene, "FL_SOCKET_RAIL_BEAM", socketRail, mats.rail, [railLen, P.flSocketRail.section, P.flSocketRail.section], [0, 0, 0]),
    "fwd-rail",
    rail,
  );
  registerBox(
    solids,
    cyl(scene, "FL_SOCKET_STOP_OUT", socketRail, mats.mechanism, 0.035, 0.09, [-(railLen / 2), 0, 0], [0, 0, deg(90)]),
    "fwd-rail",
    rail,
  );
  registerBox(
    solids,
    cyl(scene, "FL_SOCKET_STOP_IN", socketRail, mats.mechanism, 0.035, 0.09, [railLen / 2, 0, 0], [0, 0, deg(90)]),
    "fwd-rail",
    rail,
  );
  datums.push({
    name: "FL_SOCKET_RAIL",
    kind: "rail",
    node: socketRail,
    note: `Fixed +X front rail dir=(1,0,0) length=${railLen.toFixed(3)} m`,
  });

  const nestReceiver = node("FL_NEST_RECEIVER", scene, root);
  const nr = P.fl.nestReceiver;
  nestReceiver.position.set(nr.x, nr.y, nr.z);
  const [ox, oy, oz] = nr.outer;
  const [by, bz] = nr.bore;
  const cheekY = (oy - by) / 4;
  const cheekCy = (oy + by) / 4;
  registerBox(
    solids,
    box(scene, "FL_NEST_CHEEK_UP", nestReceiver, mats.mechanism, [ox, 2 * cheekY, oz], [0, cheekCy, 0]),
    "fl-nest-receiver",
    { slice: "s2", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FL_NEST_CHEEK_DN", nestReceiver, mats.mechanism, [ox, 2 * cheekY, oz], [0, -cheekCy, 0]),
    "fl-nest-receiver",
    { slice: "s2", carryNode: "nest-receiver" },
  );
  const bridgeZ = (oz - bz) / 4;
  const bridgeCz = (oz + bz) / 4;
  registerBox(
    solids,
    box(scene, "FL_NEST_BRIDGE_P", nestReceiver, mats.mechanism, [ox, by, 2 * bridgeZ], [0, 0, bridgeCz]),
    "fl-nest-receiver",
    { slice: "s2", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FL_NEST_BRIDGE_S", nestReceiver, mats.mechanism, [ox, by, 2 * bridgeZ], [0, 0, -bridgeCz]),
    "fl-nest-receiver",
    { slice: "s2", carryNode: "nest-receiver" },
  );
  registerBox(
    solids,
    box(scene, "FWD_NEST_BRACKET", root, carryMat, [0.3, 0.06, 0.28], [-1.08, 2.33, 3.38]),
    "fwd-carry",
    { ...carry, carryNode: "nest-bracket" },
  );
  datums.push({
    name: "FL_NEST_RECEIVER",
    kind: "lock",
    node: nestReceiver,
    note: "Four-piece +X bore above the socket rail. Independent empty nest-pin lane.",
  });

  const keeper = seatedSparWorld(P.fl.catchKeeperSpar);
  const catchRoot = node("FL_PASSIVE_CATCH", scene, root);
  catchRoot.position.set(keeper.x, keeper.y, keeper.z);
  const th = P.fl.catchThroat;
  registerBox(
    solids,
    box(scene, "FL_CATCH_CHEEK_FWD", catchRoot, mats.lock, [...th.cheek], [0, 0, th.offsetZ]),
    "fl-catch-throat",
    { slice: "s2", carryNode: "catch" },
  );
  registerBox(
    solids,
    box(scene, "FL_CATCH_CHEEK_AFT", catchRoot, mats.lock, [...th.cheek], [0, 0, -th.offsetZ]),
    "fl-catch-throat",
    { slice: "s2", carryNode: "catch" },
  );
  registerBox(
    solids,
    box(scene, "FL_CATCH_BACK", catchRoot, mats.lock, [...th.back], [th.cheek[0] / 2 + th.back[0] / 2, 0, 0]),
    "fl-catch-throat",
    { slice: "s2", carryNode: "catch" },
  );

  registerBox(
    solids,
    box(scene, "FWD_CATCH_ARM", root, carryMat, [0.08, 0.08, 0.34], [keeper.x, 0.9, 1.3]),
    "fwd-carry",
    { ...carry, carryNode: "catch-arm" },
  );
  registerBox(
    solids,
    box(scene, "FWD_CATCH_RISER_FWD", root, carryMat, [0.05, keeper.y - 0.9, 0.025], [
      keeper.x,
      (keeper.y + 0.9) / 2,
      keeper.z + th.offsetZ,
    ]),
    "fwd-carry",
    { ...carry, carryNode: "catch-riser" },
  );
  registerBox(
    solids,
    box(scene, "FWD_CATCH_RISER_AFT", root, carryMat, [0.05, keeper.y - 0.9, 0.025], [
      keeper.x,
      (keeper.y + 0.9) / 2,
      keeper.z - th.offsetZ,
    ]),
    "fwd-carry",
    { ...carry, carryNode: "catch-riser" },
  );
  datums.push({
    name: "FL_PASSIVE_CATCH",
    kind: "lock",
    node: catchRoot,
    note: "Passive U-throat supported from below/aft. Arm does not occupy the capture volume.",
  });

  datums.push({
    name: "FWD_CARRY",
    kind: "pivot",
    node: root,
    note: "Open framed receiver: inboard high/low longerons + Z-end frames. Stored strake occupies the empty middle.",
  });

  return { root, socketRail, nestReceiver, catchRoot, datums, solids };
}
