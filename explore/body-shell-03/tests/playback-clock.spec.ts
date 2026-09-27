import { expect, test } from "@playwright/test";
import {
  createPlaybackClock,
  playbackTimeline,
  PLAYBACK_PROFILES,
  SETTLE_WINDOWS,
  type ClockSample,
  type PlaybackProfile,
} from "../src/presentation/playbackClock";
import { machinePhase } from "../src/machine/machineMap";

// Pure Node tests: no page fixture, so no browser is launched.

const TARGETS: Record<PlaybackProfile, { forward: number; reverse?: number }> = {
  inspect: { forward: 12 },
  show: { forward: 4 },
  game: { forward: 0.24, reverse: 0.2 },
};

function run(profile: PlaybackProfile, from: number, direction: 1 | -1, dt = 1 / 120, reducedMotion = false) {
  const clock = createPlaybackClock(profile, from, direction, { reducedMotion });
  const samples: ClockSample[] = [];
  let elapsed = 0;
  for (let i = 0; i < 100_000; i += 1) {
    const sample = clock.step(dt);
    elapsed += dt;
    samples.push(sample);
    if (sample.done) break;
  }
  return { clock, samples, elapsed };
}

const inWindow = (m: number) =>
  (m >= SETTLE_WINDOWS.seat.recoil - 1e-9 && m <= SETTLE_WINDOWS.seat.arrive + 1e-9)
  || (m >= SETTLE_WINDOWS.lock.recoil - 1e-9 && m <= SETTLE_WINDOWS.lock.arrive + 1e-9);

for (const profile of PLAYBACK_PROFILES) {
  for (const direction of [1, -1] as const) {
    for (const reducedMotion of [false, true]) {
      const label = `${profile} ${direction === 1 ? "forward" : "reverse"}${reducedMotion ? " reduced-motion" : ""}`;

      test(`playback clock ${label}: exact endpoint, bounded, one-way outside settles`, () => {
        const start = direction === 1 ? 0 : 1;
        const { samples } = run(profile, start, direction, 1 / 120, reducedMotion);
        const last = samples[samples.length - 1]!;
        expect(last.done).toBe(true);
        expect(last.machineT).toBe(direction === 1 ? 1 : 0);
        expect(samples.filter((s) => s.done)).toHaveLength(1);
        let previous = start;
        for (const sample of samples) {
          expect(sample.machineT).toBeGreaterThanOrEqual(0);
          expect(sample.machineT).toBeLessThanOrEqual(1);
          expect(sample.phase).toBe(machinePhase(sample.machineT));
          if (sample.settling) {
            expect(direction, "settles only on the way in").toBe(1);
            expect(reducedMotion, "reduced motion has no settle").toBe(false);
            expect(inWindow(sample.machineT), `settle ${sample.machineT} stays in a declared window`).toBe(true);
          } else if (!inWindow(previous) || !inWindow(sample.machineT)) {
            expect((sample.machineT - previous) * direction, `${previous} -> ${sample.machineT}`).toBeGreaterThanOrEqual(-1e-12);
          }
          previous = sample.machineT;
        }
      });
    }

    test(`playback clock ${profile} ${direction === 1 ? "forward" : "reverse"}: total near target`, () => {
      const target = direction === 1 ? TARGETS[profile].forward : TARGETS[profile].reverse;
      const { clock } = run(profile, direction === 1 ? 0 : 1, direction);
      if (target === undefined) {
        // Release is quicker and lighter than seating.
        expect(clock.totalSeconds).toBeLessThan(TARGETS[profile].forward);
        return;
      }
      expect(Math.abs(clock.totalSeconds - target) / target).toBeLessThanOrEqual(0.05);
    });
  }
}

test("playback clock starts mid-path without a jump, in both directions", () => {
  for (const profile of PLAYBACK_PROFILES) {
    for (const from of [0.05, 0.34, 0.5, 0.86, 0.87, 0.94, 0.995]) {
      for (const direction of [1, -1] as const) {
        const clock = createPlaybackClock(profile, from, direction);
        const first = clock.step(1 / 240);
        const jump = Math.abs(first.machineT - from);
        // Game speed covers the whole path in ~0.24 s; allow its per-frame travel.
        expect(jump, `${profile} ${direction} from ${from}`).toBeLessThan(profile === "game" ? 0.04 : 0.004);
        expect((first.machineT - from) * direction).toBeGreaterThanOrEqual(-1e-12);
        expect(clock.totalSeconds).toBeLessThan(playbackTimeline(profile, direction).at(-1)!.t1 + 1e-9);
      }
    }
  }
});

test("playback clock at an endpoint in its own direction finishes immediately and exactly", () => {
  for (const profile of PLAYBACK_PROFILES) {
    expect(createPlaybackClock(profile, 1, 1).step(0)).toMatchObject({ machineT: 1, done: true });
    expect(createPlaybackClock(profile, 0, -1).step(0)).toMatchObject({ machineT: 0, done: true });
  }
});

test("playback clock settle points are real poses that read as not yet seated or locked", () => {
  // Lock settle stays in DRIVE_DEPLOY, before the pins begin to extend.
  expect(machinePhase(SETTLE_WINDOWS.lock.arrive)).toBe("DRIVE_DEPLOY");
  expect(machinePhase(SETTLE_WINDOWS.lock.recoil)).toBe("DRIVE_DEPLOY");
  // Seat recoil falls back into SEAT, where the rear folios still move.
  expect(machinePhase(SETTLE_WINDOWS.seat.recoil)).toBe("SEAT");
  const show = playbackTimeline("show", 1).filter((span) => span.settle);
  expect(show.map((span) => span.m1)).toEqual([
    SETTLE_WINDOWS.seat.recoil, SETTLE_WINDOWS.seat.arrive, SETTLE_WINDOWS.lock.recoil, SETTLE_WINDOWS.lock.arrive,
  ]);
});

test("playback clock velocity is signed with direction and zero at rest", () => {
  const forward = run("show", 0, 1).samples;
  expect(Math.max(...forward.map((s) => s.velocity))).toBeGreaterThan(0);
  const reverse = run("show", 1, -1).samples;
  expect(Math.min(...reverse.map((s) => s.velocity))).toBeLessThan(0);
  expect(createPlaybackClock("show", 0.5, 1).step(0).velocity).toBe(0);
});
