# MT1-SO1 — Stern / handover ownership

Status: **PRESENTATION STUDY · RECOMMEND ACCEPT SO1**  
Date: 2026-09-02  
Package: `explore/body-shell-03/` (BODY-SHELL-03.1 + FO1 lineage)  
Source mechanism: **MT1-S5HR3R1** (unchanged)  
Authority participation: **none**

Does not start BODY-SHELL-04. Does not reopen S5 or FO1. Does not start S6. Does not design an engine cycle. Stop after SO1.

## Ownership rule

The aft chine becomes one open terminal frame: a recessed throat with an accent lintel–side–sill lip. Through that frame the frozen bay and posts stay visible, then the fixed core, then the hollow can occupying or leaving the same aperture. The frame owns the opening; it does not own the can.

chine → stern collar / throat → frozen bay / posts → fixed core → moving can

The same portal is used through the handover: STOWED frames the inactive core and empty throat; MID shows the can entering that frame; SEATED / RELEASED show the can having passed it, with capture still readable forward of the lip. SPREAD uses the same frame. It is not a DRIVE-only cap.

## Diagnosis of the current stern (BODY-SHELL-03.1 + FO1, before SO1 geometry)

Inspected: DRIVE 3/4, rear DRIVE, side DRIVE, BODY 3/4, BODY OFF rear / 3/4, PROP STOWED / MID / SEATED / RELEASED, PROP SECTION, SPREAD 3/4 and rear, and the purpose-built `so1Throat` close-up. Construction and stations were read from `bodyShellConcept.ts`, keel/bay parameters, and the FO1 record.

Stations that matter:

| Station | Fact |
| --- | --- |
| Rear folio / chine high point | `P.rl.z = -1.88`, gunwale Y = 2.16 |
| Bay | `z = -1.70 … -4.80`; `AFT_POST_*` at `z = -4.80` |
| Capture / lock review | cameras target `z ≈ -4.57`, just forward of the posts |
| Can stowed | center `z = -3.25`, length 2.55 m, section 1.00 × 0.82 m |
| Can seated | center `z = -5.80`; occupies `z ≈ -7.08 … -4.53` |
| Presentation collar (before) | `COLLAR_Z = -5.98`; Z depth **150 mm**; whole volume accent |

### A. What currently makes the stern feel owned by Quarto

The open stern is already the right idea. The aft chine does drop into a collar. FO1 correctly reserved bronze accent for opening frames, including this collar. BODY OFF still shows the real load path: bay walls, aft posts, rails, fixed core, hollow can, registers, locks, shoes. PROP SECTION still ghosts the can and aft shell so the handover stays inspectable. None of that should be replaced by a finished nacelle.

### B. What currently makes the can feel bolted-on / appliance-like

The weakness is **frame continuity and throat depth**, not missing mass and not “the engine is ugly.”

1. **The collar was a 150 mm hoop around the seated can’s mid-body**, about 1.2 m aft of the posts and capture. It read as a test-fixture ring, not as the chine becoming a portal.
2. **The whole collar was accent.** After FO1 that same bronze is the folio-station lip language. A jewelry ring around a teal can is appliance-mount hardware, not a terminal body frame.
3. **There was no recessed throat.** Inner faces were the same bronze volume as the outer hoop.
4. **Chine, deck, and collar abutted at one plane** (`COLLAR_Z`) instead of the last chine facet becoming the frame. The hull stopped; a hoop started; the can continued ~1.1 m aft of that hoop.
5. **Sectional hierarchy was timid** (lintel 100 mm, sill 80 mm). Thickening toward the can would be a sleeve. That remains rejected.

This is not a camera-only failure. The stock REAR / PROP cameras already told the same story. `so1Throat` is a review lens, not a substitute for a frame.

### C. What must remain optically exposed

Fixed core; hollow translating can; can leaving the bay; can reaching the handover / capture region; registers, tongues, rails, locks, shoes; aft posts and bay walls; open stern in SPREAD, STOWED, and DRIVE. PROP SECTION meaning stays: ghost the can and aft shell, keep locks readable.

### D. Which weakness it is

**Frame continuity and throat depth**, with a secondary **value-hierarchy** error (accent used for the whole hoop). Not collar X-section into the can, not chine height, not folio stations, not a missing eighth mass, not a boat-tail.

A no-geometry result was considered. FO1 already gave the collar accent; that was not enough. The hoop was still too short and too uniformly bronze to read as the chine’s terminal frame.

## Exact bounded changes

Presentation-only, in `explore/body-shell-03/src/scene/bodyShellConcept.ts`. No eighth mass. Same conceptual mass: **open stern collar**. FO1 dock-face X unchanged. Frozen root / can / core / posts / bay walls untouched. Aft face of the collar not moved further into the can stroke.

1. **Forward throat, not an aft boat-tail.** Existing collar Z span 150 mm → 350 mm by deepening **forward** only (`COLLAR_THROAT_Z = 0.26` plus a 90 mm lip). Aft face stays at `COLLAR_Z - 0.05`. The can still exits the frame; the body does not follow the stroke.
2. **FO1 lip / face recipe, used once at the stern.** The same collar mass splits into a darker recessed throat (`pocket` value: `COLLAR_SIDE` / `LINTEL` / `SILL`) and an accent opening lip (`COLLAR_*_LIP`). Accent is no longer a hoop around the can.
3. **Chine and dorsal deck terminate at the portal’s forward face** so the last facet becomes the frame instead of running through a timid ring. Ventral hull continues to the sill so the belly still meets the opening.
4. **Section away from the can only.** Lintel top 1.36 → 1.40 (up into the deck). Sill bottom 0.18 → 0.12 (down toward the belly). Opening toward the can is unchanged: inner X ±0.61 m, opening Y 0.26–1.26 m.

The new `*_LIP` meshes are a segmentation of the existing seventh mass so the opening can render as a faceted frame. They are not a new body idea.

## What was deliberately NOT changed

- Frozen MT1-S5HR3R1 geometry, transforms, IDs, certificates, gates.
- Can stroke, fixed core, aft posts, bay walls, rails, locks, shoes, registers, tongues.
- FO1 station family, dock-face X, 70° haunch, proud dock, front/lower vs rear/higher folio relationship.
- BODY OFF mechanism. Before/after BODY OFF PNGs are byte-identical in size and show the same machine.
- Seven-mass language. No eighth mass, nacelle, boat-tail, intake, nozzle, turbine, or closed stern.
- Can material / color. The teal can remaining visually unusual is desirable.
- Folio stations, utility professions, cockpit / ground / aero work, S6, BODY-SHELL-04.

## Before / after evidence

`explore/body-shell-03/evidence/so1/before/` and `.../after/`. Review camera `so1Throat` is inspection-only (starboard-aft into the collar).

| View | Before | After |
| --- | --- | --- |
| DRIVE 3/4 | `so1-before-drive-three.png` | `so1-after-drive-three.png` |
| Rear DRIVE | `so1-before-drive-rear.png` | `so1-after-drive-rear.png` |
| Side DRIVE | `so1-before-drive-side.png` | `so1-after-drive-side.png` |
| Throat / collar close-up | `so1-before-throat.png` | `so1-after-throat.png` |
| PROP STOWED | `so1-before-prop-stowed.png` | `so1-after-prop-stowed.png` |
| PROP MID | `so1-before-prop-mid.png` | `so1-after-prop-mid.png` |
| PROP SEATED / DRIVE | `so1-before-prop-seated.png` | `so1-after-prop-seated.png` |
| PROP RELEASED | `so1-before-prop-released.png` | `so1-after-prop-released.png` |
| PROP SECTION | `so1-before-prop-section.png` | `so1-after-prop-section.png` |
| SPREAD 3/4 and rear | `so1-before-spread-*.png` | `so1-after-spread-*.png` |
| BODY OFF 3/4 and rear | `so1-before-body-off-*.png` | `so1-after-body-off-*.png` |

PROP SECTION meaning is preserved: can and aft shell ghost; locks stay readable. SPREAD uses the same portal; the empty throat is a frame around a stowed mechanism, not a broken hole.

## Fit result

`explore/body-shell-03/evidence/so1/so1-fit-report.json`

- method: `triangle-obb`
- samples: 101 (`ΔmachineT = 0.01`)
- defects: **0**
- `participatesInAuthority: false`
- pass: **true**
- FO1 dock-face X unchanged: front ±0.84 m, rear ±0.90 m
- front face gutter: 33 mm (readability)
- rear X-projection gutter ~0 (no 3D triangle intersection)

`npm --prefix explore/body-shell-03 test` — isolation and presentation-fit passed.  
`npm --prefix explore/body-shell-03 run build` — TypeScript + Vite production build passed.  
`capture:so1` before/after and `dump:so1-fit` passed.

Canonical root `npm test` was not required (no `src/` change).

## Reject list

Tempting changes that would over-own or hide the mechanism:

- Move the collar aft to hug the seated can (follows the stroke; makes a nacelle).
- Close or cap the stern; surround the can in a fake engine cowling.
- Hide the spigot, receiver, locks, shoes, registers, tongues, or rails.
- Make the can flush with the body.
- Add a boat-tail because vehicles usually have one.
- Thicken the whole fuselage or add an eighth body mass.
- Deepen the opening inboard toward the can (sleeve).
- Raise the stern until it outweighs the folios.
- Change can color into a generic sci-fi engine.
- Revise FO1 stations because SO1 is nearby.
- Assign a propulsion profession or start S6 / BODY-SHELL-04.

## Remaining weaknesses outside SO1

- In far DRIVE 3/4 / REAR the can still occupies a lot of the picture aft of the frame. That is the frozen stroke, not a presentation defect. The handover is supposed to stay unusual.
- `so1Throat` is close; the stock PROP SEATED / AFT PROP cameras remain the mechanical review pair.
- H1 director disposition is unchanged.
- No engine cycle, intake, or performance claim is made or implied.

## Recommendation

**ACCEPT SO1.**

A reviewer can identify the same lip–recess–sill portal at the stern without being told which meshes moved: darker throat, bronze opening lip, chine ending into that frame, can still passing through it. STOWED and SPREAD still read as an intentional open mouth, not a missing piece. BODY OFF is the same mechanism. Fit is a 101-sample pass with FO1 gutters unchanged.

The can remaining a distinct teal object inside an open frame is the correct story. SO1 fails if that story is hidden; it is not hidden here.

ONE BOUNDED REVISION would be warranted only if a director still reads the far DRIVE views as a jewelry hoop. The next legal move would be a slightly deeper forward throat or a stronger lip/throat value contrast — not reach aft, not a nacelle, not a new mass.

## Task report

- **Changed files:** `explore/body-shell-03/src/scene/bodyShellConcept.ts` (collar throat / lip, chine and deck termination); `explore/body-shell-03/src/scene/createScene.ts` (`so1Throat` review camera); `explore/body-shell-03/tests/capture-so1.spec.ts`; `explore/body-shell-03/tests/dump-so1-fit.spec.ts`; `explore/body-shell-03/package.json` (`capture:so1`, `dump:so1-fit`); this report; `explore/body-shell-03/evidence/so1/**`.
- **Tests:** `npm --prefix explore/body-shell-03 test` (isolation + 101-sample fit) passed; `capture:so1` before/after passed; `dump:so1-fit` passed; `npm --prefix explore/body-shell-03 run build` passed. Canonical root `npm test` not required (no `src/` change).
- **Evidence:** SO1 before/after set above; consulted `MT1_FO1_RESULTS.md`, `BODY_SHELL_03_COMPLETION.md`, `BODY_SHELL_03_1_POCKET_CORRECTION.md`, `evidence/body-shell-03-fit-report.json`, `docs/CURRENT_STATE.md`, `docs/NOMENCLATURE.md`.
- **Authority participation:** none.
- **Remaining unknowns / negatives:** whether a later reviewer still wants more throat depth in far DRIVE cameras (rejected here as following the can or adding mass). The open stern will remain visually unusual. That is intended.

Canonical `src/` is untouched. BODY OFF is mechanism truth.
