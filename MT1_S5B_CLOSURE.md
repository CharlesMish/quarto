# MT1-S5B — physical lock engagement & authority closure

Corrective turn on audited S5A `ad172b74baf9cba804c3f5d15a47fc50040b417bde6ea167220505b4634021a6`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

Frozen inputs (unchanged):

* MT1-S4A `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`
* MT1-DP1AR `3d63b1d08566fbc095713685d39570aae9fc5f454272eddb273e45e24c24fb71`
* MT1-S5 `833937f95927572ee22e4f8fca9d069e0112a4ac3e1ce2c10908d33aa9ac8679`
* MT1-S5A `ad172b74baf9cba804c3f5d15a47fc50040b417bde6ea167220505b4634021a6`

## Findings

| id | status | close |
| --- | --- | --- |
| S5-F01 | CLOSED | `DRIVE_ENVELOPE` / `DRIVE_FACE_AFT` remain `setEnabled(false)` |
| S5-F02 | CLOSED | four open receiver cavities + +Z shoulders; engaged +0.020 m Z escape blocked; retracted clear |
| S5-F03 | CLOSED | corrected top frame preserved; 1,001-pose moving-vs-fixed sweep clear (min disjoint 0.0004 m) |
| S5-F04 | CLOSED | live 0.150 m spigot still yields insertion 0.030 m and `driveThrustReady=false` |
| S5-F05 | CLOSED | historical `s3a`/`s4` reports byte-identical |
| S5-F06 | CLOSED | conservative E1–E4 width 13.367149536972 m (frozen S4A floor) |
| S5-F07 | CLOSED | strict TypeScript build; records agree; no unused `topPocketY` |
| S5A-N01 | CLOSED | `evalRegister()` uses live can-mouth AABB, not caller `driveT` |

## Exact terms

* **SEAT TONGUE** — axial locator (`S5_SEAT_TONGUE_*`)
* **LOCK PIN** — transverse retained element (`S5_LOCK_PIN_*`)
* **LOCK RECEIVER CAVITY** — open volume from far wall + guides (`S5_LOCK_RECV_*`, `S5_LOCK_GUIDE_*`)
* **RETAINING SHOULDER** — fixed +Z escape constraint (`S5_LOCK_SHOULDER_*`)
* **CAM / FOLLOWER** — ramp `S5_LOCK_CAM_*` and pin-mounted `S5_LOCK_FOLLOWER_*`
* **REGISTER** — live surface seating (`S5_REG_PAD_*` vs can walls)
* **FRAME** — fixed load-transfer (`S5_FRAME_*`, `S5_LOCK_POST_*`)
* **RAIL** — deployment guide only

## Lock law

`u = saturate((CAM_Z0 − followerZ) / (CAM_Z0 − CAM_Z1))` with `CAM_Z0=-4.562`, `CAM_Z1=-4.575`, `LOCK_EXTEND=0.026 m`. Follower Z is the live pin centre (`canMouthZ − 0.05`). The ramp slope is `LOCK_EXTEND / (CAM_Z0−CAM_Z1)`. Engagement window ≈ driveT 0.995→1.00 (machineT 0.999→1). Reverse retracts pins before tongues leave the pockets.

## Census (production)

LIVE_MATERIAL_PHYSICAL 289 · LEGACY_SUPERSEDED_REFERENCE 2 · DEBUG 12 · new S5 78
