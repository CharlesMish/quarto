import { FORBIDDEN_CLAIM_WORDS } from "../vb1/constants";
import { derivePackaging, enumerateAllowanceCorners, PACKAGING_ASSUMPTIONS } from "./packaging";
import {
  DP1_ID,
  S4A_SHA256,
  deployedBayEngagement,
  extractLiveCan,
  stationsFromParams,
  type StationSet,
} from "./stations";
import { svgCrossSection, svgHandover, svgLoadPath, svgLongitudinal, svgMotion } from "./svg";
import {
  DP1A_ID,
  PUBLISHED_SPIGOT_LENGTH,
  SOURCE_DP1_SHA256,
  enumerateSpigotCandidates,
  modelFlowHandover,
  modelStructuralHandover,
} from "./handover";
import type { MachineRig } from "../../machine/types";

export type EvidenceKind =
  | "COMPUTED_STUDY_RESULT"
  | "ARCHITECTURE_PREMISE"
  | "EXTERNAL_ATTESTATION"
  | "PENDING_PHYSICAL_S5_PROOF";

export interface StudyGate {
  id: string;
  name: string;
  evidenceKind: EvidenceKind;
  pass: boolean | null;
  status: "PASS" | "FAIL" | "EXTERNAL_ATTESTATION_REQUIRED";
  detail: string;
  source?: string;
}

export interface Dp1Options {
  invertEngagementSign?: boolean;
  oversizedCore?: boolean;
  solidCan?: boolean;
  noSeat?: boolean;
  shortSpigot?: boolean;
  noReceiver?: boolean;
  blockPassage?: boolean;
  noFrame?: boolean;
  railsOnly?: boolean;
  lugHitsRail?: boolean;
}

function gate(
  id: string,
  name: string,
  evidenceKind: EvidenceKind,
  pass: boolean,
  detail: string,
  source?: string,
): StudyGate {
  return {
    id,
    name,
    evidenceKind,
    pass,
    status: pass ? "PASS" : "FAIL",
    detail,
    source,
  };
}

export function runDp1Study(rig: MachineRig, opts: Dp1Options = {}): Record<string, unknown> {
  const stations = stationsFromParams();
  const live0 = extractLiveCan(rig, 0);
  const live1 = extractLiveCan(rig, 1);
  const liveMatch =
    live0 !== null &&
    live1 !== null &&
    Math.abs(live0.zFwd - stations.CAN_STOWED_FORWARD_FACE) < 0.002 &&
    Math.abs(live0.zAft - stations.CAN_STOWED_AFT_FACE) < 0.002 &&
    Math.abs(live1.zFwd - stations.CAN_DEPLOYED_FORWARD_FACE) < 0.002 &&
    Math.abs(live1.zAft - stations.CAN_DEPLOYED_AFT_FACE) < 0.002;

  const engagement = deployedBayEngagement(stations);
  const reportedEngagement = opts.invertEngagementSign ? { ...engagement, value: -engagement.value } : engagement;
  const signTruth = !opts.invertEngagementSign && engagement.value > 0 && stations.CAN_DEPLOYED_FORWARD_FACE > stations.BAY_AFT_HOOP;

  const pack = derivePackaging(stations, {
    coreScale: opts.oversizedCore ? 1.8 : 1,
    solidCan: opts.solidCan,
    noSeat: opts.noSeat,
  });
  const allowanceCorners = enumerateAllowanceCorners(stations.outerCan.w, stations.outerCan.h, pack.recommendedCoreSection);
  const flow = modelFlowHandover(stations, pack, {
    spigotLength: opts.shortSpigot ? PUBLISHED_SPIGOT_LENGTH : undefined,
    noReceiver: opts.noReceiver,
    blockPassage: opts.blockPassage || opts.solidCan,
  });
  const structural = modelStructuralHandover(stations, pack, flow, {
    noSeat: opts.noSeat,
    noFrame: opts.noFrame,
    railsOnly: opts.railsOnly,
    lugHitsRail: opts.lugHitsRail,
  });
  const spigotCandidates = enumerateSpigotCandidates(stations, pack);

  const usefulCore = pack.maxCoreSection.w >= 0.45 && pack.maxCoreSection.h >= 0.35 && pack.maxCoreBand.length >= 1.2;
  const bPrimeFit = usefulCore && pack.coreClearsCanInteriorOverStroke && pack.innerPassage.w > 0.4 && pack.innerPassage.h > 0.35;
  const flowHandoverOk =
    flow.coreToCanMouthGap > 0 &&
    flow.nondegenerate &&
    flow.receiverDepth > 0 &&
    flow.axialPassageContinuous &&
    flow.allInterfaceMarginsNonNegative;
  const structuralOk =
    structural.graphConnected &&
    structural.terminatesOnExistingS4a &&
    structural.lugClearsRails &&
    !opts.noSeat &&
    !opts.noFrame &&
    !opts.railsOnly;
  const railBypass = structural.railBypassComplete;

  const kill: string[] = [];
  if (!usefulCore || opts.oversizedCore) kill.push("no useful fixed-core envelope inside stowed can under declared allowances");
  if (!pack.coreClearsCanInteriorOverStroke) kill.push("fixed core intersects can interior over extraction");
  if (!flowHandoverOk) kill.push("flow handover insertion not nondegenerate");
  if (!structuralOk) kill.push("structural handover architecture not feasible");
  if (!railBypass) kill.push("no complete non-rail operating-load route");

  const ncActive = Boolean(
    opts.noSeat ||
      opts.solidCan ||
      opts.oversizedCore ||
      opts.invertEngagementSign ||
      opts.shortSpigot ||
      opts.noReceiver ||
      opts.blockPassage ||
      opts.noFrame ||
      opts.railsOnly ||
      opts.lugHitsRail,
  );
  const disposition: "DP1A_BPRIME_SURVIVES_WITH_CAUTION" | "DP1_FALLBACK_TO_WHOLE_MODULE_A" | "DP1_REQUIRES_S4A_REOPEN" | "DP1_INCONCLUSIVE" =
    !flowHandoverOk
      ? "DP1_FALLBACK_TO_WHOLE_MODULE_A"
      : !structuralOk || !railBypass
        ? "DP1_INCONCLUSIVE"
        : "DP1A_BPRIME_SURVIVES_WITH_CAUTION";

  const bPrimeSurvives = disposition === "DP1A_BPRIME_SURVIVES_WITH_CAUTION";

  const comparison = {
    tag: "DP1_DERIVED_ARCHITECTURE_RESULT" as const,
    A: {
      name: "whole propulsion module translates",
      packaging: "current solid envelope is the module; no inner-core fit required",
      movingServices: "power/fuel/cooling must flex the full 2.55 m",
      deployedCapture: "still required — rails are not a thrust frame",
      loadPath: "module lug ring → same handover seat → AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL",
      movingBurden: "entire prime mover walks",
      waistInterface: "core leaves the bay; lateral service to a departed core is awkward",
      strokeComplexity: "simplest internals; no sliding flow joint",
      s4a: "preserves envelope/stroke unchanged",
      vetoedByVb1Cg: false,
    },
    Bprime: {
      name: "fixed core + translating thrust can + deployed capture",
      packaging: bPrimeFit ? "useful core section exists under declared allowances" : "core fit fails",
      movingServices: "core services stay in the bay; can needs only lock/align harness",
      deployedCapture: "required at handover, same seat family as A",
      loadPath: "core mounts → bay/keel; can operating load → seat → AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL",
      movingBurden: "hollow can + carriage only",
      waistInterface: "fixed core remains at bay mouth; lateral datums stay meaningful",
      strokeComplexity: "coaxial extraction; constant section; one plane joint",
      s4a: "preserves envelope/stroke; envelope becomes hollow",
      vetoedByVb1Cg: false,
      winsIf: {
        usefulCore: bPrimeFit,
        realFlowInsertion: flowHandoverOk && flow.nondegenerate,
        structuralBypassFeasible: structuralOk && railBypass,
      },
    },
    C: {
      name: "telescoping train",
      necessary: pack.usableEngagement < 0.10 || !flowHandoverOk,
      verdict: flow.nondegenerate ? "rejected_as_unnecessary_complexity" : "reconsider_if_joint_fails",
    },
  };

  const sentence = bPrimeSurvives
    ? "The vehicle extends its aft thrust can from around the fixed propulsion core into the free exhaust station; the can's forward mouth remains 0.275 m inside the bay, seats on the handover structure forward of the AFT_POST_PAIR, and only then is propulsion considered mechanically ready."
    : "The current envelope would remain a whole translating propulsion module pending a different architecture.";

  const claim = `${disposition} ${sentence}`.toLowerCase();
  const forbidden = FORBIDDEN_CLAIM_WORDS.filter((w) => claim.includes(w));

  const g1: StudyGate = {
    id: "DP1-G1",
    name: "S4A identity",
    evidenceKind: "EXTERNAL_ATTESTATION",
    pass: null,
    status: "EXTERNAL_ATTESTATION_REQUIRED",
    source: "Playwright/release hash test",
    detail: `declared frozen identity ${S4A_SHA256}; workspace file hashes are not computed in the browser study`,
  };
  const g2 = gate(
    "DP1-G2",
    "station geometry truth",
    "COMPUTED_STUDY_RESULT",
    liveMatch && stations.stroke === stations.canLength,
    liveMatch ? "live envelope matches P; stroke=length=2.55" : "live/param mismatch",
  );
  const g3 = gate(
    "DP1-G3",
    "deployed engagement / sign",
    "COMPUTED_STUDY_RESULT",
    signTruth && Math.abs(engagement.value - 0.275) < 1e-9,
    opts.invertEngagementSign
      ? "NC1 inverted sign"
      : `deployedBayEngagement=${engagement.value.toFixed(3)} (can fwd face forward of aft-post station)`,
  );
  const g4 = gate(
    "DP1-G4",
    "can/core packaging",
    "COMPUTED_STUDY_RESULT",
    bPrimeFit && !opts.oversizedCore,
    opts.oversizedCore ? "NC2 oversized core" : `max core ${pack.maxCoreSection.w.toFixed(2)}×${pack.maxCoreSection.h.toFixed(2)}`,
  );
  const g5 = gate(
    "DP1-G5",
    "hollow-can analytical model",
    "COMPUTED_STUDY_RESULT",
    pack.innerPassage.w > 0.4 && pack.innerPassage.h > 0.35 && !opts.solidCan && !opts.blockPassage,
    opts.solidCan
      ? "NC3 solid can"
      : opts.blockPassage
        ? "NC-FLOW3 receiver blocks axial passage"
        : `inner passage ${pack.innerPassage.w.toFixed(2)}×${pack.innerPassage.h.toFixed(2)}`,
  );
  const g6 = gate(
    "DP1-G6",
    "flow handover",
    "COMPUTED_STUDY_RESULT",
    flowHandoverOk,
    opts.shortSpigot
      ? `NC-FLOW1 prior 0.150 m spigot insertion=${flow.flowInsertion.toFixed(3)}; nondegenerate=${flow.nondegenerate}`
      : opts.noReceiver
        ? "NC-FLOW2 receiver removed"
        : opts.blockPassage || opts.solidCan
          ? "NC-FLOW3 passage blocked"
          : `gap=${flow.coreToCanMouthGap.toFixed(3)} insertion=${flow.flowInsertion.toFixed(3)} receiver=${flow.receiverDepth.toFixed(3)} nondegenerate=${flow.nondegenerate} (>${flow.nondegenerateInsertionThreshold.toFixed(3)})`,
  );
  const g7 = gate(
    "DP1-G7",
    "structural handover architecture feasible",
    "COMPUTED_STUDY_RESULT",
    structuralOk,
    opts.noSeat
      ? "NC-STRUCT1 seat removed"
      : opts.noFrame
        ? "NC-STRUCT2 handover frame disconnected"
        : opts.railsOnly
          ? "NC-STRUCT3 rails-only path"
          : opts.lugHitsRail
            ? "NC-STRUCT4 lug intersects rail sector"
            : "can→lock→seat→handover frame→AFT_POST_PAIR→BAY_WALL_PORT/STBD→BULKHEAD_Z-1p70→VENTRAL_KEEL; S5 must still instantiate this path",
  );
  const g8 = gate(
    "DP1-G8",
    "rail bypass architecture",
    "COMPUTED_STUDY_RESULT",
    railBypass,
    opts.noSeat || opts.railsOnly
      ? "operating-load graph requires rails or is incomplete"
      : "complete can→seat→frame→existing-structure path with no DRIVE_RAILS edge; does not certify thrust capacity",
  );
  const g9: StudyGate = {
    id: "DP1-G9",
    name: "S4A preservation",
    evidenceKind: "EXTERNAL_ATTESTATION",
    pass: null,
    status: "EXTERNAL_ATTESTATION_REQUIRED",
    source: "Playwright/release hash test",
    detail: "no bay/axis/stroke/map edit proposed; file-hash proof is the Playwright/release attestation",
  };
  const g10 = gate(
    "DP1-G10",
    "architecture comparison honesty",
    "COMPUTED_STUDY_RESULT",
    comparison.A.vetoedByVb1Cg === false && comparison.Bprime.vetoedByVb1Cg === false && forbidden.length === 0,
    "A retained as fallback; CG not used as veto; C unnecessary if selected insertion is nondegenerate",
  );

  const gates = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];

  const closures = [
    {
      id: "C1",
      name: "actual flow insertion",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: flow.flowInsertion > 0 && Number.isFinite(flow.flowInsertion),
      detail: `overlapLength(spigot, receiver)=${flow.flowInsertion.toFixed(3)} (not usableBayEngagement)`,
    },
    {
      id: "C2",
      name: "flow negative control",
      evidenceKind: "EXTERNAL_ATTESTATION" as const,
      pass: null,
      status: "EXTERNAL_ATTESTATION_REQUIRED" as const,
      detail: opts.shortSpigot
        ? `NC-FLOW1 fixture input: prior 0.150 m spigot, insertion=${flow.flowInsertion.toFixed(3)}, nondegenerate=${flow.nondegenerate}`
        : "NC-FLOW1 prior-0.150 m fixture requires Playwright/release attestation",
    },
    {
      id: "C3",
      name: "receiver truth",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: flow.receiverDepth > 0 && flow.axialPassageContinuous,
      detail: opts.noReceiver
        ? "NC-FLOW2 receiver removed"
        : opts.blockPassage || opts.solidCan
          ? "passage blocked"
          : `receiverDepth=${flow.receiverDepth.toFixed(3)}; passage open`,
    },
    {
      id: "C4",
      name: "structural seat region",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: structural.seat.lateralGapEach > 0.05 && structural.seat.verticalGapUpper > 0.05 && structural.seat.zFwd > structural.seat.zAft && !opts.noSeat,
      detail: `seat z∈[${structural.seat.zAft.toFixed(3)}, ${structural.seat.zFwd.toFixed(3)}]; lat ${structural.seat.lateralGapEach.toFixed(3)}; vert ${structural.seat.verticalGapUpper.toFixed(3)}/${structural.seat.verticalGapLower.toFixed(3)}`,
    },
    {
      id: "C5",
      name: "structural graph",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: structural.graphConnected && structural.terminatesOnExistingS4a,
      detail: structural.graphConnected
        ? "can→seat→frame→AFT_POST_PAIR→BAY_WALL_PORT/STBD→BULKHEAD_Z-1p70→VENTRAL_KEEL"
        : "graph incomplete",
    },
    {
      id: "C6",
      name: "rail bypass",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: railBypass,
      detail: railBypass ? "operating-load path has no rail edge" : "no complete non-rail route",
    },
    {
      id: "C7",
      name: "flow/lock coexistence",
      evidenceKind: "COMPUTED_STUDY_RESULT" as const,
      pass: structural.coexistenceOk && structural.lugClearsRails,
      detail: structural.coexistenceOk
        ? "CENTER/INNER_ANNULUS/OUTER_SECTORS/EXCLUDED_SECTORS; flow and lock may share axial band"
        : "zoning conflict or missing seat/receiver",
    },
    {
      id: "C8",
      name: "truthful provenance",
      evidenceKind: "EXTERNAL_ATTESTATION" as const,
      pass: g1.evidenceKind === "EXTERNAL_ATTESTATION" && g9.evidenceKind === "EXTERNAL_ATTESTATION",
      detail: "G1/G9 are EXTERNAL_ATTESTATION, not browser-computed freeze proof",
    },
    {
      id: "C9",
      name: "README/scope truth",
      evidenceKind: "EXTERNAL_ATTESTATION" as const,
      pass: null,
      status: "EXTERNAL_ATTESTATION_REQUIRED",
      detail: "Node test asserts README does not retain the pre-DP1 drive-architecture prohibition",
    },
  ];

  return {
    freezeId: DP1A_ID,
    sourceStudyId: DP1_ID,
    sourceDp1Sha256: SOURCE_DP1_SHA256,
    status: "DP1A_CANDIDATE_PENDING_DIRECTOR",
    disposition,
    sourceS4aSha256: S4A_SHA256,
    stations,
    live: { stowed: live0, deployed: live1, match: liveMatch },
    engagement: reportedEngagement,
    engagementTruth: engagement,
    CORE_CAN_HANDOVER_STATION: {
      tag: "DP1_ARCHITECTURE_ASSUMPTION",
      z_long: pack.handoverStation,
      equals: "CAN_DEPLOYED_FORWARD_FACE",
      relationToAftPosts: "0.275 m forward of BAY_AFT_STATION / AFT_POST_PAIR, inside the bay",
    },
    assumptions: {
      ...PACKAGING_ASSUMPTIONS,
      publishedFlowSpigotLength: PACKAGING_ASSUMPTIONS.flowSpigotLength,
      selectedFlowSpigotLength: flow.selectedSpigotLength,
      selectedReceiverDepth: flow.receiverDepth,
      spigotRevision: "0.15 m published DP1 length revised to 0.24 m in DP1A because 0.030 m insertion is marginal",
    },
    packaging: pack,
    allowanceCorners,
    flowHandover: flow,
    flowInterface: {
      tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
      form: "fixed concentric male spigot on the core aft face, entering the can receiver sleeve",
      publishedLength: flow.publishedSpigotLength,
      selectedLength: flow.selectedSpigotLength,
      interval: flow.FLOW_SPIGOT_INTERVAL,
      insertion: flow.flowInsertion,
      coreToCanMouthGap: flow.coreToCanMouthGap,
      notDerivedFrom: "usableBayEngagement",
    },
    structuralHandover: structural,
    structuralSeat: {
      tag: "DP1_ARCHITECTURE_ASSUMPTION",
      form: "annular register plus 4 axial locking lugs/dogs in rail-free sectors",
      engages: "final millimetres of existing mapDrive stroke",
      predicate: "driveThrustReady means seated capture, not merely driveT==1",
      aftStructureLabel: "AFT_POST_PAIR",
    },
    loadPaths: {
      tag: "DP1_DERIVED_ARCHITECTURE_RESULT",
      coreReaction: "fixed prime mover → core mounts/reaction frame → bay floor / BULKHEAD_Z-1p70 / spanning keel",
      canOperatingLoad:
        "can pressure/terminal axial load → deployed lugs/register → short handover frame → AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL",
      rails: "guides only; carry can during translation; do not take operating axial reaction after capture",
      physicalProof: "PENDING_PHYSICAL_S5_PROOF",
    },
    spreadAssumption: {
      tag: "DP1_ARCHITECTURE_ASSUMPTION",
      id: "DP1_ASSUMPTION_AXIAL_DRIVE_INACTIVE_WHILE_STOWED",
      text: "axial propulsion is inactive while the thrust can is stowed",
      reason: "stowed can is inside the bay; no honest free terminal exhaust station exists",
      notS4aAuthority: true,
    },
    waistInterfaces: waistDatums(stations),
    families: {
      F6: "moving can + carriage + shoes + moving lock half",
      F7: "rails + stops + fixed guide + fixed seat hardware",
      F_PROP_FIXED: "NEW — prime mover, fixed reaction frame, fixed core hardware. Not F5.",
      F5: "remain decomposed: forward/dorsal · spanning keel · aft bay / thrust-seat structure",
    },
    comparison,
    spigotCandidates,
    killConditionsEncountered: ncActive ? kill : [],
    sentence,
    gates,
    closures,
    svg: {
      longitudinal: svgLongitudinal(stations, pack),
      crossSection: svgCrossSection(stations, pack),
      loadPath: svgLoadPath(stations, pack),
      motion: svgMotion(stations, pack),
      handover: svgHandover(stations, flow),
    },
    options: opts,
    bPrimeSurvives,
  };
}

function waistDatums(s: StationSet): {
  tag: "DP1_ARCHITECTURE_ASSUMPTION";
  planes: Array<{ name: string; x_lat: number; z0: number; z1: number; note: string }>;
} {
  return {
    tag: "DP1_ARCHITECTURE_ASSUMPTION",
    planes: [
      {
        name: "DP1_WAIST_IFACE_PORT",
        x_lat: -s.bay.xHalf,
        z0: s.BAY_FORWARD_STATION - 0.2,
        z1: s.BAY_FORWARD_STATION + 0.15,
        note: "lateral bay-wall plane toward DRIVE_WAIST_PORT; not a duct",
      },
      {
        name: "DP1_WAIST_IFACE_STBD",
        x_lat: s.bay.xHalf,
        z0: s.BAY_FORWARD_STATION - 0.2,
        z1: s.BAY_FORWARD_STATION + 0.15,
        note: "lateral bay-wall plane toward DRIVE_WAIST_STBD; not a duct",
      },
    ],
  };
}
