"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useLighting } from "@/lib/lightingContext";
import { useMetrics } from "@/lib/metricsContext";
import { getLightingAtProgress } from "@/lib/waypoints";

/** Actualiza tourTimeOfDay/tourSunRotation cada frame con el t suavizado de la cámara, para que la luz se mueva en sync con la cámara. */
export function LightingSync() {
  const { cameraTRef } = useTourScroll();
  const { setTourLighting } = useLighting();
  const { freeCamera, effectiveTier } = useMetrics();
  const lastUpdateRef = useRef(0);

  useFrame(() => {
    if (freeCamera) return;

    // Evita re-render de React en cada frame (caro en móvil).
    const now = performance.now();
    const updateIntervalMs = effectiveTier === "low" ? 150 : 50;
    if (now - lastUpdateRef.current < updateIntervalMs) return;
    lastUpdateRef.current = now;

    const t = cameraTRef.current;
    const { timeOfDay, sunRotation } = getLightingAtProgress(t);
    setTourLighting(timeOfDay, sunRotation);
  });

  return null;
}
