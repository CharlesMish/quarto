# MT1-S2 / S2A decisions

## Starting family

Used the consultation neighborhood, not frozen numbers:

* planform ~30–40% of rear → chose `3.20 × 1.10` (~32% of `4.68 × 2.16`);
* inner span 1.70 so the seated book fits the 2.20 m bulkhead gap with catch/receiver room;
* outer 1.50 (shorter leaf) for fold-floor;
* folded thickness 0.54 (inside 0.48–0.56).

Not made trivially tiny.

## Pivot Y

`1.75` as a SPREAD pivot was rejected. Mid-fold of a 1.50 m outer from `y = 1.75` hits the floor.

Minimum geometric pivot: `0.06 + outer + hingeDrop ≈ 1.83`. Working point **2.22** after adding hinge-barrel / rib margin.

Measured min floor Y = **0.426 m** at `frontT = 0.146` (`FL_OUTER_ARMOR`). That is the fold-floor result.

Seated mid-height at this pivot and 70° is ≈ 1.62 m — the strake band the consultation wanted, achieved without lowering the SPREAD hinge into the fold disk.

## Cant

Bounded study 65° / 70° / 75°, all legal:

| deg | seated half-width | min cockpit | min floor (seated/cant) | width ≤ 2.239 |
| --- | --- | --- | --- | --- |
| 65 | 1.845 | 0.211 | 0.995 | yes |
| **70** | **1.756** | **0.193** | **0.995** | yes |
| 75 | 1.665 | 0.178 | 0.997 | yes |

Chose **70°** to stay in the rear haunch family and keep a crouched strake rather than walking the book into a wall. 75° is narrower and closer to the cockpit. 65° is wider. None required a topology change.

## Socket stroke

Not prescribed. `spreadX = −1.78` and `nestX = −1.38` give **0.40 m**.

`nestX` is set by hang-from-top inboard swing (`0.54 · sin 70° ≈ 0.51`) plus cockpit clearance. Inboard seated generator `−0.873` stays 0.193 m from the cockpit wall. Stroke stays ≥ 0.35.

## Book vs nest locks

Kept separate. Book pin is −Y through the folded stack. Nest pin is +X into the carry. After 70° cant those axes are not the same. No merger.

## Passive catch

Adopted at the aft hinge end (`z ≈ 1.60` seated), on the `BULKHEAD_Z1p15` carry station. Engages as a consequence of +X socket.

## Reservations

Deleted `KEEP_FWD_PORT_NEST`. Reclassified cockpit / dorsal / certified rear E2 / aft bay as `PROTECTED_CORRIDOR`. Derived `KEEP_FWD_STBD_NEST` from measured seated front-left + 0.08 pad.

## S2A forensic correction

S2 topology survived independent audit. S2A repaired representation/voids, not the species.

1. **F01 receiving lane.** Removed `FWD_LONGERON` / `FWD_SHELF` / `FWD_POST_FWD` from the seated strake volume. Open cradle: high/low inboard longerons + Z-end frames. Full moving×carry sweep is now a gate.
2. **F02 book-pin bore.** Split inner and outer armor/underside around a 0.06 m Y-hole. The pin no longer travels through vane solids.
3. **F03 nest vs rail.** Nest pin/receiver moved to `y = 2.38`, `z = 3.50`. Rail stays at `y = 2.22`, `z = 3.22`.
4. **F04 catch arm.** Arm dropped to `y = 0.90` aft of the book. Risers meet cheeks from below. Keeper moved aft (`spar x = −1.84`) so the throat is behind the vane.
5. **F05 occupancy.** Starboard reservation is the seated union of **all 40 moving** primitives, not `book:` only.
6. **F06 verifiers.** Full-path all-solid sweeps with first/last `frontT` on failure. S2's named-family-only tests would now fail F01–F04 if reintroduced.
7. **F07 graph.** Declared `CARRY_INTERFACES` with 2 mm contact. The 20 mm proximity rule is gone.

Preserved: 2.22 m pivot, 70° cant, 0.40 m +X socket, book 1.70/1.50/1.10/0.54, separate book/nest locks, two-station carry, aft yaw, unshrunk cockpit.

Floor 0.426 m, cockpit 0.193 m, firewall margin 1.015 m (was 1.145; keeper now sets minZ).

## What was not changed

Rear 70°, 0.48 m socket, nest X, book, latch, nest, channel, bay, drive, and the ~0.050 m roll clearance. No S1C reopen.

## Unresolved

1. Rear DRIVE-width vs 70° crouch is still a later question. Front half-width 1.756 m does not add to it.
2. No CG / aero authority. Front-as-control is a hypothesis.
3. Whole-machine `transformT` mapping of `frontT` + rear `transformT` is not done.
4. Right-front / right carry not built.
5. Production cockpit width is not frozen; 0.813 m is study headroom only.
