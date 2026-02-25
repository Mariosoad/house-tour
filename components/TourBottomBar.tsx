"use client";

import { useMetrics } from "@/lib/metricsContext";
import { LightingControls } from "@/components/LightingControls";

export type TourBottomBarProps = {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
  lightingOverride?: boolean;
  onSyncWithTour?: () => void;
};

export function TourBottomBar({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
  lightingOverride = false,
  onSyncWithTour,
}: TourBottomBarProps) {
  const { ssaoEnabled, setSsaoEnabled, freeCamera, setFreeCamera } = useMetrics();

  return (
    <div className="tour-bottom-bar">
      {/* <button
        type="button"
        className="tour-ui-btn"
        onClick={() => setFreeCamera(!freeCamera)}
        aria-pressed={freeCamera}
        aria-label={freeCamera ? "Volver a recorrido guiado" : "Activar vista libre"}
      >
        {freeCamera ? "Recorrido guiado" : "Vista libre"}
      </button> */}
      <LightingControls
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        onTimeOfDayChange={onTimeOfDayChange}
        onSunRotationChange={onSunRotationChange}
        lightingOverride={lightingOverride}
        onSyncWithTour={onSyncWithTour}
        embedded
      />
      {/* <button
        type="button"
        className="tour-ui-btn"
        onClick={() => setSsaoEnabled(!ssaoEnabled)}
        aria-pressed={ssaoEnabled}
        aria-label={ssaoEnabled ? "Desactivar Postprocessing" : "Activar Postprocessing"}
      >
        {ssaoEnabled ? "Postprocessing ON" : "Postprocessing OFF"}
      </button> */}
    </div>
  );
}
