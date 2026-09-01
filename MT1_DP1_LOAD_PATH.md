# MT1-DP1A — load path and capture

## Two operating-load paths

Do not collapse these.

### Core reaction

fixed prime mover → core mounts / reaction frame → bay floor and `BULKHEAD_Z-1p70` → spanning keel.

Weight and rotor reaction stay in the aft-bay / keel region. They are not F5's single old centroid.

### Can operating-load

pressure / terminal-body axial load on the translating can → annular register + 4 axial lugs → short fixed handover frame at the can-mouth region `z ≈ −4.525` → `AFT_POST_PAIR` at `−4.80` → `BAY_WALL_PORT/STBD` → `BULKHEAD_Z-1p70` → `VENTRAL_KEEL`.

The existing S4A aft structure is an **AFT_POST_PAIR** plus bay walls, not a closed hoop. A future S5 handover frame may create the missing cross-connection. DP1A does not pretend that hoop already exists.

No newtons. The claim is destination, not magnitude. Physical continuity is `PENDING_PHYSICAL_S5_PROOF`.

## Rails

`DRIVE_RAIL_P/S` remain **guides**. They carry the can during translation and align it. After capture they are not the operating axial path.

G8 evaluates only:

> Does the proposed operating-load architecture provide a complete can→seat→structure path that does **not** require the rails as a graph edge?

A PASS is `RAIL_BYPASS_ARCHITECTURE`. It does **not** certify rail stress or thrust capacity.

## Capture semantics

Smallest future S5 mechanism, on the existing `mapDrive` stroke:

- stroke-end hard stop;
- concentric register in the INNER_ANNULUS, coaxial with the flow receiver;
- 3–4 axial locking lugs/dogs in PORT / STBD / TOP (not the BOTTOM rail/shoe sector).

Flow and lock may occupy the same axial band. They are not required to divide the 0.195 m serially.

`driveThrustReady` means **seated capture**, not `driveT == 1`.

No new machineT phase. No map retime.

## SPREAD

`DP1_ASSUMPTION_AXIAL_DRIVE_INACTIVE_WHILE_STOWED`  
The stowed can has no free terminal exhaust station. This is a DP1 assumption, not S4A hard law.

## Waist datums (not ducts)

| Name | x_lat | z band |
| --- | ---: | --- |
| DP1_WAIST_IFACE_PORT | −0.60 | [−1.90, −1.55] |
| DP1_WAIST_IFACE_STBD | +0.60 | [−1.90, −1.55] |

Bay-wall planes toward the certified waist cells. Clear of cockpit keep. No airflow claim.

## Future family split (no RMU)

- **F6** — can, carriage, shoes, moving lock half
- **F7** — rails, stops, fixed guides, fixed seat
- **F_PROP_FIXED** (new) — prime mover and fixed reaction frame
- **F5** — still three regions: forward/dorsal · spanning keel · aft bay / seat structure
