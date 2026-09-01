# MT1-S4 starboard mechanisms

Port source files `rearLeft.ts`, `frontLeft.ts`, `fwdCarry.ts`, `keel.ts`, `transform.ts`, `frontTransform.ts` are unchanged.

## Rear-starboard

New files: `rearRight.ts`, `channelStbd.ts`.

Same frozen rear dimensions: inner 2.52, outer 2.16, chord 2.16, book 0.64, 70° haunch, 0.48 m inboard socket.

Receiving structure (new, does not move port channel/nest/bay):

* `CHANNEL_FRAME_STBD_FWD` / `_AFT` at x ∈ [+0.75, +1.55]
* `STBD_CHANNEL_TIE_FWD` splice onto `BULKHEAD_Z-1p70`
* `RR_NEST_RECEIVER` four-piece empty Z-bore at (+1.50, 2.78, −1.70)
* `RR_SOCKET_RAIL` along X, inboard −X

Book fold: local hinge Z **−180°** (port is +180°). Positive-scale starboard geometry requires the opposite axial rotation sense so the world-space path is the X-reflected homolog of certified port.

Latch: open U-throat, keeper on outer vane, jaw +90°. Nest pin +Z through the bore.

## Front-starboard

New files: `frontRight.ts`, `fwdCarryStbd.ts`.

Same frozen front dimensions: 1.70 / 1.50 spans, 1.10 chord, 0.54 folded, Y=2.22, 70° cant, 0.40 m inboard socket. Book fold local hinge Z **−180°**, homologous to rear-starboard.

`FWD_CARRY_STBD` is an open cradle homologous to S2A: inboard high/low longerons at x=+0.79, Z-end frames, rail bracket, nest receiver at (+1.22, 2.38, 3.50), catch from below/aft. Interfaces splice into the same central `BULKHEAD_Z3p35` and `BULKHEAD_Z1p15`.

Book pin −Y through a real Y-bore. Nest pin −X through a real bore. Passive U-throat inboard of the keeper.

## Endpoints (world)

SPREAD carriages at x = ±1.98 (rear) and ±1.78 (front). Seated carriages at x = ±1.50 and ±1.38. Both sides yaw aft; both hang down.
