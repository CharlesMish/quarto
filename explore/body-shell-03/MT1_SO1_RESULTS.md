# MT1-SO1 — Stern / handover ownership

Status: **PRESENTATION STUDY · NO PRESENTATION SOLUTION UNDER CURRENT FROZEN GEOMETRY**  
Date: 2026-09-02  
Package: `explore/body-shell-03/` (BODY-SHELL-03.1 + FO1 lineage)  
Source mechanism: **MT1-S5HR3R1** (unchanged)  
Authority participation: **none**

Does not start BODY-SHELL-04. Does not reopen S5 or FO1. Does not start S6. Does not design an engine cycle. Stop after SO1.

This file records the accepted ownership rule, the first candidate, and the **one director revision** (value contrast, plus a hair of forward throat after contrast-alone stayed quiet). It is not a second concept.

## Ownership rule

Accepted by director.

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
| Presentation collar (before SO1) | `COLLAR_Z = -5.98`; Z depth **150 mm**; whole volume accent |

### A. What currently makes the stern feel owned by Quarto

The open stern is already the right idea. The aft chine does drop into a collar. FO1 correctly reserved bronze accent for opening frames, including this collar. BODY OFF still shows the real load path: bay walls, aft posts, rails, fixed core, hollow can, registers, locks, shoes. PROP SECTION still ghosts the can and aft shell so the handover stays inspectable. None of that should be replaced by a finished nacelle.

### B. What currently makes the can feel bolted-on / appliance-like

The weakness is **frame continuity and throat depth**, not missing mass and not “the engine is ugly.”

1. **The collar was a 150 mm hoop around the seated can’s mid-body**, about 1.2 m aft of the posts and capture. It read as a test-fixture ring, not as the chine becoming a portal.
2. **The whole collar was accent.** After FO1 that same bronze is the folio-station lip language. A jewelry ring around a teal can is appliance-mount hardware, not a terminal body frame.
3. **There was no recessed throat.** Inner faces were the same bronze volume as the outer hoop.
4. **Chine, deck, and collar abutted at one plane** (`COLLAR_Z`) instead of the last chine facet becoming the frame. The hull stopped; a hoop started; the can continued ~1.1 m aft of that hoop.
5. **Sectional hierarchy was timid** (lintel 100 mm, sill 80 mm). Thickening toward the can would be a sleeve. That remains rejected.

### C. What must remain optically exposed

Fixed core; hollow translating can; can leaving the bay; can reaching the handover / capture region; registers, tongues, rails, locks, shoes; aft posts and bay walls; open stern in SPREAD, STOWED, and DRIVE. PROP SECTION meaning stays: ghost the can and aft shell, keep locks readable.

### D. Which weakness it is

**Frame continuity and throat depth**, with a secondary **value-hierarchy** error (accent used for the whole hoop). Not collar X-section into the can, not chine height, not folio stations, not a missing eighth mass, not a boat-tail.

## Exact bounded changes

Presentation-only, in `explore/body-shell-03/src/scene/bodyShellConcept.ts`. No eighth mass. Same conceptual mass: **open stern collar**. FO1 dock-face X unchanged. Frozen root / can / core / posts / bay walls untouched. Aft face of the collar not moved further into the can stroke.

### First candidate (construction; accepted)

1. **Forward throat, not an aft boat-tail.** Collar Z span 150 mm → 350 mm by deepening **forward** only (`COLLAR_THROAT_Z = 0.26` plus a 90 mm lip). Aft face stays at `COLLAR_Z - 0.05`.
2. **FO1 lip / face recipe, used once at the stern.** Same collar mass splits into a recessed throat and an opening lip. Chine and dorsal deck terminate at the portal’s forward face.
3. **Section away from the can only.** Lintel top 1.36 → 1.40. Sill bottom 0.18 → 0.12. Opening toward the can unchanged: inner X ±0.61 m, opening Y 0.26–1.26 m.

Director critique of that candidate: the thesis was readable in `so1Throat` and somewhat in side / seated. Stock **DRIVE 3/4** and **rear DRIVE** were almost unchanged. SO1 must land in those cameras without depending on a flattering close-up.

### One director revision (value contrast; not a second concept)

1. **Collar-only materials.** FO1 station accent / pocket values were left alone. The stern throat uses a dedicated darker, more opaque recess (`matBodyShell03SternThroat`). The stern lip uses a dedicated brighter opening rim (`matBodyShell03SternLip`) so lip vs throat can contrast at DRIVE distance.
2. **Contrast-alone was recaptured first.** Stock DRIVE 3/4 and rear still could not hold the portal.
3. **Hair more forward throat**, allowed only after that: `COLLAR_THROAT_Z` 0.26 → 0.38 (+120 mm, forward only). Aft face, opening X/Y toward the can, and FO1 stations unchanged. Total collar Z is now 470 mm. Forward face remains well aft of the posts (`z ≈ -5.56` vs posts at `-4.80`).

No mass was added. No sleeve, cowling, boat-tail, or can-following.

## What was deliberately NOT changed

- Frozen MT1-S5HR3R1 geometry, transforms, IDs, certificates, gates.
- Can stroke, fixed core, aft posts, bay walls, rails, locks, shoes, registers, tongues.
- FO1 station family, dock-face X, 70° haunch, proud dock, front/lower vs rear/higher folio relationship, FO1 accent / pocket materials.
- BODY OFF mechanism. Before/after BODY OFF PNGs remain byte-identical (238245 / 191060).
- Seven-mass language. No eighth mass, nacelle, boat-tail, intake, nozzle, turbine, or closed stern.
- Can material / color.
- Folio stations, utility professions, cockpit / ground / aero work, S6, BODY-SHELL-04.

## Before / after evidence

`explore/body-shell-03/evidence/so1/before/` is the FO1 stern before any SO1 geometry. `.../after/` is this director revision.

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

File-size delta after this revision vs the original before set:

| View | Before bytes | After bytes | Δ |
| --- | --- | --- | --- |
| DRIVE 3/4 | 279992 | 279995 | +3 |
| Rear DRIVE | 208139 | 208359 | +220 |
| Side DRIVE | 199470 | 200221 | +751 |
| BODY OFF 3/4 | 238245 | 238245 | 0 |
| BODY OFF rear | 191060 | 191060 | 0 |

PROP SECTION meaning is preserved. SPREAD uses the same portal.

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
`capture:so1` after the director revision and `dump:so1-fit` passed.

Canonical root `npm test` was not required (no `src/` change).

## Reject list

Tempting changes that would over-own or hide the mechanism, and that remain rejected after the director revision:

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
- Depend on `so1Throat` as the proof camera.
- Assign a propulsion profession or start S6 / BODY-SHELL-04.

## Remaining weaknesses — why the stock DRIVE cameras cannot carry this

The accepted construction is a 470 mm open frame whose aft face sits around the seated can’s mid-body. The frozen can still occupies `z ≈ -7.08 … -4.53` and continues ~1.1 m aft of that frame. Stock DRIVE 3/4 (`driveBody`, radius 15.2) and rear DRIVE (`rear`, radius 15) look at the whole machine. In those pictures the portal is a few tens of pixels at the far stern; the can stroke and the long hull are the picture.

Value contrast and +120 mm of forward throat are the legal revision. They make the lip/throat readable in PROP / throat / stowed close views. They do not make stock DRIVE 3/4 or rear DRIVE show the portal as a terminal frame. The DRIVE 3/4 PNG changed by **3 bytes**. Rear changed by 220. Side is better (+751) but still not an unambiguous portal against the seated can.

Side / rear / throat / stowed are therefore **not** all unambiguous. Throat and stowed can show the frame. Stock rear and DRIVE 3/4 cannot, because the frozen stroke dominates those cameras.

Making those two cameras carry the thesis would require a larger visual event at the stern: more mass, a nacelle, or following the can aft. All three are forbidden. Changing the stock cameras to flatter the stern would be photographing the machine better instead of owning the stern. That was also refused.

## Recommendation

**NO PRESENTATION SOLUTION UNDER CURRENT FROZEN GEOMETRY.**

The ownership rule is correct. The construction is correct. The one director revision (collar-only contrast, then a hair of forward throat) was applied and recaptured. Fit is a 101-sample pass. BODY OFF is identical. FO1 and MT1-S5HR3R1 are untouched.

SO1 still fails the review that matters: stock DRIVE 3/4 and rear DRIVE do not show the portal. That is not a materials miss. It is the frozen can stroke and the whole-machine review cameras. No further presentation revision is recommended.

## Task report

- **Changed files:** `explore/body-shell-03/src/scene/bodyShellConcept.ts` (first-candidate collar geometry; director-revision collar-only materials and +120 mm forward throat); `explore/body-shell-03/src/scene/createScene.ts` (`so1Throat`); `explore/body-shell-03/tests/capture-so1.spec.ts`; `explore/body-shell-03/tests/dump-so1-fit.spec.ts`; `explore/body-shell-03/package.json`; this report; `explore/body-shell-03/evidence/so1/**`.
- **Tests:** `npm --prefix explore/body-shell-03 test` (isolation + 101-sample fit) passed; `capture:so1` after the director revision passed; `dump:so1-fit` passed; `npm --prefix explore/body-shell-03 run build` passed. Canonical root `npm test` not required (no `src/` change).
- **Evidence:** SO1 before/after set above, recaptured after the director revision; consulted `MT1_FO1_RESULTS.md`, `BODY_SHELL_03_COMPLETION.md`, `BODY_SHELL_03_1_POCKET_CORRECTION.md`, `evidence/body-shell-03-fit-report.json`, `docs/CURRENT_STATE.md`, `docs/NOMENCLATURE.md`.
- **Authority participation:** none.
- **Remaining unknowns / negatives:** stock DRIVE 3/4 and rear cannot show a 0.47 m open frame against a 2.55 m frozen can stroke without adding mass or following the can. That is a negative result, not an invitation to another revision.

Canonical `src/` is untouched. BODY OFF is mechanism truth.
