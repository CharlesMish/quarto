import { FRONT_STAGE, P } from "../design/parameters";
import { clamp01, stage } from "../math/stage";
import type { FrontStages } from "./types";

export function evaluateFrontStages(frontT: number): FrontStages {
  const t = clamp01(frontT);
  return {
    prep: stage(t, FRONT_STAGE.prep[0], FRONT_STAGE.prep[1]),
    bookFold: stage(t, FRONT_STAGE.bookFold[0], FRONT_STAGE.bookFold[1]),
    bookPin: stage(t, FRONT_STAGE.bookPin[0], FRONT_STAGE.bookPin[1]),
    yaw: stage(t, FRONT_STAGE.yaw[0], FRONT_STAGE.yaw[1]),
    cant: stage(t, FRONT_STAGE.cant[0], FRONT_STAGE.cant[1]),
    socket: stage(t, FRONT_STAGE.socket[0], FRONT_STAGE.socket[1]),
    nestLock: stage(t, FRONT_STAGE.nestLock[0], FRONT_STAGE.nestLock[1]),
  };
}

export function frontPhaseLabel(t: number): string {
  const x = clamp01(t);
  if (x <= 0.001) return "FRONT SPREAD";
  if (x >= 0.999) return "FRONT SEATED";
  if (x < FRONT_STAGE.bookFold[0]) return "front unlock";
  if (x < FRONT_STAGE.bookPin[0]) return "front book fold";
  if (x < FRONT_STAGE.yaw[0]) return "front book pin";
  if (x < FRONT_STAGE.cant[0]) return "front yaw aft";
  if (x < FRONT_STAGE.socket[0]) return "front cant";
  if (x < FRONT_STAGE.nestLock[0]) return "front socket";
  return "front nest lock";
}

export function frontCantDeg(): number {
  return P.fl.cantDeg;
}
