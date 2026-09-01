# MT1-S1C clearance report

Machine-readable authority: `evidence/clearance-report.json` (`status: GREEN`, `freezeId: MT1-S1C`).
S1A source SHA-256: `4c7ac15b02e80a05351f80f42398c8ddee19d4069648604d913a9e2e4f59b6db`.
S1B source SHA-256: `08355f7372121f6d23a419403523c39325e8c5c9f9ba73fae309032e0afbf2c4`.

These numbers were manually synchronized to that dump and verified. If they disagree, the JSON wins.

## Method

Physical-solid box OBBs use the exact half-extents of the rendered primitive they represent (`source: mesh-exact`). Cylinder authority is a conservative OBB around the cylinder (`source: mesh-derived-conservative`). Authority volumes are never smaller than the solid they represent.

15-axis SAT for overlap. Separation is vertex-to-OBB plus edge-edge.

Envelope sampling: global `Δt = 0.001`, then local `Δt = 0.0001` within ±0.01 of each extremum. Pair/capture sampling `Δt = 0.01`, with `Δt = 0.0001` refine on the critical pair.

World matrices are force-walked before every sample.

## G11 latch capture (rewritten)

Not “hook OBB overlaps lug OBB.”

A keeper bar on the outer vane sits in a **fixed U-throat** (two cheeks + back on the spar). A **rotating jaw** then closes the open mouth on the book-opening side (`SPAR −Y`).

Measured:

- first captured `t = 0.270` (yaw still 0)
- 74 samples through `t = 1.00`, 0 intersections, 0 lost
- min keeper-to-hook-solid clearance **0.0050 m** at `t = 0.67`
- jaw capture depth **0.130 m**

## G12 nest capture (rewritten)

Receiver is four solids around a **real 0.06 × 0.06 empty Z bore**. The pin is not tested against an outer box.

Measured:

- captured `t = 0.900` through `1.00` (11 samples)
- 0 intersections with receiver solids
- pin-to-frame clearance **0.0125 m**
- bore XY margin **0.0125 m**
- through-depth 0.12 m (full receiver thickness)
- no sideways entry during socket

## Critical clearance

`RL_OUTER_ARMOR` vs `CHANNEL_FRAME_AFT`: **0.049999847 m** at `t = 0.63`.

This is the audit’s ~0.050 m approach. Topology was not retuned.

## Envelopes

Keep-outs are **E5 reserved volume** and are excluded from E1–E4.

### E1 — moving real solids, max instantaneous

Largest single-pose occupied extent. `t` is the sample that produced that axis.

| | m | `t` |
| --- | --- | --- |
| Width | 7.184 | 0.0809 |
| Height | 2.665 | 0.0000 |
| Length | 5.465 | 1.0000 |

### E2 — moving real solids, all-time swept union

`width/height/length` are the global bound differences, not max instantaneous extents.

W **7.184** = 0.500 − (−6.684)  
H **2.665** = 2.925 − 0.260  
L **7.355** = 0.280 − (−7.075)  

`x ∈ [−6.684, 0.500]`, `y ∈ [0.260, 2.925]`, `z ∈ [−7.075, 0.280]`

E2 length is larger than E1 length because the moving assembly occupies different fore/aft extremes at different times.

### E3 — whole real S1, max instantaneous

| | m | `t` |
| --- | --- | --- |
| Width | 7.434 | 0.0809 |
| Height | 2.895 | 0.0000 |
| Length | 11.700 | 0.0000 |

Includes keel, rails, carriage, hinges, spar, book, latch, nest hardware, drive. Excludes debug, keep-outs, diagnostic volumes.

### E4 — whole real S1, all-time swept union

W **7.434** = 0.750 − (−6.684)  
H **2.895** = 2.925 − 0.030  
L **11.700** = 4.550 − (−7.150)  

`x ∈ [−6.684, 0.750]`, `y ∈ [0.030, 2.925]`, `z ∈ [−7.150, 4.550]`

The fixed frame/rails already occupy E4’s limiting positions at one time, so E3 and E4 numeric extents match. G9 asserts E2/E4 `width/height/length` equal those bound differences.

### E5 — future reservations (not occupied machine)

`KEEP_REAR_STBD_NEST` from physical seated port AABB + 0.08 pad:

Port seated physical book: `x ∈ [−2.239, −0.899]`, `y ∈ [0.531, 2.802]`, `z ∈ [−4.445, −1.850]`

Mirrored keep-out: `cx=1.569`, `cy=1.667`, `cz=−3.148`, `hx=0.750`, `hy=1.215`, `hz=1.378`

## Drive Z margins

Drive Z `[−4.525, −1.975]`, bay Z `[−4.800, −1.700]`.  
Fore/aft margins **0.275 m / 0.275 m**.

## G8

11 moving physical solids × 4 keep-outs = 44 pairs, all clear.

Included: inner/outer armor+underside, latch keeper/cheeks/back/jaw, nest pin, drive envelope.

Exempt (cannot reach a reservation, or already inside a checked envelope): ribs, bearings, shoes, spread lock, drive spine/face, rails.

## Gates

All G1–G12 PASS. See JSON for full detail strings.

G2 is allowed only because G11 is already true at yaw start.  
G5 is allowed only because G12 is true.

## Residual notes

- G1 open-state inner/outer armor share a hinge face (`minSep ≈ 0` at `t=0`). That is hinge contact, not volume theft. After fold the 0.08 m book gap remains.
- Envelope values are sampled, not algebraic extrema.
- Latch/nest checks use the same OBB method as clearance; they prove capture geometry, not fastener-grade fit.
- The 0.050 m roll clearance is an explicit later-stage margin, not a S1B retune target.
