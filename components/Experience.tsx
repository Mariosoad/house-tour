"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { TourScrollProvider, useTourScroll } from "@/lib/tourScrollContext";
import { Scene } from "@/components/Scene";
import { ScrollTour } from "@/components/ScrollTour";
import { WaypointsUI } from "@/components/WaypointsUI";
import { LightingControls } from "@/components/LightingControls";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState(0.35);
  const [sunRotation, setSunRotation] = useState(0);
  const onTimeOfDayChange = useCallback((v: number) => setTimeOfDay(v), []);
  const onSunRotationChange = useCallback((v: number) => setSunRotation(v), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      addDelta(e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [addDelta]);

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
          </Suspense>
        </Canvas>

        <div className="overlay-top-right">
          <div className="overlay-glass">Menu</div>
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
      <div style={{ width: "100%", height: "100vh", position: "relative" }}>
        <TourExperienceInner />
      </div>
    </TourScrollProvider>
  );
}
