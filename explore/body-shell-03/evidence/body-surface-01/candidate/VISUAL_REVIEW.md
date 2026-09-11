# Quarto body surface visual review

The repaired BODY ON shell reads as opaque, outward-facing faceted panels in the captured views. The former broad bleed-through and open forebody interfaces are no longer apparent. The narrowing prow, chine shoulder, roof contour, folded folio relationships, aft service opening and open stern remain recognizable in both palettes.

This compares the **prior viewer at `3780e02`** with the body surface candidate. The prior viewer is not accepted `main`. The palette selector's `accepted` name still refers to the existing palette option.

## Review evidence

- [Before/after gallery](comparison.html): 32 pairs, comprising 16 poses/views in each palette, with matching cameras and lights. Views cover SPREAD and DRIVE from port and starboard, the prow, low underside, roof, handover and stern, plus BODY OFF and explicit BODY/PROP sections.
- [Forebody contact sheet](forebody-contact-sheet.png) and [inspection contact sheet](inspection-contact-sheet.png): labeled layouts made from the unedited captures. [Sheet bindings](contact-sheets.json) retain report, tool and image hashes.
- [Motion, orbit and mobile gallery](motion.html): ten samples from actual forward/reverse playback, four pointer-orbit views, and four portrait tour views. The tour uses steps 5 and 6 at `390×844`, with Details collapsed and expanded.
- [Validated saved-state comparison](review-validated.json): all 32 static pairs match their physical-mechanism inventory hash/count, selected mechanism rows, inspection/pose state, camera and numeric light values. It also binds all 50 candidate capture images by SHA-256 and checks the frozen/shared source hashes against the prior viewer.
- [Retained original candidate report](review.json), [exact candidate capture script](capture-tool.mjs), [prior viewer report](../baseline/review.json), and [exact prior viewer capture script](../baseline/capture-tool.mjs) preserve the original run records.
- [Seam probe evidence](seam-inspection.json) and [reproduction script](reproduce-seam-probes.mjs) address the remaining roof line and lower prow transitions using the actual BODY constructors in NullEngine.

Both variants produced 50 capture images: 32 static, ten playback, four orbit and four mobile. Neither recorded JavaScript page errors. Actual playback reached DRIVE and then returned to SPREAD; all four orbit checks preserved the mechanism inventory and inspection state. In the mobile captures, the tour card remains outside the canvas, the primary controls are visible, and no horizontal page overflow was recorded. The aft can, receiver area and open service passage remain visible with BODY ON.

## Remaining visible details and limits

The fine dotted roof centerline remains a **residual rendered line with no modeled slot**. The two forward deck upper centerlines have identical vertex coordinates. All 18 sampled downward rays at and immediately beside the centerline hit the deck. A raster/depth-coverage effect at the abutting, separately capped panels is a plausible explanation; the precise GPU cause was not isolated. No speculative material offset, masking strip or geometry change was added to hide it.

The small rectangular roof tab is separate from that line. It is the unchanged frozen `DORSAL_LONGERON`, whose top at `Y=1.595` projects about 19.5 mm above the preserved deck near its front end at `Z=4.55`. The dark lower prow/chine transitions are consistent with the inset return/belly faces and their shading. All 15 sampled frontward rays hit authored BODY surfaces. These samples support the local interpretation; they do not establish continuous enclosure or clearance everywhere.

BODY OFF still exposes the mechanism. BODY SECTION and PROP SECTION retain the explicit inspection behavior, including ghosted surfaces. The aft 720 mm service slot and open stern remain intentional. The side cavity aft of the local forebody return has not been filled. The close top framing crops the very aft can tip; the separate stern views cover that area.

The motion images are samples taken during actual playback, not an every-frame recording. Pose snapshots precede screenshots while motion is running, so their recorded `machineT` values are nearby sample values rather than an exact pixel-frame timestamp. No performance, universal absence-of-flicker, native Godot, structural or authority claim follows from these images.

## Capture harness correction

The original candidate capture completed all 50 images but reported failure during the final comparison with the saved prior-viewer JSON. The live Babylon lighting object included absent properties as `position: undefined` or `groundColor: undefined`; JSON serialization had omitted those properties in the saved baseline. The actual light values were identical.

The exact failed report and executing capture script were retained. The recovery command compared the saved JSON-normalized records, verified all 32 pairs and image hashes, and wrote the separate `review-validated.json`. No pixels or runtime state were changed and no scene was rerendered for this correction. The reusable review tool now normalizes these optional properties before comparison.

Both capture reports retain the hashes read at capture start. The capture code also verified end-of-run source equality before entering the failing baseline comparison, but did not persist a separate end-of-capture hash map. Final packaging independently reconfirmed all 75 candidate runtime files against the saved capture-start map, with no extra runtime files; consult the evidence-root validation record for that binding.

## Scope, checks and reproduction

Changed by this visual-review subtask: the new `tools/review-body-surface.mjs` and new files under `evidence/body-surface-01/` only. The geometry, revision metadata, UI and independent body-surface verifier were supplied by the other task owners. Existing accepted evidence was not overwritten.

Checks completed for this subtask: 32 saved static comparisons passed; both playback runs reached both endpoints; four orbit-state and four mobile-layout checks passed per variant; the source-only reproduction matched all 18 roof and 15 lower-nose probe records exactly. `node --check tools/review-body-surface.mjs` and `git diff --check` passed. The first reconstruction of the small reproduction helper retained four ray hits instead of the original diagnostic's two; matching that retention limit resolved its comparison failure without changing geometry or the retained probe evidence.

Authority participation: **none**. Initial browser provenance used only `getBuildInfo()` and `getInspectionState()`. Setting canonical poses later exercised the existing frozen runtime certificate path; this review introduced no authority, registration, physical geometry or proof semantics and did not invoke an authority evidence writer.

Reproduce captures into fresh directories while serving the prior viewer and candidate from separate source trees:

```sh
node tools/review-body-surface.mjs --label prior-3780e02 --url http://127.0.0.1:5196/ --source-root /path/to/prior/explore/body-shell-03 --output /tmp/new-body-prior
node tools/review-body-surface.mjs --label candidate --url http://127.0.0.1:5195/ --source-root . --output /tmp/new-body-candidate --baseline-report /tmp/new-body-prior/review.json
```

The one-time retained-record recovery used:

```sh
node tools/review-body-surface.mjs --validate-from evidence/body-surface-01/candidate/review.json --baseline-report evidence/body-surface-01/baseline/review.json
```

That recovery refuses to overwrite its existing output. To reproduce the source-only seam probes without opening a browser or changing evidence:

```sh
node evidence/body-surface-01/candidate/reproduce-seam-probes.mjs
```

Commands above are relative to `explore/body-shell-03/`. The independent topology, palette, frozen mechanism and browser suites are reported by their task owners in the overall handoff; this visual note does not substitute for those checks.
