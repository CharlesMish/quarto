import type { AuthoritySolid } from "./authority";
import {
  auditS5AuthorityIdentity,
  getS5AuthorityIdentityBinding,
  registrationIdOf,
} from "./s5Identity";

export type S5Class =
  | "LIVE_MATERIAL_PHYSICAL"
  | "LEGACY_SUPERSEDED_REFERENCE"
  | "DEBUG_NONPHYSICAL"
  | "RETAINED_S4A_PHYSICAL"
  | "NEW_S5_PHYSICAL"
  | "LEGACY_SUPERSEDED_PROXY";

const supersededBy = new Map<string, string>();
const s5Class = new Map<string, S5Class>();
const supersededByRegistrationId = new Map<string, string>();
const s5ClassByRegistrationId = new Map<string, S5Class>();

export function markSuperseded(name: string, by: string): void {
  supersededBy.set(name, by);
  s5Class.set(name, "LEGACY_SUPERSEDED_REFERENCE");
}

export function markS5Class(name: string, cls: S5Class): void {
  s5Class.set(name, cls);
}

/**
 * One-time migration of build-time semantic labels into the frozen registered
 * identity universe. This may run only after global identity/name preflight.
 */
export function bindS5AuthoritySemanticsToRegistrationIds(owner: object, rows: readonly AuthoritySolid[]): void {
  const audit = auditS5AuthorityIdentity(rows);
  if (!audit.pass) throw new Error("S5 authority semantics cannot bind before identity preflight passes");
  const binding = getS5AuthorityIdentityBinding(owner);
  supersededByRegistrationId.clear();
  s5ClassByRegistrationId.clear();
  for (const [semanticName, cls] of s5Class) {
    const registrationId = binding.registrationIdBySemanticName[semanticName];
    if (registrationId) s5ClassByRegistrationId.set(registrationId, cls);
  }
  for (const [semanticName, replacementSemanticName] of supersededBy) {
    const registrationId = binding.registrationIdBySemanticName[semanticName];
    const replacementId = binding.registrationIdBySemanticName[replacementSemanticName];
    if (registrationId) supersededByRegistrationId.set(registrationId, replacementId ?? replacementSemanticName);
  }
}

export function getSupersededByRegistrationId(registrationId: string): string | undefined {
  return supersededByRegistrationId.get(registrationId);
}

export function getS5ClassByRegistrationId(registrationId: string): S5Class | undefined {
  return s5ClassByRegistrationId.get(registrationId);
}

export function applyDriveSupersession(names: string[]): void {
  for (const name of names) {
    if (name === "DRIVE_ENVELOPE" || name === "DRIVE_FACE_AFT") markSuperseded(name, "S5_THRUST_CAN");
    else if (name === "DRIVE_SPINE" || name.startsWith("DRIVE_SHOE_") || name.startsWith("DRIVE_RAIL_")) {
      markS5Class(name, "RETAINED_S4A_PHYSICAL");
    }
  }
}

/** Disable the frozen brick/cap as live material without editing S4A builders. */
export function physicallySupersedeLegacy(solids: AuthoritySolid[]): void {
  for (const s of solids) {
    if (s.name !== "DRIVE_ENVELOPE" && s.name !== "DRIVE_FACE_AFT") continue;
    s.node.setEnabled(false);
    const mesh = s.node as { visibility?: number; isVisible?: boolean };
    if (typeof mesh.visibility === "number") mesh.visibility = 0;
    markSuperseded(s.name, "S5_THRUST_CAN");
  }
}

/** Post-registration mutation path: selection and material authority are ID-only. */
export function physicallySupersedeLegacyByRegistrationId(owner: object, solids: AuthoritySolid[]): void {
  const binding = getS5AuthorityIdentityBinding(owner);
  const rowsById = new Map(solids.map((row) => [registrationIdOf(row), row]));
  const replacementId = binding.registrationIdBySemanticName.S5_THRUST_CAN;
  for (const semanticName of ["DRIVE_ENVELOPE", "DRIVE_FACE_AFT"] as const) {
    const registrationId = binding.registrationIdBySemanticName[semanticName];
    const s = rowsById.get(registrationId);
    if (!s) continue;
    s.node.setEnabled(false);
    const mesh = s.node as { visibility?: number; isVisible?: boolean };
    if (typeof mesh.visibility === "number") mesh.visibility = 0;
    supersededByRegistrationId.set(registrationId, replacementId);
    s5ClassByRegistrationId.set(registrationId, "LEGACY_SUPERSEDED_REFERENCE");
  }
}

export function reenableLegacyByRegistrationId(owner: object, solids: AuthoritySolid[], semanticName: string): void {
  const binding = getS5AuthorityIdentityBinding(owner);
  const registrationId = binding.registrationIdBySemanticName[semanticName];
  const s = solids.find((row) => registrationIdOf(row) === registrationId);
  if (!s) return;
  s.role = "physical";
  s.node.setEnabled(true);
  const mesh = s.node as { visibility?: number };
  if (typeof mesh.visibility === "number") mesh.visibility = 1;
  supersededByRegistrationId.delete(registrationId);
  s5ClassByRegistrationId.set(registrationId, "LIVE_MATERIAL_PHYSICAL");
}

export function isS5MaterialRegistration(registrationId: string, role: string, enabled = true): boolean {
  return role === "physical" && enabled && !supersededByRegistrationId.has(registrationId);
}

export function meshEnabled(node: { isEnabled?: (checkParents?: boolean) => boolean }): boolean {
  return typeof node.isEnabled === "function" ? node.isEnabled(true) : true;
}
