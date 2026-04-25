/* eslint-disable @typescript-eslint/prefer-as-const */
"use client";

import { useLayoutEffect, useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import { EffectComposer } from "./EffectComposer";
import { useMetrics, type EffectiveTier } from "@/lib/metricsContext";
import { useLighting } from "@/lib/lightingContext";
import { Light_Environment } from "./LightEnvironment";
import { House } from "./House";
import { useRenderSettings } from "@/lib/renderSettingsContext";

import {
  ToneMappingEffect,
  ToneMappingMode,
  SMAAEffect,
  SMAAPreset,
} from "postprocessing";
import { N8AO } from "./effects/N8AO";

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

/** SMAA: HIGH en ultra, MEDIUM en low */
function SMAAEffectPrimitive({ effectiveTier }: { effectiveTier: EffectiveTier }) {
  const instance = useMemo(
    () =>
      new SMAAEffect({
        // En low evitamos costo extra sin perder demasiado contraste.
        preset: effectiveTier === "ultra" ? SMAAPreset.HIGH : SMAAPreset.MEDIUM,
      }),
    [effectiveTier]
  );
  return <primitive object={instance} dispose={null} />;
}

function PostEffects({ effectiveTier }: { effectiveTier: EffectiveTier }) {
  const { settings } = useRenderSettings();
  const needsNormalPass = settings.aoEnabled || settings.aoOnlyMode;
  const multisampling = settings.aaMsaaLevel;
  const aoActive = settings.aoEnabled || settings.aoOnlyMode;
  const effects: ReactElement[] = [];

  if (aoActive) {
    const aoIntensity = settings.aoOnlyMode ? Math.max(settings.aoIntensity, 1.2) : settings.aoIntensity;
    const aoRadius = settings.aoOnlyMode ? 5 : 4;
    effects.push(
      <N8AO
        key="ao"
        aoRadius={aoRadius}
        intensity={aoIntensity}
        aoSamples={effectiveTier === "low" ? 8 : 16}
        denoiseSamples={effectiveTier === "low" ? 2 : 4}
        denoiseRadius={effectiveTier === "low" ? 8 : 12}
        distanceFalloff={1}
        quality={effectiveTier === "low" ? "low" : "high"}
      />
    );
  }
  if (settings.aaSmaaEnabled) {
    effects.push(<SMAAEffectPrimitive key="smaa" effectiveTier={effectiveTier} />);
  }
  effects.push(<ToneMappingEffectPrimitive key="tone" />);
  effects.push(<OutputPass key="output" />);

  return (
    <EffectComposer
      enableNormalPass={needsNormalPass}
      multisampling={multisampling}
    >
      {effects}
    </EffectComposer>
  );
}

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
  wireframe?: boolean;
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
  wireframe = false,
}: SceneProps) {
  const houseGroupRef = useRef<THREE.Group>(null);
  const { ssaoEnabled, effectiveTier } = useMetrics();
  const { settings } = useRenderSettings();
  const { shadowScrubbing } = useLighting();

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
      <Light_Environment
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        effectiveTier={effectiveTier}
        shadowScrubbing={shadowScrubbing}
      />
      <group ref={houseGroupRef} 
      // rotation={[0, 1.5, 0]}
      >
        <House parentGroupRef={houseGroupRef} wireframe={wireframe} />
      </group>

      {(ssaoEnabled || settings.aoEnabled || settings.aoOnlyMode) && (
        <PostEffects effectiveTier={effectiveTier} />
      )}
    </>
  );
}