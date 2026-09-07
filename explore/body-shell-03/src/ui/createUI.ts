import { machinePhase } from "../machine/machineMap";
import { MT1_BUILD_INFO } from "../buildInfo";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";
import { TOUR_STOPS } from "../presentation/viewerState";
import type { DirectorInspectionRow } from "../scene/directorInspection";

export interface UIActions {
  setMachineT(value: number): void;
  setFrontT(value: number): void;
  setTransform(value: number): void;
  toggleAutomatic(): void;
  reverseAutomatic(): void;
  setCamera(preset: string): void;
  resetCamera(): void;
  fitCamera(): void;
  setPalette(value: "hush-basin" | "accepted"): void;
  setTourStep(value: number | null): void;
  toggleDebug(): boolean;
  toggleSection(): boolean;
  togglePropSection(): boolean;
  toggleInspectPick(): boolean;
  toggleLockFocus(): boolean;
  toggleBodyConcept(): boolean;
  toggleBodySection(): boolean;
}

export interface PresentationUI {
  setMachineT(value: number, automatic: boolean, mode: string): void;
  setFrontT(value: number, automatic: boolean): void;
  setTransform(value: number, automatic: boolean): void;
  setInspectMode(enabled: boolean): void;
  showInspection(row: DirectorInspectionRow | null): void;
  setPresentation(state: {
    palette: "hush-basin" | "accepted";
    tourStep: number | null;
    automatic: boolean;
    direction: number;
  }): void;
  setViewState(state: {
    debug: boolean;
    body: boolean;
    bodySection: boolean;
    section: boolean;
    propSection: boolean;
    lockFocus: boolean;
  }): void;
  cancelPendingInput(): void;
}

const MACHINE_PRESETS = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86, 1];
const GROUPS = [
  ["cameras", "Cameras"],
  ["inspection", "Inspection"],
  ["diagnostics", "Diagnostics"],
  ["folios", "Folio previews"],
  ["details", "Details & help"],
] as const;

export function createUI(root: HTMLElement, actions: UIActions): PresentationUI {
  root.innerHTML = `
    <header class="topbar">
      <div class="identity"><div class="title">QUARTO</div><div class="subtitle">Four folios · one inspectable transformation</div></div>
      <div class="state-readout"><div id="stateName" class="state-name">SPREAD</div><div id="stateValue" class="state-value">MACHINE 0.000 · MODE MACHINE</div></div>
    </header>
    <section class="control-deck" aria-label="Transformation controls">
      <div class="slider-row machine-slider">
        <span class="end-label">SPREAD</span>
        <label class="sr-only" for="machineSlider">Machine transformation</label>
        <input id="machineSlider" type="range" min="0" max="1" value="0" step="0.001" />
        <span class="end-label">DRIVE</span>
      </div>
      <div class="primary-actions">
        <button id="autoBtn">PLAY ▶</button><button id="reverseBtn" title="Reverse transformation direction">REVERSE ↶</button>
        <button id="bodyConceptBtn" class="active" aria-pressed="true">BODY ON</button>
        <label class="palette-control" for="paletteSelect"><span class="sr-only">Color palette</span><select id="paletteSelect"><option value="hush-basin">Hush Basin</option><option value="accepted">Accepted palette</option></select></label>
        <button id="fitBtn">FIT</button><button id="tourBtn" aria-expanded="false" aria-controls="tourCard">TAKE A TOUR</button>
      </div>
      <nav class="group-tabs" aria-label="Viewer tools">${GROUPS.map(([id, label]) => `<button data-panel="${id}" aria-expanded="false" aria-controls="${id}Panel">${label}</button>`).join("")}</nav>
    </section>
    <div class="tool-panels">
      ${GROUPS.map(([id, label]) => `<section id="${id}Panel" class="tool-panel" aria-label="${label}" hidden><div class="panel-heading"><h2>${label}</h2><button data-close-panel aria-label="Close ${label.toLowerCase()}">✕</button></div><div class="panel-content">${panelContents(id)}</div></section>`).join("")}
    </div>
    <section id="tourCard" class="tour-card" aria-label="Quarto mechanism tour" hidden>
      <div class="panel-heading"><span id="tourProgress" class="card-kicker"></span><button id="tourCloseBtn" aria-label="Close tour">✕</button></div>
      <h2 id="tourTitle"></h2><p id="tourDescription"></p>
      <div class="tour-navigation"><button id="tourPrevBtn">← PREVIOUS</button><button id="tourDetailsBtn" aria-expanded="false" aria-controls="tourDescription">DETAILS</button><button id="tourNextBtn">NEXT →</button></div>
    </section>
    <section id="debugCard" class="reading-card debug-card" aria-label="Diagnostics" hidden>
      <div class="panel-heading"><h2>Diagnostics</h2><button id="debugCloseBtn" aria-label="Close diagnostics">✕</button></div>
      <aside id="debugPanel" class="debug-panel" hidden></aside>
    </section>
    <section id="inspectCard" class="reading-card inspect-card" aria-label="Selected part" hidden>
      <div class="panel-heading"><h2>Selected part</h2><button id="inspectCloseBtn" aria-label="Close part inspection">✕</button></div>
      <aside id="inspectPanel" class="inspect-panel" hidden></aside>
    </section>
  `;

  function panelContents(id: typeof GROUPS[number][0]): string {
    if (id === "cameras") return `<div class="button-grid">${[
      ["three", "3/4"], ["body", "BODY 3/4"], ["driveBody", "DRIVE 3/4"], ["top", "TOP"], ["side", "SIDE"], ["front", "FRONT"], ["rear", "REAR"], ["prop", "PROP"], ["aftProp", "AFT PROP"],
      ["lockPort", "LOCK PORT"], ["lockStarboard", "LOCK STARBOARD"], ["lockTopPort", "LOCK TOP PORT"], ["lockTopStarboard", "LOCK TOP STARBOARD"],
    ].map(([camera, label]) => `<button data-cam="${camera}">${label}</button>`).join("")}<button id="resetBtn">RESET</button></div>`;
    if (id === "inspection") return `<p class="panel-note">Expose the mechanism or follow the stern handover at a chosen pose.</p>
      <div class="button-grid"><button id="bodySectionBtn" aria-pressed="false">BODY SECTION</button><button id="sectionBtn" aria-pressed="false">SECTION</button><button id="propSectionBtn" aria-pressed="false">PROP SECTION</button><button id="inspectPickBtn" aria-pressed="false">INSPECT PICK</button><button id="lockFocusBtn" aria-pressed="false">LOCK FOCUS</button></div>
      <h3>Body poses</h3><div class="button-grid"><button id="bodySpreadBtn">BODY SPREAD</button><button id="bodyMidBtn">BODY MID</button><button id="bodyDriveBtn">BODY DRIVE</button></div>
      <h3>Handover poses</h3><div class="button-grid"><button id="propStowedBtn">PROP STOWED</button><button id="propMidBtn">PROP MID</button><button id="propSeatedBtn">PROP SEATED</button><button id="propReleasedBtn">PROP RELEASED</button></div>
      <h3>Machine inspection poses · keys 1–9</h3><div class="presets">${MACHINE_PRESETS.map(t => `<button data-machine="${t}">${t.toFixed(2)}</button>`).join("")}</div>`;
    if (id === "diagnostics") return `<p class="panel-note">Show readiness, local stages and datum axes for the current pose.</p><button id="debugBtn" aria-pressed="false">DEBUG</button>`;
    if (id === "folios") return `<p class="panel-note">Individual folio (legacy/source: book) controls are <strong>noncanonical previews</strong>. Move the machine slider to return to the complete transformation.</p>
      <label class="preview-label" for="frontSlider">Front folios · preview</label><input id="frontSlider" type="range" min="0" max="1" value="0" step="0.001" />
      <label class="preview-label" for="slider">Rear folios · preview</label><input id="slider" type="range" min="0" max="1" value="0" step="0.001" />`;
    return `<p class="panel-note">Orbit by dragging, pan with a right-drag and zoom with the wheel. Use FIT to frame the whole machine. Playback takes 12 seconds between endpoints.</p>
      <p class="help">SPACE play/pause · R reset camera · D debug · S section · B body · 1–9 machine poses · ESC close a panel</p>
      <h3>Presentation and provenance</h3><p>BODY ON combines the solid ${BODY_CONCEPT_INFO.surfaceRevision} surfaces with ${BODY_CONCEPT_INFO.stationRevision} receiving shoulders. BODY SECTION opens one side; PROP SECTION ghosts the aft shell for inspection. BODY OFF exposes the frozen inspectable mechanism. Both color palettes use the same repaired shell.</p>
      <p class="eyebrow">${BODY_CONCEPT_INFO.conceptId} / ${BODY_CONCEPT_INFO.status}</p><p class="provenance">SOURCE ${MT1_BUILD_INFO.candidateId} · ARCHIVE ${MT1_BUILD_INFO.candidateSha256.slice(0, 12)}… · ${BODY_CONCEPT_INFO.scope}</p>
      <p class="panel-note">H1 remains awaiting director disposition. Hush Basin is the Godot gameplay realization, with its own simplified native vehicle.</p>`;
  }

  const element = <T extends HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;
  const machineSlider = element<HTMLInputElement>("#machineSlider");
  const frontSlider = element<HTMLInputElement>("#frontSlider");
  const rearSlider = element<HTMLInputElement>("#slider");
  const stateName = element("#stateName");
  const stateValue = element("#stateValue");
  const autoBtn = element<HTMLButtonElement>("#autoBtn");
  const reverseBtn = element<HTMLButtonElement>("#reverseBtn");
  const debugBtn = element<HTMLButtonElement>("#debugBtn");
  const inspectPickBtn = element<HTMLButtonElement>("#inspectPickBtn");
  const inspectPanel = element("#inspectPanel");
  const inspectCard = element("#inspectCard");
  const debugCard = element("#debugCard");
  const bodyConceptBtn = element<HTMLButtonElement>("#bodyConceptBtn");
  const paletteSelect = element<HTMLSelectElement>("#paletteSelect");
  const tourCard = element("#tourCard");
  const tourBtn = element<HTMLButtonElement>("#tourBtn");
  const tourPrevBtn = element<HTMLButtonElement>("#tourPrevBtn");
  const tourNextBtn = element<HTMLButtonElement>("#tourNextBtn");
  const tourDetailsBtn = element<HTMLButtonElement>("#tourDetailsBtn");
  const machineButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-machine]")];
  let tourStep: number | null = null;
  let openPanel: string | null = null;
  let pending: { slider: HTMLInputElement; value: number; apply: (value: number) => void } | null = null;
  let inputFrame = 0;
  const appliedValues = new Map([[machineSlider, 0], [frontSlider, 0], [rearSlider, 0]]);

  const setText = (target: HTMLElement, value: string): void => {
    if (target.textContent !== value) target.textContent = value;
  };
  const setPressed = (button: HTMLButtonElement, enabled: boolean): void => {
    if (button.classList.contains("active") !== enabled) button.classList.toggle("active", enabled);
    if (button.getAttribute("aria-pressed") !== String(enabled)) button.setAttribute("aria-pressed", String(enabled));
  };
  const cancelPendingInput = (): void => {
    if (inputFrame) cancelAnimationFrame(inputFrame);
    inputFrame = 0;
    if (pending) pending.slider.value = (appliedValues.get(pending.slider) ?? 0).toFixed(3);
    pending = null;
  };
  const flushInput = (): void => {
    const next = pending;
    pending = null;
    if (inputFrame) cancelAnimationFrame(inputFrame);
    inputFrame = 0;
    next?.apply(next.value);
  };
  for (const [slider, apply] of [
    [machineSlider, actions.setMachineT], [frontSlider, actions.setFrontT], [rearSlider, actions.setTransform],
  ] as const) {
    slider.addEventListener("input", () => {
      if (pending && pending.slider !== slider) pending.slider.value = (appliedValues.get(pending.slider) ?? 0).toFixed(3);
      pending = { slider, value: Number(slider.value), apply };
      if (!inputFrame) inputFrame = requestAnimationFrame(flushInput);
    });
    for (const event of ["change", "pointerup", "blur"]) slider.addEventListener(event, flushInput);
  }
  // A command always wins over a queued slider event, including disclosure controls.
  root.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("button")) cancelPendingInput();
  }, true);
  // Cancel before a pointer command moves focus and dispatches the slider's blur.
  root.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("button, select")) cancelPendingInput();
  }, true);
  const click = (selector: string, callback: () => void): void => element(selector).addEventListener("click", callback);
  const setOpenPanel = (id: string | null, restoreFocus = false): void => {
    const previous = openPanel;
    openPanel = id;
    for (const [key] of GROUPS) {
      element(`#${key}Panel`).hidden = key !== id;
      element(`[data-panel="${key}"]`).setAttribute("aria-expanded", String(key === id));
    }
    if (restoreFocus && previous) element(`[data-panel="${previous}"]`).focus();
  };
  for (const [id] of GROUPS) click(`[data-panel="${id}"]`, () => setOpenPanel(openPanel === id ? null : id));
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-close-panel]")) button.addEventListener("click", () => setOpenPanel(null, true));
  const setDebug = (enabled: boolean): void => {
    setPressed(debugBtn, enabled);
    if (debugCard.hidden === enabled) debugCard.hidden = !enabled;
  };
  const setInspectMode = (enabled: boolean): void => {
    setPressed(inspectPickBtn, enabled);
    inspectCard.hidden = !enabled;
    inspectPanel.hidden = !enabled;
  };
  const closeInspect = (): void => {
    if (!inspectCard.hidden) { actions.toggleInspectPick(); setInspectMode(false); }
  };
  const closeDebug = (): void => {
    if (!debugCard.hidden) setDebug(actions.toggleDebug());
  };
  click("#autoBtn", () => actions.toggleAutomatic());
  click("#reverseBtn", () => actions.reverseAutomatic());
  click("#fitBtn", () => actions.fitCamera());
  click("#resetBtn", () => actions.resetCamera());
  paletteSelect.addEventListener("change", () => {
    cancelPendingInput();
    actions.setPalette(paletteSelect.value as "hush-basin" | "accepted");
  });
  click("#debugBtn", () => {
    closeInspect();
    setDebug(actions.toggleDebug());
    setOpenPanel(null);
  });
  click("#debugCloseBtn", closeDebug);
  click("#inspectCloseBtn", closeInspect);
  click("#inspectPickBtn", () => {
    closeDebug();
    const enabled = actions.toggleInspectPick();
    setInspectMode(enabled);
    setOpenPanel(null);
    if (enabled && !inspectPanel.dataset.hasSelection) inspectPanel.innerHTML = `<div class="inspect-purpose">Click a visible part to identify it. This view is read-only.</div>`;
  });
  for (const [selector, action] of [
    ["#sectionBtn", actions.toggleSection], ["#propSectionBtn", actions.togglePropSection],
    ["#lockFocusBtn", actions.toggleLockFocus], ["#bodySectionBtn", actions.toggleBodySection],
  ] as const) click(selector, () => setPressed(element<HTMLButtonElement>(selector), action()));
  click("#bodyConceptBtn", () => {
    const enabled = actions.toggleBodyConcept();
    setPressed(bodyConceptBtn, enabled);
    bodyConceptBtn.textContent = enabled ? "BODY ON" : "BODY OFF";
  });
  for (const [selector, t, camera] of [
    ["#bodySpreadBtn", 0, "body"], ["#bodyMidBtn", 0.6, "body"], ["#bodyDriveBtn", 1, "driveBody"],
    ["#propStowedBtn", 0.86, "propStowed"], ["#propMidBtn", 0.94, "propMid"], ["#propSeatedBtn", 1, "propSeated"], ["#propReleasedBtn", 0.998, "propReleased"],
  ] as const) click(selector, () => { actions.setMachineT(t); actions.setCamera(camera); });
  for (const button of machineButtons) button.addEventListener("click", () => actions.setMachineT(Number(button.dataset.machine)));
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-cam]")) button.addEventListener("click", () => actions.setCamera(button.dataset.cam ?? "three"));
  click("#tourBtn", () => { setOpenPanel(null); actions.setTourStep(tourStep === null ? 0 : null); });
  click("#tourCloseBtn", () => { actions.setTourStep(null); tourBtn.focus(); });
  click("#tourPrevBtn", () => { if (tourStep !== null && tourStep > 0) actions.setTourStep(tourStep - 1); });
  click("#tourNextBtn", () => { if (tourStep !== null && tourStep < TOUR_STOPS.length - 1) actions.setTourStep(tourStep + 1); });
  click("#tourDetailsBtn", () => {
    const expanded = tourCard.classList.toggle("description-open");
    tourDetailsBtn.setAttribute("aria-expanded", String(expanded));
    setText(tourDetailsBtn, expanded ? "LESS" : "DETAILS");
    measureLayout();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cancelPendingInput();
      if (openPanel) setOpenPanel(null, true);
      else if (!inspectCard.hidden) { closeInspect(); element('[data-panel="inspection"]').focus(); }
      else if (!debugCard.hidden) { closeDebug(); element('[data-panel="diagnostics"]').focus(); }
      else if (tourStep !== null) { actions.setTourStep(null); tourBtn.focus(); }
      else return;
      event.preventDefault();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target instanceof Element && event.target.closest('input, select, textarea, button, [contenteditable]:not([contenteditable="false"])')) return;
    const key = event.key.toLowerCase();
    const index = Number(event.key) - 1;
    if (event.code === "Space") { event.preventDefault(); cancelPendingInput(); actions.toggleAutomatic(); }
    else if (key === "r") { cancelPendingInput(); actions.resetCamera(); }
    else if (key === "d") debugBtn.click();
    else if (key === "s") element<HTMLButtonElement>("#sectionBtn").click();
    else if (key === "b") bodyConceptBtn.click();
    else if (index >= 0 && index < MACHINE_PRESETS.length) { cancelPendingInput(); actions.setMachineT(MACHINE_PRESETS[index]); }
  });

  // Reserve actual canvas space instead of covering the machine with the deck.
  const measureLayout = (): void => {
    const header = element(".topbar").getBoundingClientRect();
    const deck = element(".control-deck").getBoundingClientRect();
    const headerBottom = Math.ceil(header.bottom + 8);
    document.documentElement.style.setProperty("--viewer-header-bottom", `${headerBottom}px`);
    const tourBottom = window.matchMedia("(max-width: 800px)").matches && !tourCard.hidden
      ? Math.ceil(tourCard.getBoundingClientRect().bottom + 8) : headerBottom;
    document.documentElement.style.setProperty("--viewer-top", `${tourBottom}px`);
    document.documentElement.style.setProperty("--viewer-bottom", `${Math.ceil(window.innerHeight - deck.top + 8)}px`);
  };
  const layoutObserver = new ResizeObserver(measureLayout);
  layoutObserver.observe(element(".topbar"));
  layoutObserver.observe(element(".control-deck"));
  layoutObserver.observe(tourCard);
  window.addEventListener("resize", measureLayout);
  measureLayout();
  const setSlider = (slider: HTMLInputElement, value: number): void => {
    appliedValues.set(slider, value);
    const display = value.toFixed(3);
    if (pending?.slider !== slider && slider.value !== display) slider.value = display;
  };

  return {
    cancelPendingInput,
    setMachineT(value, automatic, nextMode) {
      setSlider(machineSlider, value);
      const preview = nextMode !== "MACHINE";
      setText(stateName, preview ? `PREVIEW ${nextMode}` : machinePhase(value));
      if (stateName.classList.contains("preview-state") !== preview) stateName.classList.toggle("preview-state", preview);
      setText(stateValue, `MACHINE ${value.toFixed(3)} · MODE ${nextMode}`);
      setText(autoBtn, automatic ? "PAUSE ■" : "PLAY ▶");
      for (const button of machineButtons) setPressed(button, Math.abs(Number(button.dataset.machine) - value) < 0.005);
    },
    setFrontT(value) { setSlider(frontSlider, value); },
    setTransform(value) { setSlider(rearSlider, value); },
    setInspectMode,
    setViewState(state) {
      setDebug(state.debug);
      setPressed(bodyConceptBtn, state.body);
      setText(bodyConceptBtn, state.body ? "BODY ON" : "BODY OFF");
      for (const [selector, enabled] of [
        ["#bodySectionBtn", state.bodySection], ["#sectionBtn", state.section],
        ["#propSectionBtn", state.propSection], ["#lockFocusBtn", state.lockFocus],
      ] as const) setPressed(element<HTMLButtonElement>(selector), enabled);
    },
    setPresentation(state) {
      if (paletteSelect.value !== state.palette) paletteSelect.value = state.palette;
      setText(autoBtn, state.automatic ? "PAUSE ■" : "PLAY ▶");
      setPressed(reverseBtn, state.direction < 0);
      const directionTitle = state.direction < 0 ? "Direction: toward SPREAD; reverse toward DRIVE" : "Direction: toward DRIVE; reverse toward SPREAD";
      if (reverseBtn.title !== directionTitle) reverseBtn.title = directionTitle;
      if (tourStep === state.tourStep) return;
      tourStep = state.tourStep;
      tourCard.hidden = tourStep === null;
      tourBtn.setAttribute("aria-expanded", String(tourStep !== null));
      if (tourStep !== null) {
        const stop = TOUR_STOPS[tourStep];
        element("#tourProgress").textContent = `${tourStep + 1} / ${TOUR_STOPS.length} · MECHANISM TOUR`;
        element("#tourTitle").textContent = stop.title;
        element("#tourDescription").textContent = stop.description;
        tourPrevBtn.disabled = tourStep === 0;
        tourNextBtn.disabled = tourStep === TOUR_STOPS.length - 1;
      } else {
        tourCard.classList.remove("description-open");
        tourDetailsBtn.setAttribute("aria-expanded", "false");
        setText(tourDetailsBtn, "DETAILS");
      }
      measureLayout();
    },
    showInspection(row: DirectorInspectionRow | null) {
      if (!row) {
        delete inspectPanel.dataset.hasSelection;
        inspectPanel.innerHTML = `<div class="inspect-purpose">No visible mesh selected.</div>`;
        return;
      }
      inspectPanel.dataset.hasSelection = "true";
      const fields: Array<[string, string]> = [
        ["MESH", row.displayName], ["SEMANTIC", row.semanticName], ["FAMILY", row.family || "—"], ["ROLE", row.role], ["CLASS", row.objectClass], ["REG ID", row.registrationId ?? "—"], ["STAGE", row.authorityStage ?? "—"], ["PARENT", row.parent ?? "—"], ["ENABLED", row.enabled ? "YES" : "NO"],
      ];
      inspectPanel.innerHTML = `${fields.map(([key, value]) => `<div class="inspect-row"><span>${key}</span><b>${escapeHtml(value)}</b></div>`).join("")}<div class="inspect-purpose">${escapeHtml(row.purpose)}</div>`;
    },
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function debugPanel(): HTMLElement {
  return document.querySelector("#debugPanel")!;
}
