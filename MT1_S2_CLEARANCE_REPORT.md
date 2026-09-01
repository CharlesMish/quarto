# MT1-S2A clearance report

Machine-readable authority: `evidence/s2-clearance-report.json` (`status: GREEN`, `freezeId: MT1-S2A`).
Certified S1C SHA-256: `fef06acea92ed2f76e872f99f01dee38969dc755f7845cdd685e1f6bab707201`.
Audited S2 SHA-256: `9ff777347548ff7917a9f4a028b4ceef31a31f6fa6605952ec6587bad34196bb`.

S2A closes Codex S2-F01–F07. S2 numbers that were lies (empty bores that were not empty; carry occupying the strake) are not restated as current truth.

These numbers were synchronized to that dump. If they disagree, the JSON wins.

## Method

Physical-solid box OBBs are mesh-exact. Cylinder authority is mesh-derived-conservative. Sampling: global `Δt = 0.001`, refine `Δt = 0.0001` around extrema. Capture sampling `Δt = 0.01`.

**S2A all-solid sweeps** (`Δt = 0.01` unless noted): moving-front × FWD_CARRY; book-pin vs every physical; nest-pin vs every physical from before approach; catch-keeper vs every physical from `0.70`; inner×outer fold at `Δt = 0.005`; moving × protected corridors over all `frontT`. Failures report solids and first/last `frontT`.

E2/E4 `width/height/length` are all-time bound differences (`max − min`).

Rear coexistence uses the certified S1C E2 corridor, not a live rear rebuild.

## GF1 — rear Z firewall

Front E2 `minZ = 1.355`. Firewall `0.340`. Margin **1.015 m**. Zero corridor hits over 101 samples. The 0.13 m aft move is the keeper now behind the vane.

## GF2 — cockpit

Minimum separation **0.193 m** at `frontT = 0.86` (`FL_OUTER_ARMOR` vs cockpit).  
Maximum supported cockpit half-width (study only): **0.813 m**.  
The cockpit box was not shrunk.

## GF3 — floor

Minimum physical Y **0.426 m** at `frontT = 0.146` (`FL_OUTER_ARMOR`, mid-fold). Pivot Y **2.22 m** is the fold-floor result.

## GF4 — socket

Rail `(1,0,0)`, stroke **0.400 m**, rail length 0.930 m, `Δy = Δz = 0`. Receiving lane (all moving front × all fixed carry) clear over 101 samples. Shoe↔rail is the only exempt pair.

## GF5a — book restraint

Y-bore capture from `t = 0.280`. Pin path vs **all** physicals clear (85 samples). Min solid sep 0.011 m. The outer/inner vanes are split around a 0.06 m empty XZ hole.

## GF5b — nest

Separate +X bore at `(−1.22, 2.38, 3.50)` from `t = 0.940`. Pin path vs all physicals (including rail/stop) clear. Min solid sep 0.010 m.

## GF6 — closed carry

**Declared** interfaces only (≤ 0.002 m contact or splice). No 20 mm proximity edges. Rail, nest receiver, and catch each reach both frozen bulkheads.

## GF7a/b/c — reservations

Empty occupancies (`KEEP_REAR_STBD_NEST`, `KEEP_FWD_STBD_NEST`) are mutually disjoint and do not consume unrelated fixed solids. Protected corridors (cockpit, dorsal, rear E2, aft bay) may contain the structure they protect. Moving S2 solids stay out.

`KEEP_FWD_PORT_NEST` was deleted in S2. S2A occupancy is the full seated moving set (40 names), not `book:`-only.

## GF8 — honest book

Folded thickness **0.54 m**. Full fold sweep (33 samples) clear except authorized hinge-face contact. No scaling or hiding.

## GF9 — envelopes

### Front E1 — moving max instantaneous

W 3.304 @ 0.083 · H 2.054 @ 0.146 · L 2.160 @ 0.540

### Front E2 — moving swept union

W **4.132**  
H **2.054**  
L **2.965** = 4.320 − 1.355  

`x ∈ [−5.004, −0.873]`, `y ∈ [0.426, 2.480]`, `z ∈ [1.355, 4.320]`

### S2 E3 / E4 — whole real slice (keel + carry + front)

W 5.754 · H 2.830 · L 11.700  
`x ∈ [−5.004, 0.750]`, `y ∈ [0.030, 2.860]`, `z ∈ [−7.150, 4.550]`

Keep-outs excluded. `boundsMatch=true`.

## GF10

`frontT = 0.37` matches after `0.37 → 1 → 0.37`. Diagnostics restore state.

## GF11

New carry stays out of cockpit, rear corridor, aft bay, and the derived front-starboard reservation. Bulkhead interface plates are explicit exemptions.

## GF12

Passive U-throat from `t = 0.860`. Keeper path vs all physicals clear from `0.70`. Min sep 0.0125 m. Capture depth 0.028 m.

## Width

Seated front half-width **1.756 m** ≤ frozen rear **2.239 m**.

Seated front AABB (all moving): `x ∈ [−1.756, −0.873]`, `y ∈ [1.002, 2.470]`, `z ∈ [1.355, 3.515]`.

Derived `KEEP_FWD_STBD_NEST`: `cx=1.314`, `cy=1.736`, `cz=2.435`, `hx=0.522`, `hy=0.814`, `hz=1.160`.

## C1–C7

All PASS. See JSON.

## Authority census

114 physical solids. 0 unregistered. 0 underbound.

## Rear regression

S1C rear parameters intact. New carry misses the certified rear corridor. Aft bay/drive untouched. Rear G1–G12 still PASS on the frozen mechanism.

## Gates

All GF1–GF12 PASS. All C1–C7 PASS.
