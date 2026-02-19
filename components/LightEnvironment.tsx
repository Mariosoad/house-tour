import { useMemo } from "react";
import * as THREE from "three";
import { Environment } from "@react-three/drei";

function sunPosition(timeOfDay: number, sunRotationDeg: number): THREE.Vector3 {
  const hour = 5 + timeOfDay * 14;
  const angle = ((hour - 5) / 14) * Math.PI;
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
  const intensity = 1.8 + (1 - distFromMidday) * 2.2;
  const r = kelvin <= 6600 ? 1 : Math.min(1, 1.292 - (kelvin - 6600) / 3400);
  const g =
    kelvin <= 6600
      ? Math.min(1, 0.39 * Math.log(kelvin / 100 - 2) - 0.26)
      : Math.min(1, 0.543 + ((kelvin - 6600) / 3400) * 0.18);
  const b =
    kelvin <= 2000 ? 0 : kelvin <= 6600 ? 0.543 + ((kelvin - 2000) / 4600) * 0.2 : 1;
  return { color: new THREE.Color(r, g, b), intensity: Math.min(4, intensity * 1.6) };
}

export type LightEnvironmentProps = {
  timeOfDay?: number;
  sunRotation?: number;
};

export function Light_Environment({ timeOfDay = 0.4, sunRotation = 0 }: LightEnvironmentProps) {
  const lightTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 0, 0);
    return t;
  }, []);
  const pos = sunPosition(timeOfDay, sunRotation);
  const { color, intensity } = sunColorAndIntensity(timeOfDay);
  const envIntensity = 0.25 + 0.35 * (1 - Math.min(1, Math.abs((timeOfDay * 14 + 5 - 12) / 7)));

  return (
    <>
      <ambientLight intensity={0.02} />
      <primitive object={lightTarget} />
      <directionalLight
        position={[pos.x, pos.y, pos.z]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-top={6}
        shadow-camera-right={6}
        shadow-camera-bottom={-6}
        shadow-camera-left={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.01}
      />
      <Environment
        preset="warehouse"
        environmentIntensity={Math.max(0.05, envIntensity)}
        environmentRotation={[0.4, 0, 1.4]}
      />
    </>
  );
}
