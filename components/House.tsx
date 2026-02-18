"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type * as THREEType from "three";

type GLTFResult = { scene: THREEType.Group };

const MODEL_URL = "/DeluxeVilla.glb";

const GLASS_NAMES = /vidrio|glass|cristal|window|ventana|cerramiento|crystal|pane/i;

function isGlassMaterial(mat: { name?: string; transmission?: number }): boolean {
  const name = mat?.name ?? "";
  if (GLASS_NAMES.test(name)) return true;
  if (typeof (mat as { transmission?: number }).transmission === "number" && (mat as { transmission: number }).transmission > 0.5) return true;
  return false;
}

export function House() {
  const { scene } = useGLTF(MODEL_URL) as unknown as GLTFResult;
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREEType.Mesh).isMesh) {
        const mesh = obj as THREEType.Mesh;
        let hasGlass = false;
        if (Array.isArray(mesh.material)) {
          const materials = mesh.material;
          materials.forEach((mat, i) => {
            if (isGlassMaterial(mat)) {
              hasGlass = true;
              materials[i] = new THREE.MeshPhysicalMaterial({
                transmission: 1,
                transparent: true,
                roughness: 0,
                metalness: 0,
                thickness: 0.5,
              });
            }
          });
        } else if (mesh.material) {
          if (isGlassMaterial(mesh.material)) {
            hasGlass = true;
            mesh.material = new THREE.MeshPhysicalMaterial({
              transmission: 1,
              transparent: true,
              roughness: 0,
              metalness: 0,
              thickness: 0.5,
            });
          }
        }
        mesh.castShadow = !hasGlass;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

useGLTF.preload(MODEL_URL);
