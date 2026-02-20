"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type * as THREEType from "three";
import { MirrorReplica } from "./MirrorReplica";

type GLTFResult = { scene: THREEType.Group };

const MODEL_URL = "/DeluxeVilla.glb";

const GLASS_NAMES = /vidrio|glass|cristal|window|ventana|cerramiento|crystal|pane/i;
const MIRROR_NAMES = /espejo|mirror|reflector/i;

function isGlassMaterial(mat: { name?: string; transmission?: number }): boolean {
  const name = mat?.name ?? "";
  if (GLASS_NAMES.test(name)) return true;
  if (typeof (mat as { transmission?: number }).transmission === "number" && (mat as { transmission: number }).transmission > 0.5) return true;
  return false;
}

function isMirrorMaterial(mat: { name?: string }): boolean {
  const name = mat?.name ?? "";
  return MIRROR_NAMES.test(name);
}

export function House({ parentGroupRef }: { parentGroupRef: RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(MODEL_URL) as unknown as GLTFResult;
  const [mirrorMeshes, setMirrorMeshes] = useState<THREE.Mesh[]>([]);

  useEffect(() => {
    const mirrors: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREEType.Mesh).isMesh) {
        const mesh = obj as THREEType.Mesh;
        let hasGlass = false;
        let hasMirror = false;
        if (Array.isArray(mesh.material)) {
          const materials = mesh.material;
          materials.forEach((mat, i) => {
            if (isMirrorMaterial(mat)) {
              hasMirror = true;
            } else if (isGlassMaterial(mat)) {
              hasGlass = true;
              materials[i] = new THREE.MeshPhysicalMaterial({
                transmission: 1,
                transparent: true,
                depthWrite: false,
                roughness: 0,
                metalness: 0,
                thickness: 0.2,
              });
              mesh.userData.cannotReceiveAO = true;
            }
          });
        } else if (mesh.material) {
          if (isMirrorMaterial(mesh.material)) {
            hasMirror = true;
          } else if (isGlassMaterial(mesh.material)) {
            hasGlass = true;
            mesh.material = new THREE.MeshPhysicalMaterial({
              transmission: 1,
              transparent: true,
              depthWrite: false,
              roughness: 0,
              metalness: 0,
              thickness: 0.2,
            });
            mesh.userData.cannotReceiveAO = true;
          }
        }
        if (hasMirror) {
          mesh.visible = false;
          mirrors.push(mesh);
        } else {
          mesh.castShadow = !hasGlass;
          mesh.receiveShadow = true;
        }
      }
    });
    setMirrorMeshes(mirrors);
  }, [scene]);

  return (
    <>
      <primitive object={scene} />
      {mirrorMeshes.map((m) => (
          <MirrorReplica
            key={m.uuid}
            sourceMesh={m}
            parentGroupRef={parentGroupRef}
            rotationX={90}
            rotationY={0}
            rotationZ={0}
            offsetX={0}
            offsetY={0.15}
            offsetZ={-4.12}
          />
        ))}
    </>
  );
}

useGLTF.preload(MODEL_URL);
