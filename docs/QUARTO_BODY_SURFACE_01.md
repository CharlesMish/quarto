# Quarto body surface refinement

BODY-SHELL-03.2 is a presentation candidate on
`feature/quarto-body-surface-refinement`. It carries viewer commit `3780e02`
forward from accepted `main` (`9321de4`) and repairs the existing body shell's
surface rendering and joins. The Hush Basin palette, four folios, seven body
masses and frozen transformation remain the reference for this work.

## Inspect the candidate

```sh
npm --prefix explore/body-shell-03 run dev -- --port 5195 --strictPort
```

Open `http://localhost:5195` in the Windows browser when serving from WSL.
Normal BODY ON is solid in both palettes. BODY SECTION opens the starboard side;
PROP SECTION explicitly ghosts the aft shell and can. BODY OFF exposes the
frozen inspectable mechanism. The existing Fit, tour, picking and transformation
controls retain their meanings.

`window.__MT1.getBodyConceptState().surfaceRevision` identifies this surface
candidate as `BODY-SHELL-03.2`. The legacy `conceptId` remains
`MT1-BODY-SHELL-03`. Use `getBuildInfo()` and `getInspectionState()` for lightweight
frozen-build and current-state provenance. These reads request no certification.

## Diagnosed defects and repair

The old shell used alpha-blended materials at 0.88, 0.90 and 0.92 opacity, with
back faces visible. The palette faithfully inherited these settings. Normal
viewing could therefore expose overlapping and rear surfaces even with every
inspection section disabled.

The isolated geometry audit also found inward-facing mirrored panels, four
uncapped/open dorsal strips, eight zero-area triangles in four pocket webs,
smoothed normals across intended facets, a 20 mm deck/chine slit, and additional
separations at the prow's deck, belly and forward-chine interfaces.
The earlier zero-defect fit result concerns moving-part clashes; it does not
test those rendering and topology properties.

The material repair uses alpha 1 and automatic transparency classification.
Explicit `MATERIAL_OPAQUE` would suppress the existing per-mesh visibility
ghosting in the installed Babylon version; automatic classification keeps normal
meshes opaque and allows the chosen PROP SECTION meshes to blend at visibility
0.12. Color values remain unchanged.

Mirrored winding is corrected only on the affected mesh families. Body-specific
flat normals give each facet its own lighting direction. Four dorsal slabs now
have inner returns and end caps; their lower faces meet the chine while their
original upper contour stays fixed. Each of the four pocket webs uses one apex
and six nondegenerate triangles.

The prow now meets the deck and belly. A local bottom flange follows the existing
belly taper from `z=4.547419…`, and a short forward-chine return begins at
`z=4.95`. This closes the nose interface while retaining the narrowing prow and
outer envelope. The aft 720 mm center opening, open stern, pocket reach and proud
folio packing remain. Shared primitives and all frozen mechanism source are
unchanged.

## Validation and evidence

All 15 supported shell cases have passing executions across the broad run and
the final focused rerun. Runtime source stayed fixed throughout validation.
Existing evidence is preserved; new results live in
[body-surface-01](../explore/body-shell-03/evidence/body-surface-01/README.md).

| Check | Result |
| --- | --- |
| Root and shell production builds | PASS; existing large-bundle warnings only |
| Broad shell suite | 14 passed, one nose-probe harness failure, 5.8 min |
| Final focused fit and surface cases | 4 passed, 1.3 min; corrected edge sampling plus explicit culling/can-blending assertions |
| Body topology and materials | PASS; all 38 meshes, 648 triangles, outward/closed/flat/nondegenerate; both palettes and all section combinations |
| Surface contacts | PASS; 72 probes, maximum measured gap `1.141e-7 m`, within the unchanged `2e-6 m` tolerance |
| Independent prior-viewer negative check | EXPECTED FAIL; detects the original open decks, degenerate webs, inward/smoothed surfaces, gaps and unwanted blending |
| Fresh body fit | PASS; 101 poses, triangle–OBB, zero defects, `participatesInAuthority: false` |
| Frozen source/evidence | PASS; 473 existing files checked against accepted main, 526 against the prior viewer; no changed frozen inputs |

The [before/after gallery](../explore/body-shell-03/evidence/body-surface-01/candidate/comparison.html)
contains 32 matched pairs across both palettes. The saved-state comparison
confirms identical mechanism inventories, poses, cameras and lighting in every
pair. Actual forward/reverse playback reached both endpoints; orbit and mobile
tour checks completed without browser errors. See the
[forebody comparison](../explore/body-shell-03/evidence/body-surface-01/candidate/forebody-contact-sheet.png)
and [inspection comparison](../explore/body-shell-03/evidence/body-surface-01/candidate/inspection-contact-sheet.png).

Validation-harness issues are retained in the evidence. The visual comparison
initially treated omitted JSON properties differently from live `undefined`
properties; saved-state revalidation normalizes those properties without changing
any image or runtime state. A nose-edge probe initially sampled nominal decimal
coordinates just outside the stored Float32 edge, selecting a farther triangle.
Both panels' endpoints are identical and within 0.23 µm of their nominal
coordinates. Interpolation on that verified edge gives zero gap at all six
edge samples; the nominal-coordinate and contact tolerances are unchanged.

Initial isolated material assertions also needed Boolean normalization because
Babylon can return falsy `undefined` for an opaque mesh. The final checks pin the
actual opaque/ghost classification. The first passing fit's in-memory attachment
was not persisted by the line reporter, so the final focused run saved an
explicit JSON file and repeated that fit case only. Other passing viewer cases
were not rerun. An initial sandbox child-process launch failure is retained;
the authorized launch succeeded.

The full root regression previously passed all 103 tests in 1.1 h at `3780e02`.
This task reuses that result after verifying root source and tests are
byte-identical. It did not rerun the hour-long root suite for a body-only change.
The new checks exercise panel orientation, closure, seams and transparency in
addition to the existing moving-part fit assertions.

Evidence consulted: repository operator/nomenclature/current-state records,
BODY-SHELL-03 completion and 03.1 pocket correction, existing fit report and
tests, viewer 01 source-bound review, and the isolated planning audit of all
38 body meshes. Temporary opacity-only browser probes retained an absent STALE
certificate and confirmed that translucency contributed to the appearance.

## Changed files and boundaries

Paths below are relative to `explore/body-shell-03/` unless otherwise noted.

- `src/scene/bodyShellConcept.ts` and new `bodyShellGeometry.ts`: body materials,
  corrected winding, closed slabs, clean webs and bounded forebody joins.
- `src/bodyConceptInfo.ts`, `src/scene/createScene.ts`, `src/vite-env.d.ts`:
  additive surface-revision identification.
- `src/ui/createUI.ts`: provenance copy explaining the solid body and explicit
  sections.
- `package.json`, `tests/body-shell-03.spec.ts`, `tests/viewer-readability.spec.ts`
  and new `tests/body-surface.spec.ts`: surface validation and preserved viewer
  regressions.
- New `tools/verify-body-surface.mjs`, `tools/review-body-surface.mjs` and
  `evidence/body-surface-01/`: independent geometry/material checks and matched
  visual review.
- Repository `README.md`, `docs/CURRENT_STATE.md` and this handoff: candidate
  orientation and results.

**Authority participation: none.** BODY-SHELL-03.2 creates no physical, structural,
keepout, reservation or volume rights. Frozen MT1-S5HR3R1 geometry, transforms,
motion maps, registrations, proof semantics and accepted evidence remain intact.
Ordinary canonical posing and the existing fit sweep still use the unchanged
runtime certification path when stale; no authority or accepted-evidence writer
is invoked.

Remaining limits: first-pose certification cost is unchanged; H1 remains awaiting
director disposition. This is a Babylon presentation repair, not native Godot
validation. Closed individual body panels do not establish whole-machine
watertightness, and the stern and aft center opening remain deliberately open.
A faint dotted roof centerline remains visible in some close views. The two deck
halves share identical edge coordinates and all 18 adjacent seam rays hit body
surfaces, so it is not a modeled opening; the precise raster/depth cause is still
unisolated. The small separate roof tab is unchanged dorsal-longeron hardware.
Fifteen rays across the dark lower nose transition also hit body surfaces.
These observations are recorded in
[seam inspection](../explore/body-shell-03/evidence/body-surface-01/candidate/seam-inspection.json).
