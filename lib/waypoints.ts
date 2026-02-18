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
export type Waypoint = {
  id: string;
  label: string;
  t: number;
};

export const WAYPOINTS: Waypoint[] = [
  { id: "exterior-frente", label: "Frente exterior", t: 0 },
  { id: "exterior-2", label: "Vista lateral", t: 1 / 7 },
  { id: "dormitorio-slat", label: "Dormitorio (celosías)", t: 2 / 7 },
  { id: "dormitorio-pie", label: "Dormitorio desde el pie", t: 3 / 7 },
  { id: "bano-vanity", label: "Baño doble lavabo", t: 4 / 7 },
  { id: "bano-bathtub", label: "Baño bañera", t: 5 / 7 },
  { id: "exterior-bano", label: "Exterior ventana baño", t: 0.8 },
];
