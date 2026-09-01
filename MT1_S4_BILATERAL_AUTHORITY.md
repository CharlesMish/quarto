# MT1-S4 bilateral authority

Machine-readable: `evidence/s4-authority-report.json`.
S3A SHA-256: `56e45ff236522753f8626909c93b7dfc5ea347e5ab7087dac5b641eae0f693f8`

Certified port builders were **not** rewritten. Starboard is new positive-scale geometry driven from frozen dimensions and a formal side-sign spec (`src/machine/side.ts`).

## Side / sign convention

`SIDE_PORT = −1`, `SIDE_STBD = +1`. Meshes are never `scale.x = −1`.

| Quantity | Port (frozen) | Starboard |
| --- | --- | --- |
| Rear spread X | −1.98 | +1.98 |
| Rear nest X | −1.50 | +1.50 |
| Rear yaw | −90° | **+90°** (aft) |
| Rear latch jaw | −90° | **+90°** (throat close) |
| Rear socket | +X inboard | **−X inboard** |
| Front spread X | −1.78 | +1.78 |
| Front nest X | −1.38 | +1.38 |
| Front yaw | −90° | **+90°** |
| Front nest pin | +X | **−X** |
| Book fold (local hinge Z) | +180° | **−180°** (X-reflected homolog of the port fold path) |
| Haunch / cant | +70° local +X | +70° local +X (hangs down after opposite yaw) |

## Timing

Frozen S3A maps, no stagger:

```
frontPortT = frontStbdT = mapFront(machineT)
rearPortT  = rearStbdT  = mapRear(machineT)
requestedDriveT = mapDrive(machineT)
appliedDriveT = driveStructuralReady ? requestedDriveT : 0
```

`driveStructuralReady` is the AND of four capture groups (port rear, port front, stbd rear, stbd front), each from real SAT/bore/throat predicates.

## Preview modes

`FRONT_STBD_PREVIEW` / `REAR_STBD_PREVIEW` plus existing port/cant/haunch previews. HUD says PREVIEW. `setMachineT` restores all four laterals and gated drive.

## Symmetry invariants

Homologous world-space check: `x_stbd ≈ −x_port`, `y`/`z` match, sockets travel inboard, yaw is aft, haunch hangs down. Euler signs are not required to match.
