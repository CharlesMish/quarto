import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { softenOrbitResponse } from "../presentation/cameraInputResponse";
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
import { applyFraming, expandForVisiblePose, measureComposed, measureFit, updateScreenShift, type Framing, type ScreenShift } from "../presentation/frameVehicle";
import { TOUR_STOPS, type PresentationPalette, type PresentationState } from "../presentation/viewerState";
import { chooseLightingTier, createPresentationLighting, createStageFloor } from "../presentation/lighting";
import { createPlaybackClock, PLAYBACK_PROFILES, type PlaybackClock, type PlaybackProfile } from "../presentation/playbackClock";

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
  // Twenty percent less zoom input; retain the existing inertia and limits.
  camera.wheelPrecision = 50;
  camera.pinchPrecision = 15;
  // One third less pan input than the first camera-control preview.
  camera.panningSensibility = 150;
  softenOrbitResponse(camera);
  camera.minZ = 0.005;
  applyCamera("body", camera);

  const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.15), scene);
  hemi.intensity = 0.55;
  hemi.groundColor = new Color3(0.08, 0.09, 0.1);
  const sun = new DirectionalLight("sun", new Vector3(-0.35, -1, 0.25), scene);
  sun.position = new Vector3(6, 14, -4);
  sun.intensity = 0.75;

  const mats = createMaterials(scene);
  const lightingTier = chooseLightingTier(engine);
  const floor = createStageFloor(scene, engine, lightingTier, mats.floor.diffuseColor, mats.grid.diffuseColor, () => {
    // Original viewer floor, kept verbatim for the flat tier.
    const legacy = MeshBuilder.CreateGround("floor", { width: 28, height: 28 }, scene);
    legacy.material = mats.floor;
    legacy.position.y = 0;
    for (let i = -10; i <= 10; i += 1) {
      box(scene, `gridX_${i}`, legacy, mats.grid, [0.02, 0.01, 20], [i, 0.01, 0]);
      box(scene, `gridZ_${i}`, legacy, mats.grid, [20, 0.01, 0.02], [0, 0.01, i]);
    }
    return legacy;
  });

  const rig = createS5Machine(scene, mats);
  const h1 = createH1Presentation(scene, rig, mats);
  const bodyConcept = createBodyShellConcept(scene);
  const palette = createPresentationPalette(scene);
  const solidsByNode = new Map(rig.solids.map((solid) => [solid.node, solid]));
  const reducedMotion = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const datumsByNode = new Map(rig.datums.map((datum) => [datum.node, datum]));
  const presentationNames = new Set([...h1.presentationMeshes, ...bodyConcept.meshes]);
  const fitMeshes = scene.meshes.filter((mesh) => solidsByNode.get(mesh)?.role === "physical" || presentationNames.has(mesh.name));
  const lighting = createPresentationLighting({ scene, engine, camera, sun, hemi, floor, tier: lightingTier, casters: fitMeshes });
  const uiRoot = document.getElementById("ui");
  if (!uiRoot) throw new Error("missing #ui");

  let transformT = 0;
  let frontT = 0;
  let machineT = 0;
  let automatic = false;
  let direction = 1;
  // Show reveals the sequence promptly; Inspect remains available for study.
  let playback: PlaybackProfile = "show";
  let clock: PlaybackClock | null = null;
  let debugOn = false;
  let sectionOn = false;
  let propSectionOn = false;
  let previewOn = false;
  let inspectPickOn = false;
  let lockFocusOn = false;
  let tourStep: number | null = null;
  let followFit = true;
  // Guided framing: load, FIT and endpoint settles use composition.
  // "fit" retains the tour stops' historical whole-machine distance. Both
  // keep the machine centred through a screen shift.
  let followMode: "compose" | "fit" = "compose";
  const screenShift: ScreenShift = { x: 0, y: 0 };
  let easing: { from: Framing; to: Framing; elapsed: number } | null = null;
  // One SPREAD → DRIVE → SPREAD showing after load; see startIntro below.
  let intro: { stage: "wait" | "forward" | "hold" | "back"; at: number } | null = null;
  let ui: ReturnType<typeof createUI>;
  let debug: ReturnType<typeof createDebugView>;

  const presentationState = (): PresentationState => ({ palette: palette.getPalette(), tourStep, automatic, direction, playback });
  // ResizeObserver can lag a CSS resize by one render. Use the dimensions
  // of the active projection until engine.resize() updates the render buffer.
  const aspect = (): number => engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
  const measureFraming = (): Framing | null => (followMode === "fit" ? measureFit : measureComposed)(camera, fitMeshes, aspect());
  const stopEasing = (): void => { easing = null; };
  // Preserve the intent of PLAY/Space when capture-phase takeover pauses the
  // intro before the control's own click/keydown handler runs.
  let playAfterTakeover: boolean | null = null;
  const cancelIntro = (event: Event): void => {
    // A held Space on the focused button activates on keyup. Auto-repeat must
    // not erase the PAUSE intent recorded on its first keydown.
    if (event instanceof KeyboardEvent && event.repeat) return;
    playAfterTakeover = null;
    if (!intro) return;
    const target = event.target instanceof Element ? event.target : null;
    const key = event instanceof KeyboardEvent ? event : null;
    const playButton = Boolean(target?.closest("#autoBtn"));
    const spaceShortcut = key?.code === "Space" && !key.altKey && !key.ctrlKey && !key.metaKey && !key.repeat
      && !target?.closest('input, select, textarea, button, [contenteditable]:not([contenteditable="false"])');
    if ((event.type === "pointerdown" && playButton)
      || (key && playButton && (key.code === "Space" || key.key === "Enter")) || spaceShortcut) {
      playAfterTakeover = !automatic;
    }
    intro = null;
    automatic = false;
    clock = null;
    stopEasing();
    // Do not cancel/consume the event or a queued slider input. The original
    // control still performs its command (reverse, preset, FIT, scrub, etc.).
    syncPresentation();
  };
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
    stopEasing();
    const framing = measureFraming();
    if (framing) applyFraming(camera, framing, screenShift);
  };
  /** Glide to the guided framing for the pose now shown (endpoint settles). */
  const easeToFraming = (): void => {
    if (!followFit) return;
    engine.resize();
    const to = measureFraming();
    if (!to) return;
    if (reducedMotion?.matches) { stopEasing(); applyFraming(camera, to, screenShift); return; }
    easing = {
      from: { radius: camera.radius, target: camera.target.clone(), shift: { ...screenShift }, upperRadiusLimit: camera.upperRadiusLimit ?? 42 },
      to, elapsed: 0,
    };
  };
  const fitCamera = (): void => {
    ui.cancelPendingInput();
    leaveTour();
    followFit = true;
    followMode = "compose";
    fitCurrent();
  };
  const setCamera = (preset: string): void => {
    ui.cancelPendingInput();
    leaveTour();
    followFit = false;
    stopEasing();
    screenShift.x = screenShift.y = 0;
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

  let debugCertificationScheduled = false;
  const scheduleDebugCertification = (): void => {
    // Diagnostics need the S5 path certificate. Its cold generation is a long
    // synchronous sweep, so explain it and let that text paint before the
    // main thread blocks. Interactive posing never starts this work.
    if (debugCertificationScheduled) return;
    debugCertificationScheduled = true;
    debugPanel().innerHTML = `<div class="debug-head">${getBuildInfo().candidateId} DEBUG</div>`
      + `<div class="debug-note">Certifying the stern capture path for diagnostics. This runs once per visit and can take several seconds.</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      debugCertificationScheduled = false;
      refreshDebug();
    }));
  };

  const refreshDebug = (deferColdCertification = false): void => {
    // Guard before constructing arguments: readiness getters may certify a
    // stale path. Hidden presentation diagnostics have no work to display.
    if (!debugOn) return;
    if (deferColdCertification && getPathCertificateState(rig) === "STALE") {
      scheduleDebugCertification();
      return;
    }
    if (debugCertificationScheduled) return;
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

  /**
   * Canonical machine pose. Interactive presentation input (slider, playback,
   * tour, number keys) uses the presentation-only pose path: identical maps,
   * gate and lock pose, but no cold S5 path certification and no per-frame
   * handover evaluation on the main thread. The programmatic
   * window.__MT1.setMachineT keeps the certified path for authority, capture
   * and evidence tooling. Certificate state is never written by the fast path.
   */
  const applyCanonicalPose = (value: number, certify = false): void => {
    previewOn = false;
    const nextT = clamp01(value);
    // An endpoint glide belongs to the pose for which it was measured. Once
    // playback moves away, it must not finish later against that obsolete pose.
    if (nextT !== machineT) stopEasing();
    machineT = nextT;
    const mapped = certify ? rig.applyMachine(machineT) : rig.applyMachinePose(machineT);
    frontT = mapped.frontT;
    transformT = mapped.rearT;
    ui.setMachineT(machineT, automatic, "MACHINE");
    ui.setFrontT(frontT, automatic);
    ui.setTransform(transformT, automatic);
    palette.setForm(machineT);
    if (followFit) expandForVisiblePose(camera, fitMeshes, screenShift, aspect());
    syncPresentation();
    refreshDebug(!certify);
  };

  const setMachineT = (value: number, certify = false): void => {
    preparePoseCommand();
    stopEasing();
    applyCanonicalPose(value, certify);
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

  const setPlayback = (value: PlaybackProfile): void => {
    if (!PLAYBACK_PROFILES.includes(value)) throw new RangeError("Unknown playback profile");
    ui.cancelPendingInput();
    // A running clock is rebuilt from the current pose on the next frame.
    playback = value;
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
    if (followFit) {
      // Tour stops keep FIT's whole-machine distance (their poses are
      // recorded in evidence/camera-controls-03); they gain only the centring.
      followMode = "fit";
      fitCurrent();
    } else {
      stopEasing();
      screenShift.x = screenShift.y = 0;
      camera.radius *= Math.max(1, 0.9 / (canvas.clientWidth / Math.max(1, canvas.clientHeight)));
    }
    syncPresentation();
  };

  ui = createUI(uiRoot, {
    setMachineT(value) {
      automatic = false;
      setMachineT(value);
      // Reframe when a visitor lands on SPREAD or DRIVE; never mid-scrub.
      if (machineT <= 0 || machineT >= 1) easeToFraming();
      else stopEasing();
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
      automatic = playAfterTakeover ?? !automatic;
      playAfterTakeover = null;
      intro = null; // also covers accessibility/programmatic button activation
      direction = machineT >= 0.999 ? -1 : machineT <= 0.001 ? 1 : direction;
      ui.setMachineT(machineT, automatic, rig.authorityMode());
      syncPresentation();
    },
    reverseAutomatic,
    fitCamera,
    setPalette,
    setPlayback,
    setTourStep,
    setCamera,
    resetCamera() {
      setCamera("body");
    },
    toggleDebug() {
      debugOn = !debugOn;
      debug.setEnabled(debugOn);
      refreshDebug(true);
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
  canvas.addEventListener("pointerdown", () => { ui.cancelPendingInput(); leaveTour(); followFit = false; stopEasing(); });
  canvas.addEventListener("wheel", () => { ui.cancelPendingInput(); leaveTour(); followFit = false; stopEasing(); }, { passive: true });
  // First interaction stops intro-owned motion immediately, without consuming
  // the input or changing the semantics of ordinary user-started playback.
  for (const type of ["pointerdown", "wheel", "keydown"] as const) {
    window.addEventListener(type, cancelIntro, { capture: true, passive: true });
  }

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

  // Study views read as the original flat engineering lighting.
  const studyViewActive = (): boolean =>
    debugOn || sectionOn || propSectionOn || lockFocusOn || bodyConcept.isSection();
  scene.onBeforeRenderObservable.add(() => {
    const study = studyViewActive();
    const polished = lightingTier !== "flat" && !study && palette.getPalette() === "hush-basin";
    palette.setShowcasePolish(polished);
    lighting.setStudyView(study);
    lighting.setShowcasePolish(polished);
  });

  // Playback only chooses when each canonical pose is shown; the clock never
  // leaves [0, 1] and every frame goes through the presentation pose path.
  let clockPose = -1;
  scene.registerBeforeRender(() => {
    if (!automatic) { clock = null; return; }
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    const heading = direction < 0 ? -1 : 1;
    // Any outside pose change, reverse or speed change restarts from here.
    if (!clock || clock.direction !== heading || clock.profile !== playback || clockPose !== machineT) {
      clock = createPlaybackClock(playback, machineT, heading, { reducedMotion: reducedMotion?.matches === true });
    }
    const sample = clock.step(dt);
    if (sample.done) {
      automatic = false;
      clock = null;
    }
    applyCanonicalPose(sample.machineT);
    clockPose = machineT;
    if (sample.done) settlePlayback();
  });

  // Playback that comes to rest on SPREAD or DRIVE glides to the framing for
  // that pose, so DRIVE is not left at SPREAD's wider distance.
  const settlePlayback = (): void => {
    if (machineT > 0 && machineT < 1) return;
    easeToFraming();
    if (intro?.stage === "forward" && machineT >= 1) intro = { stage: "hold", at: performance.now() + 1400 };
    else if (intro?.stage === "back") intro = null;
  };

  /**
   * Load-time showing: one Show-speed SPREAD → DRIVE → SPREAD pass on the
   * ordinary presentation pose path, so a first-time visitor sees the motion
   * without finding PLAY. It never certifies. It is skipped for reduced
   * motion and for automated browsers (tests and evidence capture keep the
   * paused start); `?intro=1` forces it and `?intro=0` turns it off.
   */
  const introRequest = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("intro");
  const introWanted = introRequest === "1"
    || (introRequest !== "0" && !navigator.webdriver && reducedMotion?.matches !== true);
  if (introWanted) intro = { stage: "wait", at: performance.now() + 900 };
  scene.onBeforeRenderObservable.add(() => {
    if (!intro || performance.now() < intro.at) return;
    if (intro.stage === "wait" || intro.stage === "hold") {
      // Respect a visitor who has already moved off the starting pose.
      if (intro.stage === "wait" && machineT !== 0) { intro = null; return; }
      direction = intro.stage === "wait" ? 1 : -1;
      playback = "show";
      automatic = true;
      intro = { stage: intro.stage === "wait" ? "forward" : "back", at: 0 };
      syncPresentation();
    }
  });

  // Framing glide and the persistent centring shift. Appearance only.
  scene.onBeforeRenderObservable.add(() => {
    if (easing) {
      easing.elapsed += Math.min(engine.getDeltaTime() / 1000, 0.05);
      const u = Math.min(1, easing.elapsed / 0.9);
      const k = u * u * (3 - 2 * u);
      const { from, to } = easing;
      camera.upperRadiusLimit = Math.max(from.upperRadiusLimit, to.upperRadiusLimit);
      camera.setTarget(Vector3.Lerp(from.target, to.target, k), false, false, true);
      camera.radius = from.radius + (to.radius - from.radius) * k;
      screenShift.x = from.shift.x + (to.shift.x - from.shift.x) * k;
      screenShift.y = from.shift.y + (to.shift.y - from.shift.y) * k;
      if (u >= 1) { applyFraming(camera, to, screenShift); easing = null; }
      // Guard the terminal frame too, after applying its final target/shift.
      // Interpolation can tighten a corner between two safe endpoints.
      if (followFit) expandForVisiblePose(camera, fitMeshes, screenShift, aspect());
    }
    updateScreenShift(camera, screenShift, aspect());
  });

  engine.runRenderLoop(() => {
    scene.render();
  });
  const resizeObserver = new ResizeObserver(() => {
    engine.resize();
    if (followFit) fitCurrent();
  });
  resizeObserver.observe(canvas);
  scene.onDisposeObservable.add(() => { resizeObserver.disconnect(); palette.dispose(); lighting.dispose(); });
  fitCurrent();

  window.__MT1 = {
    presentation: {
      getState: () => ({ ...presentationState(), intro: intro !== null, viewerId: "QUARTO-VIEWER-01" }),
      setPalette,
      setTourStep,
      fitCamera,
      reverse: reverseAutomatic,
      setPlayback,
      // Same pose a visitor gets from the slider; never certifies.
      setPose: (value: number) => setMachineT(value),
      getLighting: () => lighting.getState(),
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
    // Programmatic posing stays on the certified canonical path.
    setMachineT: (value) => setMachineT(value, true),
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
      setMachineT(machineT, true);
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
