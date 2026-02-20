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
export const INITIAL_CAMERA_POSITION = [0.08, 0.88, 2.47] as const;
export const INITIAL_CAMERA_TARGET = [0.86, -0.34, -2.32] as const;

export type Waypoint = {
  id: string;
  label: string;
  t: number;
};

/** 8 waypoints en loop según vistas del recorrido guiado */
export const WAYPOINTS: Waypoint[] = [
  { id: "wp1", label: "1", t: 0 },
  { id: "wp2", label: "2", t: 0.125 },
  { id: "wp3", label: "3", t: 0.25 },
  { id: "wp4", label: "4", t: 0.375 },
  { id: "wp5", label: "5", t: 0.5 },
  { id: "wp6", label: "6", t: 0.625 },
  { id: "wp7", label: "7", t: 0.75 },
  { id: "wp8", label: "8", t: 0.875 },
];
