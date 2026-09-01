import type { Scene } from "@babylonjs/core/scene";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { P } from "../design/parameters";
import { box, node } from "../scene/primitives";
import type { Materials } from "../scene/materials";
import { registerBox, type AuthoritySolid } from "./authority";
import type { DebugDatum } from "./types";

export interface DriveBuild {
  carriage: TransformNode;
  body: TransformNode;
  datums: DebugDatum[];
  solids: AuthoritySolid[];
}

export function buildDrive(scene: Scene, parent: TransformNode, mats: Materials): DriveBuild {
  const datums: DebugDatum[] = [];
  const solids: AuthoritySolid[] = [];

  const carriage = node("DRIVE_CARRIAGE", scene, parent);
  carriage.position.set(P.drive.x, P.driveRail.y, P.drive.stowedZ);

  for (const x of P.driveRail.xs) {
    const localX = x - P.drive.x;
    registerBox(
      solids,
      box(scene, `DRIVE_SHOE_${x < 0 ? "P" : "S"}`, carriage, mats.rail, [P.driveRail.shoe, P.driveRail.shoe, 0.28], [
        localX,
        0,
        0,
      ]),
      "drive",
      { moving: true },
    );
  }

  const body = node("DRIVE_BODY", scene, carriage);
  body.position.set(0, P.drive.y - P.driveRail.y, 0);
  registerBox(
    solids,
    box(scene, "DRIVE_ENVELOPE", body, mats.drive, [P.drive.w, P.drive.h, P.drive.l], [0, 0, 0]),
    "drive",
    { moving: true, keepoutSweep: true },
  );
  registerBox(
    solids,
    box(scene, "DRIVE_SPINE", body, mats.mechanism, [0.22, 0.1, P.drive.l - 0.2], [0, P.drive.h / 2 - 0.02, 0]),
    "drive",
    { moving: true },
  );
  registerBox(
    solids,
    box(scene, "DRIVE_FACE_AFT", body, mats.lock, [P.drive.w - 0.12, P.drive.h - 0.16, 0.06], [0, 0, -P.drive.l / 2 + 0.03]),
    "drive",
    { moving: true },
  );

  datums.push({
    name: "DRIVE_CARRIAGE",
    kind: "pivot",
    node: carriage,
    note: "Rigid drive stand-in; translates −Z on fixed DRIVE_RAILS",
  });
  datums.push({
    name: "DRIVE_BODY",
    kind: "pivot",
    node: body,
    note: `Stowed envelope ${P.drive.w}×${P.drive.h}×${P.drive.l} m`,
  });

  const corridor = node("DRIVE_SWEPT_CORRIDOR", scene, parent);
  const z0 = P.drive.stowedZ;
  const z1 = P.drive.stowedZ - P.drive.stroke;
  const midZ = (z0 + z1) * 0.5;
  const span = P.drive.stroke + P.drive.l;
  box(scene, "DRIVE_CORRIDOR_VIS", corridor, mats.empty, [P.drive.w + 0.04, P.drive.h + 0.04, span], [
    P.drive.x,
    P.drive.y,
    midZ,
  ]);
  corridor.setEnabled(false);
  datums.push({
    name: "DRIVE_SWEPT_CORRIDOR",
    kind: "volume",
    node: corridor,
    note: `Authorized drive stroke ${P.drive.stroke} m aft`,
  });

  return { carriage, body, datums, solids };
}
