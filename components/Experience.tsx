"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { KeyboardControls } from "@react-three/drei";
import { TourScrollProvider, useTourScroll } from "@/lib/tourScrollContext";
import { LightingProvider, useLighting } from "@/lib/lightingContext";
import { MetricsProvider, useMetrics } from "@/lib/metricsContext";
import { Scene } from "@/components/Scene";
import { ScrollTour } from "@/components/ScrollTour";
import { LightingSync } from "@/components/LightingSync";
import { CameraDebugUpdater } from "@/components/CameraDebugUpdater";
import { CameraController } from "@/components/CameraController";
import { FPSReporter } from "@/components/FPSReporter";
import { WaypointsUI } from "@/components/WaypointsUI";
import { MetricsOverlay } from "@/components/MetricsOverlay";
import { TourBottomBar } from "@/components/TourBottomBar";
import { FullscreenButton } from "@/components/FullscreenButton";
import { TourDebugProvider } from "@/lib/tourDebugContext";
import { IntroOverlay } from "@/components/IntroOverlay";
import { LoadedReporter } from "@/components/LoadedReporter";

function FallbackContent() {
  return (
    <mesh>
      {/* <boxGeometry args={[1, 1, 1]} /> */}
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

function TourExperienceInner({
  hasStarted,
  onLoadingComplete,
  loadingPage,
}: {
  hasStarted: boolean;
  onLoadingComplete?: () => void;
  loadingPage: boolean;
}) {
  const { addDelta } = useTourScroll();
  const { freeCamera, effectiveTier, setFreeCamera } = useMetrics();
  const { timeOfDay, sunRotation, manualTimeOfDay, manualSunRotation, onTimeOfDayChange, onSunRotationChange, lightingOverride, setLightingOverride } = useLighting();
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveTimeOfDay = freeCamera ? manualTimeOfDay : timeOfDay;
  const effectiveSunRotation = freeCamera ? manualSunRotation : sunRotation;

  useEffect(() => {
    if (freeCamera) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addDelta(e.deltaY);
    };
    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY; // positivo = swipe hacia arriba = avanzar
      lastTouchY = currentY;
      addDelta(deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [addDelta, freeCamera]);

  const handleToggleFreeCamera = () => {
    setFreeCamera(!freeCamera);
  };

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
          dpr={
            effectiveTier === "low"
              ? [1, 1.5]
              : effectiveTier === "medium"
                ? [1, Math.min(1.75, typeof window !== "undefined" ? window.devicePixelRatio : 1.75)]
                : [1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 2)]
          }
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace
          }}
          onCreated={({ gl }) => {
            // @ts-expect-error - physicallyCorrectLights exists on WebGLRenderer at runtime
            gl.physicallyCorrectLights = true;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#111"]} />
          <Suspense fallback={<FallbackContent />}>
            {onLoadingComplete && <LoadedReporter onLoaded={onLoadingComplete} />}
            <Scene
              timeOfDay={effectiveTimeOfDay}
              sunRotation={effectiveSunRotation}
              wireframe={loadingPage}
              webgpu={false}
              contactShadows={sceneContactShadows}
            />
            <ScrollTour />
            <LightingSync />
            <CameraDebugUpdater />
            <CameraController />
            <FPSReporter />
          </Suspense>
        </Canvas>

        {hasStarted && (
          <>
            <div className="tour-ui__brand">
              <Image src="/logo-gemdam.png" alt="Gemdam" width={200} height={100} className="tour-ui__brand-img" />
            </div>
            <button
              type="button"
              className="tour-ui__freecamera-btn"
              onClick={handleToggleFreeCamera}
            >
              {freeCamera ? "Salir modo libre" : "Modo libre"}
            </button>
            <FullscreenButton />
            <MetricsOverlay />
            <WaypointsUI />
            <TourBottomBar
              timeOfDay={effectiveTimeOfDay}
              sunRotation={effectiveSunRotation}
              onTimeOfDayChange={onTimeOfDayChange}
              onSunRotationChange={onSunRotationChange}
              lightingOverride={lightingOverride}
              onSyncWithTour={() => setLightingOverride(false)}
            />
          </>
        )}
      </div>
    </>
  );
}

const INTRO_ZOOM_PROGRESS = 0;

function ExperienceWithIntro() {
  const [showIntro, setShowIntro] = useState(true);
  const [loadingPage, setLoadingPage] = useState(true);
  const { setTargetProgress } = useTourScroll();

  const handleStartExperience = useCallback(() => {
    setShowIntro(false);
    setTargetProgress(INTRO_ZOOM_PROGRESS);
  }, [setTargetProgress]);

  const handleLoadingComplete = useCallback(() => {
    setLoadingPage(false);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <LightingProvider>
        <TourExperienceInner
          hasStarted={!showIntro}
          loadingPage={loadingPage}
          onLoadingComplete={handleLoadingComplete}
        />
        <IntroOverlay
          onStart={handleStartExperience}
          loadingPage={loadingPage}
          className={showIntro ? "" : "is-hidden"}
        />
      </LightingProvider>
    </div>
  );
}

const keyboardMap = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
];

export function Experience() {
  return (
    <TourScrollProvider>
      <TourDebugProvider>
        <MetricsProvider>
          <KeyboardControls map={keyboardMap}>
            <ExperienceWithIntro />
          </KeyboardControls>
        </MetricsProvider>
      </TourDebugProvider>
    </TourScrollProvider>
  );
}
