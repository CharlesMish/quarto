# Showcase corrections 01 — implementer evidence

**Independent review is pending.** This is an implementation validation record,
not a separate reviewer approval. The candidate is local only: no push, merge or
deployment. The original immutable PR13 preview remains unchanged.

Frozen implementation commit: `01794731e169e6689008686aa4b87f18a07e2f36`.
All follow-up changes are evidence only.

Reviewed source base: `87b544b82f6d537208f14ed3235a55180d968e4c`.
Approved main reference: `b4c6715d2d68f5586674048950128ac752be978c`.
`invariants.json` and `browser-comparison.json` record final implementation source
SHA-256 values. The encompassing local commit is supplied in the handoff; a
commit cannot contain its own hash. The comparison's candidate-parent field is
the pre-commit parent, not a claim that the unmodified parent contains the fix.

## Checks

- Public viewer: **75/75 passed** (14.0 minutes), final implementation source.
- TypeScript/Vite: both presentation and authority builds passed.
- Original PR13: **4/4 targeted checks failed as expected** for the new contracts
  (framing, takeover, appearance scope, composed FIT); see `original-regressions.txt`.
- Matched browser comparison complete: 44 records, 30 PNG captures, no page errors.
- Raw trace export: **8/8 passed**, **6,474 rendered frames**, minimum canvas
  margin approximately **8%** across the eight viewports.
- Full root authority suite: **105/105 passed** (35.2 minutes). Implementation
  and test source stayed frozen throughout the final run.

Environment: Node 24.16.0; Babylon.js 8.56.2; Vite 7.3.6; installed default
Playwright Chromium 151.0.7922.34 with ANGLE SwiftShader. Existing dependencies
were copied into isolated checkouts; relevant root/viewer lockfile versions
match. No new install, browser settings, owner profile or executable override.
The full public suite ran alone for its input-gain measurements. Later matched
captures and bounds/scope checks overlapped the unchanged root checks; those
comparisons make no timing or performance claim.

From the repository root, using the supported Node on PATH:

```sh
npm run build:authority
npm --prefix explore/body-shell-03 run build
```

Each viewer had its own strict localhost port (`5194` presentation candidate,
`5196` unchanged authority viewer). From the corresponding package:

```sh
MT1_BASE_URL=http://127.0.0.1:5194 npm test
MT1_BASE_URL=http://127.0.0.1:5196 npm test
```

The same correction tests were then pointed at the unchanged PR13 viewer on
port 5193, with a separate output folder so final candidate attachments survive:

```sh
MT1_BASE_URL=http://127.0.0.1:5193 ./node_modules/.bin/playwright test tests/showcase-polish.spec.ts --workers=1 --grep '390x844|motion during forward|limited.*flat|load and FIT' --reporter=json --output=/tmp/quarto-pr13-original-regressions
```

The original build is expected to fail these new contracts. No production code
or test fixture was changed in that detached checkout.

## Framing and input evidence

`intermediate-extents/` contains every-rendered-frame corner traces and a
compact summary. The full suite's line reporter does not persist inline body
attachments, so the unchanged eight framing tests were run once more with the
JSON reporter solely to save their raw traces (`framing-trace-run.json`). Viewports: 320×568, 390×844, 568×320, 768×1024,
799×600, 801×600, 844×390 and 1280×720. Tests include the complete forced intro,
ordinary reverse from settled DRIVE, endpoint glides and direct scrubbing.

The new guard reads render geometry only; it does not pose ahead or certify.
Tests independently project physical/H1/body bounding corners after rendering,
including the previously clipped region near `t=0.12`. Matched capture data use
actual mesh vertices. After deliberate manual camera takeover, framing yields;
visitor-chosen zoom/pan can intentionally place geometry outside the canvas.

The takeover matrix checks mouse orbit, wheel, one-finger orbit, two-finger pan,
two-finger pinch and a working key command during wait/forward/hold/back. Separate
checks cover PAUSE click, Space, held Space/repeat, accessibility-style click,
reverse, FIT and slider commands, then explicitly starting PLAY again.

## Matched browser captures

From the presentation package:

```sh
BASE_URL=http://127.0.0.1:5193 CANDIDATE_URL=http://127.0.0.1:5194 node tools/review-showcase-corrections.mjs
```

`base-*` is original PR13, not approved production main; `candidate-*` is this
correction. Paired load/DRIVE/unfolding shots use the same viewports and controls.
The unfolding image sets DRIVE, waits for its glide, then scrubs to exactly
0.12. Intro-return images pause the real reverse leg near 0.12; their timestamps
need not be identical. Flat lighting isolates comparison on this software
renderer. Matched flat/lite/studio material images use identical DRIVE camera
presets. Original PNGs are unretouched.

`browser-comparison.json` includes camera settings, actual projected vertex
bounds, light/material values, certificate state, input traces and page errors.
Appearance tests cover both palettes and study on/off, including restoration on
exit and repeated switching. Flat intentionally reports `studyView:false`; for
lite/studio the test verifies the active study flag.

## Preserved contracts

`invariants.json` confirms no change in frozen paths, the original fit algorithm,
manual camera adapter, playback clock, camera-controls-02/03 or the entire camera
preset block. Old input-gain tests now explicitly arrange their historical fit
through its unchanged algorithm. The actual public FIT command is verified
against composition, not by replacing old recorded radii or compounding gains.
Tour comparisons remain pinned. No archived evidence is overwritten.

Authority participation: **none** for the changes. Normal root tests exercise
existing authority checks without changing their records. Ordinary intro,
playback and interaction retain a STALE certificate rather than certifying.

## Iterations and limits

The first sandboxed browser attempt failed before Chromium launched (macOS
sandbox restriction); authorized isolated-browser execution resolved that
harness restriction. `focused-initial.txt` records 21/22 checks passing before
an initial-wait PLAY test assumed it was still in that short wait after browser
actionability checks. Timestamped probes confirmed the control's actual wait
behavior. The final test verifies the starting pose and uses a real forced click
to avoid spending the wait on Playwright's extra actionability delay. All normal
control traces retain their original dispatch behavior.

A source inspection then caught held-Space repeat clearing the remembered PAUSE
intent. That implementation edge case was fixed and covered, together with
accessibility-style button activation. `command-intent.txt` is the focused pass;
the final full log covers the final source. Partial full runs interrupted during
this iteration are not presented as completed passes.

Physical-phone comfort and hardware-rendered appearance remain owner checks.
Emulated touch and SwiftShader are not physical-phone evidence or a hardware
performance claim. This work does not approve a physical machine, alter license
terms, change cmish.dev or communicate with bots. A separate reviewer must check
the exact local commit before any later push/merge/deployment decision.
