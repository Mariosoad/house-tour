"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useWebGPU } from "@/lib/useWebGPU";
import { getWebGPURenderer } from "@/lib/getRenderer";
import { Scene } from "@/components/Scene";
import { GIPipeline } from "@/components/GI";
import { LightingControls } from "@/components/LightingControls";

function FallbackContent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
}

function WebGPUExperience({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
}: {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
}) {
  return (
    <>
      <Canvas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gl={getWebGPURenderer as any}
        frameloop="never"
        dpr={[1, 1.5]}
        camera={{ position: [6, 4, 10], fov: 42, near: 0.1, far: 100 }}
        shadows
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={<FallbackContent />}>
          <Scene timeOfDay={timeOfDay} sunRotation={sunRotation} />
          <GIPipeline />
        </Suspense>
      </Canvas>
      <LightingControls
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        onTimeOfDayChange={onTimeOfDayChange}
        onSunRotationChange={onSunRotationChange}
      />
    </>
  );
}

function WebGLExperience({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
}: {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
}) {
  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [6, 4, 10], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 1, outputColorSpace: "srgb" }}
        shadows
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={<FallbackContent />}>
          <Scene timeOfDay={timeOfDay} sunRotation={sunRotation} />
        </Suspense>
      </Canvas>
      <LightingControls
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        onTimeOfDayChange={onTimeOfDayChange}
        onSunRotationChange={onSunRotationChange}
      />
    </>
  );
}

export function Experience() {
  const { supported: webGPUSupported, checking } = useWebGPU();
  const [timeOfDay, setTimeOfDay] = useState(0.35);
  const [sunRotation, setSunRotation] = useState(0);

  const onTimeOfDayChange = useCallback((v: number) => setTimeOfDay(v), []);
  const onSunRotationChange = useCallback((v: number) => setSunRotation(v), []);

  if (checking) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a22",
          color: "#a0a0b0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Checking WebGPU…
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {webGPUSupported ? (
        <WebGPUExperience
          timeOfDay={timeOfDay}
          sunRotation={sunRotation}
          onTimeOfDayChange={onTimeOfDayChange}
          onSunRotationChange={onSunRotationChange}
        />
      ) : (
        <WebGLExperience
          timeOfDay={timeOfDay}
          sunRotation={sunRotation}
          onTimeOfDayChange={onTimeOfDayChange}
          onSunRotationChange={onSunRotationChange}
        />
      )}
    </div>
  );
}
