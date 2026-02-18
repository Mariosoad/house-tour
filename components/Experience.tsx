"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { TourScrollProvider, useTourScroll } from "@/lib/tourScrollContext";
import { MetricsProvider, useMetrics } from "@/lib/metricsContext";
import { Scene } from "@/components/Scene";
import { ScrollTour } from "@/components/ScrollTour";
import { CameraController } from "@/components/CameraController";
import { FPSReporter } from "@/components/FPSReporter";
import { WaypointsUI } from "@/components/WaypointsUI";
import { LightingControls } from "@/components/LightingControls";
import { MetricsOverlay } from "@/components/MetricsOverlay";
import { ManciniCanvas } from "@/components/ManciniCanvas";
import { WebGPUPostProcessing } from "@/components/WebGPUPostProcessing";

function FallbackContent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
}

const cameraProps = { position: [8, 3.5, 8] as [number, number, number], fov: 42, near: 0.1, far: 100 };
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
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [timeOfDay, setTimeOfDay] = useState(0.4);
  const [sunRotation, setSunRotation] = useState(0);
  const [postProcessingEnabled, setPostProcessingEnabled] = useState(true);
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

  const sceneBlock = (
    <>
      <Scene
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        webgpu={true}
        contactShadows={sceneContactShadows}
      />
      <ScrollTour />
      <CameraController />
      <FPSReporter />
    </>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="tour-container"
        role="application"
        aria-label="3D scroll tour"
      >
        <canvas
          ref={(el) => {
            if (el) setCanvas(el);
          }}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        {canvas && (
          <ManciniCanvas camera={cameraProps} canvas={canvas} quality="high">
            <color attach="background" args={["#111"]} />
            <PerspectiveCamera
              makeDefault
              position={cameraProps.position}
              fov={cameraProps.fov}
              near={cameraProps.near}
              far={cameraProps.far}
            />
            <Suspense fallback={<FallbackContent />}>{sceneBlock}</Suspense>
            <WebGPUPostProcessing
              enabled={postProcessingEnabled}
              strength={1.2}
              radius={0.4}
            />
          </ManciniCanvas>
        )}

        <MetricsOverlay />
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: 260,
          }}
        >
          <button
            type="button"
            className="overlay-glass"
            onClick={() => setPostProcessingEnabled((v) => !v)}
            style={{ cursor: "pointer", textAlign: "left" }}
          >
            Post-processing: <b>{postProcessingEnabled ? "ON" : "OFF"}</b>
          </button>
        </div>

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
