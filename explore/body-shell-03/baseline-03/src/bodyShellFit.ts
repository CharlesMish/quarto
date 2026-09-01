import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { makeObb, obbSeparation, type OBB } from "../math/obb";
import { solidToObb } from "../machine/createMachine";
import type { MachineRig } from "../machine/types";
import { BODY_GUTTER } from "../scene/bodyShellConcept";

const SAMPLES = [0, 0.24, 0.48, 0.6, 0.72, 0.86, 1] as const;
const GUTTER_MIN = 0.08;
const GUTTER_MAX = 0.12;
const GUTTER_BAND = 0.04;

export interface BodyShellFitHit {
  class: "defect" | "expected-close";
  t: number;
  body: string;
  solid: string;
  separation: number;
  detail: string;
}

export interface BodyShellFitReport {
  kind: "presentation-fit";
  participatesInAuthority: false;
  gutter: { min: number; max: number; design: number };
  samples: number;
  defects: BodyShellFitHit[];
  expectedClose: BodyShellFitHit[];
  pass: boolean;
}

function meshWorldObb(mesh: AbstractMesh): OBB {
  mesh.computeWorldMatrix(true);
  const bb = mesh.getBoundingInfo().boundingBox;
  const c = bb.centerWorld;
  return makeObb(
    mesh.name,
    "body-shell-concept",
    { x: c.x, y: c.y, z: c.z },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    {
      x: (bb.maximumWorld.x - bb.minimumWorld.x) / 2,
      y: (bb.maximumWorld.y - bb.minimumWorld.y) / 2,
      z: (bb.maximumWorld.z - bb.minimumWorld.z) / 2,
    },
  );
}

function isPocket(name: string): boolean {
  return name.includes("_POCKET_") || name.includes("_WEB_");
}

function isBookSolid(name: string, book: boolean, family: string): boolean {
  return book || family.includes("vane") || /_(INNER|OUTER|ARMOR|UNDER)/.test(name);
}

export function runBodyShellFit(rig: MachineRig, bodyMeshes: readonly AbstractMesh[]): BodyShellFitReport {
  const defects: BodyShellFitHit[] = [];
  const expectedClose: BodyShellFitHit[] = [];

  rig.withPreservedPose(() => {
    for (const t of SAMPLES) {
      rig.applyMachine(t);
      const moving = rig
        .worldSolids()
        .filter((solid) => solid.role === "physical" && solid.moving);
      for (const mesh of bodyMeshes) {
        if (!mesh.isEnabled()) continue;
        const bodyObb = meshWorldObb(mesh);
        for (const solid of moving) {
          const sep = obbSeparation(bodyObb, solid.obb ?? solidToObb(solid));
          const pocket = isPocket(mesh.name);
          const book = isBookSolid(solid.name, solid.book, solid.family);
          if (sep < 0) {
            defects.push({
              class: "defect",
              t,
              body: mesh.name,
              solid: solid.name,
              separation: sep,
              detail: `BODY presentation intersects moving physical ${solid.name} at machineT=${t.toFixed(2)}.`,
            });
            continue;
          }
          if (pocket && book && sep >= GUTTER_MIN - GUTTER_BAND && sep <= GUTTER_MAX + GUTTER_BAND) {
            expectedClose.push({
              class: "expected-close",
              t,
              body: mesh.name,
              solid: solid.name,
              separation: sep,
              detail: `Pocket wall vs nested-book inner face in the ${GUTTER_MIN * 1000}–${GUTTER_MAX * 1000} mm gutter band.`,
            });
          }
        }
      }
    }
  });

  return {
    kind: "presentation-fit",
    participatesInAuthority: false,
    gutter: { min: GUTTER_MIN, max: GUTTER_MAX, design: BODY_GUTTER },
    samples: SAMPLES.length,
    defects,
    expectedClose,
    pass: defects.length === 0,
  };
}
