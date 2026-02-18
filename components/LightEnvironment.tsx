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
  return { color: new THREE.Color(r, g, b), intensity: Math.min(2.5, intensity * 1.2) };
}

export type LightEnvironmentProps = {
  timeOfDay?: number;
  sunRotation?: number;
};

export function Light_Environment({ timeOfDay = 0.4, sunRotation = 0 }: LightEnvironmentProps) {
  const pos = sunPosition(timeOfDay, sunRotation);
  const { color, intensity } = sunColorAndIntensity(timeOfDay);
  const envIntensity = 0.06 + 0.12 * (0.5 - Math.abs((timeOfDay * 14 + 5 - 12) / 14));
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[pos.x, pos.y, pos.z]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-top={15}
        shadow-camera-right={15}
        shadow-camera-bottom={-15}
        shadow-camera-left={-15}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />
      <Environment
        preset="warehouse"
        environmentIntensity={Math.max(0.08, envIntensity)}
        environmentRotation={[0.4, 0, 1.4]}
      />
    </>
  );
}
