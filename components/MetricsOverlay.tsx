"use client";

import { useMetrics } from "@/lib/metricsContext";

export function MetricsOverlay() {
  const { fps } = useMetrics();

  return (
    <div className="metrics-overlay">
      <div className="metrics-panel">
        <span className="metrics-fps">{fps} <b>FPS</b></span>
      </div>
    </div>
  );
}
