"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getSceneObjectsList } from "@/lib/sceneObjects";

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
};

function sunPosition(timeOfDay: number, sunRotationDeg: number): THREE.Vector3 {
  const hour = 5 + timeOfDay * 14; // 5 AM -> 9 PM
  const angle = ((hour - 5) / 14) * Math.PI; // 0 at 5 AM, PI at 9 PM
  const radius = 35;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.6 + 8;
  const z = Math.sin(angle * 0.5) * radius * 0.3;
  const v = new THREE.Vector3(x, y, z);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), (sunRotationDeg * Math.PI) / 180);
  return v;
}

function sunColorAndIntensity(timeOfDay: number): { color: THREE.Color; intensity: number } {
  const hour = 5 + timeOfDay * 14;
  const t = (hour - 5) / 14;
  const midday = 0.5;
  const distFromMidday = Math.abs(t - midday) * 2;
  const warmth = 1 - distFromMidday;
  const kelvin = 5500 + warmth * 3500;
  const intensity = 1.2 + (1 - distFromMidday) * 1.8;
  const r = kelvin <= 6600 ? 1 : Math.min(1, 1.292 - (kelvin - 6600) / 3400);
  const g =
    kelvin <= 6600
      ? Math.min(1, 0.39 * Math.log(kelvin / 100 - 2) - 0.26)
      : Math.min(1, 0.543 + ((kelvin - 6600) / 3400) * 0.18);
  const b =
    kelvin <= 2000 ? 0 : kelvin <= 6600 ? 0.543 + ((kelvin - 2000) / 4600) * 0.2 : 1;
  return { color: new THREE.Color(r, g, b), intensity: Math.min(3, intensity * 1.5) };
}

export function Scene({ timeOfDay = 0.35, sunRotation = 0 }: SceneProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  lightTarget.position.set(0, 0, 0);

  const { scene } = useGLTF("/Casona.gltf");
  const objectsList = useMemo(() => getSceneObjectsList(scene), [scene]);

  useEffect(() => {
    if (objectsList.length === 0) return;
    if (typeof window === "undefined") return;
    console.log("[Casona.gltf] Objetos en la escena (para materiales/shaders):", objectsList);
    window.dispatchEvent(
      new CustomEvent("scene-objects-loaded", { detail: { objects: objectsList } })
    );
  }, [objectsList]);

  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.15,
      ior: 1.5,
      transparent: true,
      side: THREE.DoubleSide,
      envMapIntensity: 1,
      attenuationColor: new THREE.Color(0.95, 0.98, 1),
      attenuationDistance: 0.5,
    });
  }, []);

  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.startsWith("SM_Window_")) {
          mesh.material = glassMaterial;
          mesh.castShadow = false;
          mesh.receiveShadow = true;
        } else {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      }
    });
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 20 / maxDim;
    c.scale.setScalar(scale);
    c.position.sub(center.multiplyScalar(scale));
    return c;
  }, [scene, glassMaterial]);

  const pos = sunPosition(timeOfDay, sunRotation);
  const { color, intensity } = sunColorAndIntensity(timeOfDay);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.copy(pos);
      sunRef.current.color.copy(color);
      sunRef.current.intensity = intensity;
      sunRef.current.target.position.set(0, 0, 0);
      sunRef.current.target.updateMatrixWorld();
      sunRef.current.shadow.updateMatrices(sunRef.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <primitive object={lightTarget} />
      <directionalLight
        ref={sunRef}
        position={[pos.x, pos.y, pos.z]}
        target={lightTarget}
        intensity={intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={0.5}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <primitive object={clone} />
      <color attach="background" args={["#1a1a22"]} />
    </>
  );
}
