"use client";

import { useMetrics } from "@/lib/metricsContext";
import { LightingControls } from "@/components/LightingControls";

export type TourBottomBarProps = {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
};

export function TourBottomBar({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
}: TourBottomBarProps) {
  const { ssaoEnabled, setSsaoEnabled } = useMetrics();

  return (
    <div className="tour-bottom-bar">
      {/* <span className="tour-ui-glass">Scroll to explore</span> */}
      <LightingControls
        timeOfDay={timeOfDay}
        sunRotation={sunRotation}
        onTimeOfDayChange={onTimeOfDayChange}
        onSunRotationChange={onSunRotationChange}
        embedded
      />
      <button
        type="button"
        className="tour-ui-btn"
        onClick={() => setSsaoEnabled(!ssaoEnabled)}
        aria-pressed={ssaoEnabled}
        aria-label={ssaoEnabled ? "Desactivar Postprocessing" : "Activar Postprocessing"}
      >
        {ssaoEnabled ? "Postprocessing ON" : "Postprocessing OFF"}
      </button>
    </div>
  );
}
