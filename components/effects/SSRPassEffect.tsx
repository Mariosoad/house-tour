/* eslint-disable react-hooks/immutability */
"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { SSRPass } from "three/addons/postprocessing/SSRPass.js";
import * as THREE from "three";

type SSRPassEffectProps = {
  enabled?: boolean;
  intensity?: number;
  maxRoughness?: number;
  blur?: boolean;
  blurMix?: number;
  width?: number;
  height?: number;
};

function collectReflectiveMeshes(root: THREE.Object3D, maxRoughness: number): THREE.Mesh[] {
  const selected: THREE.Mesh[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const isReflective = materials.some((material) => {
      const mat = material as THREE.Material & { roughness?: number };
      return typeof mat?.roughness === "number" && mat.roughness <= maxRoughness;
    });
    if (isReflective) selected.push(mesh);
  });
  return selected;
}

export function SSRPassEffect({
  enabled = true,
  intensity = 0.9,
  maxRoughness = 0.45,
  blur = true,
  blurMix = 0.45,
  width,
  height,
}: SSRPassEffectProps) {
  const { gl, scene, camera, size } = useThree();
  const pass = useMemo(() => {
    const reflectiveMeshes = collectReflectiveMeshes(scene, maxRoughness);
    const ssrPass = new SSRPass({
      renderer: gl,
      scene,
      camera,
      width: width ?? size.width,
      height: height ?? size.height,
      selects: reflectiveMeshes,
      groundReflector: null,
    });
    ssrPass.opacity = intensity;
    ssrPass.blur = blur;
    ssrPass.resolutionScale = blur ? Math.max(0.3, 1 - blurMix * 0.7) : 1;
    return ssrPass;
  }, [gl, scene, camera, size.width, size.height, width, height, intensity, blur, blurMix, maxRoughness]);

  pass.enabled = enabled;
  return <primitive object={pass} dispose={null} />;
}
