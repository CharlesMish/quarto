# BODY-SHELL-03.1 — Pocket-ownership correction

Date: 2026-08-29  
Lineage: `explore/body-shell-03/` (no BODY-SHELL-04)  
Baseline freeze: `explore/body-shell-03/baseline-03/`

Silhouette language, seven masses, materials, open stern, frozen mechanism, and canonical MT1 were not changed.

## What 03.1 did

1. **Grew pockets along the chine (Z/Y), not outward.**  
   Front/rear outboard reach stays **0.16 m / 0.22 m**. Pockets are now a C-socket: chine lips + recessed face + sill + short hinge web (still masses 5 and 6).

2. **Socket language in SPREAD:** lip → recessed face → wedge to frozen hinge.  
   In DRIVE the same recess receives the book; outer armor stays proud. No flush dock, no belly/deck moved to hide books.

3. **`runBodyShellFit()` is a real-surface test.**  
   Cached BODY world triangles vs moving physical authority OBBs (authority solids are boxes). World-AABB is only a reject filter, never a defect decision. Dense canonical sweep **ΔmachineT = 0.01** (101 samples). Gutter is a separate readability row, not a clash exemption.

## Fit

`evidence/body-shell-03-fit-report.json`

- method: `triangle-obb`
- samples: 101
- defects: **0**
- first triangle-dense pass (longer aft lips) hit book armor at t≈0.68; **shell changed** (asymmetric Z, less aft extent). Reach unchanged.
- front dock-face vs nested-book inboard X: ~33 mm (readability)
- rear X-projection gutter ~0; no 3D triangle intersection

## A/B

Compare `baseline-03/evidence/` (03) with live `evidence/` (03.1).

## Captures regenerated

- `body-shell-03-spread-side.png` / `spread-three.png`
- `body-shell-03-drive-side.png` / `drive-three.png` / `drive-rear.png`
- BODY OFF, BODY SECTION, PROP SECTION unchanged in meaning
