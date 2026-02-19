"use client";

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/math";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useMetrics } from "@/lib/metricsContext";
import { INITIAL_CAMERA_POSITION, INITIAL_CAMERA_TARGET } from "@/lib/waypoints";

const DAMPING = 3;
const JUMP_EASE_SPEED = 1.2;

/** Curva de POSICIONES: 1 → 2 → 3 → 4 → 1 (primer punto duplicado para transición directa, sin glitch) */
function getPositionCurve(): THREE.CatmullRomCurve3 {
  const p1 = new THREE.Vector3(-0.0, 0.45, 1.66);
  const points = [
    p1.clone(),                             // 1
    new THREE.Vector3(1.07, 0.67, 0.18),   // 2
    new THREE.Vector3(0.93, 0.72, -0.91),  // 3
    new THREE.Vector3(-0.76, 0.73, -1.09), // 4
    p1,                                     // 1 de nuevo → tramo 4→1 directo
  ];
  return new THREE.CatmullRomCurve3(points, false);
}

/** Curva de MIRADAS (targets): 1 → 2 → 3 → 4 → 1 */
function getTargetCurve(): THREE.CatmullRomCurve3 {
  const t1 = new THREE.Vector3(-1.62, -0.18, -3.03);
  const points = [
    t1.clone(),                             // 1
    new THREE.Vector3(-3.72, -0.55, 0.92),  // 2
    new THREE.Vector3(-3.34, -0.3, 1.49),   // 3
    new THREE.Vector3(3.44, -0.12, 1.5),    // 4
    t1,                                     // 1 de nuevo
  ];
  return new THREE.CatmullRomCurve3(points, false);
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

  // Inicialización: usar valores fijos para consistencia entre local y producción
  useLayoutEffect(() => {
    const t = 0;
    currentPosition.current.set(...INITIAL_CAMERA_POSITION);
    currentTarget.current.set(...INITIAL_CAMERA_TARGET);
    camera.position.set(...INITIAL_CAMERA_POSITION);
    camera.lookAt(...INITIAL_CAMERA_TARGET);
    currentT.current = t;
    progressRef.current = t;
    setProgress(t);
    initialized.current = true;
  }, [camera, progressRef, setProgress]);

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
