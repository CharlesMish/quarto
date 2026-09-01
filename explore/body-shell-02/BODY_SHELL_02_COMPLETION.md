# MT1-BODY-SHELL-02 — Completion Report

Status: **NON-AUTHORITATIVE PRESENTATION PASS**  
Date: 2026-08-28  
Source mechanism: **MT1-S5HR3R1** (unchanged)

## What changed

A separate exploration package now lives at `explore/body-shell-02/`. Canonical `src/` was not mutated.

The first body pass (`explore/body-shell-01/`) was a thin spine / chine overlay. This second pass wraps the same frozen machine in a large-form fuselage / frame:

- blunt nose prow and cheeks
- central fuselage core, dorsal deck, ventral hull, and side skins from nose to bay
- aft bay skins, split propulsion shoulders, side fairings, and an **open** rear hoop
- short root pods and posts at the frozen front and rear hinge stations

New review controls (presentation only):

- `BODY ON` / `BODY OFF` (also `B`)
- `BODY SECTION` (hides starboard shell halves)
- `BODY 3/4` camera, used by `BODY SPREAD` / `BODY MID` / `BODY DRIVE`
- `PROP SECTION` still ghosts the thrust can and now also ghosts adjacent shell fairings

Existing machine sliders, pose buttons, H1 cameras, `SECTION`, `LOCK FOCUS`, and `INSPECT PICK` remain.

## What remained frozen

- S1C / S2A / S3 / S4 / S5HR3R1 authority geometry and motion
- `createS5Machine`, parameters, certificates, and all `src/machine/**` builders
- no S6, cockpit, intake, engine-internal, aero/CFD, or performance-claim work
- BODY-SHELL-01 retained as the thinner predecessor

## Presentation-only pieces

All `BODY_*_VIS` meshes:

- `presentationOnly=true`, `physical=false`
- family `body-shell-concept`
- concept id `MT1-BODY-SHELL-02`
- parent `BODY_SHELL_02_PRESENTATION_ROOT` (outside the authority tree)
- no registration IDs

H1 register saddles remain the earlier presentation-only layer. They are not part of this shell.

## How to run and inspect

```bash
cd /home/cmish/MECHA/MT1/explore/body-shell-02
npm install
npm run dev -- --port 5184
```

Open `http://127.0.0.1:5184/`.

Director sequence:

1. `BODY SPREAD`
2. `BODY MID`
3. `BODY DRIVE`
4. `TOP` / `SIDE` / `FRONT` / `REAR`
5. `BODY SECTION`
6. `BODY OFF` (certified mechanism only)
7. `PROP` then `PROP SECTION`

Automation:

```bash
npm test                 # isolation / toggle / non-authority gate
npm run capture:body     # evidence/body-shell-02-*.png
```

Hooks: `window.__MT1.getBodyConceptState()`, `setBodyConcept(on)`, `setBodySection(on)`. Toggling the shell does not change `machineT` or inspection/certificate state.
