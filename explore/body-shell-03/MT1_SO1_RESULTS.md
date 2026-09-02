# MT1-SO1 — Stern / handover ownership

Status: **PRESENTATION STUDY · RULE RECORDED · GEOMETRY NOT YET CHANGED**  
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

Inspected from existing BODY-SHELL-03 / FO1 evidence, live parameters, and the presentation construction in `bodyShellConcept.ts`. Matched BEFORE cameras (`so1Throat` plus the required DRIVE / PROP / BODY OFF set) are captured into `evidence/so1/before/`.

Stations that matter:

| Station | Fact |
| --- | --- |
| Rear folio / chine high point | `P.rl.z = -1.88`, gunwale Y = 2.16 |
| Bay | `z = -1.70 … -4.80`; `AFT_POST_*` at `z = -4.80` |
| Capture / lock review | cameras target `z ≈ -4.57`, just forward of the posts |
| Can stowed | center `z = -3.25`, length 2.55 m, section 1.00 × 0.82 m |
| Can seated | center `z = -5.80`; occupies `z ≈ -7.08 … -4.53` |
| Presentation collar | `COLLAR_Z = -5.98`; Z depth **150 mm**; sides 140 mm thick; lintel 100 mm; sill 80 mm |

### A. What currently makes the stern feel owned by Quarto

The open stern is already the right idea. The aft chine does drop into a collar. FO1 correctly reserved bronze accent for opening frames, including this collar. BODY OFF still shows the real load path: bay walls, aft posts, rails, fixed core, hollow can, registers, locks, shoes. PROP SECTION still ghosts the can and aft shell so the handover stays inspectable. None of that should be replaced by a finished nacelle.

### B. What currently makes the can feel bolted-on / appliance-like

The weakness is **frame continuity and throat depth**, not missing mass and not “the engine is ugly.”

1. **The collar is a 150 mm hoop around the seated can’s mid-body**, about 1.2 m aft of the posts and capture. It reads as a test-fixture ring, not as the chine becoming a portal.
2. **The whole collar is accent.** After FO1 that same bronze is the folio-station lip language. A jewelry ring around a teal can is appliance-mount hardware, not a terminal body frame.
3. **There is no recessed throat.** Inner faces are the same bronze volume as the outer hoop. Looking aft-to-forward, you do not enter a darker opening; you see a thin picture-frame and then the blue brick.
4. **Chine, deck, and collar abut at one plane** (`COLLAR_Z`) instead of the last chine facet becoming the frame. The hull stops; a hoop starts; the can continues ~1.1 m aft of that hoop.
5. **Sectional hierarchy is timid** (lintel 100 mm, sill 80 mm) and does not get stronger away from the can. Thickening toward the can would be a sleeve. That is rejected.

This is not a camera-only failure. The stock REAR / PROP cameras already tell the same story. `so1Throat` is a review lens, not a substitute for a frame.

### C. What must remain optically exposed

Fixed core; hollow translating can; can leaving the bay; can reaching the handover / capture region; registers, tongues, rails, locks, shoes; aft posts and bay walls; open stern in SPREAD, STOWED, and DRIVE. PROP SECTION meaning stays: ghost the can and aft shell, keep locks readable.

### D. Which weakness it is

**Frame continuity and throat depth**, with a secondary **value-hierarchy** error (accent used for the whole hoop). Not collar X-section into the can, not chine height, not folio stations, not a missing eighth mass, not a boat-tail.

A no-geometry result was considered. FO1 already gave the collar accent; that was not enough. The hoop is still too short and too uniformly bronze to read as the chine’s terminal frame.

## Exact bounded changes

Pending implementation. The rule needs a deeper open frame and a recessed throat, not a new body mass. Planned, if fit allows:

1. Deepen the existing collar **forward** only (do not move the aft face further into the can stroke).
2. Split the same “open stern collar” mass into a darker recessed throat and an accent opening lip (FO1 lip / face recipe, used once at the stern).
3. Terminate the aft chine and dorsal deck at the portal’s forward face so the last facet becomes the frame.
4. Any lintel / sill thickening stays **away** from the can (up / down), never inboard.

## What will not change

Frozen MT1-S5HR3R1; FO1 station family and dock-face X; can stroke / core / posts / bay walls; BODY OFF mechanism; seven-mass language; open stern; no nacelle, boat-tail, intake, nozzle, or S6.

## Before / after evidence

`explore/body-shell-03/evidence/so1/before/` and `.../after/` (after pending).

## Fit result

Pending the presentation change and `dump:so1-fit`.

## Recommendation

Pending matched after-evidence. The legal outcomes remain: **ACCEPT SO1** / **ONE BOUNDED REVISION** / **NO PRESENTATION SOLUTION UNDER CURRENT FROZEN GEOMETRY**.
