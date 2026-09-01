# MT1-DP1A — results

`status`: **DP1A_CANDIDATE_PENDING_DIRECTOR**  
`disposition`: **DP1A_BPRIME_SURVIVES_WITH_CAUTION**

Source DP1 SHA-256: `fc46ae8f55c2484273375a65fe2745a8977929738daf4a5a17e46ee5e7743761`  
Frozen S4A SHA-256: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`

B′ remains a coherent architecture inside frozen S4A after the flow/seat corrective turn. It is not self-authorized for S5. The caution is the published allowance set, the revised 0.24 m spigot assumption, and the study-only (not physical) seat/frame.

## Human sentence

> The vehicle extends its aft thrust can from around the fixed propulsion core into the free exhaust station; the can's forward mouth remains 0.275 m inside the bay, seats on the handover structure forward of the AFT_POST_PAIR, and only then is propulsion considered mechanically ready.

## Integrity

| Gate | Result | Evidence |
| --- | --- | --- |
| DP1-G1 S4A identity | PASS (attested) | EXTERNAL_ATTESTATION — Playwright/release hash test |
| DP1-G2 station geometry | PASS | COMPUTED_STUDY_RESULT |
| DP1-G3 engagement / sign | PASS | COMPUTED_STUDY_RESULT |
| DP1-G4 can/core packaging | PASS | COMPUTED_STUDY_RESULT |
| DP1-G5 hollow-can analytical model | PASS (conditional) | COMPUTED_STUDY_RESULT |
| DP1-G6 flow handover | PASS | COMPUTED_STUDY_RESULT — 0.120 m insertion is `flow.nondegenerate` at the strict >0.05 m threshold |
| DP1-G7 structural handover architecture | PASS | COMPUTED_STUDY_RESULT — study envelopes / graph; physical proof PENDING_PHYSICAL_S5_PROOF |
| DP1-G8 rail bypass architecture | PASS | COMPUTED_STUDY_RESULT — no rail edge; does not certify thrust |
| DP1-G9 S4A preservation | PASS (attested) | EXTERNAL_ATTESTATION — Playwright/release hash test |
| DP1-G10 architecture comparison honesty | PASS | COMPUTED_STUDY_RESULT |

## Closures

| id | Result |
| --- | --- |
| C1 actual flow insertion | PASS — overlapLength = 0.120 m |
| C2 flow negative control | PASS — release-attested prior 0.150 m spigot gives 0.030 m insertion, `nondegenerate=false`, G6 FAIL |
| C3 receiver truth | PASS — 0.18 m sleeve, passage open |
| C4 structural seat region | PASS — 0.195 × 0.100 / 0.090 free bands |
| C5 structural graph | PASS — AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL |
| C6 rail bypass | PASS — no rail edge |
| C7 flow/lock coexistence | PASS — coaxial radial zoning |
| C8 truthful provenance | PASS — G1/G9 are EXTERNAL_ATTESTATION |
| C9 README/scope truth | PASS — no stale pre-DP1 prohibition |

NC1 inverted sign → G3 FAIL.  
NC2 oversized core → G4 FAIL.  
NC3 solid can → G5 FAIL.  
NC4 / NC-STRUCT1 no seat → G7 and G8 FAIL.  
NC-FLOW1 prior 0.150 m spigot / 0.030 m insertion → G6 FAIL.  
NC-FLOW2 no receiver → G6 FAIL.  
NC-FLOW3 blocked passage → G5 and G6 FAIL.  
NC-STRUCT2 no frame → G7 FAIL.  
NC-STRUCT3 rails-only → G8 FAIL.  
NC-STRUCT4 lug hits rail → G7 FAIL.

## Future S5 falsifier (do not build now)

1. real hollow translating thrust can;
2. real fixed-core interference proxy in the recommended band;
3. full 2.55 m stroke;
4. real deployed flow spigot on the selected 0.24 m interval;
5. real deployed structural seat/lock and handover frame;
6. named seat → AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL solids;
7. unchanged cockpit / waist / keel / bay authority.

No engine internals. No intake sculpture. No nozzle petals.

## Director-reviewable assumptions

- can wall 0.06 m/face (0.05–0.08)
- running clearance 0.04 (0.03–0.05)
- alignment/thermal 0.03 (0.02–0.04)
- handover region around deployed can forward face, not a single plane
- usable bay engagement 0.195 m
- **selected flow spigot 0.24 m** (revised from published 0.15 m; 0.030 m insertion was judged marginal)
- selected receiver depth 0.18 m
- recommended core 0.70 × 0.52 × 1.80 m (`NOMINAL_CORE_PROXY`; **not** range-robust)
- `RANGE_ROBUST_CORE_PROXY` 0.66 × 0.48 m (conservative allowance corner only; not a new architecture)
- concentric register + 4 lugs in rail-free sectors, coaxial with the receiver
- handover frame is future S5 geometry
- axial drive inactive while stowed

## Limitations

Packaging is architectural, not a manufactured stack-up. No thrust magnitude. No seal/CFD. G7/G8 prove study-envelope feasibility, not physical load-path continuity. Live deployed center differs from −5.800 by ~0.0002 m (float); station truth uses the exact parameter derivation.

## Evidence

`evidence/dp1-geometry-facts.json`  
`evidence/dp1-assumptions.json`  
`evidence/dp1-results.json`  
`evidence/dp1-handover-model.json`  
`evidence/dp1-longitudinal.svg`  
`evidence/dp1-cross-section.svg`  
`evidence/dp1-load-path.svg`  
`evidence/dp1-motion.svg`  
`evidence/dp1-handover-detail.svg`
