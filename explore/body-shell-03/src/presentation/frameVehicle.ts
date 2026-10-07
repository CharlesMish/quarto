import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { fitVisibleVehicle } from "./fitCamera";

/**
 * Presentation framing. Appearance only: it reads render bounds and moves the
 * camera; it never poses, evaluates or certifies the mechanism.
 *
 * Two pieces work together:
 * - a **screen shift**, stored as a fraction of the half-viewport and applied
 *   through ArcRotateCamera.targetScreenOffset, so the orbit centre sits where
 *   the machine looks centred instead of where its bounding-box centre lands;
 * - **composed framing**, a projection-based fit that fills the canvas more
 *   fully than FIT's conservative whole-machine distance.
 *
 * FIT keeps its exact radius and target (fitVisibleVehicle) and only gains the
 * centring shift, so its measured camera-response baselines are unchanged.
 */
export interface ScreenShift { x: number; y: number }

export interface Framing {
  radius: number;
  target: Vector3;
  shift: ScreenShift;
  upperRadiusLimit: number;
}

/** Composed framing fills about this much of each half-axis. */
const COMPOSE_FILL = { x: 0.84, y: 0.76 };

function visiblePoints(candidates: readonly AbstractMesh[]): { points: Vector3[]; center: Vector3 } | null {
  const points: Vector3[] = [];
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const mesh of candidates) {
    if (!mesh.isEnabled() || !mesh.isVisible || mesh.visibility <= 0 || mesh.getTotalVertices() === 0) continue;
    mesh.computeWorldMatrix(true);
    for (const point of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
      points.push(point.clone());
      min.minimizeInPlace(point);
      max.maximizeInPlace(point);
    }
  }
  return points.length ? { points, center: min.add(max).scale(0.5) } : null;
}

function basis(alpha: number, beta: number) {
  // ArcRotateCamera places the eye at target + radius * back.
  const back = new Vector3(Math.cos(alpha) * Math.sin(beta), Math.cos(beta), Math.sin(alpha) * Math.sin(beta)).normalize();
  // Same axes as Babylon's left-handed look-at view matrix, so the solved
  // offsets can be written straight into targetScreenOffset.
  const forward = back.scale(-1);
  const right = Vector3.Cross(Vector3.Up(), forward).normalize();
  const up = Vector3.Cross(forward, right).normalize();
  return { back, right, up };
}

interface ViewPoint { x: number; y: number; z: number }

/** Centre the projection at a fixed radius; returns view offsets and half-extents. */
function centre(rel: readonly ViewPoint[], r: number, tanH: number, tanV: number) {
  let ox = 0;
  let oy = 0;
  let ex = 0;
  let ey = 0;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
    let dMinX = r; let dMaxX = r; let dMinY = r; let dMaxY = r;
    for (const point of rel) {
      const depth = r - point.z;
      const x = (point.x + ox) / (depth * tanH);
      const y = (point.y + oy) / (depth * tanV);
      if (x < minX) { minX = x; dMinX = depth; }
      if (x > maxX) { maxX = x; dMaxX = depth; }
      if (y < minY) { minY = y; dMinY = depth; }
      if (y > maxY) { maxY = y; dMaxY = depth; }
    }
    ex = (maxX - minX) / 2;
    ey = (maxY - minY) / 2;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    if (Math.abs(cx) < 1e-6 && Math.abs(cy) < 1e-6) break;
    // Newton step: a view-space shift moves each extreme point by 1/depth, so
    // near corners move faster than the target does.
    ox -= cx / ((1 / dMinX + 1 / dMaxX) / 2 / tanH);
    oy -= cy / ((1 / dMinY + 1 / dMaxY) / 2 / tanV);
  }
  return { ox, oy, ex, ey };
}

/**
 * Centre the projected machine and, unless the radius is fixed, find the
 * radius at which it fills COMPOSE_FILL of the limiting axis.
 */
function solve(
  camera: ArcRotateCamera, points: readonly Vector3[], target: Vector3, aspect: number, radius: number, fixedRadius: boolean,
): { radius: number; shift: ScreenShift } {
  const { back, right, up } = basis(camera.alpha, camera.beta);
  const tanV = Math.tan(camera.fov / 2);
  const tanH = tanV * Math.max(aspect, 0.01);
  const rel: ViewPoint[] = points.map((point) => {
    const offset = point.subtract(target);
    return { x: Vector3.Dot(offset, right), y: Vector3.Dot(offset, up), z: Vector3.Dot(offset, back) };
  });
  let r = radius;
  if (!fixedRadius) {
    // Bisect between "every corner just in front of the camera" and a
    // distance that certainly fits; centred extents shrink as r grows.
    const nearest = Math.max(...rel.map((point) => point.z));
    let lo = nearest + 0.5;
    let hi = Math.max(lo + 1, ...rel.map((point) => point.z + Math.max(Math.abs(point.x) / tanH, Math.abs(point.y) / tanV) * 2));
    for (let iteration = 0; iteration < 32; iteration += 1) {
      const mid = (lo + hi) / 2;
      const { ex, ey } = centre(rel, mid, tanH, tanV);
      if (Math.max(ex / COMPOSE_FILL.x, ey / COMPOSE_FILL.y) > 1) lo = mid;
      else hi = mid;
    }
    r = hi;
  }
  const { ox, oy } = centre(rel, r, tanH, tanV);
  return { radius: r, shift: { x: ox / (r * tanH), y: oy / (r * tanV) } };
}

/** FIT: the existing whole-machine radius and target, plus the centring shift. */
export function measureFit(camera: ArcRotateCamera, candidates: readonly AbstractMesh[], aspect: number): Framing | null {
  const visible = visiblePoints(candidates);
  if (!visible) return null;
  const saved = { radius: camera.radius, target: camera.target.clone(), upper: camera.upperRadiusLimit };
  fitVisibleVehicle(camera, candidates, aspect);
  const framing: Framing = {
    radius: camera.radius, target: camera.target.clone(), upperRadiusLimit: camera.upperRadiusLimit ?? 42,
    shift: { x: 0, y: 0 },
  };
  camera.setTarget(saved.target, false, false, true);
  camera.radius = saved.radius;
  camera.upperRadiusLimit = saved.upper;
  framing.shift = solve(camera, visible.points, framing.target, aspect, framing.radius, true).shift;
  return framing;
}

/** Composed presentation framing at the current orbit angles. */
export function measureComposed(camera: ArcRotateCamera, candidates: readonly AbstractMesh[], aspect: number): Framing | null {
  const visible = visiblePoints(candidates);
  if (!visible) return null;
  const solved = solve(camera, visible.points, visible.center, aspect, camera.radius, false);
  return {
    radius: solved.radius, target: visible.center, shift: solved.shift,
    upperRadiusLimit: Math.max(42, solved.radius),
  };
}

/** Apply a framing immediately, preserving alpha and beta. */
export function applyFraming(camera: ArcRotateCamera, framing: Framing, shift: ScreenShift): void {
  camera.inertialAlphaOffset = camera.inertialBetaOffset = camera.inertialRadiusOffset = 0;
  camera.inertialPanningX = camera.inertialPanningY = 0;
  camera.setTarget(framing.target, false, false, true);
  camera.upperRadiusLimit = framing.upperRadiusLimit;
  camera.radius = framing.radius;
  shift.x = framing.shift.x;
  shift.y = framing.shift.y;
}

/** Keep the shift a constant screen fraction as the radius changes. */
export function updateScreenShift(camera: ArcRotateCamera, shift: ScreenShift, aspect: number): void {
  const tanV = Math.tan(camera.fov / 2);
  const x = shift.x * camera.radius * tanV * Math.max(aspect, 0.01);
  const y = shift.y * camera.radius * tanV;
  if (camera.targetScreenOffset.x !== x || camera.targetScreenOffset.y !== y) camera.targetScreenOffset.set(x, y);
}
