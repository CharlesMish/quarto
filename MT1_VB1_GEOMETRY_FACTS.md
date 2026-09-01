# MT1-VB1 — geometry facts

Tag: **GEOMETRY_FACT**. Extracted from frozen S4A. Machine-readable: `evidence/vb1-geometry-facts.json`.

## Drive

Thrust axis: `x_lat = 0`, `y_vert = 0.78 m`, direction **+Z forward**.

| State | drive-body center (DRIVE_ENVELOPE) |
| --- | --- |
| Stowed (`machineT` before applied drive) | (0, 0.780, **−3.250**) |
| Deployed (`machineT = 1`) | (0, 0.780, **−5.800**) |

Deployment: **−Z aft**, Δz_long = **−2.550 m** (matches `P.drive.stroke`).

Thrust direction and hardware deployment are opposite.

## Reservations

`KEEP_COCKPIT` center (0, 1.25, 3.55), half (0.68, 0.95, 1.05).  
Faces used only as allowance-location sensitivity.

Waist cells (certified S4A):

| Cell | center (x_lat, y_vert, z_long) | half |
| --- | --- | --- |
| PORT | (−1.524, 1.475, −0.290) | (0.714, 0.875, 1.340) |
| STBD | (+1.524, 1.475, −0.290) | (0.714, 0.875, 1.340) |

Used as location boxes, not filled volumes.

## SPREAD family location proxies

| Family | x_lat | y_vert | z_long |
| --- | ---: | ---: | ---: |
| F3 REAR_FIXED | 0 | 2.200 | −3.075 |
| F4 FRONT_CARRY_FIXED | 0 | 1.640 | +2.330 |
| F5 CENTRAL_STRUCTURE | 0 | 0.812 | −0.200 |
| F6 DRIVE_MOVING stowed | 0 | 0.780 | −3.250 |
| F6 deployed | 0 | 0.780 | −5.800 |
| F7 DRIVE_FIXED | 0 | 0.310 | −4.455 |
| F8 cockpit center | 0 | 1.250 | +3.550 |
| F9 waist pair | ±1.524 | 1.475 | −0.290 |

F5 spans nearly the full keel length; its union-AABB center is a location proxy, not a manufactured mass centroid.

## SPREAD geometric planform

`PLANFORM_PROXY_SET` = armor footprints only (no underside, pins, rails, keel).

| Panel | extracted area m² | hand rectangle m² |
| --- | ---: | ---: |
| rear port | 10.109 | 10.109 (2.52+2.16)×2.16 |
| rear stbd | 10.109 | 10.109 |
| rear total | **20.218** | 20.218 |
| front port | 2.8753 | 3.520 |
| front stbd | 2.8753 | 3.520 |
| front total | **5.7506** | 7.040 |
| combined | **25.9682** | — |

Extracted front area is **5.7506 m²**. The 7.04 m² hand rectangles are full inner 1.70×1.10 plus outer 1.50×1.10, both sides. Certified inner-armor domains are already trimmed (port/starboard inner XZ boxes are not those full rectangles), and that trim accounts for almost all of the 1.2894 m² reduction. The four Y-passage openings (inner+outer on each side, each 0.06×0.06) remove only **0.0144 m²**. The passages are real, but they are not the main area deficit.

### Geometric planform-area centroids (SPREAD)

| | x_lat | y_vert | z_long |
| --- | ---: | ---: | ---: |
| front pair | 0 | 2.170 | **+3.824** |
| rear pair | 0 | 2.720 | **−0.800** |
| combined books | 0 | 2.598 | **+0.224** |

Never called an aerodynamic center.

## Certified first-ready

`machineT = 0.840` (S4A `firstReadyMachineT`).
