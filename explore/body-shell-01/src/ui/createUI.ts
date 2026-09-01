import { frontPhaseLabel } from "../machine/frontTransform";
import { machinePhase } from "../machine/machineMap";
import { phaseLabel } from "../machine/transform";
import { MT1_BUILD_INFO } from "../buildInfo";
import type { DirectorInspectionRow } from "../scene/directorInspection";
import { BODY_CONCEPT_INFO } from "../bodyConceptInfo";

export interface UIActions {
  setMachineT(value: number): void;
  setFrontT(value: number): void;
  setTransform(value: number): void;
  toggleAutomatic(): void;
  setCamera(preset: string): void;
  resetCamera(): void;
  toggleDebug(): boolean;
  toggleSection(): boolean;
  togglePropSection(): boolean;
  toggleInspectPick(): boolean;
  toggleLockFocus(): boolean;
  toggleBodyConcept(): boolean;
}

export interface PresentationUI {
  setMachineT(value: number, automatic: boolean, mode: string): void;
  setFrontT(value: number, automatic: boolean): void;
  setTransform(value: number, automatic: boolean): void;
  setInspectMode(enabled: boolean): void;
  showInspection(row: DirectorInspectionRow | null): void;
}

const MACHINE_PRESETS = [
  { t: 0, label: "0.00" },
  { t: 0.12, label: "0.12" },
  { t: 0.24, label: "0.24" },
  { t: 0.36, label: "0.36" },
  { t: 0.48, label: "0.48" },
  { t: 0.6, label: "0.60" },
  { t: 0.72, label: "0.72" },
  { t: 0.86, label: "0.86" },
  { t: 1, label: "1.00" },
];

export function createUI(root: HTMLElement, actions: UIActions): PresentationUI {
  root.innerHTML = `
    <div class="topbar">
      <div class="identity">
        <div class="eyebrow">${BODY_CONCEPT_INFO.conceptId} / ${BODY_CONCEPT_INFO.status}</div>
        <div class="title">CENTRAL SPINE · OPEN PROPULSION FAIRING · EXPOSED MECHANISM</div>
        <div class="subtitle">VISUAL/COMPOSITIONAL STUDY ONLY · NO NEW AUTHORITY · NO AERO CLAIM</div>
        <div class="provenance">SOURCE ${MT1_BUILD_INFO.candidateId} · ARCHIVE ${MT1_BUILD_INFO.candidateSha256.slice(0, 12)}… · ${BODY_CONCEPT_INFO.scope}</div>
      </div>
      <div class="state-readout">
        <div id="stateName" class="state-name">SPREAD</div>
        <div id="stateValue" class="state-value">MACHINE 0.000 · MODE MACHINE</div>
      </div>
    </div>
    <div class="help">
      ORBIT DRAG · PAN RIGHT-DRAG · WHEEL ZOOM<br>
      SPACE play machineT · R reset · D debug · S section · 1–9 machine poses
    </div>
    <section class="control-deck">
      <div class="slider-row">
        <span class="end-label">SPREAD</span>
        <input id="machineSlider" type="range" min="0" max="1" value="0" step="0.001" />
        <span class="end-label">DRIVE</span>
      </div>
      <div class="slider-row rear-slider">
        <span class="end-label">FRONT*</span>
        <input id="frontSlider" type="range" min="0" max="1" value="0" step="0.001" />
        <span class="end-label">PREVIEW</span>
      </div>
      <div class="slider-row rear-slider">
        <span class="end-label">REAR*</span>
        <input id="slider" type="range" min="0" max="1" value="0" step="0.001" />
        <span class="end-label">PREVIEW</span>
      </div>
      <div class="button-row">
        <div class="presets">
          ${MACHINE_PRESETS.map((p) => `<button data-machine="${p.t}">${p.label}</button>`).join("")}
        </div>
        <div class="actions">
          <button id="autoBtn">PLAY ▶</button>
          <button data-cam="three">3/4</button>
          <button data-cam="top">TOP</button>
          <button data-cam="side">SIDE</button>
          <button data-cam="front">FRONT</button>
          <button data-cam="rear">REAR</button>
          <button data-cam="prop">PROP</button>
          <button data-cam="aftProp">AFT PROP</button>
          <button data-cam="lockPort">LOCK PORT</button>
          <button data-cam="lockStarboard">LOCK STARBOARD</button>
          <button data-cam="lockTopPort">LOCK TOP PORT</button>
          <button data-cam="lockTopStarboard">LOCK TOP STARBOARD</button>
          <button id="resetBtn">RESET</button>
          <button id="debugBtn">DEBUG</button>
          <button id="sectionBtn">SECTION</button>
          <button id="propSectionBtn">PROP SECTION</button>
          <button id="propStowedBtn">PROP STOWED</button>
          <button id="propMidBtn">PROP MID</button>
          <button id="propSeatedBtn">PROP SEATED</button>
          <button id="propReleasedBtn">PROP RELEASED</button>
          <button id="inspectPickBtn">INSPECT PICK</button>
          <button id="lockFocusBtn">LOCK FOCUS</button>
          <button id="bodyConceptBtn" class="active">BODY ON</button>
          <button id="bodySpreadBtn">BODY SPREAD</button>
          <button id="bodyMidBtn">BODY MID</button>
          <button id="bodyDriveBtn">BODY DRIVE</button>
        </div>
      </div>
      <div class="h1-sequence"><b>H1 REVIEW</b> PROP STOWED → PROP MID → MID + PROP SECTION → PROP SEATED → LOCK CLOSE-UPS → RELEASED → MID → STOWED</div>
    </section>
    <aside id="debugPanel" class="debug-panel" hidden></aside>
    <aside id="inspectPanel" class="inspect-panel" hidden></aside>
  `;

  const machineSlider = root.querySelector<HTMLInputElement>("#machineSlider")!;
  const slider = root.querySelector<HTMLInputElement>("#slider")!;
  const frontSlider = root.querySelector<HTMLInputElement>("#frontSlider")!;
  const stateName = root.querySelector<HTMLElement>("#stateName")!;
  const stateValue = root.querySelector<HTMLElement>("#stateValue")!;
  const autoBtn = root.querySelector<HTMLButtonElement>("#autoBtn")!;
  const debugBtn = root.querySelector<HTMLButtonElement>("#debugBtn")!;
  const sectionBtn = root.querySelector<HTMLButtonElement>("#sectionBtn")!;
  const machineButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-machine]")];
  const inspectPickBtn = root.querySelector<HTMLButtonElement>("#inspectPickBtn")!;
  const inspectPanel = root.querySelector<HTMLElement>("#inspectPanel")!;
  const lockFocusBtn = root.querySelector<HTMLButtonElement>("#lockFocusBtn")!;
  const bodyConceptBtn = root.querySelector<HTMLButtonElement>("#bodyConceptBtn")!;

  let machineT = 0;
  let rearT = 0;
  let frontT = 0;

  machineSlider.addEventListener("input", () => actions.setMachineT(Number(machineSlider.value)));
  slider.addEventListener("input", () => actions.setTransform(Number(slider.value)));
  frontSlider.addEventListener("input", () => actions.setFrontT(Number(frontSlider.value)));
  for (const button of machineButtons) {
    button.addEventListener("click", () => actions.setMachineT(Number(button.dataset.machine)));
  }
  autoBtn.addEventListener("click", () => actions.toggleAutomatic());
  root.querySelector<HTMLButtonElement>("#resetBtn")!.addEventListener("click", () => actions.resetCamera());
  debugBtn.addEventListener("click", () => {
    debugBtn.classList.toggle("active", actions.toggleDebug());
  });
  sectionBtn.addEventListener("click", () => {
    sectionBtn.classList.toggle("active", actions.toggleSection());
  });
  const propSectionBtn = root.querySelector<HTMLButtonElement>("#propSectionBtn")!;
  propSectionBtn.addEventListener("click", () => {
    propSectionBtn.classList.toggle("active", actions.togglePropSection());
  });
  root.querySelector<HTMLButtonElement>("#propStowedBtn")!.addEventListener("click", () => {
    actions.setMachineT(0.86);
    actions.setCamera("propStowed");
  });
  root.querySelector<HTMLButtonElement>("#propMidBtn")!.addEventListener("click", () => {
    actions.setMachineT(0.94);
    actions.setCamera("propMid");
  });
  root.querySelector<HTMLButtonElement>("#propSeatedBtn")!.addEventListener("click", () => {
    actions.setMachineT(1);
    actions.setCamera("propSeated");
  });
  root.querySelector<HTMLButtonElement>("#propReleasedBtn")!.addEventListener("click", () => {
    actions.setMachineT(0.998);
    actions.setCamera("propReleased");
  });
  inspectPickBtn.addEventListener("click", () => {
    const enabled = actions.toggleInspectPick();
    inspectPickBtn.classList.toggle("active", enabled);
    inspectPanel.hidden = !enabled;
    if (enabled && !inspectPanel.dataset.hasSelection) {
      inspectPanel.innerHTML = `<div class="inspect-head">DIRECTOR INSPECT</div><div class="inspect-purpose">Click a visible part to identify it. This view is read-only.</div>`;
    }
  });
  lockFocusBtn.addEventListener("click", () => {
    lockFocusBtn.classList.toggle("active", actions.toggleLockFocus());
  });
  bodyConceptBtn.addEventListener("click", () => {
    const enabled = actions.toggleBodyConcept();
    bodyConceptBtn.classList.toggle("active", enabled);
    bodyConceptBtn.textContent = enabled ? "BODY ON" : "BODY OFF";
  });
  root.querySelector<HTMLButtonElement>("#bodySpreadBtn")!.addEventListener("click", () => {
    actions.setMachineT(0);
    actions.setCamera("three");
  });
  root.querySelector<HTMLButtonElement>("#bodyMidBtn")!.addEventListener("click", () => {
    actions.setMachineT(0.6);
    actions.setCamera("three");
  });
  root.querySelector<HTMLButtonElement>("#bodyDriveBtn")!.addEventListener("click", () => {
    actions.setMachineT(1);
    actions.setCamera("three");
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-cam]")) {
    button.addEventListener("click", () => actions.setCamera(button.dataset.cam ?? "three"));
  }

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === "Space") {
      event.preventDefault();
      actions.toggleAutomatic();
    }
    if (event.key.toLowerCase() === "r") actions.resetCamera();
    if (event.key.toLowerCase() === "d") debugBtn.click();
    if (event.key.toLowerCase() === "s") sectionBtn.click();
    const idx = Number(event.key) - 1;
    if (idx >= 0 && idx < MACHINE_PRESETS.length) actions.setMachineT(MACHINE_PRESETS[idx].t);
  });

  return {
    setMachineT(value: number, automatic: boolean, nextMode: string) {
      machineT = value;
      machineSlider.value = value.toFixed(3);
      const preview = nextMode !== "MACHINE";
      stateName.textContent = preview ? `PREVIEW ${nextMode}` : machinePhase(value);
      stateValue.textContent = `MACHINE ${machineT.toFixed(3)} · MODE ${nextMode}`;
      autoBtn.textContent = automatic ? "PAUSE ■" : value >= 0.5 ? "REVERSE ◀" : "PLAY ▶";
      for (const button of machineButtons) {
        button.classList.toggle("active", Math.abs(Number(button.dataset.machine) - value) < 0.005);
      }
    },
    setFrontT(value: number) {
      frontT = value;
      frontSlider.value = value.toFixed(3);
      void frontPhaseLabel;
    },
    setTransform(value: number) {
      rearT = value;
      slider.value = value.toFixed(3);
      void phaseLabel;
      void rearT;
      void frontT;
    },
    setInspectMode(enabled: boolean) {
      inspectPickBtn.classList.toggle("active", enabled);
      inspectPanel.hidden = !enabled;
    },
    showInspection(row: DirectorInspectionRow | null) {
      if (!row) {
        delete inspectPanel.dataset.hasSelection;
        inspectPanel.innerHTML = `<div class="inspect-head">DIRECTOR INSPECT</div><div class="inspect-purpose">No visible mesh selected.</div>`;
        return;
      }
      inspectPanel.dataset.hasSelection = "true";
      const fields: Array<[string, string]> = [
        ["MESH", row.displayName],
        ["SEMANTIC", row.semanticName],
        ["FAMILY", row.family || "—"],
        ["ROLE", row.role],
        ["CLASS", row.objectClass],
        ["REG ID", row.registrationId ?? "—"],
        ["STAGE", row.authorityStage ?? "—"],
        ["PARENT", row.parent ?? "—"],
        ["ENABLED", row.enabled ? "YES" : "NO"],
      ];
      inspectPanel.innerHTML = `<div class="inspect-head">DIRECTOR INSPECT</div>${fields
        .map(([key, value]) => `<div class="inspect-row"><span>${key}</span><b>${escapeHtml(value)}</b></div>`)
        .join("")}<div class="inspect-purpose">${escapeHtml(row.purpose)}</div>`;
    },
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function debugPanel(): HTMLElement {
  return document.querySelector("#debugPanel")!;
}
