# Quarto showcase polish 01

Presentation-only polish of the public viewer ahead of a Babylon.js community
showcase submission. Branch `claude/showcase-polish` from accepted `main` at
`b4c6715`. Authority participation: **none**.

The changes target what a first-time visitor sees in the first ten seconds:
the link preview, the first frame, the first motion, and the words on screen.

## What changed

**Page identity.** The served HTML now carries the same title the app sets at
runtime (`Quarto / Mechanism viewer`), so link unfurlers no longer show
`MT1-BODY-SHELL-03 / Non-Authoritative Concept`. Added a meta description,
Open Graph/Twitter card tags, `public/og-image.png` (1200×630, studio-lit
DRIVE render with a wordmark) and `public/favicon.svg`. The canvas label
describes the view instead of naming the concept ID.

**Load-time showing.** A fresh visit plays one Show-speed SPREAD → DRIVE →
SPREAD pass after about a second, holding briefly at DRIVE, then stops. It
uses the ordinary presentation pose path (the same one PLAY uses) and never
certifies. Any pointer, wheel or key input ends it; PLAY/Space pauses the leg
in progress. It is skipped when `prefers-reduced-motion` is set, when
`navigator.webdriver` is true (tests and evidence capture keep the paused
start that `playback.spec` asserts), and with `?intro=0`. `?intro=1` forces it.
`presentation.getState()` gains `intro: boolean`.

**Guided framing.** `src/presentation/frameVehicle.ts`:

- A *screen shift* (ArcRotateCamera `targetScreenOffset`, kept as a constant
  fraction of the view as the radius changes) centres the projected machine.
  Previously the bounding-box centre was centred, which left the machine low
  with empty space above it.
- *Composed framing* solves the radius from projected corners so the machine
  fills about 84% × 76% of the canvas, instead of FIT's conservative distance.
  Used on load, when playback settles, and on resize while guided framing is
  on. Tour stops keep FIT's distance, because their camera poses are pinned in
  `evidence/camera-controls-03`; they gain only the centring shift.
- When playback or the slider comes to rest on SPREAD or DRIVE, the camera
  glides (0.9 s, instant under reduced motion) to the framing for that pose.
  DRIVE no longer stays at SPREAD's distance; on a phone it comes noticeably
  closer. Orbit, pan, zoom and camera presets hand the camera to the visitor
  and stop all guided framing until FIT or the tour. After FIT or the tour,
  endpoint glides use FIT's distance rather than the composed one.
- **FIT keeps its exact radius and target** (`fitVisibleVehicle` is untouched)
  and only gains the centring shift. The owner's camera-response baselines in
  `camera-controls.spec` and `zoom-response.spec`, which pin FIT's and the
  tour's radius and target, are unchanged.

**Materials and light (Hush Basin palette, studio/lite tiers only).** Folio
diffuse 0.86 → 0.78 and emission 0.12 → 0.08 so the slabs keep facet shading
and stop dominating the frame. Joint 1.08 → 1.42 and rail 1.0 → 1.3 so roots,
catches and rails read against the hull (hue unchanged; no amber was
introduced, to keep the Hush Basin mapping). In studio/lite, the fill
(hemispheric) light runs at 0.85× and the sun at 1.15× of their original
intensities; directions are unchanged. Study views, the flat tier and the
accepted palette are unchanged, so diagnostic colours and historical
evidence renders read exactly as before. `materials.ts` is untouched.

**Public copy.** The readout shows `SPREAD → DRIVE · 60%` for the canonical
sequence; the exact value and mode are its tooltip, and preview modes still
show `MACHINE … · MODE …`. Details & help explains BODY ON/OFF and the
sections in plain language; revision IDs, the concept/status line, the
archive hash and the H1 note sit in a collapsed **Provenance** disclosure
(the `.eyebrow` and `.provenance` text is unchanged). The folio preview note
no longer says "(legacy/source: book) … noncanonical".

## Changed files

- `explore/body-shell-03/index.html`, `public/favicon.svg`, `public/og-image.png`
- `explore/body-shell-03/src/main.ts`, `src/ui/createUI.ts`, `src/style.css`
- `explore/body-shell-03/src/scene/createScene.ts`
- `explore/body-shell-03/src/presentation/frameVehicle.ts` (new),
  `palette.ts`, `lighting.ts`, `viewerState.ts`
- `explore/body-shell-03/tests/showcase-polish.spec.ts` (new), `package.json`
  (adds it to `npm test`)
- `README.md`, `CHANGELOG.md`, this note, and
  `explore/body-shell-03/evidence/showcase-polish-01/`

Frozen paths named by the freeze guard (`src/design`, `src/machine`,
`src/math`, `src/verify`, `h1Presentation.ts`, `primitives.ts`,
`materials.ts`, root `package.json`) are unchanged.

## Validation

See [the evidence record](../explore/body-shell-03/evidence/showcase-polish-01/README.md).

## Remaining unknowns and decisions

- **FIT versus guided framing.** FIT now zooms *out* slightly from the load
  framing, because it keeps its pinned, conservative distance. The alternative
  is to make FIT use the composed framing too, which means re-baselining the
  start state recorded in `evidence/camera-controls-02/baseline/`. That is an
  owner decision, so it was not done here.
- **The REAR camera preset looks from the bow toward the stern** (`alpha = π/2`)
  and crops the hull at the canvas edge. It is also used by historical capture
  scripts, so it was left alone. A separate stern-view preset would be the
  low-risk fix.
- **Real-device check.** All renders here are SwiftShader (headless). Intro
  timing, glide feel, studio SSAO with the rebalanced intensities, and phone
  lite lighting should be checked on actual hardware. The lite tier showed
  faint concentric banding on large folio faces under SwiftShader; it may be
  renderer-specific. If it shows on a phone, `camera.minZ = 0.005` (depth
  precision) and the 1024 shadow map are the first suspects.
- The intro is skipped under `navigator.webdriver`. Owner-run recording tools
  that drive a browser will see the paused start unless they pass `?intro=1`.
