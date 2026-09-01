import { CANT_CANDIDATES_DEG, DESIGN_CLEARANCE, REAR_SEATED_HALF_WIDTH } from "../design/parameters";
import { obbOverlaps, obbSeparation, worldAabbUnion } from "../math/obb";
import type { CantCandidate, MachineRig } from "../machine/types";

export function studyCant(rig: MachineRig): CantCandidate[] {
  return CANT_CANDIDATES_DEG.map((deg) => measure(rig, deg));
}

function measure(rig: MachineRig, deg: number): CantCandidate {
  rig.applyFront(1, { cantDeg: deg });
  const world = rig.worldSolids();
  const book = world.filter((s) => s.slice === "s2" && s.book && s.role === "physical");
  const cockpit = world.filter((s) => s.family === "keep-cockpit");
  const seated = worldAabbUnion(book.map((s) => s.obb));
  const seatedHalfWidth = Math.max(Math.abs(seated.min.x), Math.abs(seated.max.x));

  let minFloor = seated.min.y;
  let minCockpit = Infinity;
  let inboardMaxX = seated.max.x;
  let cockpitHit = false;
  let floorHit = seated.min.y < DESIGN_CLEARANCE;

  for (let i = 0; i <= 20; i += 1) {
    const t = 0.52 + (0.48 * i) / 20;
    rig.applyFront(t, { cantDeg: deg });
    const boxes = rig.worldSolids().filter((s) => s.slice === "s2" && s.role === "physical" && s.moving);
    const aabb = worldAabbUnion(boxes.map((s) => s.obb));
    minFloor = Math.min(minFloor, aabb.min.y);
    inboardMaxX = Math.max(inboardMaxX, aabb.max.x);
    if (aabb.min.y < DESIGN_CLEARANCE) floorHit = true;
    for (const b of boxes) {
      for (const c of cockpit) {
        const sep = obbSeparation(b.obb, c.obb);
        minCockpit = Math.min(minCockpit, sep);
        if (obbOverlaps(b.obb, c.obb)) cockpitHit = true;
      }
    }
  }

  return {
    deg,
    seatedHalfWidth,
    seatedHeight: seated.max.y,
    seatedMinX: seated.min.x,
    seatedMaxX: seated.max.x,
    seatedMinY: seated.min.y,
    seatedMaxY: seated.max.y,
    minFloor,
    minCockpit,
    inboardMaxX,
    cockpitHit,
    floorHit,
    widthOk: seatedHalfWidth <= REAR_SEATED_HALF_WIDTH + 1e-6,
  };
}
