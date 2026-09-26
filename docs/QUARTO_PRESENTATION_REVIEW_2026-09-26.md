# Quarto presentation review — 26 September 2026

Reviewed Claude's `claude/quarto-patch-motion-update-qnrks7` at `8954845`,
two commits ahead of accepted `main` at `bea1264`. The review branch retains
both commits. Authority participation: **none**. No merge or deployment.

## Findings and repair

The failing test was `body surface refinement preserves the frozen mechanism,
shared primitives and shaders`. Its comparison with `e56a4c0` returned only
`package.json`: accepted deployment PR #7 had already changed the root build
and Cloudflare scripts. Claude's branch did not change that file.

The repair keeps the original mechanism baseline and checks the root manifest
against the accepted deployment baseline separately. It also closes a gap in
Claude's guard: accepting any additions containing `applyMachinePose` could
admit unrelated code. The complete wrapper is now pinned to the specific
candidate in `a50a979`, while the no-removed-lines assertion remains. This
records the candidate being reviewed; it does not grant director approval.

The README now explains the playback speeds and the separation between
interactive posing and diagnostic certification.

## Assessment

Keep the fast presentation pose path, lighting tiers, and playback profiles.
The fast path reuses the existing mapping, structural gate, and lock posing;
the certified programmatic path remains available for evidence work. The
clock chooses canonical poses and keeps its settles inside declared windows.

Desktop studio lighting gives the folios, roots, and hull more readable depth.
The phone-sized lite view retains a two-row primary control layout without
horizontal overflow. The folded machine looks small when the camera retains
its initial SPREAD framing. Owner testing should decide whether endpoint
framing or a more prominent Fit action would help; continuously refitting
through a transformation could make the camera distracting.

## Validation

Validation results are recorded in the accompanying evidence directory.

- Both authority and presentation TypeScript/production builds passed.
- All 46 presentation tests passed (4.6 minutes), including the 101-pose
  triangle–OBB fit, body surfaces, FO1 preservation, playback, responsive
  controls, inspection, fast/certified pose equivalence, and diagnostic
  lighting. The fit test reported no defects.
- The stale guard failure was reproduced before the repair; the final,
  stricter guard passed independently after editing.
- Production-build smoke checks forced studio, lite, and flat lighting and
  captured DRIVE at 1280×900 or 390×844. All three had zero page/console errors;
  interactive posing left certification stale as intended.
- Root authority source, tests, dependency files, and Playwright configuration
  are unchanged from accepted main. The separate root authority suite was not
  rerun. No frozen evidence was regenerated or promoted.
- `git diff --check` passed.

The standard Playwright browser download returned invalid archives here.
Browser checks used Chromium 153 with SwiftShader through a temporary launch
configuration; project dependencies and browser configuration were unchanged.
Headless rendering validates behavior and layout, not real-device motion feel.

## Files and evidence

Review changes: `README.md`,
`explore/body-shell-03/tests/viewer-readability.spec.ts`, this handoff, and the
new [presentation-review-01 evidence directory](../explore/body-shell-03/evidence/presentation-review-01/).
The directory contains three production screenshots, their smoke observations,
the full passing test log, and a compact validation record.
The before-fix failure, full suite outcome, and environment are summarized there.

Consulted: `AGENTS.md`, `README.md`, `docs/CURRENT_STATE.md`,
`docs/NOMENCLATURE.md`, `QUARTO_MOTION_01_NOTES.md`, both Claude commit diffs,
the existing presentation tests and surface verifier, and accepted deployment
history. Existing body geometry, motion maps, certificates, and historical
evidence remain unchanged.

## Remaining decisions

- Try Show and Game on an actual phone before final timing/sign-off. Game's
  0.24/0.20-second targets were not independently checked against Hush Basin.
- Tour easing, sound, and camera weight remain unfinished work in Claude's
  notes. They are not needed to repair this regression and were not added.
- The additive fast-path method sits inside the frozen machine wrapper;
  Claude explicitly requested director approval before merge. Keep the work
  as a review candidate until that decision.
