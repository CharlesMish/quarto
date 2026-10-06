# Quarto camera controls — final zoom adjustment

The owner found orbit and panning much better in `a3f858b` and asked for a final roughly 20–25% zoom reduction. This revision changes only two product settings: `pinchPrecision` **12 → 15** and `wheelPrecision` **40 → 50**. Both divide input by 1.25, giving 20% less radius input before the unchanged inertia cutoff. Measured settled zoom travel is **20.10–20.74% lower** across matched cases that do not hit a radius limit.

Comparison base: **a3f858bcd52cec1b4f264f58238c045ae2c5f608**, [the preview the owner tried](https://4eff0b9f-quarto.charlesmish.workers.dev/). [PR #12](https://github.com/CharlesMish/quarto/pull/12) remains a draft for owner review. [Illustrated comparison](review.html) and [compact measurements/source hash](comparison.json) accompany the raw captures.

## Measured input coverage

The primary concern is phone pinch. Chromium two-contact emulation sends the same pinch trace to both versions: an 80 CSS px starting separation changes by +24 px (zoom in) or −24 px (zoom out) over 12 steps. Desktop coverage sends wheel delta +80 and −80. A desktop trackpad's hardware gesture delivery is not separately certified.

Each version records 48 traces: 40 zoom cases (mouse/touch × Inspect/Show × standard, slower-input, near, far, far-limit × both directions), plus 8 orbit/pan preservation traces (both axes on mouse and touch in Show). Slower input uses three animation frames per pinch step instead of one; wheel remains one discrete event in both variants. Near/far start at 0.65×/1.25× fitted radius; a separate far-limit probe uses 1.35×. Two touch zoom-out traces reach the unchanged upper radius limit in both versions and are excluded from gain ratios. Every case begins with fresh pointer history. Values below are absolute camera-radius travel, in scene units, after inertia settles.

| Show, standard trace | Previous preview | Zoom revision | Reduction |
| --- | ---: | ---: | ---: |
| Wheel out | 0.480924 | 0.381159 | 20.74% |
| Wheel in | 0.480924 | 0.381159 | 20.74% |
| Pinch in | 3.526523 | 2.817595 | 20.10% |
| Pinch out | 2.569005 | 2.051734 | 20.14% |

No distance-normalized zoom behavior was introduced. The existing fixed-radius input model remains. Near/far tests establish the requested reduction for the measured traces, not hardware comfort or frame-rate performance. Baseline pinch numbers can differ from the earlier report because this study starts every gesture with fresh contact history; only matched rows from this study are compared.

## Preservation and validation

- **All 53 public-viewer tests passed on the unchanged final product source across two runs:** the 52 existing tests in `tests.txt`, then the corrected zoom regression in `zoom-test.txt`. The first full run had 52 passes and one failed test assumption: a clipped far-distance trace cannot measure a gain ratio. The failure and original test are retained in `rejected-unclipped-assumption/`; no product setting or limit changed to address it. The corrected test separately checks the clipped stop and adds an unclipped far-distance trace. Baseline capture passed separately (`baseline-capture.txt`). TypeScript and Vite build passed (`build.txt`); the pre-existing large-chunk advisory remains.
- Initial desktop and 390 × 844 touch-emulated PNGs are byte-identical. Matched orbit and pan responses remain within 0.01 radians/scene units of `a3f858b`. Existing tests retain broader profile/rate/distance coverage.
- Both input types still stop at radius **0.05** and **42** under actual zoom input. FIT recovers the same starting radius and target after zoom in and out in Show and Inspect. Body/prop presets and all six tour steps retain matching angles, radii and targets.
- Angular sensitivity, the manual-orbit adapter, pan sensitivity, inertia, playback, Show default, min/max limits, camera fitting and preset definitions are unchanged. Earlier PR phase-label and Diagnostics copy changes remain.
- Zero captured app errors. Screenshot capture uses Chromium/ANGLE SwiftShader with flat fallback lighting. Touch is emulated, not a physical phone. No physical-phone comfort, performance improvement or fresh first-impression claim.

## Files, authority and stop point

Changed product file: `src/scene/createScene.ts` only, for the two zoom settings and explanatory comment. Test changes: `tests/helpers/cameraGestures.ts` adds reverse zoom and radius-limit readings; `tests/camera-controls.spec.ts` expects the authorized gentler zoom; new `tests/zoom-response.spec.ts` measures and guards both directions, profiles, distances, fit, limits and programmatic cameras; `package.json` includes it in ordinary tests. All paths are relative to `explore/body-shell-03`.

Evidence added only under `evidence/camera-controls-03/`. Earlier evidence is historical and unchanged. Raw captures include the checkout HEAD at capture time; candidate source may be uncommitted then, so `comparison.json` records its exact product-file hash. Negative result: the first zoom test incorrectly required a 20% final-travel reduction even when both versions hit the same maximum radius. This test-assumption failure is preserved and explained above; it was not a product defect. Readable logs trim trailing terminal whitespace; their exact originals are retained as `.gz` files. The earlier rejected orbit experiment remains in `camera-controls-02/`.

**Authority participation: none.** No frozen mechanism, geometry, motion maps, proof identities, certificates, shader registrations, license, metadata or cmish.dev changes. Root authority tests were not rerun for this presentation-input-only change; public source/pose guards and Diagnostics tests passed.

The remaining review is the owner's same-phone pinch comparison. Keep this revision or leave the previous draft unchanged; no further model loop, merge, production deployment or external submission is implied. Owner follow-up is required before another tuning round or merge.

## Reproduce

Serve untouched `a3f858b` on 5188 and this candidate on 5187. From the public package:

```sh
MT1_BASE_URL=http://127.0.0.1:5188 ZOOM_REVIEW_PHASE=baseline npx playwright test tests/zoom-response.spec.ts --workers=1
MT1_BASE_URL=http://127.0.0.1:5187 ZOOM_REVIEW_PHASE=candidate npm test
npm run build
```

Without `ZOOM_REVIEW_PHASE`, ordinary `npm test` reads the recorded baseline without rewriting evidence. Never capture a baseline against the candidate server.
