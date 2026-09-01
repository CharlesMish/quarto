import { HAUNCH_CANDIDATES_DEG, P } from "../design/parameters";
import { obbOverlaps, obbSeparation, worldAabbUnion } from "../math/obb";
import type { HaunchCandidate, MachineRig } from "../machine/types";

export function studyHaunch(rig: MachineRig): HaunchCandidate[] {
  return HAUNCH_CANDIDATES_DEG.map((angle) => measureCandidate(rig, angle));
}

function measureCandidate(rig: MachineRig, deg: number): HaunchCandidate {
  rig.apply(0.9, { haunchDeg: deg });
  const seatedBoxes = rig.worldSolids().filter((b) => b.slice !== "s2" && b.slice !== "s4");
  const book = seatedBoxes.filter((b) => b.book && b.role === "physical");
  const keel = seatedBoxes.filter((b) => b.family === "keel");
  const drive = seatedBoxes.filter((b) => b.family === "drive");
  const seated = worldAabbUnion(book.map((b) => b.obb));
  const seatedWidth = Math.max(Math.abs(seated.min.x), Math.abs(seated.max.x)) * 2;
  const seatedHeight = seated.max.y;

  let rollSweepWidth = 0;
  let minKeelClearance = Infinity;
  let minDriveClearance = Infinity;
  let keelHit = false;
  let driveHit = false;

  for (let i = 0; i <= 20; i += 1) {
    const t = 0.52 + (0.18 * i) / 20;
    rig.apply(t, { haunchDeg: deg });
    const boxes = rig.worldSolids().filter((x) => x.slice !== "s2" && x.slice !== "s4");
    const b = boxes.filter((x) => (x.family === "vane-inner" || x.family === "vane-outer") && x.role === "physical");
    const k = boxes.filter((x) => x.family === "keel");
    const d = boxes.filter((x) => x.name === "DRIVE_ENVELOPE");
    const aabb = worldAabbUnion(b.map((x) => x.obb));
    rollSweepWidth = Math.max(rollSweepWidth, aabb.max.x - aabb.min.x);
    for (const bb of b) {
      for (const kk of k) {
        const sep = obbSeparation(bb.obb, kk.obb);
        minKeelClearance = Math.min(minKeelClearance, sep);
        if (obbOverlaps(bb.obb, kk.obb)) keelHit = true;
      }
      for (const dd of d) {
        const sep = obbSeparation(bb.obb, dd.obb);
        minDriveClearance = Math.min(minDriveClearance, sep);
        if (obbOverlaps(bb.obb, dd.obb)) driveHit = true;
      }
    }
  }

  const inboardInChannel = seated.max.x > P.channel.xOut - 0.05 && seated.max.x < P.channel.xIn + 0.2;
  void keel;
  void drive;

  return {
    deg,
    seatedWidth,
    seatedHeight,
    seatedMaxX: seated.max.x,
    seatedMinX: seated.min.x,
    rollSweepWidth,
    minKeelClearance,
    minDriveClearance,
    inboardInChannel,
    keelHit,
    driveHit,
  };
}
