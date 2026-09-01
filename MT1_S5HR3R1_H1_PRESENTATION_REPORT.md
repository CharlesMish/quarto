# MT1-S5HR3R1 — H1 Presentation Report

Status: `AWAITING_DIRECTOR_DISPOSITION`

This is a presentation/readability layer over the unchanged MT1-S5HR3R1 authority candidate. It adds no physical authority rows and changes no nominal mechanism transform, bound, map, contract, gate, or negative control.

## Lateral depth ambiguity

The camera-dependent seam artifact came from exact construction interfaces between lateral armor and underside solids. The affected rendered meshes are:

- rear: `RL_INNER_ARMOR`, `RL_INNER_UNDER`, `RL_OUTER_ARMOR`, `RL_OUTER_UNDER`, and the four `RR_*` counterparts;
- front: `FL_INNER_ARMOR_0..3`, `FL_INNER_UNDER_0..3`, `FL_OUTER_ARMOR_0..3`, `FL_OUTER_UNDER_0..3`, and the corresponding `FR_*` rows.

Every named mesh remains a physical authority solid at its original transform and bound. The H1 scene assigns cloned presentation materials with opposite raster depth bias to armor and underside faces. No mesh is moved, resized, disabled, removed, or reclassified.

## Register element

The highlighted gray elements are the physical authority rows `S5_REG_PAD_PORT`, `S5_REG_PAD_STARBOARD`, and `S5_REG_PAD_TOP`, family `s5-register`. `evalRegister()` uses them. They remain rendered and geometrically unchanged.

Three scene-only saddles—`H1_REG_BRACKET_PORT_VIS`, `H1_REG_BRACKET_STARBOARD_VIS`, and `H1_REG_BRACKET_TOP_VIS`—now connect the visual story to the adjacent fixed wall/top support. Their metadata is `presentationOnly=true`, `physical=false`, stage `H1 presentation`; they have no registration ID and are outside the authority root.

## U-throat conclusion

The older U-shaped elements are two intentional open-throat families:

- fixed front catches: `FL/FR_CATCH_CHEEK_FWD`, `*_CATCH_CHEEK_AFT`, and `*_CATCH_BACK`;
- rear book latches: `RL/RR_LATCH_CHEEK_P`, `*_LATCH_CHEEK_S`, and `*_LATCH_THROAT_BACK`.

The apparent pass-through is the intended keeper entering an open throat, accentuated by section-view occlusion. It is not a duplicate visual face or unintended presentation penetration. SECTION and PROP SECTION alter visibility only; the conclusion is the same with them on or off. Authority geometry was left alone, and director picking now explains these parts in place.

## Director inspection

`INSPECT PICK` reports display/semantic name, family, role, opaque registration ID, authority slice, object class, parent, enabled state, and purpose. It uses a node-to-authority-row map created once after assembly. It performs no authority evaluation, certificate generation, geometry sweep, or pose change.

The H1 camera/review controls are documented in the README and displayed in the dev UI. H1 is not self-passed by this report.
