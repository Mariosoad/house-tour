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
 * "t" es la posición NORMALIZADA en la curva de cámara:
 *   - t = 0   → inicio del recorrido (y mismo punto que t = 1, porque es loop)
 *   - t = 0.5 → mitad del recorrido
 *   - t = 1   → fin = mismo que inicio (vuelta al principio)
 *
 * Los dots de la UI se ordenan por "t". Puedes poner los que quieras:
 *   - Mínimo: uno en 0 (o 1), para "empezar"
 *   - Recomendado: varios repartidos (0, 0.25, 0.5, 0.75, 1) o según tus vistas
 *
 * La curva de cámara está en ScrollTour.tsx (getPositionCurve / getTargetCurve).
 * Si cambias el número de puntos en la curva, ajusta los "t" de los waypoints
 * para que coincidan con las vistas que quieres (p. ej. mismo número de puntos
 * que waypoints y t = 0, 1/4, 1/2, 3/4, 1).
 */
export type Waypoint = {
  id: string;
  label: string;
  t: number; // posición en el camino 0..1 (0 y 1 son el mismo punto en el loop)
};

/** Recorrido de ejemplo: edita labels y t según tu Casona. */
export const WAYPOINTS: Waypoint[] = [
  { id: "inicio", label: "Inicio", t: 0 },
  { id: "vista-1", label: "Vista frontal", t: 0.25 },
  { id: "vista-2", label: "Lateral", t: 0.5 },
  { id: "vista-3", label: "Detrás", t: 0.75 },
  { id: "fin", label: "Vuelta", t: 1 },
];
