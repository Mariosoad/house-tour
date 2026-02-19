"use client";

import type { RefObject } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

type MirrorReplicaProps = {
  sourceMesh: THREE.Mesh;
  parentGroupRef: RefObject<THREE.Group | null>;
};

/** Renders a mesh with MeshReflectorMaterial, syncing its matrix from the source (hidden) mesh. */
export function MirrorReplica({ sourceMesh, parentGroupRef }: MirrorReplicaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matrix = useRef(new THREE.Matrix4());
  const invParent = useRef(new THREE.Matrix4());

  useFrame(() => {
    const mesh = meshRef.current;
    const parent = parentGroupRef.current;
    if (!mesh || !sourceMesh || !parent) return;
    invParent.current.copy(parent.matrixWorld).invert();
    matrix.current.copy(invParent.current).multiply(sourceMesh.matrixWorld);
    mesh.matrix.copy(matrix.current);
    mesh.matrixAutoUpdate = false;
  });

  const geom = sourceMesh.geometry;
  if (!geom) return null;

  return (
    <mesh ref={meshRef} geometry={geom}>
      <MeshReflectorMaterial
        blur={[0, 0]}
        resolution={512}
        mixBlur={0}
        mixStrength={1}
        mirror={1}
        minDepthThreshold={0.9}
        maxDepthThreshold={1}
      />
    </mesh>
  );
}
