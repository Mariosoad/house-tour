import * as THREE from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * WebGPU post-processing without MRT to avoid "Invalid ShaderModule fragment_RTT" errors.
 * Uses a single-output pass + optional bloom. SSR and SMAA are disabled (they required MRT).
 */
export function WebGPUPostProcessing({
  enabled = true,
  strength = 2.5,
  radius = 0.5,
  quality = "default",
}: {
  enabled?: boolean;
  strength?: number;
  radius?: number;
  quality?: string;
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postProcessingRef = useRef<InstanceType<typeof THREE.PostProcessing> | null>(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return;
    const r = renderer as unknown as InstanceType<typeof THREE.WebGPURenderer>;

    const scenePass = pass(scene, camera, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, strength, radius, 0.8);
    const outputNode = enabled ? scenePassColor.add(bloomPass) : scenePassColor;

    const postProcessing = new THREE.PostProcessing(r);
    postProcessing.outputNode = outputNode;
    postProcessingRef.current = postProcessing;

    return () => {
      postProcessingRef.current = null;
    };
  }, [renderer, scene, camera, strength, radius, quality, enabled]);

  useFrame(({ gl }) => {
    if (postProcessingRef.current) {
      gl.clear();
      postProcessingRef.current.render();
    }
  }, 1);

  return null;
}
