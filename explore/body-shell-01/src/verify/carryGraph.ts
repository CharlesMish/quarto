import { CARRY_INTERFACES } from "../design/parameters";
import { obbSeparation } from "../math/obb";
import type { CarryGraphAudit, CarryGraphNode, MachineRig } from "../machine/types";

const CONTACT = 0.002;
const KEEL_TARGETS = ["BULKHEAD_Z3p35", "BULKHEAD_Z1p15"];

export function auditCarryGraph(rig: MachineRig): CarryGraphAudit {
  const world = rig.worldSolids();
  const byName = new Map(world.map((s) => [s.name, s]));
  const adj = new Map<string, string[]>();
  const add = (a: string, b: string): void => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };

  const missing: string[] = [];
  const failed: string[] = [];
  for (const [aName, bName] of CARRY_INTERFACES) {
    const a = byName.get(aName);
    const b = byName.get(bName);
    if (!a || !b) {
      missing.push(`${aName}↔${bName}`);
      continue;
    }
    const sep = obbSeparation(a.obb, b.obb);
    if (sep > CONTACT) {
      failed.push(`${aName}↔${bName} sep=${sep.toFixed(4)}`);
      continue;
    }
    add(aName, bName);
  }

  const nodes: CarryGraphNode[] = [...adj.entries()].map(([name, contacts]) => ({ name, contacts }));

  const reaches = (start: string, goals: string[]): boolean => {
    const seen = new Set<string>();
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      if (goals.includes(cur)) return true;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const n of adj.get(cur) ?? []) queue.push(n);
    }
    return false;
  };

  const railReachesKeel = reaches("FL_SOCKET_RAIL_BEAM", KEEL_TARGETS);
  const receiverReachesKeel = reaches("FL_NEST_CHEEK_DN", KEEL_TARGETS);
  const catchReachesKeel = reaches("FL_CATCH_CHEEK_FWD", KEEL_TARGETS);
  const pass = missing.length === 0 && failed.length === 0 && railReachesKeel && receiverReachesKeel && catchReachesKeel;

  return {
    pass,
    nodes,
    railReachesKeel,
    receiverReachesKeel,
    catchReachesKeel,
    missing: [...missing, ...failed],
    detail: pass
      ? `declared interfaces contact (≤ ${CONTACT} m) connect rail/receiver/catch to ${KEEL_TARGETS.join(" & ")}`
      : `carry graph fail rail=${railReachesKeel} nest=${receiverReachesKeel} catch=${catchReachesKeel} missing=${missing.join(",")} failed=${failed.join(",")}`,
  };
}
