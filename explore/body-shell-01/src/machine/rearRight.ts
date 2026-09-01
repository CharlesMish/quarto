import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, hingeLocalY, vaneThickness } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import { STBD } from "./side";
import type { DebugDatum } from "./types";

export interface RearRightBuild {
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

const s4 = { slice: "s4" as const };
const moving = { moving: true, slice: "s4" as const };
const book = { moving: true, book: true, keepoutSweep: true, slice: "s4" as const };

export function buildRearRight(scene: Scene, parent: TransformNode, mats: Materials): RearRightBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const { rl } = P;
  const thick = vaneThickness();
  const vane = mats.vaneArmor;

  const carriage = node("RR_CARRIAGE", scene, parent);
  carriage.position.set(STBD.rear.spreadX, rl.y, rl.z);

  registerBox(
    solids,
    box(scene, "RR_CARRIAGE_BODY", carriage, mats.mechanism, [0.42, 0.2, 0.36], [-0.02, -0.02, 0.08]),
    "rr-carriage",
    moving,
  );
  const shoe = P.socketRail.shoe;
  const sec = P.socketRail.section;
  const shoePairs: Array<[string, [number, number, number]]> = [
    ["RR_SHOE_TOP", [0, sec / 2 + shoe / 2, 0]],
    ["RR_SHOE_BOT", [0, -(sec / 2 + shoe / 2), 0]],
    ["RR_SHOE_FWD", [0, 0, sec / 2 + shoe / 2]],
    ["RR_SHOE_AFT", [0, 0, -(sec / 2 + shoe / 2)]],
  ];
  for (const [name, pos] of shoePairs) {
    registerBox(solids, box(scene, name, carriage, mats.rail, [0.2, shoe, shoe], pos), "rr-carriage", moving);
  }

  const spreadLock = node("RR_SPREAD_LOCK", scene, carriage);
  spreadLock.position.set(0.18, -0.12, 0.22);
  registerBox(
    solids,
    box(scene, "RR_SPREAD_LOCK_JAW", spreadLock, mats.lock, [0.08, 0.22, 0.06], [0, -0.1, 0]),
    "rr-spread-lock",
    moving,
  );
  datums.push({
    name: "RR_SPREAD_LOCK",
    kind: "lock",
    node: spreadLock,
    note: "Starboard root clamp; opens during prep before book fold",
  });

  const nestBolt = node("RR_NEST_BOLT", scene, carriage);
  nestBolt.position.set(0, 0, rl.nestBoltRetractZ);
  registerBox(
    solids,
    box(scene, "RR_NEST_BOLT_PIN", nestBolt, mats.lock, [...rl.nestPinSize], [0, 0, 0]),
    "rr-nest-pin",
    { moving: true, keepoutSweep: true, slice: "s4" },
  );
  datums.push({
    name: "RR_NEST_BOLT",
    kind: "lock",
    node: nestBolt,
    note: "Slides +Z through the starboard receiver bore after socket seats",
  });

  datums.push({
    name: "RR_CARRIAGE",
    kind: "pivot",
    node: carriage,
    note: "Starboard socket carriage; translation is purely −X (inboard) on RR_SOCKET_RAIL",
  });

  const yaw = node("RR_YAW", scene, carriage);
  registerBox(solids, cyl(scene, "RR_YAW_BEARING", yaw, mats.rail, 0.16, 0.2, [0, 0.02, 0]), "rr-bearing", moving);
  datums.push({
    name: "RR_YAW",
    kind: "pivot",
    node: yaw,
    note: "Planform yaw about +Y; +90° aft for the rear-starboard station",
  });

  const roll = node("RR_ROLL", scene, yaw);
  registerBox(
    solids,
    cyl(scene, "RR_ROLL_BEARING", roll, mats.rail, 0.22, 0.16, [0, 0, 0], [0, 0, deg(90)]),
    "rr-bearing",
    moving,
  );
  datums.push({
    name: "RR_ROLL",
    kind: "pivot",
    node: roll,
    note: "Haunch roll about local +X (span); child of yaw",
  });

  const spar = node("RR_SPAR", scene, roll);
  registerBox(
    solids,
    box(scene, "RR_SPAR_CAP", spar, mats.mechanism, [0.22, 0.1, 0.28], [0.08, -0.04, 0.12]),
    "rr-spar",
    { moving: true, book: true, slice: "s4" },
  );

  const inner = node("RR_VANE_INNER", scene, spar);
  registerBox(
    solids,
    box(scene, "RR_INNER_ARMOR", inner, vane, [rl.innerSpan, rl.armorT, rl.chord], [
      rl.innerSpan / 2,
      -rl.armorT / 2,
      rl.chord / 2,
    ]),
    "rr-vane-inner",
    book,
  );
  registerBox(
    solids,
    box(scene, "RR_INNER_UNDER", inner, mats.underside, [rl.innerSpan - 0.08, rl.undersideT, rl.chord - 0.16], [
      rl.innerSpan / 2,
      -(rl.armorT + rl.undersideT / 2),
      rl.chord / 2,
    ]),
    "rr-vane-inner",
    book,
  );
  for (const zFrac of [0.18, 0.5, 0.82]) {
    registerBox(
      solids,
      box(scene, `RR_INNER_RIB_${zFrac}`, inner, mats.mechanism, [rl.innerSpan - 0.12, rl.undersideT - 0.02, 0.06], [
        rl.innerSpan / 2,
        -(rl.armorT + rl.undersideT / 2),
        rl.chord * zFrac,
      ]),
      "rr-vane-inner",
      { moving: true, book: true, slice: "s4" },
    );
  }
  registerBox(
    solids,
    box(scene, "RR_INNER_SPAR", inner, mats.mechanism, [0.1, thick - 0.02, rl.chord - 0.1], [
      rl.innerSpan * 0.55,
      -thick / 2,
      rl.chord / 2,
    ]),
    "rr-vane-inner",
    { moving: true, book: true, slice: "s4" },
  );
  datums.push({
    name: "RR_VANE_INNER",
    kind: "pivot",
    node: inner,
    note: `Starboard inner vane ${rl.innerSpan} m span × ${rl.chord} m chord`,
  });

  const bookHinge = node("RR_BOOK_HINGE", scene, spar);
  bookHinge.position.set(rl.innerSpan, hingeLocalY(), rl.chord / 2);
  registerBox(
    solids,
    cyl(scene, "RR_BOOK_HINGE_BARREL", bookHinge, mats.rail, rl.chord - 0.2, 0.09, [0, 0, 0], [deg(90), 0, 0]),
    "rr-bearing",
    { moving: true, book: true, slice: "s4" },
  );
  datums.push({
    name: "RR_BOOK_HINGE",
    kind: "pivot",
    node: bookHinge,
    note: "Chordwise book hinge; +Z rotation folds outer underside-to-underside",
  });

  const outer = node("RR_VANE_OUTER", scene, bookHinge);
  const face = P.rl.bookGap / 2;
  registerBox(
    solids,
    box(scene, "RR_OUTER_ARMOR", outer, vane, [rl.outerSpan, rl.armorT, rl.chord], [
      rl.outerSpan / 2,
      face + rl.undersideT + rl.armorT / 2,
      0,
    ]),
    "rr-vane-outer",
    book,
  );
  registerBox(
    solids,
    box(scene, "RR_OUTER_UNDER", outer, mats.underside, [rl.outerSpan - 0.08, rl.undersideT, rl.chord - 0.16], [
      rl.outerSpan / 2,
      face + rl.undersideT / 2,
      0,
    ]),
    "rr-vane-outer",
    book,
  );
  for (const zOff of [-0.7, 0, 0.7]) {
    registerBox(
      solids,
      box(scene, `RR_OUTER_RIB_${zOff}`, outer, mats.mechanism, [rl.outerSpan - 0.12, rl.undersideT - 0.02, 0.06], [
        rl.outerSpan / 2,
        face + rl.undersideT / 2,
        zOff,
      ]),
      "rr-vane-outer",
      { moving: true, book: true, slice: "s4" },
    );
  }
  datums.push({
    name: "RR_VANE_OUTER",
    kind: "pivot",
    node: outer,
    note: `Starboard outer vane ${rl.outerSpan} m; folds about book hinge`,
  });

  const [kx, ky, kz] = rl.keeperOpen;
  registerBox(
    solids,
    box(scene, "RR_LATCH_KEEPER", outer, mats.lock, [...rl.keeperSize], [-kx, ky, kz]),
    "rr-latch-keeper",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );

  const [sx, sy, sz] = rl.latchSpar;
  registerBox(
    solids,
    box(scene, "RR_LATCH_CHEEK_P", spar, mats.lock, [...rl.cheekSize], [-sx, sy + rl.cheekSparY, sz + rl.cheekOffsetZ]),
    "rr-latch-hook",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  registerBox(
    solids,
    box(scene, "RR_LATCH_CHEEK_S", spar, mats.lock, [...rl.cheekSize], [-sx, sy + rl.cheekSparY, sz - rl.cheekOffsetZ]),
    "rr-latch-hook",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  registerBox(
    solids,
    box(scene, "RR_LATCH_THROAT_BACK", spar, mats.lock, [...rl.throatBackSize], [-sx, sy + rl.throatBackSparY, sz]),
    "rr-latch-hook",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );

  const bookLatch = node("RR_BOOK_LATCH", scene, spar);
  bookLatch.position.set(-sx, sy, sz);
  const [jx, jy, jz] = rl.jawLocal;
  registerBox(
    solids,
    box(scene, "RR_LATCH_JAW", bookLatch, mats.lock, [...rl.jawSize], [-jx, jy, jz]),
    "rr-latch-hook",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  datums.push({
    name: "RR_BOOK_LATCH",
    kind: "lock",
    node: bookLatch,
    note: "Starboard rotating jaw closes the open U-throat after fold",
  });

  void s4;
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
