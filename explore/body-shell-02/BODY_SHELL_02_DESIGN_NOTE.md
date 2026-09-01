# MT1-BODY-SHELL-02 — Design Note

Status: **NON-AUTHORITATIVE CONCEPT**  
Source mechanism: **MT1-S5HR3R1** (frozen)  
Predecessor: **MT1-BODY-SHELL-01** (thin spine / chine overlay, retained)

BODY-SHELL-01 established a readable centerline but still lived as wires around an exposed machine. This second pass adds enough fuselage mass that the same mechanism can be reviewed as a craft without becoming a new vehicle architecture.

## What this pass is for

- Stronger overall massing and silhouette.
- A central fuselage / chassis volume that ties nose to bay.
- Restrained side and rear framing around the propulsion area.
- Visual mounts at the four lateral roots so the books do not read as orphans.
- Keep the propulsion handover inspectable (open aft hoop, split dorsal slot, BODY / PROP SECTION).

## What this pass is not

- Not S6.
- Not cockpit, intake, engine-internal, or exhaust architecture.
- Not doors, seals, or production fairings around every sweep.
- Not body structural authority, manufacturing, tolerance, or load substantiation.
- Not aerodynamic shaping or CFD.
- Not a change to frozen S1–S5 geometry, motion, or certificates.

## Layout language

Large boxes only. The shell is a presentation skin around the certified keel envelope:

- **Nose prow / cheeks** — blunt forward terminus occupying the already-reserved front volume. Not a canopy.
- **Fuselage core + dorsal deck + ventral hull + side skins** — one chassis from the nose to the bay mouth.
- **Aft skins, split shoulders, side fairings, open hoop** — propulsion is housed, not boxed shut. Centerline and can mouth stay visible.
- **Root pods and posts** — short mounts at the frozen front and rear hinge stations. They stop inboard of the nested books.

Deliberately exposed:

- all four lateral mechanisms, hinges, rails, catches, and lock close-ups;
- the thrust-can centerline and handover hardware;
- the open upper service slot and open rear hoop;
- the full certified machine when `BODY OFF` is used.

Every `BODY_*_VIS` mesh is `presentationOnly=true`, `physical=false`, family `body-shell-concept`, and is rooted at `BODY_SHELL_02_PRESENTATION_ROOT` outside the MT1 authority tree.

`BODY ON / BODY OFF` is visibility only. `BODY SECTION` hides starboard shell halves. `PROP SECTION` ghosts the can and the adjacent shell fairings. None of these toggles call `applyMachine` or rewrite authority.
