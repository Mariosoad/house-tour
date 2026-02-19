"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, SSAO } from "@react-three/postprocessing";
import { useMetrics } from "@/lib/metricsContext";
import { Light_Environment } from "./LightEnvironment";
import { House } from "./House";

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
  /** When true, avoid MeshDepthMaterial/ShaderMaterial (ContactShadows disabled for WebGPU). */
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
  webgpu = false,
  contactShadows: contactShadowsConfig,
}: SceneProps) {
  const houseGroupRef = useRef<THREE.Group>(null);
  const { ssaoEnabled } = useMetrics();

  useLayoutEffect(() => {
    const g = houseGroupRef.current;
    if (!g) return;

    // Asegurar que todas las geometrías tengan bounding box calculado (consistencia local/prod)
    g.updateWorldMatrix(true, true);
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        mesh.geometry.computeBoundingBox?.();
      }
    });

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

  const contactEnabled = contactShadowsConfig?.enabled !== false;

  return (
    <>
      <Light_Environment timeOfDay={timeOfDay} sunRotation={sunRotation} />
      <group ref={houseGroupRef}>
        <House />
      </group>
      {!webgpu && contactEnabled && (
        <ContactShadows
          position={[0, -0.005, 0]}
          scale={10}
          far={6}
          opacity={contactShadowsConfig?.opacity ?? 0.35}
          blur={contactShadowsConfig?.blur ?? 2}
          resolution={contactShadowsConfig?.resolution ?? 2048}
        />
      )}
      {ssaoEnabled && (
      <EffectComposer enableNormalPass resolutionScale={0.75}>
        {/* MICRO AO: detalles, uniones, contacto fino */}
        <SSAO
          samples={16}
          rings={4}
          radius={0.25}
          intensity={1.15}
          bias={0.02}
          distanceThreshold={0.8}
          distanceFalloff={0.4}
        />

        {/* MACRO AO: esquinas grandes MUY sutil */}
        <SSAO
          samples={8}
          rings={3}
          radius={1.2}
          intensity={0.22}
          bias={0.08}
          distanceThreshold={3.0}
          distanceFalloff={1.0}
        />
      </EffectComposer>
    )}
    </>
  );
}