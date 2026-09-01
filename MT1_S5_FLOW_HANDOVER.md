# MT1-S5 — flow handover

Geometric open-passage statement only. No CFD, pressure, thrust, or seal claim.

## Stations

| quantity | z (m) |
| --- | ---: |
| core aft / spigot root | −4.405 |
| deployed can mouth | −4.525 |
| bridge | 0.120 |
| selected spigot | [−4.645, −4.405] (0.240 m) |
| deployed receiver | [−4.705, −4.525] (0.180 m) |

## Physical sections

| body | outer | inner | wall |
| --- | --- | --- | --- |
| can | 1.00 × 0.82 | 0.88 × 0.70 | 0.060 / face |
| receiver sleeve | 0.88 × 0.70 | 0.76 × 0.58 | 0.060 |
| hollow spigot | 0.70 × 0.52 | 0.58 × 0.40 | 0.060 |
| core proxy | 0.70 × 0.52 | (envelope) | — |

First-order flow-joint radial clearance: **0.030 m / face**. Design value, not a manufacturing tolerance.

## Approach

Receiver travels with the can from the stowed mouth to the fixed spigot. First positive axial insertion at **driveT ≈ 0.883** (machineT ≈ 0.986). Final insertion **0.120 m**. Short 0.150 m spigot yields 0.030 m and keeps `driveThrustReady` false.

Material solids of spigot and receiver do not overlap. Nesting begins through the open receiver mouth.

## Terminal passage

At capture:

spigot bore → receiver bore → can axial passage → open aft terminal.

Continuous and coaxial. No flow-rate claim.

Core/can minimum full-stroke clearance: **0.090 m**.
