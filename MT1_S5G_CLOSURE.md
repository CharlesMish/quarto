# MT1-S5G — captive cam shoe, backing clearance & stable readiness

Local corrective turn on audited S5F `2e128c93a2ee125012b8c8c8a5a664af2a1798e3a3568a4c57e6aad09fab876c`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

This is not S6. B′ is unchanged. S4A is frozen. machineT / mapDrive / 2.55 m stroke / bay / axis / thrust can / fixed core / spigot / receiver / guide apertures / seat tongues / lock pins / receiver cavities / retaining shoulders / shoulder webs / handover frame / four lock sectors / continuous track direction / upstream four-capture drive law are unchanged.

## Findings

| id | status |
| --- | --- |
| S5-F01 | CLOSED (preserved) |
| S5-F02 | CLOSED (preserved) — four pins remain the retained elements; shoes are rigid pin-carrier sliders |
| S5-F03 | CLOSED — P6/C8/C21 include pin/shoe ↔ backing/support; no PIN↔TRACK prefix exemption |
| S5-F04 | CLOSED — production readiness requires path certificate + retained margin at every ready state |
| S5-F05 | CLOSED (preserved) — live dumps write `s5-regression-*`; frozen S1/S2/S3 names untouched |
| S5-F06 | CLOSED (preserved) E4 width 13.367149536972 m |
| S5-F07 | CLOSED — firstStableReady last-false **0.99996** / first-true **0.99997**; no true→false pulse |
| S5A-N01 | CLOSED (preserved) |
| **S5C-N01** | **CLOSED** — captive shoe reverseReturnLead **0.0078 m** on all four sectors |
| S5E-N01 | CLOSED (preserved, contact-side) PORT/STBD **0.003528 m**, TOP **0.015528 m** |
| S5F-N01 | CLOSED — moving pins no longer intersect track backings (BLOCKER A) |
| S5F-N02 | CLOSED — reverse no longer jams on the retaining shoulder (BLOCKER B) |
| S5F-N03 | CLOSED — readiness is monotone over final engagement (MAJOR) |
| S5F-N04 | CLOSED — default NCs emit `NOT_RUN`; executed ledger is `evidence/s5-negative-control-results.json` |

## Backing topology

PORT / STARBOARD — single outboard spine, corridor inboard:

```
RAIL_A / RAIL_B  →  TRACK_BACK (x=±0.542, 0.052×0.028×0.040)  →  LOCK_POST  →  FRAME
EMPTY PIN/SHOE SWEEP remains inboard of the spine.
```

TOP_PORT / TOP_STARBOARD — high plate + aft wrap around the empty sweep:

```
RAIL_A  →  TRACK_BACK (high, y=1.252, 0.21×0.022×0.040)
RAIL_B  →  TRACK_BACK_AFT (y=1.228, 0.16×0.044×0.036)  →  TRACK_BACK  →  LOCK_POST
EMPTY PIN/SHOE SWEEP occupies the pocket between high and aft members.
```

Study envelopes `S5_LOCK_MOVING_SWEEP_CORRIDOR_*_VIS` (diagnostic):

| sector | size m | centre |
| --- | --- | --- |
| PORT | 0.100 × 0.060 × 0.055 | (−0.511, 0.548, −4.562) |
| STARBOARD | 0.100 × 0.060 × 0.055 | (0.511, 0.548, −4.562) |
| TOP_PORT | 0.070 × 0.055 × 0.055 | (−0.380, 1.193, −4.562) |
| TOP_STARBOARD | 0.070 × 0.055 × 0.055 | (0.380, 1.193, −4.562) |

Minimum live pin↔backing SAT clearance **0.0020 m**. NC-BACKING-PLUG restores material through the PORT corridor: P6/P7/C8/C14/C21 FAIL, public ready false.

## Captive cam shoe

`S5_LOCK_CAM_SHOE_*` is an AABB slider rigidly parented to each lock pin (can axial + pin transverse). Not a second actuator.

| sector | size (x,y,z) m | local on pin |
| --- | --- | --- |
| PORT | 0.006 × 0.008 × 0.012 | (−0.048, −0.036, 0) |
| STARBOARD | 0.006 × 0.008 × 0.012 | (+0.048, −0.036, 0) |
| TOP_PORT | 0.008 × 0.006 × 0.012 | (−0.040, +0.028, 0) |
| TOP_STARBOARD | 0.008 × 0.006 × 0.012 | (+0.040, +0.028, 0) |

Track: one rotated prism per working face. Declared per-side running clearance **0.002 m**. Live SAT on the active tail: **0.0020 / 0.0020 m**. Total free play **0.0040 m** (under `S5_TRACK_FREEPLAY_MAX = 0.007 m`).

Forward: RAIL_B contacts the shoe and forces transverse extension into the receiver. Reverse: RAIL_A contacts the shoe and retracts the pin **before** the retaining shoulder.

| sector | return travel | shoulder travel | reverseReturnLead |
| --- | ---: | ---: | ---: |
| PORT | 0.00224 m | 0.01000 m | **0.00776 m** |
| STARBOARD | 0.00224 m | 0.01000 m | **0.00776 m** |
| TOP_PORT | 0.00224 m | 0.01000 m | **0.00776 m** |
| TOP_STARBOARD | 0.00224 m | 0.01000 m | **0.00776 m** |

Target was ≥ 0.001 m. No spring. No second powered actuator.

Worst physically reachable retained insertion (contact-side RAIL_B): PORT/STBD **0.003528 m**, TOP **0.015528 m**. All ≥ 0.002 m.

## Path certificate

`S5_LOCK_PATH_CERTIFICATE` is computed when the S5 rig is first asked for driver truth, cached on the rig, and invalidated by any S5 override. Canonical motion consumes the current certificate.

Default frozen geometry: **valid**, n=1001 (`driveT 0.99000→1.00000`, `Δ=0.00001`), **144144** moving-lock × fixed-track pairs, firstHit none, minPinBacking **0.0020 m**, passiveForward true, passiveReverse true.

Inventory (semantic metadata, not a name list):

- MOVING_LOCK: 4 pins + 4 shoes
- FIXED_TRACK: 8 rails + PORT/STBD backings + TOP high/aft backings + 4 posts (18)

NC-NONCURRENT-RAIL-INTRUSION sits at the **mid-track** PORT station. Endpoint geometry may remain clear. Path certificate / C14 / C18 / P7 / P12 / public `getDriveThrustReady()` are false.

NC-NAMED-TRACK-INTRUDER registers `S5_NC_TRACK_WEDGE_VIS` into FIXED_TRACK by assembly tag, not by a magic filename. C18 fails.

## Readiness

If `driveThrustReady == true` then all four live retained margins are ≥ 0.002 m. There is no `trackU < 0.9` bypass.

Fine scan `machineT 0.99800→1.00000` at `Δ=0.00001`: false … false → first stable true → true … true. C20 PASS.

firstStableReady: last false **0.99996 / 0.99967**, first true **0.99997 / 0.99975**.

`applyS5Override` invalidates the certificate; `getDriveThrustReady()` recomputes from live state without an extra `applyMachine`.

## Evidence

Default `evidence/s5-authority-report.json` emits inactive controls as `status: "NOT_RUN"`.

Executed ledger: `evidence/s5-negative-control-results.json`. Each listed control is physically applied, restored, and scored.

Frozen S1/S2/S3 dumps remain `clearance-report.json`, `s2-clearance-report.json`, `s3-authority-report.json`. Live S5 regression dumps write `s5-regression-s1.json`, `s5-regression-s2.json`, `s5-regression-s3.json`, `s5-regression-s3a.json`, `s5-regression-s4.json`. Prior freeze ZIPs are not rewritten.

## P / C

P1–P16: **16/16 PASS**. C1–C22: **22/22 PASS** (C20 readiness monotonicity, C21 backing sweep clearance, C22 passive reverse lead).

## Limitations

Ideal architectural geometry. No stress, no tolerance stack, no manufactured cam finish. Shoes are AABB sliders (rotated shoes failed SAT contact on reverse in this engine). H1 remains director-only. No S6, cockpit, intake, engine internals, aero/CFD, or propulsion-performance claim.
