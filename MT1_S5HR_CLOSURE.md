# MT1-S5HR Closure — Authority Completeness, Live Contact, and Freeze Hygiene

## Identity and candidate disposition

- Candidate status: **FREEZE_CANDIDATE_PENDING_DIRECTOR** (`GREEN_PENDING_DIRECTOR` in the authority API).
- H1: **AWAITING_DIRECTOR_DISPOSITION**; this package does not self-pass H1.
- Source MT1-S5H ZIP SHA-256: `69bd84f50a9697941be2c0c1bf845b9c8de2e7ec13778f6732d33e0aa37a7359`.
- Corrected MT1-S5HR ZIP SHA-256: recorded in the adjacent `MT1-S5HR.sha256` manifest and completion handoff (not embedded to avoid a self-referential archive digest).
- Frozen S4A SHA-256: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`.
- Reviewed DP1AR SHA-256: `3d63b1d08566fbc095713685d39570aae9fc5f454272eddb273e45e24c24fb71`.
- Nominal S5 geometry parameter file is byte-identical to S5H: SHA-256 `8d713b182f94af2769bec0696fb10cfc94fce98d90e89a46a69aad68e805fc63`.

This is an authority/proof repair to the mechanically successful S5H candidate. B′, S4A, `machineT`, `mapDrive`, the 2.55 m stroke, can/core/spigot, lock mouth, shoe, receiver, shoulder, backing, nominal rail placement, timing, and the 0.002 m retained-insertion rule are unchanged. The only geometry mutation adjustment is the deliberately non-nominal `zeroMargin` negative-control fixture, corrected to translate every B piece coherently and produce a finite sub-minimum state.

## S5H-to-S5HR diff scope

The bounded source delta is limited to:

- exact required-piece topology and physical-first corridor census;
- live-prism-driven unilateral forward/reverse proof and analytic comparison;
- certificate state (`ABSENT` / `STALE` / `CURRENT`) and fail-closed readiness integration;
- new missing-piece, missing-B-face, untagged-solid, and middle-path overrides/tests;
- strict 23-row negative-control ledger and deterministic evidence command;
- authority-family classification instead of name-prefix exemptions;
- bounded contact-solver performance bracketing with the same 5 µm refinement;
- report/schema wording, package/test configuration, Node/Vite metadata, title/accessibility hygiene;
- regenerated live S5 authority JSON and negative-control ledger.

No nominal mechanism geometry file changed. The narrow patch is `MT1-S5HR-vs-S5H.diff`.

## Finding dispositions

| Finding | Disposition |
|---|---|
| S5-F01 | **CLOSED**, preserved: legacy envelope/face remain non-material. |
| S5-F02 | **CLOSED**, preserved and strengthened: four pin-carried captive shoes execute live-prism forward and reverse contact. |
| S5-F03 | **CLOSED**: full pin/shoe corridor and backing proof remain clear. |
| S5-F04 | **CLOSED**: every readiness API requires a current, valid certificate and ≥0.002 m retained insertion. |
| S5-F05 | **CLOSED**: historical evidence remains byte-identical; only live authority/ledger records are regenerated. |
| S5-F06 | **CLOSED**: conservative E1–E4 continue to contain the frozen S4A floor. |
| S5-F07 | **CLOSED**: build and stable-readiness scan pass. |
| S5HR-N01 missing required track | **CLOSED**: exact 98-solid topology is a certificate prerequisite. |
| S5HR-N02 untagged matter disappears | **CLOSED**: census starts from enabled physical solids intersecting four explicit swept regions, then validates taxonomy. |
| S5HR-N03 analytic law drives state | **CLOSED**: transverse state is updated only by live rail-prism overlap; analytic law is comparison-only. |
| S5HR-N04 ledger PASS with unexpected failures | **CLOSED**: PASS requires `unexpectedFailures=[]`; measured cascades are separately declared and recorded. |
| S5HR-N05 default test timeouts | **CLOSED**: supported default uses two workers; the evidence writer is isolated to one worker. |
| S5HR-N06 entry value mislabeled | **CLOSED**: schema reports sample step, last clear sample, first contact bracket, and `lastSampledPreContactSeparation`. |

## Required physical topology

Every sector requires two moving solids, seven A pieces, seven B pieces, and its exact support chain. Piece kinds on both A and B are:

`MOUTH → LEAD → TRANSITION → CAM_ENTRY → CAM → CAM_EXIT → CAPTURE`

| Sector | Moving | A/B pieces | Required support |
|---|---:|---:|---|
| PORT | pin + shoe | 7 + 7 | receiver, guide A/B, shoulder, backing, web, post |
| STARBOARD | pin + shoe | 7 + 7 | receiver, guide A/B, shoulder, backing, web, post |
| TOP_PORT | pin + shoe | 7 + 7 | receiver, guide A/B, shoulder, aft/base/mouth/mouth-bridge backings, web, post |
| TOP_STARBOARD | pin + shoe | 7 + 7 | receiver, guide A/B, shoulder, aft/base/mouth/mouth-bridge backings, web, post |

Total required topology is **98 enabled physical solids**: 8 moving and 90 fixed. Working-face→backing/support→post/frame continuity passes.

`NC-MISSING-TRACK-PIECE` removes `S5_LOCK_RAIL_B_PORT_CAM`; `NC-MISSING-B-FACES` removes PORT B `LEAD`, `TRANSITION`, `CAM_ENTRY`, `CAM`, `CAM_EXIT`, and `CAPTURE`, leaving only `MOUTH`. Both produce `inventory.complete=false`, invalid certificate, C18/P7/P12 failure, and false raw/evaluator/getter readiness.

## Physical-first census and C18

The certificate begins from four explicit world-space swept regions and enumerates every enabled `role=physical` authority solid occupying them before reading lock metadata. Classification uses `assembly`, `subsystem`, and authority `family`; filenames confer no exemption.

Nominal census:

- relevant corridor solids: **93**;
- `MOVING_LOCK_ASSEMBLY`: **8**;
- `FIXED_TRACK_ASSEMBLY`: **90**;
- explicitly approved surrounding can-family solids: **13**;
- missing required: **0**;
- unclassified / invalid / conflicting: **0 / 0 / 0**.

C18 is **PASS** and means every relevant enabled physical solid is inventoried/classified/included in the appropriate proof and every required mechanism piece exists. `NC-UNTAGGED-CORRIDOR-SOLID` removes both assembly and subsystem metadata from an enabled physical wedge; the physical census still sees it, classification/C18/certificate fail, and all readiness APIs return false. `NC-MIDDLE-PATH-INTRUDER` places a classified obstruction on the required intermediate path; the complete sweep catches it although endpoint geometry is clear.

## Live-prism mechanical certificate

The freeze certificate starts with all pins/shoes physically retracted. At each axial sample, actual enabled positive-thickness rail OBBs are queried. Transverse motion changes only enough to eliminate live unilateral penetration. Captured A- and B-side extrema are reached by seeking the actual faces, and reverse begins from the worst B-side state. The analytic track law does not assign state.

- Live path: **PASS**.
- Samples: **2,002**.
- Moving-lock × fixed-track pair evaluations: **1,442,160**; unexpected hit: none.
- Passive forward: **PASS**; all sectors first contact at `driveT=0.99138`.
- Forward endpoint extension: **0.024540 m** all sectors.
- Forward/retained insertion: PORT/STBD **0.006540007 m**; TOP sectors **0.018540070 m**.
- Reachable A-side extreme: PORT/STBD **0.026695 m**; TOP **0.026700 m**.
- Reachable B-side extreme: **0.024540 m** all sectors.
- Captured live free-play span: PORT/STBD **0.002155 m**; TOP **0.002160 m**.
- Worst retained insertion: PORT/STBD **0.006540007 m**; TOP **0.018540070 m**, all above 0.002 m.

Passive reverse from worst B-side:

| Sector | A-face first contact | Shoulder clear | Shoulder conflict | Clearance lead | Tongue insertion at clear |
|---|---:|---:|---:|---:|---:|
| PORT | 0.003162 m | 0.004947 m | 0.010000427 m | 0.005053427 m | 0.100052738 m |
| STARBOARD | 0.003162 m | 0.004947 m | 0.010000427 m | 0.005053427 m | 0.100052738 m |
| TOP_PORT | 0.003162 m | 0.008262 m | 0.010000427 m | 0.001738427 m | 0.096737766 m |
| TOP_STARBOARD | 0.003162 m | 0.008262 m | 0.010000427 m | 0.001738427 m | 0.096737766 m |

All pins are physically clear before shoulder conflict. Track exit is at 0.027285 m reverse travel; final extension is 0.000015 m sides and 0.000020 m tops, followed by tongue withdrawal. Passive reverse is **PASS**.

The analytic-vs-live maximum deviation is **0.003405 m**, within the declared **0.003410 m** comparison tolerance (one full two-sided backlash traversal plus 0.000010 m numerical allowance). This comparison follows the live simulation and does not manufacture its path.

Entry sampling is `driveT=0.98000→0.99138` at `ΔdriveT=0.00002`. Last clear sample is `0.99136`; first intended-contact sample is `0.99138`; `lastSampledPreContactSeparation=0.00000669256 m`. This is a discrete contact bracket, not a manufacturing clearance.

Minimum live pin/backing and shoe/backing separations are **0.002304985 m** and **0.002999999 m**.

## Certificate and readiness behavior

`S5_PATH_CERTIFICATE` contains exact topology, physical census, classification, live forward path, captured extrema, live reverse, shoulder ordering, entry/exit, retained insertion, complete pair scope, support continuity, analytic comparison, and overall validity.

- certificate absent: raw `applyMachine()`, `evaluateS5Handover()`, and `getDriveThrustReady()` all return false;
- certificate invalid: all three remain false;
- geometry override: certificate/readiness become stale immediately; evaluator is false and raw/getter synchronously recertify the mutation;
- override removal: next public query synchronously recomputes the correct nominal baseline without another `setMachineT`;
- no `undefined !== false` or ready-by-default path remains.

Fine scan `machineT=0.99800→1.00000` at 0.00001 resolution:

```text
false through 0.99982
→ firstStableReady 0.99983 (driveT 0.9985833333)
→ true through 1.00000
```

No true→false pulse occurs.

## Gates, controls, and regression

- P1–P16: **16/16 PASS**.
- Closure set C1–C25: **25/25 PASS**.
- C18: **PASS**, exact topology + physical-first classification + complete proof scope.
- Executed ledger: **23/23 PASS**.
- Ledger `unexpectedFailures`: **0** total.
- Mutation applied: **23/23 true**; restoration verified: **23/23 true**.
- Default authority control rows: all **NOT_RUN**.
- NC-ENTRY-BLOCK: **PASS**; entry/certificate/all readiness fail.
- NC-REVERSE-JAM: **PASS**; reverse/C6/C22/C25/certificate/all readiness fail.
- NC-MISSING-TRACK-PIECE: **PASS**.
- NC-MISSING-B-FACES: **PASS**.
- NC-UNTAGGED-CORRIDOR-SOLID: **PASS**.
- NC-MIDDLE-PATH-INTRUDER: **PASS**.
- NC-CERTIFICATE-ABSENT: **PASS**, all three APIs false and baseline recertifies.
- Supported default command: `npm test` = two workers, evidence writer excluded, strict on-disk ledger validator included.
- Isolated authority evidence command: `npm run test:evidence` = one worker; **1/1 PASS in 22.5 minutes**.
- Default suite: **108/108 PASS in 34.1 minutes** using the supported `npm test` command.
- Focused S5HR suite: **4/4 PASS in 3.9 minutes**; solid-guide physical-hit regression **1/1 PASS in 17.5 seconds**.
- Build: **PASS**, TypeScript no-emit + Vite production build.
- Bounded S4 controls / prior-authority regression: **PASS**; no S4A source or map change.
- E1: `13.367149537 × 2.664999883 × 10.590000256 m`.
- E2: `13.367149537 × 2.664999883 × 11.395000389 m`.
- E3/E4: `13.367149537 × 2.894999884 × 11.699999921 m`.
- Overall census: 365 live material physical, 2 legacy superseded references, 22 debug nonphysical, 367 authority rows, 0 unregistered, 0 underbound.

## Evidence and hygiene

The executed ledger is `evidence/s5-negative-control-results.json` with schema `MT1-S5HR-negative-control-ledger-v2`. The nominal authority object is `evidence/s5-authority-report.json` with `freezeId=MT1-S5HR`.

All evidence files other than those two intentionally regenerated live records are byte-identical to the S5H source archive. In particular all `s5-regression-*` records and all seven `s5h-h1-*` images retain their S5H hashes. `sepA` / `sepB` aliases remain absent; only `minTrackClr` and `maxTrackClr` are reported.

H1 remains **AWAITING_DIRECTOR_DISPOSITION**. The accurate existing deterministic S5H views remain packaged and are generated by `tests/capture-s5.spec.ts`; no visual redesign was required because nominal mechanism geometry did not change.

## Limitations and boundary

This is a deterministic geometric/kinematic authority model, not fatigue, wear, material, tolerance-stack, thermal, vibration, or propulsion-performance qualification. The 6.693 µm last sampled pre-contact separation is a resolution-dependent bracket and must not be treated as manufacturing clearance. The analytic/live comparison tolerance intentionally covers one complete backlash traversal; it is a sanity bound, not a manufacturing tolerance. H1 remains director-only.

No S6, cockpit, intake, engine-internal, aero/CFD, or propulsion-performance work or claim is included.
