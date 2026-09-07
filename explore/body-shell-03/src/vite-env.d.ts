/// <reference types="vite/client" />

import type { Mt1Hooks } from "./machine/types";

declare global {
  interface Window {
    __MT1?: Mt1Hooks & {
      getBuildInfo: () => Readonly<import("./buildInfo").Mt1BuildInfo>;
      getInspectionState: () => import("./buildInfo").Mt1InspectionState;
      getRenderInventory: () => import("./scene/directorInspection").DirectorRenderRow[];
      presentation: import("./presentation/viewerState").PresentationHooks;
      setBodyConcept?: (on: boolean) => void;
      setBodySection?: (on: boolean) => void;
      getBodyConceptState?: () => {
        enabled: boolean;
        section: boolean;
        meshes: string[];
        sectionMeshes: string[];
        propGhostMeshes: string[];
        masses: string[];
        conceptId: string;
        surfaceRevision: "BODY-SHELL-03.2";
        stationRevision: "MT1-FO1";
      };
      runBodyShellFit?: () => import("./verify/bodyShellFit").BodyShellFitReport;
      runVb1Study?: (opts?: import("./study/vb1/runStudy").Vb1StudyOptions) => Record<string, unknown>;
      runVb1Ar1Study?: (opts?: import("./study/vb1/ar1F5").Ar1Options) => Record<string, unknown>;
      runDp1Study?: (opts?: import("./study/dp1/runStudy").Dp1Options) => Record<string, unknown>;
      runS5Authority?: (opts?: import("./machine/s5Propulsion").S5Override) => import("./verify/s5Clearance").S5Report;
      runS5CamTrack?: () => ReturnType<typeof import("./verify/s5Capture").evalCamTrack>;
      getS5PathCertificate?: () => import("./verify/s5Capture").S5PathCertificate | undefined;
      invalidateS5PathCertificate?: () => void;
      getDriveThrustReady?: () => boolean;
      evaluateS5Handover?: () => import("./verify/s5Capture").S5HandoverState;
      applyMachineRaw?: (machineT: number) => ReturnType<import("./machine/types").MachineRig["applyMachine"]>;
      applyS5Override?: (opts?: import("./machine/s5Propulsion").S5Override) => void;
      getS5Override?: () => import("./machine/s5Propulsion").S5Override;
      probeLockEscape?: (engaged?: boolean) => { blocked: boolean; hits: string[] };
      setPropSection?: (on: boolean) => void;
      setLockStudyView?: (on: boolean) => void;
    };
  }
}

export {};
