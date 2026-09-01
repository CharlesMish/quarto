import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AuthoritySolid } from "../machine/authority";
import type { DebugDatum } from "../machine/types";

export type DirectorObjectClass = "physical authority" | "diagnostic" | "presentation-only" | "unregistered visual";

export interface DirectorInspectionRow {
  displayName: string;
  semanticName: string;
  family: string;
  role: string;
  registrationId: string | null;
  authorityStage: string | null;
  objectClass: DirectorObjectClass;
  parent: string | null;
  enabled: boolean;
  visible: boolean;
  purpose: string;
}

export interface DirectorRenderRow extends DirectorInspectionRow {
  minimumWorld: [number, number, number] | null;
  maximumWorld: [number, number, number] | null;
}

function metadata(node: TransformNode): Record<string, unknown> {
  return (node.metadata ?? {}) as Record<string, unknown>;
}

function nearestDatum(node: TransformNode, datumsByNode: ReadonlyMap<TransformNode, DebugDatum>): DebugDatum | undefined {
  let cursor: TransformNode | null = node;
  while (cursor) {
    const datum = datumsByNode.get(cursor);
    if (datum) return datum;
    cursor = cursor.parent as TransformNode | null;
  }
  return undefined;
}

function fallbackPurpose(name: string, family: string): string {
  if (name.startsWith("S5_REG_PAD_")) return "S5 fixed register pad used by the seated register check.";
  if (name.includes("CATCH_CHEEK") || name.includes("CATCH_BACK")) return "Open passive U-throat capture/support member.";
  if (name.includes("LATCH_THROAT") || name.includes("LATCH_CHEEK")) return "Rear passive latch throat/support member.";
  if (name.startsWith("S5_LOCK_RAIL_")) return "Positive-thickness fixed cam-track working/support piece.";
  if (name.startsWith("S5_LOCK_SHOE_")) return "Pin-carried captive cam shoe.";
  if (name.startsWith("S5_LOCK_PIN_")) return "Retained S5 lock pin.";
  if (family === "grid" || name === "floor" || name.startsWith("grid")) return "Director-view ground reference.";
  return family ? `${family} assembly element.` : "Scene presentation element.";
}

export function describeDirectorMesh(
  mesh: AbstractMesh,
  solidsByNode: ReadonlyMap<TransformNode, AuthoritySolid>,
  datumsByNode: ReadonlyMap<TransformNode, DebugDatum>,
): DirectorInspectionRow {
  const solid = solidsByNode.get(mesh);
  const meta = metadata(mesh);
  const datum = nearestDatum(mesh, datumsByNode);
  const presentationOnly = meta.presentationOnly === true || mesh.name === "floor" || mesh.name.startsWith("grid");
  const objectClass: DirectorObjectClass = presentationOnly
    ? "presentation-only"
    : solid?.role === "physical"
      ? "physical authority"
      : solid
        ? "diagnostic"
        : "unregistered visual";
  const family = solid?.family ?? (typeof meta.family === "string" ? meta.family : presentationOnly ? "presentation" : "");
  const purpose =
    (typeof meta.purpose === "string" && meta.purpose) ||
    datum?.note ||
    fallbackPurpose(solid?.name ?? mesh.name, family);

  return {
    displayName: typeof meta.displayName === "string" ? meta.displayName : mesh.name,
    semanticName: solid?.name ?? (typeof meta.semanticName === "string" ? meta.semanticName : mesh.name),
    family,
    role: solid?.role ?? (presentationOnly ? "nonphysical presentation" : "visual"),
    registrationId:
      typeof meta.authorityRegistrationId === "string"
        ? meta.authorityRegistrationId
        : ((solid as (AuthoritySolid & { registrationId?: string }) | undefined)?.registrationId ?? null),
    authorityStage: solid?.slice ?? (typeof meta.authorityStage === "string" ? meta.authorityStage : null),
    objectClass,
    parent: mesh.parent?.name ?? null,
    enabled: mesh.isEnabled(),
    visible: mesh.isVisible && mesh.visibility > 0,
    purpose,
  };
}

export function renderRow(
  mesh: AbstractMesh,
  solidsByNode: ReadonlyMap<TransformNode, AuthoritySolid>,
  datumsByNode: ReadonlyMap<TransformNode, DebugDatum>,
): DirectorRenderRow {
  const row = describeDirectorMesh(mesh, solidsByNode, datumsByNode);
  if (!mesh.getBoundingInfo) return { ...row, minimumWorld: null, maximumWorld: null };
  mesh.computeWorldMatrix(true);
  const bounds = mesh.getBoundingInfo().boundingBox;
  return {
    ...row,
    minimumWorld: [bounds.minimumWorld.x, bounds.minimumWorld.y, bounds.minimumWorld.z],
    maximumWorld: [bounds.maximumWorld.x, bounds.maximumWorld.y, bounds.maximumWorld.z],
  };
}
