# MT1-S3A authority report

Machine-readable twin: `evidence/s3a-authority-report.json`.
If numbers disagree, the JSON wins.

`freezeId`: `MT1-S3A`
`status`: **GREEN_CANDIDATE**
`GI12`: **DIRECTOR_PASS** (retained)

S1C SHA-256: `fef06acea92ed2f76e872f99f01dee38969dc755f7845cdd685e1f6bab707201`
S2A SHA-256: `f38efd6c1691244ceb44069b843aacc4dfd440cce5d745631892c8035c0e8fba`
S3 SHA-256: `d6aeb43d684925cbc6266b1b606ab61efa27565a413f800d92ce45eb6f0d975e`

S3A is a local corrective authority turn. Maps, certified local geometry, and GI12 choreography are unchanged.

---

## S3-F01–F05

| ID | Class | Disposition | Repair |
| --- | --- | --- | --- |
| S3-F01 | BLOCKER | **CLOSED** | `applyMachine` evaluates captures, then applies `gateAppliedDrive(requested, ready)`. Physical drive stays stowed when unready. |
| S3-F02 | BLOCKER | **CLOSED** | Waist derived from `CHANNEL_FRAME_FWD.max.z` and `FWD_FRAME_AFT.min.z` plus pad. GI8 tests all physicals. Hits = 0. |
| S3-F03 | MAJOR | **CLOSED** | `previewCant` / `previewHaunch` enter `CANT_PREVIEW` / `HAUNCH_PREVIEW` and the HUD says PREVIEW. |
| S3-F04 | MINOR | **CLOSED** | Inherited S1/S2 diagnostic tests now expect local setters to enter preview. Pose/T restoration still asserted. |
| S3-F05 | MINOR | **CLOSED** | Envelopes resampled at Δt=0.001 + refine 0.0001. E2 W **7.183575** @ machineT **0.1579**. |

---

## GI1–GI11

| Gate | Result | Detail |
| --- | --- | --- |
| GI1 | **PASS** | rear GREEN, minCrit = 0.0500 |
| GI2 | **PASS** | front GREEN |
| GI3 | **PASS** | mono F/R/D true, sceneMatch true |
| GI4 | **PASS** | 0.17 / 0.37 / 0.63 / 0.84 reverse ok |
| GI5 | **PASS** | minSep = 1.557 m at machineT = 0.410 |
| GI6 | **PASS** | firstReady=0.840 firstRequested=0.890 firstApplied=0.890; production clamp; NC reports STOP |
| GI7 | **PASS** | pin before yaw; latch before yaw; drive after 0.88; front leads |
| GI8 | **PASS** | 1 cell, L=2.680, V=6.701, early=false, hits=0, all-solid sweep |
| GI9 | **PASS** | E2 W 7.183575 @ 0.1579, boundsMatch, contain=true |
| GI10 | **PASS** | cant/haunch/local preview disclose and restore (not hard-coded) |
| GI11 | **PASS** | S1C/S2A parameters unchanged |

## GI12

**DIRECTOR_PASS retained.** Maps unchanged. GI12 stills regenerated as regression. Prior director PASS stands.

---

## C1–C8

| | | |
| --- | --- | --- |
| C1 | **PASS** | m=0.95 requested=0.583333 applied=0 stowed=true |
| C2 | **PASS** | applied==requested when ready |
| C3 | **PASS** | no unauthorized physicals |
| C4 | **PASS** | W 1.429 H 1.750 L 2.680 V 6.701 |
| C5 | **PASS** | preview disclosure |
| C6 | **PASS** | setMachineT restores pose+mode |
| C7 | **PASS** | full supplied suite **40/40** |
| C8 | **PASS** | sampled poses contained |

---

## Refined envelopes

sampled/refined authority: ΔmachineT = 0.001 global + 0.0001 refine ±0.01 around extrema. Reservations excluded.

### E1 / E2

| | |
| --- | --- |
| E1 W | 7.183575 @ 0.1579 |
| E1 H | 2.665 @ 0.00 |
| E1 L | 10.590 @ 1.00 |
| E2 W | **7.183575** |
| E2 H | 2.665 |
| E2 L | 11.395 |
| E2 bounds | `x ∈ [−6.684, 0.500]`, `y ∈ [0.260, 2.925]`, `z ∈ [−7.075, 4.320]` |

S3 coarse E2 W was 7.182584. Controlling neighborhood is machineT ≈ 0.158, matching the independent audit (~7.183574). Geometry was not changed.

### E3 / E4

| | |
| --- | --- |
| E3 W | 7.433575 @ 0.1579 |
| E3 H | 2.895 @ 0.00 |
| E3 L | 11.700 @ 0.00 |
| E4 W/H/L | 7.434 / 2.895 / 11.700 |
| E4 bounds | `x ∈ [−6.684, 0.750]`, `y ∈ [0.030, 2.925]`, `z ∈ [−7.150, 4.550]` |

---

## Drive barrier

Canonical: first ready 0.840, first requested/applied 0.890.

NC1 front nest false / NC2 rear nest false / NC3 front catch false at machineT 0.95: requested ≈ 0.583, applied 0, stowed. Override removed: requested drive applies.

Bypass (`applyDrive` / `bypassDriveGate` while unready): GI6 FAIL.

---

## Census

114 physical, 0 unregistered, 0 underbound, audit.pass=true.

---

## Full suite

`npx playwright test --workers=1`: **40 passed / 0 failed**.

Includes S1, S2, S2A, S3, S3A, dumps, and captures.

---

## Residual limitations

* GI7 still checks published map order, not a second SAT of latch/pin.
* C7 in the JSON is a suite-level claim; the count lives in this report.
* Integrated SAT (GI5/GI6/GI8) remains Δt=0.01; envelopes are the refined 0.001/0.0001 authority.
* `DRIVE_PREVIEW` still has no primary slider.
* Waist faces sit on structure+pad by construction.
* No CG, aero, starboard, or S4 work.

No certified-local edit. No map retime. No S4.
