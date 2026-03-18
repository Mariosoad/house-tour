"use client";

import { useRef } from "react";
import * as THREE from "three";
import { PointerLockControls, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useMetrics } from "@/lib/metricsContext";

const MOVE_SPEED = 0.01;

/** Reads WASD from KeyboardControls and moves the camera. */
function FirstPersonMover() {
  const [, getKeys] = useKeyboardControls<"forward" | "backward" | "left" | "right">();
  const { camera } = useThree();
  const dir = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    const { forward, backward, left, right: rightKey } = getKeys();
    if (!forward && !backward && !left && !rightKey) return;

    camera.getWorldDirection(dir.current);
    right.current.crossVectors(dir.current, up.current).normalize();

    if (forward) camera.position.addScaledVector(dir.current, MOVE_SPEED);
    if (backward) camera.position.addScaledVector(dir.current, -MOVE_SPEED);
    if (rightKey) camera.position.addScaledVector(right.current, MOVE_SPEED);
    if (left) camera.position.addScaledVector(right.current, -MOVE_SPEED);
  });

  return null;
}

/** When freeCamera is true, enables PointerLockControls + WASD for first-person movement. */
export function CameraController() {
  const { freeCamera } = useMetrics();
  if (!freeCamera) return null;

  return (
    <>
      <PointerLockControls makeDefault />
      <FirstPersonMover />
    </>
  );
}
