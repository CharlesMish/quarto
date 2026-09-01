# MT1-KS1 — results

JSON: `evidence/ks1-results.json`. Diagrams: `evidence/ks1-long.svg`, `evidence/ks1-top.svg`, `evidence/ks1-stations.svg`.

KC1 stands: **B — CONTINUOUS_ROUTE_REQUIRES_DECLARED_CROSSINGS.** This study does not reopen that finding. It tests whether each declared crossing can be a real bounded topology.

No professions. No authorized holes. No vehicle geometry.

## 0. Closure check — complete EDGE_BYPASS dogleg

KS1 originally screened only the plate-edge strip. This closure check represents the **complete dogleg** at each selected station and does not open a new study.

Each dogleg is three diagnostic envelopes, not the convex hull of the C:

1. Outbound transverse leg: ventral-keel side face `|x|≈0.15` → wrap inboard edge `|x|≈0.752`, immediately **fore** of the plate (`z = plate.maxZ + 2 mm` to wrap.maxZ). Z thickness 18 mm.
2. Existing plate-edge wrap (unchanged): `|x|∈[0.752, 0.805]`, `y∈[0.05, 0.16]`, `z = station ± 0.06`.
3. Inbound transverse leg: wrap → keel face, immediately **aft** of the plate (`wrap.minZ` to `plate.minZ − 2 mm`).

Route was not widened or moved. 2 mm is the smallest Z inset that does not occupy the plate (closed face contact).

**Result: COMPLETE_DOGLEG_CLEAR. KS1 Outcome A stands unchanged.**

| Station | Port dogleg | Stbd dogleg | Approach intersects plate | Keepouts | Fixed occupants | Motion |
| --- | --- | --- | --- | --- | --- | --- |
| Z3.35 | CLEAR | CLEAR | no | none | none | CLEAR (fore 0.928 m / wrap 0.886 m to FL/FR armor at t=0.70) |
| Z1.15 | CLEAR | CLEAR | no | none | none | CLEAR (fore 0.905 m / wrap 0.899 m at t=0.70) |
| Z−1.70 | CLEAR | CLEAR | no | none | none | CLEAR (aft 0.301 m / wrap 0.392 m to DRIVE_ENVELOPE at t=0) |

### DRIVE-waist axis clearance (certified xIn = 0.81)

Strip outboard `|x| = 0.805` is **5 mm inboard** of xIn by construction (`WAIST_X_IN − 0.005`). Not flush. Not overlapping.

| Envelope | Δx to xIn | Δx to waist cell | Δy | Δz | hypot | overlap |
| --- | --- | --- | --- | --- | --- | --- |
| Z3.35 wrap | 0.005 m | 0.005 m | 0.440 m | 2.240 m | 2.283 m | no |
| Z3.35 transverse | 0.058 m | 0.058 m | 0.440 m | ≥2.240 m | ≥2.284 m | no |
| Z1.15 wrap | 0.005 m | 0.005 m | 0.440 m | 0.040 m | 0.442 m | no |
| Z1.15 transverse | 0.058 m | 0.058 m | 0.440 m | 0.040–0.142 m | 0.446–0.466 m | no |
| Z−1.70 wrap | 0.005 m | 0.005 m | 0.440 m | 0.010 m | 0.440 m | no |
| Z−1.70 transverse | 0.058 m | 0.058 m | 0.440 m | 0.010–0.112 m | 0.444–0.458 m | no |

Closest waist approach is the wrap at Z−1.70: 5 mm in X, 440 mm in Y, 10 mm in Z. Aggregate 0.440 m. Transverse legs are more inboard (`|x|≤0.752`) so Δx to xIn is 58 mm.

KEEP_COCKPIT: transverse legs at Z3.35 sit at y∈[0.05, 0.16] under keep ymin=0.30 (Δy 0.14 m). No occupation.

Book/root: no CONTACT on any dogleg segment. Open stern not reached.

## 1. BULKHEAD_Z3.35

Most constrained station. KEEP_COCKPIT occupies the over-plate / forward-dorsal region. Front hinge/book activity is nearby in Z. Over-plate remains NO_ROUTE.

### Frozen facts

- Solid plate ~1.50 × 1.54 × 0.08 m at z=3.35, x∈[−0.75, 0.75], y∈[0.04, 1.58].
- No certified hole.
- VENTRAL_KEEL overlaps the plate bottom-center. Overlap is occupied structure, not a passage.
- Plate minY 0.040 is 0.010 m above keel minY 0.030. That 10 mm is occupied keel bar, not an opening.

### Existing passage

**None.** Under-plate air outboard of the keel (y∈[0, 0.04], |x|∈[0.15, 0.75]) exists and is motion-CLEAR (nearest moving AABB ~1.01 m to FL/FR outer armor at t=0.70), but it is floor-adjacent, leaves the keel-side-face carrier, and is not a hole in the plate. Not promoted to EXISTING_PASSAGE.

### Edge bypass

**CLEAR.** 53 mm strip just outboard of the plate edge, y∈[0.05, 0.16], z∈[3.29, 3.41], both sides.

| Check | Port | Starboard |
| --- | --- | --- |
| Protected volumes | none | none |
| KEEP_COCKPIT margin | 0.157 m | 0.157 m |
| Fixed occupants | none | none |
| Motion | CLEAR | CLEAR |
| Nearest moving | FL_OUTER_ARMOR_0, 0.886 m at t=0.70 | FR_OUTER_ARMOR_1, 0.886 m at t=0.70 |
| Book/root hit | no | no |

The wrap is a station-local detour: leave keel face |x|=0.15, travel to |x|≈0.75, wrap 80 mm, return. It does not enter KEEP_COCKPIT, the waist, or the front-book sweep at the tested envelope.

### Surface handoff

Not applicable.

### Bounded sleeve (backup, not selected)

ARCHITECTURE_HYPOTHESIS. Opening 0.08 × 0.06 × 0.10 m, center (0, 0.202, 3.35), immediately above the keel top. Keel not cut. Plate would be modified if built. KEEP_COCKPIT margin 0.068 m. Motion CLEAR, nearest FL_OUTER_ARMOR_0 1.168 m at t=0.70. Not required; not authorized.

### Selected

**EDGE_BYPASS**

### Remaining unknowns

No stress / sealing / manufacturing claim. The wrap lives in unmarked interstitial (KC1: not granted AVAILABLE). That is a later interface question, not a motion clash.

---

## 2. BULKHEAD_Z1.15

Aft of KEEP_COCKPIT. KEEP_DORSAL is above the keel-height route. DRIVE waist is outboard. Plate is solid.

### Frozen facts

Same solid-plate recipe at z=1.15. No certified hole. Keel/plate overlap is not a passage. 10 mm keel underside protrusion is occupied keel.

### Existing passage

**None.** Same under-plate air geometry as Z3.35. Motion CLEAR (~1.02 m to front outer armor at t=0.70). Not a carrier passage.

### Edge bypass

**CLEAR.** Same 53 mm keel-height strip, z∈[1.09, 1.21], both sides.

| Check | Port | Starboard |
| --- | --- | --- |
| Protected volumes | none | none |
| KEEP_DORSAL margin | 1.505 m | 1.505 m |
| DRIVE waist margin | 0.442 m | 0.442 m |
| Fixed occupants | none | none |
| Motion | CLEAR | CLEAR |
| Nearest moving | FL_OUTER_ARMOR_1, 0.899 m at t=0.70 | FR_OUTER_ARMOR_0, 0.899 m at t=0.70 |

Asymmetry vs Z3.35 was tested and not found: this station is also a working wrap. It is retained as EDGE_BYPASS because it works, not because the other stations do.

### Surface handoff

Not applicable.

### Bounded sleeve (backup, not selected)

Same 0.08 × 0.06 opening above the keel at z=1.15. Motion CLEAR (1.178 m). Keepouts clear. Not required.

### Selected

**EDGE_BYPASS**

---

## 3. BULKHEAD_Z-1.70

Structurally different: dorsal longeron ends; ventral keel continues under the bay; this is the keel→bay handoff station.

### Frozen facts

Solid plate at z=−1.70. No certified hole. Keel continues to z=−4.95 under the can (keel top 0.17 m, can bottom 0.370 m) — frozen structure, not a new tunnel, and it does not by itself cross this 80 mm plate. Do not route through core, can, or bay interior merely because space is visible.

### Existing passage

**None.** Same 10 mm occupied keel underside. Under-plate air motion nearest DRIVE_ENVELOPE ~0.405 m at t=0.

### Edge bypass

**CLEAR.** Same keel-height strip, z∈[−1.76, −1.64], both sides. No keepout hits. No fixed occupants. Motion CLEAR, nearest DRIVE_ENVELOPE 0.392 m at t=0. CAN_CORRIDOR AABB margin 0.392 m (can is aft/above; envelope does not occupy it).

### Surface handoff

**SURFACE_HANDOFF**, but not on the centerline face.

- VK under bay: FROZEN_FACT. The keel already continues under the bay.
- Full-height centerline drop on the plate +Z face (x∈[−0.08, 0.08], y∈[0.17, 1.445]) is occupied by `S5_CORE_REACTION_FRAME`, which is registered at this station z. Motion vs moving solids is CLEAR; the face itself is not empty.
- Offset face-drop outboard of that frame, still on the +Z plate face, inboard of the plate edge: x∈[−0.50, −0.36] and [0.36, 0.50], y∈[0.17, 1.445], z∈[−1.66, −1.64]. Both sides keepout-clear, fixed-empty, motion CLEAR (nearest ~0.315 m). KEEP_DORSAL margin 0.201 m.

That offset drop is face-riding. It does not enter the can, the core, or bay interior.

### Bounded sleeve (backup, not selected)

Same 0.08 × 0.06 opening above the keel at z=−1.70. Motion CLEAR, nearest DRIVE_ENVELOPE 0.264 m. CAN_CORRIDOR AABB margin 0.264 m. Not required.

### Selected

**EDGE_BYPASS** for the plate crossing.

**SURFACE_HANDOFF + EDGE_BYPASS** as the station bundle (offset face-drop for the truncated dorsal lane, plus the keel-height wrap for VK continuity).

---

## 4. Dense motion sweep

| | |
| --- | --- |
| Method | One canonical `applyMachine` loop, machineT 0→1, Δt=0.01 (101 samples), then local Δt=0.002 around first contact, min-separation, and fold centers t=0.14 / 0.61 / 0.77 |
| Targets | All candidate envelopes in that single loop (bypasses, sleeves, under-plate air, Z-1.70 face strips) |
| Solids | Frozen moving physical authority solids. AABB broadphase; SAT/OBB when near |
| Not | A new authority certificate. Frozen motion was not changed to make a route pass |

| Envelope | Status | minSep | at t | nearest solid |
| --- | --- | --- | --- | --- |
| Z3.35 bypass P/S | CLEAR | 0.886 m | 0.70 | FL/FR outer armor |
| Z3.35 sleeve | CLEAR | 1.168 m | 0.70 | FL_OUTER_ARMOR_0 |
| Z1.15 bypass P/S | CLEAR | 0.899 m | 0.70 | FL/FR outer armor |
| Z1.15 sleeve | CLEAR | 1.178 m | 0.70 | FL_OUTER_ARMOR_1 |
| Z-1.70 bypass P/S | CLEAR | 0.392 m | 0 | DRIVE_ENVELOPE |
| Z-1.70 sleeve | CLEAR | 0.264 m | 0 | DRIVE_ENVELOPE |
| Z-1.70 centerline face | CLEAR vs moving; FAIL vs fixed | 0.315 m | 0 | DRIVE_ENVELOPE; occupied by S5_CORE_REACTION_FRAME |
| Z-1.70 offset face P/S | CLEAR | 0.315 m | 0 | S5_SEAT_TONGUE_* |

No CONTACT. No book/root hit on any selected envelope. Closest moving approach at the forward stations is during cant/socket (t≈0.70), not the early book-fold window. KC1’s wrap-XY UNKNOWN is screened CLEAR at these envelopes.

---

## 5. Protected-volume margins (selected envelopes)

Positive = AABB gap. Negative would be occupation = FAIL.

| Region | Z3.35 bypass | Z1.15 bypass | Z-1.70 bypass | Z-1.70 offset handoff |
| --- | --- | --- | --- | --- |
| KEEP_COCKPIT | 0.157 m | 1.300 m | 4.143 m | 4.140 m |
| KEEP_DORSAL | 1.801 m | 1.505 m | 1.505 m | 0.201 m |
| DRIVE waist | 2.283 m | 0.442 m | 0.440 m | 0.310 m |
| CAN_CORRIDOR | 5.275 m | 3.083 m | 0.392 m | 0.315 m |
| FIXED_CORE | 5.920 m | 3.734 m | 1.003 m | 0.945 m |
| OPEN_STERN | 8.890 m | 6.690 m | 3.840 m | 3.940 m |

No selected candidate occupies a frozen protected region.

---

## 6. Bounded sleeve candidates

All three stations have a geometrically clear sleeve **backup** immediately above the keel:

- Opening 80 mm wide × 60 mm high × 100 mm through, centered on x=0, y≈0.202, station z.
- Relationship: adjacent to the existing keel/plate intersection; keel not cut.
- Remaining plate: full 1.50 m width minus 80 mm at bottom-center; side ligaments ≈ 0.71 m; material above the opening remains.
- Motion/keepout: CLEAR at all three stations.
- Tag: ARCHITECTURE_HYPOTHESIS. Not authorized. No stress, fatigue, sealing, or manufacturing claim.

Sleeves are **not required** for continuity under the selected topology.

---

## 7. Frozen structure modification

**Not required** for the selected crossings.

Edge bypass uses unmarked interstitial outboard of the plate edge and inboard of the certified waist. Surface handoff at Z-1.70 uses the existing bay-forward face, offset around `S5_CORE_REACTION_FRAME`. The keel bar is not cut. The three plates are not cut.

A later sleeve, if chosen, would modify the plates only.

---

## 8. Outcome

**A — CROSSINGS_FEASIBLE_WITHOUT_STRUCTURE_CHANGE**

All required plate continuity can be achieved by keel-height edge bypass at Z3.35, Z1.15, and Z-1.70. Z-1.70 also has a working offset surface handoff for the truncated dorsal lane. No existing holes. No sleeve is required. No station failed.

Not B: sleeves are feasible but not necessary.  
Not C: the three plate crossings share EDGE_BYPASS; Z-1.70’s extra face-drop does not replace that wrap.  
Not D: frozen keel/bulkhead architecture does not have to change.  
Not E: the KC1 skeleton can be completed honestly.  
Not F: representation was sufficient to classify.

The wrap is still an architecture hypothesis about unmarked interstitial. KS1 does not mint a reservation or a cut order.

---

## 9. Next slice

**Generic service-route architecture on the proven edge-bypass skeleton.**

One bounded slice: lay out the generic longitudinal route on the ventral-keel side faces with the three measured keel-height wraps (and the Z-1.70 offset face-drop if the local dorsal lane is kept). Still no utility professions, no authorized holes, no S6, no shell, no KEEP_COCKPIT occupancy, no ground hardware.

Do not automatically cut bulkheads. Sleeves remain a documented backup, not the next work.
