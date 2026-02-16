"use client";

import { useMetrics } from "@/lib/metricsContext";

export function MetricsOverlay() {
  const { fps, freeCamera, setFreeCamera } = useMetrics();

  return (
    <div className="overlay-top-right metrics-overlay">
      <div className="overlay-glass metrics-panel">
        <div className="metrics-section" style={{ display: "flex", flexDirection: "column", alignItems: "end", gap: 10 }}>
          <span className="metrics-fps">{fps} <b>FPS</b></span>
        </div>
        <button
          type="button"
          className="metrics-toggle"
          onClick={() => setFreeCamera(!freeCamera)}
          aria-pressed={freeCamera}
          aria-label={freeCamera ? "Usar recorrido guiado" : "Usar vista libre de cámara"}
        >
          {freeCamera ? "Recorrido" : "Vista libre"}
        </button>
      </div>
    </div>
  );
}
