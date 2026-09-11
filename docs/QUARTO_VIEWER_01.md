# Quarto viewer 01 — readability and interaction

This presentation candidate develops the BODY-SHELL-03.1 viewer on
`feature/quarto-viewer-readability`, from accepted `main` commit `9321de4`.
It opens in a Hush Basin-inspired palette with a compact control deck, optional
mechanism tour and immediate accepted-palette comparison. The root authority
viewer retains its existing source and behavior.

## Run and review

From the repository root, using the existing dependencies:

```sh
npm --prefix explore/body-shell-03 run dev -- --port 5195 --strictPort
```

Open `http://localhost:5195` in the Windows browser when serving from WSL.
This review uses 5195 because the package's usual 5185 port was already occupied.
The server remains bound to loopback. Opening the page does not play the
transformation, request authority or generate a certificate.

The primary controls provide the machine scrubber, play/pause, reverse, BODY
toggle and palette switch. Expand the camera, inspection, diagnostics and folio
preview panels when needed. Details contains provenance and keyboard help.
Space plays/pauses; R restores the body camera; D opens diagnostics; S toggles
section; B toggles BODY; 1–9 retain the original canonical inspection poses.
Focused controls retain their native keyboard behavior.

Fit frames the currently visible vehicle surfaces without including the floor,
debug axes or protected reservations. Initial framing fits SPREAD. Manual camera
movement and ordinary pose changes do not trigger repeated framing adjustments.

The optional six-stop tour uses existing poses at 0, 0.24, 0.60, 0.86, 0.94 and
1.00. Selecting a stop pauses at that pose and sets its inspection camera.
The final two stops use new external stern angles so the shell does not obscure
the handover; the legacy H1 camera presets remain unchanged.
Manual scrubbing, selecting a camera or orbiting leaves the tour. Sections and
visibility isolation remain explicit controls. The tour describes mechanism
motion; it does not establish a readiness predicate or director disposition.

## Palette and boundaries

The source palette is preserved byte-for-byte from the bridge study at `dca5887`.
The native Hush Basin candidate at `0b0cc10` informs the visual hierarchy, not
Quarto's dimensions or proof graph. The interpreted palette keeps broad folio
faces shaded turquoise, darker undersides, differentiated joints/rails/pockets,
and small mint details. The core and receiver have decorative amber/cyan cues.
This is Babylon StandardMaterial shading, not a Godot photometry claim.

Material clones are created once. Accepted Quarto restores the original
material objects; palette switching does not alter meshes, pose, visibility,
registration, alpha, culling or H1 depth bias. Diagnostic materials retain their
existing meanings. Lighting remains fixed between comparisons.

The frozen four-folio mechanism, larger/higher rear haunch, proud receiving
sockets and open-stern handover remain intact. No shell geometry was revised.
**Authority participation: none.** Ordinary canonical movement still invokes
the existing frozen certification path when stale. Its first-movement pause is
not eliminated by this presentation change. H1 remains awaiting director
disposition; no accepted report or result is rewritten.

## Presentation API

Existing `window.__MT1` hooks and lightweight provenance APIs remain available.
The added `window.__MT1.presentation` surface supplies:

- `getState()` — palette, tour step, playback state/direction and viewer identity;
- `setPalette('hush-basin' | 'accepted')` — reversible presentation switch;
- `setTourStep(index | null)` — six canonical stops, or leave the tour;
- `fitCamera()` — visible-vehicle framing;
- `reverse()` — reverse playback, moving inward at an endpoint.

These controls never install a second animation clock. UI slider events retain
only their latest request per animation frame and flush the final value on
release. Explicit pose commands cancel queued slider input. Public pose setters
remain synchronous; manual pose commands pause playback and leave the tour.
Hidden diagnostics return before constructing expensive evaluation arguments;
visible diagnostics continue to use the existing evaluators.

The isolated palette verifier builds no mechanism and writes no evidence:

```sh
node explore/body-shell-03/tools/verify-palette.mjs
```

To capture a new review after starting the candidate viewer, choose a fresh
directory. The optional baseline URL must serve the accepted shell source:

```sh
node explore/body-shell-03/tools/review-viewer.mjs --url http://127.0.0.1:5195 --output /absolute/new/review
```

Add `--baseline-url http://127.0.0.1:5196` for sequential same-browser baseline
and candidate measurements. Keep other browser test jobs idle while measuring.
The script uses ordinary canonical poses, compares palette identity/inspection
state and records both cold certification time and warm setter timings. The
timings do not establish real-device animation FPS or input-to-display latency.

## Validation record

The [review evidence](../explore/body-shell-03/evidence/viewer-01/README.md)
contains matched images, source-bound tour captures, logs, retained development
failures and the final validation manifest.

| Check | Result |
| --- | --- |
| Root `npm run build` | PASS; existing large-bundle warning remains |
| Shell `npm --prefix explore/body-shell-03 run build` | PASS; existing large-bundle warning remains |
| Root supported `npm test` | PASS; 103 tests in 1.1 h, exit 0; existing serial command and assertions unchanged |
| Shell supported suite and focused follow-up | All 12 current tests have passing relevant executions: 10 passed in the full run, then the corrected Fit test and new picking test both passed in 54.4 s |
| BODY-SHELL-03.1 fit inside the shell suite | PASS; original 101-sample fit and geometry assertions retained |
| Isolated palette verifier | 11 checks PASS; clones, original identity, H1 bias, diagnostic exclusion and allocation stability |
| Independent Fit fixtures | 48 cases PASS; six aspect ratios, four orbit angles, centered and offset rotated geometry; orbit unchanged |
| Actual Quarto Fit checks | 16 combinations PASS; four poses, two cameras and two viewports; every visible vehicle bounding corner inside the projected viewport |
| Actual part picking | PASS at 1280×720 and 390×844; mesh, semantic identity and registration match the picked part |
| Matched appearance | 16 palette images PASS identity/inspection comparisons; BODY OFF also captured |
| Responsive layout | Four viewport sizes PASS; no horizontal overflow, 44 px control targets, at least 60% canvas height with auxiliary panels closed |
| Integrated tour | All six stops tested on mobile; six additional BODY ON handover/terminal captures pass card separation and control reachability checks |
| Frozen-source and whitespace checks | PASS against accepted `9321de4`; root source/tests, shell geometry/verification and existing evidence unchanged |

The shell commands used the existing local candidate server:

```sh
MT1_BASE_URL=http://127.0.0.1:5195 npm --prefix explore/body-shell-03 test
MT1_BASE_URL=http://127.0.0.1:5195 npm --prefix explore/body-shell-03 test -- --grep 'fit camera|inspect pick'
```

This is cumulative coverage, not a claim that one invocation reported 12/12.
The final full run had ten passes and a Fit observation-helper failure before
its geometry assertions: the browser resource-timing buffer did not retain the
Engine import. The helper now resolves the exact imports from the served scene
module. Its first follow-up was stopped because individual Playwright assertions
for every corner imposed excessive harness overhead; the final test checks the
equivalent extrema across every corner and passes. No geometric tolerance was
relaxed.

Earlier, a shell run could not start because port 5185 was already occupied.
Another run exposed the expected cold-certification pause through the warm
slider test's five-second poll. That test now explicitly completes ordinary cold
posing before measuring warm input delivery; its poll limit is unchanged. The
separate initial-state test verifies that loading, palette switching and Fit
leave the certificate STALE. These negative results are retained in the evidence.

### Local timing comparison

The [timing record](../explore/body-shell-03/evidence/viewer-01/timings/review.json)
was captured after all test browsers closed. Accepted `9321de4` ran first, then
this candidate, in the same headless Chromium 151.0.7922.34 process at 1600×900.
The environment was WSL2, an i9-13950HX, Node 25.2.1 and Babylon 8.56.2; both
viewers reported ANGLE/Vulkan SwiftShader software rendering. The original
canvas was 1600×900; the new reserved layout's canvas was 1600×652.

| Measurement | Accepted shell | Viewer 01 |
| --- | ---: | ---: |
| Cold first canonical setter | 26,977.3 ms | 25,549.1 ms |
| Warm, diagnostics hidden — median / p95 / max | 46.1 / 54.0 / 63.9 ms | 17.1 / 20.4 / 30.5 ms |
| Warm, diagnostics visible — median / p95 / max | 48.3 / 55.4 / 59.2 ms | 40.1 / 43.3 / 53.1 ms |

Each warm row contains 61 canonical setter calls separated by animation frames,
covering 0 through 1. Hidden-diagnostic p95 was about 62% lower in this local
observation. This measures synchronous setter duration, not animation FPS or
input-to-paint latency. It is one sequential sample on a software renderer with
different canvas sizes, not a controlled GPU benchmark or a real-phone result.

Both initial certificates were STALE and absent. Both first setters produced
the same valid CURRENT certificate with 2,002 samples and 2,981,632 evaluated
pairs. The roughly 26-second cold cost remains; this task claims no frozen
certification optimization. Neither page produced a JavaScript error.

## Changed files and evidence

| Files | Purpose |
| --- | --- |
| `README.md`, `docs/CURRENT_STATE.md`, `docs/QUARTO_VIEWER_01.md` | Candidate handoff and links; accepted records preserved |
| Shell `src/main.ts`, `src/style.css`, `src/ui/createUI.ts` | Quarto presentation copy, responsive deck, disclosures, tour and input delivery |
| Shell `src/scene/createScene.ts`, `src/vite-env.d.ts` | Existing scene integration, playback coordination, camera framing, diagnostic guard and presentation API |
| Shell `src/presentation/{palette.ts,hushBasinPalette.json,fitCamera.ts,viewerState.ts,README.md}` | Reversible material interpretation, source palette, framing and tour definitions |
| Shell `package.json`, `tests/{body-shell-03.spec.ts,viewer-readability.spec.ts}` | Supported test entry and targeted regression coverage; original shell geometry assertions preserved |
| Shell `tools/{verify-palette.mjs,review-viewer.mjs}` | Isolated material verification and fresh-directory browser review/timing capture |
| Shell `evidence/viewer-01/` | New candidate evidence and complete file/hash manifest; no accepted evidence overwritten |

Here, “Shell” paths are relative to `explore/body-shell-03/`.
Evidence consulted: README/current state/nomenclature, frozen S5 closure and H1
report, BODY-SHELL-03.1 pocket correction and fit evidence, existing viewer/tests,
bridge palette study and native Hush Basin candidate previews. Exact added files
and source hashes are recorded in the validation manifest.

**Authority participation: none.** Supported regression tests exercise their
existing authority evaluators and negative controls; no authority input, proof
identity, accepted result or evidence-writer behavior is changed by this task.
Root mechanism, frozen shell geometry and machine/verification modules remain
byte-identical to the accepted baseline.

Remaining limits: the frozen first-pose certification cost remains; H1 still
awaits director disposition; native Godot validation and real-device performance
remain separate work. The legacy H1 stern angles can remain occluded with BODY
ON; new tour angles address that presentation need while preserving historical
presets. Dedicated stern close-ups may crop outer folio tips. Fit provides the
whole-vehicle view, and existing sections/lock cameras provide fine inspection.
