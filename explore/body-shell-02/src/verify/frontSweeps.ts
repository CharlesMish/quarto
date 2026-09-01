import { FRONT_STAGE } from "../design/parameters";
import { obbOverlaps, obbSeparation } from "../math/obb";
import type { MachineRig, SweepHit, SweepResult } from "../machine/types";

const STEP = 0.01;

function recordHit(map: Map<string, SweepHit>, a: string, b: string, t: number, sep: number): void {
  const key = `${a}::${b}`;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { a, b, firstT: t, lastT: t, minSeparation: sep });
    return;
  }
  prev.lastT = t;
  if (sep < prev.minSeparation) prev.minSeparation = sep;
}

function finish(map: Map<string, SweepHit>, samples: number, label: string): SweepResult {
  const hits = [...map.values()].sort((a, b) => a.firstT - b.firstT);
  return {
    pass: hits.length === 0,
    hits,
    samples,
    detail:
      hits.length === 0
        ? `${label} clear over ${samples} samples`
        : `${label} FAIL ${hits[0].a} ∩ ${hits[0].b} firstT=${hits[0].firstT.toFixed(3)} lastT=${hits[0].lastT.toFixed(3)} sep=${hits[0].minSeparation.toFixed(4)}`,
  };
}

function isShoe(name: string): boolean {
  return name.startsWith("FL_SHOE_");
}

function isRailSolid(name: string): boolean {
  return name === "FL_SOCKET_RAIL_BEAM" || name.startsWith("FL_SOCKET_STOP_");
}

export function sweepMovingVsCarry(rig: MachineRig): SweepResult {
  const hits = new Map<string, SweepHit>();
  let samples = 0;
  for (let t = 0; t <= 1 + 1e-12; t += STEP) {
    const tt = Math.min(1, t);
    rig.applyFront(tt);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const carry = world.filter(
      (s) =>
        s.slice === "s2" &&
        s.role === "physical" &&
        !s.moving &&
        (s.family === "fwd-carry" ||
          s.family === "fwd-iface" ||
          s.family === "fwd-rail" ||
          s.family === "fl-nest-receiver" ||
          s.family === "fl-catch-throat"),
    );
    samples += 1;
    for (const m of moving) {
      for (const c of carry) {
        if (isShoe(m.name) && isRailSolid(c.name)) continue;
        if (obbOverlaps(m.obb, c.obb)) recordHit(hits, m.name, c.name, tt, obbSeparation(m.obb, c.obb));
      }
    }
  }
  return finish(hits, samples, "moving-front × FWD_CARRY");
}

export function sweepNamedVsPhysical(
  rig: MachineRig,
  names: string[],
  t0: number,
  t1: number,
  skip: (a: string, b: string) => boolean,
  label: string,
): SweepResult {
  const hits = new Map<string, SweepHit>();
  let samples = 0;
  for (let t = t0; t <= t1 + 1e-12; t += STEP) {
    const tt = Math.min(t1, t);
    rig.applyFront(tt);
    const world = rig.worldSolids();
    const movers = world.filter((s) => names.includes(s.name) && s.role === "physical");
    const others = world.filter((s) => s.role === "physical" && !names.includes(s.name));
    samples += 1;
    for (const m of movers) {
      for (const o of others) {
        if (skip(m.name, o.name)) continue;
        if (obbOverlaps(m.obb, o.obb)) recordHit(hits, m.name, o.name, tt, obbSeparation(m.obb, o.obb));
      }
    }
  }
  return finish(hits, samples, label);
}

export function sweepBookPinPath(rig: MachineRig): SweepResult {
  return sweepNamedVsPhysical(
    rig,
    ["FL_BOOK_PIN_BODY"],
    Math.max(0, FRONT_STAGE.bookPin[0] - 0.04),
    1,
    (a, b) => a === b,
    "book-pin full-machine path",
  );
}

export function sweepNestPinPath(rig: MachineRig): SweepResult {
  return sweepNamedVsPhysical(
    rig,
    ["FL_NEST_PIN_BODY"],
    Math.max(0, FRONT_STAGE.socket[0] - 0.02),
    1,
    (a, b) => a === b,
    "nest-pin full-machine path",
  );
}

export function sweepCatchPath(rig: MachineRig): SweepResult {
  return sweepNamedVsPhysical(
    rig,
    ["FL_CATCH_KEEPER"],
    0.7,
    1,
    (a, b) => a === b,
    "catch-keeper full-machine path",
  );
}

export function sweepFoldPath(rig: MachineRig): SweepResult {
  const hits = new Map<string, SweepHit>();
  let samples = 0;
  for (let t = FRONT_STAGE.bookFold[0]; t <= FRONT_STAGE.bookFold[1] + 1e-12; t += 0.005) {
    const tt = Math.min(FRONT_STAGE.bookFold[1], t);
    rig.applyFront(tt);
    const world = rig.worldSolids();
    const inner = world.filter((s) => s.family === "fl-vane-inner" && s.role === "physical");
    const outer = world.filter((s) => s.family === "fl-vane-outer" && s.role === "physical");
    samples += 1;
    for (const a of inner) {
      for (const b of outer) {
        if (!obbOverlaps(a.obb, b.obb)) continue;
        const sep = obbSeparation(a.obb, b.obb);
        if (sep >= -1e-4) continue;
        recordHit(hits, a.name, b.name, tt, sep);
      }
    }
  }
  return finish(hits, samples, "inner×outer fold");
}

export function sweepMovingVsProtected(rig: MachineRig): SweepResult {
  const hits = new Map<string, SweepHit>();
  let samples = 0;
  for (let t = 0; t <= 1 + 1e-12; t += STEP) {
    const tt = Math.min(1, t);
    rig.applyFront(tt);
    const world = rig.worldSolids();
    const moving = world.filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const prot = world.filter((s) => s.reservationKind === "protected-corridor");
    samples += 1;
    for (const m of moving) {
      for (const p of prot) {
        if (obbOverlaps(m.obb, p.obb)) recordHit(hits, m.name, p.name, tt, obbSeparation(m.obb, p.obb));
      }
    }
  }
  return finish(hits, samples, "moving-front × protected corridors");
}
