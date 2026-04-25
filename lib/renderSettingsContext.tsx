"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type QualityPreset = "low" | "balanced" | "ultra";
export type MSAALevel = 0 | 2 | 4 | 8;

export type RenderSettings = {
  qualityPreset: QualityPreset;
  wireframe: boolean;
  aoOnlyMode: boolean;
  aoEnabled: boolean;
  aoIntensity: number;
  aaSmaaEnabled: boolean;
  aaMsaaLevel: MSAALevel;
  showMetrics: boolean;
  directionalLightIntensity: number;
  pointLightsEnabled: boolean;
  pointLightsIntensity: number;
  hemisphereIntensity: number;
  environmentIntensity: number;
};

const PRESET_SETTINGS: Record<QualityPreset, Partial<RenderSettings>> = {
  low: {
    aaMsaaLevel: 0,
    aaSmaaEnabled: true,
    aoIntensity: 0.7,
    environmentIntensity: 0.2,
    hemisphereIntensity: 0.3,
  },
  balanced: {
    aaMsaaLevel: 2,
    aaSmaaEnabled: true,
    aoIntensity: 0.85,
    environmentIntensity: 0.3,
    hemisphereIntensity: 0.4,
  },
  ultra: {
    aaMsaaLevel: 8,
    aaSmaaEnabled: true,
    aoIntensity: 1.0,
    environmentIntensity: 0.35,
    hemisphereIntensity: 0.45,
  },
};

const DEFAULT_SETTINGS: RenderSettings = {
  qualityPreset: "balanced",
  wireframe: false,
  aoOnlyMode: false,
  aoEnabled: true,
  aoIntensity: 0.85,
  aaSmaaEnabled: true,
  aaMsaaLevel: 2,
  showMetrics: false,
  directionalLightIntensity: 1.0,
  pointLightsEnabled: true,
  pointLightsIntensity: 1.0,
  hemisphereIntensity: 0.4,
  environmentIntensity: 0.3,
};

type RenderSettingsContextValue = {
  settings: RenderSettings;
  updateSettings: (patch: Partial<RenderSettings>) => void;
  applyPreset: (preset: QualityPreset) => void;
};

const RenderSettingsContext = createContext<RenderSettingsContextValue | null>(null);

export function RenderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);

  const updateSettings = useCallback((patch: Partial<RenderSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPreset = useCallback((preset: QualityPreset) => {
    setSettings((prev) => ({
      ...prev,
      qualityPreset: preset,
      ...PRESET_SETTINGS[preset],
    }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      applyPreset,
    }),
    [settings, updateSettings, applyPreset]
  );

  return <RenderSettingsContext.Provider value={value}>{children}</RenderSettingsContext.Provider>;
}

export function useRenderSettings() {
  const ctx = useContext(RenderSettingsContext);
  if (!ctx) throw new Error("useRenderSettings must be used within RenderSettingsProvider");
  return ctx;
}
