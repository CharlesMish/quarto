import { clamp01 } from "../math/stage";

export type AuthorityMode =
  | "MACHINE"
  | "FRONT_PREVIEW"
  | "REAR_PREVIEW"
  | "DRIVE_PREVIEW"
  | "CANT_PREVIEW"
  | "HAUNCH_PREVIEW"
  | "FRONT_STBD_PREVIEW"
  | "REAR_STBD_PREVIEW";

export function isPreviewMode(mode: AuthorityMode): boolean {
  return mode !== "MACHINE";
}

/** Production drive gate: requested drive is applied only when captures are valid. */
export function gateAppliedDrive(requestedDriveT: number, driveStructuralReady: boolean): number {
  if (!driveStructuralReady) return 0;
  return Math.min(1, Math.max(0, requestedDriveT));
}

/** Published machineT windows. Local stage tables are unchanged. */
export const MACHINE_MAP = {
  front: [
    { m0: 0, m1: 0.04, t0: 0, t1: 0 },
    { m0: 0.04, m1: 0.26, t0: 0, t1: 0.28 },
    { m0: 0.26, m1: 0.58, t0: 0.28, t1: 0.7 },
    { m0: 0.58, m1: 0.8, t0: 0.7, t1: 1 },
    { m0: 0.8, m1: 1, t0: 1, t1: 1 },
  ],
  /** Rear local T stops at 0.90 so certified apply() does not start driveExit. */
  rear: [
    { m0: 0, m1: 0.08, t0: 0, t1: 0 },
    { m0: 0.08, m1: 0.34, t0: 0, t1: 0.27 },
    { m0: 0.34, m1: 0.66, t0: 0.27, t1: 0.7 },
    { m0: 0.66, m1: 0.86, t0: 0.7, t1: 0.9 },
    { m0: 0.86, m1: 1, t0: 0.9, t1: 0.9 },
  ],
  drive: [
    { m0: 0, m1: 0.88, t0: 0, t1: 0 },
    { m0: 0.88, m1: 1, t0: 0, t1: 1 },
  ],
} as const;

export const MACHINE_DRIVE_START = 0.88;
export const MACHINE_INSPECTION_T = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86, 1] as const;

export interface MapSegment {
  m0: number;
  m1: number;
  t0: number;
  t1: number;
}

export function remapSegments(machineT: number, segments: readonly MapSegment[]): number {
  const m = clamp01(machineT);
  for (const s of segments) {
    if (m <= s.m1 + 1e-12) {
      if (s.m1 <= s.m0) return s.t1;
      const u = (m - s.m0) / (s.m1 - s.m0);
      return s.t0 + clamp01(u) * (s.t1 - s.t0);
    }
  }
  return segments[segments.length - 1]?.t1 ?? 0;
}

export function mapFront(machineT: number): number {
  return remapSegments(machineT, MACHINE_MAP.front);
}

export function mapRear(machineT: number): number {
  return remapSegments(machineT, MACHINE_MAP.rear);
}

export function mapDrive(machineT: number): number {
  return remapSegments(machineT, MACHINE_MAP.drive);
}

export function machinePhase(machineT: number): string {
  const m = clamp01(machineT);
  if (m <= 0.001) return "SPREAD";
  if (m < 0.08) return "RELEASE";
  if (m < 0.34) return "COMPACT";
  if (m < 0.66) return "REORIENT";
  if (m < 0.86) return "SEAT";
  if (m < MACHINE_DRIVE_START) return "STRUCTURAL_READY";
  if (m < 0.999) return "DRIVE_DEPLOY";
  return "DRIVE";
}

export function mapsMonotonic(samples = 201): { front: boolean; rear: boolean; drive: boolean } {
  let front = true;
  let rear = true;
  let drive = true;
  let pf = mapFront(0);
  let pr = mapRear(0);
  let pd = mapDrive(0);
  for (let i = 1; i < samples; i += 1) {
    const m = i / (samples - 1);
    const f = mapFront(m);
    const r = mapRear(m);
    const d = mapDrive(m);
    if (f + 1e-12 < pf) front = false;
    if (r + 1e-12 < pr) rear = false;
    if (d + 1e-12 < pd) drive = false;
    pf = f;
    pr = r;
    pd = d;
  }
  return { front, rear, drive };
}
