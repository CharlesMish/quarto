import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";

export function node(name: string, scene: Scene, parent?: Node | null): TransformNode {
  const n = new TransformNode(name, scene);
  if (parent) n.parent = parent;
  return n;
}

export function box(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  size: [number, number, number],
  position: [number, number, number],
  opts?: { rotation?: [number, number, number]; pickable?: boolean },
): Mesh {
  const mesh = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
  mesh.parent = parent;
  mesh.material = material;
  mesh.position.set(...position);
  if (opts?.rotation) mesh.rotation.set(...opts.rotation);
  mesh.isPickable = opts?.pickable ?? true;
  mesh.receiveShadows = true;
  mesh.metadata = { ...(mesh.metadata ?? {}), size, kind: "box" };
  return mesh;
}

export function cyl(
  scene: Scene,
  name: string,
  parent: Node,
  material: Material,
  height: number,
  diameter: number,
  position: [number, number, number],
  rotation?: [number, number, number],
): Mesh {
  const mesh = MeshBuilder.CreateCylinder(
    name,
    { height, diameter, tessellation: 14 },
    scene,
  );
  mesh.parent = parent;
  mesh.material = material;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.receiveShadows = true;
  mesh.metadata = { ...(mesh.metadata ?? {}), size: [diameter, height, diameter], kind: "cylinder" };
  return mesh;
}
