# MT1-GE1 — results

Source: live physical-authority AABBs at SPREAD (`machineT=0`), STRUCTURAL_READY (`0.84`), DRIVE (`1`), plus frozen S4A E1–E4. JSON: `evidence/ge1-results.json`.

**3.0–3.6 m DRIVE-width sketch is not a target.** It is a superseded S1 historical expectation. Certified DRIVE width is **4.600 m**.

## Frozen-envelope table

Tag: `FROZEN_FACT`.

| Envelope | W (m) | H (m) | L (m) | minY (m) | notes |
| --- | ---: | ---: | ---: | ---: | --- |
| S4A E1 moving instant | 13.367 | 2.665 | 10.590 | — | max instantaneous moving |
| S4A E2 moving swept | 13.367 | 2.665 | 11.395 | **0.260** | `y∈[0.260, 2.925]`, `x∈[−6.684, 6.684]`, `z∈[−7.075, 4.320]` |
| S4A E3 whole instant | 13.367 | 2.895 | 11.700 | — | includes fixed keel/rails |
| S4A E4 whole swept | 13.367 | 2.895 | 11.700 | **0.030** | `y∈[0.030, 2.925]`, `z∈[−7.150, 4.550]` |
| S4A endpoint SPREAD | 13.320 | 2.895 | 11.700 | — | recorded in `s4-authority-report.json` |
| S4A endpoint STRUCTURAL_READY | **4.600** | 2.895 | 11.700 | — | `machineT=0.84` |
| S4A endpoint DRIVE | **4.600** | 2.895 | 11.700 | — | same plan width as ready |

S5 conservative records floor these E1–E4 values. GE1 does not enlarge or shrink them.

## Live endpoint table (S5HR3R1 extraction)

Tag: `FROZEN_FACT` (extracted from the certified machine; millimetres are not a new freeze).

| | SPREAD t=0 | READY t=0.84 | DRIVE t=1 |
| --- | ---: | ---: | ---: |
| Whole W × H × L | 13.320 × 2.895 × 11.700 | 4.600 × 2.895 × 11.700 | 4.600 × 2.895 × 11.700 |
| Whole lowest | VENTRAL_KEEL **0.030** | VENTRAL_KEEL **0.030** | VENTRAL_KEEL **0.030** |
| Moving lowest | DRIVE_SHOE_P **0.260** | DRIVE_SHOE_P **0.260** | DRIVE_SHOE_P **0.260** |
| Keel ventral minY | 0.030 | 0.030 | 0.030 |
| Front-book minY | FL_CATCH_CHEEK_FWD **1.582** | FL_OUTER_ARMOR_1 **1.002** | FL_OUTER_ARMOR_1 **1.002** |
| Rear-book minY | RL_LATCH_CHEEK_P **2.270** | RL_OUTER_ARMOR **0.531** | RL_OUTER_ARMOR **0.531** |
| Clearance whole → floor | 0.030 | 0.030 | 0.030 |
| Clearance moving → floor | 0.260 | 0.260 | 0.260 |

Ready and DRIVE have the same whole width. The can deploys inside the already-recorded E4 length (`z` to −7.15 on the rails).

## Environmental plane / ventral clearance

| Item | Value | Tag |
| --- | --- | --- |
| Mechanical Truth floor datum | **y = 0** (scene ground / S1–S2 fold datum) | FROZEN_FACT |
| Declared as final contact plane? | **No** | DERIVED OBLIGATION / study rule |
| Lateral design clearance | `DESIGN_CLEARANCE = 0.06 m` | FROZEN_FACT |
| Keel center Y | `P.keel.ventralY = 0.10` | FROZEN_FACT |
| Keel AABB minY | **0.030 m** | FROZEN_FACT |
| Moving swept minY (E2) | **0.260 m** | FROZEN_FACT |
| S2 local front-fold min floor Y | 0.426 m at `frontT=0.146` | FROZEN_FACT (S2) |
| S1 rear mid-fold tip | ≈0.26 m (reason the rear station is a high shoulder) | FROZEN_FACT |
| Godot P1A R7 | ground-network world; vehicle can hop | GAMEPLAY_SEMANTIC |

**Ground-aware ≠ ground-contact mechanism selected.**

GE1 concludes **ground-aware** (`DERIVED_OBLIGATION`): laterals were designed against y=0, and Godot operates on ground routes with hop. GE1 does **not** conclude wheels, skids, feet, hover, or suspension.

## Ventral-interface zoning

| Region | Kind | Tag |
| --- | --- | --- |
| y < 0 | MUST REMAIN CLEAR | FROZEN_FACT |
| Under VENTRAL_KEEL down to y=0 | MUST REMAIN CLEAR | FROZEN_FACT |
| Fold-floor tracks of moving laterals | MUST REMAIN CLEAR | FROZEN_FACT |
| Outboard of keel, y∈(0, 0.26), outside fold sweep | UNKNOWN | UNKNOWN |

No empty hover plenum exists **under the keel**. A 30 mm keel-to-datum gap is occupied structure, not a clearance bay.

## SPREAD vs DRIVE volume map

VA1 dual-configuration obligation: both poses are required. BODY-SHELL-03.1 may illustrate; it does not own these volumes.

| Region | SPREAD | DRIVE |
| --- | --- | --- |
| Front reserved box (`KEEP_COCKPIT`, historical name) | MUST REMAIN CLEAR | MUST REMAIN CLEAR |
| Keel core | contains | contains |
| Dorsal keep / service corridor | MUST REMAIN CLEAR | MUST REMAIN CLEAR |
| Bay + can corridor | contains (can stowed) | contains (can seated; 0.275 m bay overlap) |
| DRIVE waist | available / not yet the seated empty cell | MUST REMAIN CLEAR (certified empty occupancy) |
| Four book roots | contains | contains |
| Book envelopes | outboard planform | flank hang; still proud of keel |
| Ventral band | keel at 0.030; books high | keel at 0.030; rear books to 0.531 |
| Open stern / service throat | inspectable | contains seated can; must stay open |

## Hypothesis table

| Hypothesis | Status | Tag | Reversible? |
| --- | --- | --- | --- |
| Empty hover / clearance gap under keel | **Not supported** | ARCHITECTURE_HYPOTHESIS | yes |
| Skid / contact reserve on keel underside | **UNKNOWN** | UNKNOWN | yes |
| Deployable gear reserve | **UNKNOWN** | UNKNOWN | yes |
| y=0 is a study/fold datum, not a certified running surface | **Provisional preferred** | ARCHITECTURE_HYPOTHESIS | yes — explicit, does not freeze hardware |

Future evidence that would decide contact: a dedicated interface study that (a) does not intersect fold sweep or waist, (b) states whether the study floor is a running plane, (c) is not inferred from Godot hop alone.

## Diagnostic captures (study-only)

No new vehicle solids. Frozen machine only:

- `evidence/ge1-spread-side.png`, `ge1-ready-side.png`, `ge1-drive-side.png`
- `evidence/ge1-spread-top.png`, `ge1-drive-top.png`
- `evidence/ge1-side.svg`, `ge1-top.svg`

BODY-SHELL-03.1 was not required on these captures. Canonical BODY OFF is Mechanical Truth.

## Recommended next slice

**MT1-US1 — utility spine zoning.**

Reason: GE1 supports a **ground-aware** obligation and does **not** support a selected contact/transit mechanism. Under-keel hover is unavailable. Skid/gear remain UNKNOWN. Decision logic therefore selects utility spine zoning of the already-occupied keel / bay / dorsal core.

Not recommended: another body-shell pass; finished wheels/skids/gear; S6; operator/cockpit occupancy (still later unless a future study establishes onboard occupancy).
