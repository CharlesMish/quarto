# Quarto palette and tour-camera review

Archive note: this review predates the final tour cameras and mobile layout.
This directory retains its JSON results, material checks and two negative
images. The final matched image set is in `../final-review/`; the corrected
integrated tour and its source hashes are in `../tour/`. The review below is
preserved as the development record, including its then-pending actions.

The Hush Basin palette keeps shaded turquoise midtones, darker folio undersides
and small mint details. The fold image distinguishes the returning outer leaves;
the DRIVE image preserves the stepped front/rear hierarchy and proud packing.
No palette adjustment was needed after the live browser review. Existing broad,
coplanar folio faces remain visibly planar: this material task adds no surface
geometry, bevel or texture detail.

Palette source SHA-256:
`4842c2f84b2db322b81d2386f61c6e2dc38163653ad12a8df8530d171165d71e`.

Changed source files owned by this review: `src/presentation/palette.ts`,
`src/presentation/README.md`, and `tools/verify-palette.mjs`, all beneath
`explore/body-shell-03/`. The source palette JSON was supplied by the root agent.

## Completed checks

- Standalone strict TypeScript check passed for the palette module.
- `node explore/body-shell-03/tools/verify-palette.mjs` passed all 11 isolated
  NullEngine groups: source identity/color preservation, cached clone sharing,
  diagnostics exclusion, transparency/culling/H1 depth bias, independent animated
  roles, direct/reverse/repeated posing, finite clamping, 100-toggle allocation
  stability, exact restoration and idempotent disposal.
- Browser A/B at SPREAD, fold 0.24, DRIVE and legacy stern camera preserved the
  complete render inventory and lightweight inspection state at every toggle.
  No JavaScript errors occurred. Lighting was unchanged within each pair.
- Additional external stern A/B preserved those same invariants.
- Two proposed tour cameras were captured at 1440×960 and 390×844, at canonical
  t=0.94 and t=1.0, with the tour card open and BODY ON. No JavaScript errors.
- Syntax and whitespace checks passed for the new module and verifier.

Initial provenance used only `getBuildInfo()` and `getInspectionState()`.
Subsequent intentional canonical pose commands invoked the existing runtime
certificate path; no authority/evidence writer was used. Source tests were
running concurrently, so these captures support no timing claim.

## Negative observations and disposition

The legacy `propSeated` camera looks through nearby BODY ON geometry and is a
poor tour endpoint, in both palettes. That finding is preserved in the original
`stern-*` images. External cameras resolve the geometric occlusion at desktop:

- Handover: alpha -1.12, beta 1.15, radius 8.8, target [0, 1, -4.3], t=0.94.
- Seated: alpha -1.12, beta 1.18, radius 6.5, target [0, 0.9, -5.5], t=1.

Both work clearly at 1440×960 with the tour card at the left. At 390×844 the
300px-wide card is 291–309px high and covers much of the rear folios, core and
locks. Increasing radius with the current aspect formula does not solve this.
The portrait captures are negative review evidence, not a mobile-tour pass.
The root agent is handling the tour layout/camera correction separately.

An earlier capture attempt was interrupted by a concurrent Vite/HMR reload.
It established no palette failure. The completed restarted review is recorded
in `browser-review.json`. No previous accepted evidence was overwritten.

Evidence consulted: MT1 README/current state/nomenclature/AGENTS, accepted H1
and BODY-SHELL-03.1 reports/materials, bridge dca5887 palette and images, native
candidate 0b0cc10 handoff and browser images. Added evidence is confined to this
new temporary review directory; root integration will decide permanent copies.

**Authority participation: none.** No geometry, transforms, physical role,
registration identity or proof semantics changed. Native Godot rendering and
gameplay remain outside this review. The material interpretation is specific
to the existing Babylon StandardMaterial renderer and lighting.
