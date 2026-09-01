# MT1-S3 machine authority

Machine-readable source: `evidence/s3a-authority-report.json` (`freezeId: MT1-S3A`, `status: GREEN_CANDIDATE`).
If this document disagrees with that dump, the JSON wins.

S1C SHA-256: `fef06acea92ed2f76e872f99f01dee38969dc755f7845cdd685e1f6bab707201`
S2A SHA-256: `f38efd6c1691244ceb44069b843aacc4dfd440cce5d745631892c8035c0e8fba`
S3 SHA-256: `d6aeb43d684925cbc6266b1b606ab61efa27565a413f800d92ce45eb6f0d975e`

S3 does not rewrite certified local transforms. It adds one machine scalar that decides **when** each certified local authority advances. Local geometry, pivots, stage tables, and capture bores are unchanged.

Units: metres and degrees. `+X` starboard, `+Y` up, `+Z` forward.

`machineT = 0` is whole-machine SPREAD. `machineT = 1` is DRIVE-exit complete.

---

## Authority modes

```
AuthorityMode = MACHINE | FRONT_PREVIEW | REAR_PREVIEW | DRIVE_PREVIEW
```

| Mode | Who owns the scene | How entered | How exited |
| --- | --- | --- | --- |
| `MACHINE` | `machineT → mapFront / mapRear / mapDrive` | `setMachineT` | — |
| `FRONT_PREVIEW` | independent `frontT` via certified `applyFront` | front slider / `setFrontT` | `setMachineT` restores mapped pose |
| `REAR_PREVIEW` | independent rear `transformT` via certified `apply` | rear slider / `setT` | `setMachineT` restores mapped pose |
| `CANT_PREVIEW` | seated front with a noncanonical cant | `previewCant(deg)` | `setMachineT` |
| `HAUNCH_PREVIEW` | nest-ready rear with a noncanonical haunch | `previewHaunch(deg)` | `setMachineT` |
| `DRIVE_PREVIEW` | reserved for drive-local inspection | not exposed as a primary slider | `setMachineT` |

The HUD labels preview as `PREVIEW FRONT_PREVIEW` / `PREVIEW REAR_PREVIEW`. Local sliders are marked `FRONT*` / `REAR*` so they cannot be mistaken for co-equal canonical authority.

Calling `setMachineT` always:

1. leaves preview;
2. sets mode `MACHINE`;
3. applies `mapFront`, `mapRear`, then `applyDrive(mapDrive)`;
4. restores UI readout to the mapped locals.

Diagnostics (`runClearance`, `runFrontClearance`, `runMachineAuthority`, haunch/cant studies) use `withPreservedPose`, which saves and restores `machineT`, local T values, drive T, and mode.

---

## machineT

Canonical machine-level scalar ∈ [0, 1]. Analytic and reversible: the same `machineT` after visiting 0 or 1 produces the same node translations and rotations.

Play / reverse scrubs `machineT` (12 s endpoint travel). Keys `1`–`9` jump the nine inspection samples.

---

## Maps

Local stage tables (`STAGE`, `FRONT_STAGE`) are not copied. Maps are piecewise-linear remaps published in `src/machine/machineMap.ts`.

### mapFront — certified `frontT`

| machineT | frontT |
| --- | --- |
| 0.00 → 0.04 | 0 → 0 (hold SPREAD) |
| 0.04 → 0.26 | 0 → 0.28 (compact + book pin) |
| 0.26 → 0.58 | 0.28 → 0.70 (yaw + cant) |
| 0.58 → 0.80 | 0.70 → 1.00 (socket + nest + catch) |
| 0.80 → 1.00 | 1 → 1 (hold seated) |

### mapRear — certified `transformT`, capped at 0.90

Rear local `apply()` still owns `driveExit` for S1C preview/regression. The machine map **never** feeds rear T past 0.90, so certified `apply()` cannot start drive under `MACHINE` mode. Drive is a separate wrapper.

| machineT | rearT |
| --- | --- |
| 0.00 → 0.08 | 0 → 0 (hold SPREAD) |
| 0.08 → 0.34 | 0 → 0.27 (compact + latch) |
| 0.34 → 0.66 | 0.27 → 0.70 (yaw + roll) |
| 0.66 → 0.86 | 0.70 → 0.90 (socket + nest) |
| 0.86 → 1.00 | 0.90 → 0.90 (hold nest-complete, no driveExit) |

### mapDrive — certified drive progression

| machineT | driveT |
| --- | --- |
| 0.00 → 0.88 | 0 → 0 |
| 0.88 → 1.00 | 0 → 1 |

`MACHINE_DRIVE_START = 0.88`.

`applyMachine` production order:

1. `requestedDriveT = mapDrive(machineT)`
2. apply certified rear lateral pose (`mapRear`, held at 0.90 so rear `apply()` cannot start driveExit)
3. apply certified front pose (`mapFront`)
4. evaluate capture predicates from those poses
5. `appliedDriveT = driveStructuralReady ? requestedDriveT : 0`
6. `applyDrive(appliedDriveT)` only

The physical drive never enters a forbidden pose. `applyDrive` remains the ungated primitive for local/bypass inspection.

Maps are monotonic and deterministic. Front leads compact: at `machineT = 0.20`, `mapFront > mapRear`.

---

## Machine-level phases

Descriptive output from `machineT`, not a second authority variable.

| Phase | machineT window |
| --- | --- |
| `SPREAD` | 0 |
| `RELEASE` | (0, 0.08) |
| `COMPACT` | [0.08, 0.34) |
| `REORIENT` | [0.34, 0.66) |
| `SEAT` | [0.66, 0.86) |
| `STRUCTURAL_READY` | [0.86, 0.88) |
| `DRIVE_DEPLOY` | [0.88, 1) |
| `DRIVE` | 1 |

---

## Readiness predicates

Evaluated from live SAT / bore / throat pose, not from T thresholds.

| Predicate | Mechanical test |
| --- | --- |
| `rearBookReady` | Latch keeper inside U-throat, not intersecting cheeks/hooks, behind the jaw |
| `rearNestReady` | Nest pin through the certified empty bore, no pin/receiver overlap |
| `rearDriveStructureReady` | `rearBookReady AND rearNestReady` |
| `frontBookReady` | Book pin through the real Y-bore, no pin/receiver overlap |
| `frontNestReady` | Nest pin through the separate +X bore, no pin/receiver overlap |
| `frontPassivePickupReady` | Catch keeper inside the open throat, no keeper/throat overlap |
| `frontDriveStructureReady` | `frontBookReady AND frontNestReady AND frontPassivePickupReady` |
| `driveStructuralReady` | `rearDriveStructureReady AND frontDriveStructureReady` |

Measured first `driveStructuralReady`: **machineT = 0.840**.

A test-only `ReadinessOverride` can force a predicate false without touching geometry. Used to prove GI6 is not a comment.

---

## Drive law

> Meaningful axial-drive exit is forbidden until `driveStructuralReady == true`.

S3A closes S3-F01: the gate is production motion, not a post-hoc report.

```
requestedDriveT = mapDrive(machineT)
appliedDriveT   = driveStructuralReady ? requestedDriveT : 0
```

Canonical timeline is unchanged: first ready **0.840**, first requested/applied drive **0.890**. Under normal readiness, requested == applied after 0.88.

Negative control (same production path, `machineT = 0.95`, one capture forced false):

* requestedDriveT ≈ 0.583333
* driveStructuralReady = false
* appliedDriveT = 0
* physical drive remains at certified stow `z = −3.25`
* `runMachineAuthority` reports GI6 FAIL / STOP for the illegal requested configuration
* removing the override applies the normal requested drive

If `applyDrive(requested)` is called while unready (bypass fixture), GI6 fails because the body is no longer stowed.

Debug publishes `requestedDriveT`, `appliedDriveT`, and `driveStructuralReady`.

---

## Preview semantics

- Local sliders enter `FRONT_PREVIEW` / `REAR_PREVIEW`.
- `previewCant` / `previewHaunch` enter `CANT_PREVIEW` / `HAUNCH_PREVIEW`. The HUD says `PREVIEW …`, never `MODE MACHINE`.
- `setMachineT` is the only return to canonical authority and restores front, rear, applied drive, readiness, waist, phase, and UI.
- Studies and SAT runs restore pose via `withPreservedPose`.
- S1C `runClearance` still uses certified `apply()` so rear `driveExit` remains independently regressable.
- GI10 actually exercises these routes. A MACHINE label over a mismatched pose is a disclosure fail.
