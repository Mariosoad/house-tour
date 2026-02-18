"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type * as THREEType from "three";

type GLTFResult = { scene: THREEType.Group };

const MODEL_URL = "/DeluxeVilla.glb";

export function House() {
  const { scene } = useGLTF(MODEL_URL) as unknown as GLTFResult;

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREEType.Mesh).isMesh) {
        const mesh = obj as THREEType.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (Array.isArray(mesh.material)) {
          const materials = mesh.material;
          materials.forEach((mat, i) => {
            if (mat.name === "Vidrio") {
              materials[i] = new THREE.MeshPhysicalMaterial({
                transmission: 1,
                transparent: true,
                roughness: 0,
                metalness: 0,
              });
            }
          });
        } else if (mesh.material?.name === "Vidrio") {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            transparent: true,
            roughness: 0,
            metalness: 0,
          });
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(MODEL_URL);
