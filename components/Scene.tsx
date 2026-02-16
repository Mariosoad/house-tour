"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type SceneProps = {
  timeOfDay?: number;
  sunRotation?: number;
};

function sunPosition(timeOfDay: number, sunRotationDeg: number): THREE.Vector3 {
  const hour = 5 + timeOfDay * 14; // 5 AM -> 9 PM
  const angle = ((hour - 5) / 14) * Math.PI; // 0 at 5 AM, PI at 9 PM
  const radius = 35;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.6 + 8;
  const z = Math.sin(angle * 0.5) * radius * 0.3;
  const v = new THREE.Vector3(x, y, z);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), (sunRotationDeg * Math.PI) / 180);
  return v;
}

function sunColorAndIntensity(timeOfDay: number): { color: THREE.Color; intensity: number } {
  const hour = 5 + timeOfDay * 14;
  const t = (hour - 5) / 14;
  const midday = 0.5;
  const distFromMidday = Math.abs(t - midday) * 2;
  const warmth = 1 - distFromMidday;
  const kelvin = 5500 + warmth * 3500;
  const intensity = 1.2 + (1 - distFromMidday) * 1.8;
  const r = kelvin <= 6600 ? 1 : Math.min(1, 1.292 - (kelvin - 6600) / 3400);
  const g =
    kelvin <= 6600
      ? Math.min(1, 0.39 * Math.log(kelvin / 100 - 2) - 0.26)
      : Math.min(1, 0.543 + ((kelvin - 6600) / 3400) * 0.18);
  const b =
    kelvin <= 2000 ? 0 : kelvin <= 6600 ? 0.543 + ((kelvin - 2000) / 4600) * 0.2 : 1;
  return { color: new THREE.Color(r, g, b), intensity: Math.min(3, intensity * 1.5) };
}

export function Scene({ timeOfDay = 0.35, sunRotation = 0 }: SceneProps) {
  const { gl } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  lightTarget.position.set(0, 0, 0);

  const [label, setLabel] = useState<string | null>(null);
  const labelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pos = sunPosition(timeOfDay, sunRotation);
  const { color, intensity } = sunColorAndIntensity(timeOfDay);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.copy(pos);
      sunRef.current.color.copy(color);
      sunRef.current.intensity = intensity;
      sunRef.current.target.position.set(0, 0, 0);
      sunRef.current.target.updateMatrixWorld();
      sunRef.current.shadow.updateMatrices(sunRef.current);
    }
  });

  const setCursor = (c: string) => {
    gl.domElement.style.cursor = c;
  };

  const showLabel = (name: string) => {
    if (labelTimeout.current) clearTimeout(labelTimeout.current);
    setLabel(name);
    labelTimeout.current = setTimeout(() => {
      setLabel(null);
      labelTimeout.current = null;
    }, 2500);
  };

  return (
    <>
      <ambientLight intensity={0.08} />
      <primitive object={lightTarget} />
      <directionalLight
        ref={sunRef}
        position={[pos.x, pos.y, pos.z]}
        target={lightTarget}
        intensity={intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={0.5}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3d3d3d" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh
        position={[0, 1.5, 0]}
        castShadow
        receiveShadow
        onClick={() => showLabel("Main box")}
        onPointerOver={(e) => (e.stopPropagation(), setCursor("pointer"))}
        onPointerOut={() => setCursor("default")}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#c0a080" roughness={0.6} metalness={0.1} />
        {label === "Main box" && (
          <Html center distanceFactor={6}>
            <div className="scene-label">Main box</div>
          </Html>
        )}
      </mesh>

      <mesh
        position={[3, 0.6, 2]}
        castShadow
        receiveShadow
        onClick={() => showLabel("Blue box")}
        onPointerOver={(e) => (e.stopPropagation(), setCursor("pointer"))}
        onPointerOut={() => setCursor("default")}
      >
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#6080a0" roughness={0.5} metalness={0.15} />
        {label === "Blue box" && (
          <Html center distanceFactor={6}>
            <div className="scene-label">Blue box</div>
          </Html>
        )}
      </mesh>

      <mesh
        position={[-2.5, 0.4, 1.5]}
        castShadow
        receiveShadow
        onClick={() => showLabel("Sphere")}
        onPointerOver={(e) => (e.stopPropagation(), setCursor("pointer"))}
        onPointerOut={() => setCursor("default")}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#e8a050"
          emissive="#e8a050"
          emissiveIntensity={0.4}
          roughness={0.6}
          metalness={0}
        />
        {label === "Sphere" && (
          <Html center distanceFactor={6}>
            <div className="scene-label">Sphere</div>
          </Html>
        )}
      </mesh>

      <color attach="background" args={["#1a1a22"]} />
    </>
  );
}
