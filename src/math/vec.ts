export interface V3 {
  x: number;
  y: number;
  z: number;
}

export function v3(x: number, y: number, z: number): V3 {
  return { x, y, z };
}

export function add(a: V3, b: V3): V3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: V3, s: number): V3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: V3, b: V3): V3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function len(a: V3): number {
  return Math.hypot(a.x, a.y, a.z);
}

export function norm(a: V3): V3 {
  const l = len(a);
  if (l < 1e-12) return { x: 0, y: 0, z: 0 };
  return scale(a, 1 / l);
}

export function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}
