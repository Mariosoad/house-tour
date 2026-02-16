"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMetrics } from "@/lib/metricsContext";

const UPDATE_INTERVAL = 0.25;

export function FPSReporter() {
  const { setFps } = useMetrics();
  const elapsed = useRef(0);
  const frames = useRef(0);
  const totalDelta = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    frames.current += 1;
    totalDelta.current += delta;
    if (elapsed.current >= UPDATE_INTERVAL) {
      const avgFps = frames.current / totalDelta.current;
      setFps(Math.round(avgFps));
      elapsed.current = 0;
      frames.current = 0;
      totalDelta.current = 0;
    }
  });

  return null;
}
