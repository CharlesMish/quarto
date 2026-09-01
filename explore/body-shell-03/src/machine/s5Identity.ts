import type { AuthoritySolid } from "./authority";

export type S5RegisteredAuthoritySolid = AuthoritySolid & { readonly registrationId: string };

export interface S5AuthorityIdentityBinding {
  readonly registeredRows: number;
  /** Frozen once, immediately after unique-name registration succeeds. */
  readonly registrationIdBySemanticName: Readonly<Record<string, string>>;
  readonly semanticNameByRegistrationId: Readonly<Record<string, string>>;
}

export interface S5AuthorityIdentityAudit {
  pass: boolean;
  registeredRows: number;
  duplicateRegistrationIds: Array<{ registrationId: string; names: string[] }>;
  duplicateNames: Array<{ name: string; registrationIds: string[] }>;
  metadataMismatches: Array<{ registrationId: string; name: string; metadataId?: string }>;
}

function formatRegistrationId(index: number): string {
  return `AUTHORITY_ROW_${index.toString(36).toUpperCase().padStart(6, "0")}`;
}

const authorityBindings = new WeakMap<object, S5AuthorityIdentityBinding>();

/**
 * S5-only closed-world registration. The frozen S4 authority sources build
 * their rows unchanged; after S5 assembly is complete this kernel assigns an
 * opaque immutable proof identity to every frozen-candidate authority row.
 */
export function registerS5AuthorityUniverse(owner: object, rows: AuthoritySolid[]): S5AuthorityIdentityBinding {
  const names = new Map<string, number>();
  for (const row of rows) names.set(row.name, (names.get(row.name) ?? 0) + 1);
  const duplicates = [...names].filter(([, count]) => count !== 1).map(([name]) => name);
  if (duplicates.length) {
    throw new Error(`S5 authority registration rejected duplicate names: ${duplicates.sort().join(",")}`);
  }
  rows.forEach((row, index) => {
    const registrationId = formatRegistrationId(index + 1);
    Object.defineProperty(row, "registrationId", {
      value: registrationId,
      enumerable: true,
      writable: false,
      configurable: false,
    });
    row.node.metadata = { ...(row.node.metadata ?? {}), authorityRegistrationId: registrationId };
  });
  const registrationIdBySemanticName = Object.freeze(
    Object.fromEntries(rows.map((row) => [row.name, registrationIdOf(row)])),
  );
  const semanticNameByRegistrationId = Object.freeze(
    Object.fromEntries(rows.map((row) => [registrationIdOf(row), row.name])),
  );
  const binding = Object.freeze({
    registeredRows: rows.length,
    registrationIdBySemanticName,
    semanticNameByRegistrationId,
  });
  authorityBindings.set(owner, binding);
  return binding;
}

export function getS5AuthorityIdentityBinding(owner: object): S5AuthorityIdentityBinding {
  const binding = authorityBindings.get(owner);
  if (!binding) throw new Error("S5 authority identity binding is absent");
  return binding;
}

export function registrationIdForSemanticName(owner: object, semanticName: string): string {
  const registrationId = getS5AuthorityIdentityBinding(owner).registrationIdBySemanticName[semanticName];
  if (!registrationId) throw new Error(`S5 semantic authority row is unbound: ${semanticName}`);
  return registrationId;
}

export function registrationIdOf(row: AuthoritySolid): string {
  const registrationId = (row as Partial<S5RegisteredAuthoritySolid>).registrationId;
  if (!registrationId) throw new Error(`S5 authority row lacks registration ID: ${row.name}`);
  return registrationId;
}

export function auditS5AuthorityIdentity(rows: readonly AuthoritySolid[]): S5AuthorityIdentityAudit {
  const ids = new Map<string, AuthoritySolid[]>();
  const names = new Map<string, AuthoritySolid[]>();
  const metadataMismatches: S5AuthorityIdentityAudit["metadataMismatches"] = [];
  for (const row of rows) {
    const registrationId = registrationIdOf(row);
    const byId = ids.get(registrationId) ?? [];
    byId.push(row);
    ids.set(registrationId, byId);
    const byName = names.get(row.name) ?? [];
    byName.push(row);
    names.set(row.name, byName);
    const metadataId = (row.node.metadata as { authorityRegistrationId?: string } | undefined)
      ?.authorityRegistrationId;
    if (metadataId !== registrationId) {
      metadataMismatches.push({ registrationId, name: row.name, metadataId });
    }
  }
  const duplicateRegistrationIds = [...ids]
    .filter(([, grouped]) => grouped.length !== 1)
    .map(([registrationId, grouped]) => ({ registrationId, names: grouped.map((row) => row.name).sort() }));
  const duplicateNames = [...names]
    .filter(([, grouped]) => grouped.length !== 1)
    .map(([name, grouped]) => ({ name, registrationIds: grouped.map(registrationIdOf).sort() }));
  return {
    pass: duplicateRegistrationIds.length === 0 && duplicateNames.length === 0 && metadataMismatches.length === 0,
    registeredRows: rows.length,
    duplicateRegistrationIds,
    duplicateNames,
    metadataMismatches,
  };
}
