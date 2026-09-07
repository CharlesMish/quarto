# Quarto reconciliation evidence

Candidate: `feature/quarto-reconciled-viewer`, combining accepted main `e56a4c0`
and body/viewer branch `9540453`. [Handoff](../../../../docs/QUARTO_RECONCILIATION_01.md).
Authority participation: **none**.

## Validation

- Root build and shell build: passed; existing large-bundle warnings remain.
- Full shell suite: 15 passed, one new test failed because its expected station
  inventory was incorrectly 24. The actual five pieces × four stations is 20.
  All geometry/material comparisons preceding that assertion passed.
- Corrected FO1 case: one passed, including recess hierarchy in both palettes.
  Together these runs cover all 16 shell cases; the complete suite was not repeated.
- Fresh fit: 101 poses, zero defects. Expected-close forward pocket gutters
  remain approximately 32.6 mm; this is not a collision exemption.
- Surface verification: 38 meshes, 648 triangles; topology/normal/opacity and
  bounded-join checks passed. Historical pre-repair negative fixture still fails
  as expected.
- Accepted FO1 comparison: 20 station meshes match coordinates within 1 μm;
  all 38 mesh material assignments and diffuse/emissive/specular terms match.
- Current BA1 tests: two passed.
- Existing 103 root regressions: reused, not rerun. `source-audit.json` records
  unchanged original root source/tests and overlapping dependency versions and
  integrities; BA1 is the only new root test file. Frozen scopes match accepted
  main exactly. Prior raw root log remains in `../viewer-01/validation/`.

Raw logs and JSON outputs are under `validation/`. Initial failures are retained:
incorrect test inventory, and a visual harness call corrected from `setPalette`
to `presentation.setPalette`. Neither required a runtime change.

## Visual evidence

`visual/index.html` presents fresh captures of the overview, both FO1 station
cameras and open stern, at both endpoints in both palettes. `visual/review.json`
binds captures to source SHA-256 values and records lightweight initial
provenance before intentional posing. Reproduce from the shell package with:

```sh
node tools/review-reconciliation.mjs /tmp/NEW-QUARTO-REVIEW http://127.0.0.1:5197/
```

These are headless Chromium images; they do not establish real-device speed,
native Godot fidelity, whole-machine watertightness or physical volume rights.
Parent evidence is preserved unchanged. The handoff lists changed files and
remaining limitations. `manifest.json` hashes this new evidence bundle.
