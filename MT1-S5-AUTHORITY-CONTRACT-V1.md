# MT1 S5 Authority Contract V1

Status: **FROZEN FOR MT1-S5 AUTHORITY-KERNEL CLOSURE**

This document is the complete authority-contract target for the bounded S5 corrective turn based on MT1-S5HR2. Its semantics are frozen before implementation begins. Discoveries outside this contract are recorded as `POST_S5_VERIFIER_HARDENING_CANDIDATE` and do not expand the S5 freeze boundary without director amendment.

## 1. Canonical pose authority

The canonical reduced-order pose authority is:

`machineT → certified mechanism maps → driveT → S5 lock pose`

The analytic kinematic mapping owns pose. The live-contact/path solver verifies that the frozen intended physical mechanism is consistent with that pose and with the declared contact topology. The certificate is not a universal rigid-body dynamics solver over arbitrary scene-graph mutations.

## 2. Closed registered physical universe

S5 authority applies to all registered physical authority rows in the frozen candidate plus physical mutations explicitly introduced by the frozen S5 negative-control battery.

Every registered authority row has:

- an immutable opaque `registrationId`;
- a unique human-readable `name`;
- physical or nonphysical role;
- required taxonomy;
- enable/lifetime state.

`registrationId` is proof identity. `name` is a unique label and is not proof identity.

## 3. Registration and name uniqueness

Every registration ID is globally unique. Names are globally unique among registered authority rows.

An attempted second registration with an existing registration ID or name is rejected and records a registration-authority violation. Any extant duplicate rows are retained and reported separately by registration ID; they may not collapse through a map, set, `find`, or expected-piece count. A registration-authority violation invalidates C18, the path certificate, and readiness.

## 4. Stable lifetime identity

The path proof accumulates registration IDs, not names.

When an enabled physical row first becomes relevant at any certified forward or reverse sample, the certificate retains for its remaining evaluation:

- registration ID and name;
- taxonomy/classification at first relevance;
- first-relevant sample index, direction, phase, and drive pose;
- lifetime state at discovery;
- relevant pose/OBB metadata needed by the bounded pair proof.

Later corridor exit, disablement, or final-pose absence does not erase the row or reconstruct its taxonomy from the final scene.

## 5. Classification at first relevance

At first physical relevance, the actual registered row must resolve to exactly one legal class:

- required moving lock;
- required fixed track/support;
- exact expected surrounding physical;
- explicitly declared frozen negative-control mutation.

Missing, invalid, or conflicting taxonomy invalidates the certificate. Classification is stored with the registration identity and is not recovered later by name.

## 6. Required topology

The existing exact S5 required topology remains mandatory and independent of lifetime proof. It proves that every required physical piece exists, is enabled when required, and has the correct registered classification.

The lifetime/pair proof separately proves that no in-scope registered row violates the declared mechanism during certified motion. Both must pass.

## 7. Physical pair universe

Pair evaluation uses registration IDs and includes:

- moving lock ↔ fixed track/support;
- moving lock ↔ relevant surrounding physical;
- moving lock ↔ moving lock for distinct coexisting rows;
- relevant fixed/support relationships;
- declared capture/contact relationships;
- frozen negative-control physical rows against every applicable class above.

Rows sharing a movement owner are not exempt from moving↔moving evaluation. A pair is canonicalized by two distinct registration IDs, never by names.

## 8. Immutable intentional-contact relations

Only these bounded S5 relation classes may use intentional-contact semantics:

| Relation | Permitted state |
|---|---|
| cam shoe ↔ its sector RAIL_B working pieces | live unilateral forward drive and legal captured B-side limit |
| cam shoe ↔ its sector RAIL_A working pieces | live unilateral reverse drive and legal captured A-side limit |
| cam shoe ↔ opposite face | nonpenetrating running/free-play boundary only |
| lock pin ↔ its sector retaining shoulder | retained axial escape probe only; nominal insertion/withdrawal must obey shoulder-clear ordering |
| each RAIL_A/RAIL_B piece ↔ its declared backing/support | declared structural splice only |
| retaining shoulder ↔ its declared web | declared structural splice only |
| web ↔ receiver/post/frame/keel declared chain | declared structural splice only |
| seat tongue ↔ its declared receiver cavity | declared nested seat interface only |
| fixed spigot ↔ moving receiver | declared nested flow/register interface only |

The implementation shall instantiate this table with exact registration-ID relations from required topology. No broad prefix, family, movement-owner, or phase exemption is authorized. Any closed-universe pair not covered by an applicable intentional-contact relation obeys ordinary clearance/nonpenetration requirements.

## 9. C18 frozen meaning

> **C18 — Closed-World S5 Physical Certificate Completeness**
>
> For the frozen registered S5 physical universe and the explicitly declared S5 negative-control mutations, every authority row has a unique stable identity; every row that becomes physically relevant anywhere over the certified forward/reverse motion retains its identity and classification in the path certificate; every required collision/contact pair class is evaluated by identity, including moving-vs-moving where applicable; and no in-scope physical row can be omitted through duplicate names, transient lifetime, missing metadata, or broad family/name exemptions.

C18 does not claim completeness against arbitrary future Babylon scene mutations.

## 10. Frozen adversarial boundary

The S5 freeze adversarial boundary is the separately enumerated `MT1_S5_FROZEN_NEGATIVE_CONTROL_CONTRACT.md`, containing all accepted S5 controls and the identity/lifetime controls required by this contract:

- `NC-MIDPATH-TRANSIENT-ROW`;
- `NC-DUPLICATE-AUTHORITY-NAME`;
- `NC-DUPLICATE-MOVING-ROW`.

Each control declares mutation, challenged clause, expected failures, and public readiness. The list is frozen for this certification turn. Later adversarial ideas are `POST_S5_VERIFIER_HARDENING_CANDIDATE` unless they demonstrate noncompliance with this contract.

## 11. Readiness

`driveThrustReady` requires:

- a CURRENT certificate;
- certificate PASS under this frozen contract;
- all existing physical S5 mechanism/readiness requirements.

ABSENT, STALE, or invalid certificate state yields false. Nominal HR2 readiness behavior remains unchanged unless identity/lifetime enforcement directly falsifies it.

## 12. Nominal mechanism boundary

Nominal S5H/S5HR2 mouth, track, shoe, pin, receiver, shoulder, backing, can/core/spigot, machine map, stroke, S4A, and B′ geometry are frozen. Live positive-thickness rail-prism forward/reverse verification and analytic-after-live consistency comparison remain required.

## 13. Evidence and execution

The frozen negative-control ledger requires mutation application, declared failures, exact readiness outcome, authority-row outcome, zero unexpected failures, and independent restoration of raw readiness, evaluator readiness, public getter readiness, and certificate validity for every row.

Ledger publication is atomic. Default asserted regression must not overwrite immutable historical evidence or PNGs in place. Supported build, default, focused, evidence, and bounded prior-authority tests must pass.

## 14. Out-of-scope claims

S5 does not prove:

- soundness against arbitrary future injected Babylon meshes;
- arbitrary scene-graph mutation robustness;
- arbitrary renamed or reparented clones outside the frozen NC contract;
- free-body rigid dynamics;
- unmodeled friction, preload, or spring mechanics;
- stress, fatigue, tolerance, manufacturing, thermal, or vibration qualification;
- propulsion performance.

These may be future verifier-hardening work and do not expand this contract.
