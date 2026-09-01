export interface Mt1BuildInfo {
  candidateId: "MT1-S5HR3R1";
  freezeId: "MT1-S5HR3R1";
  candidateSha256: string;
  candidateSha256Scope: string;
  sourceCandidateId: "MT1-S5HR3R";
  sourceCandidateSha256: string;
  authorityContractSha256: string;
  frozenNegativeControlContractSha256: string;
  nominalGeometryAuthority: {
    id: "MT1-S5H";
    version: string;
    parametersSha256: string;
  };
  frozenS4aSha256: string;
  inspectionSurface: "presentation-only-v1";
}

export interface Mt1InspectionState {
  candidateId: Mt1BuildInfo["candidateId"];
  machineT: number;
  driveT: number;
  requestedDriveT: number;
  mode: string;
  preview: boolean;
  driveThrustReadyCached: boolean;
  certificate: {
    state: "ABSENT" | "STALE" | "CURRENT";
    present: boolean;
    valid: boolean;
    samples: number | null;
    pairsEvaluated: number | null;
  };
}

/**
 * Compile-time provenance only. Importing or reading this object does not touch
 * the machine, scene, certificate cache, or any authority evaluator.
 */
export const MT1_BUILD_INFO: Readonly<Mt1BuildInfo> = Object.freeze({
  candidateId: "MT1-S5HR3R1",
  freezeId: "MT1-S5HR3R1",
  candidateSha256: "6df6ddd8086d12329e87b9695c8e309995b2e81c6e72eacea240215ca3a646a3",
  candidateSha256Scope: "MT1-S5HR3R1.zip authority candidate; dev tree adds presentation-only inspection plumbing",
  sourceCandidateId: "MT1-S5HR3R",
  sourceCandidateSha256: "072d936e4bef77c097b464f6aaf414feb630cafaba6a533f9dfbb9e5c4256018",
  authorityContractSha256: "e15885cc11777ad49f2b0b5ad2778facb64ee6f932b65bf36742a65afe451ba9",
  frozenNegativeControlContractSha256: "8b150937b002d7a054e098182d6453711c477f8eaeb1865c1663541dc135f70d",
  nominalGeometryAuthority: Object.freeze({
    id: "MT1-S5H",
    version: "frozen S5H mechanism geometry carried unchanged through HR3R1",
    parametersSha256: "8d713b182f94af2769bec0696fb10cfc94fce98d90e89a46a69aad68e805fc63",
  }),
  frozenS4aSha256: "95d09a2429bf93e4060d65190e5ec369ccc88828fe8ae0ce07a7bfcdb7bf08b8",
  inspectionSurface: "presentation-only-v1",
});

export function getBuildInfo(): Readonly<Mt1BuildInfo> {
  return MT1_BUILD_INFO;
}
