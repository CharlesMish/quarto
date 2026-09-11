import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** Fit visible vehicle surfaces, excluding the floor, axes and reservations.
 * This observes render bounds only; it never poses or evaluates the mechanism.
 */
export function fitVisibleVehicle(camera: ArcRotateCamera, candidates: readonly AbstractMesh[], aspect: number): void {
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
  if (!points.length) return;
  camera.inertialAlphaOffset = camera.inertialBetaOffset = camera.inertialRadiusOffset = 0;
  camera.inertialPanningX = camera.inertialPanningY = 0;
  const center = min.add(max).scale(0.5);
  // Retargeting normally rebuilds angles from the previous camera position.
  // Preserve the chosen orbit, including a preset assigned before this frame.
  camera.setTarget(center, false, false, true);
  camera.getViewMatrix(true);
  const back = camera.position.subtract(center).normalize();
  const right = Vector3.Cross(Vector3.Up(), back).normalize();
  const up = Vector3.Cross(back, right).normalize();
  const vertical = Math.tan(camera.fov / 2);
  const horizontal = vertical * Math.max(aspect, 0.01);
  let distance = 0.2;
  for (const point of points) {
    const offset = point.subtract(center);
    const planar = Math.max(Math.abs(Vector3.Dot(offset, right)) / horizontal, Math.abs(Vector3.Dot(offset, up)) / vertical);
    distance = Math.max(distance, Vector3.Dot(offset, back) + planar * 1.14);
  }
  camera.upperRadiusLimit = Math.max(42, distance);
  camera.radius = distance;
}
