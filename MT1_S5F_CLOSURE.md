# MT1-S5F — continuous cam slot & all-rail path closure

Local corrective turn on audited S5E `1e090df56ed39368ca93f987dcc5747ee870fff011070f347711de57fb77599d`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

This is not S6. B′ is unchanged. S4A is frozen. machineT / mapDrive / 2.55 m stroke / bay / axis / thrust can / fixed core / spigot / receiver / guide apertures / seat tongues / lock pins / receiver cavities / retaining shoulders / shoulder webs / handover frame / four lock sectors / track backings / upstream four-capture drive law are unchanged.

## Findings

| id | status |
| --- | --- |
| S5-F01 | CLOSED (preserved) |
| **S5-F02** | **CLOSED** — staircase working faces replaced by a continuous two-sided slot; all-rail sweep over `driveT=0.99400→1.00000` at `Δ=0.00001` records **0 follower∩rail hits** |
| S5-F03 | CLOSED (preserved) |
| S5-F04 | CLOSED (preserved) |
| S5-F05 | CLOSED (preserved) |
| S5-F06 | CLOSED (preserved) E4 width 13.367149536972 m |
| S5-F07 | CLOSED (preserved) refined first-ready `0.99982 / 0.99850` |
| S5A-N01 | CLOSED (preserved) |
| S5C-N01 | CLOSED (preserved) |
| **S5E-N01** | **CLOSED** — contact-side binary search, PORT/STBD retained margin **0.002021 m**, no last-clear sample |

## Track topology

Each sector:

```
SUPPORTED TRACK ASSEMBLY
   ├── S5_LOCK_RAIL_A_*  — one rotated prism, inner face parallel to the follower centerline
   ├── EMPTY FOLLOWER CORRIDOR
   ├── S5_LOCK_RAIL_B_*  — one rotated prism, retraction stop
   └── S5_LOCK_TRACK_BACK_*
          → LOCK_POST
          → HANDOVER FRAME
```

Rails per sector: **2**. No staircase boxes. No entry flare (canonical approach is clear of the finite pickup end-face).

| sector | p0 (pickup) | p1 (captured) | d̂ | angle |
| --- | --- | --- | --- | ---: |
| PORT | (−0.526, 0.524, −4.562) | (−0.552, 0.524, −4.575) | (−0.894427, 0, −0.447214) | 63.435° |
| STARBOARD | (0.526, 0.524, −4.562) | (0.552, 0.524, −4.575) | (0.894427, 0, −0.447214) | 63.435° |
| TOP_PORT | (−0.400, 1.208, −4.562) | (−0.400, 1.234, −4.575) | (0, 0.894427, −0.447214) | 63.435° |
| TOP_STARBOARD | (0.400, 1.208, −4.562) | (0.400, 1.234, −4.575) | (0, 0.894427, −0.447214) | 63.435° |

Active axial length **0.013 m**. Transverse extension **0.026 m**. Angle from `atan2(0.026, 0.013)`.

Derived follower support along the track normal:

`Σ |n_i| · halfExtent_i = 0.004919 m`

Inner-face offset = support + running clearance.

| face | nominal running clearance | reason |
| --- | ---: | --- |
| RAIL_A (all four) | **0.008000 m** | preserved architectural per-side running clearance |
| RAIL_B PORT/STBD | **0.002674 m** | lock-axis retraction is not 1:1 with the sloped normal; inset so first RAIL_B contact leaves ≥ 0.002 m insertion |
| RAIL_B TOP | **0.008000 m** | 0.008 m normal gap ⇒ ~0.0179 m Y-retraction, remaining insertion ~0.0021 m |

Corridor: min nominal **0.002674 m** (PORT/STBD B), max nominal **0.008045 m** (live SAT, RAIL_A).

Pickup `driveT = 0.99491`. Pre-pickup follower remains outside the rails (`allHit=false` on the 1,001-pose sweep).

## Support / reaction

12 structural edges, minimum contact **0.004 m**.

Actuation: follower → RAIL_A/B → TRACK_BACKING → LOCK_POST → handover frame → fixed machine.

Captured thrust (separate graph): pin → shoulder → web → recv → post → frame → keel.

## All-rail verifier

Every active sample tests the follower against **every** physical track solid in that sector. No `nearestRails()` path. C18: **4080** pairs, first hit **none**.

NC-NONCURRENT-RAIL-INTRUSION places `S5_LOCK_RAIL_INTRUDE_PORT_VIS` on the captured PORT centerline (empty corridor, away from RAIL_A/B). All-rail sweep detects it; C14/P7/P12 fail; public `driveThrustReady = false`.

## Retained margin (S5E-N01)

Physical first RAIL_B contact by 40-iteration binary search on lock-axis retraction. Report is the **contact-side** sample (`hi`), not last-clear.

C17 requires `margin >= 0.002 m` with no `− 0.0001` allowance.

| sector | contact-side remaining insertion | stop Δ |
| --- | ---: | ---: |
| PORT | 0.002021 m | 0.005979 m |
| STARBOARD | 0.002021 m | 0.005979 m |
| TOP_PORT | 0.002112 m | 0.017888 m |
| TOP_STARBOARD | 0.002112 m | 0.017888 m |

Architectural geometry, not manufactured tolerance.

## Sweeps

- Active tail: `driveT 0.99400→1.00000`, `Δ=0.00001`, n=510, **0** follower/rail/flare/backing/can/receiver/shoulder hits. min follower/rail clearance **0.002674 m**.
- Centerline fidelity: max perpendicular error **3.2×10⁻⁷ m** (inside the 0.008 m envelope).
- Perturbation along the track normal at u = 0.05, 0.25, 0.5, 0.75, 1.0: RAIL_A blocks extension, RAIL_B blocks retraction.
- Complete mechanism: 1,001 drive poses, moving S5 vs unrelated fixed S5, min moving-fixed **0.0004 m**, first +insert **0.883**. Zero unintended overlaps.

## Production / census / envelopes

`driveThrustReady` is false if any rail intrudes the nominal corridor, track support breaks, opposing rail disappears, guide aperture is obstructed, retained margin < 0.002 m, short spigot, or shoulder path fails.

LIVE_MATERIAL_PHYSICAL **311** · LEGACY_SUPERSEDED_REFERENCE **2** · DEBUG **14** · new S5 **100** · unregistered **0** · underbound **0**

Count dropped from S5E 351 because 48 staircase pieces became 8 continuous rails. Conservative S4A E1–E4 floor maintained (width **13.367149536972 m**).

## P / C / NC

P1–P16: **16/16 PASS**. C1–C19: **19/19 PASS**.

Retained: NC-TRACK-FLOAT, NC-ZERO-RETAINED-MARGIN, NC-CAM-GAP, NC-OPEN-CAM, NC-SOLID-GUIDE, NC-SHOULDER-FLOAT. Added: NC-NONCURRENT-RAIL-INTRUSION. All production-relevant.

## Limitations

Ideal architectural geometry. No stress, no tolerance stack, no manufactured cam finish. H1 remains director-only. No S6, cockpit, intake, engine internals, aero/CFD, or propulsion-performance claim.
