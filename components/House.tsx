/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type * as THREEType from "three";
import { MirrorReplica } from "./MirrorReplica";

type GLTFResult = { scene: THREEType.Group };

const MODEL_URL = "/DeluxeVilla1.glb";

const GLASS_NAMES = /vidrio|glass|cristal|window|ventana|cerramiento|crystal|pane/i;
const MIRROR_NAMES = /espejo|mirror|reflector/i;
const FAN_ROTATION_SPEED = 3;

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

type HouseProps = {
  parentGroupRef: RefObject<THREE.Group | null>;
  wireframe?: boolean;
};

export function House({ parentGroupRef, wireframe = false }: HouseProps) {
  const { scene } = useGLTF(MODEL_URL) as unknown as GLTFResult;
  const [mirrorMeshes, setMirrorMeshes] = useState<THREE.Mesh[]>([]);
  const [fanMeshes, setFanMeshes] = useState<THREE.Mesh[]>([]);
  const [wireframeScene, setWireframeScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const mirrors: THREE.Mesh[] = [];
    const fans: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREEType.Mesh).isMesh) {
        const mesh = obj as THREEType.Mesh;
        // console.log("House mesh", mesh);
        let hasGlass = false;
        let hasMirror = false;
        if (mesh.name === "Mesh011"  || mesh.name === "Mesh010_1") {
          const fanRoot = mesh
            fans.push(fanRoot);
        }
        if (Array.isArray(mesh.material)) {
          const materials = mesh.material;
          materials.forEach((mat, i) => {
            if (isMirrorMaterial(mat)) {
              hasMirror = true;
            } else if (isGlassMaterial(mat)) {
              hasGlass = true;
              materials[i] = new THREE.MeshPhysicalMaterial({
                color: 0xcfe9ff,
                transmission: 1,
                opacity: 0.6,
                transparent: true,
                depthWrite: false,
                roughness: 0.1,
                metalness: 0,
                ior: 1.2,
                thickness: 0.5,
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
              color: 0xcfe9ff,
              transmission: 1,
              opacity: 0.6,
              transparent: true,
              depthWrite: false,
              roughness: 0.1,
              metalness: 0,
              ior: 1.2,
              thickness: 0.5,
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
    setFanMeshes(fans);
  }, [scene]);

  useEffect(() => {
    if (!scene) return;
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
        });
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    setWireframeScene(clone);
  }, [scene]);

  useFrame((_, delta) => {
    if (!fanMeshes.length) return;
  
    fanMeshes.forEach((fan) => {
      fan.rotateOnAxis(new THREE.Vector3(0, 0, 1), FAN_ROTATION_SPEED * delta);
    });
  });

  return (
    <>
      {wireframe && wireframeScene ? (
        <primitive object={wireframeScene} />
      ) : (
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
              offsetY={0.95}
              offsetZ={-3.29}
            />
          ))}
        </>
      )}
    </>
  );
}

useGLTF.preload(MODEL_URL);
