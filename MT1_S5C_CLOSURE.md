# MT1-S5C — lock reaction continuity & final S5 authority closure

Corrective turn on audited S5B `98ff77cbf97b991eb33414e5d709c6689ba06fbedf41731562bb05408603200e`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

## Findings

| id | status |
| --- | --- |
| S5-F01 | CLOSED (preserved) |
| S5-F02 | CLOSED — shoulders spliced into receiver/web/post; graph is pin→shoulder→web→recv→post→frame→keel |
| S5-F03 | CLOSED (preserved) |
| S5-F04 | CLOSED (preserved) |
| S5-F05 | CLOSED (preserved) |
| S5-F06 | CLOSED (preserved) E4 width 13.367149536972 m |
| S5-F07 | CLOSED — refined first-ready `machineT=0.99982` / `driveT=0.99850`; coarse 0.001 grid reports `1/1` |
| S5A-N01 | CLOSED (preserved) |

## Shoulder splice

Each `S5_LOCK_SHOULDER_*` is joined to `S5_LOCK_RECV_*` by `S5_LOCK_WEB_*` (positive-thickness overlap, not 4 mm air). Receiver remains an open cavity. Web→recv→post→frame uses strict contact (`S5_CONTACT=0.003 m`).

## Cam U-channel

Fixed ramp `S5_LOCK_CAM_*` plus side cheeks `S5_LOCK_TRACK_*` / `TRACK_B_*`. Declared emerged-interval running clearance **0.010 m** after the follower leaves the can wall (`u≥0.7`). Live captured gaps: PORT/STBD **0.00087 m**, TOP **0.00187 m**. Reverse uses the same ramp.

## Refined first-ready

Resolution `ΔmachineT=0.00001`. Last false `0.99981 / 0.99842`. First true `0.99982 / 0.99850`. Not an analytic exact. Coarse report `1/1` is the 0.001 machineT grid.

## Census

LIVE_MATERIAL_PHYSICAL **301** · LEGACY_SUPERSEDED_REFERENCE **2** · DEBUG **12** · new S5 **90**
