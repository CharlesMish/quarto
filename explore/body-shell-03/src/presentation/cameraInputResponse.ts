import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

/** Reduce manual orbit travel without changing Babylon's pinch or input cutoffs. */
export function softenOrbitResponse(camera: ArcRotateCamera): void {
  const gain = 2 / 3;
  let alpha = camera.alpha;
  let beta = camera.beta;
  let hasOrbitInput = false;

  // The supported camera-input hook runs before inertia is integrated. Capture
  // the current pose here so direct preset/fit/tour changes are not scaled.
  camera.inputs.add({
    camera,
    getClassName: () => "PresentationOrbitResponseInput",
    getSimpleName: () => "presentationOrbitResponse",
    attachControl: () => {},
    detachControl: () => {},
    checkInputs: () => {
      alpha = camera.alpha;
      beta = camera.beta;
      hasOrbitInput = camera.inertialAlphaOffset !== 0 || camera.inertialBetaOffset !== 0;
    },
  });
  camera.onAfterCheckInputsObservable.add(() => {
    if (!hasOrbitInput) return;
    camera.alpha = alpha + (camera.alpha - alpha) * gain;
    // Preserve an exact stop at either existing vertical limit.
    if (camera.beta !== camera.lowerBetaLimit && camera.beta !== camera.upperBetaLimit) {
      camera.beta = beta + (camera.beta - beta) * gain;
    }
  });
}
