import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { obbWorldAabb, type OBB } from "../math/obb";
import { solidToObb } from "../machine/createMachine";
import type { MachineRig } from "../machine/types";
import { cross, dot, len, sub, type V3 } from "../math/vec";
import { BODY_GUTTER } from "../scene/bodyShellConcept";

const STEP = 0.01;
const EPS = 1e-8;

export interface BodyShellFitHit {
  class: "defect" | "expected-close";
  t: number;
  body: string;
  solid: string;
  separation: number;
  detail: string;
}

export interface BodyShellGutterRow {
  pocket: string;
  bookPrefix: string;
  dockX: number;
  bookInboardX: number;
  gutter: number;
}

export interface BodyShellFitReport {
  kind: "presentation-fit";
  participatesInAuthority: false;
  method: "triangle-obb";
  gutter: { min: number; max: number; design: number };
  samples: number;
  step: number;
  defects: BodyShellFitHit[];
  expectedClose: BodyShellFitHit[];
  pocketGutters: BodyShellGutterRow[];
  pass: boolean;
}

type Tri = [V3, V3, V3];

function bookPrefixFor(name: string): string | null {
  if (name.includes("FWD_") && name.includes("_PORT_")) return "FL_";
  if (name.includes("FWD_") && name.includes("_STBD_")) return "FR_";
  if (name.includes("AFT_") && name.includes("_PORT_")) return "RL_";
  if (name.includes("AFT_") && name.includes("_STBD_")) return "RR_";
  return null;
}

function meshWorldTriangles(mesh: AbstractMesh): Tri[] {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  if (!positions || !indices || indices.length < 3) return [];
  mesh.computeWorldMatrix(true);
  const wm = mesh.getWorldMatrix();
  const world: V3[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const p = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), wm);
    world.push({ x: p.x, y: p.y, z: p.z });
  }
  const tris: Tri[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = world[indices[i]];
    const b = world[indices[i + 1]];
    const c = world[indices[i + 2]];
    if (a && b && c) tris.push([a, b, c]);
  }
  return tris;
}

function meshWorldAabb(mesh: AbstractMesh): { min: V3; max: V3 } {
  mesh.computeWorldMatrix(true);
  const bb = mesh.getBoundingInfo().boundingBox;
  return {
    min: { x: bb.minimumWorld.x, y: bb.minimumWorld.y, z: bb.minimumWorld.z },
    max: { x: bb.maximumWorld.x, y: bb.maximumWorld.y, z: bb.maximumWorld.z },
  };
}

function aabbOverlap(a: { min: V3; max: V3 }, b: { min: V3; max: V3 }): boolean {
  return a.min.x <= b.max.x && a.max.x >= b.min.x && a.min.y <= b.max.y && a.max.y >= b.min.y && a.min.z <= b.max.z && a.max.z >= b.min.z;
}

function toLocal(p: V3, box: OBB): V3 {
  const d = sub(p, box.center);
  return { x: dot(d, box.axisX), y: dot(d, box.axisY), z: dot(d, box.axisZ) };
}

/** Akenine-Möller triangle vs OBB via triangle vs local AABB. */
function triangleIntersectsObb(tri: Tri, box: OBB): boolean {
  const v0 = toLocal(tri[0], box);
  const v1 = toLocal(tri[1], box);
  const v2 = toLocal(tri[2], box);
  const h = box.half;
  const minX = Math.min(v0.x, v1.x, v2.x);
  const maxX = Math.max(v0.x, v1.x, v2.x);
  if (maxX < -h.x || minX > h.x) return false;
  const minY = Math.min(v0.y, v1.y, v2.y);
  const maxY = Math.max(v0.y, v1.y, v2.y);
  if (maxY < -h.y || minY > h.y) return false;
  const minZ = Math.min(v0.z, v1.z, v2.z);
  const maxZ = Math.max(v0.z, v1.z, v2.z);
  if (maxZ < -h.z || minZ > h.z) return false;

  const n = cross(sub(v1, v0), sub(v2, v0));
  const r = h.x * Math.abs(n.x) + h.y * Math.abs(n.y) + h.z * Math.abs(n.z);
  const s = dot(n, v0);
  if (s > r + EPS || s < -r - EPS) return false;

  const edges = [sub(v1, v0), sub(v2, v1), sub(v0, v2)];
  const verts = [v0, v1, v2];
  const unit: V3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  for (const edge of edges) {
    for (const axis of unit) {
      const a = cross(axis, edge);
      if (len(a) < EPS) continue;
      let tmin = Infinity;
      let tmax = -Infinity;
      for (const p of verts) {
        const t = dot(p, a);
        if (t < tmin) tmin = t;
        if (t > tmax) tmax = t;
      }
      const rr = h.x * Math.abs(a.x) + h.y * Math.abs(a.y) + h.z * Math.abs(a.z);
      if (tmax < -rr - EPS || tmin > rr + EPS) return false;
    }
  }
  return true;
}

function meshIntersectsObb(tris: readonly Tri[], aabb: { min: V3; max: V3 }, box: OBB): boolean {
  if (!aabbOverlap(aabb, obbWorldAabb(box))) return false;
  for (const tri of tris) {
    if (triangleIntersectsObb(tri, box)) return true;
  }
  return false;
}

function dockXFromMesh(mesh: AbstractMesh, hand: number): number {
  const marked = mesh.metadata && typeof (mesh.metadata as { dockX?: number }).dockX === "number";
  if (marked) return (mesh.metadata as { dockX: number }).dockX;
  mesh.computeWorldMatrix(true);
  const bb = mesh.getBoundingInfo().boundingBox;
  return hand < 0 ? bb.minimumWorld.x : bb.maximumWorld.x;
}

export function runBodyShellFit(rig: MachineRig, bodyMeshes: readonly AbstractMesh[]): BodyShellFitReport {
  const defects: BodyShellFitHit[] = [];
  const expectedClose: BodyShellFitHit[] = [];
  const pocketGutters: BodyShellGutterRow[] = [];
  const body = bodyMeshes.filter((mesh) => mesh.name.startsWith("BODY_") && mesh.isEnabled());
  const cached = body.map((mesh) => ({
    mesh,
    tris: meshWorldTriangles(mesh),
    aabb: meshWorldAabb(mesh),
  }));

  let samples = 0;
  rig.withPreservedPose(() => {
    for (let i = 0; i <= Math.round(1 / STEP); i += 1) {
      const t = Math.min(1, i * STEP);
      samples += 1;
      rig.applyMachine(t);
      const moving = rig.worldSolids().filter((solid) => solid.role === "physical" && solid.moving);
      for (const row of cached) {
        for (const solid of moving) {
          const key = `${row.mesh.name}::${solid.name}`;
          if (defects.some((d) => `${d.body}::${d.solid}` === key)) continue;
          const box = solid.obb ?? solidToObb(solid);
          if (!meshIntersectsObb(row.tris, row.aabb, box)) continue;
          defects.push({
            class: "defect",
            t,
            body: row.mesh.name,
            solid: solid.name,
            separation: 0,
            detail: `BODY triangle surface intersects moving physical ${solid.name} at machineT=${t.toFixed(3)}.`,
          });
        }
      }
    }

    rig.applyMachine(1);
    const nested = rig.worldSolids().filter((solid) => solid.role === "physical" && solid.moving && solid.book);
    for (const mesh of body) {
      if (!mesh.name.includes("_FACE_")) continue;
      const prefix = bookPrefixFor(mesh.name);
      if (!prefix) continue;
      const hand = mesh.name.includes("_PORT_") ? -1 : 1;
      const dockX = dockXFromMesh(mesh, hand);
      const books = nested.filter((solid) => solid.name.startsWith(prefix));
      if (!books.length) continue;
      let bookInboardX = hand < 0 ? -Infinity : Infinity;
      for (const solid of books) {
        const box = solid.obb ?? solidToObb(solid);
        const aabb = obbWorldAabb(box);
        if (hand < 0) bookInboardX = Math.max(bookInboardX, aabb.max.x);
        else bookInboardX = Math.min(bookInboardX, aabb.min.x);
      }
      const gutter = hand < 0 ? dockX - bookInboardX : bookInboardX - dockX;
      pocketGutters.push({ pocket: mesh.name, bookPrefix: prefix, dockX, bookInboardX, gutter });
      if (gutter > 0 && !defects.some((d) => d.body === mesh.name)) {
        expectedClose.push({
          class: "expected-close",
          t: 1,
          body: mesh.name,
          solid: `${prefix}*`,
          separation: gutter,
          detail: `Pocket dock face vs nested-book inboard face; gutter ${gutter.toFixed(3)} m (readability, not a collision exemption).`,
        });
      }
    }
  });

  return {
    kind: "presentation-fit",
    participatesInAuthority: false,
    method: "triangle-obb",
    gutter: { min: 0.08, max: 0.12, design: BODY_GUTTER },
    samples,
    step: STEP,
    defects,
    expectedClose,
    pocketGutters,
    pass: defects.length === 0,
  };
}
