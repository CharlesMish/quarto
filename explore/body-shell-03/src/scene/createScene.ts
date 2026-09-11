import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Culling/ray";
import { P } from "../design/parameters";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";
import { getBuildInfo, type Mt1InspectionState } from "../buildInfo";
import { auditAuthorityBounds } from "../machine/authority";
import { createS5Machine } from "../machine/createS5Machine";
import type { MachineRig } from "../machine/types";
import { runS5Authority } from "../verify/s5Clearance";
import {
  evalCamTrack,
  evaluateS5Handover,
  getPathCertificate,
  getPathCertificateState,
  invalidatePathCertificate,
} from "../verify/s5Capture";
import { clamp01 } from "../math/stage";
import { createUI, debugPanel } from "../ui/createUI";
import { studyCant } from "../verify/cantStudy";
import { runClearance } from "../verify/clearance";
import { runFrontClearance } from "../verify/frontClearance";
import { evaluateDriveReadiness } from "../verify/capturePredicates";
import { studyHaunch } from "../verify/haunchStudy";
import { runMachineAuthority } from "../verify/machineClearance";
import { runS4Authority } from "../verify/s4Clearance";
import { runVb1Study } from "../study/vb1/runStudy";
import { runVb1Ar1Study } from "../study/vb1/ar1F5";
import { runDp1Study } from "../study/dp1/runStudy";

import { createDebugView } from "./debug";
import { createMaterials } from "./materials";
import { box } from "./primitives";
import { describeDirectorMesh, renderRow } from "./directorInspection";
import { createH1Presentation } from "./h1Presentation";
import { createBodyShellConcept } from "./bodyShellConcept";
import { runBodyShellFit } from "../verify/bodyShellFit";
import { createPresentationPalette } from "../presentation/palette";
import { fitVisibleVehicle } from "../presentation/fitCamera";
import { TOUR_STOPS, type PresentationPalette, type PresentationState } from "../presentation/viewerState";

export interface App {
  setT(t: number): void;
  getT(): number;
  rig: MachineRig;
}

const CAMERAS: Record<string, { alpha: number; beta: number; radius: number; target: [number, number, number] }> = {
  body: { alpha: 0.78, beta: 1.14, radius: 16.8, target: [0, 1.05, 0.1] },
  driveBody: { alpha: 0.98, beta: 1.18, radius: 15.2, target: [0, 1.15, -0.6] },
  three: { alpha: 0.7, beta: 1.12, radius: 16, target: [-1.3, 1.5, 0.4] },
  top: { alpha: -Math.PI / 2, beta: 0.18, radius: 22, target: [0, 0.2, 0] },
  side: { alpha: Math.PI, beta: 1.18, radius: 16.5, target: [0, 1.2, 0] },
  rear: { alpha: Math.PI / 2, beta: 1.12, radius: 15, target: [0, 1.15, -2.4] },
  bay: { alpha: 0.45, beta: 1.22, radius: 8, target: [0, 0.85, -3.3] },
  front: { alpha: 0.55, beta: 1.12, radius: 10, target: [-1.4, 1.6, 2.4] },
  frontTop: { alpha: -Math.PI / 2, beta: 0.16, radius: 12, target: [-1.5, 0.2, 2.2] },
  carry: { alpha: 0.25, beta: 1.18, radius: 8, target: [-1.15, 1.55, 2.25] },
  prop: { alpha: 0.92, beta: 1.16, radius: 4.6, target: [0, 0.82, -4.7] },
  aftProp: { alpha: 1.42, beta: 1.18, radius: 4.8, target: [0, 0.8, -5.95] },
  propStowed: { alpha: 1.42, beta: 1.18, radius: 4.8, target: [0, 0.82, -3.55] },
  propMid: { alpha: 1.42, beta: 1.18, radius: 4.8, target: [0, 0.82, -4.5] },
  propSeated: { alpha: 1.42, beta: 1.18, radius: 4.8, target: [0, 0.82, -5.65] },
  propReleased: { alpha: 1.42, beta: 1.18, radius: 4.8, target: [0, 0.82, -5.55] },
  // External presentation angles keep the BODY ON stern inspectable. The
  // legacy H1 camera entries above remain unchanged for their original review.
  tourHandover: { alpha: -1.12, beta: 1.15, radius: 8.8, target: [0, 1, -4.3] },
  tourSeated: { alpha: -1.12, beta: 1.18, radius: 6.5, target: [0, 0.9, -5.5] },
  lockPort: { alpha: 2.22, beta: 1.04, radius: 0.16, target: [-0.54, 0.53, -4.57] },
  lockStarboard: { alpha: 0.92, beta: 1.04, radius: 0.16, target: [0.54, 0.53, -4.57] },
  lockTopPort: { alpha: 1.92, beta: 0.62, radius: 0.17, target: [-0.393, 1.224, -4.57] },
  lockTopStarboard: { alpha: 1.22, beta: 0.62, radius: 0.17, target: [0.393, 1.224, -4.57] },
  // FO1 station-family review. Starboard to match BODY 3/4. Inspection only.
  fo1FwdRoot: { alpha: 0.82, beta: 1.12, radius: 3.35, target: [0.88, 1.68, 3.22] },
  fo1AftRoot: { alpha: 0.96, beta: 1.08, radius: 3.7, target: [0.92, 2.12, -1.88] },
};

export function createApp(canvas: HTMLCanvasElement): App {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.06, 0.07, 0.08, 1);

  const camera = new ArcRotateCamera("cam", CAMERAS.body.alpha, CAMERAS.body.beta, CAMERAS.body.radius, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 0.05;
  camera.upperRadiusLimit = 42;
  camera.lowerBetaLimit = 0.05;
  camera.upperBetaLimit = Math.PI / 2 - 0.04;
  camera.wheelPrecision = 40;
  camera.panningSensibility = 80;
  camera.minZ = 0.005;
  applyCamera("body", camera);

  const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.15), scene);
  hemi.intensity = 0.55;
  hemi.groundColor = new Color3(0.08, 0.09, 0.1);
  const sun = new DirectionalLight("sun", new Vector3(-0.35, -1, 0.25), scene);
  sun.position = new Vector3(6, 14, -4);
  sun.intensity = 0.75;

  const mats = createMaterials(scene);
  const floor = MeshBuilder.CreateGround("floor", { width: 28, height: 28 }, scene);
  floor.material = mats.floor;
  floor.position.y = 0;
  for (let i = -10; i <= 10; i += 1) {
    box(scene, `gridX_${i}`, floor, mats.grid, [0.02, 0.01, 20], [i, 0.01, 0]);
    box(scene, `gridZ_${i}`, floor, mats.grid, [20, 0.01, 0.02], [0, 0.01, i]);
  }

  const rig = createS5Machine(scene, mats);
  const h1 = createH1Presentation(scene, rig, mats);
  const bodyConcept = createBodyShellConcept(scene);
  const palette = createPresentationPalette(scene);
  const solidsByNode = new Map(rig.solids.map((solid) => [solid.node, solid]));
  const datumsByNode = new Map(rig.datums.map((datum) => [datum.node, datum]));
  const presentationNames = new Set([...h1.presentationMeshes, ...bodyConcept.meshes]);
  const fitMeshes = scene.meshes.filter((mesh) => solidsByNode.get(mesh)?.role === "physical" || presentationNames.has(mesh.name));
  const uiRoot = document.getElementById("ui");
  if (!uiRoot) throw new Error("missing #ui");

  let transformT = 0;
  let frontT = 0;
  let machineT = 0;
  let automatic = false;
  let direction = 1;
  let debugOn = false;
  let sectionOn = false;
  let propSectionOn = false;
  let previewOn = false;
  let inspectPickOn = false;
  let lockFocusOn = false;
  let tourStep: number | null = null;
  let followFit = true;
  let ui: ReturnType<typeof createUI>;
  let debug: ReturnType<typeof createDebugView>;

  const presentationState = (): PresentationState => ({ palette: palette.getPalette(), tourStep, automatic, direction });
  const syncPresentation = (): void => {
    ui.setPresentation(presentationState());
    ui.setViewState({
      debug: debugOn, body: bodyConcept.isEnabled(), bodySection: bodyConcept.isSection(),
      section: sectionOn, propSection: propSectionOn, lockFocus: lockFocusOn,
    });
  };
  const leaveTour = (): void => {
    if (tourStep === null) return;
    tourStep = null;
    syncPresentation();
  };
  const preparePoseCommand = (): void => {
    ui.cancelPendingInput();
    automatic = false;
    leaveTour();
  };
  const fitCurrent = (): void => {
    engine.resize();
    fitVisibleVehicle(camera, fitMeshes, canvas.clientWidth / Math.max(1, canvas.clientHeight));
  };
  const fitCamera = (): void => {
    ui.cancelPendingInput();
    leaveTour();
    followFit = true;
    fitCurrent();
  };
  const setCamera = (preset: string): void => {
    ui.cancelPendingInput();
    leaveTour();
    followFit = false;
    applyCamera(preset, camera);
  };
  const setPalette = (value: PresentationPalette): void => {
    if (value !== "hush-basin" && value !== "accepted") throw new RangeError("Unknown presentation palette");
    ui.cancelPendingInput();
    palette.setPalette(value);
    syncPresentation();
    // Preserve the current diagnostic values; changing a color scheme must not
    // evaluate authority merely to update its explanatory legend.
    const note = debugPanel().querySelector(".debug-note");
    if (note) note.textContent = value === "hush-basin"
      ? "Red = protected corridor. Amber = empty occupancy. Carry is muted teal. RGB axes at datums. Core color is decorative, not readiness."
      : "Red = protected corridor. Amber = empty occupancy. Carry is ochre. RGB axes at datums.";
  };

  const setLockFocus = (on: boolean): void => {
    if (lockFocusOn === on) return;
    lockFocusOn = on;
    for (const mesh of scene.meshes) {
      const keep =
        mesh.name.startsWith("S5_LOCK_") ||
        mesh.name.startsWith("S5_SEAT_TONGUE_") ||
        mesh.name.startsWith("S5_REG_PAD_") ||
        mesh.name.startsWith("H1_REG_BRACKET_");
      const meta = (mesh.metadata ??= {}) as Record<string, unknown>;
      if (on) {
        meta.s5StudyVisibility = mesh.visibility;
        if (!keep) mesh.visibility = 0;
      } else if (typeof meta.s5StudyVisibility === "number") {
        mesh.visibility = meta.s5StudyVisibility;
        delete meta.s5StudyVisibility;
      }
    }
  };

  const refreshDebug = (): void => {
    // Guard before constructing arguments: readiness getters may certify a
    // stale path. Hidden presentation diagnostics have no work to display.
    if (!debugOn) return;
    debug.update(frontT, rig.evaluateFront(frontT), transformT, rig.evaluate(transformT), {
      machineT,
      driveT: rig.lastDriveT(),
      requestedDriveT: rig.lastRequestedDriveT(),
      appliedDriveT: rig.lastDriveT(),
      frontStbdT: rig.lastFrontStbdT(),
      rearStbdT: rig.lastRearStbdT(),
      mode: rig.authorityMode(),
      ready: evaluateDriveReadiness(rig, rig.getReadinessOverride()),
      driveThrustReady: rig.lastDriveThrustReady(),
      s5: evaluateS5Handover(rig),
    });
    if (palette.getPalette() === "hush-basin") {
      const note = debugPanel().querySelector(".debug-note");
      if (note) note.textContent = "Red = protected corridor. Amber = empty occupancy. Carry is muted teal. RGB axes at datums. Core color is decorative, not readiness.";
    }
  };

  const applyCanonicalPose = (value: number): void => {
    previewOn = false;
    machineT = clamp01(value);
    const mapped = rig.applyMachine(machineT);
    frontT = mapped.frontT;
    transformT = mapped.rearT;
    ui.setMachineT(machineT, automatic, "MACHINE");
    ui.setFrontT(frontT, automatic);
    ui.setTransform(transformT, automatic);
    palette.setForm(machineT);
    syncPresentation();
    refreshDebug();
  };

  const setMachineT = (value: number): void => {
    preparePoseCommand();
    applyCanonicalPose(value);
  };

  const setT = (value: number): void => {
    preparePoseCommand();
    previewOn = true;
    transformT = clamp01(value);
    rig.apply(transformT);
    rig.setAuthorityMode("REAR_PREVIEW");
    ui.setTransform(transformT, automatic);
    ui.setMachineT(machineT, automatic, "REAR_PREVIEW");
    syncPresentation();
    refreshDebug();
  };

  const setFrontT = (value: number): void => {
    preparePoseCommand();
    previewOn = true;
    frontT = clamp01(value);
    rig.applyFront(frontT);
    rig.setAuthorityMode("FRONT_PREVIEW");
    ui.setFrontT(frontT, automatic);
    ui.setMachineT(machineT, automatic, "FRONT_PREVIEW");
    syncPresentation();
    refreshDebug();
  };

  const reverseAutomatic = (): void => {
    ui.cancelPendingInput();
    leaveTour();
    direction = machineT <= 0 ? 1 : machineT >= 1 ? -1 : -direction;
    automatic = true;
    ui.setMachineT(machineT, automatic, rig.authorityMode());
    syncPresentation();
  };

  const setTourStep = (value: number | null): void => {
    if (value !== null && (!Number.isInteger(value) || !TOUR_STOPS[value])) throw new RangeError("Unknown tour stop");
    ui.cancelPendingInput();
    if (value === null) { leaveTour(); return; }
    automatic = false;
    tourStep = value;
    const stop = TOUR_STOPS[value];
    applyCanonicalPose(stop.t);
    applyCamera(stop.camera, camera);
    followFit = value < 4;
    if (followFit) fitCurrent();
    else camera.radius *= Math.max(1, 0.9 / (canvas.clientWidth / Math.max(1, canvas.clientHeight)));
    syncPresentation();
  };

  ui = createUI(uiRoot, {
    setMachineT(value) {
      automatic = false;
      setMachineT(value);
    },
    setTransform(value) {
      automatic = false;
      setT(value);
    },
    setFrontT(value) {
      automatic = false;
      setFrontT(value);
    },
    toggleAutomatic() {
      ui.cancelPendingInput();
      leaveTour();
      automatic = !automatic;
      direction = machineT >= 0.999 ? -1 : machineT <= 0.001 ? 1 : direction;
      ui.setMachineT(machineT, automatic, rig.authorityMode());
      syncPresentation();
    },
    reverseAutomatic,
    fitCamera,
    setPalette,
    setTourStep,
    setCamera,
    resetCamera() {
      setCamera("body");
    },
    toggleDebug() {
      debugOn = !debugOn;
      debug.setEnabled(debugOn);
      refreshDebug();
      return debugOn;
    },
    toggleSection() {
      sectionOn = !sectionOn;
      debug.setSection(sectionOn);
      return sectionOn;
    },
    togglePropSection() {
      propSectionOn = !propSectionOn;
      for (const m of scene.meshes) {
        if (m.name.startsWith("S5_CAN_")) m.visibility = propSectionOn ? 0.08 : 1;
      }
      bodyConcept.setPropGhost(propSectionOn);
      return propSectionOn;
    },
    toggleInspectPick() {
      inspectPickOn = !inspectPickOn;
      ui.setInspectMode(inspectPickOn);
      if (!inspectPickOn) ui.showInspection(null);
      return inspectPickOn;
    },
    toggleLockFocus() {
      setLockFocus(!lockFocusOn);
      return lockFocusOn;
    },
    toggleBodyConcept() {
      bodyConcept.setEnabled(!bodyConcept.isEnabled());
      return bodyConcept.isEnabled();
    },
    toggleBodySection() {
      bodyConcept.setSection(!bodyConcept.isSection());
      return bodyConcept.isSection();
    },
  });

  // Direct orbit/pan/zoom leaves guided framing without changing the pose.
  canvas.addEventListener("pointerdown", () => { ui.cancelPendingInput(); leaveTour(); followFit = false; });
  canvas.addEventListener("wheel", () => { ui.cancelPendingInput(); leaveTour(); followFit = false; }, { passive: true });

  canvas.addEventListener("pointerup", (event) => {
    if (!inspectPickOn) return;
    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * canvas.clientWidth;
    const y = ((event.clientY - bounds.top) / bounds.height) * canvas.clientHeight;
    const picked = scene.pick(x, y)?.pickedMesh;
    ui.showInspection(picked ? describeDirectorMesh(picked, solidsByNode, datumsByNode) : null);
  });

  debug = createDebugView(scene, debugPanel(), rig.datums, rig.keepoutNodes, rig.emptyVolumeNodes);
  // The machine is constructed at the zero pose. Reflect that existing pose in
  // the presentation without calling production applyMachine(), which may
  // synchronously certify a stale S5 path.
  ui.setMachineT(machineT, automatic, rig.authorityMode());
  ui.setFrontT(frontT, automatic);
  ui.setTransform(transformT, automatic);
  syncPresentation();

  scene.registerBeforeRender(() => {
    if (!automatic) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    const next = machineT + direction * dt * (1 / 12);
    if (next >= 1) {
      automatic = false;
      applyCanonicalPose(1);
    } else if (next <= 0) {
      automatic = false;
      applyCanonicalPose(0);
    } else {
      applyCanonicalPose(next);
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });
  const resizeObserver = new ResizeObserver(() => {
    engine.resize();
    if (followFit) fitCurrent();
  });
  resizeObserver.observe(canvas);
  scene.onDisposeObservable.add(() => { resizeObserver.disconnect(); palette.dispose(); });
  fitCurrent();

  window.__MT1 = {
    presentation: {
      getState: () => ({ ...presentationState(), viewerId: "QUARTO-VIEWER-01" }),
      setPalette,
      setTourStep,
      fitCamera,
      reverse: reverseAutomatic,
    },
    getBuildInfo,
    getInspectionState: (): Mt1InspectionState => {
      const certificate = getPathCertificate(rig);
      return {
        candidateId: getBuildInfo().candidateId,
        machineT,
        driveT: rig.lastDriveT(),
        requestedDriveT: rig.lastRequestedDriveT(),
        mode: rig.authorityMode(),
        preview: previewOn,
        driveThrustReadyCached: rig.peekDriveThrustReady(),
        certificate: {
          state: getPathCertificateState(rig),
          present: certificate !== undefined,
          valid: certificate?.valid === true,
          samples: certificate?.samples ?? null,
          pairsEvaluated: certificate?.pairsEvaluated ?? null,
        },
      };
    },
    getRenderInventory: () => scene.meshes.map((mesh) => renderRow(mesh, solidsByNode, datumsByNode)),
    setBodyConcept: (on: boolean) => { ui.cancelPendingInput(); bodyConcept.setEnabled(on); syncPresentation(); },
    setBodySection: (on: boolean) => { ui.cancelPendingInput(); bodyConcept.setSection(on); syncPresentation(); },
    getBodyConceptState: () => ({
      enabled: bodyConcept.isEnabled(),
      section: bodyConcept.isSection(),
      meshes: [...bodyConcept.meshes],
      sectionMeshes: [...bodyConcept.sectionMeshes],
      propGhostMeshes: [...bodyConcept.propGhostMeshes],
      masses: [...bodyConcept.masses],
      conceptId: BODY_CONCEPT_INFO.conceptId,
      surfaceRevision: BODY_CONCEPT_INFO.surfaceRevision,
      stationRevision: BODY_CONCEPT_INFO.stationRevision,
    }),
    runBodyShellFit: () => runBodyShellFit(
      rig,
      scene.meshes.filter((mesh) => mesh.name.startsWith("BODY_")),
    ),
    setT,
    getT: () => transformT,
    setFrontT,
    getFrontT: () => frontT,
    setFrontStbdT: (value) => {
      preparePoseCommand();
      previewOn = true;
      rig.applyFrontStbd(clamp01(value));
      rig.setAuthorityMode("FRONT_STBD_PREVIEW");
      ui.setMachineT(machineT, automatic, "FRONT_STBD_PREVIEW");
      syncPresentation();
      refreshDebug();
    },
    getFrontStbdT: () => rig.lastFrontStbdT(),
    setRearStbdT: (value) => {
      preparePoseCommand();
      previewOn = true;
      rig.applyRearStbd(clamp01(value));
      rig.setAuthorityMode("REAR_STBD_PREVIEW");
      ui.setMachineT(machineT, automatic, "REAR_STBD_PREVIEW");
      syncPresentation();
      refreshDebug();
    },
    getRearStbdT: () => rig.lastRearStbdT(),
    setMachineT,
    getMachineT: () => machineT,
    getDriveT: () => rig.lastDriveT(),
    getRequestedDriveT: () => rig.lastRequestedDriveT(),
    getAppliedDriveT: () => rig.lastDriveT(),
    getAuthorityMode: () => rig.authorityMode(),
    setReadinessOverride: (value) => rig.setReadinessOverride(value),
    applyDrive: (driveT) => rig.applyDrive(driveT),
    getStages: () => rig.evaluate(transformT),
    getFrontStages: () => rig.evaluateFront(frontT),
    getParams: () => P,
    getReadiness: () => evaluateDriveReadiness(rig, rig.getReadinessOverride()),
    poseSnapshot: (t) => rig.poseSnapshot(t ?? transformT),
    frontPoseSnapshot: (t) => rig.frontPoseSnapshot(t ?? frontT),
    machinePoseSnapshot: (t) => rig.machinePoseSnapshot(t ?? machineT),
    runClearance: () => runClearance(rig),
    runFrontClearance: () => runFrontClearance(rig),
    runMachineAuthority: (override) => runMachineAuthority(rig, override),
    runS4Authority: (override) => runS4Authority(rig, override),
    runVb1Study: (override) => runVb1Study(rig, override),
    runVb1Ar1Study: (override) => runVb1Ar1Study(rig, override),
    runDp1Study: (override) => runDp1Study(rig, override),
    runS5Authority: (override) => runS5Authority(rig, override),
    runS5CamTrack: () => evalCamTrack(rig),
    getS5PathCertificate: () => getPathCertificate(rig),
    invalidateS5PathCertificate: () => invalidatePathCertificate(rig),
    getDriveThrustReady: () => rig.lastDriveThrustReady(),
    evaluateS5Handover: () => evaluateS5Handover(rig),
    applyMachineRaw: (value: number) => rig.applyMachine(value),
    applyS5Override: (value) => rig.applyS5Override(value),
    getS5Override: () => rig.getS5Override(),
    probeLockEscape: (engaged) => rig.probeLockEscape(engaged),
    setPropSection: (on: boolean) => {
      ui.cancelPendingInput();
      propSectionOn = on;
      for (const m of scene.meshes) {
        if (m.name.startsWith("S5_CAN_")) m.visibility = on ? 0.08 : 1;
      }
      bodyConcept.setPropGhost(on);
      syncPresentation();
    },
    setLockStudyView: (on: boolean) => {
      ui.cancelPendingInput();
      setLockFocus(on);
      syncPresentation();
    },
    runHaunchStudy: () => rig.withPreservedPose(() => studyHaunch(rig)),
    runCantStudy: () => rig.withPreservedPose(() => studyCant(rig)),
    setCamera,
    setDebug: (on) => {
      ui.cancelPendingInput();
      debugOn = on;
      debug.setEnabled(on);
      refreshDebug();
      syncPresentation();
    },
    setSection: (on) => {
      ui.cancelPendingInput();
      sectionOn = on;
      debug.setSection(on);
      syncPresentation();
    },
    previewHaunch: (deg) => {
      preparePoseCommand();
      previewOn = true;
      rig.apply(0.9, { haunchDeg: deg });
      rig.setAuthorityMode("HAUNCH_PREVIEW");
      ui.setMachineT(machineT, automatic, "HAUNCH_PREVIEW");
      syncPresentation();
      refreshDebug();
    },
    previewCant: (deg) => {
      preparePoseCommand();
      previewOn = true;
      rig.applyFront(1, { cantDeg: deg });
      rig.setAuthorityMode("CANT_PREVIEW");
      ui.setMachineT(machineT, automatic, "CANT_PREVIEW");
      syncPresentation();
      refreshDebug();
    },
    clearPreview: () => {
      setMachineT(machineT);
    },
    isPreview: () => previewOn,
    auditAuthority: () => auditAuthorityBounds(rig.root, rig.solids),
  };

  return { setT, getT: () => transformT, rig };
}

function applyCamera(preset: string, camera: ArcRotateCamera): void {
  const c = CAMERAS[preset] ?? CAMERAS.three;
  camera.inertialAlphaOffset = 0;
  camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0;
  camera.inertialPanningX = 0;
  camera.inertialPanningY = 0;
  camera.setTarget(new Vector3(...c.target));
  camera.alpha = c.alpha;
  camera.beta = c.beta;
  camera.radius = c.radius;
}
