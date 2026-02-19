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

/**
 * Curva de POSICIONES - waypoints definidos por el usuario + transición suave 5→1.
 */
function getPositionCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-0.02, 1.07, 5.28),  // 1
    new THREE.Vector3(3.38, 2.54, 2.62),   // 2
    new THREE.Vector3(2.62, 2.5, -2.89),   // 3
    new THREE.Vector3(-1.99, 2.07, -1.97), // 4
    new THREE.Vector3(-2.75, 1.69, 1.55),  // 5
    new THREE.Vector3(-1.2, 1.4, 3.5),     // transición 5→1
    new THREE.Vector3(-0.02, 1.07, 5.28),  // vuelta al 1
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

/**
 * Curva de MIRADAS - targets indicados por el usuario.
 */
function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-1.55, 0.61, 0.55),  // 1
    new THREE.Vector3(-0.62, 0.71, 0.25),  // 2
    new THREE.Vector3(0.35, 0.79, 1.22),   // 3
    new THREE.Vector3(2.61, 0.96, -3.59),  // 4
    new THREE.Vector3(2.1, 0.71, 0.84),    // 5
    new THREE.Vector3(-1.2, 0.65, 0.55),   // transición
    new THREE.Vector3(-1.55, 0.61, 0.55),  // vuelta
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
