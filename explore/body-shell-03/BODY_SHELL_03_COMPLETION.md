# MT1-BODY-SHELL-03 — Completion Report

Status: **NON-AUTHORITATIVE PRESENTATION PASS**  
Date: 2026-08-29  
Source mechanism: **MT1-S5HR3R1** (unchanged)

Thesis: one long faceted open-stern hull whose four lateral books have owned sockets in SPREAD and become proud docked side panels in DRIVE.

**03.1** (same package): pocket-ownership correction. Baseline freeze in `baseline-03/`. See `BODY_SHELL_03_1_POCKET_CORRECTION.md`.

## 1. BODY-SHELL-02 retain / transform / delete

**Retained**
- Separate `explore/` package; canonical `src/` untouched
- `BODY ON/OFF` (`B`), `BODY SECTION`, `PROP SECTION`
- `BODY SPREAD` / `BODY MID` / `BODY DRIVE`, `BODY 3/4`
- Full inspection UI (sliders, H1 cameras, `SECTION`, `LOCK FOCUS`, `INSPECT PICK`)
- Presentation-only metadata contract
- Open propulsion rule; port/starboard split for section
- Isolation/toggle tests

**Transformed**
- Box fuselage + skins + chine rails → one faceted chine hull (ventral + chine walls + dorsal deck)
- Nose prow/cheeks → wedge prow
- Box aft hoop → open stern collar (sides / lintel / sill)
- Root pods + posts → chine-grown pocket haunches + short wedge webs
- Split prop shoulders → dorsal deck that opens into a centerline service slot
- Added dedicated `DRIVE 3/4` camera

**Deleted**
- `FWD_ROOT` / `AFT_ROOT` pods
- `FWD_POST` / `AFT_POST`
- Thin `SKIN_FWD` / `SKIN_AFT`
- Extra nose rails
- Box-built `AFT_HOOP_*`
- Arbitrary mid-body core fill

## 2. Seven implemented masses

1. Wedge prow (`BODY_PROW_*`)
2. Ventral hull (`BODY_VENTRAL_HULL_*`)
3. Port/starboard chine walls (`BODY_CHINE_FWD_*`, `BODY_CHINE_AFT_*`)
4. Dorsal deck with propulsion service opening (`BODY_DORSAL_DECK_FWD_*`, `BODY_DORSAL_DECK_AFT_*`)
5. Forward book-pocket haunches (`BODY_FWD_POCKET_*`, `BODY_FWD_WEB_*`)
6. Rear book-pocket haunches (`BODY_AFT_POCKET_*`, `BODY_AFT_WEB_*`)
7. Open stern collar (`BODY_COLLAR_SIDE_*`, `BODY_COLLAR_LINTEL_*`, `BODY_COLLAR_SILL_*`)

No eighth mass.

## 3. New primitives (exploration-only)

In `src/scene/primitives.ts`:
- `extrudeYZ` / `extrudeXZ` — faceted polygon extrusions
- `trap` — trapezoidal prism (quad-to-quad)
- `wedge` — triangular prism
- `facetStrip` — loft-like strip of quads (dorsal deck)

No rotated-box fake hull.

## 4. Presentation-fit results

`window.__MT1.runBodyShellFit()` — classification only, `participatesInAuthority: false`.

Final: **pass, 0 defects** over machineT samples `[0, 0.24, 0.48, 0.6, 0.72, 0.86, 1]`.

Pose restored (`machineT`, `driveT`, `mode`, `preview`). A cached `driveThrustReady` peek may flip because `applyMachine(1)` ran inside the sweep; that is not an authority rewrite.

Pocket outboard reach was limited to stay out of the fold sweep, so the live visual gutter at the nested inner face is **wider than the 80–120 mm starting value**. Front dock face is ~0.16 m outboard of `P.keel.halfWidth`; rear ~0.22 m. Books remain proud. Expected-close (80–120 mm) hits are therefore not the operating band.

## 5. Defects found and shell changes

| Pass | Result | Shell change |
| --- | --- | --- |
| 1 | 132 overlaps, pockets vs book armor at t≥0.60 | Pockets shrank in Y/Z; outboard reach capped so they no longer fill the fold sweep |
| 2 | 6 overlaps, 20 mm nick of front outer armor at t=0.72/0.86/1 | Front reach reduced 0.28 m → 0.16 m outboard of chine |
| 3 | 0 defects | stop |

Frozen motion and authority geometry were not changed.

## 6–8. Captures

`explore/body-shell-03/evidence/`

- SPREAD 3/4 + SIDE: `body-shell-03-spread-three.png`, `body-shell-03-spread-side.png`
- MID 3/4: `body-shell-03-mid-three.png`
- DRIVE 3/4 + SIDE + REAR + TOP: `body-shell-03-drive-three.png`, `body-shell-03-drive-side.png`, `body-shell-03-drive-rear.png`, `body-shell-03-drive-top.png`
- BODY OFF: `body-shell-03-body-off.png`

SIDE/DRIVE reads as one rising chine, books proud, can visible at the stern. SIDE/SPREAD is the same hull with empty sockets. REAR/DRIVE frames an open throat.

## 9. BODY SECTION / PROP SECTION

- `BODY SECTION` hides starboard `BODY_*_STBD_*` (see `body-shell-03-section.png`)
- `PROP SECTION` ghosts the can and aft shell (chine aft, dorsal aft, collar); locks stay readable (`body-shell-03-prop.png`, `body-shell-03-prop-section.png`)
- Inspection HUD is intact

## 10. Canonical / authority

Canonical `src/` has no body-shell files. No frozen parameters, transforms, contracts, or certificates were modified. BODY OFF is the certified machine.

## Run

```bash
cd /home/cmish/MECHA/MT1/explore/body-shell-03
npm run dev -- --port 5185
npm test
npm run capture:body
```
