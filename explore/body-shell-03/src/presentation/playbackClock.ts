import { machinePhase } from "../machine/machineMap";

/**
 * Presentation playback clock. It decides only *when* a pose on the frozen
 * canonical path is shown: every value it returns is a machineT in [0, 1]
 * that the viewer hands to the unchanged pose path. It never invents a pose,
 * never extrapolates past an endpoint and never touches authority.
 *
 * Time is remapped per segment between machine phase boundaries. A segment
 * has a duration and an ease; a hold keeps the pose still. A settle is a
 * short recoil *inside* the valid path (arrive, fall back a little, land),
 * which reads as mass without showing any pose outside [0, 1].
 */
export type PlaybackProfile = "inspect" | "show" | "game";
export const PLAYBACK_PROFILES: readonly PlaybackProfile[] = ["inspect", "show", "game"];

export interface ClockSample {
  /** Always within [0, 1]. */
  machineT: number;
  /** machinePhase(machineT). */
  phase: string;
  /** d(machineT)/ds for this step; signed. Drives sound intensity. */
  velocity: number;
  /** True while inside a declared settle window. */
  settling: boolean;
  done: boolean;
}

export interface PlaybackClock {
  readonly profile: PlaybackProfile;
  readonly direction: 1 | -1;
  /** Remaining seconds from the start pose to the endpoint. */
  readonly totalSeconds: number;
  step(dtSeconds: number): ClockSample;
}

export interface ClockOptions {
  /** prefers-reduced-motion: no settles or holds, one plain ease-in-out. */
  reducedMotion?: boolean;
}

type Ease = (x: number) => number;

/** Smoothstep blended with linear; k = 0 is linear, k = 1 is full smoothstep. */
const inOut = (k: number): Ease => (x) => (1 - k) * x + k * x * x * (3 - 2 * x);
/** Decelerating start of a recoil: leaves with speed, arrives at rest. */
const out: Ease = (x) => 1 - (1 - x) * (1 - x);

interface Key {
  to: number;
  seconds: number;
  ease?: Ease;
  settle?: boolean;
}

interface Span {
  t0: number;
  t1: number;
  m0: number;
  m1: number;
  ease: Ease;
  settle: boolean;
}

/**
 * Declared settle windows. Both are recoils back along the path the machine
 * just travelled, so they only revisit poses already shown.
 *
 * - Seat: nothing moves between 0.86 and 0.88 (front and rear maps are
 *   already at their seated values and drive has not started), so a forward
 *   overshoot there would be invisible. The recoil falls back into SEAT.
 * - Lock: the lock pins begin extending at about 0.99895. Arriving at
 *   0.9988 keeps them retracted and the phase in DRIVE_DEPLOY, so the
 *   readout never flashes DRIVE before the lock lands.
 */
export const SETTLE_WINDOWS = {
  seat: { arrive: 0.86, recoil: 0.852 },
  lock: { arrive: 0.9988, recoil: 0.994 },
} as const;

const seatSettle = (seconds: number): Key[] => [
  { to: SETTLE_WINDOWS.seat.recoil, seconds: seconds * 0.45, ease: out, settle: true },
  { to: SETTLE_WINDOWS.seat.arrive, seconds: seconds * 0.55, ease: inOut(1), settle: true },
];
const lockSettle = (seconds: number): Key[] => [
  { to: SETTLE_WINDOWS.lock.recoil, seconds: seconds * 0.45, ease: out, settle: true },
  { to: SETTLE_WINDOWS.lock.arrive, seconds: seconds * 0.55, ease: inOut(1), settle: true },
];
const hold = (at: number, seconds: number): Key => ({ to: at, seconds });

/** Forward (SPREAD → DRIVE) and reverse (DRIVE → SPREAD) key tables. */
const PROFILES: Record<PlaybackProfile, { forward: Key[]; reverse: Key[] }> = {
  // Today's constant 1/12 per second read, with a gentle ease per phase and
  // two short beats. Rates match across boundaries so it never lurches.
  inspect: {
    forward: [
      { to: 0.08, seconds: 0.905, ease: inOut(0.3) },
      { to: 0.34, seconds: 2.94, ease: inOut(0.3) },
      hold(0.34, 0.25),
      { to: 0.66, seconds: 3.62, ease: inOut(0.3) },
      { to: 0.86, seconds: 2.26, ease: inOut(0.3) },
      hold(0.86, 0.25),
      { to: 0.88, seconds: 0.226, ease: inOut(0.3) },
      { to: 0.999, seconds: 1.346, ease: inOut(0.3) },
      // The lock pins extend only in the last 0.001; give them time to read.
      { to: 1, seconds: 0.2, ease: inOut(1) },
    ],
    reverse: [
      { to: 0.999, seconds: 0.2, ease: inOut(1) },
      { to: 0.88, seconds: 1.0, ease: inOut(0.3) },
      { to: 0.86, seconds: 0.2, ease: inOut(0.3) },
      { to: 0.66, seconds: 1.9, ease: inOut(0.3) },
      { to: 0.34, seconds: 3.05, ease: inOut(0.3) },
      { to: 0.08, seconds: 2.48, ease: inOut(0.3) },
      { to: 0, seconds: 0.77, ease: inOut(0.3) },
    ],
  },
  // About four seconds: firmer eases, a settle at the seat and at the lock.
  show: {
    forward: [
      // Nothing moves before 0.04, so RELEASE is short to keep Play responsive.
      { to: 0.08, seconds: 0.24, ease: inOut(0.7) },
      { to: 0.34, seconds: 0.72, ease: inOut(0.7) },
      hold(0.34, 0.08),
      { to: 0.66, seconds: 0.95, ease: inOut(0.7) },
      { to: 0.86, seconds: 0.56, ease: inOut(0.7) },
      ...seatSettle(0.14),
      hold(0.86, 0.06),
      { to: 0.88, seconds: 0.08, ease: inOut(0.7) },
      { to: SETTLE_WINDOWS.lock.arrive, seconds: 0.7, ease: inOut(0.7) },
      ...lockSettle(0.14),
      { to: 1, seconds: 0.2, ease: inOut(1) },
    ],
    // Release is quicker and lighter than seating: no settles.
    reverse: [
      { to: 0.999, seconds: 0.12, ease: inOut(1) },
      { to: 0.88, seconds: 0.5, ease: inOut(0.7) },
      { to: 0.86, seconds: 0.06, ease: inOut(0.7) },
      { to: 0.66, seconds: 0.46, ease: inOut(0.7) },
      { to: 0.34, seconds: 0.72, ease: inOut(0.7) },
      { to: 0.08, seconds: 0.6, ease: inOut(0.7) },
      { to: 0, seconds: 0.24, ease: inOut(0.7) },
    ],
  },
  // Hush Basin gameplay cadence: one eased curve, no beats.
  game: {
    forward: [{ to: 1, seconds: 0.24, ease: inOut(1) }],
    reverse: [{ to: 0, seconds: 0.2, ease: inOut(1) }],
  },
};

function buildSpans(start: number, keys: readonly Key[]): Span[] {
  const spans: Span[] = [];
  let t = 0;
  let m = start;
  for (const key of keys) {
    spans.push({ t0: t, t1: t + key.seconds, m0: m, m1: key.to, ease: key.ease ?? inOut(1), settle: key.settle === true });
    t += key.seconds;
    m = key.to;
  }
  return spans;
}

/** The time table for one profile and direction. Exported for tests. */
export function playbackTimeline(profile: PlaybackProfile, direction: 1 | -1, options: ClockOptions = {}): Span[] {
  const table = PROFILES[profile];
  const keys = direction === 1 ? table.forward : table.reverse;
  const start = direction === 1 ? 0 : 1;
  if (options.reducedMotion) {
    const seconds = keys.reduce((sum, key) => sum + (key.settle || isHold(key, keys) ? 0 : key.seconds), 0);
    return buildSpans(start, [{ to: 1 - start, seconds, ease: inOut(1) }]);
  }
  return buildSpans(start, keys);
}

function isHold(key: Key, keys: readonly Key[]): boolean {
  const index = keys.indexOf(key);
  const previous = index === 0 ? null : keys[index - 1]!.to;
  return previous !== null && previous === key.to;
}

function invert(ease: Ease, target: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Start time for a pose already on screen. Only moving, non-settle spans are
 * considered, and a pose on a boundary starts the span that leaves it, so
 * pressing Play at a hold or settle point never replays the beat.
 */
function locate(spans: readonly Span[], from: number, direction: 1 | -1): number {
  for (const span of spans) {
    if (span.settle || span.m0 === span.m1) continue;
    const inside = direction === 1 ? from >= span.m0 && from < span.m1 : from <= span.m0 && from > span.m1;
    if (!inside) continue;
    const u = (from - span.m0) / (span.m1 - span.m0);
    return span.t0 + invert(span.ease, u) * (span.t1 - span.t0);
  }
  return spans[spans.length - 1]?.t1 ?? 0;
}

function sample(spans: readonly Span[], t: number): { m: number; settle: boolean } {
  for (const span of spans) {
    if (t > span.t1) continue;
    const length = span.t1 - span.t0;
    const u = length <= 0 ? 1 : Math.min(1, Math.max(0, (t - span.t0) / length));
    return { m: span.m0 + span.ease(u) * (span.m1 - span.m0), settle: span.settle };
  }
  const last = spans[spans.length - 1]!;
  return { m: last.m1, settle: false };
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function createPlaybackClock(
  profile: PlaybackProfile,
  from: number,
  direction: 1 | -1,
  options: ClockOptions = {},
): PlaybackClock {
  if (!PLAYBACK_PROFILES.includes(profile)) throw new RangeError("Unknown playback profile");
  const spans = playbackTimeline(profile, direction, options);
  const end = direction === 1 ? 1 : 0;
  const total = spans[spans.length - 1]!.t1;
  let t = locate(spans, clamp01(from), direction);
  let previous = clamp01(from);
  return {
    profile,
    direction,
    totalSeconds: total - t,
    step(dtSeconds: number): ClockSample {
      const dt = Number.isFinite(dtSeconds) ? Math.max(0, dtSeconds) : 0;
      t += dt;
      const done = t >= total;
      const at = done ? { m: end, settle: false } : sample(spans, t);
      const machineT = done ? end : clamp01(at.m);
      const velocity = dt > 0 ? (machineT - previous) / dt : 0;
      previous = machineT;
      return { machineT, phase: machinePhase(machineT), velocity, settling: at.settle, done };
    },
  };
}
