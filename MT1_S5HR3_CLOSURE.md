# MT1-S5HR3 Closure — Frozen S5 Authority Contract

1. **Candidate identity:** `MT1-S5HR3`, `FREEZE_CANDIDATE_PENDING_DIRECTOR`; machine authority status `GREEN_PENDING_DIRECTOR`.
2. **Source HR2:** `MT1-S5HR2.zip`, SHA-256 `f1a90bca2e12d28678eb0b04e4a786c86a72445f52ebd196409123233e53a13b`.
3. **Authority contract:** both requested filenames are byte-identical, SHA-256 `e15885cc11777ad49f2b0b5ad2778facb64ee6f932b65bf36742a65afe451ba9`.
4. **Contract changed after implementation began:** **NO**. The contract hash remained unchanged through packaging.
5. **Nominal geometry mutation:** **NO**. `src/design/s5Parameters.ts` remains byte-identical to HR2 at `8d713b182f94af2769bec0696fb10cfc94fce98d90e89a46a69aad68e805fc63`; frozen `src/machine/authority.ts` remains byte-identical at `78a88fa635cb93346dab987629625eb44f3de3ab1525af1b254b68a689d9a89a`.
6. **Registration-ID design:** new S5-only `s5Identity` registers the assembled universe once, assigns deterministic opaque IDs as immutable row properties, mirrors them into mesh metadata, and audits ID/name/metadata agreement. Proof joins never use names as identity.
7. **Registered rows:** 394 total; 365 enabled live physical rows at nominal certification.
8. **Duplicate-name gate:** nominal PASS. Initial S5 registration rejects duplicate names; certificate-time audit separately reports any extant aliases by ID.
9. **Lifetime-by-ID:** PASS. Forward/reverse union has 95 lifetime rows versus 93 captured-relevant names, retaining first-relevance taxonomy, sample, phase, driveT, enable state, and AABB.
10. **First-relevance classification:** PASS; nominal missing/unclassified/invalid/conflicting sets are empty.
11. **Moving↔moving:** PASS; 56,112 evaluations across 28 distinct ID pairs, no nominal hit.
12. **Exact topology:** PASS, 98/98 required rows: 8 moving plus 90 fixed rail/support rows.
13. **Intentional-contact table:** PASS; nine immutable classes instantiate 223 exact ID-pair rows, missing rows = 0.
14. **Frozen C18:** exact bounded wording is present in the machine schema; nominal PASS.
15. **NC-MIDPATH-TRANSIENT-ROW:** PASS. `AUTHORITY_ROW_0000AN` is first relevant at forward driveT 0.98470, retained after final disable, and recorded colliding with PORT A CAM; C18/certificate/readiness false.
16. **NC-DUPLICATE-AUTHORITY-NAME:** PASS. `S5_LOCK_PIN_PORT` resolves to `AUTHORITY_ROW_00006T` and `AUTHORITY_ROW_0000AO`; name uniqueness/C18/readiness false without collapse.
17. **NC-DUPLICATE-MOVING-ROW:** PASS. `AUTHORITY_ROW_00006T` and `AUTHORITY_ROW_0000AP` overlap; moving↔moving records the hit and all readiness APIs are false.
18. **Frozen NC count:** 28; frozen contract SHA-256 `8b150937b002d7a054e098182d6453711c477f8eaeb1865c1663541dc135f70d`.
19. **Ledger:** 28/28 PASS, `unexpectedFailures=0`, four-way restoration 28/28, atomic `complete=true`; SHA-256 `7b42247ffd1644246932de35b320243938030d31480b30eff0ff2266deb3e1ba`.
20. **Nominal live contact:** PASS, 2,002 samples and 2,981,616 pair evaluations. Endpoint extension 0.024540 m all sectors; worst retained insertion 0.006540007 m side and 0.018540070 m top; reverse lead 0.005053427 m side and 0.001738427 m top.
21. **Readiness:** absent/stale/invalid certificate is false in raw apply, evaluator, and getter. Fine scan is false through machineT 0.99982 and true from 0.99983 through 1.0 at 0.00001 resolution.
22. **Supported npm test:** 93/93 PASS in 29.7 minutes, two workers; writers excluded.
23. **Evidence command:** 1/1 PASS in 45.6 minutes, one browser/worker, 60-minute bound, atomic publication.
24. **Historical evidence:** preserved; aggregate HR2/HR3 SHA-256 `318eab98d207e81949bbba9aef7228f3552140cb6e1bfe485aa6fcf25c32a2c2`.
25. **P1–P16:** 16/16 PASS.
26. **Frozen C set:** C1–C25 = 25/25 PASS; no new C-gate.
27. **Prior authority:** no regression. DP1 frozen-source guard PASS; S4A remains `GREEN_PENDING`. E1 13.367149537×2.664999883×10.590000256 m; E2 13.367149537×2.664999883×11.395000389 m; E3/E4 13.367149537×2.894999884×11.699999921 m; containment PASS.
28. **H1:** `AWAITING_DIRECTOR_DISPOSITION`; not self-passed.
29. **POST_S5_VERIFIER_HARDENING_CANDIDATE:** none discovered.
30. **Limitations:** bounded closed registered universe and frozen NC battery only; no arbitrary future scene injection, universal dynamics, friction/preload/springs, stress/fatigue/tolerance/manufacturing, propulsion performance, S6, cockpit, intake, engine internals, or aero/CFD claim.

Build PASS. Focused 5/5 PASS in 7.1 minutes. Authority writer PASS in 3.3 minutes. Authority JSON SHA-256 `7bdf9cb5c3c057903f47b7a2e877515e1d2d5647fea9b87610653c60f0c1de00`.
