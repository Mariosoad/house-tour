"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { TourScrollProvider, useTourScroll } from "@/lib/tourScrollContext";
import { MetricsProvider, useMetrics } from "@/lib/metricsContext";
import { Scene } from "@/components/Scene";
import { ScrollTour } from "@/components/ScrollTour";
import { CameraController } from "@/components/CameraController";
import { FPSReporter } from "@/components/FPSReporter";
import { WaypointsUI } from "@/components/WaypointsUI";
import { LightingControls } from "@/components/LightingControls";
import { MetricsOverlay } from "@/components/MetricsOverlay";
import { SceneObjectsPanel } from "@/components/SceneObjectsPanel";

function FallbackContent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
}

function TourExperienceInner() {
  const { addDelta } = useTourScroll();
  const { freeCamera } = useMetrics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState(0.35);
  const [sunRotation, setSunRotation] = useState(0);
  const onTimeOfDayChange = useCallback((v: number) => setTimeOfDay(v), []);
  const onSunRotationChange = useCallback((v: number) => setSunRotation(v), []);

  useEffect(() => {
    if (freeCamera) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addDelta(e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [addDelta, freeCamera]);

  return (
    <>
      <div
        ref={containerRef}
        className="tour-container"
        role="application"
        aria-label="3D scroll tour"
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [8, 3.5, 8], fov: 42, near: 0.1, far: 100 }}
          gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 1, outputColorSpace: "srgb" }}
          shadows
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <Suspense fallback={<FallbackContent />}>
            <Scene timeOfDay={timeOfDay} sunRotation={sunRotation} />
            <ScrollTour />
            <CameraController />
            <FPSReporter />
          </Suspense>
        </Canvas>

        <MetricsOverlay />
        <SceneObjectsPanel />

        <div className="overlay-scroll-hint">
          <span className="overlay-glass">Scroll to explore</span>
        </div>

        <WaypointsUI />
        <LightingControls
          timeOfDay={timeOfDay}
          sunRotation={sunRotation}
          onTimeOfDayChange={onTimeOfDayChange}
          onSunRotationChange={onSunRotationChange}
        />
      </div>
    </>
  );
}

export function Experience() {
  return (
    <TourScrollProvider>
      <MetricsProvider>
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
          <TourExperienceInner />
        </div>
      </MetricsProvider>
    </TourScrollProvider>
  );
}
