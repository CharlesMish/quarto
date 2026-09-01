# MT1-US1 — results

JSON: `evidence/us1-results.json`. Diagrams: `evidence/us1-long.svg`, `evidence/us1-top.svg`.

No professions assigned. No S6, shell, cockpit, or contact hardware.

## Centerline finding

There is **no continuous unoccupied longitudinal void**.

The frozen centerline is a **carrier plus interruptions**:

- ventral keel bar and dorsal longeron = occupied structure;
- three solid bulkhead plates at z = 3.35, 1.15, −1.70;
- propulsion bay = can/core mechanism;
- dorsal keep and DRIVE waist = must remain clear;
- front reserved box = unclaimed but protected.

A route may **ride** the keel/longeron. It cannot walk through an empty spine that does not exist.

Tag: `DERIVED_OBLIGATION`.

## Region table

| Region | Class | Occupants (frozen) | Reservation | Route through? | Occupy volume? | Access | If consumed, forbids | Tag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Front reserved box (`KEEP_COCKPIT`, historical name) | UNCLAIMED_BUT_PROTECTED | none assigned; AABB meets `DORSAL_LONGERON`, `BULKHEAD_Z3p35` | protected-corridor; protects `BULKHEAD_Z3p35` | no tunnel; not an operator assignment | no arbitrary hardware | must not shrink | fake cockpit / pre-empt occupancy study | FROZEN_FACT |
| Ventral keel | OCCUPIED_STRUCTURE | `VENTRAL_KEEL` | none | along the member only | already occupied | external faces | delete GE1 minY structure | FROZEN_FACT |
| Dorsal longeron | OCCUPIED_STRUCTURE | `DORSAL_LONGERON` | none (keep sits above) | along the member | already occupied | sides/underside | delete forward dorsal spine | FROZEN_FACT |
| `BULKHEAD_Z3.35` | SERVICE_INTERFACE | `BULKHEAD_Z3p35` | listed by KEEP_COCKPIT | crossing/penetration only | no | station face | erase station; hit reserved box | FROZEN_FACT |
| `BULKHEAD_Z1.15` | SERVICE_INTERFACE | `BULKHEAD_Z1p15` | none | crossing only | no | station face | erase mid-keel station | FROZEN_FACT |
| `BULKHEAD_Z-1.70` | SERVICE_INTERFACE | `BULKHEAD_Z-1p70` | bay forward station | crossing only; aft is the bay | no | bay-forward face | collapse keel/bay split | FROZEN_FACT |
| Dorsal keep | MUST_REMAIN_CLEAR | none assigned | `KEEP_DORSAL` protected-corridor | no occupation | no | protected corridor | violate certified keep | FROZEN_FACT |
| DRIVE waist | MUST_REMAIN_CLEAR | empty occupancy (outboard of keel) | `DRIVE_WAIST_PORT/STBD` | no; not spine space | no | none for utilities | violate seated-lateral empty occupancy | FROZEN_FACT |
| Bay walls + aft posts | OCCUPIED_STRUCTURE | `BAY_WALL_*`, `AFT_POST_*` | none | along faces | walls occupied; interior is can/core | inner faces see the can | delete the bay | FROZEN_FACT |
| Fixed propulsion core | OCCUPIED_MECHANISM | S5 core / supports / spigot | physical S5 | around supports only | no | existing load path | violate S5 handover | FROZEN_FACT |
| Can translation corridor | OCCUPIED_MECHANISM | `DRIVE_ENVELOPE`, `S5_CAN_*` | moving can | no occupation across stroke | no | open stern / inspection | block certified translation | FROZEN_FACT |
| Four root stations (keel meeting) | SERVICE_INTERFACE | nest/socket/channel frames | local structure | keel edge only | no new central volume | hinge/rail/nest | orphan laterals | FROZEN_FACT |
| Open stern / service throat | MUST_REMAIN_CLEAR | aft posts at the sides | inspection/handover | access only | no | must stay open | hide propulsion handover | FROZEN_FACT |
| Interstitial between bulkheads | ROUTING_CANDIDATE | no granted room | none — not AVAILABLE | along members; not a tunnel | occupying as a room is UNKNOWN | via bulkhead interfaces | pretend a hollow spine | ARCHITECTURE_HYPOTHESIS |

Book flanks (DRIVE nested books) are **OCCUPIED_MECHANISM** and are **not** utility-spine space.

BODY-SHELL-03.1 creates no volume rights.

## What is not decided

Fuel, batteries, avionics, computers, life support, cargo, crew/operator, weapons/tools, intake, engine internals: **not assigned**.

Ventral contact hardware: **not reopened** (GE1 closed).

## Recommended next slice

**Keel-carrier crossing interfaces.**

The centerline is mostly structural/mechanical. Routing is fragmented. The dominant problem is how a longitudinal route may ride the frozen ventral keel / dorsal longeron and **cross** `BULKHEAD_Z3.35`, `BULKHEAD_Z1.15`, `BULKHEAD_Z-1.70`, and the propulsion bay **without** occupying the can stroke, DRIVE waist, dorsal keep, or front reserved box.

Not cockpit. Not ground hardware. Not another shell. Not utility-component assignment.
