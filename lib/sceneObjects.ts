import * as THREE from "three";

export type SceneObjectInfo = {
  name: string;
  type: string;
  isMesh: boolean;
  materialName?: string;
  /** Path from root (e.g. "Scene/Casona/Muro_01") for unique identification */
  path: string;
};

/**
 * Recursively traverses a Three.js object (e.g. loaded GLTF scene)
 * and returns a flat list of all objects with name, type, and optional material.
 * Use this to know which object names to target when applying materials/shaders.
 */
export function getSceneObjectsList(root: THREE.Object3D): SceneObjectInfo[] {
  const list: SceneObjectInfo[] = [];

  root.traverse((obj) => {
    const name = obj.name || "(sin nombre)";
    const path = getObjectPath(obj);
    const isMesh = (obj as THREE.Mesh).isMesh === true;
    const mesh = obj as THREE.Mesh;
    const materialName = isMesh && mesh.material
      ? (Array.isArray(mesh.material)
          ? mesh.material.map((m) => (m as THREE.Material).name || "(material)").join(", ")
          : (mesh.material as THREE.Material).name || "(material)")
      : undefined;

    list.push({
      name,
      type: obj.type,
      isMesh,
      materialName,
      path,
    });
  });

  return list;
}

function getObjectPath(obj: THREE.Object3D): string {
  const parts: string[] = [];
  let current: THREE.Object3D | null = obj;
  while (current) {
    parts.unshift(current.name || current.type);
    current = current.parent;
  }
  return parts.join("/");
}
