# MT1-DP1A — handover model

Study-only analytical interface. Not S5 geometry. Not a seal, CFD, or load-capacity proof.

Source DP1 SHA-256: `fc46ae8f55c2484273375a65fe2745a8977929738daf4a5a17e46ee5e7743761`

## Flow intervals (`DP1_DERIVED_ARCHITECTURE_RESULT`)

+Z is forward.

| Quantity | z (m) |
| --- | ---: |
| CORE_BULK_AFT_FACE / FLOW_SPIGOT_ROOT | **−4.405** |
| CAN_DEPLOYED_FORWARD_FACE / CAN_RECEIVER_FORWARD_FACE | **−4.525** |
| BAY_AFT_STATION (AFT_POST_PAIR) | **−4.800** |

```
coreToCanMouthGap = CORE_BULK_AFT_FACE − CAN_DEPLOYED_FORWARD_FACE
                  = −4.405 − (−4.525)
                  = +0.120 m
```

This is the **bridge the fixed neck must traverse before it enters the can**. It is not insertion.

### Selected DP1A assumption (revised)

The published DP1 `flowSpigotLength = 0.15 m` is retained as a comparison value. It is **not** the selected DP1A length.

If a 0.15 m spigot is rooted at −4.405:

* tip = −4.555
* overlap with a 0.18 m receiver from −4.525 = **0.030 m**

That is geometrically positive and too short to treat as a mechanically intelligible handover. DP1A therefore **revises** the study assumption:

| Item | value |
| --- | ---: |
| selected spigot length | **0.24 m** |
| FLOW_SPIGOT_INTERVAL | **[−4.645, −4.405]** |
| selected receiver depth | **0.18 m** |
| CAN_RECEIVER_INTERVAL | **[−4.705, −4.525]** |
| actual flowInsertion | **0.120 m** |
| remaining receiver aft of tip | **0.060 m** |
| remaining bay aft of tip | **0.155 m** |

`flowInsertion = overlapLength(FLOW_SPIGOT_INTERVAL, CAN_RECEIVER_INTERVAL)`.

It is **not** `usableBayEngagement` (0.195 m).

G6 requires the existing `flow.nondegenerate` semantic: insertion must be strictly greater than `NONDEGENERATE_INSERTION = 0.05 m`, the receiver and axial passage must exist, and all interface margins must be nonnegative. Positive insertion alone is insufficient.

### Candidates compared (A4)

| id | length | insertion | residual receiver | judgment |
| --- | ---: | ---: | ---: | --- |
| published_0.150 | 0.15 | 0.030 | 0.150 | marginal |
| **selected_0.240** | **0.24** | **0.120** | **0.060** | selected |
| receiver_fill_0.300 | 0.30 | 0.180 | 0.000 | longest useful for this receiver |

0.24 m was chosen so insertion is nondegenerate **and** a residual receiver remains for the coaxial register. It is not a manufactured 75 mm rule.

### Receiver role

Internal mouth/sleeve band inside the certified can outer envelope. It preserves the hollow axial passage. It does not add exterior geometry. Radial role: INNER_ANNULUS (with the alignment register).

## Structural envelopes (`DP1_ARCHITECTURE_ASSUMPTION`)

The frozen S4A aft structure is an **AFT_POST_PAIR** plus bay walls and connected keel members. It is not a closed annular hoop.

| Region | interval / gap |
| --- | --- |
| seat axial band | z ∈ [−4.720, −4.525] (0.195 m usable) |
| lateral free band | **0.100 m** each side (bay halfW 0.60 − can halfW 0.50) |
| vertical free band | **0.090 m** upper and lower |
| rail-free lug sectors | PORT, STARBOARD, TOP |
| excluded | BOTTOM_RAIL_SHOE |

Register occupies INNER_ANNULUS, z ∈ [−4.645, −4.525].  
Lugs occupy OUTER_SECTORS, z ∈ [−4.685, −4.525], 4 dogs, rail-free only.

Flow receiver and structural lock **may share the same axial band**. They are radially zoned, not stacked serially in the 0.195 m.

### HANDOVER_FRAME_ENVELOPE

Future S5 geometry. DP1A only claims a nonzero region exists:

* z ∈ [−4.800, −4.525]
* x half ≈ 0.65 (bay wall + 0.05 study allowance)
* y ∈ [0.28, 1.28] (bay)

Endpoints: seat at the can mouth, then the named existing-structure chain `AFT_POST_PAIR` → `BAY_WALL_PORT/STBD` → `BULKHEAD_Z-1p70` → `VENTRAL_KEEL`.

## Contact graph

```
MOVING_CAN
  -- same_interface_station -->
MOVING_LOCK_HALF
  -- overlapping_study_envelope -->
FIXED_REGISTER_SEAT
  -- named_future_direct_splice -->
HANDOVER_FRAME
  -- named_future_direct_splice -->
AFT_POST_PAIR
  -- existing_s4a_physical_contact -->
BAY_WALL_PORT/STBD
  -- existing_s4a_physical_contact -->
BULKHEAD_Z-1p70
  -- existing_s4a_physical_contact -->
VENTRAL_KEEL
```

The three existing-S4A edges above are verified direct contacts. No edge claims direct `AFT_POST_PAIR` or `BAY_WALL_PORT/STBD` contact with `VENTRAL_KEEL`.

G7 PASSes if this graph is connected, terminates on existing S4A structure, envelopes fit, and no edge occupies a forbidden rail sector.

**S5 must still instantiate and physically verify this path.**

G8 PASSes if the operating-load graph has a complete route with **no** `DRIVE_RAILS` edge. That is rail-bypass **architecture**, not rail-stress certification.

## Radial zoning (coexistence)

| Zone | role |
| --- | --- |
| CENTER | continuous flow passage |
| INNER_ANNULUS | spigot / receiver / alignment register |
| OUTER_SECTORS | lugs in PORT / STBD / TOP |
| EXCLUDED_SECTORS | BOTTOM rail/shoe |

No double-booking of the same solid volume unless the functions are intentionally concentric.

## Negative controls

| id | mutation | expected |
| --- | --- | --- |
| NC-FLOW1 | prior spigot 0.150 m | insertion ≈ 0.030 m; `nondegenerate=false`; G6 FAIL |
| NC-FLOW2 | receiver removed | G6 FAIL |
| NC-FLOW3 | receiver blocks passage | G5 and G6 FAIL |
| NC-STRUCT1 | seat removed | G7 FAIL (G8 FAIL) |
| NC-STRUCT2 | frame disconnected | G7 FAIL |
| NC-STRUCT3 | rails-only path | G8 FAIL |
| NC-STRUCT4 | lug hits rail sector | G7 FAIL |
