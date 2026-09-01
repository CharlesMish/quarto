# MT1-S5A — propulsion material truth & retained capture

Corrective turn on audited S5 `833937f95927572ee22e4f8fca9d069e0112a4ac3e1ce2c10908d33aa9ac8679`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

## Closed findings

| id | close |
| --- | --- |
| F01 | `DRIVE_ENVELOPE` / `DRIVE_FACE_AFT` `setEnabled(false)`; not live material |
| F02 | axial parts reclassified as `S5_SEAT_TONGUE_*`; four cam-driven `S5_LOCK_PIN_*` retain |
| F03 | top frame raised into the 0.09 m roof gap; P6 sweeps all fixed S5 |
| F04 | production `getDriveThrustReady` reads live spigot/receiver AABBs |
| F05 | historical `s3a`/`s4` reports restored; dumpers write `s5-regression-*` |
| F06 | E4 is union of frozen S4A sweep + live S5 (W = 13.367150) |
| F07 | README S6 boundary; VB1 zip optional; S4 NC no longer double-sweeps |

## Lock

Cam ramps at the seat station drive four transverse pins (PORT / STBD / TOP_PORT / TOP_STBD) as a geometric function of can Z (`s5LockExtension(driveT)`). Engagement window ≈ driveT 0.97→1.00 (machineT 0.996→1). Reverse retracts the pins before the tongues leave the pockets.

## Census

LIVE_MATERIAL_PHYSICAL 273 · LEGACY_SUPERSEDED_REFERENCE 2 · DEBUG 12 · new S5 62
