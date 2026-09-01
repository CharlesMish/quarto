import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { V3 } from "../math/vec";
import type { AuthorityBoundAudit, AuthorityBoundRow } from "./types";

export type SolidRole = "physical" | "keepout" | "diagnostic";
export type SolidSource = "mesh-exact" | "mesh-derived-conservative";
export type SliceId = "s1" | "s2" | "s4" | "shared";
export type ReservationKind = "empty-occupancy" | "protected-corridor" | "state-conditioned-empty" | "prediction-retired";

export interface AuthoritySolid {
  name: string;
  family: string;
  node: TransformNode;
  localCenter: V3;
  localHalf: V3;
  role: SolidRole;
  moving: boolean;
  book: boolean;
  keepoutSweep: boolean;
  source: SolidSource;
  slice: SliceId;
  reservationKind?: ReservationKind;
  protects?: string[];
  carryNode?: string;
}

export function registerBox(
  list: AuthoritySolid[],
  mesh: Mesh,
  family: string,
  opts?: {
    role?: SolidRole;
    moving?: boolean;
    book?: boolean;
    keepoutSweep?: boolean;
    slice?: SliceId;
    reservationKind?: ReservationKind;
    protects?: string[];
    carryNode?: string;
  },
): Mesh {
  const size = mesh.metadata?.size as [number, number, number] | undefined;
  if (!size) throw new Error(`missing size metadata on ${mesh.name}`);
  const kind = mesh.metadata?.kind as string | undefined;
  list.push({
    name: mesh.name,
    family,
    node: mesh,
    localCenter: { x: 0, y: 0, z: 0 },
    localHalf: { x: size[0] / 2, y: size[1] / 2, z: size[2] / 2 },
    role: opts?.role ?? "physical",
    moving: opts?.moving ?? false,
    book: opts?.book ?? false,
    keepoutSweep: opts?.keepoutSweep ?? false,
    source: kind === "cylinder" ? "mesh-derived-conservative" : "mesh-exact",
    slice: opts?.slice ?? "s1",
    reservationKind: opts?.reservationKind,
    protects: opts?.protects,
    carryNode: opts?.carryNode,
  });
  return mesh;
}

function isDiagnosticMesh(name: string): boolean {
  return (
    name.includes("_VIS") ||
    name.includes("EMPTY") ||
    name.includes("CORRIDOR") ||
    name.endsWith("_ax") ||
    name.endsWith("_ay") ||
    name.endsWith("_az") ||
    name.endsWith("_hub")
  );
}

export function auditAuthorityBounds(root: TransformNode, solids: AuthoritySolid[]): AuthorityBoundAudit {
  const physical = solids.filter((s) => s.role === "physical");
  const byName = new Map(physical.map((s) => [s.name, s]));
  const unregisteredPhysical: string[] = [];
  const underbound: string[] = [];
  const rows: AuthorityBoundRow[] = [];

  const walk = (node: TransformNode): void => {
    const mesh = node as AbstractMesh;
    if (mesh.getBoundingInfo && mesh.metadata?.size && !isDiagnosticMesh(mesh.name)) {
      if (mesh.metadata?.kind === "box" || mesh.metadata?.kind === "cylinder") {
        const registered = byName.get(mesh.name);
        const ext = mesh.getBoundingInfo().boundingBox.extendSize;
        const meshHalf = { x: ext.x, y: ext.y, z: ext.z };
        if (!registered) {
          unregisteredPhysical.push(mesh.name);
          rows.push({
            name: mesh.name,
            source: "unregistered",
            registered: false,
            conservativeOrExact: false,
            meshHalf,
            authorityHalf: { x: 0, y: 0, z: 0 },
          });
        } else {
          const ok =
            registered.localHalf.x + 1e-6 >= meshHalf.x &&
            registered.localHalf.y + 1e-6 >= meshHalf.y &&
            registered.localHalf.z + 1e-6 >= meshHalf.z;
          if (!ok) underbound.push(mesh.name);
          rows.push({
            name: mesh.name,
            source: registered.source,
            registered: true,
            conservativeOrExact: ok,
            meshHalf,
            authorityHalf: { ...registered.localHalf },
          });
        }
      }
    }
    for (const child of node.getChildren()) {
      walk(child as TransformNode);
    }
  };
  walk(root);

  return {
    pass: unregisteredPhysical.length === 0 && underbound.length === 0,
    physicalCount: physical.length,
    unregisteredPhysical,
    underbound,
    rows,
  };
}
