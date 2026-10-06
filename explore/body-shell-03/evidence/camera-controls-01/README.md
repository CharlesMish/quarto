# Quarto camera-control candidate

Review candidate against accepted source **11bfa39f45327197d516939046d48b1c7caefac0**. The owner reported sensitive translation on a physical phone. This change is deliberately a small panning adjustment, pending the owner's phone comparison.

[Illustrated comparison](review.html) · [raw comparison](comparison.json) · [baseline measurements](baseline/observations.json) · [candidate measurements](candidate/observations.json)

## Decision and scope

Change Babylon `panningSensibility` from **80 to 100**. A larger divisor means approximately **20% less translation** for the same mouse right-drag or two-finger pan. This affects horizontal and vertical translation; it does not change either orbit axis.

Keep `angularSensibilityX/Y = 1000`, `wheelPrecision = 40`, `pinchPrecision = 12`, `pinchDeltaPercentage = 0`, `useNaturalPinchZoom = false`, `inertia = 0.9` and `panningInertia = 0.9`. Preserve fixed camera presets, fitted starting composition, default Show and all playback timing. The installed Babylon 8.56.2 implementation uses angular sensitivity in its pinch denominator, so a blind orbit-sensitivity change could also alter pinch zoom. This candidate avoids that coupling.

`setPlayback` changes the playback profile and updates the UI; it does not change camera input settings. Inspect, Show and Game start from identical camera settings and framing in the matched tests. Distance, scene motion, inertia and the sequence of touch contacts can influence perception, but this review does not establish which explains the owner's perceived rotation difference. Physical-phone comfort remains an owner decision.

Also format the public phase heading (`DRIVE DEPLOY`, `STRUCTURAL READY`, `FRONT PREVIEW`, `REAR PREVIEW`) and direct tour stop 6 to the actual Diagnostics tab. Preserve raw `DRIVE_DEPLOY`, `STRUCTURAL_READY`, `FRONT_PREVIEW` and `REAR_PREVIEW` identifiers, phase thresholds and all inspection/proof semantics. The near-terminal 0.998 heading remains **DRIVE DEPLOY**, not DRIVE.

## Changed files

- `src/scene/createScene.ts`: one panning divisor plus explanatory comment.
- `src/ui/createUI.ts`: display-only heading formatting; raw readout unchanged.
- `src/presentation/viewerState.ts`: final tour sentence names Diagnostics.
- `tests/camera-controls.spec.ts`, `tests/helpers/cameraGestures.ts`: matched camera gestures and invariants.
- `tests/capture-camera-review.spec.ts`: explicitly invoked evidence writer, excluded from ordinary `npm test`.
- `tests/viewer-readability.spec.ts`: heading/raw-ID/near-terminal assertions and tour destination.
- `package.json`: run camera regression with the existing presentation suite.
- This evidence directory. No dependency, license, website or metadata changes.

Paths above are relative to `explore/body-shell-03`. No root authority source, frozen design/machine/math/verification modules, shader registrations, playback clock or fitting code changed. **Authority participation: none.** Existing diagnostic tests exercise the unchanged authority; the gesture captures use presentation posing and retain a STALE certificate throughout.

## Method and limits

The accepted source runs in a separate detached local worktree; the candidate runs from this task branch. The same test helper sends browser input to both Vite servers. Desktop: 1280 × 720 CSS pixels, mouse. Touch emulation: 390 × 844, DPR 1, two contacts explicitly enabled before application initialization. Each profile begins with a fresh document and the same input history, paused at SPREAD, BODY ON, fitted body camera.

Trace: 24 CSS px right-button/two-touch translation on each axis; 48 px horizontal and 24 px vertical orbit; wheel delta 80 or a 24 px increase in touch separation. Twelve input steps, one animation frame between steps, then wait for Babylon camera inertia to settle. Touch contacts are placed perpendicular to translation to reduce transient separation from Chromium's sequential pointer dispatch. The tiny first-contact pinch residual is recorded, not hidden.

Capture browser uses **ANGLE/SwiftShader**, with the application's **flat lighting fallback** (no shadows or AO). Both sides use the same renderer and lighting. These images demonstrate movement and composition, not production lighting quality or GPU performance. Native supported Mac browser screenshots in `native/` separately verify the actual display labels. **A phone-sized emulator is not a physical phone.** No physical-device feel, responsiveness, FPS or first-load performance claim is made.

The JSON `sourceHead` is the test checkout's HEAD at capture time. Candidate source was still uncommitted when captured; `comparison.json` records SHA-256 hashes of all three changed product files and the exact accepted baseline commit. The final PR commit binds those files and evidence together.

## Validation

Matched baseline and candidate captures each passed (30 gestures each). The focused camera regression passed both mouse and touch tests. The full public-viewer suite passed **52/52 tests in 4.0 minutes**; the complete run is in `presentation-tests.txt`. Build passed (`tsc --noEmit` and Vite 7.3.6), using the existing Node 24.16.0 runtime and locked Babylon 8.56.2 dependencies.

Show measurements, after inertia settles:

| Input | Accepted | Candidate | Interpretation |
| --- | ---: | ---: | --- |
| Mouse horizontal pan, 24 px | 2.980114 | 2.380360 | 20.13% less target travel |
| Mouse vertical pan, 24 px | 2.980114 | 2.380360 | 20.13% less target travel |
| Two-touch horizontal pan, 24 px | 2.856803 | 2.280031 | 20.19% less target travel |
| Two-touch vertical pan, 24 px | 2.981733 | 2.381958 | 20.11% less target travel |
| Touch horizontal orbit, 48 px | −0.470785 rad | −0.470785 rad | Same |
| Touch vertical orbit, 24 px | −0.230918 rad | −0.230918 rad | Same |
| Wheel delta 80 | +0.480924 radius | +0.480924 radius | Same |
| Pinch separation +24 px | −3.660629 radius | −3.660629 radius | Same |

Mouse orbit differences stay within the 0.004 rad timing tolerance; all unchanged camera settings are checked exactly. Profile-to-profile gesture comparisons use a 0.03 scene-unit/radian upper bound after identical fresh input history. Panning ratio is constrained to 0.78–0.82 of baseline, and pan must actually translate the target without orbit. Initial desktop and phone-sized PNGs are byte-identical. Captures have zero page/console errors and four retained screenshot ReadPixels warnings per version. All 60 captured gestures leave the presentation paused at SPREAD with a STALE certificate.

The build emits Vite's existing large-chunk advisory. There is no performance improvement claim. Captures retain Chromium screenshot `GPU stall due to ReadPixels` warnings separately from app errors. Root authority package tests were not rerun because this candidate only changes the public presentation package; its full suite includes frozen-source guards, pose equivalence, playback timing/reversal, responsive fit, inspection and Diagnostics checks.

## Preserved negative results

Earlier raw attempts are retained losslessly as gzip files to keep the review diff readable. Use `gzip -dc <file.gz>` to inspect them; `negative-results-manifest.json` records their original byte lengths and hashes.

- `initial-one-touch-harness.json.gz`: Playwright `hasTouch` alone exposed one contact; the supposed two-touch pan actually orbited. This invalid comparison was rejected. The helper now enables and asserts two contacts before application startup.
- `initial-harness-assertion.txt.gz`: first explicit pan check caught a touch override lost when its CDP session detached. The emulation session now remains attached for the context lifetime.
- `capture-warning-first-run.txt.gz`: screenshot GPU ReadPixels warnings were initially combined with errors. Raw warnings are now retained independently; unexpected warnings and app errors still fail capture.
- `initial-along-axis-touch.json.gz` and `presentation-tests-first-run.txt.gz`: a contact pair aligned with travel transiently stretched while Chromium dispatched sequential moves, injecting pinch. The product's zoom/gesture recognition was not changed; the matched test geometry was corrected.
- `initial-shared-input-history.json.gz` and `presentation-tests-second-run.txt.gz`: first touch pan after load initialized contact history and traveled slightly less than later pans on both source versions. Comparing first Inspect with later Show/Game conflated history with profile. Every profile now starts with a fresh document; no threshold was widened to suppress this failure.
- macOS denied isolated Chromium launch inside the shell sandbox. The already-installed test browser was run with the authorized shell escalation; no browser or OS permission was changed.

## Reproduce

Use the locked dependencies in the public package and an existing compatible Chromium installation. Serve an untouched worktree at the accepted SHA on port 5188 and this branch on port 5187, then run from `explore/body-shell-03`:

```sh
MT1_BASE_URL=http://127.0.0.1:5188 CAMERA_REVIEW_PHASE=baseline npx playwright test tests/capture-camera-review.spec.ts --workers=1
MT1_BASE_URL=http://127.0.0.1:5187 CAMERA_REVIEW_PHASE=candidate npx playwright test tests/capture-camera-review.spec.ts --workers=1
MT1_BASE_URL=http://127.0.0.1:5187 npm test
npm run build
```

Do not run the baseline capture against candidate source: it overwrites the explicit baseline evidence. The default `npm test` reads that evidence without overwriting it.

## Stop and owner comparison

Compare the draft branch preview with https://quarto.cmish.dev/ on the same physical phone, same starting pose and Show setting. Try a small two-finger pan, a one-finger orbit and a pinch, then repeat with Inspect selected. Decide whether this one modest reduction is enough. Keeping main unchanged is valid. Any further orbit or zoom change needs a separate measured decision, not an automatic extension of this patch. No merge or production deployment is authorized by this evidence.
