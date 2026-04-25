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
import { WaypointsUI } from "@/components/WaypointsUI";
import { TourBottomBar } from "@/components/TourBottomBar";
import { FullscreenButton } from "@/components/FullscreenButton";
import { TourDebugProvider } from "@/lib/tourDebugContext";
import { IntroOverlay } from "@/components/IntroOverlay";
import { LoadedReporter } from "@/components/LoadedReporter";
import { RenderLevaPanel } from "@/components/RenderLevaPanel";
import { RenderSettingsProvider, useRenderSettings } from "@/lib/renderSettingsContext";
import { FPSReporter } from "@/components/FPSReporter";

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
  uiHidden,
}: {
  hasStarted: boolean;
  onLoadingComplete?: () => void;
  loadingPage: boolean;
  uiHidden: boolean;
}) {
  const { addDelta } = useTourScroll();
  const { freeCamera, effectiveTier } = useMetrics();
  const { settings } = useRenderSettings();
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
              ? [1, 1.35]
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
          <color
            attach="background"
            args={[settings.aoOnlyMode ? "#ffffff" : settings.wireframe ? "#343434" : "#111"]}
          />
          <Suspense fallback={<FallbackContent />}>
            {onLoadingComplete && <LoadedReporter onLoaded={onLoadingComplete} />}
            <Scene
              timeOfDay={effectiveTimeOfDay}
              sunRotation={effectiveSunRotation}
              wireframe={loadingPage || settings.wireframe}
              webgpu={false}
              contactShadows={sceneContactShadows}
            />
            <ScrollTour />
            <LightingSync />
            <CameraDebugUpdater />
            <CameraController />
            <FPSReporter enabled={settings.showMetrics} />
          </Suspense>
        </Canvas>

        {hasStarted && !uiHidden && (
          <>
            <div className="tour-ui__brand">
              <a href="https://www.gemdam.com" target="_blank" rel="noopener noreferrer" style={{cursor: "pointer"}}>
              <Image src="/logo-gemdam.png" alt="Gemdam" width={200} height={100} className="tour-ui__brand-img" />
              </a>
            </div>
            {/* <button
              type="button"
              className="tour-ui__freecamera-btn"
              onClick={handleToggleFreeCamera}
            >
              {freeCamera ? "Salir modo libre" : "Modo libre"}
            </button> */}
            <FullscreenButton />
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
  const [uiHidden, setUiHidden] = useState(false);
  const { setTargetProgress } = useTourScroll();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyH") return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTyping) return;
      setUiHidden((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          uiHidden={uiHidden}
        />
        <button
          type="button"
          className="tour-ui-btn tour-ui__toggle-ui-btn"
          onClick={() => setUiHidden((prev) => !prev)}
          aria-pressed={uiHidden}
        >
          {uiHidden ? "On UI" : "Off UI"}
        </button>
        <IntroOverlay
          onStart={handleStartExperience}
          loadingPage={loadingPage}
          className={showIntro && !uiHidden ? "" : "is-hidden"}
        />
        {!uiHidden && <RenderLevaPanel />}
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
          <RenderSettingsProvider>
            <KeyboardControls map={keyboardMap}>
              <ExperienceWithIntro />
            </KeyboardControls>
          </RenderSettingsProvider>
        </MetricsProvider>
      </TourDebugProvider>
    </TourScrollProvider>
  );
}
