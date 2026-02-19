/**
 * WAYPOINTS: cómo definirlos y usarlos
 * -------------------------------------
 * El tour es un LOOP: el scroll avanza en "progress" 0 → 1 y vuelve a 0.
 *
 * Cada waypoint tiene:
 *   - id:   único (para React key)
 *   - label: texto del tooltip en el dot
 *   - t:    posición en el camino, entre 0 y 1
 *
 * La iluminación es estática (controled manualmente); no varía con el recorrido.
 * La curva de cámara está en ScrollTour.tsx (getPositionCurve / getTargetCurve).
 */

/** Posición y target inicial del waypoint 1. Usado por Canvas y ScrollTour para garantizar consistencia entre ambientes. */
export const INITIAL_CAMERA_POSITION = [-0.0, 0.45, 1.66] as const;
export const INITIAL_CAMERA_TARGET = [-1.62, -0.18, -3.03] as const;

export type Waypoint = {
  id: string;
  label: string;
  t: number;
};

/** 4 waypoints en loop: 1 → 2 → 3 → 4 → 1 */
export const WAYPOINTS: Waypoint[] = [
  { id: "wp1", label: "1", t: 0 },
  { id: "wp2", label: "2", t: 0.25 },
  { id: "wp3", label: "3", t: 0.5 },
  { id: "wp4", label: "4", t: 0.75 },
];
