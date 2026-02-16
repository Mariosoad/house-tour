"use client";

import { useTourScroll } from "@/lib/tourScrollContext";
import { useMetrics } from "@/lib/metricsContext";
import { WAYPOINTS } from "@/lib/waypoints";

function closestWaypointT(progress: number): number {
  let best = 0;
  let bestDist = 1;
  for (const w of WAYPOINTS) {
    let d = Math.abs(w.t - progress);
    if (d > 0.5) d = 1 - d;
    if (d < bestDist) {
      bestDist = d;
      best = w.t;
    }
  }
  return best;
}

export function WaypointsUI() {
  const { progress, setTargetProgress } = useTourScroll();
  const { freeCamera, setFreeCamera } = useMetrics();
  const currentT = closestWaypointT(progress);

  const goToWaypoint = (t: number) => {
    setTargetProgress(t);
    if (freeCamera) setFreeCamera(false);
  };

  return (
    <div className="waypoints-ui">
      <div className="waypoints-dots">
        {WAYPOINTS.map((wp) => (
          <button
            key={wp.id}
            type="button"
            className={`waypoint-dot ${currentT === wp.t ? "active" : ""}`}
            onClick={() => goToWaypoint(wp.t)}
            title={wp.label}
            aria-label={`Ir a ${wp.label}`}
          >
            <span className="waypoint-dot-inner" />
          </button>
        ))}
      </div>
    </div>
  );
}
