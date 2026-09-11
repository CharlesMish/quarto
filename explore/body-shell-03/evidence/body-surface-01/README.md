# Quarto body surface refinement — review evidence

This is the BODY-SHELL-03.2 presentation candidate on
`feature/quarto-body-surface-refinement`, following viewer `3780e02` and accepted
main `9321de4`. See the [handoff](../../../../docs/QUARTO_BODY_SURFACE_01.md).
**Authority participation: none.**

## Before and after

The [paired gallery](candidate/comparison.html) compares the archived prior
viewer with the repaired body at the same canonical pose, camera and lighting.
Each capture records lightweight provenance and a hash of the physical mechanism
inventory. Both the Hush Basin and accepted-color palettes are included.

| View | Before | After |
| --- | --- | --- |
| SPREAD | [Image](baseline/spread-overview-hush-basin.png) | [Image](candidate/spread-overview-hush-basin.png) |
| Nose, port | [Image](baseline/spread-nose-port-hush-basin.png) | [Image](candidate/spread-nose-port-hush-basin.png) |
| Nose, starboard | [Image](baseline/spread-nose-starboard-hush-basin.png) | [Image](candidate/spread-nose-starboard-hush-basin.png) |
| Low underside | [Image](baseline/spread-low-underside-hush-basin.png) | [Image](candidate/spread-low-underside-hush-basin.png) |
| DRIVE, port | [Image](baseline/drive-port-hush-basin.png) | [Image](candidate/drive-port-hush-basin.png) |
| DRIVE, top | [Image](baseline/drive-top-hush-basin.png) | [Image](candidate/drive-top-hush-basin.png) |
| Open stern | [Image](baseline/drive-stern-hush-basin.png) | [Image](candidate/drive-stern-hush-basin.png) |

Explicit inspection views: [BODY OFF](candidate/drive-body-off-hush-basin.png),
[BODY SECTION](candidate/drive-body-section-hush-basin.png) and
[PROP SECTION](candidate/handover-prop-section-hush-basin.png).
The [motion gallery](candidate/motion.html) includes actual forward/reverse
playback samples, orbit views and mobile tour states.

[Forebody contact sheet](candidate/forebody-contact-sheet.png) ·
[Inspection contact sheet](candidate/inspection-contact-sheet.png) ·
[Validated comparisons](candidate/review-validated.json) ·
[Residual seam inspection](candidate/seam-inspection.json)

The captures are generated from the real viewer. The deliberately low camera
looks upward from above the existing floor; no geometry or floor is hidden to
produce that view. Close-up cameras can crop parts outside their inspection
target. These images make no performance or native Godot claim.

## Validation and provenance

The [validation record](validation.json) binds the final runtime, tests, tools,
checks and prior-root regression reuse. Results:

- [Root build](validation/build-root.log) and [shell build](validation/build-body-shell.log): PASS.
- [Body verification](validation/body-surface-verification.json): 38 closed,
  outward, flat-shaded meshes; 648 nondegenerate triangles; 72 passing seam
  probes; opaque defaults and explicit ghosting in both palettes.
- [Prior-viewer negative](validation/baseline-negative.json): EXPECTED FAIL,
  detecting the defects in immutable `3780e02`.
- [Fresh fit report](validation/body-shell-fit.json): 101 poses, zero defects.
- [Broad suite](development/shell-suite-first.log): 14 passes and the diagnosed
  decimal/Float32 probe failure. [Final focused run](validation/surface-fit-focused.log):
  four passes after correcting that probe, adding culling/can-blending assertions
  and persisting JSON outputs. All 15 supported cases have passing executions.
- [Frozen equivalence](validation/frozen-equivalence.json): source/evidence
  identity checks supporting reuse of the prior 103-test root result.

Original evidence, including viewer 01 and accepted shell fit reports, is
preserved. Each capture directory retains the exact script used and capture-start
source hashes. The capture tool verifies identical source at the end of the run
before comparing views. Final packaging separately verifies that all 75 current
runtime files still match those hashes, with no extra files.

The [visual findings](candidate/VISUAL_REVIEW.md) distinguish the remaining faint
roof line from a modeled opening and identify the unchanged roof hardware tab.
The precise GPU cause of that line remains unisolated.

`development/` retains the initial probe/material harness failures and sandbox
launch error. The original visual comparison failure remains in
`candidate/review.json`; `candidate/review-validated.json` records the corrected
saved-state comparison. The first fit assertion passed but its in-memory
attachment was not written by the reporter; only that fit case was repeated to
retain the explicit report. No failed result was removed or relabeled as a pass.

`files.sha256` hashes this task's changed files relative to `3780e02`, excluding
the manifest itself. Run `sha256sum -c` on it from the repository root. The older
viewer 01 manifest remains a historical binding and was not regenerated.

The new validation tools support fresh output paths and refuse to overwrite
existing evidence. Raw `.log` files and the generated failure context retain tool
formatting; the local Git attributes exempt those files from source-code
whitespace checks.
