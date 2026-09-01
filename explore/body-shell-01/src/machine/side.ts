import { P } from "../design/parameters";

/** Port = −1 (certified). Starboard = +1. Never scale meshes by this value. */
export type SideSign = -1 | 1;

export const SIDE_PORT: SideSign = -1;
export const SIDE_STBD: SideSign = 1;

export function mirrorX(x: number, s: SideSign): number {
  return s < 0 ? x : -x;
}

export function worldX(portX: number, s: SideSign): number {
  return s * Math.abs(portX) * Math.sign(portX || 1) * (s < 0 ? 1 : -1);
}

/** Starboard stations derived from frozen port magnitudes. */
export const STBD = {
  rear: {
    spreadX: -P.rl.spreadX,
    nestX: -P.rl.nestX,
    yawDeg: -P.rl.yawDeg,
    foldDeg: -P.rl.foldDeg,
    latchDeg: -P.rl.latchDeg,
    spreadLockDeg: P.rl.spreadLockDeg,
    haunchDeg: P.haunchDeg,
    nestBoltRetractZ: P.rl.nestBoltRetractZ,
    nestBoltExtendZ: P.rl.nestBoltExtendZ,
  },
  front: {
    spreadX: -P.fl.spreadX,
    nestX: -P.fl.nestX,
    yawDeg: -P.fl.yawDeg,
    foldDeg: -P.fl.foldDeg,
    cantDeg: P.fl.cantDeg,
    spreadLockDeg: P.fl.spreadLockDeg,
    nestPinRetractX: -P.fl.nestPinRetractX,
    nestPinExtendX: -P.fl.nestPinExtendX,
    nestPinLocalY: P.fl.nestPinLocalY,
    nestPinLocalZ: P.fl.nestPinLocalZ,
  },
  nestReceiver: {
    x: -P.nestReceiver.x,
    y: P.nestReceiver.y,
    z: P.nestReceiver.z,
    outer: P.nestReceiver.outer,
    bore: P.nestReceiver.bore,
  },
  socketRail: {
    y: P.socketRail.y,
    z: P.socketRail.z,
    xOut: -P.socketRail.xOut,
    xIn: -P.socketRail.xIn,
    section: P.socketRail.section,
    shoe: P.socketRail.shoe,
  },
  channel: {
    xIn: -P.channel.xIn,
    xOut: -P.channel.xOut,
    yBot: P.channel.yBot,
    yTop: P.channel.yTop,
    zFwd: P.channel.zFwd,
    zAft: P.channel.zAft,
  },
  flNestReceiver: {
    x: -P.fl.nestReceiver.x,
    y: P.fl.nestReceiver.y,
    z: P.fl.nestReceiver.z,
    outer: P.fl.nestReceiver.outer,
    bore: P.fl.nestReceiver.bore,
  },
  flSocketRail: {
    y: P.flSocketRail.y,
    z: P.flSocketRail.z,
    xOut: -P.flSocketRail.xOut,
    xIn: -P.flSocketRail.xIn,
    section: P.flSocketRail.section,
    shoe: P.flSocketRail.shoe,
  },
} as const;

export function stbdChannelDepth(): number {
  return STBD.channel.xOut - STBD.channel.xIn;
}

export function stbdSocketStroke(): number {
  return STBD.rear.spreadX - STBD.rear.nestX;
}

export function stbdFrontSocketStroke(): number {
  return STBD.front.spreadX - STBD.front.nestX;
}
