import { DESIGN_CLEARANCE, P } from "../../design/parameters";
import { FROZEN_S4A_E1, FROZEN_S4A_E2, FROZEN_S4A_E3, FROZEN_S4A_E4, S4A_SHA256 } from "../../design/s5Parameters";
import type { AuthoritySolid } from "../../machine/authority";
import { MACHINE_DRIVE_START } from "../../machine/machineMap";
import type { MachineRig } from "../../machine/types";
import { obbWorldAabb, worldAabbUnion, type OBB } from "../../math/obb";
import { evaluateDriveReadiness } from "../../verify/capturePredicates";
import { svgGe1Side, svgGe1Top } from "./svg";

export type EpistemicTag =
  | "FROZEN_FACT"
  | "GAMEPLAY_SEMANTIC"
  | "DERIVED_OBLIGATION"
  | "ARCHITECTURE_HYPOTHESIS"
  | "UNKNOWN";

export type ZoneKind = "MUST_REMAIN_CLEAR" | "AVAILABLE" | "INTERFACE_CANDIDATE" | "UNKNOWN";

const FLOOR_Y = 0;
const STRUCTURAL_READY_T = 0.84;
const HISTORICAL_DRIVE_WIDTH_SKETCH = "3.0–3.6 m (superseded; not a GE1 target)";

export interface AabbBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  width: number;
  height: number;
  length: number;
}

export interface Lowest {
  y: number;
  solid: string;
}

function boxOf(obbs: OBB[]): AabbBox | null {
  if (!obbs.length) return null;
  const u = worldAabbUnion(obbs);
  return {
    minX: u.min.x,
    maxX: u.max.x,
    minY: u.min.y,
    maxY: u.max.y,
    minZ: u.min.z,
    maxZ: u.max.z,
    width: u.max.x - u.min.x,
    height: u.max.y - u.min.y,
    length: u.max.z - u.min.z,
  };
}

function lowestOf(rows: Array<{ name: string; obb: OBB }>): Lowest | null {
  if (!rows.length) return null;
  let best = rows[0];
  let y = obbWorldAabb(best.obb).min.y;
  for (const row of rows) {
    const yy = obbWorldAabb(row.obb).min.y;
    if (yy < y) {
      y = yy;
      best = row;
    }
  }
  return { y, solid: best.name };
}

function isPhysical(s: AuthoritySolid): boolean {
  return s.role === "physical";
}

function isBookName(name: string): boolean {
  return /^(FL|FR|RL|RR)_/.test(name);
}

function poseExtract(rig: MachineRig, machineT: number, label: string) {
  rig.applyMachine(machineT);
  const world = rig.worldSolids().filter((s) => isPhysical(s));
  const whole = world.map((s) => ({ name: s.name, obb: s.obb, moving: s.moving, book: s.book }));
  const moving = whole.filter((s) => s.moving);
  const keel = whole.filter((s) => s.name === "VENTRAL_KEEL");
  const frontBooks = whole.filter((s) => s.name.startsWith("FL_") || s.name.startsWith("FR_"));
  const rearBooks = whole.filter((s) => s.name.startsWith("RL_") || s.name.startsWith("RR_"));
  const wholeBox = boxOf(whole.map((s) => s.obb))!;
  const movingBox = boxOf(moving.map((s) => s.obb));
  const keelBox = boxOf(keel.map((s) => s.obb));
  return {
    label,
    machineT,
    whole: { ...wholeBox, lowest: lowestOf(whole) },
    moving: movingBox ? { ...movingBox, lowest: lowestOf(moving) } : null,
    keelVentral: keelBox
      ? { yMin: keelBox.minY, yCenter: P.keel.ventralY, solid: keel[0]?.name ?? "VENTRAL_KEEL" }
      : null,
    frontBooks: { ...(boxOf(frontBooks.map((s) => s.obb)) ?? {}), lowest: lowestOf(frontBooks) },
    rearBooks: { ...(boxOf(rearBooks.map((s) => s.obb)) ?? {}), lowest: lowestOf(rearBooks) },
    floorClearanceWhole: wholeBox.minY - FLOOR_Y,
    floorClearanceMoving: (movingBox?.minY ?? NaN) - FLOOR_Y,
    floorClearanceKeel: (keelBox?.minY ?? NaN) - FLOOR_Y,
    floorClearanceFrontBooks: (lowestOf(frontBooks)?.y ?? NaN) - FLOOR_Y,
    floorClearanceRearBooks: (lowestOf(rearBooks)?.y ?? NaN) - FLOOR_Y,
  };
}

export function runGe1Study(rig: MachineRig): Record<string, unknown> {
  return rig.withPreservedPose(() => {
    const spread = poseExtract(rig, 0, "SPREAD");
    const structuralReady = poseExtract(rig, STRUCTURAL_READY_T, "STRUCTURAL_READY");
    const drive = poseExtract(rig, 1, "DRIVE");

    const inspectionT = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86, 1];
    let liveMinY = Infinity;
    let liveMinYT = 0;
    let liveMinYSolid = "";
    let liveMinYMoving = Infinity;
    let liveMinYMovingT = 0;
    let liveMinYMovingSolid = "";
    for (const t of inspectionT) {
      rig.applyMachine(t);
      const world = rig.worldSolids().filter((s) => isPhysical(s));
      for (const s of world) {
        const y = obbWorldAabb(s.obb).min.y;
        if (y < liveMinY) {
          liveMinY = y;
          liveMinYT = t;
          liveMinYSolid = s.name;
        }
        if (s.moving && y < liveMinYMoving) {
          liveMinYMoving = y;
          liveMinYMovingT = t;
          liveMinYMovingSolid = s.name;
        }
      }
    }

    const ready = evaluateDriveReadiness(rig);

    const volumeMap = [
      {
        id: "front-reserved-box",
        name: "front reserved box (KEEP_COCKPIT; historical name only)",
        source: "P.keep.cockpit",
        center: P.keep.cockpit,
        spread: "MUST_REMAIN_CLEAR",
        drive: "MUST_REMAIN_CLEAR",
        note: "Protected corridor. Not a cockpit architecture. BODY-SHELL-03.1 nose may occupy this visually; that is not authority.",
        tag: "FROZEN_FACT",
      },
      {
        id: "keel-core",
        name: "keel core",
        source: "P.keel + VENTRAL_KEEL / bulkheads / bay walls",
        spread: "contains",
        drive: "contains",
        note: "Fixed primary structure. Lowest whole-machine solid is the ventral keel AABB.",
        tag: "FROZEN_FACT",
      },
      {
        id: "dorsal-keep",
        name: "dorsal keep / service corridor",
        source: "P.keep.dorsal",
        spread: "MUST_REMAIN_CLEAR",
        drive: "MUST_REMAIN_CLEAR",
        note: "Protected dorsal corridor. BODY dorsal deck is presentation-only.",
        tag: "FROZEN_FACT",
      },
      {
        id: "bay-can",
        name: "bay + can corridor",
        source: "P.bay / P.drive / S5 can",
        spread: "contains (can stowed)",
        drive: "contains (can seated aft; still overlaps bay 0.275 m)",
        note: "Open stern/service throat remains inspectable. Not a closed transom.",
        tag: "FROZEN_FACT",
      },
      {
        id: "drive-waist",
        name: "DRIVE waist",
        source: "DRIVE_WAIST_PORT / DRIVE_WAIST_STBD",
        spread: "AVAILABLE (empty occupancy not yet active in the same way)",
        drive: "MUST_REMAIN_CLEAR (state-conditioned empty occupancy when structurally ready)",
        note: "Certified empty occupancy between seated laterals. BODY must not fill it.",
        tag: "FROZEN_FACT",
      },
      {
        id: "book-roots",
        name: "four book roots",
        source: "P.fl / P.rl hinge stations",
        spread: "contains (hinge clusters)",
        drive: "contains (hinge clusters; books nested outboard)",
        note: "BODY-SHELL-03.1 pockets are presentation sockets, not structural ownership.",
        tag: "FROZEN_FACT",
      },
      {
        id: "book-envelopes",
        name: "book SPREAD / DRIVE / swept envelopes",
        source: "live physical laterals + FROZEN_S4A_E1/E2",
        spread: "contains (outboard planform)",
        drive: "contains (flank hang)",
        note: "Swept moving minY is the fold-floor event, not a DRIVE ride height.",
        tag: "FROZEN_FACT",
      },
      {
        id: "ventral-band",
        name: "ventral band (keel-to-floor)",
        source: "VENTRAL_KEEL vs floor y=0",
        spread: "see ventral zoning",
        drive: "see ventral zoning",
        note: "Under-keel gap is millimetre-class against the study floor. Not a hover plenum.",
        tag: "FROZEN_FACT",
      },
      {
        id: "open-stern",
        name: "open stern / service throat",
        source: "S5 can mouth + aft posts",
        spread: "AVAILABLE / inspectable",
        drive: "contains seated can; MUST remain open for handover inspection",
        note: "BODY-SHELL-03.1 collar frames this; it does not cap it.",
        tag: "FROZEN_FACT",
      },
    ];

    const ventralZoning: Array<{
      id: string;
      region: string;
      kind: ZoneKind;
      tag: EpistemicTag;
      note: string;
    }> = [
      {
        id: "below-floor",
        region: "y < 0 (below Mechanical Truth floor datum)",
        kind: "MUST_REMAIN_CLEAR",
        tag: "FROZEN_FACT",
        note: "Lateral fold studies treat y=0 as the floor. Moving laterals are not permitted through it.",
      },
      {
        id: "under-keel",
        region: "under VENTRAL_KEEL AABB down to y=0",
        kind: "MUST_REMAIN_CLEAR",
        tag: "FROZEN_FACT",
        note: "The ventral keel already occupies this band. There is no empty hover gap under the keel.",
      },
      {
        id: "keel-flank-band",
        region: "outboard of keel half-width, y in (0, moving-fold minY)",
        kind: "UNKNOWN",
        tag: "UNKNOWN",
        note: "Empty at endpoints except where fold sweep occupies it. Not a granted gear bay. Future evidence: a contact architecture that does not intersect fold sweep or waist.",
      },
      {
        id: "fold-sweep-low",
        region: "rear/front outer fold-floor tracks",
        kind: "MUST_REMAIN_CLEAR",
        tag: "FROZEN_FACT",
        note: "Certified moving envelope includes mid-fold tips near the floor. Fixed interface hardware cannot sit in that sweep.",
      },
    ];

    const hypotheses = [
      {
        id: "hover-gap",
        title: "empty hover / clearance gap",
        status: "NOT SUPPORTED under the keel",
        tag: "ARCHITECTURE_HYPOTHESIS",
        reversible: true,
        assumption: "Would require a clear ventral plenum between keel and floor.",
        evidence: "VENTRAL_KEEL minY is millimetre-class above y=0. That is occupied structure, not a plenum.",
      },
      {
        id: "skid-reserve",
        title: "skid / contact reserve",
        status: "UNKNOWN",
        tag: "UNKNOWN",
        reversible: true,
        assumption: "Keel underside or added skids would be the contact hardware.",
        evidence: "Keel proximity to the study floor is a packaging fact, not a certified running surface. Godot hop does not specify skids.",
      },
      {
        id: "deployable-gear",
        title: "deployable gear reserve",
        status: "UNKNOWN",
        tag: "UNKNOWN",
        reversible: true,
        assumption: "Gear would stow outside fold sweep and waist, then reach y=0.",
        evidence: "No authority row is gear. Under-keel space is gone. Outboard band is constrained by fold sweep. Not selected.",
      },
      {
        id: "study-floor-only",
        title: "y=0 is a study/fold datum, not a contact plane",
        status: "provisional preferred (reversible)",
        tag: "ARCHITECTURE_HYPOTHESIS",
        reversible: true,
        assumption: "The director floor is the fold-clearance datum used in S1/S2. It does not, by itself, freeze a landing-gear architecture.",
        evidence: "directorInspection labels floor as ground reference. DESIGN_CLEARANCE was applied to laterals, not written as keel-skid spec.",
      },
    ];

    const nextSlice = {
      id: "MT1-US1",
      title: "utility spine zoning",
      reason:
        "GE1 supports that MT1 is ground-aware (existing floor-clearance authority + Godot ground-route/hop semantics) but does not select a ground-contact mechanism. Under-keel hover is not available. Contact/skid/gear remain UNKNOWN. Per GE1 decision logic, the next bounded slice is utility spine zoning of the already-occupied keel/bay/dorsal core — not wheels, not another shell, not operator volume.",
      notRecommended: ["BODY-SHELL-04", "S6", "finished wheels/skids/gear", "cockpit occupancy"],
    };

    const report = {
      studyId: "MT1-GE1",
      title: "Pose Envelopes & Environmental Plane Study",
      freezeId: "MT1-S5HR3R1",
      sourceS4aSha256: S4A_SHA256,
      participatesInAuthority: false,
      addsVehicleGeometry: false,
      bodyShell: {
        reference: "MT1-BODY-SHELL-03.1",
        role: "presentation review skin only",
        mayNot: [
          "create a keepout",
          "consume reserved volume",
          "establish structural ownership",
          "establish ground contact",
          "decide gear/skid placement",
        ],
      },
      historicalDriveWidthSketch: {
        text: HISTORICAL_DRIVE_WIDTH_SKETCH,
        usedAsTarget: false,
        tag: "FROZEN_FACT" as EpistemicTag,
        note: "S1 froze 70° haunch and recorded ~4.46 m mirrored DRIVE width as overshoot. GE1 uses certified envelopes, not the sketch.",
      },
      floor: {
        datumY: FLOOR_Y,
        tag: "FROZEN_FACT" as EpistemicTag,
        name: "Mechanical Truth floor / fold-clearance datum",
        finalContactPlane: false,
        designClearanceLaterals: DESIGN_CLEARANCE,
      },
      frozenEnvelopes: {
        tag: "FROZEN_FACT",
        e1MovingInstant: FROZEN_S4A_E1,
        e2MovingSwept: FROZEN_S4A_E2,
        e3WholeInstant: FROZEN_S4A_E3,
        e4WholeSwept: FROZEN_S4A_E4,
        s4aEndpointsRecorded: {
          spread: { width: 13.31999984741211, height: 2.894999884068966, length: 11.699999920725823 },
          structuralReady: { width: 4.599999942779541, height: 2.894999884068966, length: 11.699999920725823 },
          drive: { width: 4.599999942779541, height: 2.894999884068966, length: 11.699999920725823 },
          firstReadyMachineT: STRUCTURAL_READY_T,
          driveStartMachineT: MACHINE_DRIVE_START,
        },
      },
      livePoses: { spread, structuralReady, drive },
      sweptMinima: {
        tag: "FROZEN_FACT",
        frozenMovingE2: { minY: FROZEN_S4A_E2.minY, clearance: FROZEN_S4A_E2.minY - FLOOR_Y },
        frozenWholeE4: { minY: FROZEN_S4A_E4.minY, clearance: FROZEN_S4A_E4.minY - FLOOR_Y },
        liveInspection: {
          samples: inspectionT,
          whole: { minY: liveMinY, atT: liveMinYT, solid: liveMinYSolid, clearance: liveMinY - FLOOR_Y },
          moving: {
            minY: liveMinYMoving,
            atT: liveMinYMovingT,
            solid: liveMinYMovingSolid,
            clearance: liveMinYMoving - FLOOR_Y,
          },
        },
        note: "Certified swept minima are FROZEN_S4A_E2/E4. Live check uses the nine machine inspection poses, not a re-certifying dense authority sweep.",
      },
      volumeMap,
      ventralZoning,
      hypotheses,
      groundAware: {
        conclusion: true,
        tag: "DERIVED_OBLIGATION" as EpistemicTag,
        because: [
          "S1/S2 floor-clearance authority exists and laterals were raised/shortened to respect y=0",
          "Godot P1A R7 operates on a ground-network world and can hop",
        ],
        doesNotSelect: "ground-contact mechanism",
      },
      nextSlice,
      readinessNote: {
        driveStructuralReadyCached: ready.driveStructuralReady,
        tag: "FROZEN_FACT",
      },
      svg: {
        side: "",
        top: "",
      },
    };

    report.svg = {
      side: svgGe1Side(report),
      top: svgGe1Top(report),
    };

    void isBookName;
    return report;
  });
}
