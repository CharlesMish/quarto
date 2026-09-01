# MT1-DP1A — stations and packaging

Packaging arithmetic is unchanged from the audited DP1 candidate. This record only corrects aft-structure terminology and records the flow-interface stations.

## S4A stations (`S4A_GEOMETRY_FACT`)

Verified from `P.bay` / `P.drive` and live `DRIVE_ENVELOPE` OBBs (match).

+Z is forward.

| Label | z_long (m) |
| --- | ---: |
| BAY_FORWARD_STATION | **−1.700** |
| CAN_STOWED_FORWARD_FACE | **−1.975** |
| CAN_STOWED_CENTER | **−3.250** |
| CAN_STOWED_AFT_FACE | **−4.525** |
| CAN_DEPLOYED_FORWARD_FACE | **−4.525** |
| BAY_AFT_STATION / AFT_POST_PAIR | **−4.800** |
| CAN_DEPLOYED_CENTER | **−5.800** |
| CAN_DEPLOYED_AFT_FACE | **−7.075** |

`BAY_AFT_HOOP` remains as a legacy alias of `BAY_AFT_STATION`. The frozen S4A solids at that station are `AFT_POST_PORT` and `AFT_POST_STBD`, not a closed annular hoop.

Can length = stroke = **2.55 m**. Axis `(x_lat=0, y_vert=0.78)`. Outer can **1.00 × 0.82 m**.

Bay `z ∈ [−4.80, −1.70]`.

## Deployed bay engagement

```
deployedBayEngagement = CAN_DEPLOYED_FORWARD_FACE − BAY_AFT_STATION
                      = −4.525 − (−4.800)
                      = +0.275 m
```

Positive means the can **forward face is 0.275 m forward of the aft-post station**. The deployed can still occupies bay `z ∈ [−4.800, −4.525]`.

The can does **not** leave the bay entirely. It **does** perform a full body-length extraction relative to the fixed core bulk, leaving only the terminal engagement in the bay.

That 0.275 m overlap is **mechanically useful**. Usable engagement after 0.04 m margins each end: **0.195 m**. This is can-to-bay engagement, **not** core-spigot-to-can insertion.

## Handover region

Not a single plane.

| Station | z |
| --- | ---: |
| recommended core aft bulk | **−4.405** |
| deployed can mouth | **−4.525** |
| core→mouth bridge gap | **0.120 m** |
| selected spigot interval | **[−4.645, −4.405]** |
| can receiver interval | **[−4.705, −4.525]** |
| actual flow insertion | **0.120 m** |
| aft-post station | **−4.800** |

See `MT1_DP1_HANDOVER_MODEL.md`.

## Allowances (`DP1_ARCHITECTURE_ASSUMPTION`)

| Item | Study value | range |
| --- | ---: | ---: |
| can wall per face | 0.06 m | 0.05–0.08 |
| running clearance per face | 0.04 m | 0.03–0.05 |
| alignment/thermal per face | 0.03 m | 0.02–0.04 |
| end-wall allowance | 0.06 m | — |
| published flow spigot (DP1) | 0.15 m | retained for comparison |
| **selected flow spigot (DP1A)** | **0.24 m** | revised; 0.15 m insertion was 0.030 m |
| selected receiver depth | 0.18 m | study sleeve |

Shoes sit **below** the envelope (gap +0.010 m). They do not cut the inner bore.

## Derived envelopes (`DP1_DERIVED_ARCHITECTURE_RESULT`)

Unchanged from audited DP1.

| Envelope | w × h (m) |
| --- | --- |
| outer can (frozen) | 1.00 × 0.82 |
| inner axial passage | **0.88 × 0.70** |
| max fixed-core section | **0.74 × 0.56** |
| recommended core section | **0.70 × 0.52** |

| Band | z_aft | z_fwd | length |
| --- | ---: | ---: | ---: |
| max core packaging | −4.525 | −2.075 | 2.45 |
| recommended core | −4.405 | −2.605 | 1.80 |

Full-stroke sweep (21 samples): overlapping core stays inside the inner passage; min architectural radial clearance **0.07 m**. This is an **analytical rectangle model**, not a physical mesh sweep. Core-fit **survives** at the published nominal allowances.

## Allowance-range core envelopes (8 corners)

Published ranges only (allowances themselves unchanged): wall 0.05/0.08, running 0.03/0.05, align 0.02/0.04.

`maxCoreW = 1.00 − 2(wall+running+align)`  
`maxCoreH = 0.82 − 2(wall+running+align)`

| Id | wall | run | align | max W | max H | admits 0.70×0.52 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| WLRLAL | 0.05 | 0.03 | 0.02 | **0.80** | **0.62** | yes |
| WLRLAH | 0.05 | 0.03 | 0.04 | 0.76 | 0.58 | yes |
| WLRHAL | 0.05 | 0.05 | 0.02 | 0.76 | 0.58 | yes |
| WLRHAH | 0.05 | 0.05 | 0.04 | 0.72 | 0.54 | yes |
| WHRLAL | 0.08 | 0.03 | 0.02 | 0.74 | 0.56 | yes |
| WHRLAH | 0.08 | 0.03 | 0.04 | 0.70 | 0.52 | yes (exact) |
| WHRHAL | 0.08 | 0.05 | 0.02 | 0.70 | 0.52 | yes (exact) |
| WHRHAH | 0.08 | 0.05 | 0.04 | **0.66** | **0.48** | **no** |

| Class | W × H | meaning |
| --- | --- | --- |
| Favorable (all LOW) | 0.80 × 0.62 | largest corner |
| Nominal published allowances | 0.74 × 0.56 | max core at 0.06/0.04/0.03 |
| Conservative (all HIGH) | 0.66 × 0.48 | smallest corner |

**`NOMINAL_CORE_PROXY` = 0.70 × 0.52** — existing recommended section. It is **nominal-only**, not range-robust: it matches two mixed HIGH corners and does **not** fit WHRHAH.

**`RANGE_ROBUST_CORE_PROXY` = 0.66 × 0.48** — conservative-corner maximum. Bookkeeping only. B′ recommended architecture remains 0.70 × 0.52.

B′ remains geometrically possible inside frozen S4A. The caution now also includes: a core frozen at 0.70 × 0.52 would not survive the most conservative published allowance corner.
