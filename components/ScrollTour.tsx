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
 * Curva de POSICIONES - con punto de transición 5→1 para loop suave.
 * Cámaras ligeramente más adentro para mejor vista del interior.
 */
function getPositionCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-0.02, 1.07, 5.28),  // 1
    new THREE.Vector3(2.9, 2.2, 2.2),      // 2: más adentro
    new THREE.Vector3(2.2, 2.1, -2.4),     // 3: más adentro
    new THREE.Vector3(-1.6, 1.85, -1.6),   // 4: más adentro
    new THREE.Vector3(-2.4, 1.55, 1.35),   // 5: más adentro
    new THREE.Vector3(-1.2, 1.35, 3.4),    // transición suave 5→1
    new THREE.Vector3(-0.02, 1.07, 5.28),  // vuelta al 1
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

/**
 * Curva de MIRADAS - targets ajustados para enfocar objetos mejor.
 */
function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-1.2, 0.7, 0.5),     // 1
    new THREE.Vector3(-0.3, 0.8, 0.3),     // 2
    new THREE.Vector3(0.2, 0.85, 1),       // 3
    new THREE.Vector3(2, 0.9, -3),         // 4
    new THREE.Vector3(1.6, 0.75, 0.6),     // 5
    new THREE.Vector3(-0.8, 0.65, 0.6),    // transición
    new THREE.Vector3(-1.2, 0.7, 0.5),     // vuelta
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
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (freeCamera) return;

    // Inicialización determinista: siempre t=0, mismo resultado en dev y prod
    if (!initialized.current) {
      const t = 0;
      positionCurve.getPointAt(t, currentPosition.current);
      targetCurve.getPointAt(t, currentTarget.current);
      camera.position.copy(currentPosition.current);
      camera.lookAt(currentTarget.current);
      currentT.current = t;
      progressRef.current = t;
      setProgress(t);
      initialized.current = true;
      return;
    }

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
