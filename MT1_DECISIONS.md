# MT1-S1 / S1A decisions

## Provisional dimensions chosen

Stayed inside the study ranges except where noted.

| Choice | Value | Why |
| --- | --- | --- |
| Keel width | 1.50 m | Mid of 1.4–1.6 |
| Rear reach | 2.52 + 2.16 = 4.68 m from root | Inside 4.5–5.5; split favours a shorter outer so the downward fold clears the floor |
| Chord | 2.16 m | Inside 2.0–2.4 |
| Book thickness | 0.64 m | Inside 0.55–0.70; underside ribs are real |
| Channel depth | 0.80 m | Mid of 0.70–0.90 |
| Bay | 1.20 × 1.00 × 3.10 | Inside the given box |
| Drive proxy | 1.00 × 0.82 × 2.55 | Fills the bay with ~0.10 m margin; not a token |
| Shoulder height | **y = 2.78 m** | See below |
| Nest `x` | **−1.50 m** | See below |
| Socket stroke | 0.48 m | Consequence of nest `x` |

## High shoulder (consultation change)

Underside-to-underside fold of a 2.16 m outer vane is a downward inversion. At a low GEV plane that disk goes through the floor. Authorized local response: raise the rear station to a high shoulder so mid-fold tip stays at ~0.26 m. The channel is therefore a **shoulder pocket**, not a belly slot. The book **hangs down** the flank after roll. The low bay stays free for the drive. This is a placement change, not a topology change.

## Nest `x` moved outboard during implementation

First nest target was `x ≈ −0.86` (against the bay wall). Hanging 70° about the **top** inboard edge swings the 0.64 m stack inboard by `0.64 sin 70° ≈ 0.60 m`, putting the book at `x ≈ −0.26` — inside the bay.

That is a real SAT fail (G2/G3/G5), not a screenshot opinion.

Authorized local fix: nest at `x = −1.50`. Inboard generator after hang is `≈ −0.91`, still outboard of the bay wall (`−0.75`). Socket stroke shrinks from 1.12 m to **0.48 m**. It remains a single-axis insertion on a rail that matches it. G4’s original 0.50 m threshold was an implementation check, not a director number; it was lowered to 0.35 m so a real 0.48 m stroke is not a false STOP.

## Channel lids removed

A full-depth top/bottom lip through the channel occupied the hang volume. Replaced with Z-end frames forward and aft of the book. The channel is still a modeled empty volume. This is housekeeping, not a deleted channel.

## Haunch-angle comparison

Computed at the seated pose (`t = 0.90`) plus a 21-sample roll sweep. Same machine, `haunchDeg` override only.

| Angle | Seated width (mirrored) | Seated height | Inboard `x` | Roll-sweep width | Min keel | Min drive |
| --- | --- | --- | --- | --- | --- | --- |
| 55° | 5.45 m | 2.76 | −0.99 | 2.21 | 0.050 | 1.47 |
| 62.5° | 4.98 m | 2.76 | −0.94 | 2.21 | 0.050 | 1.39 |
| **70°** | **4.46 m** | **2.76** | **−0.91** | **2.21** | **0.050** | **1.28** |
| 80° | 3.74 m | 2.76 | −0.87 | 2.21 | 0.050 | 1.07 |

Height is essentially the rail height for every hang angle. Width is the tradeoff. 80° is the only candidate near the 3.0–3.6 m DRIVE-width sketch. 70° is the crouched read (more flare). All four clear the keel and the drive.

**Frozen: 70°.** Crouch identity is the Slice-1 job. Width 4.46 m is recorded as overshoot, not hidden by steepening the book into a wall.

Evidence: `evidence/haunch-55-rear.png`, `haunch-62p5-rear.png`, `haunch-70-rear.png`, `haunch-80-rear.png`.

## World-matrix verifier bug (do not cite the first GREEN)

The first Playwright pass was a lie: child world matrices were stale, SAT tested the rest pose, every closest approach was `t = 0`, and all four haunch rows were identical. `forceWorldTree` now walks the graph before every sample. Only the second report (`status: GREEN` with distinct haunch rows and `minCritical` at `t = 0.63`) is evidence.

## What should be reconsidered before MT1-S2

1. **DRIVE width vs crouch.** 70° gives ~4.46 m mirrored width. If 3.0–3.6 m is binding, either accept 80° or shorten chord. Do not fake it with a ride-drop.
2. **Hang-from-top inboard swing.** It forces the nest outboard and caps socket stroke. A bottom-axis stand-up roll would nest tighter and go through the floor problem again unless the station stays high — then DRIVE gets taller. This is the next topology question if S2 needs a deeper socket.
3. **Front station height.** The rear is a high shoulder. The front keep-out is currently a box at that band. Confirm the front species wants the same plane before building it.
4. **Second Z support.** One X-rail at the trailing root cantilevers a 2.5 m book. Fine for S1. A production nest wants a second pickup after yaw.
5. **0.050 m mid-roll outer–keel.** 1 cm under target. A slightly shorter outer or a 2 cm aft-frame move would restore 0.06 if S2 wants the target strictly.

None of these require abandoning book → latch → yaw → roll → socket → lock → drive.

## S1A closure (this turn)

No topology change. No S2. Six bound fixes:

1. **Book latch now occupies the lug.** The S1 hook and lug did not share volume (hook mid-inner, lug mid-outer after fold, ~0.26 m apart). S1A places the hook SPAR station and the folded lug at the same point and rotates the hook `−90°` onto it. G11 asserts OBB overlap from `t = 0.27` (yaw still 0) through `t = 1.00` (74 samples).

2. **Nest pin now stays captured.** The S1 pin already overlapped the receiver in Z before the lock stroke and then walked out the far face. S1A retracts to `z = −0.02` and extends to `z = +0.16` so the 0.22 m pin covers the 0.12 m receiver and protrudes both ends. G12 asserts capture from `t = 0.90` through `t = 1.00` (11 samples).

3. **Engagement is automated**, not a screenshot claim. See `engagement` in `evidence/clearance-report.json` and gates G11/G12.

4. **G8 is the full 3×4 live/keep-out matrix** (inner, outer, drive × fwd-port, rear-stbd, cockpit, dorsal). S1 only checked vanes vs fwd-port and vanes vs stbd.

5. **`KEEP_REAR_STBD_NEST` is no longer a guessed box.** At construction the machine poses `t = 0.90`, measures the seated rear-left book AABB, and builds the starboard keep-out as the X-mirror plus `rearStbdPad = 0.08`. Resulting box is in the JSON (`keepRearStbd`).

6. **Two envelopes.** `envelope` / `envelopeMoving` remain vanes+drive. `envelopeWhole` unions every proxy (keel, hardware, keep-outs). Whole W/H/L = 8.936 / 2.830 / 11.675 m.

Authoritative dump for S1A was superseded by S1B.

## S1B authority repair (this turn)

S1A topology is frozen. This turn repaired representation, not mechanism.

1. **Latch is a U-throat + jaw.** S1A G11 proved two boxes occupied one volume. S1B: keeper enters an open U; the rotating jaw closes the mouth on the book-opening side. Hook solids do not intersect the keeper (min sep 0.005 m). Capture from `t = 0.27` through `t = 1.00`.

2. **Receiver is four solids around a real bore.** S1A `NEST_RECEIVER_BODY` was a solid box; the “bore” was painted on. S1B: cheeks + bridges, 0.06 × 0.06 empty Z opening. Pin clearance to frame 0.0125 m. No sideways entry.

3. **Physical solids are authority.** Every collision/envelope volume is the exact primitive it draws (`mesh-exact`). The old inset vane OBBs are gone. G1 open hinge-face contact (`minSep ≈ 0` at `t = 0`) is allowed; it is the hinge, not underbound theft.

4. **Keep-out from physical book.** Starboard reservation is the X-mirror of the seated physical book AABB (armor, underside, ribs, latch hardware) plus 0.08 m pad. Port seated `x[−2.239, −0.899] y[0.531, 2.802] z[−4.445, −1.850]`.

5. **E1–E4 vs E5.** Moving instant, moving swept, whole-real instant, whole-real swept. Keep-outs are E5 and are not folded into occupied-space numbers. Sampling `Δt=0.001` + refine `0.0001`.

6. **G2/G5 depend on G11/G12.** Yaw cannot pass without latch capture. Nest cannot pass without pin-in-bore capture.

7. **Diagnostics restore `transformT`.** `withPreservedPose` wraps clearance, haunch, and snapshots. Preview is explicit and `setT` exits it.

8. **Drive Z margins** recorded as 0.275 / 0.275, not 0.17 / 0.28.

9. **Stage-window prose** now describes the intentional overlaps instead of claiming strict sequencing the table does not have.

10. **Critical 0.050 m gap survives** on physical solids: `RL_OUTER_ARMOR` vs `CHANNEL_FRAME_AFT` = 0.049999847 m at `t = 0.63`. Not retuned.

Records were manually synchronized to `evidence/clearance-report.json` after the GREEN S1B run.

## S1C reporting closure (this turn)

No machine geometry, dimensions, transforms, stages, latch, nest, keep-outs, or clearances were changed.

1. **E2/E4 `width/height/length` are now the all-time bound differences.** S1B stored max-instantaneous WHL inside the swept object. Length was the tell: E2 Z bounds implied L = 7.355 m, but the field said 5.465 m (that is E1). `finalizeSwept()` now sets `length = maxZ − minZ` (and the same for W/H).
2. **G9 asserts those equalities** (`boundsMatch=true` for E2 and E4).
3. **Authority-volume test is no longer tautological.** `auditAuthority()` walks machine primitives, requires every non-diagnostic box/cylinder to be registered, and requires authority half-extents ≥ mesh `extendSize`.
4. **Cylinder authority source** is `mesh-derived-conservative`, not `mesh-exact`. Boxes remain `mesh-exact`.

E2 moving swept union is now W 7.184 / H 2.665 / **L 7.355**. E4 remains W 7.434 / H 2.895 / L 11.700.

Records were manually synchronized to the S1C `evidence/clearance-report.json`.
