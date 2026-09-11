# Quarto viewer reconciliation

This task combines accepted main `e56a4c09330119827e5a6c9757bf5cbc448dd29d`
with the reviewed viewer/body branch `9540453` on
`feature/quarto-reconciled-viewer`. Their common ancestor is `9321de4`.
The original branch was published intact before reconciliation. A merge commit
preserves both histories; no force-push or rewrite of either parent is needed.

## Combined behavior

BODY ON uses BODY-SHELL-03.2's opaque materials, corrected winding, flat normals,
closed decks, clean six-triangle pocket webs and bounded nose joins. It also
retains accepted FO1's 90 mm lips, 70 mm sills, wider frame webs, quiet chine
walls, darker recesses and two station review cameras. All 38 mesh names and the
seven body masses remain. BODY OFF, explicit sections and the frozen motion
retain their meanings.

FO1's original diffuse/emissive/specular values and material assignments are
retained in the accepted-color option; alpha is deliberately 1 in normal BODY
view. The Hush Basin source palette is unchanged. Its recess interpretation now
uses the existing structural hue at lower value so the darker-recess/lighter-frame
relationship survives that palette too. The previous bright joint/mint recess
mixture would have reversed FO1's intended hierarchy.

`getBodyConceptState()` exposes both `surfaceRevision: "BODY-SHELL-03.2"` and
`stationRevision: "MT1-FO1"`. Frozen `conceptId` and registration identities
are unchanged. Use `getBuildInfo()` and `getInspectionState()` for lightweight
mechanism provenance; neither presentation revision is authority.

Viewer controls, Fit, tour, picking and reverse playback are carried forward.
FO1/SO1/BA1 decisions are retained: Quarto is an exposed-carrier vehicle, SO1
stays closed negative, SR1 stays parked, and no new architecture slice begins.

## Conflict decisions and branch workflow

The two direct content conflicts were `bodyShellConcept.ts` and the shell's
`package.json`. Body resolution kept FO1's dimensions/color hierarchy and the
new solid constructors/winding together. Script resolution retained the full
supported viewer/surface suite plus FO1's explicit capture and fit-writer commands.
Those historical writers were not invoked; fresh candidate evidence uses new paths.

The merged README/current-state text was reviewed for semantic consistency.
The old branch's planned SR1 text did not replace main's newer parked decision.
Root source, tests, dependencies and hosting configuration remain identical to
accepted main. The preserved frozen-source test now pins that accepted commit,
including its BA1 tests and hosting dependencies, rather than rejecting changes
already accepted on main.

For future parallel work: start a task branch from current `main`, keep its scope
small, and integrate through one reviewed PR at a time. A branch's own passing
evidence remains historical after another branch changes the same presentation.
Revalidate the combined result instead of choosing an entire side of a conflict.

## Run and publication scope

```sh
npm --prefix explore/body-shell-03 run dev -- --port 5197 --strictPort
```

The isolated reconciliation review uses port 5197; the original viewer remains
on its existing port. The root app is still the engineering/authority viewer.
Main's existing hosting setup continues to build/serve root `dist/`; this merge
does not switch production to the shell package or deploy a site. Publishing
the presentation at a public URL remains a separate hosting-entry decision.

## Validation and evidence

Combined validation is recorded in
[reconciliation-01](../explore/body-shell-03/evidence/reconciliation-01/README.md).
Both parent evidence trees remain unchanged. Both builds pass. The shell run
passed 15 cases; a mistaken inventory count in the new FO1 test was corrected
from 24 to 20, and that case then passed separately (all 16 cases covered).
The fresh 101-pose fit has zero defects; surface verification passes for 38
meshes / 648 triangles. All 20 FO1 station meshes preserve coordinates within
1 μm, and all 38 meshes preserve accepted material/color assignments. Two BA1
tests pass. Fresh visual captures cover both endpoints and palettes.
The visual harness initially used the wrong palette API; its corrected run and
the original harness failure are recorded. No runtime change was needed.

Root regression reuse is bounded: root source and all original 103 test inputs
match the previously tested viewer lineage; main only adds the two BA1 tests.
All pre-existing dependency versions/integrities are unchanged in the accepted
lockfile; hosting adds dependencies. The new BA1 cases are run here separately.
No old result is claimed to validate a new combined shell or a deployment.

## Task record

Changed relative to the two parents: body conflict resolution; additive station
metadata/API/types/copy; Hush Basin recess value; combined package scripts;
updated accepted-baseline pin and independent FO1 preservation test; current
handoff/index documentation; new reconciliation evidence. The complete commit
diff against main also includes the original viewer/body work and its reports.

Evidence consulted: README/current state/nomenclature/operator contract, frozen
S5 records, FO1 results and source, SO1 negative closeout, BA1 scope/results/map,
body-surface and viewer validation, both parent histories and root lockfiles.

**Authority participation: none.** No frozen geometry, transforms, maps, proof
semantics, registrations or accepted results change. Normal posing and fit
use the existing certification path when stale. No authority writer is invoked.

Remaining limits: the known fine roof raster line and first-pose certification
cost are unchanged; H1 remains awaiting director disposition. Native Godot and
real-device performance are outside this reconciliation. Individual closed body
panels do not establish whole-machine watertightness or volume rights.

The [pause and return notes](QUARTO_PAUSE_AND_RETURN.md) retain the preceding
inspection and optional ideas. Their branch-divergence observation describes the
parents before this reconciliation, not a need to repeat this integration.
