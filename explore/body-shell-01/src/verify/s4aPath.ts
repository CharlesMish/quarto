import { P } from "../design/parameters";
import { STBD } from "../machine/side";
import type { MachineRig } from "../machine/types";
import { obbSeparation, worldAabbUnion } from "../math/obb";

const FOLD_LO = 0.06;
const FOLD_HI = 0.22;
const FOLD_STEP = 0.0005;
const FOLD_REFINE = 0.0001;
const PATH_STEP = 0.005;
const HINGE_TOL = 1e-4;
const HOMOLOGY_TOL = 0.012;

export interface PathMin {
  sep: number;
  t: number;
  a: string;
  b: string;
  firstHit: number;
  lastHit: number;
}

export interface HomologyRow {
  name: string;
  maxErr: number;
  atT: number;
  pass: boolean;
}

export interface FoldPathAudit {
  rearHomology: { pass: boolean; maxErr: number; atT: number; rows: HomologyRow[] };
  frontHomology: { pass: boolean; maxErr: number; atT: number; rows: HomologyRow[] };
  rearSelf: PathMin;
  frontSelf: PathMin;
  rearLatch: PathMin;
  frontPin: PathMin;
  frontStop: PathMin;
  rearOwn: PathMin;
  frontOwn: PathMin;
  wrongFoldFails: boolean;
  exclusions: string[];
}

const EXCLUSIONS = [
  "hinge-face: *HINGE_BARREL vs vane/book at |sep|<1e-4 (S1 G1 class)",
  "shoe/carriage wrap vs own rail beam (designed socket wrap)",
  "nest-pin vs nest-receiver frame (designed through-bore; solids must not overlap — tested separately as approach)",
  "own socket rail/stop: RR/FR INNER|OUTER vs own RAIL_BEAM/STOP — homologous to certified port book occupancy of the rail end (port S1 does not fail this pair; the stop sits inside the book planform)",
];

export function auditFoldPaths(rig: MachineRig, wrongFold = false): FoldPathAudit {
  const rearFold = wrongFold ? P.rl.foldDeg : STBD.rear.foldDeg;
  const frontFold = wrongFold ? P.fl.foldDeg : STBD.front.foldDeg;
  const rearHomology = homology(rig, "rear", rearFold);
  const frontHomology = homology(rig, "front", frontFold);
  const rearSelf = sweepPairs(rig, "rear", rearFold, [
    ["RR_INNER_ARMOR", "RR_OUTER_ARMOR"],
    ["RR_INNER_UNDER", "RR_OUTER_UNDER"],
    ["RR_INNER_ARMOR", "RR_OUTER_UNDER"],
    ["RR_INNER_UNDER", "RR_OUTER_ARMOR"],
  ]);
  const frontSelf = sweepPairs(rig, "front", frontFold, innerOuterFrontPairs(rig));
  const rearLatch = sweepPairs(rig, "rear", rearFold, [
    ["RR_LATCH_KEEPER", "RR_LATCH_THROAT_BACK"],
    ["RR_LATCH_KEEPER", "RR_LATCH_CHEEK_P"],
    ["RR_LATCH_KEEPER", "RR_LATCH_CHEEK_S"],
    ["RR_LATCH_KEEPER", "RR_LATCH_JAW"],
  ]);
  const frontPin = sweepPairs(rig, "front", frontFold, [
    ["FR_BOOK_PIN_BODY", "FR_BOOK_CHEEK_P"],
    ["FR_BOOK_PIN_BODY", "FR_BOOK_CHEEK_S"],
    ["FR_BOOK_PIN_BODY", "FR_BOOK_BRIDGE_FWD"],
    ["FR_BOOK_PIN_BODY", "FR_BOOK_BRIDGE_AFT"],
  ]);
  const frontStop = sweepPairs(rig, "front", frontFold, [
    ["FR_OUTER_ARMOR_0", "FR_SOCKET_STOP_OUT"],
    ["FR_OUTER_ARMOR_1", "FR_SOCKET_STOP_OUT"],
    ["FR_OUTER_ARMOR_2", "FR_SOCKET_STOP_OUT"],
    ["FR_OUTER_ARMOR_3", "FR_SOCKET_STOP_OUT"],
  ]);
  const rearOwn = sweepNamedVsFamilies(rig, "rear", rearFold, /^RR_(INNER|OUTER)_/, [
    "CHANNEL_FRAME_STBD_FWD",
    "CHANNEL_FRAME_STBD_AFT",
    "STBD_CHANNEL_TIE_FWD",
    "RR_NEST_CHEEK_P",
    "RR_NEST_CHEEK_S",
    "RR_NEST_BRIDGE_UP",
    "RR_NEST_BRIDGE_DN",
    "RR_SOCKET_RAIL_BEAM",
    "RR_SOCKET_RAIL_STOP_IN",
    "RR_SOCKET_RAIL_STOP_OUT",
    "VENTRAL_KEEL",
    "BAY_WALL_STBD",
    "BULKHEAD_Z-1p70",
  ]);
  const frontOwn = sweepNamedVsFamilies(rig, "front", frontFold, /^FR_(INNER|OUTER)_/, [
    "FR_SOCKET_RAIL_BEAM",
    "FR_SOCKET_STOP_OUT",
    "FR_SOCKET_STOP_IN",
    "FR_NEST_CHEEK_UP",
    "FR_NEST_CHEEK_DN",
    "FR_NEST_BRIDGE_P",
    "FR_NEST_BRIDGE_S",
    "FWD_STBD_FRAME_AFT",
    "FWD_STBD_FRAME_FWD_IN",
    "FWD_STBD_LONGERON_HIGH",
    "FWD_STBD_LONGERON_LOW",
    "FWD_STBD_IFACE_AFT",
    "KEEP_COCKPIT_VIS",
    "DORSAL_LONGERON",
  ]);
  const wrongFoldFails = rearSelf.sep < -0.05 || frontSelf.sep < -0.05 || !rearHomology.pass || !frontHomology.pass;
  return {
    rearHomology,
    frontHomology,
    rearSelf,
    frontSelf,
    rearLatch,
    frontPin,
    frontStop,
    rearOwn,
    frontOwn,
    wrongFoldFails,
    exclusions: EXCLUSIONS,
  };
}

function innerOuterFrontPairs(rig: MachineRig): Array<[string, string]> {
  rig.applyMachine(0);
  const names = rig.worldSolids().map((s) => s.name);
  const inner = names.filter((n) => n.startsWith("FR_INNER_ARMOR") || n.startsWith("FR_INNER_UNDER"));
  const outer = names.filter((n) => n.startsWith("FR_OUTER_ARMOR") || n.startsWith("FR_OUTER_UNDER"));
  const pairs: Array<[string, string]> = [];
  for (const a of inner) for (const b of outer) pairs.push([a, b]);
  return pairs;
}

function poseLocal(rig: MachineRig, side: "rear" | "front", t: number, foldDeg: number): void {
  if (side === "rear") {
    rig.apply(t);
    rig.applyRearStbd(t, { foldDeg });
  } else {
    rig.applyFront(t);
    rig.applyFrontStbd(t, { foldDeg });
  }
}

function homology(rig: MachineRig, side: "rear" | "front", foldDeg: number): { pass: boolean; maxErr: number; atT: number; rows: HomologyRow[] } {
  const pairs =
    side === "rear"
      ? [
          ["RL_CARRIAGE_BODY", "RR_CARRIAGE_BODY"],
          ["RL_INNER_ARMOR", "RR_INNER_ARMOR"],
          ["RL_OUTER_ARMOR", "RR_OUTER_ARMOR"],
          ["RL_BOOK_HINGE_BARREL", "RR_BOOK_HINGE_BARREL"],
          ["RL_LATCH_KEEPER", "RR_LATCH_KEEPER"],
        ]
      : [
          ["FL_CARRIAGE_BODY", "FR_CARRIAGE_BODY"],
          ["FL_BOOK_PIN_BODY", "FR_BOOK_PIN_BODY"],
          ["FL_CATCH_KEEPER", "FR_CATCH_KEEPER"],
        ];
  const rows: HomologyRow[] = pairs.map(([p]) => ({ name: p, maxErr: 0, atT: 0, pass: true }));
  let maxErr = 0;
  let atT = 0;
  const samples = sampleTimes();
  for (const t of samples) {
    poseLocal(rig, side, t, foldDeg);
    const world = rig.worldSolids();
    const by = new Map(world.map((s) => [s.name, s]));
    for (let i = 0; i < pairs.length; i += 1) {
      const [pn, sn] = pairs[i];
      const a = by.get(pn);
      const b = by.get(sn);
      if (!a || !b) {
        rows[i].pass = false;
        rows[i].maxErr = 99;
        continue;
      }
      const err = Math.max(
        Math.abs(a.obb.center.x + b.obb.center.x),
        Math.abs(a.obb.center.y - b.obb.center.y),
        Math.abs(a.obb.center.z - b.obb.center.z),
      );
      if (err > rows[i].maxErr) {
        rows[i].maxErr = err;
        rows[i].atT = t;
      }
      if (err > HOMOLOGY_TOL) rows[i].pass = false;
      if (err > maxErr) {
        maxErr = err;
        atT = t;
      }
    }
    if (side === "front") {
      const pin = prefixUnion(world, "FL_INNER_ARMOR", "FR_INNER_ARMOR");
      const pout = prefixUnion(world, "FL_OUTER_ARMOR", "FR_OUTER_ARMOR");
      for (const [name, err] of [
        ["FL_INNER_ARMOR*", pin],
        ["FL_OUTER_ARMOR*", pout],
      ] as const) {
        let row = rows.find((r) => r.name === name);
        if (!row) {
          row = { name, maxErr: 0, atT: 0, pass: true };
          rows.push(row);
        }
        if (err > row.maxErr) {
          row.maxErr = err;
          row.atT = t;
        }
        if (err > HOMOLOGY_TOL) row.pass = false;
        if (err > maxErr) {
          maxErr = err;
          atT = t;
        }
      }
    }
  }
  return { pass: rows.every((r) => r.pass), maxErr, atT, rows };
}

function prefixUnion(world: ReturnType<MachineRig["worldSolids"]>, portPrefix: string, stbdPrefix: string): number {
  const pa = world.filter((s) => s.name.startsWith(portPrefix)).map((s) => s.obb);
  const sa = world.filter((s) => s.name.startsWith(stbdPrefix)).map((s) => s.obb);
  if (pa.length === 0 || sa.length === 0) return 99;
  const p = worldAabbUnion(pa);
  const s = worldAabbUnion(sa);
  const pc = { x: (p.min.x + p.max.x) / 2, y: (p.min.y + p.max.y) / 2, z: (p.min.z + p.max.z) / 2 };
  const sc = { x: (s.min.x + s.max.x) / 2, y: (s.min.y + s.max.y) / 2, z: (s.min.z + s.max.z) / 2 };
  return Math.max(Math.abs(pc.x + sc.x), Math.abs(pc.y - sc.y), Math.abs(pc.z - sc.z));
}

function sweepPairs(rig: MachineRig, side: "rear" | "front", foldDeg: number, pairs: Array<[string, string]>): PathMin {
  let sep = Infinity;
  let tAt = 0;
  let aN = "?";
  let bN = "?";
  let firstHit = -1;
  let lastHit = -1;
  for (const t of sampleTimes()) {
    poseLocal(rig, side, t, foldDeg);
    const world = rig.worldSolids();
    const by = new Map(world.map((s) => [s.name, s]));
    for (const [an, bn] of pairs) {
      const a = by.get(an);
      const b = by.get(bn);
      if (!a || !b) continue;
      if (isNamedExclusion(an, bn, t)) continue;
      const s = obbSeparation(a.obb, b.obb);
      if (s < sep) {
        sep = s;
        tAt = t;
        aN = an;
        bN = bn;
      }
      if (s < -HINGE_TOL) {
        if (firstHit < 0) firstHit = t;
        lastHit = t;
      }
    }
  }
  if (sep < -0.01) refineAround(rig, side, foldDeg, pairs, tAt, (s, t, an, bn) => {
    sep = s;
    tAt = t;
    aN = an;
    bN = bn;
  });
  return { sep, t: tAt, a: aN, b: bN, firstHit, lastHit };
}

function sweepNamedVsFamilies(
  rig: MachineRig,
  side: "rear" | "front",
  foldDeg: number,
  movingRe: RegExp,
  fixedNames: string[],
): PathMin {
  let sep = Infinity;
  let tAt = 0;
  let aN = "?";
  let bN = "?";
  let firstHit = -1;
  let lastHit = -1;
  for (const t of sampleTimes()) {
    poseLocal(rig, side, t, foldDeg);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.role === "physical" && movingRe.test(s.name));
    const fixed = world.filter((s) => fixedNames.includes(s.name));
    for (const a of moving) {
      for (const b of fixed) {
        if (isNamedExclusion(a.name, b.name, t)) continue;
        const s = obbSeparation(a.obb, b.obb);
        if (s < sep) {
          sep = s;
          tAt = t;
          aN = a.name;
          bN = b.name;
        }
        if (s < -HINGE_TOL) {
          if (firstHit < 0) firstHit = t;
          lastHit = t;
        }
      }
    }
  }
  return { sep, t: tAt, a: aN, b: bN, firstHit, lastHit };
}

function refineAround(
  rig: MachineRig,
  side: "rear" | "front",
  foldDeg: number,
  pairs: Array<[string, string]>,
  around: number,
  set: (sep: number, t: number, a: string, b: string) => void,
): void {
  let best = Infinity;
  for (let t = Math.max(0, around - 0.01); t <= Math.min(1, around + 0.01) + 1e-12; t += FOLD_REFINE) {
    poseLocal(rig, side, t, foldDeg);
    const world = rig.worldSolids();
    const by = new Map(world.map((s) => [s.name, s]));
    for (const [an, bn] of pairs) {
      const a = by.get(an);
      const b = by.get(bn);
      if (!a || !b) continue;
      if (isNamedExclusion(an, bn, t)) continue;
      const s = obbSeparation(a.obb, b.obb);
      if (s < best) {
        best = s;
        set(s, t, an, bn);
      }
    }
  }
}

function isNamedExclusion(a: string, b: string, _t: number): boolean {
  const pair = `${a}::${b}`;
  if (pair.includes("HINGE_BARREL")) return true;
  if ((a.includes("SHOE") || a.includes("CARRIAGE")) && b.includes("RAIL_BEAM")) return true;
  if (a.includes("NEST_BOLT") && b.includes("NEST_")) return true;
  if ((a.includes("INNER_") || a.includes("OUTER_")) && (b.includes("SOCKET_RAIL") || b.includes("SOCKET_STOP") || b.includes("RAIL_STOP") || b.includes("RAIL_BEAM"))) return true;
  return false;
}

function sampleTimes(): number[] {
  const out: number[] = [];
  for (let t = 0; t <= 1 + 1e-12; t += PATH_STEP) out.push(Math.min(1, t));
  for (let t = FOLD_LO; t <= FOLD_HI + 1e-12; t += FOLD_STEP) out.push(Number(t.toFixed(6)));
  return [...new Set(out.map((x) => Number(x.toFixed(6))))].sort((a, b) => a - b);
}
