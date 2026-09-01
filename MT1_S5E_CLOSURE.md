# MT1-S5E — supported cam track & positive retention margin

Local corrective turn on audited S5D `257fde115d4c4be9837ccf51a658d3969ba305453e1f42ef2fb12a42e1a24659`.

Status: **GREEN_PENDING_DIRECTOR**  
H1: **AWAITING_DIRECTOR_DISPOSITION**

This is not S6. B′ is unchanged. S4A is frozen.

## Findings

| id | status |
| --- | --- |
| S5-F01 | CLOSED (preserved) |
| **S5-F02** | **CLOSED** — each track is a backed assembly spliced to `LOCK_POST`; PORT/STBD retain **0.0021 m** insertion at the physical retraction stop |
| S5-F03 | CLOSED (preserved) |
| S5-F04 | CLOSED (preserved) |
| S5-F05 | CLOSED (preserved) |
| S5-F06 | CLOSED (preserved) E4 width 13.367149536972 m |
| S5-F07 | CLOSED (preserved) refined first-ready `0.99982 / 0.99850` |
| S5A-N01 | CLOSED (preserved) |
| S5C-N01 | CLOSED (preserved) |

## Track support

Each sector: 6 `RAIL_A` + 6 `RAIL_B` working faces spliced to one `S5_LOCK_TRACK_BACK_*` plate, which overlaps `S5_LOCK_POST_*`.

52 structural edges, minimum contact **0.004 m**. Adjacent steps need not touch; the common backing carries reaction.

Actuation reaction: pin/follower → rail face → backing → post → handover frame.

Captured thrust reaction unchanged: pin → shoulder → web → recv → post → frame → keel.

## Retained insertion margin

Physical retraction probe at captured pose. First RAIL_B contact, then remaining receiver insertion:

| sector | margin | stop Δ |
| --- | ---: | ---: |
| PORT | 0.0021 m | 0.0059 m |
| STARBOARD | 0.0021 m | 0.0059 m |
| TOP_PORT | 0.0121 m | 0.0079 m |
| TOP_STARBOARD | 0.0121 m | 0.0079 m |

Architectural minimum **0.002 m** (same scale as pin-guide running clearance). Canonical endpoint insertion is unchanged (PORT/STBD 0.008 m, TOP 0.020 m).

## Negative controls

NC-TRACK-FLOAT: PORT backing removed → local lock remains, C14/C16/P7/P12 fail, public ready false.  
NC-ZERO-RETAINED-MARGIN: PORT/STBD RAIL_B restored to the S5D stop → margin 0, C14/C17/P7/P12 fail, public ready false.

## Census

LIVE_MATERIAL_PHYSICAL **351** · LEGACY_SUPERSEDED_REFERENCE **2** · DEBUG **13** · new S5 **140** · unregistered **0** · underbound **0**
