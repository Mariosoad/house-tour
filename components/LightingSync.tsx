"use client";

import { useFrame } from "@react-three/fiber";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useLighting } from "@/lib/lightingContext";
import { useMetrics } from "@/lib/metricsContext";
import { getLightingAtProgress } from "@/lib/waypoints";

/** Actualiza tourTimeOfDay/tourSunRotation cada frame con el t suavizado de la cámara, para que la luz se mueva en sync con la cámara. */
export function LightingSync() {
  const { cameraTRef } = useTourScroll();
  const { setTourLighting } = useLighting();
  const { freeCamera } = useMetrics();

  useFrame(() => {
    if (freeCamera) return;
    const t = cameraTRef.current;
    const { timeOfDay, sunRotation } = getLightingAtProgress(t);
    setTourLighting(timeOfDay, sunRotation);
  });

  return null;
}
