# MT1 S5 Frozen Negative-Control Contract

Status: **FROZEN FOR MT1-S5HR3 CERTIFICATION**

Authority contract: `MT1_S5_AUTHORITY_CONTRACT_V1.md` SHA-256 `e15885cc11777ad49f2b0b5ad2778facb64ee6f932b65bf36742a65afe451ba9`.

This is the complete S5 freeze adversarial boundary. Every row requires its mutation to be applied, its declared failures to occur, public readiness to be false, the authority NC row to PASS where applicable, `unexpectedFailures=[]`, and independent restoration of raw readiness, evaluator readiness, public getter readiness, and certificate validity. Mechanically inevitable extra failures are permitted only when declared as allowed cascades in the executable ledger contract.

| ID | Mutation | Contract clause challenged | Required failures | Public readiness |
|---|---|---|---|---|
| NC-UPSTREAM | upstream rear-book readiness false | readiness consumes upstream authority | drive remains stowed; public readiness false | false |
| NC-SPIGOT | shorten live spigot to 0.150 m | live insertion/register truth | S5-P5 | false |
| NC1 | insert passage obstruction | passage and live material truth | S5-P3, S5-P5, C2 | false |
| NC4 | obstruct receiver | receiver/register truth | S5-P5 | false |
| NC-LOCK1 | remove PORT pin and shoe | exact topology and four-lock truth | S5-P7; C18 | false |
| NC6 | add bottom-sector lock | four declared sectors | S5-P8 | false |
| NC-SHOULDER-FLOAT | break PORT shoulder/web continuity | structural load path | S5-P9 | false |
| NC-TRACK-FLOAT | remove PORT track backing | structural support and driver authority | S5-P7 | false |
| NC-OPEN-CAM | remove PORT B working faces | two-sided passive track/topology | S5-P7, S5-P12, C8, C14, C18 | false |
| NC-SOLID-GUIDE | close a can guide aperture | complete moving corridor | S5-P7 | false |
| NC-ZERO-RETAINED-MARGIN | displace B face below retained margin | 0.002 m retained insertion floor | C17 | false |
| NC-CAM-GAP | displace PORT track outside running geometry | supported positive driver | S5-P7 | false |
| NC-NONCURRENT-RAIL-INTRUSION | enable middle-track rail intrusion | path-wide pair proof | S5-P7, C14, C18 | false |
| NC-BACKING-PLUG | insert backing-region pin obstruction | moving/backing corridor | S5-P6, S5-P7 | false |
| NC-NAMED-TRACK-INTRUDER | enable arbitrary-name classified wedge | no name exemption | C18 | false |
| NC-UNCLASSIFIED-SOLID | enable invalidly classified corridor solid | first-relevance classification | C18 | false |
| NC-ENTRY-BLOCK | restore square-ended entry obstruction | phase-specific mouth entry | S5-P7, S5-P12, C23 | false |
| NC-REVERSE-JAM | delay return contact/high backlash | passive reverse shoulder clearance | S5-P7, S5-P12, S5-P14, C6, C22, C25 | false |
| NC-MISSING-TRACK-PIECE | disable PORT B CAM | exact required topology | S5-P7, S5-P12, C18 | false |
| NC-MISSING-B-FACES | disable all PORT B pieces except MOUTH | exact required topology | S5-P7, S5-P12, C18 | false |
| NC-UNTAGGED-CORRIDOR-SOLID | remove all taxonomy from a captured corridor obstruction | metadata cannot erase matter | S5-P7, S5-P12, C18 | false |
| NC-MIDDLE-PATH-INTRUDER | block middle path while endpoint is clear | path-wide obstruction truth | S5-P7, S5-P12, C18 | false |
| NC-PATH-MOVING-UNTAGGED | move untagged matter through an earlier path sample | full-motion physical relevance | S5-P7, S5-P12, C18 | false |
| NC-FORGED-SURROUNDING-FAMILY | copy `s5-can` family onto an unauthorized obstruction | no broad family exemption | S5-P7, S5-P12, C18 | false |
| NC-MIDPATH-TRANSIENT-ROW | enable an untagged obstruction only at driveT 0.98470–0.98480 | registration-ID lifetime retention and first-relevance classification | C18 | false |
| NC-DUPLICATE-AUTHORITY-NAME | alias a second registered moving row to `S5_LOCK_PIN_PORT` | global name uniqueness and non-collapse | C18 | false |
| NC-DUPLICATE-MOVING-ROW | overlap a unique-name moving row with the PORT pin | moving↔moving pair completeness | C18 | false |
| NC-CERTIFICATE-ABSENT | invalidate/delete the current S5 path certificate | fail-closed certificate lifecycle | raw false, evaluator false, getter false | false |

Frozen count: **28 controls**.

Any newly imagined adversarial mutation after this freeze is recorded as `POST_S5_VERIFIER_HARDENING_CANDIDATE` unless it directly demonstrates noncompliance with `MT1_S5_AUTHORITY_CONTRACT_V1.md`.
