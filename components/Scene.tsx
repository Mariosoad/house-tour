"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { Light_Environment } from "./LightEnvironment";
import { House } from "./House";

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
  /** When true, avoid MeshDepthMaterial/ShaderMaterial (ContactShadows and light shadows disabled for WebGPU). */
  webgpu?: boolean;
  contactShadows?: {
    enabled?: boolean;
    opacity?: number;
    blur?: number;
    far?: number;
    resolution?: number;
    scaleMultiplier?: number;
  };
};

export function Scene({
  timeOfDay = 0.4,
  sunRotation = 0,
  webgpu: _webgpu = false,
  contactShadows: _contactShadows,
}: SceneProps) {
  const houseGroupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const g = houseGroupRef.current;
    if (!g) return;

    // Scale to a predictable size so the tour camera sees it.
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDim) || maxDim <= 0) return;

    const desiredMaxDim = 6; // world units
    const s = desiredMaxDim / maxDim;
    g.scale.setScalar(s);
    g.updateWorldMatrix(true, true);

    // Recompute and center on X/Z, place on ground (minY -> 0).
    const box2 = new THREE.Box3().setFromObject(g);
    const center = box2.getCenter(new THREE.Vector3());
    g.position.x += -center.x;
    g.position.z += -center.z;
    g.updateWorldMatrix(true, true);
    const box3 = new THREE.Box3().setFromObject(g);
    g.position.y += -box3.min.y;
  }, []);

  return (
    <>
      <Light_Environment timeOfDay={timeOfDay} sunRotation={sunRotation} />
      <group ref={houseGroupRef}>
        <House />
      </group>
    </>
  );
}