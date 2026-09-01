# MT1-BODY-SHELL-02

Non-authoritative fuselage / frame integration over the unchanged **MT1-S5HR3R1** mechanism.

This is a second presentation pass. It does not replace BODY-SHELL-01 and does not mutate the canonical MT1 presentation.

```bash
cd /home/cmish/MECHA/MT1/explore/body-shell-02
npm install
npm run dev -- --port 5184
```

Opens at `http://127.0.0.1:5184/`.

## Inspect

| Control | Purpose |
| --- | --- |
| `BODY ON` / `BODY OFF` | Show or hide the presentation shell |
| `BODY SECTION` | Hide starboard shell halves for a cutaway |
| `SECTION` | Existing mechanism section (bay / channel / reservations) |
| `PROP SECTION` | Ghost the thrust can **and** adjacent shell fairings |
| `BODY 3/4` | Vehicle-framed camera |
| `BODY SPREAD` / `BODY MID` / `BODY DRIVE` | Review poses on the vehicle camera |
| `3/4` `TOP` `SIDE` `FRONT` `REAR` `PROP` | Existing mechanism cameras |
| `B` | Toggle body |

Suggested director sequence:

1. `BODY SPREAD`
2. `BODY MID`
3. `BODY DRIVE`
4. `TOP`, `SIDE`, `FRONT`, `REAR`
5. `BODY SECTION`
6. `BODY OFF`
7. `PROP` with BODY ON, then `PROP SECTION`

See `BODY_SHELL_02_DESIGN_NOTE.md` and `BODY_SHELL_02_COMPLETION.md`. This package creates no authority, changes no mechanism transform, and makes no cockpit, intake, engine-internal, aero/CFD, or propulsion-performance claim.
