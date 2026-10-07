# Quarto showcase corrections 01

Local implementation candidate based on reviewed PR13
`87b544b82f6d537208f14ed3235a55180d968e4c`. Charlie approved the four bounded
corrections below. Independent review is still required; the implementer's
checks are not independent approval. Nothing is pushed, merged or deployed.

## Resulting behavior

- **Guided unfolding stays inside the canvas.** A single pass over current
  render-bound corners solves the required camera radius at the current target
  and screen shift. The guard only expands the radius as needed; it does not
  pose ahead, evaluate authority or run the iterative composed-fit solver on
  every frame. Endpoint glides still settle to composition, and their
  intermediate frames receive the same guard. Slider scrubs also expand
  immediately. After orbit/pan/zoom or a preset, the visitor owns the camera;
  the guard does not fight deliberately chosen views.
- **FIT uses composition.** Load and FIT use the same framing at the current
  orbit angles. Tour stops retain the historical fit radius/target. Presets,
  including REAR, and the original fit algorithm are unchanged.
- **The first input immediately stops intro-owned motion.** Capture-phase
  takeover clears the intro, automatic playback, clock and pending camera
  glide, without cancelling the event or queued slider input. PLAY/Space intent
  is remembered before pausing so an intended PAUSE cannot accidentally restart
  playback. Reverse, FIT, slider and other commands still perform their action;
  ordinary user-started playback retains its behavior.
- **Appearance polish has the promised scope.** Only normal Hush Basin views
  in studio/lite use the new joint, rail, folio and fill/sun terms. Flat, active
  study views and accepted palette retain their pre-PR13 appearance. The rail
  multiplier is applied to the established blended diffuse color rather than
  being overwritten by that blend. Accepted materials are never mutated.

## Historical controls and authority

The camera input code, gains, limits and historical camera-controls-02/03
records are unchanged. Gain tests explicitly arrange the historical fit using
its unchanged algorithm, then compare the original traces and settings. Public
FIT composition is tested separately; no old observation is regenerated or
replaced with current gains. Tour pose comparisons remain pinned.

Authority participation: **none** for these presentation changes. No frozen
geometry, transforms, maps, IDs, bounds, certificates, gates or proof semantics
change. Normal supported authority tests may exercise their existing checks;
that does not promote this presentation candidate or alter their records.

## Changed files

Presentation implementation: `frameVehicle.ts`, `palette.ts`, `lighting.ts`,
`createScene.ts`. Regression coverage: `showcase-polish.spec.ts`,
`camera-controls.spec.ts`, `zoom-response.spec.ts`, `helpers/cameraGestures.ts`.
Reproducible browser comparison: `tools/review-showcase-corrections.mjs`.
Documentation: README, a supersession note in the original PR13 report, this
report, and the new evidence directory. No dependency or frozen-source change.

## Validation and evidence

See [the evidence record](../explore/body-shell-03/evidence/showcase-corrections-01/README.md)
for exact commands, results, source provenance, baseline failures and matched
browser captures. The new tests cover every rendered intermediate frame at
320×568, 390×844, 568×320, 768×1024, 799×600, 801×600, 844×390 and 1280×720;
intro, settled-DRIVE reverse and scrub; touch orbit/pan/pinch, wheel and key
input in all intro stages; command intent; and appearance switching/restoration.

Evidence consulted: the original PR13 independent review, original PR13
showcase evidence, unchanged camera-controls-02/03, and approved main
`b4c6715d2d68f5586674048950128ac752be978c`.

## Remaining unknowns and stop condition

Browser testing here uses isolated installed Playwright Chromium with
SwiftShader on the Mac, including emulated touch. It is not a physical-phone
check or a hardware-rendering/performance claim. Charlie should check final
phone comfort and hardware appearance. A separate reviewer should inspect the
exact local commit, rerun relevant checks and examine the evidence before any
push decision. No extra presets, redesign, licensing work or deployment is in
scope. Stop after the approved corrections and independent review.
