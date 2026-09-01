import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";

export type V3t = [number, number, number];
export type Quad = [V3t, V3t, V3t, V3t];

export function node(name: string, scene: Scene, parent?: Node | null): TransformNode {
  const n = new TransformNode(name, scene);
  if (parent) n.parent = parent;
  return n;
}

export function box(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  size: [number, number, number],
  position: [number, number, number],
  opts?: { rotation?: [number, number, number]; pickable?: boolean },
): Mesh {
  const mesh = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
  mesh.parent = parent;
  mesh.material = material;
  mesh.position.set(...position);
  if (opts?.rotation) mesh.rotation.set(...opts.rotation);
  mesh.isPickable = opts?.pickable ?? true;
  mesh.receiveShadows = true;
  mesh.metadata = { ...(mesh.metadata ?? {}), size, kind: "box" };
  return mesh;
}

export function cyl(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  height: number,
  diameter: number,
  position: [number, number, number],
  rotation?: [number, number, number],
): Mesh {
  const mesh = MeshBuilder.CreateCylinder(
    name,
    { height, diameter, tessellation: 14 },
    scene,
  );
  mesh.parent = parent;
  mesh.material = material;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.receiveShadows = true;
  mesh.metadata = { ...(mesh.metadata ?? {}), size: [diameter, height, diameter], kind: "cylinder" };
  return mesh;
}

function applyVertexData(mesh: Mesh, positions: number[], indices: number[]): void {
  const vd = new VertexData();
  vd.positions = positions;
  vd.indices = indices;
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  vd.normals = normals;
  vd.applyToMesh(mesh);
  mesh.refreshBoundingInfo();
  const bb = mesh.getBoundingInfo().boundingBox;
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    kind: "facet",
    size: [
      bb.maximum.x - bb.minimum.x,
      bb.maximum.y - bb.minimum.y,
      bb.maximum.z - bb.minimum.z,
    ],
  };
}

export function meshFromIndexed(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  positions: number[],
  indices: number[],
): Mesh {
  const mesh = new Mesh(name, scene);
  mesh.parent = parent;
  mesh.material = material;
  mesh.isPickable = true;
  mesh.receiveShadows = true;
  applyVertexData(mesh, positions, indices);
  return mesh;
}

function pushTri(indices: number[], a: number, b: number, c: number): void {
  indices.push(a, b, c);
}

function pushQuad(indices: number[], a: number, b: number, c: number, d: number): void {
  pushTri(indices, a, b, c);
  pushTri(indices, a, c, d);
}

/** YZ profile extruded between x0 and x1. Profile is [y, z] in order. */
export function extrudeYZ(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  profile: Array<[number, number]>,
  x0: number,
  x1: number,
): Mesh {
  const n = profile.length;
  const positions: number[] = [];
  for (const x of [x0, x1]) {
    for (const [y, z] of profile) positions.push(x, y, z);
  }
  const indices: number[] = [];
  const flip = x1 < x0;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const a = i;
    const b = j;
    const c = n + j;
    const d = n + i;
    if (flip) pushQuad(indices, a, d, c, b);
    else pushQuad(indices, a, b, c, d);
  }
  for (let i = 1; i < n - 1; i += 1) {
    if (flip) {
      pushTri(indices, 0, i, i + 1);
      pushTri(indices, n, n + i + 1, n + i);
    } else {
      pushTri(indices, 0, i + 1, i);
      pushTri(indices, n, n + i, n + i + 1);
    }
  }
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}

/** XZ profile extruded between y0 and y1. Profile is [x, z] in order. */
export function extrudeXZ(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  profile: Array<[number, number]>,
  y0: number,
  y1: number,
): Mesh {
  const n = profile.length;
  const positions: number[] = [];
  for (const y of [y0, y1]) {
    for (const [x, z] of profile) positions.push(x, y, z);
  }
  const indices: number[] = [];
  const flip = y1 < y0;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const a = i;
    const b = j;
    const c = n + j;
    const d = n + i;
    if (flip) pushQuad(indices, a, d, c, b);
    else pushQuad(indices, a, b, c, d);
  }
  for (let i = 1; i < n - 1; i += 1) {
    if (flip) {
      pushTri(indices, 0, i, i + 1);
      pushTri(indices, n, n + i + 1, n + i);
    } else {
      pushTri(indices, 0, i + 1, i);
      pushTri(indices, n, n + i, n + i + 1);
    }
  }
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}

/** Two corresponding quads become a trapezoidal prism. */
export function trap(scene: Scene, name: string, parent: Node, material: Material, a: Quad, b: Quad): Mesh {
  const positions: number[] = [];
  for (const p of [...a, ...b]) positions.push(...p);
  const indices: number[] = [];
  pushQuad(indices, 0, 1, 2, 3);
  pushQuad(indices, 4, 7, 6, 5);
  pushQuad(indices, 0, 4, 5, 1);
  pushQuad(indices, 1, 5, 6, 2);
  pushQuad(indices, 2, 6, 7, 3);
  pushQuad(indices, 3, 7, 4, 0);
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}

/** Triangular prism from two corresponding triangles. */
export function wedge(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  a: [V3t, V3t, V3t],
  b: [V3t, V3t, V3t],
): Mesh {
  const positions: number[] = [];
  for (const p of [...a, ...b]) positions.push(...p);
  const indices: number[] = [];
  pushTri(indices, 0, 1, 2);
  pushTri(indices, 3, 5, 4);
  pushQuad(indices, 0, 3, 4, 1);
  pushQuad(indices, 1, 4, 5, 2);
  pushQuad(indices, 2, 5, 3, 0);
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}

/** Faceted strip: rows of points, each row the same length, extruded as quads. */
export function facetStrip(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  rows: V3t[][],
): Mesh {
  if (rows.length < 2) throw new Error(`facetStrip ${name} needs two rows`);
  const cols = rows[0].length;
  const positions: number[] = [];
  for (const row of rows) {
    if (row.length !== cols) throw new Error(`facetStrip ${name} ragged rows`);
    for (const p of row) positions.push(...p);
  }
  const indices: number[] = [];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      pushQuad(indices, a, b, e, d);
    }
  }
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}
