# MT1-BA1 — Body Architecture Boundary: results

Status: **STUDY ONLY · A — EXPOSED-CARRIER VEHICLE**  
Date: 2026-09-02  
Package: `explore/body-shell-03/` (BODY-SHELL-03.1 + FO1 lineage)  
Source mechanism: **MT1-S5HR3R1** (unchanged)  
Authority participation: **none**  
Machine-readable map: [`evidence/ba1-body-map.json`](../../evidence/ba1-body-map.json)  
Diagnostic diagram: [`evidence/ba1-body-map.svg`](../../evidence/ba1-body-map.svg)

Does not start BODY-SHELL-04. Does not reopen S5. Does not retry SO1. Does not assign professions. Stop after BA1.

No vehicle geometry changed. No authority changed. FO1 remains accepted. SO1 remains a negative presentation result. No professions assigned.

## 0. What was inspected

Read, not rewritten: `docs/CURRENT_STATE.md`, `docs/NOMENCLATURE.md`, `AGENTS.md`, `MT1_FO1_RESULTS.md`, `BODY_SHELL_03_COMPLETION.md`, `BODY_SHELL_03_1_POCKET_CORRECTION.md`, US1 / GE1 / KC1 / KS1 / DP1 results, `bodyShellConcept.ts`, `keel.ts`, `parameters.ts`, `reservations.ts`.

SO1 was consulted from unmerged `origin/cursor/mt1-so1-fa96` (`MT1_SO1_RESULTS.md`). That geometry is **not** in this branch and is **not** promoted.

Live BODY ON / BODY OFF in SPREAD and DRIVE, plus accepted captures.

Live viewer at `http://127.0.0.1:5185/` (BODY-SHELL-03.1 + FO1, no SO1 geometry): SPREAD and DRIVE, 3/4 / side / rear / front / top, BODY SECTION. BODY OFF removes prow, chine, dorsal-deck breadth, C-sockets, and stern collar. What remains is the carrier: four folios, four roots, keel, longeron, bulkheads, bay, posts, core, can. That corroborates interpretation A and the region classes below. Empty SPREAD shoulders stay FO1 presentation over real roots, not missing fuselage. The prow’s disappearance confirms an unearned nose enclosure, not a profession. No flight, payload, or station-id rewrite from the live pass. No new PNG dump.

| View | Capture |
| --- | --- |
| SPREAD 3/4 BODY ON (FO1 after) | `explore/body-shell-03/evidence/fo1/after/fo1-after-spread-three.png` |
| DRIVE 3/4 BODY ON (FO1 after) | `explore/body-shell-03/evidence/fo1/after/fo1-after-drive-three.png` |
| SPREAD / DRIVE BODY OFF (FO1 after) | `fo1-after-body-off-spread.png`, `fo1-after-body-off-drive.png` |
| Station close-ups | `fo1-after-*-fwd-root.png`, `fo1-after-*-aft-root.png` |
| Side / rear / top / section / prop | `explore/body-shell-03/evidence/body-shell-03-*.png` |

## 1. BODY ON vs BODY OFF — what identity is real

BODY OFF is a complete Quarto: four folios (legacy/source: books), four physical roots, ventral keel, dorsal longeron, three bulkheads, bay walls, aft posts, fixed core, hollow can, handover hardware. It is long, dual-envelope, and open-stern without any presentation hull.

When BODY ON is added, a faceted chine hull appears: wedge prow, ventral belly, chine walls, dorsal deck, four C-sockets, stern collar. That is the “long vehicle” silhouette.

When BODY ON is removed, that silhouette disappears. What does **not** disappear is the machine.

| Loss when BODY ON is removed | Kind |
| --- | --- |
| FO1 lip–recess–sill–web at four roots | Useful presentation explanation |
| Chine walls, ventral hull skin, dorsal deck breadth | Cosmetic mass wrapping a real carrier |
| Wedge prow | Presentation language over an unassigned reservation; not an earned front enclosure |
| Stern collar | Failed restatement of an already-open physical throat |
| Mid-body looking like a hull | Disguise of a beam; the beam is the identity |
| Can, core, posts, rails, locks, root hardware | Intentionally exposed mechanism (still there) |

The disappearance of a hull is not evidence that a fuselage is missing. It is evidence that 03.1 was doing compositional work around a chassis that already exists.

## 2. Why FO1 could be presentation and SO1 could not

FO1 had an existing local physical relationship: frozen root + folio armor at a station that already occupies the picture in SIDE and 3/4. Presentation only had to mark chine → shoulder → root → folio. Value hierarchy and lip/sill/web proportions were enough. Reach did not increase. Folios stayed proud. BODY OFF stayed identical. **ACCEPT FO1** stands.

SO1 had a correct ownership rule — the frame owns the opening; it does not own the can — and a bounded construction that still could not land in stock DRIVE 3/4 or rear DRIVE. The frozen can is 2.55 m long and continues about 1.1 m aft of a 150–470 mm collar. In whole-machine cameras the can is the picture. Making a presentation frame win would require more mass, a nacelle, or following the stroke. SO1 was forbidden to do those things. **NO PRESENTATION SOLUTION UNDER CURRENT FROZEN GEOMETRY** stands.

That split is the BA1 hinge:

- Station ownership was a **readability** problem about a relationship the mechanism already had.
- Stern “body ownership” was an attempt to convert an **intentionally exposed handover** into hull language. The physical opening is already real (bay, posts, clear throat). The can is supposed to remain visible. Presentation cannot honestly own that without becoming architecture SO1 was not allowed to write.

Retain `frame owns the opening; it does not own the can` as design doctrine only. Do not turn it into geometry. Do not retry SO1.

## 3. Mid-body: a beam, not a missing body

Prophet’s “beam, not a body” is the correct BODY OFF reading of the span from the forward station (`P.fl.z = 3.22`) to the bay mouth (`z = -1.70`). Frozen occupants there are `VENTRAL_KEEL`, `DORSAL_LONGERON`, `BULKHEAD_Z1.15`, and interstitial faces. US1 already said there is no empty longitudinal spine and that occupying the interstitial as a room is UNKNOWN. KS1 rides the keel faces; it does not grant a cabin.

BODY-SHELL-03.1 drapes chine + belly + deck across that span and thereby pretends to be a conventional hull. That is the disguise. The long exposed carrier between folio stations is legitimate Quarto identity.

Adding mass here would invent an interior the frozen machine does not have. There is not a missing fuselage. There is a small number of **already solved or intentionally open** relationships (roots, bay mouth, open stern, unassigned front box) rather than a hole waiting for BODY-SHELL-04.

## 4. SPREAD as a complete state

Do not equalize density with DRIVE. SPREAD is the certified wide envelope (~13.320 m) with four folios outboard. FO1 makes the empty shoulders read as the bays those flanks left. The centerline stays a carrier. That sparse read is **acceptable identity** of an exposed-carrier vehicle, not a presentation failure and not an architecture failure.

It is not unjudgeable until folio profession is known. Profession would say what the outboard faces *do*. It is not required to say whether SPREAD is a complete Quarto state. It is. Do not assign folio profession.

## 5. Stern

Already sufficiently real as exposed bay / posts / handover. Not missing a presentation collar. Not automatically missing a future physical terminal frame. Intentionally unbodied until a **new** functional requirement says otherwise. Waiting for another requirement is honest; inventing the requirement because the rear looks unlike a boat-tail is not.

## 6. Front

The wedge prow is presentation language. `KEEP_COCKPIT` is an unclaimed protected box. Source copy says the prow occupies the reserved front volume and is not a canopy or intake. Occupying a protected unassigned reservation is exactly the architectural claim the frozen project has not earned, if the prow is read as a nose enclosure. BA1 classifies the region `INTENTIONALLY_UNASSIGNED`. The prow may terminate the chine as review skin. It must not be promoted, and it must not be used as cockpit evidence.

## 7. Fourteen-region audit (A–G)

Classes used; none forced into “needs work.” No region is `REAL_ARCHITECTURE_REQUIRED_FOR_STRONG_OWNERSHIP`. No region is `UNKNOWN`.

### 7.1 Four folios — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** Frozen armor/underside stacks, four-handed, front/rear scale split, 70° haunch.
- **B** Proud DRIVE side panels; SPREAD outboard planform.
- **C** Yes. Presentation docks them; it does not replace them.
- **D** No. They already are the side-body in DRIVE.
- **E** n/a
- **F** Assign wing/profession; flush-bury; reskin as fuselage sides.
- **G** Yes in role (wide faces vs packed flanks), no in class. Both configurations need the same physical folios.

### 7.2 Four folio/root stations — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** Hinges, socket rails, nest receivers, pins, catches on the keel.
- **B** FO1 short web “presents the hinge.”
- **C** Yes. BODY OFF is the proof.
- **D** No.
- **E** n/a
- **F** Hide hardware; replace roots with presentation pockets; change frozen IDs.
- **G** No. Roots exist in both states.

### 7.3 FO1 receiving shoulders — `PRESENTATION_SUFFICIENT`

- **A** No physical C-socket.
- **B** Repeated lip–recess–sill–web; empty bay still owned in SPREAD.
- **C** Agrees as explanation of roots; would lie if claimed as structure.
- **D** No further ownership. FO1 accepted.
- **E** Presentation already solved it. More reach or mass would be dishonest.
- **F** Retry FO1 with eighth mass, flush dock, or chine windows.
- **G** Same family; empty vs occupied. Front stays lower/shorter.

### 7.4 Chine walls — `PRESENTATION_LANGUAGE_ONLY`

- **A** None. Not the keel.
- **B** Rising faceted hull side; after FO1, hull value, not jewelry stripe.
- **C** Compositional only. BODY OFF has no chine.
- **D** No.
- **E** Presentation cannot become a structural wall without a new requirement.
- **F** Thicken into fuselage; confuse with keel; promote `BODY_CHINE_*`.
- **G** More convincing in DRIVE because folios close the sides; still not structure.

### 7.5 Ventral keel — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** `VENTRAL_KEEL`. Lowest whole-machine solid (minY 0.030 m).
- **B** Ventral hull / belly.
- **C** Belly agrees as a skin over a bar; the bar is the truth.
- **D** No additional body ownership.
- **E** n/a
- **F** Hollow the keel; treat belly as contact hardware (GE1 closed).
- **G** No. Fixed member.

### 7.6 Dorsal longeron / deck — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** `DORSAL_LONGERON` to the bay mouth; `KEEP_DORSAL` above.
- **B** Broad dorsal deck with propulsion service slot.
- **C** Longeron is real; deck breadth is not. Presentation over-claims a roof.
- **D** The member does not need a roof to exist.
- **E** A structural deck would be new architecture and would threaten KEEP_DORSAL / can corridor.
- **F** Promote deck; occupy the keep; roof the bay.
- **G** No for the member. Deck is presentation in both states.

### 7.7 Mid-body — `INTENTIONALLY_EXPOSED`

- **A** Keel + longeron + `BULKHEAD_Z1.15` + interstitial. No cabin.
- **B** Continuous chine hull spanning front station to bay.
- **C** No. 03.1 disguises a beam as a hull.
- **D** Not stronger *body* ownership. Carrier is already owned as structure.
- **E** Presentation “solving” sparseness is dishonest without inventing interior. Real fuselage is not required.
- **F** Fill the middle; add an eighth mass; declare BODY-SHELL-04.
- **G** SPREAD shows the beam more honestly. DRIVE + BODY ON conceals it. Class does not change: keep it exposed.

### 7.8 Front prow / front reserved volume — `INTENTIONALLY_UNASSIGNED`

- **A** `KEEP_COCKPIT` empty protected box; keel nose; `BULKHEAD_Z3.35`.
- **B** Wedge prow occupying that volume; not a canopy or intake.
- **C** Prow as chine terminator is honest presentation. Prow as nose enclosure is not earned.
- **D** Not until a functional occupancy requirement exists.
- **E** Presentation alone cannot assign the box. Real front architecture would be a later occupancy study, not a cockpit-by-default.
- **F** Crew/payload/sensors; shrink the keep; promote `BODY_PROW_*`.
- **G** No.

### 7.9 Rear folio / bay transition — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** Rear roots at `z = -1.88` immediately forward of bay mouth `z = -1.70`, `BULKHEAD_Z-1.70`, bay walls.
- **B** Aft chine continues through the higher station and drops toward the collar.
- **C** Physical adjacency is true. Chine continuity is presentation.
- **D** No new body joint required.
- **E** n/a
- **F** Merge folio station into a propulsion nacelle; move FO1 because the stern is nearby.
- **G** Rear folio is packed in DRIVE and outboard in SPREAD; the bay mouth does not move.

### 7.10 Open stern collar / throat — `INTENTIONALLY_EXPOSED`

- **A** Clear throat, aft posts, no physical hull terminal.
- **B** Accent collar around the seated-can mouth.
- **C** No in whole-machine DRIVE cameras (SO1). BODY OFF already owns the opening as absence of body plus posts.
- **D** Not as hull ownership. Yes as remaining inspectable.
- **E** Presentation cannot solve it (SO1). Forcing real terminal architecture without a new requirement would also be dishonest.
- **F** Retry SO1; nacelle; boat-tail; follow the can; close the stern; flatter cameras.
- **G** Same opening in SPREAD and DRIVE. Can position changes; the throat must stay open.

### 7.11 Fixed propulsion core and bay — `ALREADY_REAL_BODY_ARCHITECTURE`

- **A** Core, supports, spigot, bay walls, posts, load path to keel.
- **B** Split deck / open collar leaving the bay readable.
- **C** Yes when the bay stays open. No if presentation implies a finished engine room.
- **D** No.
- **E** n/a
- **F** S6, intake, engine internals, closed cowling.
- **G** Can stowed vs seated; bay architecture is fixed.

### 7.12 Moving hollow can — `INTENTIONALLY_EXPOSED`

- **A** Certified translating hollow can, not a complete engine.
- **B** Object seen through the collar; PROP SECTION ghosts it.
- **C** Agrees only if the can remains a distinct mechanism.
- **D** Must not be owned by body.
- **E** Any presentation that owns the can is dishonest.
- **F** Cowling, color-as-engine, stroke-following hull, performance claims.
- **G** Stowed vs seated changes the picture; class does not.

### 7.13 Overall SPREAD — `INTENTIONALLY_EXPOSED`

- **A** Certified 13.320 m dual-envelope machine.
- **B** Long hull with four empty sockets and four distant folios.
- **C** Hull story is optional. Carrier + deployed folios is the truth.
- **D** Do not add body to look “finished.”
- **E** Presentation density tricks would fake a fuselage.
- **F** Equalize with DRIVE; assign folio profession to justify mass.
- **G** This *is* the SPREAD-specific question. Sparse is acceptable identity.

### 7.14 Overall DRIVE — `PRESENTATION_SUFFICIENT`

- **A** Certified 4.600 m packed machine; folios proud; can seated.
- **B** Chine hull with four docked flanks and an open stern.
- **C** FO1 side-body read agrees. Stern hull-ownership does not, and need not.
- **D** Not as a closed vehicle body.
- **E** FO1 already did the honest presentation work. SO1 showed the dishonest remainder.
- **F** Start BODY-SHELL-04 to “finish DRIVE.”
- **G** DRIVE is denser because folios are the sides, not because a fuselage appeared.

## 8. Decision map (core BA1 artifact)

| Row | Physical reality | Current presentation claim | BA1 class | SPREAD obligation | DRIVE obligation | Future architecture implication | Do-not-touch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| folio faces | Four physical folio stacks; front lower/shorter, rear higher/larger; 70° haunch | Proud DRIVE side panels; SPREAD outboard planform | `ALREADY_REAL_BODY_ARCHITECTURE` | Remain the wide envelope; do not densify with hull | Primary side-body; stay proud | Profession not required to treat faces as body | No BOOK/book rename; no wing/profession; no haunch/authority edit |
| folio roots | Four keel stations: hinge, rail, nest, pin, catch | FO1 web presents the hinge | `ALREADY_REAL_BODY_ARCHITECTURE` | Roots remain the origin of the empty bay | Roots remain visible under the flank | Future seal/load lip would be a new requirement | No frozen-root edits for prettier skin |
| FO1 shoulder | No physical C-socket; dock-face X ±0.84 / ±0.90 m | Lip–recess–sill–web; empty bay still owned | `PRESENTATION_SUFFICIENT` | Empty shoulders read as receiving locations | Proud seat in the same frame | Do not promote C-socket to structure | No eighth mass, reach, flush dock, or chine window |
| chine | None. Presentation shoulder, not the keel | Rising faceted hull side | `PRESENTATION_LANGUAGE_ONLY` | May explain the carrier; must not own deployed folios | May quiet packed gaps; folios remain the sides | Do not freeze as keepout or volume | No fuselage thicken; do not confuse with keel |
| keel | `VENTRAL_KEEL` occupied structure, minY 0.030 m | Ventral hull / belly | `ALREADY_REAL_BODY_ARCHITECTURE` | Chassis of the wide machine | Same member; belly ≠ contact hardware | Already the chassis; no fuselage to complete it | No hollowing; no GE1 minY deletion |
| dorsal member | `DORSAL_LONGERON` to bay mouth; `KEEP_DORSAL` above | Broad dorsal deck + service slot | `ALREADY_REAL_BODY_ARCHITECTURE` | Member is enough; deck is skin | Deck must not consume the keep | Do not promote a structural roof | No keep occupation; no deck over the can |
| mid-body | Keel + longeron + `BULKHEAD_Z1.15`; no cabin | Continuous hull across the span | `INTENTIONALLY_EXPOSED` | Sparse beam is legitimate | Packed folios are sides; carrier may stay visible | Filling invents an interior | No mid-fill; no eighth mass; no KS1 cuts |
| prow/front reservation | `KEEP_COCKPIT` unclaimed protected box | Wedge prow occupying that volume | `INTENTIONALLY_UNASSIGNED` | Not a completed nose | Same | Front enclosure needs a later occupancy study | No cockpit/profession; no keep shrink; no `BODY_PROW_*` promotion |
| bay | Walls, posts, `BULKHEAD_Z-1.70`, core supports | Aft chine/deck open into the bay | `ALREADY_REAL_BODY_ARCHITECTURE` | Real aft volume; keep open | Visible around the can | Do not close into an engine room | No hidden posts; no can-corridor occupation; no S6 |
| stern opening | Clear throat; posts; no hull terminal | Open collar around seated-can mouth | `INTENTIONALLY_EXPOSED` | Same open stern, not a DRIVE cap | Can may dominate the rear picture | Hull-owned stern is not a current requirement | No SO1 retry; no nacelle/boat-tail/sleeve |
| can | Hollow translating can, 2.55 m stroke | Seen through collar; PROP SECTION ghosts | `INTENTIONALLY_EXPOSED` | Stowed, still inspectable | Seated, still a distinct mechanism | Body must not own the can | No internals, intake, nozzle, or performance claim |

Full machine-readable rows: `evidence/ba1-body-map.json`.

## 9. Top-level interpretation

**A — EXPOSED-CARRIER VEHICLE**

Quarto is four folios on a frozen keel / bay / post chassis with an inspectable open-stern handover. BODY-SHELL-03.1 is explanatory presentation around that machine. It is not an unfinished fuselage, and it is not a structural body waiting to be promoted.

Rejected:

- **B PARTIAL PHYSICAL BODY** — sounds careful, but it invites promoting FO1 shoulders, the prow, or a stern frame that BA1 just classified as presentation, unassigned, or intentionally exposed.
- **C STRUCTURAL BODY REQUIRED** — assumes a conventional fuselage obligation the frozen machine does not have.
- **D PRESENTATION ALREADY SUFFICIENT** — overclaims. 03.1 is not finished body architecture; SO1 is a negative.
- **E UNKNOWN** — frozen geometry plus FO1/SO1 is enough to judge the *body type*. Remaining unknowns are professions and later functional requirements.

Because the interpretation is A, there are **no** promotion candidates.

### Presentation language that must not be promoted

- BODY-SHELL-03.1 seven masses as a set
- Chine walls
- Ventral hull / belly
- Dorsal deck as a hull roof
- Wedge prow
- FO1 lip–recess–sill–web
- Open stern collar, including unmerged SO1 throat geometry
- Mid-body volume fill / conventional fuselage
- Nacelle, cowling, boat-tail, or can-following sleeve

### Regions that should remain exposed

- Mid-body carrier (keel, longeron, `BULKHEAD_Z1.15`, interstitial)
- Open stern / service throat
- Fixed core, hollow can, receiver, capture, locks, shoes, rails
- Aft posts and bay interior
- Folio root hardware
- DRIVE waist empty occupancy
- `KEEP_DORSAL`

Front reserved volume is not “exposed mechanism”; it is **intentionally unassigned**.

## 10. One next bounded slice

**None yet; wait for functional requirements.**

BA1 does not find a missing fuselage, and it does not find a body-architecture hole that another shell or another collar can honestly fill. A later slice is justified only if a functional requirement creates a **new physical relationship**. BA1 does not create that requirement.

Explicitly not this recommendation: BODY-SHELL-04, SO1.1, SR1, cockpit, ground gear, folio profession, engine internals.

`docs/CURRENT_STATE.md` still lists **MT1-SR1** as the architecture-chain next slice. BA1 does not authorize, start, or replace SR1. SR1, if opened by a later task, is generic service-route reservation on the proven skeleton — utilities, not body.

## 11. Remaining unknowns and negative results

- Folio profession: unknown, and not required to classify body type.
- Front occupancy: unknown; keep protected.
- Ground contact: GE1 closed; not reopened.
- H1 director disposition: unchanged.
- SO1 negative: retained. No presentation solution for hull-owned stern under current frozen geometry.
- Whether some future requirement will need a physical terminal frame or a physical receiving lip: unknown, and not invented here.

Negative result (useful): Quarto’s “unfinished body” appearance under BODY ON is mostly 03.1 pretending to be a conventional hull around an exposed-carrier machine.

## Task report

- **Changed files:** `explore/body-shell-03/MT1_BA1_SCOPE_AND_EPISTEMICS.md`; `explore/body-shell-03/MT1_BA1_RESULTS.md`; `evidence/ba1-body-map.json`; `evidence/ba1-body-map.svg`; `tests/mt1-ba1.spec.ts`; `explore/body-shell-03/README.md` (pointer only). No `src/`, no `bodyShellConcept.ts`, no cameras, no frozen geometry.
- **Tests:** `MT1_BASE_URL=http://127.0.0.1:5185 npx playwright test tests/mt1-ba1.spec.ts` — passed (decision map rows/columns, class legality, interpretation A, no professions, no geometry, next slice ≠ BODY-SHELL-04/SO1/SR1). `npm --prefix explore/body-shell-03 run build` — passed. `MT1_BASE_URL=http://127.0.0.1:5185 npm --prefix explore/body-shell-03 test` — passed (isolation + 101-sample presentation-fit, 0 defects, `participatesInAuthority: false`). Canonical root `npm test` not required (no `src/` change); the BA1 gate is the added `tests/mt1-ba1.spec.ts`.
- **Evidence:** new diagnostic map only. Consulted FO1 after-set, BODY-SHELL-03 captures, US1/GE1/KS1/DP1, unmerged SO1 report, and a live BODY ON/OFF pass on the FO1 viewer. No giant dump. No regenerated fit.
- **Authority participation:** none.
- **Remaining unknowns / negatives:** listed in §11. SO1 remains negative. FO1 remains accepted.
