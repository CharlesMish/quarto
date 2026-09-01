# MT1-S5 — thrust capture

## Seat region

Live bay-to-can free bands (frozen S4A):

- lateral 0.100 m each side
- vertical 0.090 m upper / 0.090 m lower
- axial seat z ∈ [−4.720, −4.525]
- bottom rail/shoe sector excluded

## Segmented register + four seat tongues + four retained locks

No closed annulus through the rails.

**Seat tongues** are axial locators inside the certified 1.00 × 0.82 envelope:

| id | sector |
| --- | --- |
| S5_SEAT_TONGUE_PORT | PORT |
| S5_SEAT_TONGUE_STARBOARD | STARBOARD |
| S5_SEAT_TONGUE_TOP_PORT | TOP_PORT |
| S5_SEAT_TONGUE_TOP_STARBOARD | TOP_STARBOARD |

Each has a real open C-channel pocket (`S5_POCKET_*`). Tongues do not slide through solid blocks. Deployed tongue insertion ≈ **0.105 m**.

**Lock pins** are separate transverse retained elements. Each sector has:

* moving pin `S5_LOCK_PIN_*` (0.020 × 0.024 × 0.024 m)
* rigid captive cam shoe `S5_LOCK_CAM_SHOE_*` parented to the pin
* open receiver cavity: far wall `S5_LOCK_RECV_*`, guides `S5_LOCK_GUIDE_A/B_*`, empty pin volume
* +Z retaining shoulder `S5_LOCK_SHOULDER_*` spliced by `S5_LOCK_WEB_*` into the receiver
* continuous two-sided slot: one rotated `S5_LOCK_RAIL_A_*` and one rotated `S5_LOCK_RAIL_B_*`
* segmented backing that leaves an empty pin/shoe corridor, then reconnects to `S5_LOCK_POST_*`

The retracted shoe is outboard of the can wall. Pickup is at `driveT = 0.99491`. Per-side running clearance **0.002 m**. Total free play **0.004 m**. Track angle `atan2(0.026, 0.013) = 63.435°`.

PORT/STBD insert along ±X (transverse insertion 0.008 m). TOP_PORT/TOP_STARBOARD insert along +Y (0.020 m). Cavity-wall clearance 0.004 m. Axial free play 0.010 m. Engaged +0.020 m Z escape is blocked by the matching shoulder; retracted escape is clear.

**Register** pads evaluate live can-mouth AABB vs pad AABB (radial separation and mouth-band Z overlap). No `driveT` scalar seating rule.

Engagement is the last millimetres of the existing 2.55 m stroke. Reverse: RAIL_A contacts the shoe and retracts the pin **0.0078 m** of can travel before the pin reaches the retaining shoulder. Tongues then withdraw.

## Handover frame

Smallest real frame linking pockets to existing aft structure:

- `S5_FRAME_PORT` / `S5_FRAME_STBD`
- `S5_FRAME_TOP_CROSS` + top drops
- `S5_FRAME_WALL_PORT` / `STBD`

## Physical capture chain

```
MOVING_CAN
  → LOCK_PIN_*
  → LOCK_SHOULDER_*          +Z reaction (10 mm free play at rest; blocked at +0.020 m)
  → LOCK_WEB_*               strict splice
  → LOCK_RECV_*
  → LOCK_POST_*
  → S5_HANDOVER_FRAME
  → AFT_POST_PAIR / BAY_WALL
  → BULKHEAD_Z-1p70
  → VENTRAL_KEEL
```

Lock actuation (separate from the captured thrust graph):

```
CAN +Z/−Z
  → CAM_SHOE_*
  → RAIL_A / RAIL_B
  → TRACK_BACK / TRACK_BACK_AFT
  → LOCK_POST
  → HANDOVER_FRAME
```

No air-gap proximity edge. The first moving→fixed reaction edge is **pin→shoulder**, not pin→receiver.

Operating-load graph has **0 DRIVE_RAIL edges**. Rails remain guides.

## driveThrustReady

True only when:

- upstream laterals ready
- live flow insertion > 0.050 m (actual 0.120 m)
- live open passage
- four seat tongues seated
- live geometric register seated
- four retained locks (positive cavity insertion + engaged escape blocked)
- all four physical lock drivers valid (guide aperture, captive two-sided shoe, no wall penetration)
- complete path certificate valid (full active lock path, including pin/shoe vs backing)
- live retained margin ≥ 0.002 m on every sector
- complete moving-can → lock pin → shoulder → web → receiver → post → frame → keel graph
- deployed physical drive condition

Does not consume lock proximity, a hard-coded C5, a caller-provided register scalar, or a `trackU < 0.9` bypass.

Coarse production scan (`ΔmachineT=0.001`) first-ready **machineT=1 / driveT=1**.  
firstStableReady (`ΔmachineT=0.00001`, 0.998→1): last false **0.99996 / 0.99967**, first true **0.99997 / 0.99975**. Sampled, not analytic. False while stowed.
