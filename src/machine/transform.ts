import { P, STAGE } from "../design/parameters";
import { clamp01, stage } from "../math/stage";
import type { Stages } from "./types";

export function evaluateStages(transformT: number): Stages {
  const t = clamp01(transformT);
  return {
    prep: stage(t, STAGE.prep[0], STAGE.prep[1]),
    bookFold: stage(t, STAGE.bookFold[0], STAGE.bookFold[1]),
    bookLatch: stage(t, STAGE.bookLatch[0], STAGE.bookLatch[1]),
    yaw: stage(t, STAGE.yaw[0], STAGE.yaw[1]),
    roll: stage(t, STAGE.roll[0], STAGE.roll[1]),
    socket: stage(t, STAGE.socket[0], STAGE.socket[1]),
    nestLock: stage(t, STAGE.nestLock[0], STAGE.nestLock[1]),
    driveExit: stage(t, STAGE.driveExit[0], STAGE.driveExit[1]),
  };
}

export function phaseLabel(t: number): string {
  const x = clamp01(t);
  if (x <= 0.001) return "SPREAD";
  if (x >= 0.999) return "DRIVE EXIT";
  if (x < STAGE.bookFold[0]) return "unlock / prepare";
  if (x < STAGE.bookLatch[0]) return "book fold";
  if (x < STAGE.yaw[0]) return "book latch";
  if (x < STAGE.roll[0]) return "rear yaw aft";
  if (x < STAGE.socket[0]) return "flank roll";
  if (x < STAGE.nestLock[0]) return "socket insertion";
  if (x < STAGE.driveExit[0]) return "nest lock";
  return "drive-envelope exit";
}

export function haunchDeg(): number {
  return P.haunchDeg;
}
