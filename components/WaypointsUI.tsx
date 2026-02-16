"use client";

import { useTourScroll } from "@/lib/tourScrollContext";
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
  const currentT = closestWaypointT(progress);

  return (
    <div className="waypoints-ui">
      <div className="waypoints-dots">
        {WAYPOINTS.map((wp) => (
          <button
            key={wp.id}
            type="button"
            className={`waypoint-dot ${currentT === wp.t ? "active" : ""}`}
            onClick={() => setTargetProgress(wp.t)}
            title={wp.label}
            aria-label={`Go to ${wp.label}`}
          >
            <span className="waypoint-dot-inner" />
          </button>
        ))}
      </div>
    </div>
  );
}
