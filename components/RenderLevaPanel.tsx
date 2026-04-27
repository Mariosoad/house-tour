"use client";

import { useEffect, useState } from "react";
import { Leva, folder, useControls } from "leva";
import { useRenderSettings } from "@/lib/renderSettingsContext";

const LEVA_THEME = {
  colors: {
    elevation1: "#0f1013",
    elevation2: "#17181d",
    elevation3: "#21242b",
    accent1: "#18a0fb",
    accent2: "#3bb1ff",
    accent3: "#7cc9ff",
    highlight1: "#2f333d",
    highlight2: "#3f4552",
    highlight3: "#596172",
  },
};

export function RenderLevaPanel({ hidden = false }: { hidden?: boolean }) {
  const { settings, updateSettings, applyPreset } = useRenderSettings();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Leva persists UI state in localStorage; clear stale collapsed/position values.
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        if (key.toLowerCase().includes("leva")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore storage access issues
    }
    setCollapsed(true);
  }, []);

  useControls("Controls", {
    Quality: folder(
      {
        preset: {
          value: settings.qualityPreset,
          options: {
            low: "low",
            balanced: "balanced",
            ultra: "ultra",
          },
          onChange: (value) => applyPreset(value),
        },
      },
      { collapsed: true }
    ),
    Materials: folder(
      {
        wireframe: {
          value: settings.wireframe,
          onChange: (value) => updateSettings({ wireframe: value }),
        },
        aoOnlyMode: {
          value: settings.aoOnlyMode,
          onChange: (value) => updateSettings({ aoOnlyMode: value }),
        },
        aoOnlyIntensity: {
          value: settings.aoOnlyIntensity,
          min: 0.3,
          max: 3,
          step: 0.01,
          render: (get) => Boolean(get("Controls.Materials.aoOnlyMode")),
          onChange: (value) => updateSettings({ aoOnlyIntensity: value }),
        },
        aoOnlyDenoiseRadius: {
          value: settings.aoOnlyDenoiseRadius,
          min: 4,
          max: 24,
          step: 1,
          render: (get) => Boolean(get("Controls.Materials.aoOnlyMode")),
          onChange: (value) => updateSettings({ aoOnlyDenoiseRadius: value }),
        },
        aoOnlySamples: {
          value: settings.aoOnlySamples,
          min: 8,
          max: 64,
          step: 1,
          render: (get) => Boolean(get("Controls.Materials.aoOnlyMode")),
          onChange: (value) => updateSettings({ aoOnlySamples: value }),
        },
        aoOnlyDenoiseSamples: {
          value: settings.aoOnlyDenoiseSamples,
          min: 2,
          max: 16,
          step: 1,
          render: (get) => Boolean(get("Controls.Materials.aoOnlyMode")),
          onChange: (value) => updateSettings({ aoOnlyDenoiseSamples: value }),
        },
      },
      { collapsed: true }
    ),
    Post: folder(
      {
        aoEnabled: {
          value: settings.aoEnabled,
          onChange: (value) => updateSettings({ aoEnabled: value }),
        },
        aoIntensity: {
          value: settings.aoIntensity,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value) => updateSettings({ aoIntensity: value }),
        },
      },
      { collapsed: true }
    ),
    AA: folder(
      {
        aaSmaaEnabled: {
          value: settings.aaSmaaEnabled,
          onChange: (value) => updateSettings({ aaSmaaEnabled: value }),
        },
        aaMsaaLevel: {
          value: settings.aaMsaaLevel,
          options: {
            "Off (0)": 0,
            "Low (2)": 2,
            "Medium (4)": 4,
            "High (8)": 8,
          },
          onChange: (value) => updateSettings({ aaMsaaLevel: value }),
        },
      },
      { collapsed: true }
    ),
    Lights: folder(
      {
        directionalLightIntensity: {
          value: settings.directionalLightIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          onChange: (value) => updateSettings({ directionalLightIntensity: value }),
        },
        pointLightsEnabled: {
          value: settings.pointLightsEnabled,
          onChange: (value) => updateSettings({ pointLightsEnabled: value }),
        },
        pointLightsIntensity: {
          value: settings.pointLightsIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          onChange: (value) => updateSettings({ pointLightsIntensity: value }),
        },
        hemisphereIntensity: {
          value: settings.hemisphereIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          onChange: (value) => updateSettings({ hemisphereIntensity: value }),
        },
        environmentIntensity: {
          value: settings.environmentIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          onChange: (value) => updateSettings({ environmentIntensity: value }),
        },
      },
      { collapsed: true }
    ),
    Debug: folder(
      {
        showMetrics: {
          value: settings.showMetrics,
          onChange: (value) => updateSettings({ showMetrics: value }),
        },
      },
      { collapsed: true }
    ),
  });

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 2200,
        pointerEvents: "auto",
        maxHeight: "92vh",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <Leva
        collapsed={{ collapsed, onChange: setCollapsed }}
        neverHide
        oneLineLabels
        fill
        titleBar={{ title: "Controls", drag: true, filter: false }}
        hideCopyButton
        theme={LEVA_THEME}
      />
    </div>
  );
}
