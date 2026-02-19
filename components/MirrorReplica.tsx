"use client";

import type { RefObject } from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

type MirrorReplicaProps = {
  sourceMesh: THREE.Mesh;
  parentGroupRef: RefObject<THREE.Group | null>;
  rotationX?: number;  // grados
  rotationY?: number;
  rotationZ?: number;
  offsetX?: number;   // desplazamiento en ejes (sin girar)
  offsetY?: number;
  offsetZ?: number;
};

/**
 * Create a plane geometry matching the mirror's front face.
 * MeshReflectorMaterial requires a flat plane; box geometry causes half-black/wrong reflections.
 * Uses geometry bounding box (local) for size; mesh matrix handles position/rotation.
 */
function createMirrorPlaneGeometry(mesh: THREE.Mesh): THREE.PlaneGeometry | null {
  const geom = mesh.geometry;
  if (!geom) return null;
  geom.computeBoundingBox();
  const box = geom.boundingBox;
  if (!box) return null;

  const size = new THREE.Vector3();
  box.getSize(size);

  const minDim = Math.min(size.x, size.y, size.z);
  let width: number;
  let height: number;

  if (minDim === size.z) {
    width = size.x;
    height = size.y;
  } else if (minDim === size.y) {
    width = size.x;
    height = size.z;
  } else {
    width = size.y;
    height = size.z;
  }

  if (width < 0.01 || height < 0.01) return null;
  return new THREE.PlaneGeometry(width, height);
}

/** Renders a plane with MeshReflectorMaterial, synced to the mirror mesh position/orientation from the model (keeps mirror parallel to wall as designed). */
export function MirrorReplica({ sourceMesh, parentGroupRef, rotationX, rotationY, rotationZ, offsetX, offsetY, offsetZ }: MirrorReplicaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matrix = useRef(new THREE.Matrix4());
  const invParent = useRef(new THREE.Matrix4());

  const degToRad = (deg: number) => deg * (Math.PI / 180);
  const hasRotation = (rotationX ?? 0) !== 0 || (rotationY ?? 0) !== 0 || (rotationZ ?? 0) !== 0;
  const hasOffset = (offsetX ?? 0) !== 0 || (offsetY ?? 0) !== 0 || (offsetZ ?? 0) !== 0;
  const rotMat = useRef(new THREE.Matrix4());
  const translMat = useRef(new THREE.Matrix4());

  useFrame(() => {
    const mesh = meshRef.current;
    const parent = parentGroupRef.current;
    if (!mesh || !sourceMesh || !parent) return;
    sourceMesh.updateMatrixWorld(true);
    parent.updateMatrixWorld(true);
    invParent.current.copy(parent.matrixWorld).invert();

    matrix.current.copy(invParent.current).multiply(sourceMesh.matrixWorld);

    if (hasRotation) {
      const euler = new THREE.Euler(
        degToRad(rotationX ?? 0),
        degToRad(rotationY ?? 0),
        degToRad(rotationZ ?? 0),
      );
      rotMat.current.makeRotationFromEuler(euler);
      matrix.current.premultiply(rotMat.current);
    }

    if (hasOffset) {
      translMat.current.makeTranslation(offsetX ?? 0, offsetY ?? 0, offsetZ ?? 0);
      matrix.current.premultiply(translMat.current);
    }

    mesh.matrix.copy(matrix.current);
    mesh.matrixAutoUpdate = false;
  });

  const geometry = useMemo(() => createMirrorPlaneGeometry(sourceMesh), [sourceMesh]);
  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={1}>
      <MeshReflectorMaterial
        blur={[0, 0]}
        resolution={1024}
        mixBlur={0}
        mixStrength={1}
        mirror={1}
        minDepthThreshold={0}
        maxDepthThreshold={1}
        reflectorOffset={0.001}
      />
    </mesh>
  );
}
