"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "./EffectComposer";
import { useMetrics } from "@/lib/metricsContext";
import { Light_Environment } from "./LightEnvironment";
import { House } from "./House";

import {
  BloomEffect,
  VignetteEffect,
  BrightnessContrastEffect,
  ToneMappingEffect,
} from "postprocessing";
import { SSAO as SSAOEffect } from "./effects/SSAO";

/**
 * Cambia este valor para probar diferentes efectos de postprocesado.
 * Opciones: 'ssao' | 'bloom' | 'vignette' | 'brightnessContrast' | 'toneMapping'
 */
const ACTIVE_POST_EFFECT: "ssao" | "bloom" | "vignette" | "brightnessContrast" | "toneMapping" = "ssao";

import { CopyPass } from "postprocessing";

/** CopyPass as final pass: linear → sRGB conversion for correct colors. */
function OutputPass() {
  const pass = useMemo(() => new CopyPass(), []);
  return <primitive object={pass} />;
}

function BloomEffectPrimitive() {
  const instance = useMemo(
    () => new BloomEffect({ luminanceThreshold: 0.9, mipmapBlur: true, intensity: 0.5 }),
    []
  );
  return <primitive object={instance} dispose={null} />;
}

function VignetteEffectPrimitive() {
  const instance = useMemo(() => new VignetteEffect({ offset: 0.5, darkness: 0.8 }), []);
  return <primitive object={instance} dispose={null} />;
}

function BrightnessContrastEffectPrimitive() {
  const instance = useMemo(() => new BrightnessContrastEffect({ brightness: 0.05, contrast: 0.1 }), []);
  return <primitive object={instance} dispose={null} />;
}

function ToneMappingEffectPrimitive() {
  const instance = useMemo(() => new ToneMappingEffect(), []);
  return <primitive object={instance} dispose={null} />;
}

function PostEffects() {
  const needsNormalPass = ACTIVE_POST_EFFECT === "ssao";

  const activeEffect =
    ACTIVE_POST_EFFECT === "ssao" ? (
      <SSAOEffect
        radius={0.1}
        intensity={1.3}
        bias={0.03}
        samples={32}
        rings={4}
        luminanceInfluence={0.5}
      />
    ) : ACTIVE_POST_EFFECT === "bloom" ? (
      <BloomEffectPrimitive />
    ) : ACTIVE_POST_EFFECT === "vignette" ? (
      <VignetteEffectPrimitive />
    ) : ACTIVE_POST_EFFECT === "brightnessContrast" ? (
      <BrightnessContrastEffectPrimitive />
    ) : (
      <ToneMappingEffectPrimitive />
    );

  const needsToneMappingCompensation = ACTIVE_POST_EFFECT !== "toneMapping";

  return (
    <EffectComposer enableNormalPass={needsNormalPass} multisampling={0}>
      {activeEffect}
      {needsToneMappingCompensation ? <ToneMappingEffectPrimitive /> : <></>}
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