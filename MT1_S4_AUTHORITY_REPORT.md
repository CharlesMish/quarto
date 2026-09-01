# MT1-S4A authority report

`freezeId`: **MT1-S4A**  
`status`: **GREEN_PENDING_DIRECTOR**  
`B14`: **AWAITING_DIRECTOR_DISPOSITION**

Source S3A SHA-256: `56e45ff236522753f8626909c93b7dfc5ea347e5ab7087dac5b641eae0f693f8`  
Source S4 SHA-256: `a80463583662531aed9c2ec62559dfbb6259d1cf83ae698847c8aaafec40cd93`

JSON: `evidence/s4-authority-report.json`.

This record is regenerated from the corrected S4A evaluator. It supersedes the S4 candidate markdown, including the stale B4 `minFixedSep = 0.005 m` figure (S4-F03). B14 is an external director disposition, not an internal computed PASS.

## Findings closed

| Id | Class | Disposition |
| --- | --- | --- |
| S4-F01 | BLOCKER | **CLOSED** — starboard book-hinge local Z is `−180°` (port `+180°`) for both rear and front. Full-path homology `maxErr = 0`. Former inner/outer overlaps `−0.604660 m` / `−0.481270 m` are gone. |
| S4-F02 | MAJOR | **CLOSED** — B2 is full-path world-space homology. B3/B4 include moving×moving book pairs, latch/pin approaches, and own channel/FWD_CARRY. Wrong-fold negative control fails B2 and reports `wrongFoldFails`. |
| S4-F03 | MINOR | **CLOSED** — B4 central `minFixedSep = 0.397 m` in JSON, source detail, and this markdown. Controlling full-path front numbers are listed below; none of them is `0.005 m`. |

## Fold-sign correction

Port book fold remains frozen `P.rl.foldDeg = +180`, `P.fl.foldDeg = +180`.

Starboard (positive-scale, no root mirror):

* `STBD.rear.foldDeg = −P.rl.foldDeg = −180`
* `STBD.front.foldDeg = −P.fl.foldDeg = −180`

Applied as `bookHinge.rotation.z = bookFold * deg(foldDeg)` in `applyRearStbd` / `applyFrontStbd`. World-space path, not the Euler sign itself, is the authority: for homologous local states, `x_stbd ≈ −x_port`, `y_stbd ≈ y_port`, `z_stbd ≈ z_port` through the complete fold interval.

## B1–B14

| Gate | Result | Detail |
| --- | --- | --- |
| B1 | **PASS** | S1C+S2A GREEN; maps frozen |
| B2 | **PASS** | path homology rearΔ=0.0000 frontΔ=0.0000 |
| B3 | **PASS** | self=−0.0000 @ 0.0000 `RR_INNER_ARMOR`/`RR_OUTER_ARMOR`; latch=0.0050; own=0.0500; central s4-rear minFixedSep=0.587 |
| B4 | **PASS** | self=−0.0000 @ 0.0000 `FR_INNER_ARMOR_1`/`FR_OUTER_ARMOR_0`; pin=0.0110; stop=+∞ (named designed-occupancy exclusion); own=0.1926; **central s4-front minFixedSep=0.397** |
| B5 | **PASS** | stbd rail/nest/catch/channel contact keel |
| B6 | **PASS** | prediction contained; rear/front margin +0.080 |
| B7 | **PASS** | min port↔stbd 1.745 m @ 0.700 `FL_OUTER_ARMOR_1` vs `FR_OUTER_ARMOR_0` |
| B8 | **PASS** | firstReady 0.840; first requested/applied 0.890; barrier=true |
| B9 | **PASS** | shared maps; reverse + preview from S3A GI4/GI10 |
| B10 | **PASS** | port hits 0; stbd hits 0; stbd V 6.701 |
| B11 | **PASS** | E2 W 13.367 L 11.395 contain=true |
| B12 | **PASS** | 213 physical, 0 unregistered, 0 underbound |
| B13 | **PASS** | port params/maps frozen |
| B14 | **AWAITING_DIRECTOR_DISPOSITION** | not self-passed; corrected canonical pack generated |

## C1–C10

| Gate | Result | Detail |
| --- | --- | --- |
| C1 | **PASS** | rear homology maxErr=0.0000 |
| C2 | **PASS** | front homology maxErr=0.0000 |
| C3 | **PASS** | rear inner/outer sep=−8.6e−8 m @ local t=0.0000 (hinge-face numerical; no forbidden interval) |
| C4 | **PASS** | front inner/outer sep=−2.6e−7 m @ local t=0.0000 (hinge-face numerical; no forbidden interval) |
| C5 | **PASS** | latch keeper/throat 0.0050 m @ local t=0.6700; no forbidden interval |
| C6 | **PASS** | book pin/cheek 0.0110 m @ local t=0.3100; socket-stop is a named designed-occupancy exclusion (see below) |
| C7 | **PASS** | rear own 0.0500 `RR_OUTER_ARMOR`/`CHANNEL_FRAME_STBD_AFT`; front own 0.1926 `FR_OUTER_ARMOR_0`/`KEEP_COCKPIT_VIS` |
| C8 | **PASS** | production path; dedicated wrong-fold fixture fails B2 and reports `wrongFoldFails` |
| C9 | **PASS** | JSON / source / this markdown agree on controlling values |
| C10 | **PASS** | nine canonical top + three-quarter frames regenerated; strips rebuilt |

## Path authority

Dense local fold samples: Δt ≤ 0.0005 on the fold interval, refine ≤ 0.0001 around candidate contact.

| Check | sep (m) | local t | pair | first/last forbidden |
| --- | ---: | ---: | --- | --- |
| rear homology | maxErr 0 | 0 | hinge/inner/outer/latch/carriage | — |
| front homology | maxErr 0 | 0 | carriage/pin/catch/inner*/outer* | — |
| rear book self | −8.6e−8 | 0.0000 | `RR_INNER_ARMOR` vs `RR_OUTER_ARMOR` | none |
| front book self | −2.6e−7 | 0.0000 | `FR_INNER_ARMOR_1` vs `FR_OUTER_ARMOR_0` | none |
| latch approach | 0.0049998 | 0.6700 | `RR_LATCH_KEEPER` vs `RR_LATCH_THROAT_BACK` | none |
| book-pin approach | 0.0109997 | 0.3100 | `FR_BOOK_PIN_BODY` vs `FR_BOOK_CHEEK_S` | none |
| front socket-stop | +∞ (excluded) | — | own `FR_SOCKET_STOP_OUT` | named exclusion |
| rear own channel | 0.0500 | 0.6250 | `RR_OUTER_ARMOR` vs `CHANNEL_FRAME_STBD_AFT` | none |
| front own FWD_CARRY | 0.1926 | 0.8600 | `FR_OUTER_ARMOR_0` vs `KEEP_COCKPIT_VIS` | none |

JSON encodes `+∞` as `null` on `path.frontStop.sep`. Source/B4/C6 detail print `Infinity`.

### Named exclusions (PART E)

1. hinge-face: `*HINGE_BARREL` vs vane/book at |sep|<1e−4 (S1 G1 class)
2. shoe/carriage wrap vs own rail beam (designed socket wrap)
3. nest-pin vs nest-receiver frame (designed through-bore; solids must not overlap — tested as approach)
4. own socket rail/stop: `RR`/`FR` INNER|OUTER vs own `RAIL_BEAM`/`STOP` — homologous to certified port book occupancy of the rail end (port S1 does not fail this pair; the stop sits inside the book planform)

No class-wide “same mechanism / same book / receiver / carried hardware” exclusions.

## Endpoints (whole physical)

| State | W | H | L |
| --- | ---: | ---: | ---: |
| SPREAD (machineT=0) | 13.320 | 2.895 | 11.700 |
| STRUCTURAL_READY (machineT=0.840) | 4.600 | 2.895 | 11.700 |
| DRIVE (machineT=1) | 4.600 | 2.895 | 11.700 |

Endpoints alias the S4 candidate because the fold is ~180°; they were remeasured, not assumed.

## Bilateral envelopes (corrected fold)

Method: ΔmachineT ≤ 0.001, local refine ≤ 0.0001, 1e−6 m numerical containment.

| Envelope | W | H | L | notes |
| --- | ---: | ---: | ---: | --- |
| E1 moving instant | 13.367 @ 0.1579 | 2.665 @ 0 | 10.590 @ 1 | |
| E2 moving swept | **13.367** | 2.665 | 11.395 | x ∈ [−6.684, +6.684]; maxY **2.925** |
| E3 whole instant | 13.367 @ 0.1579 | 2.895 @ 0 | 11.700 @ 0 | |
| E4 whole swept | 13.367 | 2.895 | 11.700 | x ∈ [−6.684, +6.684]; maxY **2.925** |

The S4 candidate `maxY ≈ 4.643575 m` was a wrong-fold artifact and is **not** reused.

## Drive / readiness

Frozen S3A maps. No stagger. No map retime.

* first starboard rear latch ready: **0.310**
* first starboard rear nest ready: **0.840**
* first starboard front book ready: **0.250**
* first starboard front nest ready: **0.740**
* first starboard front passive ready: **0.680**
* first four-structure ready: **0.840**
* first requested drive: **0.890**
* first applied drive: **0.890**
* production barrier holds (applied = 0 until four-structure ready)

JSON field: `firstCaptureReady`. Maps were not retimed. The four-structure gate remains the later nest completions, not the earlier book/latch/passive instants.

## Drive negative controls

At machineT 0.95 (requested ≈ 0.583): forcing false individually on port rear nest, port front nest, starboard rear nest, starboard front nest, starboard front catch yields readiness false, appliedDriveT 0, drive physically stowed. Production-gate bypass causes B8/GI6 FAIL.

## Waists

`DRIVE_WAIST_PORT` and `DRIVE_WAIST_STBD` unchanged. All-solid active-state hits = 0 / 0. Starboard principal V 6.701 m³ (W 1.429 × H 1.750 × L 2.680). Port waist not shrunk.

## Reservations

Seated realization vs frozen prediction (pad 0.08): rear +0.080 m, front +0.080 m, both contained.

## Physical census

213 physical. 0 unregistered. 0 phantom. 0 underbound.

## B14 evidence (corrected machineT, not self-passed)

Nine canonical samples: 0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.86, 1.00.

* top: `evidence/s4-top-0.png` … `evidence/s4-top-1.png`
* three-quarter: `evidence/s4-three-0.png` … `evidence/s4-three-1.png`
* strips: `evidence/s4-top-strip.png`, `evidence/s4-three-strip.png`
* endpoints: `evidence/s4-spread-top.png`, `evidence/s4-ready-top.png`, `evidence/s4-drive-top.png`
* debug: `evidence/s4-rear-stbd-debug.png`, `evidence/s4-front-stbd-debug.png`, `evidence/s4-four-capture-debug.png`, `evidence/s4-waist-debug.png`

Director question only: does the sign-honest bilateral geometry preserve the already-approved choreography legibility?

## Prior-authority

Port builders not rewritten. Maps identical to S3A. S1 SAT still excludes slice `s4`. No cockpit/dorsal/waist shrink. No new geometry added to hide the old path.

A bounded first-order balance study is **after** this freeze. No CG/aero claims here. No S5.
