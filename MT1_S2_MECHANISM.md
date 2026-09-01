# MT1-S2A implemented mechanism

Source of numbers: `src/design/parameters.ts`, `src/machine/frontTransform.ts`, and `evidence/s2-clearance-report.json` (`freezeId: MT1-S2A`, `status: GREEN`).
Certified S1C SHA-256: `fef06acea92ed2f76e872f99f01dee38969dc755f7845cdd685e1f6bab707201`.
Audited S2 SHA-256: `9ff777347548ff7917a9f4a028b4ceef31a31f6fa6605952ec6587bad34196bb`.

S2A is a forensic correction of S2 receiving-lane and capture authority. Topology, book dimensions, pivot Y 2.22, 70° cant, and 0.40 m +X socket are unchanged.

S2 adds a front-left carry + control-strake. The certified rear mechanism is unchanged and is represented for coexistence as a protected corridor.

Units are metres and degrees. `+X` starboard, `+Y` up, `+Z` forward.

`frontT = 0` is FRONT SPREAD. `frontT = 1` is the seated forward strake. Rear `transformT` remains independent.

## Chosen front geometry (working point, not a frozen identity)

| Quantity | Value | Notes |
| --- | --- | --- |
| Inner span | 1.70 | Folded yaw / storage length |
| Outer span | 1.50 | Shorter leaf; fold-floor budget |
| Total reach | 3.20 | ~32% of rear planform `4.68 × 2.16` |
| Chord | 1.10 | Narrower-chord control surface |
| Armor / underside / gap | 0.10 / 0.14 / 0.06 | Vane 0.24; folded book **0.54** |
| SPREAD pivot / rail Y | **2.22** | From fold-floor study |
| Yaw origin Z | 3.22 | Just aft of `BULKHEAD_Z3p35` |
| Spread X | −1.78 | |
| Nest X | −1.38 | |
| Socket stroke | **0.40** | `nestX − spreadX` |
| Cant | **70°** | Study 65 / 70 / 75; 70 keeps the rear family and a mid strake |
| Yaw | −90° about `+Y` | Aft, not into the nose |
| Fold | +180° about hinge `+Z` | Underside-to-underside |

## Hierarchy

```
FL_SOCKET_RAIL (fixed on FWD_CARRY, +X)
FL_CARRIAGE
  FL_YAW            about +Y
    FL_CANT         about local +X (span after yaw)
      FL_SPAR
        FL_VANE_INNER
        FL_BOOK_HINGE     about +Z
          FL_VANE_OUTER
          FL_BOOK_* receiver (real Y-bore)
        FL_BOOK_PIN
        FL_CATCH_KEEPER
```

## FWD_CARRY load path (S2A open cradle)

S2 ran a solid longeron/shelf/post through the seated strake volume. S2A replaces that with an **open framed receiver**:

* inboard high longeron at `y = 2.36` and low longeron at `y = 0.88` (`x ≈ −0.79`);
* Z-end frames at `z = 3.35` (inboard stile + top lintel) and `z = 1.15`;
* rail bracket above the rail, not a post through the book;
* nest receiver on a **separate +X lane** at `y = 2.38`, `z = 3.50` (above and forward of the rail);
* catch supported from **below/aft** by an arm at `y = 0.90` and two cheek risers. The arm does not occupy the throat.

Declared interfaces (contact ≤ 0.002 m) connect rail, nest receiver, and catch into `BULKHEAD_Z3p35` and `BULKHEAD_Z1p15`.

## Book restraint

Separate from nest. After fold, `FL_BOOK_PIN` translates −Y through a **real empty Y-passage** cut through inner and outer armor/underside (four panels around a 0.06 m XZ hole) plus the four-piece receiver frame. S2's receiver sat on solid vane; that is closed. Capture from `frontT = 0.280`. Full-machine pin path is clear. Bore margin 0.011 m.

## Yaw and cant

Yaw −90° about `+Y` after the pin is captured. The package stores aft between the two forward bulkhead stations. Cant hangs the chord down from the top-inboard edge in the rear’s 70° family.

## Socket

Fixed `+X` rail at `y = 2.22`, `z = 3.22`, `x ∈ [−2.05, −1.12]`. Carriage shoes wrap the bar. Stroke 0.40 m. No Y/Z shrug.

## Nest

Separate `+X` pin on a forward/up lug (`y = +0.16`, `z = +0.28` on the carriage) into a four-piece empty bore at `(−1.22, 2.38, 3.50)`. The socket rail stays at `y = 2.22`, `z = 3.22`. Pin and rail are distinct lanes. Captured from `frontT = 0.940`.

## Passive second pickup

`FL_CATCH_KEEPER` protrudes aft of the hinge (`spar local x = −1.84`) so the throat sits behind the vane, not inside it. Support is a low aft arm plus two risers to the cheeks. Engaged from `frontT = 0.860`. No actuator.

## Stage windows

| `frontT` | Stage |
| --- | --- |
| 0.00–0.06 | prep / spread stay opens |
| 0.06–0.22 | book fold |
| 0.20–0.28 | book pin |
| 0.28–0.54 | yaw aft |
| 0.52–0.70 | cant |
| 0.68–0.86 | +X socket |
| 0.84–0.94 | nest lock |
| 0.94–1.00 | seated (passive catch already on) |

Small overlaps are intentional and SAT-clear.

## Cockpit and rear firewall

Cockpit protected volume is the S1C box, **not shrunk**. Minimum front-to-cockpit separation 0.193 m at `frontT = 0.86`. Study headroom: cockpit half-width could grow to **0.813 m** before hitting the design clearance.

Front E2 `minZ = 1.355` vs firewall `0.340`. Margin **1.015 m**. The 0.13 m aft shift is the keeper relocated behind the vane (S2A-F01/F04). Firewall concept unchanged.

## Seated front (complete moving mechanism)

`x ∈ [−1.756, −0.873]`, `y ∈ [1.002, 2.470]`, `z ∈ [1.355, 3.515]`

Half-width **1.756 m** (inside frozen rear 2.239 m).

Derived `KEEP_FWD_STBD_NEST` is the X-mirror of the **full seated moving set** (40 primitives: vanes, carriage, shoes, pins, keeper, bearings) plus 0.08 m pad. Fixed FWD_CARRY is excluded and listed.

## Unresolved later work (not claimed)

No frozen CG, aero centre, lift distribution, or pitch-authority proof. Front long-arm control is a design hypothesis. SPREAD trim reuse of these joints is attractive, not demonstrated.
