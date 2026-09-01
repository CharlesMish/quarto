# MT1-DP1A — architecture comparison

CG preference from VB1 is **not** a mechanical veto.

After the flow/seat corrective turn, B′ still wins only because three computed conditions hold:

1. a useful core fits the nominal packaging;
2. real analytical flow insertion exists (0.120 m, not 0.030 m);
3. the structural bypass concept is spatially feasible.

## B′ — preferred if allowances and the revised spigot stand

Fixed prime mover on the bay axis + hollow translating thrust can + deployed capture at the can mouth `z = −4.525`.

- Can is an open axial passage, not a brick.
- Core stays in the bay; can extracts one body-length; 0.275 m remains in the bay for the joint.
- Selected 0.24 m fixed spigot actually overlaps the 0.18 m can receiver by 0.120 m.
- Services to the core do not walk 2.55 m.
- Waist interface planes at the bay mouth remain aimed at a **resident** core.
- S4A envelope, axis, stroke, maps unchanged.

## A — whole module translates (fallback)

The current brick is the engine and leaves the bay as a unit.

- No sliding flow joint; simplest internals.
- Still needs the **same** deployed seat — rails cannot take operating axial load.
- Power/fuel/cooling flex 2.55 m.
- After deploy the bay is empty of prime mover; waist datums point at vacated volume.
- S4A also preserved.

A is the fallback if the director rejects the wall/clearance model, rejects the 0.24 m spigot revision, or a later S5 core-fit / handover-frame fails.

`DP1_FALLBACK_TO_WHOLE_MODULE_A` remains an acceptable disposition. It is not used on the production DP1A model.

## C — telescoping

Not required. With the selected 0.24 m spigot the joint is nondegenerate. C stays rejected unless that joint is later shown geometrically dishonest.

## Kill check (B′)

None of the B′ kill conditions fired on the production model:

1. useful core fits (0.74 × 0.56, length up to 2.45);
2. coaxial extraction stays clear over the full stroke (analytical rectangle model);
3. actual flow insertion 0.120 m exists after accounting for the 0.120 m core→mouth gap;
4. seat → handover frame → AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL is namable as a connected study graph;
5. operating-load graph does not require the rails;
6. no S4A dimension/map change.

A is not killed. It is heavier in moving burden and weaker in waist-service coherence.
