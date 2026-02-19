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
    new THREE.Vector3(3.38, 2.54, 2.62),
    new THREE.Vector3(2.62, 2.5, -2.89),
    new THREE.Vector3(-1.99, 2.07, -1.97),
    new THREE.Vector3(-2.75, 1.69, 1.55),
    new THREE.Vector3(-1.2, 1.4, 3.5),
    new THREE.Vector3(-0.02, 1.07, 5.28),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(-1.55, 0.61, 0.55),
    new THREE.Vector3(-0.62, 0.71, 0.25),
    new THREE.Vector3(0.35, 0.79, 1.22),
    new THREE.Vector3(2.61, 0.96, -3.59),
    new THREE.Vector3(2.1, 0.71, 0.84),
    new THREE.Vector3(-1.2, 0.65, 0.55),
    new THREE.Vector3(-1.55, 0.61, 0.55),
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
