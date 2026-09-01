# Agent operator contract

This contract is mandatory for Codex, Grok Bot, Luna, Claude, and every other coding or review agent working in this repository.

## Before substantive work

1. Read `README.md` and `docs/CURRENT_STATE.md`.
2. Read `docs/NOMENCLATURE.md` before writing human-facing project language.
3. Inspect the relevant frozen contracts, reports, evidence, and tests before proposing a mechanism or architecture change.
4. Use the lightweight `window.__MT1.getBuildInfo()` and `window.__MT1.getInspectionState()` APIs for provenance. Do not run heavyweight authority merely to identify a build.

## Branch and review policy

- `main` is the accepted baseline only.
- Work on a dedicated task branch created from the accepted `main` commit.
- Never push substantive experiments directly to `main`.
- Prefer a pull request into `main`, with the task evidence and validation result attached or linked.
- Grok Bot/Luna work must occur on dedicated branches. The same expectation applies to other implementation agents.
- Keep branch state self-contained so an audit agent can compare it directly against `main` without reconstructing the change from ZIP handoffs.
- Negative results are valid. Report them without changing frozen inputs to manufacture a pass.

## Frozen authority contract

- Frozen **MT1-S5HR3R1** authority is not editable unless the task explicitly reopens it.
- Do not alter frozen geometry, transforms, motion maps, parameters, bounds, certificates, gates, accepted results, or proof semantics to make a new study pass.
- Registration ID is proof identity wherever the frozen authority contract says so.
- Do not rename frozen IDs, registration IDs, mesh/object names, functions, parameters, evidence keys, test fixtures, report filenames, or source `BOOK`/`book` identities merely to adopt Quarto/Folio terminology.
- Quarto is the machine name; it does not replace MT1-S5HR3R1 or change authority semantics.
- BODY-SHELL-03.1 is presentation-only. BODY ON creates no authority, physical, keepout, reservation, structure, or volume rights. BODY OFF is the frozen inspectable mechanism/authority view.
- Study geometry must remain nonphysical and unregistered unless a task explicitly promotes it through the required authority process.
- Preserve the explicit Babylon default-shader registrations in `src/scene/materials.ts` and the accepted BODY-SHELL-03.1 copy.

## Architecture boundaries

- No spontaneous S6.
- No cockpit or operator assumption.
- `KEEP_COCKPIT` is a historical identifier for a protected front reservation, not proof of a cockpit.
- No flight, aircraft, aerodynamic, or performance claim.
- No ground hardware unless a task explicitly reopens that architecture question.
- No utility profession assignment until a task explicitly assigns it.
- Preserve `KEEP_COCKPIT`, `KEEP_DORSAL`, the DRIVE waist, can/core corridor, folio/root sweeps, and open-stern protections.
- Preserve the inspectable fixed-core / hollow-thrust-can / capture handover. Do not promote the thrust can into a complete engine.
- No sleeve, penetration, or structural cut is authorized by KS1. Sleeve candidates remain backup architecture hypotheses.

## Language boundaries

- Use **Quarto** for the whole machine and **MT1** for the engineering-development lineage.
- In new explanatory prose, use **folio** for one complete lateral assembly. On first use, `folio (legacy/source: book)` is appropriate.
- Use **haunch** only for the characteristic canted/folded packing posture and shoulder relationship. It is not a part class, state variable, or authority state.
- Use **chine** only for BODY-SHELL-03.1's faceted presentation shoulder. The ventral keel is not the chine.
- Preserve archival language in historical reports. Do not mass-edit Mechanical Truth, District Zero, MT1, or `book` out of evidence.
- Use **Hush Basin** in new prose for the Godot gameplay realization / semantic reference. Do not imply a literal 1:1 geometry export.

## Every task report

Every implementation, study, or audit handoff must state:

- changed files;
- tests and their results;
- evidence added, regenerated, or consulted;
- authority participation, including an explicit `none` when applicable;
- remaining unknowns and negative results.

If validation is skipped or fails, say why. A task is not permitted to hide an unknown by assigning a profession, changing frozen geometry, or relabeling proof identity.
