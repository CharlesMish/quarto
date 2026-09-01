# MT1-S1C implemented mechanism

Source of numbers: `src/design/parameters.ts`, `src/machine/transform.ts`, and `evidence/clearance-report.json` (`freezeId: MT1-S1C`, `status: GREEN`).
S1A baseline SHA-256: `4c7ac15b02e80a05351f80f42398c8ddee19d4069648604d913a9e2e4f59b6db`.
S1B baseline SHA-256: `08355f7372121f6d23a419403523c39325e8c5c9f9ba73fae309032e0afbf2c4`.

Machine geometry is unchanged from S1B. S1C only separates instantaneous vs swept-union envelope semantics and tightens authority tests.
Units are metres and degrees. `+X` starboard, `+Y` up, `+Z` forward.

`transformT = 0` is SPREAD. `transformT = 1` is the drive-exit probe. Every pose is a pure function of that scalar.

## Coordinate system

Babylon left-handed. One scene unit = one provisional metre.

## Dimensional parameter table

| Quantity | Value | Notes |
| --- | --- | --- |
| Keel frame half-width | 0.75 | Total frame 1.50 |
| Bay interior | 1.20 W × 1.00 H × 3.10 L | `x ∈ [−0.60, 0.60]`, `y ∈ [0.28, 1.28]`, `z ∈ [−4.80, −1.70]` |
| Port channel | depth 0.80, `x ∈ [−1.55, −0.75]`, `y ∈ [1.72, 2.70]`, `z ∈ [−4.48, −1.72]` | Empty. Z-end frames only |
| Rear inner span | 2.52 | Yaw radius after fold |
| Rear outer span | 2.16 | Downward fold sweep |
| Rear chord | 2.16 | Becomes haunch rise |
| Armor / underside / book gap | 0.12 / 0.16 / 0.08 | Per vane envelope 0.28 |
| Folded book thickness | **0.64** | `2 × 0.28 + 0.08` |
| Yaw / roll / nest origin SPREAD | `(−1.98, 2.78, −1.88)` | Trailing-inboard top corner |
| Nest `x` | −1.50 | Outboard enough that hang-swing stays out of the bay |
| Haunch roll | **70°** | See decisions |
| Yaw | −90° about `+Y` | Aft |
| Book fold | +180° about hinge `+Z` | Underside-to-underside |
| Socket stroke | **0.48** along `+X` | `−1.98 → −1.50` |
| Drive envelope | 1.00 × 0.82 × 2.55 | Rigid stand-in |
| Drive stowed centre | `(0, 0.78, −3.25)` | Inside bay |
| Drive stroke | 2.55 aft | Centre `z → −5.80` |
| Design clearance target | 0.06 | Contact interfaces exempt |

## Rear-book geometry

Hierarchy (physical meaning):

```
SOCKET_RAIL (fixed on keel, +X)
RL_CARRIAGE
  RL_YAW          about +Y
    RL_ROLL       about local +X (span after yaw)
      RL_SPAR
        RL_VANE_INNER
        RL_BOOK_HINGE     about +Z
          RL_VANE_OUTER
        RL_BOOK_LATCH
```

Inner vane occupies local `x ∈ [−2.52, 0]`, `z ∈ [0, 2.16]` from the trailing-inboard origin. Underside structure (ribs + thickness) is modeled now so the folded envelope is not a paper plate.

## Folded-book thickness

Hinge sits `bookGap/2` below both undersides. At 180° the undersides face each other across 0.08 m. Armor faces are opposite exteriors. Folded envelope thickness is 0.64 m. Vanes are never scaled, hidden, or allowed to occupy one another.

## Book hinge

Visible barrel on the chordwise joint at local `(−2.52, −0.32, 1.08)`. `+rotation.z` swings the outer vane **down** through vertical, then under the inner. High shoulder (`y = 2.78` at the inner top) is required so the 2.16 m outer clears the floor at mid-fold (tip ≈ 0.26 m).

## Yaw axis

Visible bearing on `RL_YAW`. Axis is world `+Y` at the trailing-inboard corner. Because the vane extends forward and outboard from that corner, the −90° aft yaw disk stays outboard/aft of the keel. It is readable in top view.

## Roll axis and haunch

`RL_ROLL` is a child of yaw. After yaw, local `+X` is world `+Z`; `+rotation.x` hangs the book **down** from the top-inboard edge (outboard chord goes down). Working angle **70°** from horizontal.

Hanging from the top edge swings the book underside inboard by `thickness × sin(roll)` ≈ 0.60 m. That is why the nest is at `x = −1.50` rather than against the bay wall: the inboard generator must remain outboard of `x = −0.75`.

## Socket rail

| | |
| --- | --- |
| Direction | `(1, 0, 0)` |
| Fixed parent | `KEEL_FRAME` |
| Geometry | `y = 2.78`, `z = −1.88`, `x ∈ [−2.28, −1.28]` |
| Section | 0.07 square bar |
| Carriage stroke | 0.48 m inboard |
| Shoes | four blocks wrapping the bar, parented to the carriage |
| Min retained engagement | rail overshoots both endpoints; shoe length 0.20, rail continuation ≥ 0.12 at the inboard end, ≥ 0.20 at the outboard end |

The carriage does not move in `Y` or `Z`. There is no 3-axis shrug.

## Rail engagement (drive)

| | |
| --- | --- |
| Direction | `(0, 0, −1)` |
| Fixed parent | `KEEL_FRAME` (`DRIVE_RAILS`) |
| Geometry | two bars at `x = ±0.36`, `y = 0.31`, `z ∈ [−7.15, −1.76]` |
| Carriage shoes | parented to `DRIVE_CARRIAGE`, not to the rails |
| Stroke | 2.55 m |
| Engagement | rails cover stowed and deployed stations with > 1 m leftover aft |

## Channel envelope

Empty volume `0.80 × 0.98 × 2.76` on the port shoulder. Solid boundary is the port bay wall plus **Z-end frames** at `z = −1.72` and `z = −4.48` (forward/aft of the seated book). There is no lid through the hang volume. Debug shows the empty volume in cyan.

## Bay envelope

Empty centreline volume 1.20 × 1.00 × 3.10. Walls are 0.14 m plates at `|x| = 0.67`. Forward bulkhead at `z = −1.70` closes the bay; aft end is an open hoop. The drive stand-in occupies this volume at `t = 0`. Debug cyan box is that empty region.

## Drive proxy

Rigid box 1.00 × 0.82 × 2.55 with a spine and aft face. Constant size. Starts fully inside the bay. Drive Z `[−4.525, −1.975]`, bay Z `[−4.800, −1.700]`, so fore/aft Z margins are **0.275 m / 0.275 m**. X margin 0.100 m. Y margins 0.090 m. Translates only `−Z` on the fixed rails.

## Stage windows

| `transformT` | Stage | Motion |
| --- | --- | --- |
| 0.00–0.06 | prep | SPREAD lock jaw opens 72° |
| 0.06–0.22 | book fold | outer +180° |
| 0.20–0.27 | book latch | hook rotates −90° onto the outer lug |
| 0.27–0.54 | yaw | −90° aft; latch already captured |
| 0.52–0.70 | roll | 0 → 70° hang |
| 0.68–0.84 | socket | carriage `x −1.98 → −1.50` |
| 0.82–0.90 | nest lock | pin translates through `NEST_RECEIVER` and stays captured |
| 0.90–1.00 | drive exit | stand-in `z −3.25 → −5.80` |

Windows have small intentional overlaps. The actual geometry stays clear under SAT; the records must say that honestly:

- latch starts in the last tail of book fold (`0.20–0.22`);
- roll begins in the last tail of yaw (`0.52–0.54`);
- socket begins in the last tail of roll (`0.68–0.70`);
- nest lock begins in the last tail of socket (`0.82–0.84`).

Latch capture is required before *meaningful* yaw (G11 at `t = 0.27`, yaw stage still 0). Nest pin capture is required before *meaningful* drive exit (G12 at `t = 0.90`). Overlapping intervals are included in clearance authority. The choreography was not retuned in S1B.

## Book latch

Open U-throat + rotating jaw. Not two solids occupying one volume.

- **Keeper** `RL_LATCH_KEEPER` on the outer vane, `0.04 × 0.04 × 0.04`, hinge-local `(−1.26, 0.08, 0.98)`. After fold it sits in the throat.
- **Fixed throat** on the spar: two cheeks `RL_LATCH_CHEEK_P/S` and a back `RL_LATCH_THROAT_BACK`. Open downward (`SPAR −Y`), which is both the fold-arrival direction and the book-opening direction.
- **Jaw** `RL_LATCH_JAW` on `RL_BOOK_LATCH` at SPAR `(−1.26, −0.10, 2.06)`. Open: parked at local `+X`. Closed `−90°`: the jaw sits on the `−Y` side of the keeper and blocks opening.

Keeper never intersects hook solids. Positive throat clearance. Jaw is behind the keeper in the opening direction from `t = 0.27` through `t = 1.00`.

## Keep-outs

| Name | Role |
| --- | --- |
| `KEEP_FWD_PORT_NEST` | Seated front-left book Z-band. Rear-left may not take it. |
| `KEEP_REAR_STBD_NEST` | Conservative X-mirror of the **proven seated rear-left book AABB** plus 0.08 m pad. Built at machine construction from the live `t = 0.90` book, not a guessed box. |
| `KEEP_COCKPIT` | Forward module. |
| `KEEP_DORSAL` | Permanent dorsal spine. |

Seated rear-left book AABB (`t = 0.90`, 70°, physical solids including latch hardware):

`x ∈ [−2.239, −0.899]`, `y ∈ [0.531, 2.802]`, `z ∈ [−4.445, −1.850]`

Mirrored starboard keep-out (pad 0.08):

`cx = 1.569`, `cy = 1.667`, `cz = −3.148`, `hx = 0.750`, `hy = 1.215`, `hz = 1.378`

Visible only in debug. They are E5 reserved volumes in the verifier. G8 tests 11 moving physical solids × 4 keep-outs = 44 pairs.

## Nest lock

`NEST_RECEIVER` is fixed at `(−1.50, 2.78, −1.70)`. It is **four solids** around a real empty opening:

- `NEST_CHEEK_P` / `NEST_CHEEK_S`
- `NEST_BRIDGE_UP` / `NEST_BRIDGE_DN`

Outer 0.16 × 0.16 × 0.12. Bore 0.06 × 0.06 through Z. There is no solid box filling that opening.

`RL_NEST_BOLT_PIN` is 0.035 × 0.035 × 0.22. Retract `z = −0.02`, extend `z = +0.16`. At lock the pin is inside the bore with 0.0125 m XY margin, does not hit the four frame solids, and crosses the full 0.12 m Z thickness. Socket finishes before the pin’s Z reaches the receiver, so the pin does not enter sideways through a cheek.

## Why each major motion exists

| Motion | Reason |
| --- | --- |
| Book fold | Shrink yaw radius from 4.68 m to 2.52 m; keep all material; hide lift faces |
| Latch | The package is one body before the large yaw |
| Aft yaw | Turns span from `−X` to `−Z` without a vertical sail |
| Hang roll | Turns the chord into a crouched side haunch |
| +X socket | Inserts the reoriented package on a rail that matches the motion |
| Nest lock | Parked book becomes DRIVE structure |
| Drive exit | Proves the bay was always real and the seated book is not in the corridor |
