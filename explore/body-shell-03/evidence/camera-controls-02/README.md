# Quarto camera controls — second owner comparison

The owner tried PR #12's first preview and reported that spin and translation still felt fast. This revision reduces both orbit and pan input by **one third relative to that preview**, while preserving wheel/pinch zoom, damping parameters, playback, default Show and camera composition.

Comparison base: **eb04851dcc443e0e68aae41f52807832c095fdbd** ([first preview](https://d8b19e68-quarto.charlesmish.workers.dev/)). Accepted main remains **11bfa39f45327197d516939046d48b1c7caefac0**. [Illustrated comparison](review.html), [measurements](comparison.json), and raw `baseline/` / `candidate/` observations accompany this report.

## Decision

| Setting | Accepted main | First PR #12 preview | This revision |
| --- | ---: | ---: | ---: |
| Pan divisor | 80 | 100 | 150 |
| Applied manual-orbit gain | 1 | 1 | 2/3 |
| Horizontal/vertical orbit divisor | 1000 / 1000 | 1000 / 1000 | 1000 / 1000 |
| Pinch precision | 12 | 12 | 12 |
| Effective pinch divisor | 12000 | 12000 | 12000 |
| Wheel precision | 40 | 40 | 40 |
| Orbit/zoom inertia, pan inertia | 0.9 / 0.9 | 0.9 / 0.9 | 0.9 / 0.9 |

Pan uses a divisor of 150 instead of 100. Manual orbit uses a small adapter built from Babylon's camera-input hook and `onAfterCheckInputsObservable`: it captures the pose immediately before input integration, then applies two thirds of the resulting manual angular movement. The guard requires angular input/coasting; direct preset, fit, tour or interpolated camera changes are not scaled. Existing vertical limit stops are retained exactly. No engine internals or threshold settings are modified.

This preserves the original angular sensitivity (1000), pinch precision (12), effective pinch divisor (12000), inertia and wheel settings. Relative to accepted main, orbit is about 33% lower and pan about 47% lower; the primary comparison is against the first preview the owner actually tried.

The simpler divisor-only approach was tested and rejected. At a rotation divisor of 1500, the 24 px touch vertical trace fell from 0.2309 to only 0.04336 radians because individual offsets crossed Babylon's residual cutoff. A bounded probe also found rate-dependent cutoff effects at 1100–1250. Changing those engine cutoffs would also affect zoom, so the final adapter scales applied manual motion after the existing cutoff instead. `orbit-gain-probe.json` and `rejected-orbit-1500/` retain the negative evidence, source and failed test log (50 passed, 2 failed). The probe used test-only settings overrides before the adapter existed; reproduce it against the first-preview baseline, not the final adapter candidate.

## Input-rate, inertia and distance assessment

The installed `arcRotateCameraPointersInput.js` adds pointer deltas divided by sensitivity. `arcRotateCamera.js` accumulates those inputs, applies 0.9 decay each camera update, and drops very small residuals. The same inertia setting controls orbit and radius; lowering it would change zoom coasting too. This revision therefore changes input gain while keeping damping behavior.

Matched baseline tests used identical 12-step traces with one versus three animation frames between steps. Settled orbit/pan movement stayed nearly constant; faster traces left more travel after release. For Show on touch emulation, the baseline horizontal orbit was about 0.4708 radians, with roughly 0.0844 radians remaining after the standard trace versus 0.0421 after the slower trace. Pan was about 2.280 scene units, with approximately 0.451 versus 0.240 remaining after release. Release readings include automation-call latency, so these are descriptive trace observations, not precise physical-phone motion measurements.

At 0.65×, 1× and 1.35× the fitted camera radius, the same pan still moved the target about 2.280 scene units on touch and 2.380 on desktop; orbit angle was likewise nearly unchanged. Panning is expressed in scene units, without radius normalization. Its apparent screen displacement can be stronger closer to the scene. This revision scales that existing behavior; it does not introduce distance-dependent controls or alter presets/fit.

Inspect and Show use identical camera settings. Source `setPlayback` only changes the playback profile/UI; all three profiles receive the same control gains. Actual phone/browser frame scheduling and comfort remain unverified by emulation.

## Scope and authority

Changed product files for this revision: `src/scene/createScene.ts` adjusts pan and installs `src/presentation/cameraInputResponse.ts`, the bounded manual-orbit adapter. The earlier PR's display-only phase labels and Diagnostics wording are retained.

Updated tests: `tests/helpers/cameraGestures.ts` records residuals and supports a slower input trace; `tests/capture-camera-review.spec.ts` captures the new baseline/candidate and distance/rate study; `tests/camera-controls.spec.ts` checks the new gains, unchanged zoom and responses across profiles, rates and distances, plus unchanged direct preset/tour angles. `tests/capture-camera-gain-probe.spec.ts` preserves the explicitly invoked diagnostic probe. Added evidence lives only in `evidence/camera-controls-02/`. Paths are relative to `explore/body-shell-03`.

**Authority participation: none.** No frozen geometry, transforms, motion maps, identifiers, certificates, proof semantics, shader registrations, playback clock, camera presets or fitting code changed. Presentation gesture captures stay paused at SPREAD with a STALE certificate. Root authority tests are not rerun for this input-only revision; the public suite includes existing frozen-source/pose guards and diagnostic behavior checks.

## Validation and measurements

Matched captures have **78 gestures per version** (30 primary traces plus 48 rate/distance probes), with zero captured app errors. Initial desktop and touch screenshots are byte-identical. Small settling cutoffs make pan reductions slightly greater than the nominal one third.

| Show trace | First preview | Revision | Travel reduction |
| --- | ---: | ---: | ---: |
| Mouse pan-x | 2.380360 | 1.580043 | 33.62% |
| Mouse pan-y | 2.380360 | 1.580043 | 33.62% |
| Mouse orbit-x | -0.470392 | -0.313355 | 33.38% |
| Mouse orbit-y | -0.230565 | -0.153895 | 33.25% |
| Mouse zoom | 0.480924 | 0.480924 | 0.00% |
| Touch pan-x | 2.280031 | 1.515072 | 33.55% |
| Touch pan-y | 2.381958 | 1.581668 | 33.60% |
| Touch orbit-x | -0.470785 | -0.313856 | 33.33% |
| Touch orbit-y | -0.230918 | -0.153945 | 33.33% |
| Touch zoom | -3.660629 | -3.660629 | 0.00% |

Orbit values are radians; pan values are target travel in scene units; zoom values are radius changes. **All 52 public-viewer tests passed on the final source:** 2 expanded camera tests in 2.2 minutes (`camera-tests.txt`) and the remaining 50 tests in 2.8 minutes (`remaining-tests.txt`). The camera tests were not repeated unnecessarily in the second run. TypeScript and the Vite production build passed (`build.txt`); the existing large-chunk advisory remains. No performance gain is claimed. Earlier evidence in `camera-controls-01/` remains historical and unchanged.

Capture setup: Chromium/ANGLE SwiftShader, flat lighting fallback, desktop 1280×720 and touch-emulated 390×844 at DPR 1. Two contacts are enabled before app initialization. Each playback profile and study scenario starts with fresh contact history. Identical 24 CSS px horizontal/vertical pans, 48 px horizontal and 24 px vertical orbits, wheel delta 80, and touch separation +24 px are sent to the two source versions. Camera inertia is allowed to settle; no fixed sleep or camera transform substitutes for the gestures. The additional study covers Inspect/Show, standard/slower input and near/far distance. These traces are not an FPS benchmark or a physical-phone feel test.

Raw measurements carry the test checkout's HEAD at capture time. Candidate captures may precede the revision commit; `comparison.json` pins the product source hash used for them. Capture ReadPixels warnings are retained separately from app errors. Any validation failures must be preserved and explained, not removed by altering frozen inputs.

## Reproduce and owner stop point

Serve an untouched worktree at `eb04851` on port 5188 and this candidate on 5187. From the public package, run:

```sh
MT1_BASE_URL=http://127.0.0.1:5188 CAMERA_REVIEW_PHASE=baseline CAMERA_REVIEW_DIRECTORY=camera-controls-02 npx playwright test tests/capture-camera-review.spec.ts --workers=1
MT1_BASE_URL=http://127.0.0.1:5187 CAMERA_REVIEW_PHASE=candidate CAMERA_REVIEW_DIRECTORY=camera-controls-02 npx playwright test tests/capture-camera-review.spec.ts --workers=1
MT1_BASE_URL=http://127.0.0.1:5187 npm test
npm run build
```

The evidence writer is excluded from ordinary `npm test`. Never regenerate the baseline against the candidate server.

Compare the old and new immutable previews on the same physical phone, starting paused at SPREAD in Show. Try a short one-finger orbit, a two-finger pan and a pinch, then repeat in Inspect. The intended change is about one third less orbit/pan travel; zoom should feel the same. The owner can keep this revision, request one specific adjustment, or keep main unchanged. No automatic merge or production deployment.
