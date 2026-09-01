# MT1-VB1 — mass assumptions

Tag: **ASSUMPTION**. Director-reviewable. Not authority.

## Normalization

Nominal whole-machine assumed mass = **100 RMU**.

Uniform rescaling of every family leaves CG, migration, thrust-arm, and family rankings unchanged (VB1-G6).

No kilograms are used as production inputs.  
`evidence/vb1-results.json` → `solidBilletAbsurdity` is labeled **NOT AN INPUT — SOLID-BILLET ABSURDITY CHECK**.

## Families (whole-machine totals)

| Id | Name | LOW | NOM | HIGH | Location proxy |
| --- | --- | ---: | ---: | ---: | --- |
| F1 | REAR_BOOKS | 8 | 16 | 28 | 50/50 sides; inner/outer by SPREAD planform area; armor centers follow S4A hierarchy |
| F2 | FRONT_BOOKS | 4 | 8 | 16 | same rule on front armor-panel unions |
| F3 | REAR_FIXED | 6 | 10 | 16 | union-AABB center of channels/nests/rails |
| F4 | FRONT_CARRY_FIXED | 6 | 10 | 16 | union-AABB center of both FWD_CARRY assemblies |
| F5 | CENTRAL_STRUCTURE | 12 | 20 | 30 | union-AABB center of keel/bulkheads/bay (long in Z — documented limitation) |
| F6 | DRIVE_MOVING | 4 | 14 | 32 | `DRIVE_ENVELOPE` center; translates −Z |
| F7 | DRIVE_FIXED | 3 | 6 | 10 | union-AABB of `DRIVE_RAIL_P/S` |
| F8 | COCKPIT_ALLOWANCE | 2 | 10 | 22 | `KEEP_COCKPIT` center; face slides are sensitivity |
| F9 | WAIST_SYSTEMS_ALLOWANCE | 1 | 6 | 12 | 50/50 at the two waist-cell centers |

Nominal sum = 100.

### Rationales

* F1/F2/F3/F4/F5: construction-philosophy span (light shell vs built-up), not ±5% tolerance.
* F6: broadest range — empty stand-in vs dense machinery. Only the translating body.
* F8: empty reservation vs a full forward package.
* F9: modest symmetric systems. High is still not 13 m³ of machinery.

Carried book hardware (ribs, underside, latch, pins, carriages) is **represented** by the leaf centers. It is not given a second mass point. Inner/outer 50/50 vs area-split Δz_long = 0.0007 m (negligible).

## Named scenarios

| Id | Construction |
| --- | --- |
| ALL_LOW | every family LOW (46 RMU) |
| NOMINAL | every family NOMINAL (100 RMU) |
| ALL_HIGH | every family HIGH (182 RMU) |
| HEAVY_AFT_LIGHT_FORWARD | F1/F3/F6/F7 HIGH; F2/F4/F8 LOW; F5/F9 NOM |
| HEAVY_FORWARD_LIGHT_AFT | F2/F4/F8 HIGH; F1/F3/F6/F7 LOW; F5/F9 NOM |
| HEAVY_DRIVE_MOVING | F6 HIGH; others NOM |
| LIGHT_DRIVE_MOVING | F6 LOW; others NOM |
| HEAVY_COCKPIT | F8 HIGH; others NOM |
| HEAVY_WAIST_SYSTEMS | F9 HIGH; others NOM |

No Monte Carlo. Audit-only 512 LOW/HIGH corners are reported as min/max only.

## Allowances

F8 and F9 are future mass living in certified empty boxes. They are not current physical geometry and are not an excuse to build cockpit or intake solids.
