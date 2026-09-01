# MT1-S3 reservations

S2A reservation validation is retained. S3 adds one new class and one new solid. Existing empty-occupancy and protected-corridor semantics are unchanged.

Source of measured waist bounds: `evidence/s3a-authority-report.json` → `driveWaist`. S3A closed S3-F02: the reservation is empty of all unauthorized physicals when active.

---

## Classes

| Class | Meaning | Generic SAT treatment |
| --- | --- | --- |
| `empty-occupancy` | Volume reserved for a future mechanism. No unrelated solid may consume it at any time. | Always tested as empty of non-declared occupants. |
| `protected-corridor` | Volume that **contains** named structure it protects. Other movers must stay out. | May contain its `protects` list. Not an emptiness claim. |
| `state-conditioned-empty` | Empty only while a named machine predicate is true. Occupancy at other states is legal. | **Must not** be fed to all-time empty-occupancy logic. |

`ReservationKind` in `src/machine/authority.ts` is the closed set of those three strings.

S2A front verifier still selects `reservationKind === "empty-occupancy"` only. Protected corridors stay on their own path. The waist is invisible to those generic loops.

---

## Retained reservations

| Name | Class | Family | Note |
| --- | --- | --- | --- |
| `KEEP_REAR_STBD_NEST` | empty-occupancy | `keep-rear-stbd` | X-mirror of measured seated rear-left book + pad. Future starboard-rear mechanism. |
| `KEEP_FWD_STBD_NEST` | empty-occupancy | `keep-fwd-stbd` | X-mirror of measured seated front-left physical AABB + pad. |
| `KEEP_COCKPIT` | protected-corridor | `keep-cockpit` | Protects future cockpit occupancy. Contains `BULKHEAD_Z3p35`. Not shrunk. |
| `KEEP_DORSAL` | protected-corridor | `keep-dorsal` | Dorsal spine. Contains `DORSAL_LONGERON`, `BULKHEAD_Z1p15`. |
| `KEEP_REAR_CORRIDOR` | protected-corridor | `keep-rear-corridor` | Certified S1C moving swept union E2, used as a fixed corridor. Contains rear moving physicals + drive envelope. |
| `KEEP_AFT_BAY` | protected-corridor | `keep-aft-bay` | Aft bay / drive stow. Contains `DRIVE_ENVELOPE` and bay walls. |

Empty occupancies remain mutually disjoint. Protected corridors retain their previous meaning.

---

## New class: state-conditioned-empty

Added because a DRIVE-state port waist **cannot** be an all-time keep-out.

The rear SPREAD book occupies that Z band before yaw/roll/socket. An always-empty box there would be a lie or would force a certified-local edit (STOP).

The waist is therefore empty **only** when both laterals are structurally captured and have left that volume.

---

## DRIVE_WAIST_PORT

S3's first box spanned `z ∈ [−1.790, 1.295]` and occupied six fixed solids (channel mouth + FWD_CARRY aft frame/longerons/catch arm). S3A does **not** whitelist those solids. The reservation moves onto the empty side of their surfaces.

| Field | Value |
| --- | --- |
| Cells | 1 axis-aligned cell `DRIVE_WAIST_PORT` |
| Visual mesh | `DRIVE_WAIST_PORT_VIS` |
| Class | `state-conditioned-empty` |
| Family | `drive-waist-port` |
| Derived from | seated front AABB, seated rear-port AABB, live `CHANNEL_FRAME_FWD` AABB, live `FWD_FRAME_AFT` AABB, `DESIGN_CLEARANCE = 0.06` |

### Activation predicate

```
activeWhen = frontDriveStructureReady AND rearDriveStructureReady
           = driveStructuralReady
```

Not `machineT > constant`. Inactive before structural readiness. Verifier also refuses ready-at-`machineT < 0.20`.

When active, **every physical solid** (fixed and moving) is tested. Debug/reservation meshes are excluded. GI8: `early=false`, `hits=0`.

A test-only `AUDIT_WAIST_PROBE` occupant fails GI8 (waist negative control).

### Measured cell (S3A)

| | centre | half | span |
| --- | ---: | ---: | ---: |
| X | −1.524 | 0.714 | 1.429 |
| Y | 1.475 | 0.875 | 1.750 |
| Z | −0.290 | 1.340 | **2.680** |

World box approximately:

* `x ∈ [−2.239, −0.810]`
* `y ∈ [0.600, 2.350]`
* `z ∈ [−1.630, 1.050]`

Volume **6.701 m³**. Connected single corridor. Not a sliver.

Derivation:

* `zAft = CHANNEL_FRAME_FWD.max.z + 0.06` (empty side of the rear channel mouth)
* `zFwd = FWD_FRAME_AFT.min.z − 0.06` (empty side of the carry aft frame)
* `xOut = min(front.min.x, rear.min.x)`
* `xIn = −keel.halfWidth − 0.06 = −0.81`
* `y` from seated laterals, clamped to `[0.60, 2.35]`

The six S3 occupants sit on or forward/aft of those faces and are no longer interior.

### Seated / structure clearances (by construction)

| Edge | Clearance |
| --- | ---: |
| z aft (channel fwd face + pad vs waist aft face) | ~0 |
| z fwd (carry aft face − pad vs waist fwd face) | 0 |

Longitudinal relation: the cell is the port gap **between** the rear channel mouth and the FWD_CARRY aft station, between the seated laterals and the keel. Future intake / cooling / service / drive-support volume.

---

## Unresolved future purpose

`DRIVE_WAIST_PORT` is a left-side service / intake reservation for later slices. It is not a production intake, not a cockpit, and not an aero volume.

It does not authorize:

* starboard waist
* machinery
* an intake lip
* any certified-local trim to make the box prettier

If a later slice needs a different waist, derive it again from seated AABBs. Do not hand-tune this box to pass a visual.
