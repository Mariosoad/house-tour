"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/math";
import { useTourScroll } from "@/lib/tourScrollContext";
import { useMetrics } from "@/lib/metricsContext";
import { useTourDebug } from "@/lib/tourDebugContext";

function getPositionCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-0.02, 1.07, 5.28),
    new THREE.Vector3(2.9, 2.2, 2.2),
    new THREE.Vector3(2.2, 2.1, -2.4),
    new THREE.Vector3(-1.6, 1.85, -1.6),
    new THREE.Vector3(-2.4, 1.55, 1.35),
    new THREE.Vector3(-1.2, 1.35, 3.4),
    new THREE.Vector3(-0.02, 1.07, 5.28),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-1.2, 0.7, 0.5),
    new THREE.Vector3(-0.3, 0.8, 0.3),
    new THREE.Vector3(0.2, 0.85, 1),
    new THREE.Vector3(2, 0.9, -3),
    new THREE.Vector3(1.6, 0.75, 0.6),
    new THREE.Vector3(-0.8, 0.65, 0.6),
    new THREE.Vector3(-1.2, 0.7, 0.5),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

const DAMPING = 3;
const dir = new THREE.Vector3();

/** Actualiza infoRef con posición, target y progress para el overlay de debug. */
export function CameraDebugUpdater() {
  const { camera } = useThree();
  const { progressRef, targetProgressRef } = useTourScroll();
  const { freeCamera } = useMetrics();
  const debug = useTourDebug();
  const positionCurve = useMemo(() => getPositionCurve(), []);
  const targetCurve = useMemo(() => getTargetCurve(), []);
  const currentT = useRef(0);

  useFrame((_, delta) => {
    if (!debug?.infoRef || !debug.enabled) return;
    const pos = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    let t: number;

    if (freeCamera) {
      pos.copy(camera.position);
      camera.getWorldDirection(dir);
      tgt.copy(pos).add(dir.multiplyScalar(5));
      t = progressRef.current;
    } else {
      const targetT = targetProgressRef.current;
      if (targetT !== null) {
        currentT.current = damp(currentT.current, targetT, 1.2, delta);
        t = currentT.current;
      } else {
        currentT.current = damp(currentT.current, progressRef.current, DAMPING, delta);
        t = currentT.current;
      }
      positionCurve.getPointAt(t, pos);
      targetCurve.getPointAt(t, tgt);
    }

    debug.infoRef.current = {
      position: [pos.x, pos.y, pos.z],
      target: [tgt.x, tgt.y, tgt.z],
      progress: t,
    };
  });

  return null;
}
