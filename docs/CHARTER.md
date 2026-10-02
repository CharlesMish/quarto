# Quarto charter

This page says what Quarto is for and what it is not. Current status is kept in [Current state](CURRENT_STATE.md), and contributor rules are in [AGENTS.md](../AGENTS.md).

## 1. Purpose

Quarto is an interactive Babylon.js study of one vehicle transformation. Its aim is to make the motion satisfying and to let you look closely enough to understand it.

The machine has two required configurations: **SPREAD**, about 13.32 m wide, and **DRIVE**, about 4.60 m wide. Between them, four side assemblies fold, turn, and nest, and a mechanism at the stern captures and locks. Every step can be played forward and in reverse.

The repository holds three things:

- the public presentation viewer in `explore/body-shell-03/`, served at https://quarto.cmish.dev/;
- the engineering viewer at the repository root, which checks the mechanism's geometry and motion;
- the development record: study reports, decisions, negative results, and evidence.

No new study is scheduled. The next change should answer a concrete need that comes up in gameplay or inspection.

## 2. What it deliberately is not

- **Not an aircraft or a performance claim.** Quarto makes no flight, aerodynamic, or propulsion-performance claim.
- **Not a finished vehicle.** No cockpit, driver, ground contact, engine, or job is assigned.
- **Not a closed hull.** Quarto is an exposed-carrier vehicle: its hardware and open spaces are part of the design. BODY ON shows a presentation skin with no structural meaning. BODY OFF shows the mechanism.
- **Not the game.** Gameplay lives in Hush Basin.
- **Not a physics or manufacturing model.** The checks cover only the modeled parts and their motion. They do not cover dynamics, stress, tolerances, or manufacture.
- **Not open-ended detailing.** Nothing is added for its own sake. SO1, an unsuccessful stern study, is not retried. The service-route study SR1 is parked.
- **Not a published package.** Both `package.json` files are private.

## 3. Audience

- Visitors to the website and this README.
- Developers and reviewers who run the viewers and tests or read the evidence.
- Coding and review agents, who must follow AGENTS.md.

Quarto is released under the MIT License (see [LICENSE](../LICENSE)).

## 4. Voice

- Write plain, short sentences. Say what a thing is and what it is not.
- State limits and negative results directly.
- Quarto has four words of its own. Define each one where it first appears, and don't pile them up:
  - **folio**: one of the four fold-out side assemblies (older records say "book");
  - **haunch**: the canted, folded posture of the rear folios that gives Quarto its silhouette;
  - **chine**: the faceted shoulder line of the presentation body;
  - **handover**: the stern sequence where a hollow thrust can moves over a fixed core, seats, and locks.
- Engineering IDs such as `MT1-S5HR3R1` belong in code and records. They don't belong in the lead of public prose.
- Leave archival wording in older records as it is.
- No marketing language.

## 5. Versions and change record

- `main` is the accepted baseline. Changes arrive from a task branch through a reviewed pull request.
- The repository retains the historical `quarto-ks1-accepted` tag.
- Notable changes are recorded in [CHANGELOG.md](../CHANGELOG.md), in Keep a Changelog style. Both packages are version `0.1.0`. The changelog, not the version number, is the change record.
- The mechanism is held fixed for current work; a change needs a task that explicitly reopens it. [Current state](CURRENT_STATE.md) records H1 presentation review as pending.
- The IDs and hashes in [`src/buildInfo.ts`](../src/buildInfo.ts) record the mechanism's provenance. `candidateSha256` identifies the `MT1-S5HR3R1.zip` authority candidate archive, not the deployed viewer revision.
- **Quarto** is the name of the machine and the project. **MT1** is the prefix of the engineering record, and existing MT1 identifiers are not renamed.

## 6. Relationship to other repos

- [Hush Basin](https://github.com/CharlesMish/hush-basin) is a Godot game. Its README says its city "now uses the Quarto-derived native vehicle". That vehicle is a simplified rig, adapted as an intermediate step, not a geometry export.
- The two projects inform each other through motion, shape, and readability. Neither pins a version of the other.
- Findings from play are the most useful input for any future change to Quarto.
