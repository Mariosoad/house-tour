"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/math";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useMetrics } from "@/lib/metricsContext";

const DAMPING = 3;
const JUMP_EASE_SPEED = 1.2;

/**
 * Curva de POSICIONES de la cámara.
 * Recorrido: frente exterior (vista completa) → acercándose → interior → baño → exterior baño → loop.
 */
function getPositionCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 1, 10),     // 0: FRENTE - cámara atrás, vista completa del modelo
    new THREE.Vector3(4, 3.5, 6),    // 1: diagonal acercándose
    new THREE.Vector3(2.2, 1.3, 1.6),// 2: interior dormitorio (celosías)
    new THREE.Vector3(0.5, 1.1, 2),  // 3: dormitorio pie de cama
    new THREE.Vector3(0, 1.4, -1.6), // 4: baño vanity
    new THREE.Vector3(1.2, 1.2, -2.2),// 5: baño bañera
    new THREE.Vector3(-4, 2.2, -2),  // 6: exterior ventana baño
    new THREE.Vector3(0, 4, 10),     // 7: loop al inicio
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

/**
 * Curva de MIRADAS (hacia dónde mira la cámara en cada t).
 */
function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 1, 0),    // 0: centro casa (vista frontal)
    new THREE.Vector3(0, 1.5, 0),    // 1
    new THREE.Vector3(0.5, 0.9, 1.8),// 2: cama
    new THREE.Vector3(0, 0.9, 0.8),  // 3: cabecera
    new THREE.Vector3(0, 1, -1.8),   // 4: vanity
    new THREE.Vector3(0, 1, -2),     // 5: bañera
    new THREE.Vector3(-2, 1, -2),    // 6: ventana baño
    new THREE.Vector3(0, 1.8, 0),    // 7
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

export function ScrollTour() {
  const { camera } = useThree();
  const { progressRef, targetProgressRef, setProgress } = useTourScroll();
  const { freeCamera } = useMetrics();

  const positionCurve = useMemo(() => getPositionCurve(), []);
  const targetCurve = useMemo(() => getTargetCurve(), []);

  const currentT = useRef(0);
  const currentPosition = useRef(new THREE.Vector3());
  const currentTarget = useRef(new THREE.Vector3());

  // Initialize to first frame sample
  const initialized = useRef(false);
  if (!initialized.current) {
    const t = progressRef.current;
    positionCurve.getPointAt(t, currentPosition.current);
    targetCurve.getPointAt(t, currentTarget.current);
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentTarget.current);
    currentT.current = t;
    initialized.current = true;
  }

  useFrame((_, delta) => {
    if (freeCamera) return;
    const targetT = targetProgressRef.current;
    let t: number;

    if (targetT !== null) {
      // Ease current T toward target (smooth jump to waypoint)
      currentT.current = damp(currentT.current, targetT, JUMP_EASE_SPEED, delta);
      t = currentT.current;
      const dist = Math.abs(currentT.current - targetT);
      if (dist < 0.001) {
        targetProgressRef.current = null;
        setProgress(currentT.current);
      }
    } else {
      // Follow scroll-driven progress with damping
      currentT.current = damp(currentT.current, progressRef.current, DAMPING, delta);
      t = currentT.current;
    }

    positionCurve.getPointAt(t, currentPosition.current);
    targetCurve.getPointAt(t, currentTarget.current);

    camera.position.lerp(currentPosition.current, 1 - Math.exp(-DAMPING * delta));
    const lookAtTarget = currentTarget.current.clone();
    camera.lookAt(lookAtTarget);
  });

  return null;
}
