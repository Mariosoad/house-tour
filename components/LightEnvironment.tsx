import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, useHelper } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { EffectiveTier } from "@/lib/metricsContext";

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
  const intensity = 2 + (1 - distFromMidday) * 2.2;
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
  effectiveTier?: EffectiveTier;
  /** SpotLight dinámico para acento: [x, y, z] */
  spotLightPosition?: [number, number, number];
  /** Objetivo del SpotLight (hacia dónde apunta) */
  spotLightTarget?: [number, number, number];
  spotLightIntensity?: number;
  spotLightAngle?: number;
  spotLightPenumbra?: number;
  spotLightDistance?: number;
  /** Muestra helpers/markers para ubicar el SpotLight */
  debugSpotLight?: boolean;
  /** Tamaño de los marcadores del modo debug */
  debugSpotLightMarkerSize?: number;
  /** Multiplicador de intensidad cuando debug está activo */
  debugSpotLightIntensityBoost?: number;
};

function shadowMapSize(tier: EffectiveTier): [number, number] {
  if (tier === "low") return [2048, 2048];
  if (tier === "medium") return [3072, 3072];
  return [4096, 4096];
}

/** Convierte la posición del sol en rotación del HDRI para que la iluminación venga de la misma dirección/altura */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function envRotationFromSun(pos: THREE.Vector3): [number, number, number] {
  const len = pos.length();
  if (len < 0.01) return [0.4, 0, 1.4];
  const azimuth = Math.atan2(pos.x, pos.z);
  const elevation = Math.asin(pos.y / len);
  return [elevation, azimuth, 1.4];
}

export function Light_Environment({
  timeOfDay = 0.4,
  sunRotation = 0,
  effectiveTier = "ultra",
  spotLightTarget = [0, 0.5, 0],
  debugSpotLight = true,
}: LightEnvironmentProps) {
  const { camera } = useThree();
  const isMobileTier = effectiveTier === "low";
  const HDRI_LIGHT = "/Coast_Palms_HDRI_1K.hdr";
  const HDRI_HEAVY = "/Coast_Palms_HDRI.hdr";
  const rotationEuler: [number, number, number] = [0, Math.PI / -3, 0];
  const lightTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 0, 0);
    return t;
  }, []);
  const spotTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(spotLightTarget[2], spotLightTarget[1], spotLightTarget[2]);
    t.position.set(0, 0, 10);
    return t;
  }, [spotLightTarget]);

  const spotRef = useRef<THREE.SpotLight>(null!);
  const pointRef = useRef<THREE.PointLight>(null!);
  const pointRef2 = useRef<THREE.PointLight>(null!);
  useHelper(debugSpotLight ? spotRef : null, THREE.SpotLightHelper, "cyan");
  const pos = sunPosition(timeOfDay, sunRotation);
  const { color, intensity } = sunColorAndIntensity(timeOfDay);
  // console.log("camera.positionX", camera.position.x);
  // console.log("camera.positionY", camera.position.y);
  // console.log("camera.positionZ", camera.position.z);
  const isOffLighting = camera.position.x >= -0.71 && camera.position.z <= -0.1 || camera.position.z <= -0.02

  return (
    <>
      <ambientLight intensity={0.02} />
      <primitive object={lightTarget} />
      <primitive object={spotTarget} />
      <directionalLight
        position={[pos.x, pos.y, pos.z]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={shadowMapSize(effectiveTier)}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-top={6}
        shadow-camera-right={6}
        shadow-camera-bottom={-6}
        shadow-camera-left={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.01}
        />
        <hemisphereLight
          position={[0, 0, 0]}
          intensity={0.4}
          color={"#FFD6A3"}
        />
        <pointLight
          ref={pointRef}
          position={[0.7, 0.5, -0.08]}
          intensity={isOffLighting ? 0 : 0.4}
          color={"#FFD6A3"}
        />
        <pointLight
          ref={pointRef2}
          position={[-0.75, 0.7, 1.7]}
          intensity={isOffLighting ? 0 : 0.6}
          color={"#FFD6A3"}
        />

      {isMobileTier ? (
        // En móvil: mismo HDRI liviano para background + iluminación.
        <Environment
          files={HDRI_LIGHT}
          background
          environmentIntensity={0.3}
          backgroundRotation={rotationEuler}
          environmentRotation={rotationEuler}
        />
      ) : (
        // Desktop: separar HDRI de background vs iluminación para no “duplicar” iluminación.
        <>
          {/* HDRI SOLO para background (sin contribuir a scene.environment) */}
          <Environment files={HDRI_HEAVY} background="only" backgroundRotation={rotationEuler} />

          {/* HDRI SOLO para iluminación (reflexiones/ambient) */}
          <Environment
            files={HDRI_LIGHT}
            environmentIntensity={0.3}
            environmentRotation={rotationEuler}
            background={false}
          />
        </>
      )}
    </>
  );
}
