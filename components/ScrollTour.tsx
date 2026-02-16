"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "@/lib/math";
import { useTourScroll } from "@/lib/tourScrollContext";

const DAMPING = 3;
const JUMP_EASE_SPEED = 1.2;

/** Camera path positions (CatmullRomCurve3). */
function getPositionCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(8, 3.5, 8),
    new THREE.Vector3(5, 2.8, 5),
    new THREE.Vector3(4, 2.2, 2),
    new THREE.Vector3(1, 3, 3),
    new THREE.Vector3(-4, 2.8, 3),
    new THREE.Vector3(-3, 3.5, 6),
    new THREE.Vector3(2, 4, 9),
    new THREE.Vector3(8, 3.5, 8),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

/** Camera lookAt targets along the path. */
function getTargetCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(3, 0.6, 2),
    new THREE.Vector3(1.5, 1, 1.5),
    new THREE.Vector3(-2.5, 0.4, 1.5),
    new THREE.Vector3(-1, 1, 2),
    new THREE.Vector3(0, 1, 2),
    new THREE.Vector3(0, 1.5, 0),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

export function ScrollTour() {
  const { camera } = useThree();
  const { progressRef, targetProgressRef, setProgress } = useTourScroll();

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
