# MT1-FO1 — Folio–station ownership

Status: **PRESENTATION STUDY · RECOMMEND ACCEPT FO1**  
Date: 2026-09-02  
Package: `explore/body-shell-03/` (BODY-SHELL-03.1 lineage)  
Source mechanism: **MT1-S5HR3R1** (unchanged)  
Authority participation: **none**

Does not start BODY-SHELL-04. Does not reopen S5. Does not proceed into stern redesign. Stop after FO1.

## Ownership rule

The chine locally becomes a receiving shoulder at each frozen root: it steps into one repeated lip–recess–sill frame and a short web that presents the hinge, so in DRIVE the folio (legacy/source: book) seats proud as flank in that shoulder, and in SPREAD the empty shoulder still reads as the bay that flank left.

Chine → station/haunch → frozen hinge/root → folio is one transition, used four times. Front and rear keep different scale and height; they do not become identical.

## Diagnosis of the four stations (BODY-SHELL-03.1 before FO1)

Inspected: SIDE / SPREAD, SIDE / DRIVE, 3/4 / SPREAD, 3/4 / DRIVE, forward and rear starboard root close-ups in both states, and BODY OFF equivalents.

The working hypothesis stands: ownership was failing at the **chine→station transition**, not at folio span or scale.

| Cue | Front pair | Rear pair | Family reading |
| --- | --- | --- | --- |
| Owned socket | Shallow C (lip / 70 mm recess / sill / short web) grown outboard of the chine at `P.fl` (z=3.22, y=2.22). Lower, shorter bay. | Same C recipe at `P.rl` (z=−1.88, y=2.78). Higher, taller bay. Reach 0.22 m vs front 0.16 m. | Recipe is already one family. Height/reach split is correct and was kept. |
| Hinge/rail furniture | Socket stands above the gunwale (1.7 → pocket top 2.10) as a bronze bracket toward the frozen hinge. Whole `CHINE_FWD` used the same bronze as the lips, so the C dissolved into a side bar. | Same, more so: gunwale 2.16 → pocket top 2.66 toward hinge 2.78. Taller bronze C on the continuous aft chine. | Four brackets on a jewelry stripe. |
| Disconnected folio | In SPREAD the empty C reads as a cutout/pad on the bar. In DRIVE the folio docks proud (~33 mm face gutter) but the bronze wall and gold root hardware out-shout the flank. | In DRIVE face gutter ~0. In SPREAD the higher empty bay still reads as hinge furniture, not “a flank belongs here.” | Span/scale already differ correctly. The missing cue is a repeated chine-to-bay step. |
| Coherent four-station family | Present as a smaller/lower instance of the same C. | Present as a larger/higher instance. | Family existed in construction and failed in value: bronze chine = bronze lips, gray face, tiny unclosed web. |

BODY OFF remains the exact mechanism: four physical roots on the keel, no presentation sockets. FO1 must not change that view.

## Exact bounded changes

Presentation-only, in `explore/body-shell-03/src/scene/bodyShellConcept.ts`. No eighth mass. No outboard-reach increase. No flush dock. Frozen root geometry untouched.

1. **Value hierarchy.** Chine walls (`BODY_CHINE_FWD_*`, `BODY_CHINE_AFT_*`) move to hull value. Accent is reserved for opening frames: station lips, sill, web, and the existing stern collar. Recessed faces go darker (bay, not pad).
2. **Frame proportions, same reach.** Lip Z 70 → 90 mm. Sill height 50 → 70 mm. Recess stays 70 mm. Front/rear outboard reach stays **0.16 m / 0.22 m**. Dock-face X unchanged, so DRIVE gutters stay as in the accepted 03.1 fit.
3. **Web closes the C.** Web half-span meets the inner lip edges and uses the frame (accent) value, so the short web is the lintel that presents the frozen hinge instead of a separate gray gusset.

## Before / after evidence

`explore/body-shell-03/evidence/fo1/before/` and `.../after/`:

| View | Before | After |
| --- | --- | --- |
| SPREAD 3/4 | `fo1-before-spread-three.png` | `fo1-after-spread-three.png` |
| DRIVE 3/4 | `fo1-before-drive-three.png` | `fo1-after-drive-three.png` |
| SPREAD side | `fo1-before-spread-side.png` | `fo1-after-spread-side.png` |
| DRIVE side | `fo1-before-drive-side.png` | `fo1-after-drive-side.png` |
| Forward root, both states | `fo1-before-spread-fwd-root.png`, `fo1-before-drive-fwd-root.png` | `fo1-after-spread-fwd-root.png`, `fo1-after-drive-fwd-root.png` |
| Rear root, both states | `fo1-before-spread-aft-root.png`, `fo1-before-drive-aft-root.png` | `fo1-after-spread-aft-root.png`, `fo1-after-drive-aft-root.png` |
| BODY OFF | `fo1-before-body-off-spread.png`, `fo1-before-body-off-drive.png` | `fo1-after-body-off-spread.png`, `fo1-after-body-off-drive.png` |

Review cameras `fo1FwdRoot` / `fo1AftRoot` are inspection-only (starboard, matching BODY 3/4).

## Fit result

`explore/body-shell-03/evidence/fo1/fo1-fit-report.json`

- method: `triangle-obb`
- samples: 101 (`ΔmachineT = 0.01`)
- defects: **0**
- `participatesInAuthority: false`
- pass: **true**
- dock-face X unchanged vs accepted 03.1: front ±0.84 m, rear ±0.90 m
- front face gutter: 33 mm (readability)
- rear X-projection gutter ~0 (no 3D triangle intersection)

`npm --prefix explore/body-shell-03 test` — both isolation and presentation-fit tests passed.  
`npm --prefix explore/body-shell-03 run build` — TypeScript + Vite production build passed.

## Reject list

Tempting changes that would over-own or hide the mechanism:

- Increase outboard pocket reach into the fold sweep.
- Force folios flush / move belly or deck to bury them.
- Skin over rails, pins, catches, or nest hardware.
- Add posts, pods, rails, boxes, or a new eighth body mass.
- Thicken the whole fuselage to fake ownership.
- Raise the dorsal deck into two station humps (reads as BODY-SHELL-04 / new furniture).
- Cut an open window through the chine wall (hole into the interior).
- Deepen the recess by pulling the dock face inboard (widens the DRIVE gutter and un-receives the proud dock).
- Repeated decorative greebles to fake family resemblance.
- Assign a folio profession (wing, shield, radiator, tank, control surface).
- Change frozen MT1-S5HR3R1 root geometry, 70° haunch, or authority solids.

## Recommendation

**ACCEPT FO1.**

A reviewer can identify the same lip–recess–sill–web transition at all four roots without being told which meshes moved. Front stays lower/shorter; rear stays higher/larger. Folios stay proud. Frozen roots stay visible. BODY OFF is the same mechanism.

A no-geometry result was considered. Existing C-sockets already supported the rule in construction; they failed in composition because the chine used the same bronze as the frame. The value change is the ownership move. Lip/sill/web proportion is a bounded clarification of that same frame, not a new mass.

ONE BOUNDED REVISION would be warranted only if a director still reads the empty SPREAD bays as maintenance cutouts. The next legal move would be a stronger frame value on lips/sill/web only — not reach, not flush, not a new mass.

## Task report

- **Changed files:** `explore/body-shell-03/src/scene/bodyShellConcept.ts` (presentation materials, chine value, pocket frame proportions); `explore/body-shell-03/src/scene/createScene.ts` (FO1 review cameras); `explore/body-shell-03/tests/capture-fo1.spec.ts`; `explore/body-shell-03/tests/dump-fo1-fit.spec.ts`; `explore/body-shell-03/package.json` (`capture:fo1`, `dump:fo1-fit`); this report; `explore/body-shell-03/evidence/fo1/**`.
- **Tests:** `npm --prefix explore/body-shell-03 test` (isolation + 101-sample fit) passed; `capture:fo1` before/after passed; `dump:fo1-fit` passed; `npm --prefix explore/body-shell-03 run build` passed. Canonical root `npm test` was not required (no `src/` change).
- **Evidence:** FO1 before/after set above; consulted `BODY_SHELL_03_COMPLETION.md`, `BODY_SHELL_03_1_POCKET_CORRECTION.md`, `evidence/body-shell-03-fit-report.json`.
- **Authority participation:** none.
- **Remaining unknowns / negatives:** whether a later reviewer still wants a local chine-wall notch (rejected here: concave `extrudeYZ` fan and interior hole). SPREAD will remain less dense than DRIVE; that is intended. H1 director disposition is unchanged.

Canonical `src/` is untouched. BODY OFF is mechanism truth.
