import { add, clamp, cross, dot, len, norm, scale, sub, type V3, v3 } from "./vec";

export interface OBB {
  name: string;
  family: string;
  center: V3;
  axisX: V3;
  axisY: V3;
  axisZ: V3;
  half: V3;
}

const EPS = 1e-8;

function axes(b: OBB): [V3, V3, V3] {
  return [b.axisX, b.axisY, b.axisZ];
}

function projectRadius(box: OBB, axis: V3): number {
  return (
    box.half.x * Math.abs(dot(box.axisX, axis)) +
    box.half.y * Math.abs(dot(box.axisY, axis)) +
    box.half.z * Math.abs(dot(box.axisZ, axis))
  );
}

function satSeparated(a: OBB, b: OBB, axis: V3): boolean {
  if (len(axis) < EPS) return false;
  const n = norm(axis);
  const dist = Math.abs(dot(sub(b.center, a.center), n));
  return dist > projectRadius(a, n) + projectRadius(b, n) + EPS;
}

/** True if two oriented boxes overlap (closed, including face contact). */
export function obbOverlaps(a: OBB, b: OBB): boolean {
  const A = axes(a);
  const B = axes(b);
  for (const ax of A) {
    if (satSeparated(a, b, ax)) return false;
  }
  for (const ax of B) {
    if (satSeparated(a, b, ax)) return false;
  }
  for (const ax of A) {
    for (const bx of B) {
      if (satSeparated(a, b, cross(ax, bx))) return false;
    }
  }
  return true;
}

export function obbCorners(box: OBB): V3[] {
  const signs: Array<[number, number, number]> = [
    [-1, -1, -1],
    [-1, -1, 1],
    [-1, 1, -1],
    [-1, 1, 1],
    [1, -1, -1],
    [1, -1, 1],
    [1, 1, -1],
    [1, 1, 1],
  ];
  return signs.map(([sx, sy, sz]) =>
    add(
      box.center,
      add(
        add(scale(box.axisX, sx * box.half.x), scale(box.axisY, sy * box.half.y)),
        scale(box.axisZ, sz * box.half.z),
      ),
    ),
  );
}

export function pointToObbDistance(p: V3, box: OBB): number {
  const d = sub(p, box.center);
  const qx = clamp(dot(d, box.axisX), -box.half.x, box.half.x);
  const qy = clamp(dot(d, box.axisY), -box.half.y, box.half.y);
  const qz = clamp(dot(d, box.axisZ), -box.half.z, box.half.z);
  const q = add(box.center, add(add(scale(box.axisX, qx), scale(box.axisY, qy)), scale(box.axisZ, qz)));
  return len(sub(p, q));
}

function segmentDistance(a0: V3, a1: V3, b0: V3, b1: V3): number {
  const d1 = sub(a1, a0);
  const d2 = sub(b1, b0);
  const r = sub(a0, b0);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  let s: number;
  let t: number;
  if (a <= EPS && e <= EPS) return len(sub(a0, b0));
  if (a <= EPS) {
    s = 0;
    t = clamp(f / e, 0, 1);
  } else {
    const c = dot(d1, r);
    if (e <= EPS) {
      t = 0;
      s = clamp(-c / a, 0, 1);
    } else {
      const b = dot(d1, d2);
      const denom = a * e - b * b;
      s = denom !== 0 ? clamp((b * f - c * e) / denom, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a, 0, 1);
      }
    }
  }
  return len(sub(add(a0, scale(d1, s)), add(b0, scale(d2, t))));
}

export function obbEdges(box: OBB): Array<[V3, V3]> {
  const c = obbCorners(box);
  const pairs: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 4],
    [7, 6],
    [7, 5],
    [7, 3],
    [1, 3],
    [1, 5],
    [2, 3],
    [2, 6],
    [4, 5],
    [4, 6],
  ];
  return pairs.map(([i, j]) => [c[i], c[j]]);
}

/**
 * Separation between two OBBs.
 * Overlap returns a negative number (approximate SAT penetration along a face axis).
 * Disjoint returns the min of vertex-to-OBB and edge-to-edge distances.
 */
export function obbSeparation(a: OBB, b: OBB): number {
  if (obbOverlaps(a, b)) {
    let best = Infinity;
    const A = axes(a);
    const B = axes(b);
    const tryAxis = (axis: V3): void => {
      if (len(axis) < EPS) return;
      const n = norm(axis);
      const dist = Math.abs(dot(sub(b.center, a.center), n));
      const pen = projectRadius(a, n) + projectRadius(b, n) - dist;
      if (pen < best) best = pen;
    };
    for (const ax of A) tryAxis(ax);
    for (const ax of B) tryAxis(ax);
    return -best;
  }

  let min = Infinity;
  for (const p of obbCorners(a)) min = Math.min(min, pointToObbDistance(p, b));
  for (const p of obbCorners(b)) min = Math.min(min, pointToObbDistance(p, a));
  const ea = obbEdges(a);
  const eb = obbEdges(b);
  for (const [a0, a1] of ea) {
    for (const [b0, b1] of eb) {
      min = Math.min(min, segmentDistance(a0, a1, b0, b1));
    }
  }
  return min;
}

export function obbWorldAabb(box: OBB): { min: V3; max: V3 } {
  const corners = obbCorners(box);
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of corners) {
    min.x = Math.min(min.x, c.x);
    min.y = Math.min(min.y, c.y);
    min.z = Math.min(min.z, c.z);
    max.x = Math.max(max.x, c.x);
    max.y = Math.max(max.y, c.y);
    max.z = Math.max(max.z, c.z);
  }
  return { min, max };
}

export function makeObb(
  name: string,
  family: string,
  center: V3,
  axisX: V3,
  axisY: V3,
  axisZ: V3,
  half: V3,
): OBB {
  return {
    name,
    family,
    center,
    axisX: norm(axisX),
    axisY: norm(axisY),
    axisZ: norm(axisZ),
    half,
  };
}

export function worldAabbUnion(boxes: OBB[]): { min: V3; max: V3 } {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const box of boxes) {
    const a = obbWorldAabb(box);
    min.x = Math.min(min.x, a.min.x);
    min.y = Math.min(min.y, a.min.y);
    min.z = Math.min(min.z, a.min.z);
    max.x = Math.max(max.x, a.max.x);
    max.y = Math.max(max.y, a.max.y);
    max.z = Math.max(max.z, a.max.z);
  }
  return { min, max };
}

export function aabbOfPointSet(points: V3[]): { min: V3; max: V3 } {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of points) {
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return { min, max };
}

export { v3 };
