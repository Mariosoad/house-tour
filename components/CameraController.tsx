"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMetrics } from "@/lib/metricsContext";

/** When freeCamera is true, enables OrbitControls so the user can orbit/pan/zoom freely. */
export function CameraController() {
  const { freeCamera } = useMetrics();
  const camera = useThree((s) => s.camera);
  if (!freeCamera) return null;
  return (
    <OrbitControls
      camera={camera}
      enableDamping
      dampingFactor={0.05}
      target={[0, 0, 0]}
      makeDefault
      enableRotate
      enablePan
      enableZoom
      screenSpacePanning
      minDistance={1}
      maxDistance={50}
    />
  );
}
