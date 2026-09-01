import { worldAabbUnion, type OBB } from "../math/obb";
import type { InstantEnvelope, SweptEnvelope } from "../machine/types";

export function emptySwept(): SweptEnvelope {
  return {
    width: 0,
    height: 0,
    length: 0,
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  };
}

export function emptyInstant(): InstantEnvelope {
  return { width: 0, height: 0, length: 0, widthAt: 0, heightAt: 0, lengthAt: 0 };
}

export function aabbOf(boxes: OBB[]): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } {
  return worldAabbUnion(boxes);
}

export function finalizeSwept(env: SweptEnvelope): SweptEnvelope {
  return {
    ...env,
    width: env.maxX - env.minX,
    height: env.maxY - env.minY,
    length: env.maxZ - env.minZ,
  };
}

export function sweptMatchesBounds(env: SweptEnvelope, eps = 1e-9): boolean {
  return (
    Math.abs(env.width - (env.maxX - env.minX)) <= eps &&
    Math.abs(env.height - (env.maxY - env.minY)) <= eps &&
    Math.abs(env.length - (env.maxZ - env.minZ)) <= eps
  );
}

export function accumulateSwept(
  env: SweptEnvelope,
  aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  first: boolean,
): SweptEnvelope {
  if (first) {
    return finalizeSwept({
      width: 0,
      height: 0,
      length: 0,
      minX: aabb.min.x,
      maxX: aabb.max.x,
      minY: aabb.min.y,
      maxY: aabb.max.y,
      minZ: aabb.min.z,
      maxZ: aabb.max.z,
    });
  }
  return finalizeSwept({
    ...env,
    minX: Math.min(env.minX, aabb.min.x),
    maxX: Math.max(env.maxX, aabb.max.x),
    minY: Math.min(env.minY, aabb.min.y),
    maxY: Math.max(env.maxY, aabb.max.y),
    minZ: Math.min(env.minZ, aabb.min.z),
    maxZ: Math.max(env.maxZ, aabb.max.z),
  });
}

export function accumulateInstant(env: InstantEnvelope, aabb: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }, t: number): InstantEnvelope {
  const width = aabb.max.x - aabb.min.x;
  const height = aabb.max.y - aabb.min.y;
  const length = aabb.max.z - aabb.min.z;
  const next = { ...env };
  if (width > next.width) {
    next.width = width;
    next.widthAt = t;
  }
  if (height > next.height) {
    next.height = height;
    next.heightAt = t;
  }
  if (length > next.length) {
    next.length = length;
    next.lengthAt = t;
  }
  return next;
}

export function containsAabb(
  outer: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
  inner: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  eps = 1e-6,
): boolean {
  return (
    inner.min.x >= outer.minX - eps &&
    inner.max.x <= outer.maxX + eps &&
    inner.min.y >= outer.minY - eps &&
    inner.max.y <= outer.maxY + eps &&
    inner.min.z >= outer.minZ - eps &&
    inner.max.z <= outer.maxZ + eps
  );
}
