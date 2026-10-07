# Showcase corrections 02 — interrupted glide and orientation follow-up

Implementation validation only; **independent re-review is pending**. This local
follow-up addresses the review of `f1a96ef0a85bb924c220b85bcb421755d3d27afd`
(implementation `01794731e169e6689008686aa4b87f18a07e2f36`). No push, PR update,
merge or deployment occurred. Authority participation: **none**.

## Corrections

Only production file changed: `explore/body-shell-03/src/scene/createScene.ts`.

- Invalidate an endpoint camera glide when the canonical pose changes. A quick
  Game reverse and pause must not later finish the obsolete DRIVE composition.
- Apply the visible-pose guard on the terminal glide frame, after its final
  target/shift is applied, even though the easing state has just been cleared.
- Derive framing and screen-shift aspect from the active render buffer. During
  orientation changes, a ResizeObserver can run after a render; the new CSS
  dimensions must not be used with the old projection. Existing resize/refit
  behavior still applies once the render buffer changes.

No architecture, authority, material/light, input-gain, preset, or fixture changes.
Tests changed: `explore/body-shell-03/tests/showcase-polish.spec.ts`, adding five
regressions and render-size metadata to the existing frame observer. No product
API or timing hook was added for testing.

## Checks

- Presentation TypeScript/Vite build: **PASS** (existing chunk-size warning).
- Five new regressions: **5/5 PASS**; **699 rendered frames, zero clipped**.
  PLAY and REVERSE each start during the DRIVE glide, then PAUSE in the wide
  region below t=0.2, at 390×844, 844×390 and 1280×720. The two orientation tests
  each perform 12 rotations, once at rest and once during ordinary reverse.
- Negative control on unmodified reviewed production source: **4/5 failed**.
  Persistent portrait/desktop clipping and both rotation probes reproduced;
  landscape happened to pass that run. Before traces contain 83 clipped frames
  among 520 sampled. The independent review separately reproduced landscape.
  The before run stops each failing test at its first assertion, so before and
  after totals cover different numbers of PLAY/REVERSE subcases.
- Reviewer's copied probes, with paths/output changed only: **zero clipped** in
  all three interrupted-glide captures (70, 70 and 71 frames), and zero among
  72 rotation frames covering 12 changes. No page errors; served source-map
  identity matches local source. Actual vertices are also recorded.
- Existing preservation checks: **25/25 PASS** (10.6m);
  tour and FIT: **2/2 PASS** (56.4s). Together with the five new checks,
  **32 targeted tests passed** on the final source.

The prior candidate's 75-test public suite and 105-test authority suite passed;
those are historical results, not claims about a new full-suite run. The root
suite is not repeated for this follow-up: root source/tests and every frozen
path remain byte-identical, as recorded in `invariants.json`. This follow-up
runs targeted presentation, input-response, appearance, FIT and tour checks.

## Evidence and reproduction

`before-tests.json` and `after-tests.json` are raw Playwright JSON outputs.
`traces/` extracts their inline frame attachments; `targeted-summary.json`
summarizes each scenario. Before failure screenshots are preserved alongside
those traces. `captures/` contains the copied review probes' complete records,
actual-vertex bounds, lightweight identity/certificate state and four final-page
screenshots. Original review files were read only at:

`/Users/cmish/Documents/Codex/2026-10-07/task/independent-evidence/`

Consulted: `quarto-pr13-independent-review.html`, `deep-glide.mjs`,
`orientation-probe.mjs`, AGENTS.md, README, current-state/nomenclature contracts,
prior corrections evidence, framing implementation and relevant tests.

From `explore/body-shell-03`, with supported Node 24 on PATH and the isolated
local viewer on strict port 5194:

```sh
npm run build
MT1_BASE_URL=http://127.0.0.1:5194 ./node_modules/.bin/playwright test tests/showcase-polish.spec.ts --workers=1 --grep 'interrupted DRIVE|orientation transitions' --reporter=json
node evidence/showcase-corrections-02/deep-glide.mjs
node evidence/showcase-corrections-02/orientation-probe.mjs
MT1_BASE_URL=http://127.0.0.1:5194 ./node_modules/.bin/playwright test tests/showcase-polish.spec.ts tests/camera-controls.spec.ts tests/zoom-response.spec.ts --workers=1 --grep-invert 'interrupted DRIVE|orientation transitions'
MT1_BASE_URL=http://127.0.0.1:5194 ./node_modules/.bin/playwright test tests/viewer-readability.spec.ts --workers=1 --grep 'tour visits|fit camera is'
```

The copied probes write their own captures directory. Do not rerun evidence
writers over this record unless intentionally producing a new record.

## Limits and remaining work

Chromium 151.0.7922.34 with SwiftShader, installed default Playwright launch and
isolated contexts; no owner browser profile, new installation or browser/system
settings changes. Existing local viewer reused. Browser probes finished before
input-gain checks began. No hardware or timing/performance claim is made.

Emulated orientation/touch does not establish physical-phone comfort or the
paint perceptibility of the old transient resize frame. A separate reviewer
must recheck the new exact commit. No further polish is proposed. Stop after
these two findings pass re-review; any push/merge/deployment needs follow-up.
