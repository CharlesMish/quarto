import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, flHingeLocalY, flVaneThickness } from "../design/parameters";
import { deg } from "../math/stage";
import { box, cyl, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import { STBD } from "./side";
import type { DebugDatum } from "./types";
import { panelsAroundYBore } from "./yBore";

export interface FrontRightBuild {
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

const moving = { moving: true, slice: "s4" as const };
const book = { moving: true, book: true, keepoutSweep: true, slice: "s4" as const };

export function buildFrontRight(scene: Scene, parent: TransformNode, mats: Materials): FrontRightBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const { fl } = P;
  const thick = flVaneThickness();

  const carriage = node("FR_CARRIAGE", scene, parent);
  carriage.position.set(STBD.front.spreadX, fl.y, fl.z);

  registerBox(
    solids,
    box(scene, "FR_CARRIAGE_BODY", carriage, mats.mechanism, [0.24, 0.12, 0.22], [0.12, 0.12, 0.1]),
    "fr-carriage",
    moving,
  );
  const shoe = P.flSocketRail.shoe;
  const s = P.flSocketRail.section;
  const shoePairs: Array<[string, [number, number, number]]> = [
    ["FR_SHOE_TOP", [0, s / 2 + shoe / 2, 0]],
    ["FR_SHOE_BOT", [0, -(s / 2 + shoe / 2), 0]],
    ["FR_SHOE_FWD", [0, 0, s / 2 + shoe / 2]],
    ["FR_SHOE_AFT", [0, 0, -(s / 2 + shoe / 2)]],
  ];
  for (const [name, pos] of shoePairs) {
    registerBox(solids, box(scene, name, carriage, mats.rail, [0.16, shoe, shoe], pos), "fr-carriage", moving);
  }

  const spreadLock = node("FR_SPREAD_LOCK", scene, carriage);
  spreadLock.position.set(0.14, -0.1, 0.16);
  registerBox(
    solids,
    box(scene, "FR_SPREAD_LOCK_JAW", spreadLock, mats.lock, [0.06, 0.16, 0.05], [0, -0.08, 0]),
    "fr-spread-lock",
    moving,
  );
  datums.push({
    name: "FR_SPREAD_LOCK",
    kind: "lock",
    node: spreadLock,
    note: "Starboard root stay; opens during prep before front fold",
  });

  const nestPin = node("FR_NEST_PIN", scene, carriage);
  nestPin.position.set(STBD.front.nestPinRetractX, fl.nestPinLocalY, fl.nestPinLocalZ);
  registerBox(
    solids,
    box(scene, "FR_NEST_PIN_BODY", nestPin, mats.lock, [...fl.nestPinSize], [0, 0, 0]),
    "fr-nest-pin",
    { moving: true, keepoutSweep: true, slice: "s4" },
  );
  datums.push({
    name: "FR_NEST_PIN",
    kind: "lock",
    node: nestPin,
    note: "Starboard nest pin extends −X into the fixed carry receiver after socket",
  });

  datums.push({
    name: "FR_CARRIAGE",
    kind: "pivot",
    node: carriage,
    note: "Front-starboard socket carriage; translation is purely −X",
  });

  const yaw = node("FR_YAW", scene, carriage);
  registerBox(solids, cyl(scene, "FR_YAW_BEARING", yaw, mats.rail, 0.14, 0.16, [0, 0.18, 0]), "fr-bearing", moving);
  datums.push({
    name: "FR_YAW",
    kind: "pivot",
    node: yaw,
    note: "Planform yaw about +Y; +90° aft for the front-starboard station",
  });

  const cant = node("FR_CANT", scene, yaw);
  registerBox(
    solids,
    cyl(scene, "FR_CANT_BEARING", cant, mats.rail, 0.16, 0.12, [0.18, 0.2, 0.08], [0, 0, deg(90)]),
    "fr-bearing",
    moving,
  );
  datums.push({
    name: "FR_CANT",
    kind: "pivot",
    node: cant,
    note: "Strake cant about local +X (span after yaw); child of yaw",
  });

  const spar = node("FR_SPAR", scene, cant);
  registerBox(
    solids,
    box(scene, "FR_SPAR_CAP", spar, mats.mechanism, [0.18, 0.08, 0.22], [0.22, 0.2, 0.12]),
    "fr-spar",
    { moving: true, book: true, slice: "s4" },
  );

  const inner = node("FR_VANE_INNER", scene, spar);
  const [cutX, cutZ] = fl.bookCutout;
  const innerArmorY = -fl.armorT / 2;
  const innerUnderY = -(fl.armorT + fl.undersideT / 2);
  const pinSparX = -fl.bookPinSpar[0];
  const innerArmorPanels = panelsAroundYBore(
    0.25,
    fl.innerSpan,
    0.25,
    fl.chord,
    pinSparX,
    fl.bookPinSpar[2],
    cutX / 2,
    cutZ / 2,
  );
  innerArmorPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FR_INNER_ARMOR_${i}`, inner, mats.vaneArmor, [p.size[0], fl.armorT, p.size[1]], [
        p.pos[0],
        innerArmorY,
        p.pos[1],
      ]),
      "fr-vane-inner",
      book,
    );
  });
  const innerUnderPanels = panelsAroundYBore(
    0.28,
    fl.innerSpan - 0.03,
    0.28,
    fl.chord - 0.06,
    pinSparX,
    fl.bookPinSpar[2],
    cutX / 2,
    cutZ / 2,
  );
  innerUnderPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FR_INNER_UNDER_${i}`, inner, mats.underside, [p.size[0], fl.undersideT, p.size[1]], [
        p.pos[0],
        innerUnderY,
        p.pos[1],
      ]),
      "fr-vane-inner",
      book,
    );
  });
  for (const zFrac of [0.22, 0.5, 0.78]) {
    registerBox(
      solids,
      box(scene, `FR_INNER_RIB_${zFrac}`, inner, mats.mechanism, [fl.innerSpan - 0.1, fl.undersideT - 0.02, 0.05], [
        fl.innerSpan / 2,
        -(fl.armorT + fl.undersideT / 2),
        fl.chord * zFrac,
      ]),
      "fr-vane-inner",
      { moving: true, book: true, slice: "s4" },
    );
  }
  registerBox(
    solids,
    box(scene, "FR_INNER_SPAR", inner, mats.mechanism, [0.08, thick - 0.02, fl.chord - 0.08], [
      fl.innerSpan * 0.55,
      -thick / 2,
      fl.chord / 2,
    ]),
    "fr-vane-inner",
    { moving: true, book: true, slice: "s4" },
  );
  datums.push({
    name: "FR_VANE_INNER",
    kind: "pivot",
    node: inner,
    note: `Starboard front inner ${fl.innerSpan} m span × ${fl.chord} m chord`,
  });

  const bookHinge = node("FR_BOOK_HINGE", scene, spar);
  bookHinge.position.set(fl.innerSpan, flHingeLocalY(), fl.chord / 2);
  registerBox(
    solids,
    cyl(scene, "FR_BOOK_HINGE_BARREL", bookHinge, mats.rail, fl.chord - 0.16, 0.07, [0, 0, 0], [deg(90), 0, 0]),
    "fr-bearing",
    { moving: true, book: true, slice: "s4" },
  );
  datums.push({
    name: "FR_BOOK_HINGE",
    kind: "pivot",
    node: bookHinge,
    note: "Chordwise front hinge; +Z rotation folds outer underside-to-underside",
  });

  const outer = node("FR_VANE_OUTER", scene, bookHinge);
  const face = fl.bookGap / 2;
  const [rx, ry, rz] = fl.bookReceiverHinge;
  const srx = -rx;
  const outerArmorY = face + fl.undersideT + fl.armorT / 2;
  const outerUnderY = face + fl.undersideT / 2;
  const outerArmorPanels = panelsAroundYBore(
    0,
    fl.outerSpan,
    -fl.chord / 2,
    fl.chord / 2,
    srx,
    rz,
    cutX / 2,
    cutZ / 2,
  );
  outerArmorPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FR_OUTER_ARMOR_${i}`, outer, mats.vaneArmor, [p.size[0], fl.armorT, p.size[1]], [
        p.pos[0],
        outerArmorY,
        p.pos[1],
      ]),
      "fr-vane-outer",
      book,
    );
  });
  const outerUnderPanels = panelsAroundYBore(
    0.03,
    fl.outerSpan - 0.03,
    -(fl.chord / 2 - 0.06),
    fl.chord / 2 - 0.06,
    srx,
    rz,
    cutX / 2,
    cutZ / 2,
  );
  outerUnderPanels.forEach((p, i) => {
    registerBox(
      solids,
      box(scene, `FR_OUTER_UNDER_${i}`, outer, mats.underside, [p.size[0], fl.undersideT, p.size[1]], [
        p.pos[0],
        outerUnderY,
        p.pos[1],
      ]),
      "fr-vane-outer",
      book,
    );
  });
  for (const zOff of [-0.32, 0, 0.32]) {
    registerBox(
      solids,
      box(scene, `FR_OUTER_RIB_${zOff}`, outer, mats.mechanism, [fl.outerSpan - 0.1, fl.undersideT - 0.02, 0.05], [
        fl.outerSpan / 2,
        face + fl.undersideT / 2,
        zOff,
      ]),
      "fr-vane-outer",
      { moving: true, book: true, slice: "s4" },
    );
  }
  datums.push({
    name: "FR_VANE_OUTER",
    kind: "pivot",
    node: outer,
    note: `Starboard front outer ${fl.outerSpan} m; folds about book hinge`,
  });

  const [ox, oy, oz] = fl.bookReceiverOuter;
  const [bx, bz] = fl.bookBore;
  const cheekX = (ox - bx) / 4;
  const cheekCx = (ox + bx) / 4;
  registerBox(
    solids,
    box(scene, "FR_BOOK_CHEEK_P", bookHinge, mats.lock, [2 * cheekX, oy, oz], [srx - cheekCx, ry, rz]),
    "fr-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  registerBox(
    solids,
    box(scene, "FR_BOOK_CHEEK_S", bookHinge, mats.lock, [2 * cheekX, oy, oz], [srx + cheekCx, ry, rz]),
    "fr-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  const bridgeZ = (oz - bz) / 4;
  const bridgeCz = (oz + bz) / 4;
  registerBox(
    solids,
    box(scene, "FR_BOOK_BRIDGE_FWD", bookHinge, mats.lock, [bx, oy, 2 * bridgeZ], [srx, ry, rz + bridgeCz]),
    "fr-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );
  registerBox(
    solids,
    box(scene, "FR_BOOK_BRIDGE_AFT", bookHinge, mats.lock, [bx, oy, 2 * bridgeZ], [srx, ry, rz - bridgeCz]),
    "fr-book-receiver",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );

  const bookPin = node("FR_BOOK_PIN", scene, spar);
  bookPin.position.set(pinSparX, fl.bookPinRetractY, fl.bookPinSpar[2]);
  registerBox(
    solids,
    box(scene, "FR_BOOK_PIN_BODY", bookPin, mats.lock, [...fl.bookPinSize], [0, 0, 0]),
    "fr-book-pin",
    { moving: true, keepoutSweep: true, slice: "s4" },
  );
  datums.push({
    name: "FR_BOOK_PIN",
    kind: "lock",
    node: bookPin,
    note: "Starboard pre-yaw through-pin. Extends −Y through the outer's real Y-bore after fold.",
  });

  const [ckx, cky, ckz] = fl.catchKeeperSpar;
  registerBox(
    solids,
    box(scene, "FR_CATCH_KEEPER", spar, mats.lock, [...fl.catchKeeperSize], [-ckx, cky, ckz]),
    "fr-catch-keeper",
    { moving: true, book: true, keepoutSweep: true, slice: "s4" },
  );

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
