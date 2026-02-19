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

/** Posición y target inicial del waypoint 0. Usado por Canvas y ScrollTour para garantizar consistencia entre ambientes. */
export const INITIAL_CAMERA_POSITION = [-0.02, 1.07, 5.28] as const;
export const INITIAL_CAMERA_TARGET = [-1.55, 0.61, 0.55] as const;

export type Waypoint = {
  id: string;
  label: string;
  t: number;
};

export const WAYPOINTS: Waypoint[] = [
  { id: "wp1", label: "1", t: 0 },
  { id: "wp2", label: "2", t: 1 / 7 },
  { id: "wp3", label: "3", t: 2 / 7 },
  { id: "wp4", label: "4", t: 3 / 7 },
  { id: "wp5", label: "5", t: 4 / 7 },
];
