"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";

export type PerformanceTier = "low" | "ultra";
export type EffectiveTier = "low" | "ultra";

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "ultra";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
  return saveData || isMobile ? "low" : "ultra";
}

const FPS_DOWNGRADE_THRESHOLD = 50;
const FPS_UPGRADE_THRESHOLD = 55;
const DOWNSAMPLE_TIME_MS = 1500;
const UPSAMPLE_TIME_MS = 1000;

export type MetricsContextValue = {
  fps: number;
  setFps: (fps: number) => void;
  freeCamera: boolean;
  setFreeCamera: (v: boolean) => void;
  ssaoEnabled: boolean;
  setSsaoEnabled: (v: boolean) => void;
  performanceTier: PerformanceTier;
  effectiveTier: EffectiveTier;
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

function useEffectiveTier(performanceTier: PerformanceTier, fps: number): EffectiveTier {
  const [effectiveTier, setEffectiveTier] = useState<EffectiveTier>(
    performanceTier === "low" ? "low" : "ultra"
  );
  const lowSince = useRef<number | null>(null);
  const highSince = useRef<number | null>(null);
  const currentRef = useRef<EffectiveTier>(effectiveTier);
  currentRef.current = effectiveTier;

  useEffect(() => {
    if (performanceTier === "low") {
      setEffectiveTier("low");
      lowSince.current = null;
      highSince.current = null;
      return;
    }

    const now = performance.now();
    const current = currentRef.current;

    if (fps > 0 && fps < FPS_DOWNGRADE_THRESHOLD) {
      if (current === "ultra") {
        lowSince.current ??= now;
        if (now - lowSince.current >= DOWNSAMPLE_TIME_MS) {
          setEffectiveTier("low");
          highSince.current = null;
        }
      }
    } else if (fps >= FPS_UPGRADE_THRESHOLD) {
      lowSince.current = null;
      if (current === "low") {
        highSince.current ??= now;
        if (now - highSince.current >= UPSAMPLE_TIME_MS) {
          setEffectiveTier("ultra");
          highSince.current = null;
        }
      }
    } else {
      lowSince.current = null;
      highSince.current = null;
    }
  }, [fps, performanceTier]);

  return effectiveTier;
}

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [fps, setFps] = useState(0);
  const [freeCamera, setFreeCamera] = useState(false);
  const [ssaoEnabled, setSsaoEnabled] = useState(true);
  const performanceTier = useMemo(() => detectPerformanceTier(), []);
  const effectiveTier = useEffectiveTier(performanceTier, fps);
  const setFreeCameraStable = useCallback((v: boolean) => setFreeCamera(v), []);
  const setSsaoEnabledStable = useCallback((v: boolean) => setSsaoEnabled(v), []);
  const value: MetricsContextValue = {
    fps,
    setFps,
    freeCamera,
    setFreeCamera: setFreeCameraStable,
    ssaoEnabled,
    setSsaoEnabled: setSsaoEnabledStable,
    performanceTier,
    effectiveTier,
  };
  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextValue {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error("useMetrics must be used within MetricsProvider");
  return ctx;
}
