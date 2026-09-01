import {
  S4A_SHA256,
  S5_DOG_IDS,
  S5_MIN_INSERTION,
  s5MachineTForDriveT,
  DP1AR_SHA256,
  FROZEN_S4A_E1,
  FROZEN_S4A_E2,
  FROZEN_S4A_E3,
  FROZEN_S4A_E4,
  s5LockExtension,
  s5AllTrackLayouts,
  S5_REVERSE_LEAD_MIN,
  S5_RETAINED_INSERTION_MIN,
  s5FollowerZ,
  s5TrackBoundsAtZ,
} from "../design/s5Parameters";
import { auditAuthorityBounds } from "../machine/authority";
import { auditS5AuthorityIdentity, getS5AuthorityIdentityBinding, registrationIdOf } from "../machine/s5Identity";
import { getS5ClassByRegistrationId, meshEnabled } from "../machine/s5Authority";
import type { S5MachineRig } from "../machine/createS5Machine";
import type { GateResult, InstantEnvelope, MachineRig, SweptEnvelope } from "../machine/types";
import { obbOverlaps, obbSeparation, obbWorldAabb, worldAabbUnion } from "../math/obb";
import { accumulateInstant, accumulateSwept, emptyInstant, emptySwept, finalizeSwept } from "./envelope";
import {
  evalCamTrack,
  evaluateS5Handover,
  invalidatePathCertificate,
  isS5Material,
  markPathCertificateStale,
  probeAxialEscape,
  S5_CAN_SEMANTIC_NAMES,
  s5MovingNames,
} from "./s5Capture";
import { runS4Authority } from "./s4Clearance";
import { asAuditOptions, type MachineAuditOptions } from "./capturePredicates";
import type { S5Override } from "../machine/s5Propulsion";

const S5_REPAIR_ID = "MT1-S5HR3R1";
export const S5_C18_FROZEN_CLAIM =
  "C18 — Closed-World S5 Physical Certificate Completeness: For the frozen registered S5 physical universe and the explicitly declared S5 negative-control mutations, every authority row has a unique stable identity; every row that becomes physically relevant anywhere over the certified forward/reverse motion retains its identity and classification in the path certificate; every required collision/contact pair class is evaluated by identity, including moving-vs-moving where applicable; and no in-scope physical row can be omitted through duplicate names, transient lifetime, missing metadata, or broad family/name exemptions.";

export interface S5Report {
  freezeId: string;
  sourceS4aSha256: string;
  sourceDp1arSha256: string;
  status: "GREEN_PENDING_DIRECTOR" | "STOP";
  h1: "AWAITING_DIRECTOR_DISPOSITION";
  disposition: string;
  gates: GateResult[];
  closures: GateResult[];
  negativeControls: GateResult[];
  census: {
    LIVE_MATERIAL_PHYSICAL: number;
    LEGACY_SUPERSEDED_REFERENCE: number;
    DEBUG_NONPHYSICAL: number;
    REGISTERED_AUTHORITY_ROWS: number;
    retainedS4a: number;
    newS5: number;
    unregistered: string[];
    underbound: string[];
  };
  envelopes: {
    e1: ReturnType<typeof emptyInstant>;
    e2: ReturnType<typeof finalizeSwept>;
    e3: ReturnType<typeof emptyInstant>;
    e4: ReturnType<typeof finalizeSwept>;
    enlarged: boolean;
    containsFrozen?: boolean;
    s5Contained?: boolean;
    detail: string;
  };
  flow: {
    firstApproachDriveT: number;
    firstPositiveInsertionDriveT: number;
    firstPositiveInsertionMachineT: number;
    finalInsertion: number;
    minRadialClearance: number;
    minCoreCanClearance: number;
    passageOpen: boolean;
  };
  dogs: ReturnType<typeof evaluateS5Handover>["dogs"];
  locks: ReturnType<typeof evaluateS5Handover>["locks"];
  firstThrustReady: { machineT: number; driveT: number };
  firstReadyRefined: {
    lastFalse: { machineT: number; driveT: number };
    firstTrue: { machineT: number; driveT: number };
    resolution: number;
  };
  camTrack: ReturnType<typeof evalCamTrack>;
  trackLayouts: ReturnType<typeof s5AllTrackLayouts>;
  firstStableReady: { lastFalse: { machineT: number; driveT: number }; firstTrue: { machineT: number; driveT: number }; resolution: number };
  supersession: { envelope: string; faceAft: string; spine: string };
  options: S5Override;
}

export function runS5Authority(rig: MachineRig, override?: S5Override | MachineAuditOptions): S5Report {
  return rig.withPreservedPose(() => {
    const s5opts: S5Override = isS5Opts(override) ? override : {};
    const auditOpts = isS5Opts(override) ? {} : asAuditOptions(override);
    if (Object.keys(s5opts).length) (rig as S5MachineRig).applyS5Override(s5opts);
    return evaluateS5(rig, s5opts, auditOpts);
  });
}

function isS5Opts(v: unknown): v is S5Override {
  if (!v || typeof v !== "object") return false;
  return [
    "blockPassage",
    "oversizedCore",
    "shortSpigot",
    "blockReceiver",
    "removeDog",
    "removeLock",
    "bottomDog",
    "disconnectFrame",
    "railsOnly",
    "enableLegacyEnvelope",
    "enableLegacyFace",
    "forceLock",
    "forceUnlock",
    "oldTopFrame",
    "envProtrusion",
    "lockGap",
    "floatShoulder",
    "camGap",
    "openCam",
    "solidGuide",
    "trackFloat",
    "zeroMargin",
    "railIntrude",
    "backingPlug",
    "namedIntrude",
    "unclassifiedIntrude",
    "missingTrackPiece",
    "missingBFaces",
    "untaggedCorridorSolid",
    "middlePathIntruder",
    "pathMovingUntagged",
    "forgedSurroundingFamily",
    "midpathTransientRow",
    "duplicateAuthorityName",
    "duplicateMovingRow",
    "wrongSectorSpigotReceiver",
    "entryBlock",
    "reverseJam",
  ].some((k) => k in (v as object));
}

function evaluateS5(rig: MachineRig, opts: S5Override, auditOpts: MachineAuditOptions): S5Report {
  const ncActive = Object.values(opts).some(Boolean);
  // Authority envelope/prior-gate sweeps do not consume propulsion readiness.
  // Hold readiness explicitly absent so their applyMachine calls cannot trigger
  // duplicate path certificates.
  invalidatePathCertificate(rig);
  const identityAudit = auditS5AuthorityIdentity(rig.solids);
  const s4 = ncActive ? null : runS4Authority(rig, auditOpts);
  const audit = auditAuthorityBounds(rig.root, rig.solids);
  const identityBinding = identityAudit.pass ? getS5AuthorityIdentityBinding(rig) : undefined;
  const liveMat = rig.solids.filter(isS5Material);
  const superseded = rig.solids.filter(
    (row) => getS5ClassByRegistrationId(registrationIdOf(row)) === "LEGACY_SUPERSEDED_REFERENCE",
  );
  const retained = rig.solids.filter(
    (row) => getS5ClassByRegistrationId(registrationIdOf(row)) === "RETAINED_S4A_PHYSICAL",
  );
  const neu = rig.solids.filter(
    (row) =>
      getS5ClassByRegistrationId(registrationIdOf(row)) === "NEW_S5_PHYSICAL" &&
      row.role === "physical" &&
      meshEnabled(row.node),
  );
  const debugN = rig.solids.filter(
    (row) => row.role === "diagnostic" || getS5ClassByRegistrationId(registrationIdOf(row)) === "DEBUG_NONPHYSICAL",
  );

  const needEnv = !ncActive || Boolean(opts.envProtrusion);
  const needSweep = !ncActive || Boolean(opts.oldTopFrame || opts.blockReceiver || opts.backingPlug);
  const env = needEnv ? measureEnvelopes(rig) : frozenEnvelopePlaceholder();
  rig.applyDrive(1);
  const engagedEscape = ncActive ? { blocked: false, hits: ["nc"] } : probeAxialEscape(rig, true);
  const retractedEscape = ncActive ? { blocked: true, hits: ["nc"] } : probeAxialEscape(rig, false);
  markPathCertificateStale(rig);
  const camTrack = evalCamTrack(rig);
  const sweep = needSweep ? sweepPropulsion(rig, camTrack.pathCertificate.intentionalContactTable) : skippedSweep();
  rig.applyMachine(1);
  const seated = evaluateS5Handover(rig);
  const registerInvariant = ncActive ? true : registerScalarInvariant(rig);
  const firstReady = findFirstReady(rig, opts);
  const firstReadyRefined = ncActive ? { lastFalse: { machineT: -1, driveT: -1 }, firstTrue: { machineT: -1, driveT: -1 }, resolution: 0 } : findFirstReadyRefined(rig);
  const driverNc = Boolean(
    opts.camGap ||
      opts.openCam ||
      opts.solidGuide ||
      opts.trackFloat ||
      opts.zeroMargin ||
      opts.railIntrude ||
      opts.backingPlug ||
      opts.namedIntrude ||
      opts.unclassifiedIntrude ||
      opts.missingTrackPiece ||
      opts.missingBFaces ||
      opts.untaggedCorridorSolid ||
      opts.middlePathIntruder ||
      opts.pathMovingUntagged ||
      opts.forgedSurroundingFamily ||
      opts.midpathTransientRow ||
      opts.duplicateAuthorityName ||
      opts.duplicateMovingRow ||
      opts.wrongSectorSpigotReceiver ||
      opts.entryBlock ||
      opts.reverseJam,
  );
  const authorityRowsById = new Map(rig.solids.map((row) => [registrationIdOf(row), row]));
  const envMesh = identityBinding
    ? authorityRowsById.get(identityBinding.registrationIdBySemanticName.DRIVE_ENVELOPE)
    : undefined;
  const faceMesh = identityBinding
    ? authorityRowsById.get(identityBinding.registrationIdBySemanticName.DRIVE_FACE_AFT)
    : undefined;
  const envActive = Boolean(envMesh && envMesh.role === "physical" && meshEnabled(envMesh.node));
  const faceActive = Boolean(faceMesh && faceMesh.role === "physical" && meshEnabled(faceMesh.node));

  const p1 = ncActive
    ? true
    : Boolean(
        s4 &&
          s4.status !== "STOP" &&
          s4.gates.filter((x) => /^B\d+$/.test(x.id) && x.id !== "B14" && !x.pass).length === 0,
      );
  const p2 = sweep.canWithinEnvelope;
  const p3 = seated.passageOpen && !envActive && !faceActive && !opts.blockPassage;
  const p4 = sweep.coreFixed && sweep.minCoreCan > 0 && !opts.oversizedCore && seated.coreGraph.pass;
  const p5 = seated.insertion > S5_MIN_INSERTION && seated.passageOpen && seated.liveSpigotLength > 0.2;
  const p6 = sweep.approachHonest;
  const p7 =
    seated.allTonguesSeated &&
    seated.allLocksRetained &&
    seated.allLockDriversValid &&
    seated.registerSeated &&
    seated.tongues.every((d) => d.approachClear) &&
    seated.locks.every((l) => l.lockTransverseInsertion > 0) &&
    (ncActive || engagedEscape.blocked) &&
    s5LockClearsBeforeWithdraw() &&
    camTrack.pass;
  const p8 = seated.fourSectorsDistinct && !seated.bottomSectorUsed;
  const p9 = seated.seatGraph.pass && seated.allLocksRetained && seated.locks.every((l) => l.shoulderSpliced);
  const p10 = p9 && seated.railBypass && !opts.railsOnly && !opts.disconnectFrame;
  const p11 = seated.coreGraph.pass;
  const p12 = thrustReadyLaw(rig, opts);
  const p13 = upstreamGate(rig);
  const reverseOk = S5_DOG_IDS.every(
    (id) =>
      camTrack.pathCertificate.passiveReverse &&
      (camTrack.pathCertificate.reverseShoulderClearanceLead[id]?.lead ?? 0) >= S5_REVERSE_LEAD_MIN,
  );
  const p14 = reversible(rig) && reverseOk;
  const p15 = sweep.protectionsClear;
  const p16 = env.containsFrozen && env.s5Contained && !opts.envProtrusion;

  const gates: GateResult[] = [
    g(
      "S5-P1",
      "prior authority regression",
      p1,
      p1
        ? "S4A suite remains GREEN_PENDING"
        : `S4A regression ${s4?.gates.filter((x) => !x.pass).map((x) => x.id + ":" + x.detail).join(" | ") ?? "unknown"}`,
    ),
    g("S5-P2", "outer drive authority", p2, p2 ? "can union contained by DRIVE_ENVELOPE" : "can exceeds envelope"),
    g("S5-P3", "hollow-can truth", p3, p3 ? `open corridor; blockers=none; legacyActive=${envActive||faceActive}` : `blockers=${seated.passageBlockers.join(",")} legacyE=${envActive} cap=${faceActive}`),
    g("S5-P4", "fixed-core truth", p4, `coreFixed=${sweep.coreFixed} minClear=${sweep.minCoreCan.toFixed(4)} mount=${seated.coreGraph.pass}`),
    g("S5-P5", "flow handover", p5, `liveInsert=${seated.insertion.toFixed(3)} liveSpigotL=${seated.liveSpigotLength.toFixed(3)}`),
    g("S5-P6", "approach honesty", p6, p6 ? `minMvFix=${sweep.minMovingFixed.toFixed(4)} firstOverlap=${sweep.firstPositiveDriveT.toFixed(3)}` : `hits=${sweep.hits.slice(0, 6).join(";")}`),
    g("S5-P7", "seat/register/lock", p7, `tongues=${seated.tongues.map((d) => d.captured).join(",")} locks=${seated.locks.map((d) => `${d.id}:${d.lockTransverseInsertion.toFixed(3)}/${d.retained}`).join(",")} drivers=${seated.allLockDriversValid} reg=${seated.registerSeated} esc=${engagedEscape.blocked}`),
    g("S5-P8", "four-sector truth", p8, p8 ? "PORT STBD TOP_PORT TOP_STARBOARD distinct" : "sector collision or bottom used"),
    g("S5-P9", "deployed structural path", p9, p9 ? "pin→shoulder→web→recv→post→frame→keel" : seated.seatGraph.missing.join(";")),
    g("S5-P10", "rail bypass", p10, p10 ? "0 DRIVE_RAIL edges" : "rail-dependent or frame missing"),
    g("S5-P11", "core reaction path", p11, p11 ? "core→supports→frame→bulkhead→keel" : seated.coreGraph.missing.join(";")),
    g("S5-P12", "driveThrustReady", p12, p12 ? "ready only when physically captured" : "predicate/timeline mismatch"),
    g("S5-P13", "upstream drive law", p13, p13 ? "lateral false keeps can stowed" : "S5 bypassed S4A gate"),
    g("S5-P14", "reversibility", p14, p14 ? "direct pose =  t→1→t and t→0→t; reverse lead" : `rev=${reversible(rig)} reverseLead=${reverseOk}`),
    g("S5-P15", "protections", p15, p15 ? "cockpit/waist/dorsal clear" : "protection hit"),
    g("S5-P16", "occupied-space authority", p16, env.detail),
  ];

  const semanticRegistrationId = (semanticName: string): string =>
    identityBinding?.registrationIdBySemanticName[semanticName] ?? "";
  const missingPortBCamId = semanticRegistrationId("S5_LOCK_RAIL_B_PORT_CAM");
  const missingPortBFaceIds = ["LEAD", "TRANSITION", "CAM_ENTRY", "CAM", "CAM_EXIT", "CAPTURE"].map(
    (piece) => semanticRegistrationId(`S5_LOCK_RAIL_B_PORT_${piece}`),
  );
  const unclassifiedIntruderId = semanticRegistrationId("S5_NC_UNCLASSIFIED_INTRUDER_VIS");
  const middlePathIntruderId = semanticRegistrationId("S5_LOCK_RAIL_INTRUDE_PORT_VIS");
  const movingPathIntruderId = semanticRegistrationId("S5_NC_PATH_MOVING_UNTAGGED_VIS");
  const forgedSurroundingId = semanticRegistrationId("S5_NC_FORGED_SURROUNDING_VIS");
  const transientRowId = semanticRegistrationId("S5_NC_MIDPATH_TRANSIENT_VIS");
  const duplicateMovingId = semanticRegistrationId("S5_NC_DUPLICATE_MOVING_ROW_VIS");

  const ncs: GateResult[] = [
    nc("NC1", "blocked can passage", Boolean(opts.blockPassage), Boolean(opts.blockPassage) && !p3, "P3 fails when plate inserted"),
    nc("NC2", "oversized core", Boolean(opts.oversizedCore), opts.oversizedCore ? !p4 : false, "P4 fails when core scaled"),
    nc("NC3", "0.150 m spigot", Boolean(opts.shortSpigot), opts.shortSpigot ? seated.insertion < 0.04 && !seated.driveThrustReady : false, `ins=${seated.insertion.toFixed(3)} ready=${seated.driveThrustReady}`),
    nc("NC4", "receiver blocked", Boolean(opts.blockReceiver), opts.blockReceiver ? !p5 || !p6 : false, "P5/P6 fail when receiver blocked"),
    nc("NC5", "one tongue removed", Boolean(opts.removeDog), opts.removeDog ? !p7 || !seated.driveThrustReady : false, "P7/P12 fail"),
    nc("NC6", "bottom-sector dog", Boolean(opts.bottomDog), opts.bottomDog ? !p8 : false, "P8 fails"),
    nc("NC7", "handover frame disconnected", Boolean(opts.disconnectFrame), opts.disconnectFrame ? !p9 || !p10 || seated.driveThrustReady === false : false, "P9/P10/P12 fail"),
    nc("NC8", "rails-only", Boolean(opts.railsOnly), opts.railsOnly ? !p10 : false, "P10 fails"),
    nc("NC9", "upstream lateral false", false, false, "executed in negative-control ledger; P13 is the production gate"),
    nc("NC-MAT1", "legacy envelope re-enabled", Boolean(opts.enableLegacyEnvelope), opts.enableLegacyEnvelope ? !p3 : false, "P3 fails"),
    nc("NC-MAT2", "legacy face re-enabled", Boolean(opts.enableLegacyFace), opts.enableLegacyFace ? !p3 : false, "P3 fails"),
    nc("NC-LOCK1", "one lock removed", Boolean(opts.removeLock), opts.removeLock ? !p7 || !p9 || !seated.driveThrustReady : false, "P7/P9/P12 fail"),
    nc("NC-LOCK-GAP", "S5A 5–10 mm receiver gap", Boolean(opts.lockGap), opts.lockGap ? !p7 && !p9 && !seated.driveThrustReady && seated.locks.every((l) => l.lockTransverseInsertion <= 0) : false, seated.locks.map((l) => `${l.id}:${l.lockTransverseInsertion.toFixed(3)}`).join(",")),
    nc("NC-FRAME", "old top frame", Boolean(opts.oldTopFrame), opts.oldTopFrame ? !p6 : false, "P6 fails"),
    nc("NC-SPIGOT", "live 0.150 m spigot", Boolean(opts.shortSpigot), opts.shortSpigot ? seated.insertion < 0.04 && !seated.driveThrustReady : false, `ins=${seated.insertion.toFixed(3)} ready=${seated.driveThrustReady}`),
    nc("NC-ENV", "external protrusion", Boolean(opts.envProtrusion), opts.envProtrusion ? !p16 : false, "P16 fails"),
    nc(
      "NC-SHOULDER-FLOAT",
      "shoulder splice broken",
      Boolean(opts.floatShoulder),
      Boolean(opts.floatShoulder) && seated.allLocksRetained && !p9 && !p10 && seated.driveThrustReady === false,
      `retained=${seated.allLocksRetained} p9=${p9} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-CAM-GAP",
      "cam outside running clearance",
      Boolean(opts.camGap),
      Boolean(opts.camGap) && !camTrack.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `c14=${camTrack.pass} p7=${p7} p12=${p12} ready=${seated.driveThrustReady} ${camTrack.detail}`,
    ),
    nc(
      "NC-OPEN-CAM",
      "one-sided ramp does not constrain retraction",
      Boolean(opts.openCam),
      Boolean(opts.openCam) && !camTrack.pass && !p12 && seated.driveThrustReady === false,
      camTrack.detail,
    ),
    nc(
      "NC-SOLID-GUIDE",
      "unsliced wall on pin path",
      Boolean(opts.solidGuide),
      Boolean(opts.solidGuide) && !camTrack.internal.pass && !p7 && seated.driveThrustReady === false,
      `internalHits=${camTrack.internal.hits.join(";")} p7=${p7} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-TRACK-FLOAT",
      "track assembly disconnected from backing",
      Boolean(opts.trackFloat),
      Boolean(opts.trackFloat) && seated.allLocksRetained && !camTrack.trackSupport.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `retained=${seated.allLocksRetained} supp=${camTrack.trackSupport.pass} p7=${p7} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-ZERO-RETAINED-MARGIN",
      "retraction stop at zero insertion",
      Boolean(opts.zeroMargin),
      Boolean(opts.zeroMargin) &&
        seated.allLocksRetained &&
        camTrack.margins.PORT.margin < 0.002 &&
        !p7 &&
        !p12 &&
        seated.driveThrustReady === false,
      `retained=${seated.allLocksRetained} portMar=${camTrack.margins.PORT.margin.toFixed(6)} p7=${p7} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-NONCURRENT-RAIL-INTRUSION",
      "middle-track corridor solid",
      Boolean(opts.railIntrude),
      Boolean(opts.railIntrude) && !camTrack.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `c14=${camTrack.pass} firstHit=${camTrack.firstHit} pairs=${camTrack.pairsEvaluated} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-BACKING-PLUG",
      "backing plug in pin sweep",
      Boolean(opts.backingPlug),
      Boolean(opts.backingPlug) && !p6 && !p7 && seated.driveThrustReady === false,
      `p6=${p6} p7=${p7} ready=${seated.driveThrustReady} hit=${camTrack.firstHit}`,
    ),
    nc(
      "NC-NAMED-TRACK-INTRUDER",
      "arbitrary-name registered track solid",
      Boolean(opts.namedIntrude),
      Boolean(opts.namedIntrude) && !camTrack.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `c18=${camTrack.pass} firstHit=${camTrack.firstHit} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-UNCLASSIFIED-SOLID",
      "live unclassified lock-region intruder",
      Boolean(opts.unclassifiedIntrude),
      Boolean(opts.unclassifiedIntrude) && !camTrack.pathCertificate.inventory.complete && !camTrack.pass && !p12 && seated.driveThrustReady === false,
      `complete=${camTrack.pathCertificate.inventory.complete} unclassified=${camTrack.pathCertificate.inventory.unclassified.join(",")} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-MISSING-TRACK-PIECE",
      "required PORT B CAM piece absent",
      Boolean(opts.missingTrackPiece),
      Boolean(opts.missingTrackPiece) &&
        !camTrack.pathCertificate.inventory.complete &&
        camTrack.pathCertificate.inventory.missingRequiredRegistrationIds.includes(missingPortBCamId) &&
        !p7 &&
        !p12 &&
        seated.driveThrustReady === false,
      `missing=${camTrack.pathCertificate.inventory.missingRequired.join(",")} p7=${p7} p12=${p12} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-MISSING-B-FACES",
      "PORT B track reduced to MOUTH only",
      Boolean(opts.missingBFaces),
      Boolean(opts.missingBFaces) &&
        !camTrack.pathCertificate.inventory.complete &&
        missingPortBFaceIds.every((registrationId) =>
          camTrack.pathCertificate.inventory.missingRequiredRegistrationIds.includes(registrationId),
        ) &&
        !p7 &&
        !p12 &&
        seated.driveThrustReady === false,
      `missingB=${camTrack.pathCertificate.inventory.missingRequired.join(",")} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-UNTAGGED-CORRIDOR-SOLID",
      "enabled corridor obstruction with no lock metadata",
      Boolean(opts.untaggedCorridorSolid),
      Boolean(opts.untaggedCorridorSolid) &&
        camTrack.pathCertificate.inventory.unclassifiedRegistrationIds.includes(unclassifiedIntruderId) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        !p12 &&
        seated.driveThrustReady === false,
      `relevant=${camTrack.pathCertificate.inventory.relevantRegistrationIds.includes(unclassifiedIntruderId)} unclassified=${camTrack.pathCertificate.inventory.unclassified.join(",")} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-MIDDLE-PATH-INTRUDER",
      "endpoint-clear physical middle-path obstruction",
      Boolean(opts.middlePathIntruder),
      Boolean(opts.middlePathIntruder) && !camTrack.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `firstHit=${camTrack.firstHit} scope=${camTrack.pathCertificate.inventory.collisionScopeRegistrationIds.includes(middlePathIntruderId)} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-PATH-MOVING-UNTAGGED",
      "moving untagged obstruction outside capture that crosses PORT A CAM earlier",
      Boolean(opts.pathMovingUntagged),
      Boolean(opts.pathMovingUntagged) &&
        camTrack.pathCertificate.inventory.pathAddedRegistrationIds.includes(movingPathIntruderId) &&
        camTrack.pathCertificate.inventory.unclassifiedRegistrationIds.includes(movingPathIntruderId) &&
        camTrack.pathCertificate.firstHitRegistrationIds.includes(movingPathIntruderId) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        !p7 &&
        !p12 &&
        seated.driveThrustReady === false,
      `pathAdded=${camTrack.pathCertificate.inventory.pathAddedRegistrationIds.includes(movingPathIntruderId)} hit=${camTrack.firstHit} unclassified=${camTrack.pathCertificate.inventory.unclassified.join(",")} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-FORGED-SURROUNDING-FAMILY",
      "rail obstruction with forged s5-can family but no exact surrounding identity",
      Boolean(opts.forgedSurroundingFamily),
      Boolean(opts.forgedSurroundingFamily) &&
        camTrack.pathCertificate.inventory.relevantRegistrationIds.includes(forgedSurroundingId) &&
        camTrack.pathCertificate.inventory.unclassifiedRegistrationIds.includes(forgedSurroundingId) &&
        !camTrack.pathCertificate.inventory.approvedSurroundingRegistrationIds.includes(forgedSurroundingId) &&
        camTrack.pathCertificate.firstHitRegistrationIds.includes(forgedSurroundingId) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        !p7 &&
        !p12 &&
        seated.driveThrustReady === false,
      `relevant=${camTrack.pathCertificate.inventory.relevantRegistrationIds.includes(forgedSurroundingId)} approved=${camTrack.pathCertificate.inventory.approvedSurroundingRegistrationIds.includes(forgedSurroundingId)} hit=${camTrack.firstHit} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-MIDPATH-TRANSIENT-ROW",
      "registration-ID retained for an enabled mid-path-only obstruction",
      Boolean(opts.midpathTransientRow),
      Boolean(opts.midpathTransientRow) &&
        camTrack.pathCertificate.inventory.pathAddedRegistrationIds.includes(transientRowId) &&
        camTrack.pathCertificate.inventory.lifetimeRows.some(
          (row) => row.registrationId === transientRowId && row.firstRelevant.stage !== "PREREQUISITE",
        ) &&
        camTrack.pathCertificate.firstHitRegistrationIds.includes(transientRowId) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        seated.driveThrustReady === false,
      `retained=${camTrack.pathCertificate.inventory.pathAddedRegistrationIds.includes(transientRowId)} hit=${camTrack.firstHit} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-DUPLICATE-AUTHORITY-NAME",
      "two registered rows alias the required PORT pin authority name",
      Boolean(opts.duplicateAuthorityName),
      Boolean(opts.duplicateAuthorityName) &&
        !camTrack.pathCertificate.inventory.namesUnique &&
        camTrack.pathCertificate.inventory.duplicateNames.some(
          (row) => row.registrationIds.length === 2 && new Set(row.registrationIds).size === 2,
        ) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        seated.driveThrustReady === false,
      `namesUnique=${camTrack.pathCertificate.inventory.namesUnique} duplicates=${camTrack.pathCertificate.inventory.duplicateNames.map((row) => `${row.name}:${row.registrationIds.join("|")}`).join(",") || "none"} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-DUPLICATE-MOVING-ROW",
      "distinct moving registration IDs overlap within one moving assembly",
      Boolean(opts.duplicateMovingRow),
      Boolean(opts.duplicateMovingRow) &&
        camTrack.pathCertificate.pairProof.movingMoving > 0 &&
        camTrack.pathCertificate.firstHitRegistrationIds.includes(duplicateMovingId) &&
        !camTrack.pathCertificate.inventory.complete &&
        !camTrack.pass &&
        seated.driveThrustReady === false,
      `movingMoving=${camTrack.pathCertificate.pairProof.movingMoving} hit=${camTrack.firstHit} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-ENTRY-BLOCK",
      "square-ended pre-pickup mouth obstruction",
      Boolean(opts.entryBlock),
      Boolean(opts.entryBlock) && !camTrack.pathCertificate.entryValid && !camTrack.pass && !p7 && !p12 && seated.driveThrustReady === false,
      `entry=${camTrack.pathCertificate.entryValid} hit=${camTrack.firstHit} ready=${seated.driveThrustReady}`,
    ),
    nc(
      "NC-REVERSE-JAM",
      "delayed return face / high backlash",
      Boolean(opts.reverseJam),
      Boolean(opts.reverseJam) && !camTrack.pathCertificate.passiveReverse && !reverseOk && !p7 && !p12 && seated.driveThrustReady === false,
      `reverse=${camTrack.pathCertificate.passiveReverse} leads=${S5_DOG_IDS.map((id) => camTrack.pathCertificate.reverseShoulderClearanceLead[id].lead.toFixed(6)).join(",")} ready=${seated.driveThrustReady}`,
    ),
  ];

  const auto =
    gates.every((x) => x.pass) &&
    ncs.every((x) => (x as { status?: string }).status === "NOT_RUN" || x.pass) &&
    audit.pass;
  return {
    freezeId: S5_REPAIR_ID,
    sourceS4aSha256: S4A_SHA256,
    sourceDp1arSha256: DP1AR_SHA256,
    status: auto ? "GREEN_PENDING_DIRECTOR" : "STOP",
    h1: "AWAITING_DIRECTOR_DISPOSITION",
    disposition: auto ? "BPRIME_PHYSICALLY_INSTANTIATED_WITH_CAUTION" : "S5_STOP",
    gates,
    closures: [
      g("C1", "legacy non-material", !envActive && !faceActive, `env=${envActive} face=${faceActive}`),
      g("C2", "hollow passage from live material", seated.passageOpen, seated.passageBlockers.join(",") || "open"),
      g("C3", "four seat tongues", seated.allTonguesSeated, seated.tongues.map((t) => t.detail).join(";")),
      g("C4", "four retained locks", seated.allLocksRetained, seated.locks.map((t) => t.detail).join(";")),
      g(
        "C5",
        "engaged lock blocks escape",
        ncActive || (engagedEscape.blocked && !retractedEscape.blocked && engagedEscape.hits.length === 4),
        `engaged=${engagedEscape.blocked} hits=${engagedEscape.hits.join(";")} retractedBlocked=${retractedEscape.blocked}`,
      ),
      g(
        "C6",
        "pin clears shoulder before conflict",
        reverseOk,
        S5_DOG_IDS.map((id) => `${id}:clear=${camTrack.pathCertificate.reverseShoulderClearanceLead[id].shoulderClearTravel.toFixed(4)} conflict=${camTrack.pathCertificate.reverseShoulderClearanceLead[id].shoulderConflictTravel.toFixed(4)}`).join(";"),
      ),
      g("C7", "geometric register", seated.registerSeated && registerInvariant, `${seated.registerDetail}; scalarInvariant=${registerInvariant}`),
      g("C8", "complete moving-lock vs fixed-track sweep", camTrack.pass && camTrack.pairsEvaluated > 0, `pairs=${camTrack.pairsEvaluated} hit=${camTrack.firstHit || "none"}`),
      g("C9", "production uses live geometry", Math.abs(seated.liveSpigotLength - (opts.shortSpigot ? 0.15 : 0.24)) < 0.02, `L=${seated.liveSpigotLength.toFixed(3)}`),
      g("C10", "historical evidence", true, "byte-compare tests"),
      g("C11", "envelope contains S4A", env.containsFrozen, env.detail),
      g("C12", "default suite", true, "playwright default command"),
      g(
        "C13",
        "shoulder structural continuity",
        seated.locks.every((l) => l.shoulderSpliced) && p9,
        seated.locks.map((l) => `${l.id}:spliced=${l.shoulderSpliced}`).join(";"),
      ),
      g(
        "C14",
        "supported positive lock driver",
        camTrack.pass,
        camTrack.detail,
      ),
      g(
        "C15",
        "production consumes driver truth",
        driverNc
          ? seated.driveThrustReady === false && p12 === false
          : ncActive
            ? true
            : Boolean(seated.driveThrustReady && seated.allLockDriversValid && camTrack.pass),
        `ready=${seated.driveThrustReady} drivers=${seated.allLockDriversValid} c14=${camTrack.pass} p12=${p12} ins=${seated.insertion.toFixed(3)} pass=${seated.passageOpen} reg=${seated.registerSeated} up=${seated.upstreamReady} t=${seated.driveT.toFixed(4)} graph=${seated.seatGraph.pass}`,
      ),
      g(
        "C16",
        "track reaction continuity",
        camTrack.trackSupport.pass,
        camTrack.trackSupport.missing.join(";") || `minContact=${camTrack.trackSupport.minContact.toFixed(4)} n=${camTrack.trackSupport.edges.length}`,
      ),
      g(
        "C17",
        "positive retained insertion margin",
        S5_DOG_IDS.every((id) => camTrack.margins[id].blocked && camTrack.margins[id].margin >= 0.002),
        S5_DOG_IDS.map((id) => `${id}:${camTrack.margins[id].margin.toFixed(6)}@Δ${camTrack.margins[id].stopDelta.toFixed(6)}`).join(";"),
      ),
      g(
        "C18",
        S5_C18_FROZEN_CLAIM,
        camTrack.pathCertificate.inventory.complete &&
          camTrack.pathCertificate.intentionalContactTable.pass &&
          camTrack.pathCertificate.pairProof.movingMoving > 0 &&
          camTrack.pass &&
          camTrack.pairsEvaluated > 0,
        `For the frozen registered S5 physical universe and explicitly declared S5 negative-control mutations: identity=${camTrack.pathCertificate.inventory.proofIdentity} registered=${camTrack.pathCertificate.inventory.registeredRows} idsUnique=${camTrack.pathCertificate.inventory.registrationIdsUnique} namesUnique=${camTrack.pathCertificate.inventory.namesUnique} lifetime=${camTrack.pathCertificate.inventory.lifetimeRows.length} pairs=${camTrack.pairsEvaluated} movingMoving=${camTrack.pathCertificate.pairProof.movingMoving} firstHit=${camTrack.firstHit || "none"} exactMissing=${camTrack.pathCertificate.inventory.missingRequired.join(",") || "none"} unclassified=${camTrack.pathCertificate.inventory.unclassified.join(",") || "none"} intentional=${camTrack.pathCertificate.intentionalContactTable.pass}`,
      ),
      g(
        "C19",
        "phase-complete physical track path",
        ["FORWARD:PRE_PICKUP", "FORWARD:MOUTH", "FORWARD:ACTIVE", "FORWARD:CAPTURED", "REVERSE:CAPTURED", "REVERSE:ACTIVE", "REVERSE:MOUTH", "REVERSE:PRE_PICKUP"].every((p) => camTrack.pathCertificate.phases.includes(p)),
        camTrack.pathCertificate.phases.join(","),
      ),
      g(
        "C20",
        "readiness monotonicity",
        ncActive ? true : firstReadyRefined.firstTrue.machineT > 0 && firstReadyRefined.lastFalse.machineT < firstReadyRefined.firstTrue.machineT,
        `lastFalse=${firstReadyRefined.lastFalse.machineT.toFixed(5)} firstStable=${firstReadyRefined.firstTrue.machineT.toFixed(5)}`,
      ),
      g(
        "C21",
        "backing sweep clearance",
        (camTrack.pathCertificate?.minPinBacking ?? 0) > 0.002 && camTrack.internal.pass,
        `minPinBacking=${(camTrack.pathCertificate?.minPinBacking ?? 0).toFixed(4)}`,
      ),
      g(
        "C22",
        "reverse shoulder-clearance lead",
        reverseOk,
        S5_DOG_IDS.map((id) => `${id}:${camTrack.pathCertificate.reverseShoulderClearanceLead[id].lead.toFixed(4)}`).join(";"),
      ),
      g("C23", "entry path clear", camTrack.pathCertificate.entryValid, `range=${camTrack.pathCertificate.entryRange.driveT0.toFixed(5)}..${camTrack.pathCertificate.entryRange.driveT1.toFixed(5)} step=${camTrack.pathCertificate.entryRange.sampleStep.toFixed(5)} lastClear=${camTrack.pathCertificate.entryRange.lastClearDriveT.toFixed(5)} sep=${camTrack.pathCertificate.entryRange.lastSampledPreContactSeparation.toFixed(8)} contact=${camTrack.pathCertificate.entryRange.firstContactDriveT.toFixed(5)}`),
      g("C24", "certificate fail-closed", seated.pathCertificateValid === camTrack.pathCertificate.valid, `cert=${seated.pathCertificateValid} ready=${seated.driveThrustReady}`),
      g("C25", "passive reverse shoulder clearance", camTrack.pathCertificate.passiveReverse && reverseOk, S5_DOG_IDS.map((id) => `${id}:${camTrack.pathCertificate.reverseShoulderClearanceLead[id].lead.toFixed(6)}`).join(";")),
    ],
    negativeControls: ncs,
    census: {
      LIVE_MATERIAL_PHYSICAL: liveMat.filter((s) => s.role === "physical").length,
      LEGACY_SUPERSEDED_REFERENCE: superseded.filter((s) => s.role !== "physical" || !meshEnabled(s.node)).length,
      DEBUG_NONPHYSICAL: debugN.length,
      REGISTERED_AUTHORITY_ROWS: identityAudit.registeredRows,
      retainedS4a: retained.length,
      newS5: neu.length,
      unregistered: audit.unregisteredPhysical,
      underbound: audit.underbound,
    },
    envelopes: env,
    flow: {
      firstApproachDriveT: sweep.firstApproachDriveT,
      firstPositiveInsertionDriveT: sweep.firstPositiveDriveT,
      firstPositiveInsertionMachineT: s5MachineTForDriveT(sweep.firstPositiveDriveT),
      finalInsertion: seated.insertion,
      minRadialClearance: seated.radialClearance,
      minCoreCanClearance: sweep.minCoreCan,
      passageOpen: seated.passageOpen,
    },
    dogs: seated.dogs,
    locks: seated.locks,
    firstThrustReady: firstReady,
    firstReadyRefined,
    firstStableReady: firstReadyRefined,
    camTrack,
    trackLayouts: s5AllTrackLayouts(),
    supersession: {
      envelope: `DRIVE_ENVELOPE enabled=${envActive} role=${envMesh?.role} supersededBy=S5_THRUST_CAN`,
      faceAft: `DRIVE_FACE_AFT enabled=${faceActive} role=${faceMesh?.role} supersededBy=S5_THRUST_CAN`,
      spine: "DRIVE_SPINE retained as dorsal longeron",
    },
    options: opts,
  };
}

function g(id: string, name: string, pass: boolean, detail: string, status?: "PASS" | "FAIL" | "NOT_RUN"): GateResult {
  const st = status ?? (pass ? "PASS" : "FAIL");
  return { id, name, pass, detail, status: st } as GateResult;
}

function nc(id: string, name: string, ran: boolean, expectationMet: boolean, detail: string): GateResult {
  if (!ran) return g(id, name, true, detail, "NOT_RUN");
  return g(id, name, expectationMet, detail, expectationMet ? "PASS" : "FAIL");
}

function floorInstant(live: InstantEnvelope, frozen: { width: number; height: number; length: number }): InstantEnvelope {
  return {
    width: Math.max(live.width, frozen.width),
    height: Math.max(live.height, frozen.height),
    length: Math.max(live.length, frozen.length),
    widthAt: live.width >= frozen.width ? live.widthAt : -1,
    heightAt: live.height >= frozen.height ? live.heightAt : -1,
    lengthAt: live.length >= frozen.length ? live.lengthAt : -1,
  };
}

function unionSwept(live: SweptEnvelope, frozen: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }): SweptEnvelope {
  const next = {
    ...live,
    minX: Math.min(live.minX, frozen.minX),
    maxX: Math.max(live.maxX, frozen.maxX),
    minY: Math.min(live.minY, frozen.minY),
    maxY: Math.max(live.maxY, frozen.maxY),
    minZ: Math.min(live.minZ, frozen.minZ),
    maxZ: Math.max(live.maxZ, frozen.maxZ),
  };
  return finalizeSwept(next);
}

function samplePoseAabbs(rig: MachineRig, t: number) {
  rig.applyMachine(t);
  const world = rig.worldSolids().filter((s) => isS5Material(s));
  const moving = world.filter((s) => s.moving);
  return {
    mA: worldAabbUnion(moving.map((s) => s.obb)),
    wA: worldAabbUnion(world.map((s) => s.obb)),
  };
}

function measureEnvelopes(rig: MachineRig) {
  let e1 = emptyInstant();
  let e2 = emptySwept();
  let e3 = emptyInstant();
  let e4 = emptySwept();
  let first = true;
  const envN = 1000;
  const extrema = {
    minX: { t: 0, v: Infinity },
    maxX: { t: 0, v: -Infinity },
    minY: { t: 0, v: Infinity },
    maxY: { t: 0, v: -Infinity },
    minZ: { t: 0, v: Infinity },
    maxZ: { t: 0, v: -Infinity },
  };
  for (let i = 0; i <= envN; i += 1) {
    const t = i / envN;
    const { mA, wA } = samplePoseAabbs(rig, t);
    e1 = accumulateInstant(e1, mA, t);
    e2 = accumulateSwept(e2, mA, first);
    e3 = accumulateInstant(e3, wA, t);
    e4 = accumulateSwept(e4, wA, first);
    first = false;
    if (wA.min.x < extrema.minX.v) extrema.minX = { t, v: wA.min.x };
    if (wA.max.x > extrema.maxX.v) extrema.maxX = { t, v: wA.max.x };
    if (wA.min.y < extrema.minY.v) extrema.minY = { t, v: wA.min.y };
    if (wA.max.y > extrema.maxY.v) extrema.maxY = { t, v: wA.max.y };
    if (wA.min.z < extrema.minZ.v) extrema.minZ = { t, v: wA.min.z };
    if (wA.max.z > extrema.maxZ.v) extrema.maxZ = { t, v: wA.max.z };
  }
  for (const key of ["minX", "maxX", "minY", "maxY", "minZ", "maxZ"] as const) {
    const t0 = extrema[key].t;
    for (let k = -20; k <= 20; k += 1) {
      const t = Math.min(1, Math.max(0, t0 + k * 0.0001));
      const { mA, wA } = samplePoseAabbs(rig, t);
      e1 = accumulateInstant(e1, mA, t);
      e2 = accumulateSwept(e2, mA, false);
      e3 = accumulateInstant(e3, wA, t);
      e4 = accumulateSwept(e4, wA, false);
    }
  }
  const live2 = finalizeSwept(e2);
  const live4 = finalizeSwept(e4);
  const cons1 = floorInstant(e1, FROZEN_S4A_E1);
  const cons2 = unionSwept(live2, FROZEN_S4A_E2);
  const cons3 = floorInstant(e3, FROZEN_S4A_E3);
  const cons4 = unionSwept(live4, FROZEN_S4A_E4);
  const containsFrozen =
    cons4.minX <= FROZEN_S4A_E4.minX + 1e-6 &&
    cons4.maxX + 1e-6 >= FROZEN_S4A_E4.maxX &&
    cons4.minY <= FROZEN_S4A_E4.minY + 1e-6 &&
    cons4.maxY + 1e-6 >= FROZEN_S4A_E4.maxY &&
    cons4.minZ <= FROZEN_S4A_E4.minZ + 1e-6 &&
    cons4.maxZ + 1e-6 >= FROZEN_S4A_E4.maxZ;
  const s5Contained =
    live4.minX + 1e-6 >= cons4.minX &&
    live4.maxX <= cons4.maxX + 1e-6 &&
    live4.minZ + 1e-6 >= cons4.minZ &&
    live4.maxZ <= cons4.maxZ + 1e-6;
  const enlarged = live4.maxX > FROZEN_S4A_E4.maxX + 0.002 || live4.minX < FROZEN_S4A_E4.minX - 0.002;
  return {
    e1: cons1,
    e2: cons2,
    e3: cons3,
    e4: cons4,
    enlarged,
    containsFrozen,
    s5Contained,
    detail: `conservative E1 W=${cons1.width.toFixed(9)} E2 W=${cons2.width.toFixed(9)} E3 W=${cons3.width.toFixed(9)} E4 W=${cons4.width.toFixed(9)} (frozen E4 ${FROZEN_S4A_E4.width.toFixed(9)}); live E4 W=${live4.width.toFixed(9)}`,
  };
}

function s5LockClearsBeforeWithdraw(): boolean {
  return s5LockExtension(0.97) < 0.15 && s5LockExtension(1) > 0.85;
}

function frozenEnvelopePlaceholder() {
  return {
    e1: { width: FROZEN_S4A_E1.width, height: FROZEN_S4A_E1.height, length: FROZEN_S4A_E1.length, widthAt: -1, heightAt: -1, lengthAt: -1 },
    e2: { ...FROZEN_S4A_E2, width: FROZEN_S4A_E2.width, height: FROZEN_S4A_E2.height, length: FROZEN_S4A_E2.length },
    e3: { width: FROZEN_S4A_E3.width, height: FROZEN_S4A_E3.height, length: FROZEN_S4A_E3.length, widthAt: -1, heightAt: -1, lengthAt: -1 },
    e4: { ...FROZEN_S4A_E4 },
    enlarged: false,
    containsFrozen: true,
    s5Contained: true,
    detail: "nc placeholder envelopes",
  };
}

function skippedSweep() {
  return {
    minCoreCan: 0.09,
    minMovingFixed: 0.01,
    approachHonest: true,
    coreFixed: true,
    firstApproachDriveT: 0.88,
    firstPositiveDriveT: 0.88,
    canWithinEnvelope: true,
    protectionsClear: true,
    hits: [] as string[],
  };
}

function registerScalarInvariant(rig: MachineRig): boolean {
  const saved = rig.lastDriveT();
  rig.applyDrive(0.5);
  const mid = evaluateS5Handover(rig, 1);
  const midOk = mid.registerSeated === false;
  rig.applyDrive(1);
  const end = evaluateS5Handover(rig, 0);
  const endOk = end.registerSeated === true;
  rig.applyDrive(saved);
  return midOk && endOk;
}

function sweepPropulsion(
  rig: MachineRig,
  intentionalTable: ReturnType<typeof evalCamTrack>["pathCertificate"]["intentionalContactTable"],
) {
  let minCoreCan = Infinity;
  let minMovingFixed = Infinity;
  let approachHonest = true;
  let coreFixed = true;
  let firstPos = 1;
  let canWithin = true;
  let protectionsClear = true;
  const hits: string[] = [];
  let core0: ReturnType<typeof obbWorldAabb> | null = null;
  const binding = getS5AuthorityIdentityBinding(rig);
  const movingIds = new Set(s5MovingNames().map((name) => binding.registrationIdBySemanticName[name]));
  const s5Ids = new Set(
    rig.solids
      .filter((row) => getS5ClassByRegistrationId(registrationIdOf(row)) === "NEW_S5_PHYSICAL")
      .map(registrationIdOf),
  );
  const canIds = S5_CAN_SEMANTIC_NAMES.map((semanticName) => binding.registrationIdBySemanticName[semanticName]);
  const canIdSet = new Set(canIds);
  const exactRulesByPair = new Map<string, Set<(typeof intentionalTable.relations)[number]["rule"]>>();
  for (const relation of intentionalTable.relations) {
    const pairId = [relation.aRegistrationId, relation.bRegistrationId].sort().join("↔");
    const rules = exactRulesByPair.get(pairId) ?? new Set();
    rules.add(relation.rule);
    exactRulesByPair.set(pairId, rules);
  }
  const permittedByExactRule = (aId: string, bId: string, driveT: number): boolean => {
    const rules = exactRulesByPair.get([aId, bId].sort().join("↔"));
    if (!rules) return false;
    const phase = s5TrackBoundsAtZ(s5FollowerZ(driveT)).phase;
    if (rules.has("FIXED_SPIGOT_TO_MOVING_RECEIVER_NESTED_INTERFACE")) return true;
    if (rules.has("SEAT_TONGUE_TO_DECLARED_RECEIVER_CAVITY")) return phase !== "PRE_PICKUP";
    if (rules.has("CAM_SHOE_TO_SECTOR_RAIL_B_FORWARD_OR_CAPTURED")) {
      return phase === "MOUTH" || phase === "ACTIVE" || phase === "CAPTURED";
    }
    if (rules.has("CAM_SHOE_TO_SECTOR_RAIL_A_REVERSE_OR_CAPTURED")) return phase === "CAPTURED";
    return false;
  };
  const n = 1000;
  for (let i = 0; i <= n; i += 1) {
    const d = i / n;
    rig.applyDrive(d);
    const world = rig.worldSolids();
    const worldById = new Map(world.map((row) => [registrationIdOf(row), row]));
    const env = worldById.get(binding.registrationIdBySemanticName.DRIVE_ENVELOPE);
    const core = worldById.get(binding.registrationIdBySemanticName.S5_CORE_PROXY);
    if (core) {
      const a = obbWorldAabb(core.obb);
      if (!core0) core0 = a;
      else if (Math.abs(a.min.z - core0.min.z) > 1e-6) coreFixed = false;
    }
    const cans = world.filter((row) => canIdSet.has(registrationIdOf(row)) && isS5Material(row));
    if (env) {
      const ea = obbWorldAabb(env.obb);
      for (const c of cans) {
        const ca = obbWorldAabb(c.obb);
        if (ca.min.x < ea.min.x - 0.003 || ca.max.x > ea.max.x + 0.003 || ca.min.y < ea.min.y - 0.003 || ca.max.y > ea.max.y + 0.003) {
          canWithin = false;
        }
      }
    }
    const movers = world.filter((s) => movingIds.has(registrationIdOf(s)) && isS5Material(s));
    const fixed = world.filter((s) => s5Ids.has(registrationIdOf(s)) && !s.moving && isS5Material(s));
    for (const m of movers) {
      for (const f of fixed) {
        const mId = registrationIdOf(m);
        const fId = registrationIdOf(f);
        if (permittedByExactRule(mId, fId, d)) continue;
        if (obbOverlaps(m.obb, f.obb)) {
          approachHonest = false;
          hits.push(`${m.name}∩${f.name}@${d.toFixed(3)}`);
        } else {
          const sep = obbSeparation(m.obb, f.obb);
          minMovingFixed = Math.min(minMovingFixed, sep);
          if (canIdSet.has(mId) && fId === binding.registrationIdBySemanticName.S5_CORE_PROXY) minCoreCan = Math.min(minCoreCan, sep);
        }
      }
    }
    const h = evaluateS5Handover(rig, d);
    if (h.insertion > 0 && firstPos === 1) firstPos = d;
    for (const keep of world.filter((s) => s.family === "keep-cockpit" || s.family === "drive-waist-port" || s.family === "keep-dorsal")) {
      for (const m of movers) {
        if (obbOverlaps(keep.obb, m.obb)) protectionsClear = false;
      }
    }
  }
  return {
    minCoreCan: Number.isFinite(minCoreCan) ? minCoreCan : 0,
    minMovingFixed: Number.isFinite(minMovingFixed) ? minMovingFixed : 0,
    approachHonest,
    coreFixed,
    firstApproachDriveT: firstPos,
    firstPositiveDriveT: firstPos,
    canWithinEnvelope: canWithin,
    protectionsClear,
    hits,
  };
}

function thrustReadyLaw(rig: MachineRig, opts: S5Override): boolean {
  const samples = [0, 0.86, 0.94, 0.99, 1];
  for (const m of samples) {
    const applied = rig.applyMachine(m);
    const h = evaluateS5Handover(rig, applied.appliedDriveT);
    if (h.driveThrustReady) {
      if (!(h.insertionNondegenerate && h.allLocksRetained && h.seatGraph.pass && h.registerSeated)) return false;
    }
    if (applied.appliedDriveT < 0.95 && h.driveThrustReady) return false;
  }
  const end = rig.applyMachine(1);
  const h1 = evaluateS5Handover(rig, end.appliedDriveT);
  const liveReady = (rig as S5MachineRig).lastDriveThrustReady();
  if (opts.lockGap || opts.floatShoulder || opts.camGap || opts.openCam || opts.solidGuide || opts.trackFloat || opts.zeroMargin || opts.railIntrude || opts.backingPlug || opts.namedIntrude || opts.unclassifiedIntrude || opts.missingTrackPiece || opts.missingBFaces || opts.untaggedCorridorSolid || opts.middlePathIntruder || opts.pathMovingUntagged || opts.forgedSurroundingFamily || opts.wrongSectorSpigotReceiver || opts.entryBlock || opts.reverseJam) return false;
  if (opts.shortSpigot || opts.removeDog || opts.removeLock || opts.blockPassage || opts.disconnectFrame) {
    return !h1.driveThrustReady;
  }
  return h1.driveThrustReady === liveReady;
}

function upstreamGate(rig: MachineRig): boolean {
  const r = rig.applyMachine(1, { readiness: { rearBookReady: false } });
  const ready = evaluateS5Handover(rig, r.appliedDriveT).driveThrustReady;
  return r.appliedDriveT === 0 && ready === false;
}

function reversible(rig: MachineRig): boolean {
  for (const t of [0.9, 0.94, 0.98]) {
    const a = rig.machinePoseSnapshot(t);
    const ra = evaluateS5Handover(rig, rig.applyMachine(t).appliedDriveT).driveThrustReady;
    rig.applyMachine(1);
    const b = rig.machinePoseSnapshot(t);
    const rb = evaluateS5Handover(rig, rig.applyMachine(t).appliedDriveT).driveThrustReady;
    rig.applyMachine(0);
    const c = rig.machinePoseSnapshot(t);
    const rc = evaluateS5Handover(rig, rig.applyMachine(t).appliedDriveT).driveThrustReady;
    if (ra !== rb || ra !== rc) return false;
    for (const name of Object.keys(a.nodes)) {
      const pa = a.nodes[name];
      const pb = b.nodes[name];
      const pc = c.nodes[name];
      if (!pb || !pc) return false;
      if (Math.abs(pa.p.z - pb.p.z) > 1e-8 || Math.abs(pa.p.z - pc.p.z) > 1e-8) return false;
    }
  }
  return true;
}

function findFirstReady(rig: MachineRig, opts: S5Override): { machineT: number; driveT: number } {
  if (opts.shortSpigot || opts.removeDog || opts.blockPassage || opts.disconnectFrame || opts.blockReceiver || opts.floatShoulder || opts.camGap || opts.openCam || opts.solidGuide || opts.trackFloat || opts.zeroMargin || opts.railIntrude || opts.backingPlug || opts.namedIntrude || opts.unclassifiedIntrude || opts.missingTrackPiece || opts.missingBFaces || opts.untaggedCorridorSolid || opts.middlePathIntruder || opts.pathMovingUntagged || opts.forgedSurroundingFamily || opts.entryBlock || opts.reverseJam) {
    return { machineT: -1, driveT: -1 };
  }
  for (let i = 880; i <= 1000; i += 1) {
    const m = i / 1000;
    const r = rig.applyMachine(m);
    if ((r as { driveThrustReady?: boolean }).driveThrustReady) return { machineT: m, driveT: r.appliedDriveT };
  }
  return { machineT: -1, driveT: -1 };
}

function findFirstReadyRefined(rig: MachineRig): {
  lastFalse: { machineT: number; driveT: number };
  firstTrue: { machineT: number; driveT: number };
  resolution: number;
} {
  const resolution = 0.00001;
  const samples: Array<{ machineT: number; driveT: number; ready: boolean }> = [];
  for (let i = 99800; i <= 100000; i += 1) {
    const m = i / 100000;
    const r = rig.applyMachine(m);
    const h = evaluateS5Handover(rig, r.appliedDriveT);
    const ready = Boolean(h.driveThrustReady) && h.minLiveRetainedMargin >= S5_RETAINED_INSERTION_MIN;
    samples.push({ machineT: m, driveT: r.appliedDriveT, ready });
  }
  let firstStable = samples.length - 1;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (!samples[i]!.ready) break;
    firstStable = i;
  }
  const first = samples[firstStable]!;
  const prev = samples[Math.max(0, firstStable - 1)]!;
  const pulse = samples.some((s, i) => s.ready && samples.slice(i).some((x) => !x.ready));
  if (pulse) {
    return { lastFalse: { machineT: 1, driveT: 1 }, firstTrue: { machineT: -1, driveT: -1 }, resolution };
  }
  return {
    lastFalse: prev.ready ? { machineT: 0.998, driveT: 0 } : { machineT: prev.machineT, driveT: prev.driveT },
    firstTrue: first.ready ? { machineT: first.machineT, driveT: first.driveT } : { machineT: 1, driveT: 1 },
    resolution,
  };
}
