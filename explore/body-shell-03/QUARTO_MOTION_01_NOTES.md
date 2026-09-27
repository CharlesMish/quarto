# Quarto motion 01: playback clock (working notes)

Status: **in progress**. Steps 1–2 of the motion outline are done: the pure
playback clock, the Play/Reverse wiring and the Speed control. Tour easing,
mechanical sound and camera weight are not started. The outline's stopping
rule still applies: Show and Game have to feel right on a real device before
this is done.

Authority participation: **none**. The clock only decides *when* a pose on the
existing canonical path is shown. Every value it emits is a machineT in [0, 1],
and the viewer applies it through the presentation pose path
(`applyMachinePose`). No motion map, stage table, pose, gate or certificate
changes.

## What changed

- `src/presentation/playbackClock.ts` is new. It has no Babylon imports. It
  maps time to machineT per phase segment, with eases, holds and two declared
  settle windows.
- `src/scene/createScene.ts`: the constant-rate playback body (1/12 per
  second) is replaced by `clock.step(dt)`. The clock restarts from the current
  pose on any outside pose change, reverse or speed change. Endpoints land
  exactly on 0 and 1, and interruptions still stop playback.
- The Speed select (Inspect / Show / Game, accessible name "Playback speed")
  sits next to the palette select. On phones the deck stays at two rows.
- Hooks: `presentation.setPlayback(profile)`, and `getState().playback`.
- Scrubbing, number keys, tour stops and `window.__MT1.setMachineT` are still
  direct. The clock only drives Play and Reverse.

| Profile | Forward | Reverse | Shape |
| --- | --- | --- | --- |
| Inspect (default) | 12.0 s | 9.6 s | Gentle per-phase ease, matched rates, 0.25 s beats at 0.34 and 0.86, 0.2 s for the lock |
| Show | about 3.9 s | about 2.7 s | Firmer ease, settles at the seat and the lock; release has no settles |
| Game | 0.24 s | 0.20 s | One smoothstep, no beats; the durations recorded in the outline |

With `prefers-reduced-motion`, a profile has no settles or holds: one plain
ease-in-out over the profile's moving time.

## Findings that changed the outline

A NullEngine sweep of `applyMachinePose` over 2,000 steps measured the
largest bounding-box corner displacement per step:

| machineT | What moves |
| --- | --- |
| 0 – 0.04 | **Nothing.** Front folios start at 0.04 and rear folios at 0.08. |
| 0.08 – 0.66 | Fold and reorient: most of the motion. |
| 0.80 – 0.86 | Small rear seating stroke only, about 1.5 mm per 0.0005 step. |
| 0.86 – 0.88 | **Nothing.** Front and rear are at their seated values; drive has not started. |
| 0.88 – 0.999 | Can travel at constant speed, about 1.06 cm per 0.0005 step. |
| 0.99895 – 1 | Lock pins extend. This is the only place they move. |

Consequences:

1. **Seat settle.** The outline's 0.86 → 0.872 → 0.86 lies entirely in the
   dead zone, so it would be invisible. The clock uses a recoil instead:
   0.86 → 0.852 → 0.86. The recoil falls back into SEAT, where the rear
   folios still move, so every value shown is still a real frozen pose.
2. **Lock settle.** Arriving at 0.999 would already show 2.6% pin extension
   and a DRIVE readout, and the recoil would then retract the pins. The clock
   arrives at 0.9988, recoils to 0.994 and lands at 1. Both points read
   DRIVE_DEPLOY with the pins retracted, as the outline asked to check.
3. **Lock segment.** At the old constant rate the pins extended in about
   12 ms, roughly one frame. Inspect and Show now give 0.999 → 1 its own
   segment, 0.2 s, so the pins can be seen locking.
4. **Show RELEASE** is short (0.24 s) because its first half moves nothing.

## Not done yet, and open questions

- **Tour easing conflicts with the existing tour test.** The outline wants
  tour transitions eased over about 0.6 s and the existing tour tests rerun
  unchanged. But that test clicks NEXT and immediately expects the pose to
  equal the stop's `t`. An `{ instant: true }` option on `setTourStep` would
  not cover button clicks. Either the test polls for the pose, or tour easing
  becomes opt-in. That decision belongs to the director.
- Sound (outline step 3) and camera weight (step 4) are not started.
- Feel is not validated on a real device. Headless Chromium on SwiftShader
  runs at about 100 ms per frame, and the 50 ms frame-time clamp stretches
  Game to 5 frames in wall time there. The browser test checks the frame
  budget, and checks wall time only when frames are under 50 ms.
- The 0.24 s / 0.20 s Game durations come from the outline. They were not
  re-measured against Hush Basin in this task.
- The settle depths, seat 0.008 and lock 0.0048, are first guesses to tune
  on a device.
