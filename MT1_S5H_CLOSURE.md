# MT1-S5H Closure — Shoe Entry, Passive Reverse, and Complete Readiness

## Identity and disposition

- Status: **GREEN_PENDING_DIRECTOR**.
- H1: **AWAITING_DIRECTOR_DISPOSITION**; this package does not self-pass H1.
- Declared sole source identity: MT1-S5G SHA-256 `12b8b5f3fc4ff7dfcc0ec985fe274ab9e8b4bdb1d718713787fbc87223236278`.
- Frozen S4A identity: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`.
- Reviewed DP1AR identity: `3d63b1d08566fbc095713685d39570aae9fc5f454272eddb273e45e24c24fb71`.
- The named source ZIP and `AUDIT_MT1_S5G_CODEX.md` were not present in the supplied workspace. The local pre-edit tree was preserved at `/tmp/mt1-s5g-base`; the director-provided S5G digest is therefore recorded as declared, not re-hashed locally.

## Finding dispositions

| Finding | S5H disposition |
|---|---|
| S5-F01 | CLOSED, preserved: legacy `DRIVE_ENVELOPE` and `DRIVE_FACE_AFT` remain non-material. |
| S5-F02 | CLOSED: four retained pins use pin-carried captive shoes in reciprocal positive-thickness A/B tracks; forward and reverse are unilateral-contact simulations. |
| S5-F03 | CLOSED: complete pin/shoe corridor includes backing, rails, posts, walls, receivers and shoulders; pin/backing minimum is 0.002300157 m and shoe/backing minimum is 0.002999999 m. |
| S5-F04 | CLOSED: every production readiness path requires a current valid path certificate and at least 0.002 m retained insertion; absence is fail-closed. |
| S5-F05 | CLOSED, preserved: historical evidence is not renamed or overwritten; live authority/regression records retain `s5-*` names and S5H views use new `s5h-*` names. |
| S5-F06 | CLOSED, preserved: E1–E4 conservatively contain the frozen S4A floor. |
| S5-F07 | CLOSED: strict build passes and the 0.00001 readiness scan has one false→true transition at machineT 0.99983. |
| S5C-N01 | CLOSED with stronger proof: the old first-contact lead is superseded by actual pin-clear-to-shoulder-conflict lead. |
| S5G-N-ENTRY | CLOSED: a zero-extension reciprocal mouth plus face-matched lead admits the real shoe with no pre-pickup rail intersection. |
| S5G-N-REVERSE | CLOSED: the B exit working surface continues aft of the canonical endpoint and the A face physically retracts every pin before shoulder conflict. |
| S5G-N-CERT | CLOSED: certificate absence and invalidation are fail-closed in raw, evaluator and public readiness paths. |
| S5G-N-CENSUS | CLOSED: assembly registration, per-sector A/B face completeness, and every moving×fixed pair are certificate inputs. |
| S5G-N-LEDGER | CLOSED: 18 executed controls use the full S5H ledger schema and all finish PASS. |

## Final local topology

Each sector retains a fixed supported two-sided track with an explicitly asymmetric axial span. The full-depth p0 approach pad is absent: both faces begin with a recessed, zero-extension positive-thickness mouth and then a continuous lead and transition. The p1 side alone retains the 0.008000 m capture-pad allowance in the dimensional descriptor, while the live solids use an explicit captured tail. The working cam uses thin positive-thickness entry/exit leaves. The A cam/capture has 0.000700 m local relief. The B capture clearance is 0.001000 m and its exit surface continues to Z = -4.576 m, aft of the canonical shoe position, so reverse initially moves away from that finite end. The full-thickness middle rail remains 0.004 m; entry/exit leaves are 0.000600 m thick.

The cam shoe is a pin-carried blade of **0.001000 × 0.008000 × 0.000500 m** (track-normal × binormal × axial). Captured total transverse free play is **0.001700 m**, reduced from S5G's approximately 0.004 m, with positive nominal clearance on both sides.

## Measured physical certificate

- Certified entry sweep: `driveT=0.98000→0.99136` (first B-face pickup at 0.99136), with all samples through capture and reciprocal exit also included.
- Minimum pre-pickup shoe/rail clearance: **0.0000200248 m**.
- Passive samples: **2,002** (forward plus reverse); classified pair evaluations: **1,442,160**.
- Inventory: **8 MOVING_LOCK_ASSEMBLY** solids and **90 FIXED_TRACK_ASSEMBLY** solids; no unclassified live subsystem solid.
- Forward endpoint, every sector: extension **0.0256502 m**. Physical insertion is **0.007650203 m** PORT/STARBOARD and **0.019650266 m** TOP_PORT/TOP_STARBOARD.
- Captured extrema, every sector: A-side extension **0.0266998 m**, physically reachable B-side extension **0.0250002 m**.
- Worst reachable retained insertion: **0.007000214 m** PORT/STARBOARD; **0.019000217 m** TOP_PORT/TOP_STARBOARD.
- Return-face first contact: **0.002499000 m** reverse axial travel for all sectors.
- PORT/STARBOARD pin shoulder-clear event: **0.004437000 m**; shoulder-conflict event: **0.010000427 m**; `reverseShoulderClearanceLead`: **0.005563427 m**.
- TOP_PORT/TOP_STARBOARD pin shoulder-clear event: **0.008211000 m**; shoulder-conflict event: **0.010000427 m**; `reverseShoulderClearanceLead`: **0.001789427 m**.
- Tongue insertion at shoulder-clear is **0.100562954 m** PORT/STARBOARD and **0.096788788 m** TOP sectors.
- Track exit occurs at **0.027285000 m** reverse travel; final pin extension is **0.000016800 m**, followed by tongue withdrawal.
- Minimum pin/backing clearance: **0.002300157 m**. Minimum shoe/backing clearance: **0.002999999 m**. No can-wall, shoulder, receiver, backing, post or unexpected rail penetration occurs on the certified path.

## Certificate, readiness, and inventory truth

The certificate covers PRE_PICKUP, MOUTH, ACTIVE and CAPTURED forward phases; the A- and B-side captured extrema; CAPTURED, ACTIVE, MOUTH and PRE_PICKUP reverse phases; shoulder-clear ordering; exit; and subsequent tongue withdrawal. Correct driving/return-face contact is solved by physical prism contact; no scalar lock curve is used as passive proof.

`evaluateS5Handover()` returns not-ready when the certificate is absent. Raw `applyMachine()` synchronously ensures a current certificate before returning readiness. `getDriveThrustReady()` also synchronously ensures/recomputes it. Every geometry-changing override invalidates it immediately; direct evaluation is false until recomputed. Public readiness additionally consumes live insertion, passage, register, four tongues, four retained pins, worst-case certified insertion, shoulder-to-keel graph and upstream lateral readiness.

The fine scan `machineT=0.99800→1.00000` at 0.00001 resolution records:

```text
false through 0.99982
→ firstStableReady 0.99983 (driveT 0.9985833333)
→ true through 1.00000
```

No true→false pulse remains.

`sepA`/`sepB` aliases are absent from the JSON schema. Driver records retain only `minTrackClr` and `maxTrackClr`; human diagnostic text that mentions a face uses the actual named face.

## Gates, controls, and regressions

- Strict build: **PASS** (`tsc --noEmit` and production Vite build).
- Full Playwright regression: **108/108 PASS** in 23.0 minutes.
- Post-review focused S5H rerun after making the p0/p1 descriptor explicitly asymmetric: **31/31 PASS** in 17.8 minutes.
- P1–P16: **16/16 PASS**.
- Closure set C1–C25: **25/25 PASS**. C23 is entry-path clear, C24 is certificate fail-closed, and C25 is passive reverse shoulder clearance.
- NC ledger: **18/18 PASS**, with mutation-applied truth, expected and actual gates/closures, public readiness expectation/result, authority NC-row status, unexpected failures, restoration truth, and final result.
- NC-ENTRY-BLOCK: PASS; entry/certificate/public readiness fail.
- NC-REVERSE-JAM: PASS; passive reverse, C6, C22, C25 and public readiness fail.
- NC-UNCLASSIFIED-SOLID: PASS; census, C18, certificate and public readiness fail.
- Bounded S4 controls and P1 prior-authority regression: PASS.
- Conservative envelopes:
  - E1 `13.367149537 × 2.664999883 × 10.590000256 m`
  - E2 `13.367149537 × 2.664999883 × 11.395000389 m`
  - E3 `13.367149537 × 2.894999884 × 11.699999921 m`
  - E4 `13.367149537 × 2.894999884 × 11.699999921 m`
- Census: 365 live material physical, 2 legacy superseded references, 22 debug nonphysical, 367 registered authority rows, 0 unregistered and 0 underbound.

## H1 evidence

H1 remains **AWAITING_DIRECTOR_DISPOSITION**. Fresh deterministic views are generated by `tests/capture-s5.spec.ts`:

- `evidence/s5h-h1-pre-pickup-mouth.png`
- `evidence/s5h-h1-active-track.png`
- `evidence/s5h-h1-captured-shoe-pin.png`
- `evidence/s5h-h1-reverse-return-face.png`
- `evidence/s5h-h1-pin-clear-shoulder.png`
- `evidence/s5h-h1-guide-track-backing.png`
- `evidence/s5h-h1-director-strip.png`

All seven files have distinct SHA-256 digests.

## Limitations and boundary

The proof is a deterministic geometric/kinematic authority model, not fatigue, wear, tolerance-stack, materials, thermal, vibration or propulsion-performance qualification. The 0.020 mm minimum entry clearance and thin local cam leaves require later manufacturing/tolerance disposition. No S6 work, cockpit, intake, engine-internal, aero/CFD or propulsion-performance claim is included. B′ topology, S4A mechanisms, drive map, can stroke, receiver stations, shoulders and four-sector arrangement remain unchanged.
