import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, flHingeLocalY, flVaneThickness } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import type { DebugDatum } from "./types";
import { panelsAroundYBore } from "./yBore";

export interface FrontLeftBuild {
  carriage: TransformNode;
  yaw: TransformNode;
  cant: TransformNode;
  bookHinge: TransformNode;
  bookPin: TransformNode;
  nestPin: TransformNode;
  spreadLock: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

const S2 = { slice: "s2" as const };
const moving = { moving: true, slice: "s2" as const };
const book = { moving: true, book: true, keepoutSweep: true, slice: "s2" as const };

export function buildFrontLeft(scene: Scene, parent: TransformNode, mats: Materials): FrontLeftBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const { fl } = P;
  const thick = flVaneThickness();

  const carriage = node("FL_CARRIAGE", scene, parent);
  carriage.position.set(fl.spreadX, fl.y, fl.z);

  registerBox(
    solids,
    box(scene, "FL_CARRIAGE_BODY", carriage, mats.mechanism, [0.24, 0.12, 0.22], [-0.12, 0.12, 0.1]),
    "fl-carriage",
    moving,
  );
  const shoe = P.flSocketRail.shoe;
  const s = P.flSocketRail.section;
  const shoePairs: Array<[string, [number, number, number]]> = [
    ["FL_SHOE_TOP", [0, s / 2 + shoe / 2, 0]],
    ["FL_SHOE_BOT", [0, -(s / 2 + shoe / 2), 0]],
    ["FL_SHOE_FWD", [0, 0, s / 2 + shoe / 2]],
    ["FL_SHOE_AFT", [0, 0, -(s / 2 + shoe / 2)]],
  ];
  for (const [name, pos] of shoePairs) {
    registerBox(solids, box(scene, name, carriage, mats.rail, [0.16, shoe, shoe], pos), "fl-carriage", moving);
  }

  const spreadLock = node("FL_SPREAD_LOCK", scene, carriage);
  spreadLock.position.set(-0.14, -0.1, 0.16);
  registerBox(
    solids,
    box(scene, "FL_SPREAD_LOCK_JAW", spreadLock, mats.lock, [0.06, 0.16, 0.05], [0, -0.08, 0]),
    "fl-spread-lock",
    moving,
  );
  datums.push({
    name: "FL_SPREAD_LOCK",
    kind: "lock",
    node: spreadLock,
    note: "Root stay; opens during prep before front fold",
  });

  const nestPin = node("FL_NEST_PIN", scene, carriage);
  nestPin.position.set(fl.nestPinRetractX, fl.nestPinLocalY, fl.nestPinLocalZ);
  registerBox(
    solids,
    box(scene, "FL_NEST_PIN_BODY", nestPin, mats.lock, [...fl.nestPinSize], [0, 0, 0]),
    "fl-nest-pin",
    { moving: true, keepoutSweep: true, slice: "s2" },
  );
  datums.push({
    name: "FL_NEST_PIN",
    kind: "lock",
    node: nestPin,
    note: "Separate +X nest pin into the fixed carry receiver after socket",
  });

  datums.push({
    name: "FL_CARRIAGE",
    kind: "pivot",
    node: carriage,
    note: "Front socket carriage; translation is purely +X on FL_SOCKET_RAIL",
  });

  const yaw = node("FL_YAW", scene, carriage);
  registerBox(solids, cyl(scene, "FL_YAW_BEARING", yaw, mats.rail, 0.14, 0.16, [0, 0.18, 0]), "fl-bearing", moving);
  datums.push({
    name: "FL_YAW",
    kind: "pivot",
    node: yaw,
    note: "Planform yaw about +Y; aft for the front-left station",
  });

  const cant = node("FL_CANT", scene, yaw);
  registerBox(
    solids,
    cyl(scene, "FL_CANT_BEARING", cant, mats.rail, 0.16, 0.12, [-0.18, 0.2, 0.08], [0, 0, deg(90)]),
    "fl-bearing",
    moving,
  );
  datums.push({
    name: "FL_CANT",
    kind: "pivot",
    node: cant,
    note: "Strake cant about local +X (span after yaw); child of yaw",
  });

  const spar = node("FL_SPAR", scene, cant);
  registerBox(
    solids,
    box(scene, "FL_SPAR_CAP", spar, mats.mechanism, [0.18, 0.08, 0.22], [-0.22, 0.2, 0.12]),
    "fl-spar",
    { moving: true, book: true, slice: "s2" },
  );

  const inner = node("FL_VANE_INNER", scene, spar);
  const [cutX, cutZ] = fl.bookCutout;
  const innerArmorY = -fl.armorT / 2;
  const innerUnderY = -(fl.armorT + fl.undersideT / 2);
  const innerArmorPanels = panelsAroundYBore(
    -fl.innerSpan,
    -0.25,
    0.25,
    fl.chord,
    fl.bookPinSpar[0],
    fl.bookPinSpar[2],
    cutX / 2,
    cutZ / 2,
  );
  innerArmorPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FL_INNER_ARMOR_${i}`, inner, mats.vaneArmor, [p.size[0], fl.armorT, p.size[1]], [
        p.pos[0],
        innerArmorY,
        p.pos[1],
      ]),
      "fl-vane-inner",
      book,
    );
  });
  const innerUnderPanels = panelsAroundYBore(
    -(fl.innerSpan - 0.03),
    -0.28,
    0.28,
    fl.chord - 0.06,
    fl.bookPinSpar[0],
    fl.bookPinSpar[2],
    cutX / 2,
    cutZ / 2,
  );
  innerUnderPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FL_INNER_UNDER_${i}`, inner, mats.underside, [p.size[0], fl.undersideT, p.size[1]], [
        p.pos[0],
        innerUnderY,
        p.pos[1],
      ]),
      "fl-vane-inner",
      book,
    );
  });
  for (const zFrac of [0.22, 0.5, 0.78]) {
    registerBox(
      solids,
      box(scene, `FL_INNER_RIB_${zFrac}`, inner, mats.mechanism, [fl.innerSpan - 0.1, fl.undersideT - 0.02, 0.05], [
        -fl.innerSpan / 2,
        -(fl.armorT + fl.undersideT / 2),
        fl.chord * zFrac,
      ]),
      "fl-vane-inner",
      { moving: true, book: true, slice: "s2" },
    );
  }
  registerBox(
    solids,
    box(scene, "FL_INNER_SPAR", inner, mats.mechanism, [0.08, thick - 0.02, fl.chord - 0.08], [
      -fl.innerSpan * 0.55,
      -thick / 2,
      fl.chord / 2,
    ]),
    "fl-vane-inner",
    { moving: true, book: true, slice: "s2" },
  );
  datums.push({
    name: "FL_VANE_INNER",
    kind: "pivot",
    node: inner,
    note: `Front inner ${fl.innerSpan} m span × ${fl.chord} m chord`,
  });

  const bookHinge = node("FL_BOOK_HINGE", scene, spar);
  bookHinge.position.set(-fl.innerSpan, flHingeLocalY(), fl.chord / 2);
  registerBox(
    solids,
    cyl(scene, "FL_BOOK_HINGE_BARREL", bookHinge, mats.rail, fl.chord - 0.16, 0.07, [0, 0, 0], [deg(90), 0, 0]),
    "fl-bearing",
    { moving: true, book: true, slice: "s2" },
  );
  datums.push({
    name: "FL_BOOK_HINGE",
    kind: "pivot",
    node: bookHinge,
    note: "Chordwise front hinge; +Z rotation folds outer underside-to-underside",
  });

  const outer = node("FL_VANE_OUTER", scene, bookHinge);
  const face = fl.bookGap / 2;
  const [rx, ry, rz] = fl.bookReceiverHinge;
  const outerArmorY = face + fl.undersideT + fl.armorT / 2;
  const outerUnderY = face + fl.undersideT / 2;
  const outerArmorPanels = panelsAroundYBore(
    -fl.outerSpan,
    0,
    -fl.chord / 2,
    fl.chord / 2,
    rx,
    rz,
    cutX / 2,
    cutZ / 2,
  );
  outerArmorPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FL_OUTER_ARMOR_${i}`, outer, mats.vaneArmor, [p.size[0], fl.armorT, p.size[1]], [
        p.pos[0],
        outerArmorY,
        p.pos[1],
      ]),
      "fl-vane-outer",
      book,
    );
  });
  const outerUnderPanels = panelsAroundYBore(
    -(fl.outerSpan - 0.03),
    -0.03,
    -(fl.chord / 2 - 0.06),
    fl.chord / 2 - 0.06,
    rx,
    rz,
    cutX / 2,
    cutZ / 2,
  );
  outerUnderPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FL_OUTER_UNDER_${i}`, outer, mats.underside, [p.size[0], fl.undersideT, p.size[1]], [
        p.pos[0],
        outerUnderY,
        p.pos[1],
      ]),
      "fl-vane-outer",
      book,
    );
  });
  for (const zOff of [-0.32, 0, 0.32]) {
    registerBox(
      solids,
      box(scene, `FL_OUTER_RIB_${zOff}`, outer, mats.mechanism, [fl.outerSpan - 0.1, fl.undersideT - 0.02, 0.05], [
        -fl.outerSpan / 2,
        face + fl.undersideT / 2,
        zOff,
      ]),
      "fl-vane-outer",
      { moving: true, book: true, slice: "s2" },
    );
  }
  datums.push({
    name: "FL_VANE_OUTER",
    kind: "pivot",
    node: outer,
    note: `Front outer ${fl.outerSpan} m; folds about book hinge`,
  });

  const [ox, oy, oz] = fl.bookReceiverOuter;
  const [bx, bz] = fl.bookBore;
  const cheekX = (ox - bx) / 4;
  const cheekCx = (ox + bx) / 4;
  registerBox(
    solids,
    box(scene, "FL_BOOK_CHEEK_P", bookHinge, mats.lock, [2 * cheekX, oy, oz], [rx - cheekCx, ry, rz]),
    "fl-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s2" },
  );
  registerBox(
    solids,
    box(scene, "FL_BOOK_CHEEK_S", bookHinge, mats.lock, [2 * cheekX, oy, oz], [rx + cheekCx, ry, rz]),
    "fl-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s2" },
  );
  const bridgeZ = (oz - bz) / 4;
  const bridgeCz = (oz + bz) / 4;
  registerBox(
    solids,
    box(scene, "FL_BOOK_BRIDGE_FWD", bookHinge, mats.lock, [bx, oy, 2 * bridgeZ], [rx, ry, rz + bridgeCz]),
    "fl-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s2" },
  );
  registerBox(
    solids,
    box(scene, "FL_BOOK_BRIDGE_AFT", bookHinge, mats.lock, [bx, oy, 2 * bridgeZ], [rx, ry, rz - bridgeCz]),
    "fl-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s2" },
  );

  const bookPin = node("FL_BOOK_PIN", scene, spar);
  bookPin.position.set(fl.bookPinSpar[0], fl.bookPinRetractY, fl.bookPinSpar[2]);
  registerBox(
    solids,
    box(scene, "FL_BOOK_PIN_BODY", bookPin, mats.lock, [...fl.bookPinSize], [0, 0, 0]),
    "fl-book-pin",
    { moving: true, keepoutSweep: true, slice: "s2" },
  );
  datums.push({
    name: "FL_BOOK_PIN",
    kind: "lock",
    node: bookPin,
    note: "Pre-yaw through-pin. Extends −Y through the outer's real Y-bore after fold.",
  });

  registerBox(
    solids,
    box(scene, "FL_CATCH_KEEPER", spar, mats.lock, [...fl.catchKeeperSize], [...fl.catchKeeperSpar]),
    "fl-catch-keeper",
    { moving: true, book: true, keepoutSweep: true, slice: "s2" },
  );

  void S2;
  return {
    carriage,
    yaw,
    cant,
    bookHinge,
    bookPin,
    nestPin,
    spreadLock,
    datums,
    solids,
  };
}
