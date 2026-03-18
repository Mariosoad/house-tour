"use client";

import type { MutableRefObject, RefObject } from "react";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMetrics } from "@/lib/metricsContext";

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
  const scene = useThree((s) => s.scene);
  const matrix = useRef(new THREE.Matrix4());
  const invParent = useRef(new THREE.Matrix4());
  const { effectiveTier } = useMetrics();

  // Coste: evitar allocations dentro de `useFrame`.
  const rotMatStatic = useMemo(() => {
    const rx = rotationX ?? 0;
    const ry = rotationY ?? 0;
    const rz = rotationZ ?? 0;
    const hasRotation = rx !== 0 || ry !== 0 || rz !== 0;
    if (!hasRotation) return null;
    const degToRad = (deg: number) => deg * (Math.PI / 180);
    const euler = new THREE.Euler(degToRad(rx), degToRad(ry), degToRad(rz));
    const m = new THREE.Matrix4();
    m.makeRotationFromEuler(euler);
    return m;
  }, [rotationX, rotationY, rotationZ]);

  const translMatStatic = useMemo(() => {
    const ox = offsetX ?? 0;
    const oy = offsetY ?? 0;
    const oz = offsetZ ?? 0;
    const hasOffset = ox !== 0 || oy !== 0 || oz !== 0;
    if (!hasOffset) return null;
    const m = new THREE.Matrix4();
    m.makeTranslation(ox, oy, oz);
    return m;
  }, [offsetX, offsetY, offsetZ]);

  // En móvil low-end evitamos el costo del render-to-texture de reflejos.
  const mirrorEnabled = effectiveTier !== "low";

  useFrame(() => {
    if (!mirrorEnabled) return;
    const mesh = meshRef.current;
    const parent = parentGroupRef.current;
    if (!mesh || !sourceMesh || !parent) return;
    sourceMesh.updateMatrixWorld(true);
    parent.updateMatrixWorld(true);
    invParent.current.copy(parent.matrixWorld).invert();

    matrix.current.copy(invParent.current).multiply(sourceMesh.matrixWorld);

    if (rotMatStatic) {
      matrix.current.premultiply(rotMatStatic);
    }

    if (translMatStatic) {
      matrix.current.premultiply(translMatStatic);
    }

    mesh.matrix.copy(matrix.current);
    mesh.matrixAutoUpdate = false;
  });

  const geometry = useMemo(() => createMirrorPlaneGeometry(sourceMesh), [sourceMesh]);
  const reflectorResolution = effectiveTier === "low" ? 512 : 1024;
  const setRef = useCallback((node: THREE.Mesh | null) => {
    (meshRef as MutableRefObject<THREE.Mesh | null>).current = node;
    if (node) node.userData.cannotReceiveAO = true; // Excluir del SSAO para evitar oscurecimiento
  }, []);
  if (!mirrorEnabled || !geometry) return null;

  return (
    <mesh ref={setRef} geometry={geometry} renderOrder={1}>
      <MeshReflectorMaterial
        color="#ffffff"
        emissive="#000"
        emissiveIntensity={0}
        mixContrast={1}
        blur={[0, 0]}
        resolution={reflectorResolution}
        mixBlur={0}
        mixStrength={1}
        mirror={1}
        minDepthThreshold={0}
        maxDepthThreshold={1}
        reflectorOffset={0.001}
        envMap={scene.environment}
      />
    </mesh>
  );
}
