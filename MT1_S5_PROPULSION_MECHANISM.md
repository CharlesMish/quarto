# MT1-S5 — propulsion mechanism

Physical B′ architecture inside frozen S4A. Not an engine. Not S6.

Frozen input S4A: `95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8`  
Study input DP1AR: `3d63b1d08566fbc095713685d39570aae9fc5f454272eddb273e45e24c24fb71`

## Identity

A fixed propulsion-core envelope remains on the certified drive axis. A hollow aft thrust can extracts one body-length (−Z) around it and seats into a deployed flow/structural handover.

## Moving can

Four positive-thickness walls on `DRIVE_BODY` (same certified transform as `DRIVE_ENVELOPE`):

| wall | outer role |
| --- | --- |
| S5_CAN_PORT / STBD / TOP / BOT (segmented) | union 1.00 × 0.82 × 2.55 m |

PORT/STBD walls are split around a **0.028 × 0.028 m** empty pin-guide aperture (0.002 m running clearance to the 0.024 m pin face). TOP wall has two such apertures at x=±0.36. BOT remains a solid panel. Nominal inner passage: **0.88 × 0.70 m**. Aft end is open. No subtractive debug hole.

`DRIVE_SPINE` is retained as the dorsal longeron (intentional overlap with the top wall).

## Fixed core proxy

`S5_CORE_PROXY` — **0.70 × 0.52 × 1.80 m**, z ∈ [−4.405, −2.605], axis (0, 0.78). Conservative equipment envelope. `S5_CORE_ROBUST_REF_VIS` (0.66 × 0.48) is debug-only.

## Forward core mount

Supports stay inside the core section while the stowed can surrounds them, then exit the open forward mouth:

```
S5_CORE_PROXY
  → S5_CORE_SUPPORT_PORT / STBD
  → S5_CORE_REACTION_FRAME @ z = −1.70
  → BULKHEAD_Z-1p70
  → VENTRAL_KEEL
```

No radial mount through the can wall.

## Sequence (existing maps)

four laterals structurally ready → requested drive may advance → hollow can extracts → receiver approaches spigot → nest → register seats (live geometry) → four seat tongues locate → captive cam shoes enter closed two-sided **supported** tracks → can Z drives four lock pins through real wall guide apertures into receiver cavities → reverse RAIL_A retracts the pins before the retaining shoulder → `driveThrustReady` (requires path certificate + retained margin at every ready state).

`driveThrustReady` does not gate deployment.
