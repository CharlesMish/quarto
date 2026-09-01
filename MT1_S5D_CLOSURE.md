# MT1-S5D — positive lock actuation & final propulsion closure

Local corrective turn on audited S5C `9839f08d9fe6195c4f600d126b0e32ff7b88f9e5fde270f782aef41b1ab66762`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

This is not S6. B′ is unchanged. S4A is frozen.

## Findings

| id | status |
| --- | --- |
| S5-F01 | CLOSED (preserved) |
| S5-F02 | CLOSED — real pin-guide apertures + two-sided stepped track; extension and retraction perturbations both blocked |
| S5-F03 | CLOSED (preserved) |
| S5-F04 | CLOSED (preserved) |
| S5-F05 | CLOSED (preserved) |
| S5-F06 | CLOSED (preserved) E4 width 13.367149536972 m |
| S5-F07 | CLOSED — refined first-ready `machineT=0.99982` / `driveT=0.99850`; coarse 0.001 grid reports `1/1` |
| S5A-N01 | CLOSED (preserved) |
| S5C-N01 | CLOSED — displaced track makes `evaluateS5Handover().driveThrustReady` and `getDriveThrustReady()` false |

## Pin-guide apertures

PORT, STARBOARD, TOP_PORT, TOP_STARBOARD. BOT wall remains solid. The TOP wall has two distinct empty bores.

Each aperture is empty Babylon space surrounded by positive-thickness wall segments. Outer can union remains **1.00 × 0.82 × 2.55 m**. Axial flow corridor is untouched.

Pin-guide running clearance **0.002 m** per side (architectural, not a bearing).

NC-SOLID-GUIDE restores `S5_CAN_PORT_GUIDE_PLUG_VIS` across the PORT bore; internal relative sweep reports pin/wall overlap and production readiness is false.

## Closed two-sided track

Can Z is the sole mechanical input. Six unrotated rail pairs per sector (`S5_LOCK_RAIL_A_*` / `S5_LOCK_RAIL_B_*`) form a stepped closed slot around the track centerline:

```
live can motion → follower axial station → track centerline → transverse pin station
```

- PRE-PICKUP: pin retracted in its guide aperture; follower clear of the track.
- ACTIVE: follower in the closed pair; excessive extension hits RAIL_A; excessive retraction hits RAIL_B.
- CAPTURED: pin in the receiver; follower remains in the final step.

Pickup **driveT = 0.9950** (machineT = 0.9994). Active interval **0.995 → 1**. Reverse uses the same steps.

Division of labor: moving can-wall guide constrains the pin axis; fixed track constrains follower transverse vs can Z; cavity accepts the pin; shoulder retains +Z; web/post/frame take reaction.

## Production driver predicate

`lockDriverTruth` / `allLockDriversValid` requires a real empty guide, no pin/follower vs host-wall overlap, two-sided confinement when active, and live pin extension agreeing with track U from follower Z.

`driveThrustReady` now requires that predicate for all four sectors.

NC-CAM-GAP, NC-OPEN-CAM, and NC-SOLID-GUIDE each make public `getDriveThrustReady()` false.

## Refined first-ready

Resolution `ΔmachineT=0.00001`. Last false `0.99981 / 0.99842`. First true `0.99982 / 0.99850`. Sampled, not analytic.

## Census

LIVE_MATERIAL_PHYSICAL **347** · LEGACY_SUPERSEDED_REFERENCE **2** · DEBUG **13** · new S5 **136** · unregistered **0** · underbound **0**
