"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { TourScrollProvider, useTourScroll } from "@/lib/tourScrollContext";
import { MetricsProvider, useMetrics } from "@/lib/metricsContext";
import { Scene } from "@/components/Scene";
import { ScrollTour } from "@/components/ScrollTour";
import { CameraDebugUpdater } from "@/components/CameraDebugUpdater";
import { CameraController } from "@/components/CameraController";
import { FPSReporter } from "@/components/FPSReporter";
import { WaypointsUI } from "@/components/WaypointsUI";
import { LightingControls } from "@/components/LightingControls";
import { MetricsOverlay } from "@/components/MetricsOverlay";
import { TourDebugOverlay } from "@/components/TourDebugOverlay";
import { TourDebugProvider } from "@/lib/tourDebugContext";
import { IntroOverlay } from "@/components/IntroOverlay";

function FallbackContent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
}

const sceneContactShadows = {
  opacity: 0.65,
  blur: 3,
  resolution: 1024,
  far: 5,
  scaleMultiplier: 1.2,
};

function TourExperienceInner() {
  const { addDelta } = useTourScroll();
  const { freeCamera } = useMetrics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState(0.849);  // 4:53 PM
  const [sunRotation, setSunRotation] = useState(30);
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
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.8,
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#111"]} />
          <Suspense fallback={<FallbackContent />}>
            <Scene
              timeOfDay={timeOfDay}
              sunRotation={sunRotation}
              webgpu={false}
              contactShadows={sceneContactShadows}
            />
            <ScrollTour />
            <CameraDebugUpdater />
            <CameraController />
            <FPSReporter />
          </Suspense>
        </Canvas>

        <MetricsOverlay />
        {/* <TourDebugOverlay /> */}
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
  const [showIntro, setShowIntro] = useState(true);

  const handleStartExperience = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <TourScrollProvider>
      <TourDebugProvider>
        <MetricsProvider>
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
          <TourExperienceInner />
          <IntroOverlay
            onStart={handleStartExperience}
            className={showIntro ? "" : "is-hidden"}
          />
        </div>
      </MetricsProvider>
      </TourDebugProvider>
    </TourScrollProvider>
  );
}
