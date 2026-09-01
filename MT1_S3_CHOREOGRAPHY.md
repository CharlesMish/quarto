# MT1-S3 choreography

Source of numbers: `evidence/s3a-authority-report.json`. Maps live in `src/machine/machineMap.ts`.

**GI12 choreography unchanged — prior director PASS retained.** Canonical `machineT` maps and inspection poses were not retimed.

This is mechanical sequence, not a beauty pass.

---

## Transformation card

> unlock
> → front compacts
> → rear package follows
> → both reorient
> → structures seat
> → captures establish
> → axial drive deploys

---

## Mechanical sequence

### Phase 0 — shared release (`machineT` 0.00–0.08)

Both laterals hold SPREAD through a short unlock window. Front map starts at 0.04; rear holds until 0.08. No drive.

### Phase 1 — front package leads (`0.04–0.26`)

The smaller control book folds and takes its pre-yaw pin. At `machineT = 0.20`, `frontT > rearT` by construction.

Reason: unitize the lighter control architecture before the lift book commits.

### Phase 2 — rear package follows (`0.08–0.34`)

Rear fold and latch run in parallel with remaining front compact. Front does not stop.

### Phase 3 — reorientation overlap (`0.26–0.66`)

Front yaw then cant. Rear yaw then roll. Windows overlap because certified swept authorities are Z-separated (front E2 `minZ = 1.355`, rear E2 `maxZ = 0.280`). Local percentages are not cloned: front yaw occupies `frontT ∈ [0.28, 0.54]`; rear yaw occupies `rearT ∈ [0.27, 0.54]`, but those locals sit on different `machineT` segments.

### Phase 4 — structural insertion (`0.58–0.86`)

Both sockets run. Front also acquires the passive catch. Laterals become longitudinal DRIVE structure.

### Phase 5 — hard structural barrier (`0.84–0.88`)

Pose predicates become true at **0.840**. Drive map remains 0 until 0.88. `STRUCTURAL_READY` is a real wait on captures, not a decorative pause.

### Phase 6 — axial drive (`0.88–1.00`)

`requestedDriveT = mapDrive(machineT)` becomes positive at **0.890**. Production `appliedDriveT` equals that request only while `driveStructuralReady` is true (canonical path: yes, from 0.840). The published timeline is unchanged; S3A only enforces it before the drive body moves.

---

## Legal overlaps

* front fold and rear fold
* front yaw/cant and rear yaw/roll
* front socket and rear socket
* front catch engagement during rear nest approach

These are parallel because certified local swept unions do not occupy each other. Live minimum front/rear SAT is **1.557 m** at `machineT = 0.410` (`FL_CATCH_KEEPER` vs `RL_INNER_ARMOR`).

---

## Prohibited overlaps

| Dependency | Why it is real |
| --- | --- |
| Front yaw before front book pin | Certified `FRONT_STAGE.yaw` starts at 0.28, the pin-complete gate. An unrestrained book cannot be treated as a yaw unit. |
| Rear yaw before rear latch | Certified `STAGE.yaw` starts at 0.27, the latch-complete gate. |
| Drive exit before `driveStructuralReady` | The seated books **are** DRIVE structure. Exit while a nest or latch is open is a configuration lie, not merely a collision risk. |
| Drive exit before `machineT = 0.88` | Published machine law. Map is identically 0 before this. |

Not a dependency: identical front/rear percentages, identical start times, or T>0.9 as a stand-in for capture.

---

## Canonical machineT stage table

Samples = `MACHINE_INSPECTION_T`. Readiness is pose-evaluated, not T-threshold.

| machineT | phase | frontT | rearT | requestedDriveT | appliedDriveT | front book | front nest | front catch | rear latch | rear nest | driveStructuralReady |
| ---: | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 0.00 | SPREAD | 0.000 | 0.000 | 0 | 0 | no | no | no | no | no | no |
| 0.12 | COMPACT | 0.102 | 0.042 | 0 | 0 | no | no | no | no | no | no |
| 0.24 | COMPACT | 0.255 | 0.166 | 0 | 0 | no | no | no | no | no | no |
| 0.36 | REORIENT | 0.411 | 0.297 | 0 | 0 | **yes** | no | no | **yes** | no | no |
| 0.48 | REORIENT | 0.569 | 0.458 | 0 | 0 | yes | no | no | yes | no | no |
| 0.60 | REORIENT | 0.727 | 0.619 | 0 | 0 | yes | no | no | yes | no | no |
| 0.72 | SEAT | 0.891 | 0.760 | 0 | 0 | yes | no | **yes** | yes | no | no |
| 0.86 | STRUCTURAL_READY | 1.000 | 0.900 | 0 | 0 | yes | **yes** | yes | yes | **yes** | **yes** |
| 1.00 | DRIVE | 1.000 | 0.900 | 1 | 1 | yes | yes | yes | yes | yes | yes |

Notes:

* Book restraints appear first, during REORIENT, because they are pre-yaw local events.
* Front catch is true at 0.72 (`frontT = 0.891`, past certified catch engagement 0.860) while front nest is still open (`nestLock` completes at `frontT = 0.94`).
* Rear nest is a geometric through-bore test; it becomes true with the map hold at `rearT = 0.90`.
* `driveT` is still 0 at 0.86. Drive is the last event.

---

## GI12 director card

**Director disposition: `PASS` (retained from independent S3 audit).**

Canonical maps and inspection poses were not retimed. GI12 evidence was regenerated as a regression check only.

Director question: can a human, from the stills and this table, perceive:

1. front control package becomes one restrained book;
2. rear lift package becomes one restrained book;
3. both reorient longitudinally;
4. both become structural DRIVE elements;
5. machine reaches a structurally ready state;
6. drive then deploys;

without reading everything as cloned rigs, without a long dead stretch, and without drive leaving while laterals are visibly loose?

Evidence for that adjudication:

* `evidence/s3-top-strip.png` — nine top states, left = 0.00, right = 1.00
* `evidence/s3-three-strip.png` — nine three-quarter states, same order
* this table
* `evidence/s3-debug-authority.png` — debug at `machineT = 0.72`
* `evidence/s3-waist-debug.png` — waist reservation at `machineT = 1` section

`GI12: DIRECTOR_PASS` (retained).
