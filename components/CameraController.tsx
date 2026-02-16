"use client";

import { OrbitControls } from "@react-three/drei";
import { useMetrics } from "@/lib/metricsContext";

/** When freeCamera is true, enables OrbitControls so the user can orbit/pan/zoom freely. */
export function CameraController() {
  const { freeCamera } = useMetrics();
  if (!freeCamera) return null;
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      target={[0, 0, 0]}
      makeDefault
    />
  );
}
