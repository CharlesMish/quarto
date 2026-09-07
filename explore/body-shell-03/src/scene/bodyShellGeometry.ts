import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";
import { meshFromIndexed, type Quad, type V3t } from "./primitives";

/** Finish only authored BODY surfaces; shared mechanism primitives stay intact. */
export function finishBodySurface(mesh: Mesh, reverseWinding = false): void {
  if (reverseWinding) {
    const indices = Array.from(mesh.getIndices() ?? []);
    for (let i = 0; i < indices.length; i += 3) {
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    }
    mesh.setIndices(indices);
  }
  // Separate face vertices after orienting the triangles. In particular, the
  // chine roof must not borrow its lighting normal from the vertical wall.
  mesh.convertToFlatShadedMesh();
  mesh.refreshBoundingInfo();
}

/**
 * Closed BODY slab. Rows run forward to aft; +X is the authored hand.
 * Rectangle caps use vertex 0; the chine's L profile uses its visible outer
 * bottom corner (vertex 1). This is not a general polygon triangulator.
 */
export function bodyClosedLoft(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  rows: V3t[][],
  capAnchor = 0,
): Mesh {
  if (rows.length < 2) throw new Error(`${name} needs at least two body slab rows`);
  const columns = rows[0].length;
  if (rows.some((row) => row.length !== columns)) throw new Error(`${name} has ragged body rows`);
  const positions = rows.flat(2);
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number): void => {
    const coincident = (u: number, v: number): boolean =>
      positions[u * 3] === positions[v * 3] &&
      positions[u * 3 + 1] === positions[v * 3 + 1] &&
      positions[u * 3 + 2] === positions[v * 3 + 2];
    // At the beginning/end of the chine return, its two flange corners merge.
    // Emit the triangular transition, never the collapsed companion triangle.
    if (!coincident(a, b) && !coincident(b, c) && !coincident(c, a)) indices.push(a, b, c);
  };
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const a = r * columns + c;
      const b = r * columns + (c + 1) % columns;
      const d = (r + 1) * columns + c;
      const e = (r + 1) * columns + (c + 1) % columns;
      triangle(a, b, e);
      triangle(a, e, d);
    }
  }
  const last = (rows.length - 1) * columns;
  for (let i = 1; i < columns - 1; i += 1) {
    const b = (capAnchor + i) % columns;
    const c = (capAnchor + i + 1) % columns;
    triangle(capAnchor, c, b);
    triangle(last + capAnchor, last + b, last + c);
  }
  return meshFromIndexed(scene, name, parent, material, positions, indices);
}

/** A pocket web has one apex, not a triangular prism with a collapsed edge. */
export function bodyPyramid(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  base: Quad,
  apex: V3t,
): Mesh {
  const indices = [
    0, 3, 2, 0, 2, 1,
    0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4,
  ];
  return meshFromIndexed(scene, name, parent, material, [...base, apex].flat(), indices);
}
