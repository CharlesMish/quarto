# Quarto presentation palette

`hushBasinPalette.json` preserves the source material and state-color values from
the Hush Basin bridge at `dca5887`. The native Quarto derivative at `0b0cc10` is a
visual reference for the distinction between turquoise folio faces, darker
undersides, small mint details and the fixed-core/hollow-can handover.

`palette.ts` interprets those roles for this viewer's existing StandardMaterials
and unchanged lighting. Broad folio emission is reduced to retain shaded faces;
carry, joints, rails and receiving pockets have distinct tonal roles. The small
amber-to-cyan core and receiver accents depend only on the presentation scalar.
They express no warning state, readiness result or propulsion-performance claim.
Godot metallic/roughness values are preserved in the source JSON but are not
asserted to be reproduced by this StandardMaterial treatment.

The module creates cached material clones once, after machine/H1/body assembly
and before debug visualization. Only material assignments and clone colors
change. Original materials are restored by object identity in Accepted mode and
on disposal. Alpha, transparency, culling and H1 raster depth bias are preserved;
diagnostic materials and later debug meshes are outside the mapping. The shell
retains its existing BODY ON/BODY OFF presentation meaning.

Run `node explore/body-shell-03/tools/verify-palette.mjs` from the repository root
for isolated NullEngine checks of material identity, depth bias, diagnostics,
reversal, allocation stability and disposal. This check writes no evidence and
does not build the mechanism or evaluate authority. The package build performs
TypeScript validation; actual browser review establishes appearance separately.

**Authority participation: none.** No meshes, transforms, visibility settings,
physical roles, registration IDs, authority bounds or proof semantics change.
