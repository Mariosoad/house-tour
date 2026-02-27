"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type LightingContextValue = {
  /** timeOfDay 0–1 efectivo (tour o manual según override) */
  timeOfDay: number;
  /** sunRotation efectivo (tour o manual según override) */
  sunRotation: number;
  /** true = usar valores manuales; false = seguir el tour */
  lightingOverride: boolean;
  setLightingOverride: (v: boolean) => void;
  /** Valores manuales cuando override=true */
  manualTimeOfDay: number;
  manualSunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
  /** Valores del tour (actualizados por LightingSync en useFrame) */
  tourTimeOfDay: number;
  tourSunRotation: number;
  setTourLighting: (timeOfDay: number, sunRotation: number) => void;
};

const LightingContext = createContext<LightingContextValue | null>(null);

export function LightingProvider({ children }: { children: React.ReactNode }) {
  const [lightingOverride, setLightingOverride] = useState(false);
  const [manualTimeOfDay, setManualTimeOfDay] = useState(0.5);
  const [manualSunRotation, setManualSunRotation] = useState(0);
  const [tourTimeOfDay, setTourTimeOfDayState] = useState(0.25);
  const [tourSunRotation, setTourSunRotationState] = useState(15);

  const setTourLighting = useCallback((timeOfDay: number, sunRotation: number) => {
    setTourTimeOfDayState(timeOfDay);
    setTourSunRotationState(sunRotation);
  }, []);

  const onTimeOfDayChange = useCallback((v: number) => {
    setManualTimeOfDay(v);
    // Preservar sunRotation actual al cambiar solo time of day
    if (!lightingOverride) {
      setManualSunRotation(tourSunRotation);
    }
    setLightingOverride(true);
  }, [lightingOverride, tourSunRotation]);

  const onSunRotationChange = useCallback((v: number) => {
    setManualSunRotation(v);
    // Preservar time of day actual al cambiar solo sun rotation
    if (!lightingOverride) {
      setManualTimeOfDay(tourTimeOfDay);
    }
    setLightingOverride(true);
  }, [lightingOverride, tourTimeOfDay]);

  const timeOfDay = lightingOverride ? manualTimeOfDay : tourTimeOfDay;
  const sunRotation = lightingOverride ? manualSunRotation : tourSunRotation;

  const value: LightingContextValue = {
    timeOfDay,
    sunRotation,
    lightingOverride,
    setLightingOverride,
    manualTimeOfDay,
    manualSunRotation,
    onTimeOfDayChange,
    onSunRotationChange,
    tourTimeOfDay,
    tourSunRotation,
    setTourLighting,
  };

  return (
    <LightingContext.Provider value={value}>
      {children}
    </LightingContext.Provider>
  );
}

export function useLighting(): LightingContextValue {
  const ctx = useContext(LightingContext);
  if (!ctx) throw new Error("useLighting must be used within LightingProvider");
  return ctx;
}
