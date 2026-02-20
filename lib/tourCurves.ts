import * as THREE from "three";

/** Curva de POSICIONES: 8 waypoints según vistas del recorrido → 1 (loop) */
export function getPositionCurve(): THREE.CatmullRomCurve3 {
  const p1 = new THREE.Vector3(0.08, 0.88, 2.47); // 1: Dormitorio entrada, vista cama
  const points = [
    p1.clone(),                               // 1
    new THREE.Vector3(0.18, 0.47, 1.2),       // 2: Dormitorio centro
    new THREE.Vector3(-1.29, 0.88, 0.84),     // 3: Sala con puertas de cristal
    new THREE.Vector3(0.37, 0.59, 0.26),      // 4: Baño, vista bañera/vanity
    new THREE.Vector3(-0.85, 0.74, -0.9),      // 5: Vista baja hacia exterior
    new THREE.Vector3(0.45, 0.80, -0.65),      // 6: Dormitorio ventanas y cama
    new THREE.Vector3(1.05, 0.85, -0.65),     // 7: Baño bañera/ducha
    new THREE.Vector3(1.12, 0.66, -0.62),      // 8: Baño vanity y exterior
    p1,                                       // 1 de nuevo → loop
  ];
  // closed: true = loop infinito sin glitch al volver al inicio
  return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0);
}

/** Curva de MIRADAS (targets): 8 waypoints según vistas del recorrido */
export function getTargetCurve(): THREE.CatmullRomCurve3 {
  const t1 = new THREE.Vector3(0.86, -0.34, -2.32);  // 1: Cama y estantería
  const points = [
    t1.clone(),                                // 1
    new THREE.Vector3(4.36, 0.56, 3.93),      // 2: Cama y pared fondo
    new THREE.Vector3(3.35, -0.06, -0.77),    // 3: Exterior patio/árboles
    new THREE.Vector3(-4.7, 0.32, -1.72),      // 4: Bañera, vanity, ventana
    new THREE.Vector3(4.05, 0.35, -0.02), 
    new THREE.Vector3(-0.88, 0.2, -5.45),       // 6: Ventanas y cama
    new THREE.Vector3(-3.92, 0.50, 0.20),         // 7: Bañera y plantas exterior
    new THREE.Vector3(-3.82, 0.20, 1.40),        // 8: Vanity y vista exterior
    t1,                                        // 1 de nuevo
  ];
  return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0);
}
