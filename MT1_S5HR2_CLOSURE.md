# MT1-S5HR2 Closure — Full-Motion Physical Scope & Freeze Closure

## Identity and disposition

- Candidate: **FREEZE_CANDIDATE_PENDING_DIRECTOR**.
- Authority status: **GREEN_PENDING_DIRECTOR**.
- H1: **AWAITING_DIRECTOR_DISPOSITION**; not self-passed.
- Source MT1-S5HR SHA-256: `4871bdf9f9042d429ea8f1f0443b6e23702313c4e887974d0447ead43aa1025c`.
- Corrected ZIP SHA-256: recorded in the adjacent `MT1-S5HR2.sha256` manifest and final handoff, avoiding a self-referential archive digest.
- Frozen S4A SHA-256: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`.
- Nominal S5 geometry parameter file remains byte-identical to S5HR: `8d713b182f94af2769bec0696fb10cfc94fce98d90e89a46a69aad68e805fc63`.

This is a proof-system correction only. No nominal mouth, track, shoe, pin, receiver, shoulder, backing, can/core/spigot, motion map, stroke, S4A, or B′ geometry changed. Two disabled-by-default diagnostic solids were added solely for the new negative controls.

## Finding dispositions

| Finding | Disposition |
|---|---|
| S5-F01–F07 | **CLOSED**, preserved without nominal mechanism changes. |
| S5HR-F01 captured-pose-only universe | **CLOSED**: relevance is the union accumulated over all 2,002 forward/reverse live certificate samples. |
| S5HR-F02 broad family waiver | **CLOSED**: surrounding approval requires exact identity plus expected family and never removes collision checks. |
| S5HR-N03 restoration propagated backward | **CLOSED**: each row independently clears mutation, invalidates, recertifies, and verifies raw/evaluator/getter/certificate truth. |
| S5HR-N04 partial ledger overwrite | **CLOSED**: incomplete rows write only to a temporary same-directory file; final JSON is atomically renamed after full validation. |
| S5HR-N05 inherited tautology | **CLOSED**: the `existsSync(...) || true` assertion was removed. |

## Full-motion physical scope

Method: `FULL_MOTION_SAMPLED_UNION`.

At every forward and reverse certificate sample, the authority starts from every enabled live `role=physical` solid, computes live world OBB/AABB geometry, adds solids intersecting one of the four lock-driver regions to a persistent relevance set, and only then validates taxonomy. A solid remains relevant after first discovery even if it later leaves the region.

Nominal measured scope:

- enabled live physical universe: **365** solids;
- captured-pose relevance: **93** solids;
- path-wide relevance union: **95** solids;
- nominal path additions beyond captured pose: `S5_LOCK_CAM_SHOE_TOP_PORT`, `S5_LOCK_CAM_SHOE_TOP_STARBOARD`;
- missing/unclassified/invalid/conflicting: **0 / 0 / 0 / 0**.

The exact surrounding identity set contains 13 actual can segments: PORT and STARBOARD base/above/below/mouth pieces plus TOP base/mid/mouth/port-out/starboard-out. Each identity must also retain family `s5-can`. These identities remain in collision scope: moving locks are checked against them, and each is checked against all required working rail faces. Copying `family=s5-can` grants no authority.

Exact required topology remains a separate prerequisite: **98 enabled physical solids**, comprising 8 moving lock solids and 90 fixed track/support solids. Both required existence and path-wide exclusion truth pass.

Nominal C18: **PASS** — every path-relevant live physical solid is discovered before metadata, classified, and included in appropriate contact/collision proof. Pair evaluations: **2,925,504**; forbidden hit: none.

## Corrective negative controls

`NC-PATH-MOVING-UNTAGGED` attaches a real untagged obstruction to the moving can assembly. It is absent from the captured relevance set, enters the path union, and first overlaps `S5_LOCK_RAIL_A_PORT_CAM` at `driveT=0.98244`. The hit is recorded, classification is incomplete, C18/certificate fail, and raw/evaluator/getter readiness are false. Result: **PASS**.

`NC-FORGED-SURROUNDING-FAMILY` places a real rail obstruction with `family=s5-can` but no exact expected identity. It is relevant and unclassified, is not approved, overlaps `S5_LOCK_RAIL_A_PORT_CAM`, fails C18/certificate, and makes all readiness APIs false. Result: **PASS**.

Existing missing-piece, missing-B-faces, captured untagged, middle-path, entry, reverse, backing/guide/track, upstream, short-spigot, and absent-certificate controls remain strict PASS.

## Preserved live mechanics and readiness

- Live-prism forward/reverse: **PASS**, 2,002 samples.
- First B-face contact: `driveT=0.99138` all sectors.
- Forward endpoint extension: `0.024540 m` all sectors.
- Retained insertion: PORT/STBD `0.006540007 m`; TOP sectors `0.018540070 m`.
- A-face first reverse contact: `0.003162 m` all sectors.
- Shoulder clear: sides `0.004947 m`; tops `0.008262 m`.
- Shoulder conflict: `0.010000427 m` all sectors.
- Clearance lead: sides `0.005053427 m`; tops `0.001738427 m`.
- Entry bracket: `driveT=0.98000→0.99138`, step `0.00002`; last clear `0.99136`; first intended contact `0.99138`; `lastSampledPreContactSeparation=0.00000669256 m`.
- Stable readiness: false through `machineT=0.99982`, first true at `0.99983`, then true through 1.0.

The entry separation is a resolution-dependent contact bracket, not manufacturing or running clearance.

Certificate states remain `ABSENT`, `STALE`, and `CURRENT`. Absent or invalid certificates make raw `applyMachine()`, `evaluateS5Handover()`, and `getDriveThrustReady()` false. Overrides stale certificate/readiness immediately; the next supported query synchronously recertifies or remains false.

## Ledger, tests, and freeze gates

- Ledger schema: `MT1-S5HR2-negative-control-ledger-v3`, `complete=true`.
- Executed controls: **25/25 PASS**.
- Unexpected failures: **0**.
- Per-row mutation applied: **25/25**.
- Per-row restoration: **25/25**, with raw/evaluator/getter/certificate all nominal before the next row.
- Atomic writer: temporary path only until every row and final schema pass; temporary file absent after successful rename.
- `npm run test:evidence`: **1/1 PASS in 41.9 minutes**, one worker, explicit 60-minute test timeout.
- Focused S5HR2 suite: **4/4 PASS in 4.0 minutes**.
- Supported `npm test`: **108/108 PASS in 36.6 minutes**, two workers.
- `npm run build`: **PASS**, TypeScript no-emit plus Vite production build.
- Fresh extraction reproduction (existing installed dependency set linked in): build **PASS**; focused **4/4 PASS in 3.9 minutes**; default **108/108 PASS in 35.7 minutes**; atomic evidence writer **1/1 PASS in 39.3 minutes**.
- Bounded S4 controls: **PASS**; prior-authority regression: none.
- P1–P16: **16/16 PASS**.
- C1–C25: **25/25 PASS**.
- Default authority negative-control rows: **NOT_RUN**.

Envelope/census results remain:

- E1: `13.367149537 × 2.664999883 × 10.590000256 m`;
- E2: `13.367149537 × 2.664999883 × 11.395000389 m`;
- E3/E4: `13.367149537 × 2.894999884 × 11.699999921 m`;
- census: 365 live material physical, 2 legacy superseded references, 24 debug nonphysical, 367 authority rows, zero unregistered, zero underbound.

All evidence except the intentionally regenerated `s5-authority-report.json` and `s5-negative-control-results.json` is byte-identical to the source S5HR archive. Historical generators and files remain separate from the current integrated authority records.

## Limitations and boundary

This is deterministic geometric/kinematic authority, not fatigue, wear, material, tolerance-stack, thermal, vibration, aero/CFD, or propulsion-performance qualification. H1 remains director-only.

No S6, cockpit, intake, engine-internal, aero/CFD, or propulsion-performance work or claim is included.
