import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { S5Override } from "../src/machine/s5Propulsion";

test.describe("MT1-S5HR3R1 frozen authority-contract path", () => {
  test("proof-semantic row selection has no live-name projection", () => {
    const capture = readFileSync(resolve(process.cwd(), "src/verify/s5Capture.ts"), "utf8");
    const clearance = readFileSync(resolve(process.cwd(), "src/verify/s5Clearance.ts"), "utf8");
    const propulsion = readFileSync(resolve(process.cwd(), "src/machine/s5Propulsion.ts"), "utf8");
    const authority = readFileSync(resolve(process.cwd(), "src/machine/s5Authority.ts"), "utf8");
    expect(capture).not.toMatch(/new Map\(world\.map\(\(s\) => \[s\.name/);
    expect(capture).not.toMatch(/\.find\(\(s\) => s\.name === `S5_/);
    expect(capture).not.toContain("getMeshByName");
    expect(capture).not.toContain("getSupersededBy(s.name)");
    expect(capture).not.toContain("railBackings.push(best.back.name)");
    expect(capture).not.toContain("connect(back.name, post.name)");
    expect(capture).not.toContain("seen.has(post.name)");
    expect(capture).toContain("railBackingIds.push(best.back.registrationId)");
    expect(capture).toContain("connect(back.registrationId, post.registrationId)");
    expect(capture).toContain("seen.has(post.registrationId)");
    expect(clearance).not.toContain("function intentionalPair(");
    expect(clearance).not.toMatch(/intentionalPair\(m\.name, f\.name\)/);
    expect(clearance).not.toContain("getSupersededBy(s.name)");
    expect(clearance).not.toContain("getS5Class(s.name)");
    expect(clearance).toContain("getS5ClassByRegistrationId");
    expect(propulsion).not.toMatch(/solids\.(find|filter)\([^\n]*\.name/);
    expect(propulsion).toContain("registeredSpecForMesh");
    expect(authority).toContain("getSupersededByRegistrationId");
    expect(authority).toContain("getS5ClassByRegistrationId");
    expect(capture).toContain("indexWorldByRegistrationId");
    expect(capture).toContain("getProofIdentityBinding");
    const preflight = capture.indexOf("const identity = auditS5AuthorityIdentity(rig.solids);", capture.indexOf("export function evalCamTrack"));
    const projection = capture.indexOf("const proofBinding = getProofIdentityBinding(rig);", preflight);
    const support = capture.indexOf("evalTrackSupport(rig, initialWorld)", preflight);
    expect(preflight).toBeGreaterThan(0);
    expect(projection).toBeGreaterThan(preflight);
    expect(support).toBeGreaterThan(projection);
  });
  test("complete unilateral path and assembly pair sweep", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5CamTrack));
    const path = await page.evaluate(() => window.__MT1!.runS5CamTrack!());
    console.log(JSON.stringify({ samples: path.samples, pairs: path.pairsEvaluated, minPinBacking: path.pathCertificate.minPinBacking, minShoeBacking: path.pathCertificate.minShoeBacking, entry: path.pathCertificate.entryRange, forward: path.pathCertificate.forwardEndpoint, reverse: path.pathCertificate.reverseShoulderClearanceLead, retained: path.pathCertificate.retainedWorst }, null, 2));
    if (!path.pass) console.log(JSON.stringify({ firstHit: path.firstHit, endpoint: path.pathCertificate.forwardEndpoint, certificate: path.pathCertificate, drivers: path.drivers }, null, 2));
    expect(path.firstHit, path.firstHit).toBe("");
    expect(path.pathCertificate.entryValid).toBe(true);
    expect(path.pathCertificate.passiveForward).toBe(true);
    expect(path.pathCertificate.passiveReverse).toBe(true);
    expect(path.pathCertificate.inventory.complete).toBe(true);
    expect(path.pathCertificate.inventory.unclassified).toEqual([]);
    expect(path.pathCertificate.inventory.missingRequired).toEqual([]);
    expect(path.pathCertificate.inventory.method).toBe("FULL_MOTION_SAMPLED_UNION");
    expect(path.pathCertificate.inventory.proofIdentity).toBe("registrationId");
    expect(path.pathCertificate.inventory.registrationIdsUnique).toBe(true);
    expect(path.pathCertificate.inventory.namesUnique).toBe(true);
    expect(path.pathCertificate.inventory.relevantRegistrationIds).toHaveLength(
      path.pathCertificate.inventory.lifetimeRows.length,
    );
    expect(path.pathCertificate.pairProof.identity).toBe("registrationId");
    expect(path.pathCertificate.pairProof.movingMoving).toBeGreaterThan(0);
    expect(path.pathCertificate.intentionalContactTable.pass).toBe(true);
    expect(path.trackSupport.edges.length).toBeGreaterThan(0);
    for (const edge of path.trackSupport.edges) {
      expect(edge.fromRegistrationId).toMatch(/^AUTHORITY_ROW_/);
      expect(edge.toRegistrationId).toMatch(/^AUTHORITY_ROW_/);
    }
    expect(path.pathCertificate.inventory.physicalUniverse.length).toBeGreaterThan(300);
    expect(path.pathCertificate.inventory.relevant.length).toBeGreaterThanOrEqual(
      path.pathCertificate.inventory.capturedRelevant.length,
    );
    expect(path.pathCertificate.analyticComparison.pass).toBe(true);
    for (const topology of Object.values(path.pathCertificate.requiredPieceTopology)) {
      expect(topology.moving).toHaveLength(2);
      expect(topology.faceA).toHaveLength(7);
      expect(topology.faceB).toHaveLength(7);
      expect(topology.support.length).toBeGreaterThanOrEqual(7);
    }
    expect(path.pairsEvaluated).toBeGreaterThan(1_000_000);
    expect(path.pathCertificate.minPinBacking).toBeGreaterThan(0.002);
    expect(path.pathCertificate.minShoeBacking).toBeGreaterThan(0);
    for (const sector of Object.values(path.pathCertificate.reverseShoulderClearanceLead)) {
      expect(sector.returnContactTravel).toBeLessThan(sector.shoulderClearTravel);
      expect(sector.shoulderClearTravel).toBeLessThan(sector.shoulderConflictTravel);
      expect(sector.lead).toBeGreaterThanOrEqual(0.001);
    }
    for (const retained of Object.values(path.pathCertificate.retainedWorst)) {
      expect(retained).toBeGreaterThanOrEqual(0.002);
    }
  });

  test("readiness scan diagnostics and certificate fail-closed behavior", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.evaluateS5Handover));
    const states = await page.evaluate(() => {
      const out = [0.998, 0.999, 0.9995, 0.9999, 0.99999, 1].map((machineT) => {
        window.__MT1!.setMachineT(machineT);
        const h = window.__MT1!.evaluateS5Handover!();
        return { machineT, ready: h.driveThrustReady, driveT: h.driveT, insertion: h.insertion, retained: h.minLiveRetainedMargin, tongues: h.allTonguesSeated, locks: h.allLocksRetained, register: h.registerSeated, drivers: h.allLockDriversValid, cert: h.pathCertificateValid };
      });
      const fine: Array<{ machineT: number; ready: boolean; retained: number }> = [];
      for (let i = 99800; i <= 100000; i += 1) {
        const machineT = i / 100000;
        window.__MT1!.setMachineT(machineT);
        const h = window.__MT1!.evaluateS5Handover!();
        fine.push({ machineT, ready: h.driveThrustReady, retained: h.minLiveRetainedMargin });
      }
      const transitions = fine.filter((s, i) => i === 0 || s.ready !== fine[i - 1]!.ready);
      window.__MT1!.setMachineT(1);
      window.__MT1!.invalidateS5PathCertificate!();
      const absentEvaluate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const absentRaw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
      const absentGetter = window.__MT1!.getDriveThrustReady!();
      window.__MT1!.runS5CamTrack!();
      const explicitlyRecertified = window.__MT1!.getDriveThrustReady!();
      return { out, transitions, absentEvaluate, absentRaw, absentGetter, explicitlyRecertified };
    });
    console.log(JSON.stringify(states, null, 2));
    expect(states.transitions).toEqual([
      expect.objectContaining({ machineT: 0.998, ready: false }),
      expect.objectContaining({ machineT: 0.99983, ready: true }),
    ]);
    expect(states.absentEvaluate).toBe(false);
    expect(states.absentRaw).toBe(false);
    expect(states.absentGetter).toBe(false);
    expect(states.explicitlyRecertified).toBe(true);
  });

  test("corrective negative controls and immediate override consistency", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5CamTrack));
    const result = await page.evaluate(() => {
      window.__MT1!.setMachineT(1);
      window.__MT1!.applyS5Override!({ entryBlock: true });
      const entryImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const entry = window.__MT1!.runS5CamTrack!().pathCertificate;
      const entryPublic = window.__MT1!.getDriveThrustReady!();

      window.__MT1!.applyS5Override!({ reverseJam: true });
      const reverseImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const reverse = window.__MT1!.runS5CamTrack!().pathCertificate;

      window.__MT1!.applyS5Override!({ unclassifiedIntrude: true });
      const unclassifiedImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const unclassified = window.__MT1!.runS5CamTrack!().pathCertificate;

      window.__MT1!.applyS5Override!({});
      const restoredImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const restoredPublic = window.__MT1!.getDriveThrustReady!();
      return { entryImmediate, entryPublic, entry, reverseImmediate, reverse, unclassifiedImmediate, unclassified, restoredImmediate, restoredPublic };
    });
    expect(result.entryImmediate).toBe(false);
    expect(result.entryPublic).toBe(false);
    expect(result.entry.entryValid).toBe(false);
    expect(result.entry.valid).toBe(false);
    expect(result.reverseImmediate).toBe(false);
    expect(result.reverse.passiveReverse).toBe(false);
    expect(result.reverse.valid).toBe(false);
    expect(result.unclassifiedImmediate).toBe(false);
    expect(result.unclassified.inventory.complete).toBe(false);
    expect([
      ...result.unclassified.inventory.unclassified,
      ...result.unclassified.inventory.invalidClassification,
      ...result.unclassified.inventory.conflictingClassification,
    ]).toContain("S5_NC_UNCLASSIFIED_INTRUDER_VIS");
    expect(result.unclassified.valid).toBe(false);
    expect(result.restoredImmediate).toBe(false);
    expect(result.restoredPublic).toBe(true);
  });

  test("required pieces and physical-first corridor controls fail every readiness path", async ({ page }) => {
    test.setTimeout(900_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5CamTrack));
    const controls = await page.evaluate(() => {
      const run = (opts: S5Override) => {
        window.__MT1!.setMachineT(1);
        window.__MT1!.applyS5Override!(opts);
        const evaluateImmediate = window.__MT1!.evaluateS5Handover!().driveThrustReady;
        const raw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
        const getter = window.__MT1!.getDriveThrustReady!();
        const cert = window.__MT1!.getS5PathCertificate!()!;
        return { evaluateImmediate, raw, getter, cert };
      };
      const missingPiece = run({ missingTrackPiece: true });
      const missingBFaces = run({ missingBFaces: true });
      const untagged = run({ untaggedCorridorSolid: true });
      const middle = run({ middlePathIntruder: true });
      const movingPath = run({ pathMovingUntagged: true });
      const forgedFamily = run({ forgedSurroundingFamily: true });
      const movingAuthority = window.__MT1!.runS5Authority!({ pathMovingUntagged: true });
      const forgedAuthority = window.__MT1!.runS5Authority!({ forgedSurroundingFamily: true });
      window.__MT1!.applyS5Override!({});
      const restored = window.__MT1!.getDriveThrustReady!();
      return { missingPiece, missingBFaces, untagged, middle, movingPath, forgedFamily, movingAuthority, forgedAuthority, restored };
    });
    for (const result of [controls.missingPiece, controls.missingBFaces, controls.untagged, controls.middle, controls.movingPath, controls.forgedFamily]) {
      expect(result.evaluateImmediate).toBe(false);
      expect(result.raw).toBe(false);
      expect(result.getter).toBe(false);
      expect(result.cert.valid).toBe(false);
    }
    expect(controls.missingPiece.cert.inventory.missingRequired).toContain("S5_LOCK_RAIL_B_PORT_CAM");
    expect(controls.missingBFaces.cert.inventory.missingRequired.filter((name) => name.startsWith("S5_LOCK_RAIL_B_PORT_"))).toHaveLength(6);
    expect(controls.untagged.cert.inventory.relevant).toContain("S5_NC_UNCLASSIFIED_INTRUDER_VIS");
    expect(controls.untagged.cert.inventory.unclassified).toContain("S5_NC_UNCLASSIFIED_INTRUDER_VIS");
    expect(controls.middle.cert.inventory.collisionScope).toContain("S5_LOCK_RAIL_INTRUDE_PORT_VIS");
    expect(controls.movingPath.cert.inventory.capturedRelevant).not.toContain("S5_NC_PATH_MOVING_UNTAGGED_VIS");
    expect(controls.movingPath.cert.inventory.pathAdded).toContain("S5_NC_PATH_MOVING_UNTAGGED_VIS");
    expect(controls.movingPath.cert.inventory.unclassified).toContain("S5_NC_PATH_MOVING_UNTAGGED_VIS");
    expect(controls.movingPath.cert.firstHit).toContain("S5_NC_PATH_MOVING_UNTAGGED_VIS");
    expect(controls.forgedFamily.cert.inventory.relevant).toContain("S5_NC_FORGED_SURROUNDING_VIS");
    expect(controls.forgedFamily.cert.inventory.approvedSurrounding).not.toContain("S5_NC_FORGED_SURROUNDING_VIS");
    expect(controls.forgedFamily.cert.inventory.unclassified).toContain("S5_NC_FORGED_SURROUNDING_VIS");
    expect(controls.forgedFamily.cert.firstHit).toContain("S5_NC_FORGED_SURROUNDING_VIS");
    for (const [report, id] of [
      [controls.movingAuthority, "NC-PATH-MOVING-UNTAGGED"],
      [controls.forgedAuthority, "NC-FORGED-SURROUNDING-FAMILY"],
    ] as const) {
      expect(report.negativeControls.find((row) => row.id === id)?.status).toBe("PASS");
      expect(report.closures.find((row) => row.id === "C18")?.pass).toBe(false);
    }
    expect(controls.restored).toBe(true);
  });

  test("frozen identity and lifetime controls fail closed by registration ID", async ({ page }) => {
    test.setTimeout(900_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const result = await page.evaluate(() => {
      const run = (opts: S5Override) => {
        const report = window.__MT1!.runS5Authority!(opts);
        window.__MT1!.setMachineT(1);
        window.__MT1!.applyS5Override!(opts);
        const handover = window.__MT1!.evaluateS5Handover!();
        const evaluator = handover.driveThrustReady;
        const raw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
        const getter = window.__MT1!.getDriveThrustReady!();
        const cert = window.__MT1!.getS5PathCertificate!()!;
        window.__MT1!.applyS5Override!({});
        const restored = window.__MT1!.getDriveThrustReady!();
        return { report, handover, evaluator, raw, getter, cert, restored };
      };
      return {
        transient: run({ midpathTransientRow: true }),
        duplicateName: run({ duplicateAuthorityName: true }),
        duplicateMoving: run({ duplicateMovingRow: true }),
      };
    });
    for (const [control, id] of [
      [result.transient, "NC-MIDPATH-TRANSIENT-ROW"],
      [result.duplicateName, "NC-DUPLICATE-AUTHORITY-NAME"],
      [result.duplicateMoving, "NC-DUPLICATE-MOVING-ROW"],
    ] as const) {
      expect(control.evaluator).toBe(false);
      expect(control.raw).toBe(false);
      expect(control.getter).toBe(false);
      expect(control.cert.valid).toBe(false);
      expect(control.report.closures.find((row) => row.id === "C18")?.pass).toBe(false);
      expect(control.report.negativeControls.find((row) => row.id === id)?.status).toBe("PASS");
      expect(control.restored).toBe(true);
    }
    const transient = result.transient.cert.inventory.lifetimeRows.find(
      (row) => row.name === "S5_NC_MIDPATH_TRANSIENT_VIS",
    );
    expect(transient?.registrationId).toMatch(/^AUTHORITY_ROW_/);
    expect(transient?.firstRelevant.stage).not.toBe("PREREQUISITE");
    expect(transient?.firstRelevant.phase).toMatch(/^(PRE_PICKUP|MOUTH|ACTIVE|CAPTURED|POST_EXIT)$/);
    expect(transient?.firstRelevant.sample).toBeGreaterThan(0);
    expect(transient?.firstRelevant.driveT).toBeGreaterThan(0.98);
    expect(transient?.firstRelevant.enabled).toBe(true);
    expect(transient?.firstRelevant.aabb.min).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) }));
    expect(transient?.classification).toBe("unclassified");
    expect(result.transient.cert.inventory.pathAdded).toContain("S5_NC_MIDPATH_TRANSIENT_VIS");
    expect(result.transient.cert.firstHit).toContain("S5_NC_MIDPATH_TRANSIENT_VIS");
    expect(result.duplicateName.cert.inventory.namesUnique).toBe(false);
    expect(result.duplicateName.cert.inventory.identityPreflightPassed).toBe(false);
    expect(result.duplicateName.cert.inventory.requiredTopologyProjected).toBe(false);
    expect(result.duplicateName.cert.samples).toBe(0);
    expect(result.duplicateName.cert.pairsEvaluated).toBe(0);
    expect(result.duplicateName.cert.supportContinuity).toBe(false);
    expect(result.duplicateName.cert.phases).toEqual(["IDENTITY_PREFLIGHT_FAILED_BEFORE_PROOF_PROJECTION"]);
    expect(result.duplicateName.cert.intentionalContactTable.instantiatedRelations).toBe(0);
    expect(result.duplicateName.cert.intentionalContactTable.relations).toEqual([]);
    expect(result.duplicateName.handover.trackSupport.edges).toEqual([]);
    expect(result.duplicateName.handover.seatGraph.edges).toEqual([]);
    expect(result.duplicateName.handover.coreGraph.edges).toEqual([]);
    expect(result.duplicateName.handover.firstApproachEvent).toBe("identity_preflight_failed_before_projection");
    expect(result.duplicateName.cert.inventory.duplicateNames).toContainEqual(
      expect.objectContaining({ name: "S5_LOCK_PIN_PORT" }),
    );
    const duplicateIds = result.duplicateName.cert.inventory.duplicateNames.find(
      (row) => row.name === "S5_LOCK_PIN_PORT",
    )?.registrationIds;
    expect(duplicateIds).toHaveLength(2);
    expect(new Set(duplicateIds).size).toBe(2);
    expect(result.duplicateMoving.cert.pairProof.movingMoving).toBeGreaterThan(0);
    expect(result.duplicateMoving.cert.firstHit).toContain("S5_NC_DUPLICATE_MOVING_ROW_VIS");
  });

  test("exact contact authority rejects wrong-sector registered interface", async ({ page }) => {
    test.setTimeout(600_000);
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__MT1?.runS5Authority));
    const result = await page.evaluate(() => {
      const report = window.__MT1!.runS5Authority!({ wrongSectorSpigotReceiver: true });
      window.__MT1!.setMachineT(1);
      window.__MT1!.applyS5Override!({ wrongSectorSpigotReceiver: true });
      const evaluator = window.__MT1!.evaluateS5Handover!().driveThrustReady;
      const raw = window.__MT1!.applyMachineRaw!(1).driveThrustReady;
      const getter = window.__MT1!.getDriveThrustReady!();
      const certificate = window.__MT1!.getS5PathCertificate!()!;
      window.__MT1!.applyS5Override!({});
      const restored = window.__MT1!.getDriveThrustReady!();
      const nominal = window.__MT1!.runS5CamTrack!().pathCertificate;
      return { report, evaluator, raw, getter, certificate, restored, nominal };
    });
    const nested = result.nominal.intentionalContactTable.relations.filter(
      (row) => row.rule === "FIXED_SPIGOT_TO_MOVING_RECEIVER_NESTED_INTERFACE",
    );
    expect(nested).toHaveLength(4);
    expect(result.nominal.intentionalContactTable.instantiatedRelations).toBe(223);
    expect(result.nominal.intentionalContactTable.pass).toBe(true);
    expect(result.nominal.valid).toBe(true);
    expect(result.certificate.firstHit).toContain("S5_RECEIVER_PORT");
    expect(result.certificate.firstHit).toContain("S5_SPIGOT_STBD");
    expect(result.certificate.intentionalContactTable.relations).not.toContainEqual(
      expect.objectContaining({ aName: "S5_SPIGOT_STBD", bName: "S5_RECEIVER_PORT" }),
    );
    expect(result.certificate.valid).toBe(false);
    expect(result.report.closures.find((row) => row.id === "C18")?.pass).toBe(false);
    expect(result.report.status).toBe("STOP");
    expect(result.evaluator).toBe(false);
    expect(result.raw).toBe(false);
    expect(result.getter).toBe(false);
    expect(result.restored).toBe(true);
  });
});
