/* eslint-disable @typescript-eslint/prefer-as-const */
"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "./EffectComposer";
import { useMetrics } from "@/lib/metricsContext";
import { Light_Environment } from "./LightEnvironment";
import { House } from "./House";

import {
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { SSAO as SSAOEffect } from "./effects/SSAO";

const ACTIVE_POST_EFFECT: "ssao" = "ssao";

import { CopyPass } from "postprocessing";

/** CopyPass as final pass: linear → sRGB conversion for correct colors. */
function OutputPass() {
  const pass = useMemo(() => new CopyPass(), []);
  return <primitive object={pass} />;
}

/** ACES Filmic + exposure 1.0 to match Canvas config — avoids color shift when only AO is active */
function ToneMappingEffectPrimitive() {
  const instance = useMemo(
    () =>
      new ToneMappingEffect({
        mode: ToneMappingMode.ACES_FILMIC,
      }),
    []
  );
  return <primitive object={instance} dispose={null} />;
}

function PostEffects() {
  const needsNormalPass = ACTIVE_POST_EFFECT === "ssao";

  const activeEffect =
    ACTIVE_POST_EFFECT === "ssao" && (
      <SSAOEffect
        radius={0.05}
        intensity={1.7}
        rangeFalloff={0.5}
        bias={0.03}
        samples={32}
        rings={4}
        luminanceInfluence={0.5}
      />
    )

  return (
    <EffectComposer enableNormalPass={needsNormalPass} multisampling={0}>
      {activeEffect as React.ReactElement}
      <ToneMappingEffectPrimitive />
      <OutputPass />
    </EffectComposer>
  );
}

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
  /** When true, avoid MeshDepthMat erial/ShaderMaterial (ContactShadows disabled for WebGPU). */
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

  return (
    <>
      <Light_Environment timeOfDay={timeOfDay} sunRotation={sunRotation} />
      <group ref={houseGroupRef}>
        <House parentGroupRef={houseGroupRef} />
      </group>

      {ssaoEnabled && <PostEffects />}
    </>
  );
}