# MT1-S4 reservations

## Prior starboard nest predictions (consumed)

`KEEP_REAR_STBD_NEST` and `KEEP_FWD_STBD_NEST` remain as **prediction-retired** display/evidence. They are no longer active empty-occupancy.

Seated realization vs frozen prediction (pad 0.08):

| Keep | Contained | Margin |
| --- | --- | ---: |
| rear-starboard | yes | +0.080 m |
| front-starboard | yes | +0.080 m |

The realized mechanisms occupy the volumes reserved for them. Empty-occupancy enforcement no longer treats those books as intruders.

## Port waist

`DRIVE_WAIST_PORT` is the certified S3A cell. Unchanged. All-solid active-state hits = 0 in the four-lateral scene.

## Starboard waist

`DRIVE_WAIST_STBD` is a new state-conditioned empty occupancy, derived from:

* seated starboard front/rear AABBs
* `CHANNEL_FRAME_STBD_FWD.max.z + 0.06`
* `FWD_STBD_FRAME_AFT.min.z − 0.06`
* `xIn = +keel.halfWidth + 0.06`, `xOut = max seated X`

Volume **6.701 m³** (W 1.429 × H 1.750 × L 2.680). Separate from the port cell. Active on four-structure `driveStructuralReady`. Hits = 0.

## Cockpit / dorsal

Protected corridors unchanged. Starboard carry meets bulkheads at x=+0.75 and does not shrink the cockpit keep.
