"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

export type PerformanceTier = "low" | "ultra";

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "ultra";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
  return saveData || isMobile ? "low" : "ultra";
}

export type MetricsContextValue = {
  fps: number;
  setFps: (fps: number) => void;
  freeCamera: boolean;
  setFreeCamera: (v: boolean) => void;
  ssaoEnabled: boolean;
  setSsaoEnabled: (v: boolean) => void;
  performanceTier: PerformanceTier;
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [fps, setFps] = useState(0);
  const [freeCamera, setFreeCamera] = useState(false);
  const [ssaoEnabled, setSsaoEnabled] = useState(true);
  const performanceTier = useMemo(detectPerformanceTier, []);
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
