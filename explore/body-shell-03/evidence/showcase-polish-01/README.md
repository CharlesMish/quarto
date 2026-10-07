# Showcase polish 01 — evidence

Presentation-only. Authority participation: **none**. No frozen evidence was
regenerated or promoted. See [the handoff note](../../../../docs/QUARTO_SHOWCASE_POLISH_01.md).

## Images

All captures are headless Chromium 153 with SwiftShader, so they show layout,
framing and relative colour, not real-device lighting quality or motion feel.
"Before" is accepted `main` at `b4c6715`; "after" is this branch.

- `desktop-before-after.png` — 1600×900, lite lighting (`?lighting=lite`),
  as loaded (SPREAD) and after dragging the slider to DRIVE.
- `phone-before-after.png` — 390×844, lite lighting, same sequence.
- `studio-materials-before-after.png` — 960×600, studio lighting with SSAO,
  DRIVE after FIT on both builds (same radius and target), for the palette and
  light rebalance.

The new link-preview image is `public/og-image.png` (1200×630, studio lighting,
DRIVE, UI hidden, wordmark added afterwards).

## Validation

Environment: the standard Playwright browser download is blocked here, so the
suites ran with a local, uncommitted launch override pointing Playwright at
Chromium 153 (SwiftShader), against the Vite dev server. Project dependencies
and `playwright.config.ts` are unchanged. The previous review
(`docs/QUARTO_PRESENTATION_REVIEW_2026-09-26.md`) used the same approach.

- `npm --prefix explore/body-shell-03 run build` (TypeScript + Vite): passed.
- `git diff --check`: passed.
- Full presentation suite (`npm test` file list, including the new
  `showcase-polish.spec.ts`): **56 passed, 3 failed** in 23.9 minutes.
  The three failures also fail on unmodified `main` in this environment,
  with identical values:
  - `camera-controls` (mouse) and `zoom-response`: 180 s test timeout under
    SwiftShader. With a longer timeout the mouse case **passes** on this branch.
  - `camera-controls` (two-touch): the 390×844 FIT radius here is
    `29.760331948281515` against the recorded `29.861646343837744`, on both
    `main` and this branch. The canvas geometry is identical on both builds
    (header 31 px, canvas 577 px), so this is an environment difference
    (most likely font metrics in the control deck), not a change in FIT.
- `zoom-response` also exposed a real regression in an earlier draft: the
  composed framing had been applied to tour stops, whose camera poses are
  recorded in `evidence/camera-controls-03`. Tour stops now keep FIT's
  distance; the reruns below cover the fix.
- The root authority suite was not run; no root source, test, dependency or
  configuration file changed.

### Reruns after keeping tour stops on FIT's distance

- `showcase-polish.spec.ts` + `viewer-readability.spec.ts`: **21 passed**
  (12.3 minutes), including the tour and FIT projection tests.
- `zoom-response.spec.ts` with a long timeout: the desktop context, including
  every recorded programmatic preset and tour pose, now **passes**. The test
  then stops at the touch context on the same environment-dependent
  `29.760331948281515` vs `29.861646343837744` FIT radius, at the same line,
  on both this branch and `main`.

Net: in this environment the branch and `main` produce identical results on
every camera baseline, and the only remaining failures are the shared touch
radius difference and SwiftShader timeouts. Re-running `npm test` with the
standard Playwright browser (as for the recorded baselines) should confirm.
