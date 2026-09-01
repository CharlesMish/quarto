import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { P, bookThickness, flBookThickness, flSocketStroke, socketStroke } from "../design/parameters";
import type { DebugDatum, FrontStages, Stages } from "../machine/types";
import { frontPhaseLabel } from "../machine/frontTransform";
import { machinePhase } from "../machine/machineMap";
import { phaseLabel } from "../machine/transform";
import type { DriveReadiness } from "../verify/capturePredicates";
import { MT1_BUILD_INFO } from "../buildInfo";

export interface DebugView {
  setEnabled(on: boolean): void;
  setSection(on: boolean): void;
  isEnabled(): boolean;
  update(
    frontT: number,
    frontStages: FrontStages,
    rearT?: number,
    rearStages?: Stages,
    machine?: {
      machineT: number;
      driveT: number;
      requestedDriveT?: number;
      appliedDriveT?: number;
      frontStbdT?: number;
      rearStbdT?: number;
      mode: string;
      ready: DriveReadiness;
      driveThrustReady?: boolean;
      s5?: {
        insertion: number;
        radialClearance: number;
        registerSeated: boolean;
        dogs: Array<{ id: string; captured: boolean }>;
        seatGraph: { pass: boolean };
        coreGraph: { pass: boolean };
      };
    },
  ): void;
}

export function createDebugView(
  scene: Scene,
  panel: HTMLElement,
  datums: DebugDatum[],
  keepoutNodes: { setEnabled(v: boolean): void }[],
  emptyNodes: { setEnabled(v: boolean): void }[],
): DebugView {
  const visuals: Mesh[] = [];
  for (const d of datums) {
    if (d.kind === "keep" || d.kind === "volume") continue;
    visuals.push(...attachAxes(scene, d.node, d.kind));
  }
  for (const mesh of visuals) mesh.setEnabled(false);
  for (const n of keepoutNodes) n.setEnabled(false);
  for (const n of emptyNodes) n.setEnabled(false);

  let enabled = false;
  let section = false;

  const applyVis = (): void => {
    for (const mesh of visuals) mesh.setEnabled(enabled);
    for (const n of keepoutNodes) n.setEnabled(enabled);
    for (const n of emptyNodes) n.setEnabled(enabled || section);
    panel.hidden = !enabled;
  };

  return {
    setEnabled(on: boolean) {
      enabled = on;
      applyVis();
    },
    setSection(on: boolean) {
      section = on;
      applyVis();
    },
    isEnabled() {
      return enabled;
    },
    update(frontT: number, frontStages: FrontStages, rearT = 0, rearStages?: Stages, machine?) {
      if (!enabled) return;
      const rows = [
        ["machineT", machine ? machine.machineT.toFixed(3) : "—"],
        ["mode", machine?.mode ?? "—"],
        ["phase", machine ? machinePhase(machine.machineT) : "—"],
        ["frontPortT", frontT.toFixed(3)],
        ["frontStbdT", machine ? (machine.frontStbdT ?? frontT).toFixed(3) : "—"],
        ["rearPortT", rearT.toFixed(3)],
        ["rearStbdT", machine ? (machine.rearStbdT ?? rearT).toFixed(3) : "—"],
        ["requestedDriveT", machine ? (machine.requestedDriveT ?? machine.driveT).toFixed(3) : "—"],
        ["appliedDriveT", machine ? (machine.appliedDriveT ?? machine.driveT).toFixed(3) : "—"],
        ["driveReady", machine ? String(machine.ready.driveStructuralReady) : "—"],
        ["driveThrustReady", machine ? String(machine.driveThrustReady ?? false) : "—"],
        ["s5.insertion", machine?.s5 ? machine.s5.insertion.toFixed(3) : "—"],
        ["s5.radial", machine?.s5 ? machine.s5.radialClearance.toFixed(3) : "—"],
        ["s5.register", machine?.s5 ? String(machine.s5.registerSeated) : "—"],
        ["s5.dogP", machine?.s5 ? String(machine.s5.dogs.find((d) => d.id === "PORT")?.captured) : "—"],
        ["s5.dogS", machine?.s5 ? String(machine.s5.dogs.find((d) => d.id === "STARBOARD")?.captured) : "—"],
        ["s5.dogTP", machine?.s5 ? String(machine.s5.dogs.find((d) => d.id === "TOP_PORT")?.captured) : "—"],
        ["s5.dogTS", machine?.s5 ? String(machine.s5.dogs.find((d) => d.id === "TOP_STARBOARD")?.captured) : "—"],
        ["s5.seatGraph", machine?.s5 ? String(machine.s5.seatGraph.pass) : "—"],
        ["s5.coreGraph", machine?.s5 ? String(machine.s5.coreGraph.pass) : "—"],
        ["waistActive", machine ? String(machine.ready.driveStructuralReady) : "—"],
        ["pFrontBook", machine ? String(machine.ready.frontBookReady) : "—"],
        ["pFrontNest", machine ? String(machine.ready.frontNestReady) : "—"],
        ["pFrontCatch", machine ? String(machine.ready.frontPassivePickupReady) : "—"],
        ["pRearLatch", machine ? String(machine.ready.rearBookReady) : "—"],
        ["pRearNest", machine ? String(machine.ready.rearNestReady) : "—"],
        ["sFrontBook", machine ? String(machine.ready.frontStbdBookReady) : "—"],
        ["sFrontNest", machine ? String(machine.ready.frontStbdNestReady) : "—"],
        ["sFrontCatch", machine ? String(machine.ready.frontStbdPassivePickupReady) : "—"],
        ["sRearLatch", machine ? String(machine.ready.rearStbdBookReady) : "—"],
        ["sRearNest", machine ? String(machine.ready.rearStbdNestReady) : "—"],
        ["frontT", frontT.toFixed(3)],
        ["frontPhase", frontPhaseLabel(frontT)],
        ["rearT", rearT.toFixed(3)],
        ["rearPhase", phaseLabel(rearT)],
        ["frontCant", String(P.fl.cantDeg)],
        ["frontBookThk", flBookThickness().toFixed(3)],
        ["frontStroke", flSocketStroke().toFixed(3)],
        ["rearHaunch", String(P.haunchDeg)],
        ["rearBookThk", bookThickness().toFixed(3)],
        ["rearStroke", socketStroke().toFixed(3)],
        ...Object.entries(frontStages).map(([k, v]) => [`fl.${k}`, v.toFixed(3)] as const),
        ...(rearStages ? Object.entries(rearStages).map(([k, v]) => [`rl.${k}`, v.toFixed(3)] as const) : []),
        ...datums.map((d) => {
          const p = d.node.getAbsolutePosition();
          return [d.name, `${d.kind}  ${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.z.toFixed(2)}`] as const;
        }),
      ];
      panel.innerHTML = `<div class="debug-head">${MT1_BUILD_INFO.candidateId} DEBUG</div>${rows
        .map(([k, v]) => `<div class="debug-item"><span>${k}</span><span>${v}</span></div>`)
        .join("")}<div class="debug-note">Red = protected corridor. Amber = empty occupancy. Carry is ochre. RGB axes at datums.</div>`;
    },
  };
}

function attachAxes(scene: Scene, parent: DebugDatum["node"], kind: DebugDatum["kind"]): Mesh[] {
  const scale = kind === "rail" ? 0.55 : 0.32;
  const x = bar(scene, `${parent.name}_ax`, parent, new Color3(0.85, 0.2, 0.15), [scale, 0.012, 0.012], [scale * 0.5, 0, 0]);
  const y = bar(scene, `${parent.name}_ay`, parent, new Color3(0.25, 0.75, 0.28), [0.012, scale, 0.012], [0, scale * 0.5, 0]);
  const z = bar(scene, `${parent.name}_az`, parent, new Color3(0.2, 0.45, 0.95), [0.012, 0.012, scale], [0, 0, scale * 0.5]);
  const hub = MeshBuilder.CreateSphere(`${parent.name}_hub`, { diameter: 0.07, segments: 6 }, scene);
  hub.parent = parent;
  const hubMat = new StandardMaterial(`${parent.name}_hubMat`, scene);
  hubMat.emissiveColor = kind === "pivot" ? new Color3(0.9, 0.75, 0.2) : new Color3(0.7, 0.7, 0.7);
  hubMat.disableLighting = true;
  hub.material = hubMat;
  hub.isPickable = false;
  return [x, y, z, hub];
}

function bar(
  scene: Scene,
  name: string,
  parent: DebugDatum["node"],
  color: Color3,
  size: [number, number, number],
  position: [number, number, number],
): Mesh {
  const mesh = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
  mesh.parent = parent;
  mesh.position.set(...position);
  const m = new StandardMaterial(`${name}_mat`, scene);
  m.emissiveColor = color;
  m.disableLighting = true;
  mesh.material = m;
  mesh.isPickable = false;
  return mesh;
}
