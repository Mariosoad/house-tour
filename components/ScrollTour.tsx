"use client";

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/math";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useMetrics } from "@/lib/metricsContext";
import { INITIAL_CAMERA_POSITION, INITIAL_CAMERA_TARGET } from "@/lib/waypoints";
import { getPositionCurve, getTargetCurve } from "@/lib/tourCurves";

const DAMPING = 1.8;
const JUMP_EASE_SPEED = 0.8;

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
        setProgress(((currentT.current % 1) + 1) % 1);
      }
    } else {
      // Follow scroll: ajustar target para loop infinito (evitar glitch al cruzar 1→0)
      const raw = progressRef.current;
      let targetAdjusted = raw;
      const cur = currentT.current;
      const dBack = cur - raw;
      const dFwd = raw + 1 - cur;
      if (dBack > 0.5 && dFwd < dBack) targetAdjusted = raw + 1;
      else if (dBack < -0.5 && -dBack > cur + 1 - raw) targetAdjusted = raw - 1;

      currentT.current = damp(cur, targetAdjusted, DAMPING, delta);
      // Evitar deriva: si estamos cerca del target y currentT fuera de [0,1], normalizar
      if (Math.abs(currentT.current - targetAdjusted) < 0.02 && (currentT.current >= 1 || currentT.current < 0)) {
        currentT.current = raw;
      }
      t = ((currentT.current % 1) + 1) % 1; // curva usa t en [0,1)
    }

    positionCurve.getPointAt(t, currentPosition.current);
    targetCurve.getPointAt(t, currentTarget.current);

    camera.position.lerp(currentPosition.current, 1 - Math.exp(-DAMPING * delta));
    const lookAtTarget = currentTarget.current.clone();
    camera.lookAt(lookAtTarget);
  });

  return null;
}
