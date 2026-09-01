# MT1-S5 — authority transition

S4A implementation files were not edited to erase the old brick.

## DRIVE_ENVELOPE

Retained as frozen outer-reference authority.

`supersededBy = S5_THRUST_CAN`

No longer counted as material in the S5 physical propulsion slice. The new can uses the same `DRIVE_BODY` transform. Outer AABB stays inside the frozen envelope at stowed, mid, and deployed.

## DRIVE_FACE_AFT

Superseded by `S5_THRUST_CAN`. It was a solid aft cap and would have closed the exhaust passage and swept through the fixed core. The terminal station is now open.

## DRIVE_SPINE

Retained S4A physical. Reused as the can's dorsal structural longeron on the frozen path.

## Retained S4A drive hardware

- `DRIVE_RAIL_P/S`
- `DRIVE_SHOE_P/S`
- carriage / `DRIVE_BODY` transform
- `DRIVE_SPINE`

## New S5 physical

Segmented can walls with empty pin-guide apertures, receiver sleeve, four seat tongues, four lock pins with followers, open lock receiver cavities (far wall + guides + +Z shoulder), closed two-sided lock tracks (RAIL_A / RAIL_B steps), lock posts, fixed core proxy, core supports, reaction frame, hollow spigot, segmented pockets, handover frame, register pads.

## Census (production, S5E)

| class | count |
| --- | ---: |
| live physical | 351 |
| retained S4A drive | 5 |
| superseded proxy | 2 |
| new S5 physical | 140 |
| debug nonphysical | 13 |
| unregistered | 0 |
| underbound | 0 |
