/**
 * WAYPOINTS: cómo definirlos y usarlos
 * -------------------------------------
 * El tour es un LOOP: el scroll avanza en "progress" 0 → 1 y vuelve a 0.
 *
 * Cada waypoint tiene:
 *   - id:         único (para React key)
 *   - label:      texto del tooltip en el dot
 *   - t:          posición en el camino, entre 0 y 1
 *   - timeOfDay:  0–1, hora del día (5 AM–9 PM) en este punto
 *   - sunRotation: grados (0–360), rotación del sol
 *
 * La iluminación se interpola entre waypoints según el progress del tour.
 * La curva de cámara está en tourCurves.ts (getPositionCurve / getTargetCurve).
 */

/** Posición y target inicial del waypoint 1. Usado por Canvas y ScrollTour para consistencia. */
export const INITIAL_CAMERA_POSITION = [0.08, 0.88, 2.47] as const;
export const INITIAL_CAMERA_TARGET = [0.86, -0.34, -2.32] as const;

export type Waypoint = {
  id: string;
  label: string;
  t: number;
  /** 0–1: hora del día (5 AM–9 PM) */
  timeOfDay: number;
  /** Grados 0–360: rotación del sol */
  sunRotation: number;
};

/** 8 waypoints en loop según vistas del recorrido guiado */
export const WAYPOINTS: Waypoint[] = [
  { id: "wp1", label: "1", t: 0, timeOfDay: 0.25, sunRotation: 15 },
  { id: "wp2", label: "2", t: 0.125, timeOfDay: 0.35, sunRotation: 5 },
  { id: "wp3", label: "3", t: 0.25, timeOfDay: 0.5, sunRotation: 0 },
  { id: "wp4", label: "4", t: 0.375, timeOfDay: 0.55, sunRotation: -5 },
  { id: "wp5", label: "5", t: 0.5, timeOfDay: 0.65, sunRotation: -15 },
  { id: "wp6", label: "6", t: 0.625, timeOfDay: 0.75, sunRotation: -25 },
  { id: "wp7", label: "7", t: 0.75, timeOfDay: 0.85, sunRotation: -30 },
  { id: "wp8", label: "8", t: 0.875, timeOfDay: 0.92, sunRotation: -35 },
];

/** Interpola timeOfDay y sunRotation según el progress 0–1 del tour */
export function getLightingAtProgress(progress: number): { timeOfDay: number; sunRotation: number } {
  const wps = [...WAYPOINTS, { ...WAYPOINTS[0], t: 1 }];
  let i = 0;
  for (; i < wps.length - 1; i++) {
    if (progress >= wps[i].t && progress < wps[i + 1].t) break;
  }
  if (i >= wps.length - 1) {
    return { timeOfDay: WAYPOINTS[0].timeOfDay, sunRotation: WAYPOINTS[0].sunRotation };
  }
  const a = wps[i];
  const b = wps[i + 1];
  const local = (progress - a.t) / (b.t - a.t);
  return {
    timeOfDay: a.timeOfDay + (b.timeOfDay - a.timeOfDay) * local,
    sunRotation: a.sunRotation + (b.sunRotation - a.sunRotation) * local,
  };
}
