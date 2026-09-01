# MT1-VB1-AR1 — F5 longitudinal location addendum

`status`: **PENDING_DIRECTOR_ASSUMPTION_DISPOSITION**  
`analyst_disposition` / `externally_adjudicated_disposition`: **BALANCE_CONCEPT_SURVIVES_WITH_CAUTION**  
`computed_disposition_after_F5`: same value, retained as an alias. It is **not** the output of an internal robust-RED predicate. Independent Codex rule adjudication of VB1+AR1 supports this disposition.

This is not S5 and not a new mass model. One independent variable: **where the existing F5 RMU acts**.

Frozen S4A: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`  
Original VB1 candidate zip: `56957e0fd649f44add2761ff950e23127359631fa14183bc7a457b7743997d9e`

---

## 1. F5 physical membership (`GEOMETRY_FACT`)

Nine physical S4A solids. No F3/F4/F6/F7/reservation solids. No classification bug.

| Solid | Role | y_vert | z_long | z range | Band |
| --- | --- | ---: | ---: | --- | --- |
| BULKHEAD_Z3p35 | keel bulkhead | 0.810 | +3.350 | [3.31, 3.39] | forward-central |
| DORSAL_LONGERON | dorsal spine | 1.520 | +1.425 | [−1.70, +4.55] | forward-central |
| BULKHEAD_Z1p15 | keel bulkhead | 0.810 | +1.150 | [1.11, 1.19] | forward-central |
| VENTRAL_KEEL | ventral keel | 0.100 | −0.200 | [−4.95, +4.55] | **spanning** |
| BULKHEAD_Z-1p70 | bay-mouth bulkhead | 0.810 | −1.700 | [−1.74, −1.66] | aft-central / bay |
| BAY_WALL_PORT | bay wall | 0.780 | −3.250 | [−4.80, −1.70] | aft-central / bay |
| BAY_WALL_STBD | bay wall | 0.780 | −3.250 | [−4.80, −1.70] | aft-central / bay |
| AFT_POST_PORT | aft hoop | 0.780 | −4.800 | [−4.85, −4.75] | aft-central / bay |
| AFT_POST_STBD | aft hoop | 0.780 | −4.800 | [−4.85, −4.75] | aft-central / bay |

Occupied F5 region: z_long ∈ **[−4.950, +4.550]**.

`VENTRAL_KEEL` is the reason the original union-AABB sits at z_long = −0.200. It is **not** assigned to the forward or aft cluster; putting it in both would pull both proxies toward midships and hide the question.

---

## 2. Derived proxies (`ASSUMPTION / LOCATION_SENSITIVITY`)

Geometry determines member sets and union centers. Split **fractions** are explicit assumptions, not volume weights.

| Model | Definition | z_long | class |
| --- | --- | ---: | --- |
| F5_BASE | union-AABB of all 9 F5 solids | **−0.200** | production (original) |
| F5_FORWARD_PROXY | union of DORSAL_LONGERON + BULKHEAD_Z3p35 + BULKHEAD_Z1p15 | **+1.425** | plausible cluster |
| F5_AFT_PROXY | union of bay-mouth bulkhead + bay walls + aft posts | **−3.255** | plausible cluster |
| F5_SPLIT_50_50 | 50% forward + 50% aft | effective **−0.915** | split assumption |
| F5_SPLIT_75F_25A | 75% / 25% | effective **+0.255** | split assumption |
| F5_SPLIT_25F_75A | 25% / 75% | effective **−2.085** | split assumption |
| F5_GEOMETRIC_EXTREME_FORWARD | all F5 mass at occupied +Z face | **+4.550** | AUDIT_EXTREME |
| F5_GEOMETRIC_EXTREME_AFT | all F5 mass at occupied −Z face | **−4.950** | AUDIT_EXTREME |

F5 RMU is always 12 / 20 / 30. Placement never changes the total (AR1-G5).

---

## 3. Baseline reproduction

F5_BASE + other families NOMINAL reproduces original VB1 to numerical noise:

| State | y_vert | z_long | residual |
| --- | ---: | ---: | ---: |
| SPREAD | 1.497 | −0.321 | 6e−17 m |
| STRUCTURAL_READY | 1.278 | −0.834 | 0 |
| DRIVE | 1.278 | −1.189 | 0 |

AR1-G4 **PASS**. Analysis proceeds.

---

## 4. Nominal location sensitivity (other families NOMINAL, F5 = 20 RMU)

| Model | SPREAD z_long | READY z_long | DRIVE z_long | Δz vs BASE |
| --- | ---: | ---: | ---: | ---: |
| F5_BASE | −0.321 | −0.834 | −1.189 | 0 |
| F5_FORWARD_PROXY | **+0.004** | −0.509 | −0.864 | **+0.325** |
| F5_AFT_PROXY | **−0.932** | −1.445 | −1.800 | **−0.611** |
| F5_SPLIT_50_50 | −0.464 | −0.977 | −1.332 | −0.143 |
| F5_SPLIT_75F_25A | −0.230 | −0.743 | −1.098 | +0.091 |
| F5_SPLIT_25F_75A | −0.698 | −1.211 | −1.566 | −0.377 |

y_vert changes ≤ 0.001 m. Thrust arm stays ≈ +0.72 m SPREAD / +0.50 m seated. READY→DRIVE Δz_long remains **−0.356 m** (F6 motion; F5 is fixed).

Maximum **plausible** |Δz_long| vs BASE (NOMINAL): **0.611 m** (all F5 at the aft cluster).

Audit extremes (not production): ±0.950 m vs BASE. Do not trigger RED by themselves.

---

## 5. Mass-range vs location (do not merge)

### `F5_MASS_RANGE_EFFECT`

At **fixed F5_BASE**, LOW 12 ↔ HIGH 30, SPREAD:

* Δz_long = **+0.022 m**
* Δy_vert = **−0.122 m**

F5 mass uncertainty at the original proxy is almost invisible longitudinally, because that proxy already sits near the vehicle CG.

### `F5_LOCATION_EFFECT`

At **fixed F5 = 20 RMU**, SPREAD:

| Contrast | Δz_long |
| --- | ---: |
| forward cluster vs BASE | +0.325 m |
| aft cluster vs BASE | −0.611 m |
| 50/50 vs BASE | −0.143 m |
| 75/25 vs BASE | +0.091 m |
| 25/75 vs BASE | −0.377 m |
| forward cluster vs aft cluster | **0.936 m** |

Location uncertainty is an order of magnitude larger than F5’s own mass-range effect.

---

## 6. Named-scenario robustness

Reran the nine VB1 scenarios under BASE, FORWARD, AFT, and 50/50.

* **HEAVY_AFT_LIGHT_FORWARD** is already aft of the rear area centroid on BASE (z_long = −1.528). AFT makes it worse (−2.021). Not a new crossing.
* **F5_AFT_PROXY** newly puts **NOMINAL, ALL_LOW, HEAVY_DRIVE_MOVING, HEAVY_WAIST_SYSTEMS** aft of the rear geometric-area centroid (NOMINAL z_long = −0.932 vs rear area −0.800).
* **F5_SPLIT_50_50** newly puts only **HEAVY_DRIVE_MOVING** just aft of the rear area (z_long = −0.889).
* FORWARD never produces a pathological forward CG (HEAVY_FORWARD + FORWARD = +1.506, still well behind the front area at +3.824).
* BASE / FORWARD / 75/25 NOMINAL stay in `front → combined → CG → rear`.

No named RED rule is met **robustly** (i.e. across ordinary models). All-aft-cluster NOMINAL is a location-bound caution, not a consistent contradiction.

512-corner SPREAD backstop:

| Proxy | z_long min | z_long max |
| --- | ---: | ---: |
| original VB1 (BASE) | −1.873 | +1.394 |
| F5_FORWARD_PROXY | −1.659 | +1.615 |
| F5_AFT_PROXY | −2.438 | +0.977 |

Corners move with the proxy; they do not explode laterally (x_lat ≈ 0).

---

## 7. Comparison with F6 / F8 / F1

| Uncertainty | Δ | Class |
| --- | ---: | --- |
| F6 DRIVE_MOVING mass HIGH↔LOW | Δz_long = 0.772 m | current #1 longitudinal |
| F8 COCKPIT_ALLOWANCE HIGH↔LOW | Δz_long = 0.751 m | close second |
| F1 REAR_BOOKS HIGH↔LOW | Δy_vert = 0.237 m | strongest vertical |
| F5 **mass** HIGH↔LOW at BASE | Δz_long = 0.022 m | clearly smaller |
| F5 **location** splits vs BASE | 0.09–0.38 m | clearly smaller |
| F5 **location** forward vs aft cluster | **0.936 m** | **larger** than F6/F8 |

Updated ranking if one allows “all F5 at one cluster”:

1. F5 location (cluster choice)
2. F6 moving-drive mass
3. F8 cockpit allowance
4. F5 mass at a fixed proxy (negligible in z)

If one requires a split (structure exists at both ends): F6 and F8 remain #1/#2; F5 location is secondary.

AR1 does not pretend to know which of those two readings is “true.” It reports both, and treats the cluster span as a reason F5 distribution cannot stay implicit.

---

## 8. Disposition

`analyst_disposition` = **BALANCE_CONCEPT_SURVIVES_WITH_CAUTION**  
`externally_adjudicated_disposition` = **BALANCE_CONCEPT_SURVIVES_WITH_CAUTION** (Codex VB1+AR1 review)

This is not an internally computed robust-RED result. Location observations stand as reported facts: all-aft-cluster NOMINAL sits ~0.13 m aft of the rear planform centroid; BASE and the split family still tell the same first-order story as original VB1. Those observations did not auto-promote RED.

---

## 9. Next slice

**Central-structure mass distribution must remain explicit during the next architecture work.**

Recommended sequence:

1. A cheap F5 decomposition (keel / forward bulkheads+dorsal / bay) — not new geometry, a mass-location split that this addendum already shows matters.
2. **Drive / propulsion internal mass architecture** still follows immediately: F6 remains the only family that *translates* 2.55 m, and READY→DRIVE walk is independent of F5 placement.
3. Cockpit/package remains the close third.

Do not begin either construction in this addendum.

---

## 10. Integrity

AR1-G1–G10 **PASS** on the production run.

| NC | Result |
| --- | --- |
| NC-AR1-1 split masses ≠ F5 RMU | AR1-G5 FAIL |
| NC-AR1-2 synthetic z_long = +8.5 | AR1-G6 FAIL |
| NC-AR1-3 volume-weighted fractions | AR1-G7 FAIL |

---

## 11. Limitations

* Cluster membership is a geometry reading, not a manufactured BOM.
* Split percentages are sensitivity assumptions, not densities.
* Audit extremes are bounds, not production proxies.
* Original VB1 records were not rewritten.

Evidence: `evidence/vb1-f5-location-sensitivity.json`, `.csv`, `evidence/vb1-f5-location-plot.svg`.
