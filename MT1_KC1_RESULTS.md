# MT1-KC1 — results

JSON: `evidence/kc1-results.json`. Diagrams: `evidence/kc1-long.svg`, `evidence/kc1-top.svg`.

US1 stands: **there is no empty longitudinal spine.**

## 1. Candidate carrier lanes (two)

### VK — ventral-keel side faces (bilateral)

| | |
| --- | --- |
| Carrier | `VENTRAL_KEEL` port/starboard faces, \|x\|=0.15, y∈[0.03, 0.17], z∈[−4.95, 4.55] |
| Start / end | Keel nose **under** KEEP_COCKPIT (keep ymin=0.30) → keel aft z=−4.95 **under** the can, short of the open stern |
| Continuity | The bar is continuous. Three 80 mm plates occupy the same XY at z=3.35, 1.15, −1.70, so along-face travel is interrupted. |
| Handoffs | Those three bulkheads |
| Protected / moving | Below KEEP_COCKPIT; far below KEEP_DORSAL; inboard of waist xIn=0.81; under can bottom (0.37). Open throat not occupied. |
| SPREAD / DRIVE | Fixed. Live moving AABB vs lane box: **no hits** at t=0 / 0.84 / 1. Fold-path XY at the wraps is **UNKNOWN**. |
| Tag | ARCHITECTURE_HYPOTHESIS |

### DL — dorsal-longeron underside, truncated

| | |
| --- | --- |
| Carrier | `DORSAL_LONGERON` underside y≈1.445 |
| Start / end | z≈2.48 (aft of KEEP_COCKPIT) → z=−1.70 (longeron ends) |
| Continuity | Member continues into the reserved box; **that forward part is not used**. Remaining run still meets BULKHEAD_Z1.15. |
| Handoffs | BULKHEAD_Z1.15; drop on BULKHEAD_Z-1.70 face to VK |
| Protected | Top of longeron not used (KEEP_DORSAL). Does not enter can corridor. |
| SPREAD / DRIVE | Fixed. Live moving hits: none at the three poses. |
| Tag | ARCHITECTURE_HYPOTHESIS |

No bay-wall or aft-post longitudinal lane: outboard walls are book-flank; inner walls are can; posts crowd the throat.

## 2. Crossing classification

### A. BULKHEAD_Z3.35

KEEP_COCKPIT contains this z. Over the plate is inside the keep → **NO_ROUTE**. Through the plate → **PENETRATION_REQUIRED** (not authorized). Existing keel/plate AABB overlap is not a passage.

| Candidate | Class | Tag |
| --- | --- | --- |
| Over plate | NO_ROUTE | FROZEN_FACT |
| Through plate | PENETRATION_REQUIRED | DERIVED_OBLIGATION |
| Sleeve at keel/plate intersection | DECLARED_SLEEVE_REQUIRED | ARCHITECTURE_HYPOTHESIS |
| 80 mm edge wrap at x≈±0.75, y≈0.10 | EDGE_BYPASS | UNKNOWN (unmarked space; front hinge z=3.22) |

Skeleton uses **DECLARED_SLEEVE_REQUIRED**. Edge wrap is not treated as granted AVAILABLE.

### B. BULKHEAD_Z1.15

Aft of KEEP_COCKPIT. KEEP_DORSAL covers this z but only y≥1.56. Waist is outboard of 0.81.

| Candidate | Class | Tag |
| --- | --- | --- |
| Dorsal-keep duct | NO_ROUTE | FROZEN_FACT |
| Through plate | PENETRATION_REQUIRED | DERIVED_OBLIGATION |
| Sleeve at keel/plate intersection | DECLARED_SLEEVE_REQUIRED | ARCHITECTURE_HYPOTHESIS |
| Edge wrap at keel height | EDGE_BYPASS | ARCHITECTURE_HYPOTHESIS (unmarked, not granted) |

Skeleton uses **DECLARED_SLEEVE_REQUIRED**.

### C. BULKHEAD_Z-1.70 (bay forward)

Dorsal longeron ends. Ventral keel **already continues under the bay** (keel top 0.17, can bottom 0.37). That is frozen structure, not a new tunnel.

| Candidate | Class | Tag |
| --- | --- | --- |
| Enter can / core | NO_ROUTE | FROZEN_FACT |
| Drop DL on bay-forward face to VK | SURFACE_HANDOFF | ARCHITECTURE_HYPOTHESIS |
| VK under bay | SURFACE_HANDOFF | FROZEN_FACT |
| Sleeve at keel/plate intersection | DECLARED_SLEEVE_REQUIRED | ARCHITECTURE_HYPOTHESIS |

## 3. Bay / aft continuation

Outboard bay walls: **NO_ROUTE** (DRIVE book flanks). Inboard walls: **NO_ROUTE** (can). Aft posts: **NO_ROUTE** as a through-route (open stern). VK under bay: **SURFACE_HANDOFF**, terminate before the throat.

## 4. Protected-volume conflicts

- KEEP_COCKPIT forbids over-plate and forward-dorsal routing at z=3.35.
- KEEP_DORSAL forbids using the keep as a duct.
- DRIVE waist = outboard empty cells, not a center box.
- Can/core = mechanism.
- Open stern = inspectable void.
- Book roots/sweeps are not carrier lanes.

## 5. SPREAD / DRIVE

VK and DL are fixed solids. Endpoint live checks against the conceptual lane boxes were empty. Fold-sweep XY at the three station wraps is **UNKNOWN** and is why edge-wrap is not promoted to EXISTING_PASSAGE.

## 6. Outcome

**B — CONTINUOUS_ROUTE_REQUIRES_DECLARED_CROSSINGS**

A coherent forward→aft **carrier** exists (ventral keel under the reserved box and under the can). No existing holes in the three plates. Continuity therefore requires a **declared crossing at each of BULKHEAD_Z3.35, Z1.15, and Z-1.70**, preferably sleeves at the already-overlapping keel/plate intersections. That finding does **not** authorize cutting.

Not A: no frozen passage through the plates.  
Not C: the carrier itself is continuous; only the stations interrupt.  
Not D: a meaningful skeleton is identifiable.

## 7. Next slice

**Declared keel/bulkhead crossing sleeves (three stations).**

Bounded crossing/sleeve architecture at those plates only. Still no professions, no hollow fuselage, no KEEP_COCKPIT occupancy, no ground hardware, no S6, no shell.
