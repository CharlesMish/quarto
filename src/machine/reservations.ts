import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P, rearCorridorBox, type KeepBox, type WaistCell } from "../design/parameters";
import { box, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid, type ReservationKind } from "./authority";
import type { DebugDatum } from "./types";

export interface ReservationBuild {
  nodes: TransformNode[];
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

function addReservation(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  solids: AuthoritySolid[],
  datums: DebugDatum[],
  nodes: TransformNode[],
  name: string,
  family: string,
  boxSpec: KeepBox,
  kind: ReservationKind,
  note: string,
  protects?: string[],
  materialKey: "protect" | "occupy" = kind === "protected-corridor" ? "protect" : "occupy",
): void {
  const n = node(name, scene, parent);
  n.position.set(boxSpec.cx, boxSpec.cy, boxSpec.cz);
  const vis = box(
    scene,
    `${name}_VIS`,
    n,
    mats[materialKey] ?? mats.keep,
    [boxSpec.hx * 2, boxSpec.hy * 2, boxSpec.hz * 2],
    [0, 0, 0],
  );
  n.setEnabled(false);
  nodes.push(n);
  datums.push({ name, kind: "keep", node: n, note: `${kind}: ${note}` });
  const shared = family === "keep-rear-stbd" || family === "keep-cockpit" || family === "keep-dorsal";
  registerBox(solids, vis, family, {
    role: "keepout",
    slice: shared ? "shared" : "s2",
    reservationKind: kind,
    protects,
  });
}

export function buildReservations(
  scene: Scene,
  parent: TransformNode,
  mats: Materials,
  rearStbd: KeepBox,
  fwdStbd?: KeepBox,
  driveWaist?: WaistCell | WaistCell[],
  consumeStbdNests = false,
): ReservationBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];
  const nodes: TransformNode[] = [];

  addReservation(
    scene,
    parent,
    mats,
    solids,
    datums,
    nodes,
    "KEEP_REAR_STBD_NEST",
    "keep-rear-stbd",
    rearStbd,
    consumeStbdNests ? "prediction-retired" : "empty-occupancy",
    consumeStbdNests
      ? "S4 consumed prediction: prior empty-occupancy for seated rear-starboard. Display only."
      : "X-mirror of measured seated rear-left book plus pad. Future starboard-rear mechanism.",
  );

  addReservation(
    scene,
    parent,
    mats,
    solids,
    datums,
    nodes,
    "KEEP_COCKPIT",
    "keep-cockpit",
    P.keep.cockpit,
    "protected-corridor",
    "Protected cockpit occupancy. Must not be shrunk to pass S2. May contain future cockpit solids.",
    ["BULKHEAD_Z3p35"],
  );

  addReservation(
    scene,
    parent,
    mats,
    solids,
    datums,
    nodes,
    "KEEP_DORSAL",
    "keep-dorsal",
    P.keep.dorsal,
    "protected-corridor",
    "Protected dorsal spine corridor. Intentionally contains DORSAL_LONGERON.",
    ["DORSAL_LONGERON", "BULKHEAD_Z1p15"],
  );

  addReservation(
    scene,
    parent,
    mats,
    solids,
    datums,
    nodes,
    "KEEP_REAR_CORRIDOR",
    "keep-rear-corridor",
    rearCorridorBox(),
    "protected-corridor",
    "Certified S1C moving swept union E2. Frozen rear authority as a fixed corridor.",
    ["RL_INNER_ARMOR", "RL_OUTER_ARMOR", "DRIVE_ENVELOPE"],
  );

  addReservation(
    scene,
    parent,
    mats,
    solids,
    datums,
    nodes,
    "KEEP_AFT_BAY",
    "keep-aft-bay",
    {
      cx: 0,
      cy: (P.bay.yBot + P.bay.yTop) * 0.5,
      cz: (P.bay.zFwd + P.bay.zAft) * 0.5,
      hx: P.bay.halfW,
      hy: (P.bay.yTop - P.bay.yBot) * 0.5,
      hz: (P.bay.zFwd - P.bay.zAft) * 0.5,
    },
    "protected-corridor",
    "Aft bay interior / drive stow region. S2 carry must not take it.",
    ["DRIVE_ENVELOPE", "BAY_WALL_PORT", "BAY_WALL_STBD"],
  );

  const waistCells = driveWaist ? (Array.isArray(driveWaist) ? driveWaist : [driveWaist]) : [];
  for (const cell of waistCells) {
    addReservation(
      scene,
      parent,
      mats,
      solids,
      datums,
      nodes,
      cell.name,
      "drive-waist-port",
      cell,
      "state-conditioned-empty",
      "DRIVE-state port waist cell. Active only when both laterals are structurally captured. Bounded by channel mouth and FWD_CARRY aft frame; structure is not an occupant.",
      undefined,
      "occupy",
    );
  }

  if (fwdStbd) {
    addReservation(
      scene,
      parent,
      mats,
      solids,
      datums,
      nodes,
      "KEEP_FWD_STBD_NEST",
      "keep-fwd-stbd",
      fwdStbd,
      consumeStbdNests ? "prediction-retired" : "empty-occupancy",
      consumeStbdNests
        ? "S4 consumed prediction: prior empty-occupancy for seated front-starboard. Display only."
        : "Derived from measured seated front-left physical AABB plus pad, then X-mirrored.",
    );
  }

  return { nodes, datums, solids };
}
