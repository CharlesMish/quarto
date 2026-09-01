# MT1-VB1 — results

Tag: **DERIVED_ESTIMATE** unless noted.  
Machine-readable: `evidence/vb1-results.json`, `evidence/vb1-scenario-table.csv`.

`status`: **VB1_CANDIDATE_PENDING_DIRECTOR_ASSUMPTION_REVIEW**  
`computed_disposition`: **BALANCE_CONCEPT_SURVIVES_WITH_CAUTION**  
Controlling family: **F6 DRIVE_MOVING** (also the strongest READY→DRIVE walker). F8 COCKPIT_ALLOWANCE is a close second on longitudinal CG.

Named RED criteria triggered: **none**.

## Study integrity

| Gate | Result |
| --- | --- |
| VB1-G1 S4A identity | PASS |
| VB1-G2 coordinate / deploy vector | PASS |
| VB1-G3 family membership | PASS |
| VB1-G4 no implicit density | PASS |
| VB1-G5 fact/estimate tags | PASS |
| VB1-G6 scale invariance | PASS |
| VB1-G7 nominal x_lat ≈ 0 | PASS |
| VB1-G8 pose from `applyMachine` | PASS |
| VB1-G9 READY≠DRIVE when F6>0 | PASS |
| VB1-G10 planform proxy | PASS |
| VB1-G11 arithmetic | PASS |
| VB1-G12 claim ceiling | PASS |

NC1 one-sided book mass → G7 FAIL.  
NC2 freeze drive at stowed while `machineT=1` → G9 FAIL.  
NC3 duplicate underside footprints → G10 FAIL.  
NC4 volume-as-mass fixture → G4 FAIL.

## Nominal CG (`NOMINAL`, 100 RMU)

| State | machineT | x_lat | y_vert | z_long | y thrust-arm | arm / 2.895 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| SPREAD | 0 | 0 | 1.497 | −0.321 | +0.717 | 0.248 |
| MID_FOLD | 0.15 | ~0 | 1.470 | −0.318 | +0.690 | 0.238 |
| POST_YAW | 0.54 | ~0 | 1.403 | −0.834 | +0.623 | 0.215 |
| POST_HAUNCH_CANT | 0.70 | ~0 | 1.278 | −0.834 | +0.498 | 0.172 |
| STRUCTURAL_READY | 0.84 | 0 | 1.278 | −0.834 | +0.498 | 0.172 |
| DRIVE | 1.00 | 0 | 1.278 | −1.189 | +0.498 | 0.172 |

Sign convention: `verticalThrustArm = y_vert(CG) − 0.78`. Positive = CG **above** the thrust axis.

READY and DRIVE share the certified outer envelope; CG is **not** the same. READY→DRIVE Δz_long = **−0.356 m** (drive body deploys aft). y_vert unchanged.

SPREAD→READY: Δy_vert = −0.219 m (haunch/cant drop); Δz_long = −0.512 m (yaw aft).

## Lateral symmetry

All symmetric named scenarios: `|x_lat| < 1e-16`. Integrity check, not a payload study.

## Scenario SPREAD CG envelope (named)

| Scenario | y_vert | z_long | vs planform |
| --- | ---: | ---: | --- |
| ALL_LOW | 1.549 | −0.381 | front → combined → CG → rear |
| NOMINAL | 1.497 | −0.321 | front → combined → CG → rear |
| ALL_HIGH | 1.483 | −0.292 | front → combined → CG → rear |
| HEAVY_AFT_LIGHT_FORWARD | 1.496 | −1.528 | front → combined → rear → **CG aft of rear area** |
| HEAVY_FORWARD_LIGHT_AFT | 1.511 | +1.184 | front → CG → combined → rear |
| HEAVY_DRIVE_MOVING | 1.387 | −0.768 | front → combined → CG → rear |
| LIGHT_DRIVE_MOVING | 1.576 | +0.004 | front → combined → CG → rear |
| HEAVY_COCKPIT | 1.470 | +0.093 | front → combined → CG → rear |
| HEAVY_WAIST_SYSTEMS | 1.495 | −0.320 | front → combined → CG → rear |

HEAVY_AFT_LIGHT_FORWARD is the only named case with CG aft of the rear area centroid. That is a corner construction (heavy books+drive+aft structure, starved forward package), not a robust contradiction. It is part of why the disposition is **WITH_CAUTION**, not RED.

Named-scenario band across **all states**:  
z_long ∈ [−2.782, +1.192], y_vert ∈ [1.202, 1.576], x_lat ≈ 0.

512-corner SPREAD backstop: z_long ∈ [−1.873, +1.394], y_vert ∈ [1.110, 1.974], x_lat ≈ 0. Named scenarios did not miss a more extreme lateral result.

## Allowance location sensitivity (NOMINAL, SPREAD)

Cockpit face slides (F8 = 10 RMU):

| Face | z_long | y_vert |
| --- | ---: | ---: |
| center | −0.321 | 1.497 |
| fwd | −0.216 | 1.497 |
| aft | −0.426 | 1.497 |
| up | −0.321 | 1.592 |
| down | −0.321 | 1.402 |

Δz_long = ±0.105 m. Does not reorder planform vs CG.

Waist face slides (F9 = 6 RMU, 50/50 cells):

| Face | z_long | y_vert |
| --- | ---: | ---: |
| center | −0.321 | 1.497 |
| fwd | −0.241 | 1.497 |
| aft | −0.402 | 1.497 |
| up | −0.321 | 1.549 |
| down | −0.321 | 1.444 |

Δz_long ≈ ±0.080 m, Δy_vert ≈ ±0.052 m. Waist mass does not steer the layout.

## Planform vs CG (SPREAD)

Front area centroid z_long = +3.824  
Combined = +0.224  
Rear = −0.800  

Nominal CG z_long = −0.321 sits **between combined and rear**, never ahead of the front area, never (except the HEAVY_AFT corner) aft of the rear area.

## Thrust line

Axis at y_vert = 0.78, +Z.  
Across named scenarios/states the axis is **clearly below** the CG band.  
verticalThrustArm ∈ about **+0.42 … +0.80 m** (0.15–0.28 of machine height).  
Not metre-class. No pitch-moment in N·m. No stability language.

Drive-mass deployment **does** cause material CG migration: NOMINAL −0.356 m; HEAVY_DRIVE one-at-a-time READY→DRIVE extra walk −0.579 m.

## Sensitivity (one family HIGH vs LOW at SPREAD)

| Strongest | Family | Δ |
| --- | --- | --- |
| longitudinal CG | **F6 DRIVE_MOVING** | Δz_long = −0.772 m |
|  | F8 COCKPIT_ALLOWANCE | Δz_long = +0.751 m |
| vertical CG | **F1 REAR_BOOKS** | Δy_vert = +0.237 m |
| READY→DRIVE Δz | **F6 DRIVE_MOVING** | −0.579 m |

F9 waist Δz_long = 0.003 m. Waist is not rescuing anything.

## Disposition logic

* CG stays inside the central machine for all named scenarios.
* Thrust axis is not metre-class away from the y_vert band.
* READY→DRIVE walk is visible and real, but small vs 11.7 m length.
* One speculative family (F6), with F8 nearly tied, **strongly controls** longitudinal CG.

Hence **BALANCE_CONCEPT_SURVIVES_WITH_CAUTION**, not a clean SURVIVES, and not REBALANCE.

## Allowed scientific conclusion

Under the declared mass-family ranges, the certified S4A arrangement does not place the SPREAD CG band in a grossly implausible relationship to the geometric planform-area centroids of the front and rear books or to the certified thrust-line datum; and the SPREAD→DRIVE CG migration is not large enough relative to the machine's own length/height to indicate an obvious first-order rebalance requirement. No flight, hover, stability, control-authority, or GEV capability is asserted.

The caution is: **assumed moving-drive mass (and nearly as much, assumed cockpit mass) decide where the longitudinal CG sits.** Those two families should be architected next, not treated as leftovers.

## Recommended next architecture slice

**drive / propulsion internal mass architecture next.**

Reason: F6 is the strongest longitudinal and READY→DRIVE sensitivity, and it is the only family whose *location* also translates 2.55 m. F8 is close; cockpit/package is the obvious following slice. Do not build either in this turn.

## Evidence

* `evidence/vb1-geometry-facts.json`
* `evidence/vb1-assumptions.json`
* `evidence/vb1-results.json`
* `evidence/vb1-scenario-table.csv`
* `evidence/vb1-top-map.svg`
* `evidence/vb1-side-map.svg`
* `evidence/vb1-cg-trace.svg`

## Limitations

* RMU ranges are assumptions pending director review.
* Book hardware is represented by leaf centers, not separately weighed.
* F5 uses a long-region AABB center.
* Front extracted planform is 5.7506 m². Most of the gap from the 7.04 m² nominal rectangles is certified inner-armor domain trim; four Y-passage openings remove only 0.0144 m².
* No aero, no newtons, no kilograms as inputs.
