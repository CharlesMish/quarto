import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, hingeLocalY, vaneThickness } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import type { DebugDatum } from "./types";

export interface RearLeftBuild {
  carriage: TransformNode;
  yaw: TransformNode;
  roll: TransformNode;
  bookHinge: TransformNode;
  bookLatch: TransformNode;
  spreadLock: TransformNode;
  nestBolt: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

export function buildRearLeft(scene: Scene, parent: TransformNode, mats: Materials): RearLeftBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const { rl } = P;
  const thick = vaneThickness();
  const book = { moving: true, book: true, keepoutSweep: true };

  const carriage = node("RL_CARRIAGE", scene, parent);
  carriage.position.set(rl.spreadX, rl.y, rl.z);

  registerBox(solids, box(scene, "RL_CARRIAGE_BODY", carriage, mats.mechanism, [0.42, 0.2, 0.36], [0.02, -0.02, 0.08]), "carriage", {
    moving: true,
  });
  const shoe = P.socketRail.shoe;
  const s = P.socketRail.section;
  const shoePairs: Array<[string, [number, number, number]]> = [
    ["RL_SHOE_TOP", [0, s / 2 + shoe / 2, 0]],
    ["RL_SHOE_BOT", [0, -(s / 2 + shoe / 2), 0]],
    ["RL_SHOE_FWD", [0, 0, s / 2 + shoe / 2]],
    ["RL_SHOE_AFT", [0, 0, -(s / 2 + shoe / 2)]],
  ];
  for (const [name, pos] of shoePairs) {
    registerBox(solids, box(scene, name, carriage, mats.rail, [0.2, shoe, shoe], pos), "carriage", { moving: true });
  }

  const spreadLock = node("RL_SPREAD_LOCK", scene, carriage);
  spreadLock.position.set(-0.18, -0.12, 0.22);
  registerBox(solids, box(scene, "RL_SPREAD_LOCK_JAW", spreadLock, mats.lock, [0.08, 0.22, 0.06], [0, -0.1, 0]), "spread-lock", {
    moving: true,
  });
  datums.push({
    name: "RL_SPREAD_LOCK",
    kind: "lock",
    node: spreadLock,
    note: "Root clamp; opens during prep before book fold",
  });

  const nestBolt = node("RL_NEST_BOLT", scene, carriage);
  nestBolt.position.set(0, 0, rl.nestBoltRetractZ);
  registerBox(solids, box(scene, "RL_NEST_BOLT_PIN", nestBolt, mats.lock, [...rl.nestPinSize], [0, 0, 0]), "nest-pin", {
    moving: true,
    keepoutSweep: true,
  });
  datums.push({
    name: "RL_NEST_BOLT",
    kind: "lock",
    node: nestBolt,
    note: "Slides +Z through the real receiver bore after socket seats",
  });

  datums.push({
    name: "RL_CARRIAGE",
    kind: "pivot",
    node: carriage,
    note: "Socket carriage; translation is purely +X on SOCKET_RAIL",
  });

  const yaw = node("RL_YAW", scene, carriage);
  registerBox(solids, cyl(scene, "RL_YAW_BEARING", yaw, mats.rail, 0.16, 0.2, [0, 0.02, 0]), "bearing", { moving: true });
  datums.push({
    name: "RL_YAW",
    kind: "pivot",
    node: yaw,
    note: "Planform yaw about +Y; aft for the rear-left station",
  });

  const roll = node("RL_ROLL", scene, yaw);
  registerBox(
    solids,
    cyl(scene, "RL_ROLL_BEARING", roll, mats.rail, 0.22, 0.16, [0, 0, 0], [0, 0, deg(90)]),
    "bearing",
    { moving: true },
  );
  datums.push({
    name: "RL_ROLL",
    kind: "pivot",
    node: roll,
    note: "Haunch roll about local +X (span); child of yaw",
  });

  const spar = node("RL_SPAR", scene, roll);
  registerBox(solids, box(scene, "RL_SPAR_CAP", spar, mats.mechanism, [0.22, 0.1, 0.28], [-0.08, -0.04, 0.12]), "spar", {
    moving: true,
    book: true,
  });

  const inner = node("RL_VANE_INNER", scene, spar);
  registerBox(
    solids,
    box(scene, "RL_INNER_ARMOR", inner, mats.vaneArmor, [rl.innerSpan, rl.armorT, rl.chord], [
      -rl.innerSpan / 2,
      -rl.armorT / 2,
      rl.chord / 2,
    ]),
    "vane-inner",
    book,
  );
  registerBox(
    solids,
    box(scene, "RL_INNER_UNDER", inner, mats.underside, [rl.innerSpan - 0.08, rl.undersideT, rl.chord - 0.16], [
      -rl.innerSpan / 2,
      -(rl.armorT + rl.undersideT / 2),
      rl.chord / 2,
    ]),
    "vane-inner",
    book,
  );
  for (const zFrac of [0.18, 0.5, 0.82]) {
    registerBox(
      solids,
      box(scene, `RL_INNER_RIB_${zFrac}`, inner, mats.mechanism, [rl.innerSpan - 0.12, rl.undersideT - 0.02, 0.06], [
        -rl.innerSpan / 2,
        -(rl.armorT + rl.undersideT / 2),
        rl.chord * zFrac,
      ]),
      "vane-inner",
      { moving: true, book: true },
    );
  }
  registerBox(
    solids,
    box(scene, "RL_INNER_SPAR", inner, mats.mechanism, [0.1, thick - 0.02, rl.chord - 0.1], [
      -rl.innerSpan * 0.55,
      -thick / 2,
      rl.chord / 2,
    ]),
    "vane-inner",
    { moving: true, book: true },
  );
  datums.push({
    name: "RL_VANE_INNER",
    kind: "pivot",
    node: inner,
    note: `Inner vane ${rl.innerSpan} m span × ${rl.chord} m chord`,
  });

  const bookHinge = node("RL_BOOK_HINGE", scene, spar);
  bookHinge.position.set(-rl.innerSpan, hingeLocalY(), rl.chord / 2);
  registerBox(
    solids,
    cyl(scene, "RL_BOOK_HINGE_BARREL", bookHinge, mats.rail, rl.chord - 0.2, 0.09, [0, 0, 0], [deg(90), 0, 0]),
    "bearing",
    { moving: true, book: true },
  );
  datums.push({
    name: "RL_BOOK_HINGE",
    kind: "pivot",
    node: bookHinge,
    note: "Chordwise book hinge; +Z rotation folds outer underside-to-underside",
  });

  const outer = node("RL_VANE_OUTER", scene, bookHinge);
  const face = P.rl.bookGap / 2;
  registerBox(
    solids,
    box(scene, "RL_OUTER_ARMOR", outer, mats.vaneArmor, [rl.outerSpan, rl.armorT, rl.chord], [
      -rl.outerSpan / 2,
      face + rl.undersideT + rl.armorT / 2,
      0,
    ]),
    "vane-outer",
    book,
  );
  registerBox(
    solids,
    box(scene, "RL_OUTER_UNDER", outer, mats.underside, [rl.outerSpan - 0.08, rl.undersideT, rl.chord - 0.16], [
      -rl.outerSpan / 2,
      face + rl.undersideT / 2,
      0,
    ]),
    "vane-outer",
    book,
  );
  for (const zOff of [-0.7, 0, 0.7]) {
    registerBox(
      solids,
      box(scene, `RL_OUTER_RIB_${zOff}`, outer, mats.mechanism, [rl.outerSpan - 0.12, rl.undersideT - 0.02, 0.06], [
        -rl.outerSpan / 2,
        face + rl.undersideT / 2,
        zOff,
      ]),
      "vane-outer",
      { moving: true, book: true },
    );
  }
  datums.push({
    name: "RL_VANE_OUTER",
    kind: "pivot",
    node: outer,
    note: `Outer vane ${rl.outerSpan} m; folds about book hinge`,
  });

  registerBox(
    solids,
    box(scene, "RL_LATCH_KEEPER", outer, mats.lock, [...rl.keeperSize], [...rl.keeperOpen]),
    "latch-keeper",
    { moving: true, book: true, keepoutSweep: true },
  );

  const [sx, sy, sz] = rl.latchSpar;
  registerBox(
    solids,
    box(scene, "RL_LATCH_CHEEK_P", spar, mats.lock, [...rl.cheekSize], [sx, sy + rl.cheekSparY, sz + rl.cheekOffsetZ]),
    "latch-hook",
    { moving: true, book: true, keepoutSweep: true },
  );
  registerBox(
    solids,
    box(scene, "RL_LATCH_CHEEK_S", spar, mats.lock, [...rl.cheekSize], [sx, sy + rl.cheekSparY, sz - rl.cheekOffsetZ]),
    "latch-hook",
    { moving: true, book: true, keepoutSweep: true },
  );
  registerBox(
    solids,
    box(scene, "RL_LATCH_THROAT_BACK", spar, mats.lock, [...rl.throatBackSize], [sx, sy + rl.throatBackSparY, sz]),
    "latch-hook",
    { moving: true, book: true, keepoutSweep: true },
  );

  const bookLatch = node("RL_BOOK_LATCH", scene, spar);
  bookLatch.position.set(sx, sy, sz);
  registerBox(
    solids,
    box(scene, "RL_LATCH_JAW", bookLatch, mats.lock, [...rl.jawSize], [...rl.jawLocal]),
    "latch-hook",
    { moving: true, book: true, keepoutSweep: true },
  );
  datums.push({
    name: "RL_BOOK_LATCH",
    kind: "lock",
    node: bookLatch,
    note: "Rotating jaw closes the open U-throat after fold; keeper stays in the throat",
  });

  return {
    carriage,
    yaw,
    roll,
    bookHinge,
    bookLatch,
    spreadLock,
    nestBolt,
    datums,
    solids,
  };
}
