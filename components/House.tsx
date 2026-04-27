/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type * as THREEType from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MirrorReplica } from "./MirrorReplica";
import { useMetrics } from "@/lib/metricsContext";
import { useRenderSettings } from "@/lib/renderSettingsContext";

type GLTFResult = { scene: THREEType.Group };

const MODEL_URL = "/DeluxeVilla1.glb";

const GLASS_NAMES = /vidrio|glass|cristal|window|ventana|cerramiento|crystal|pane/i;
const MIRROR_NAMES = /espejo|mirror|reflector/i;
const FAN_ROTATION_SPEED = 3;

function isGlassMaterial(mat: { name?: string; transmission?: number }): boolean {
  const name = mat?.name ?? "";
  if (GLASS_NAMES.test(name)) return true;
  if (typeof (mat as { transmission?: number }).transmission === "number" && (mat as { transmission: number }).transmission > 0.5) return true;
  return false;
}

function isMirrorMaterial(mat: { name?: string }): boolean {
  const name = mat?.name ?? "";
  return MIRROR_NAMES.test(name);
}

type HouseProps = {
  parentGroupRef: RefObject<THREE.Group | null>;
  wireframe?: boolean;
};

function safeTraverse(
  root: THREE.Object3D | null | undefined,
  callback: (obj: THREE.Object3D) => void
) {
  if (!root || typeof root.traverse !== "function") return;
  try {
    root.traverse(callback);
  } catch {
    // During hot-reload the scene graph can be in a transient invalid state.
  }
}

export function House({ parentGroupRef, wireframe = false }: HouseProps) {
  const { gl } = useThree();
  const { effectiveTier } = useMetrics();
  const { settings } = useRenderSettings();
  const glassMaterial = useMemo(() => {
    const color = 0xcfe9ff;
    if (effectiveTier === "low") {
      // Mucho más barato que `MeshPhysicalMaterial` con `transmission` (evita refracción/transmisión).
      return new THREE.MeshStandardMaterial({
        // En `low` no usamos `transmission`, así que este material se ve más como plástico si
        // lo teñimos fuerte. Para que "se vea vidrio", lo desaturamos al máximo.
        color: 0xffffff,
        transparent: true,
        // Ajusta la translucidez para que no se perciba un "color opaco" sobre el vidrio.
        opacity: 0.15,
        depthWrite: false,
        roughness: 0.15,
        metalness: 0,
      });
    }

    return new THREE.MeshPhysicalMaterial({
      color,
      transmission: 1,
      opacity: 0.6,
      transparent: true,
      depthWrite: false,
      roughness: 0.1,
      metalness: 0,
      ior: 1.2,
      thickness: 0.5,
    });
  }, [effectiveTier]);

  // GLB puede traer texturas KTX2. THREE.GLTFLoader requiere
  // setKTX2Loader(ktx2Loader) antes de que intente cargarlas.
  const ktx2Loader = useMemo(() => {
    const loader = new KTX2Loader();
    // Basis transcoder provisto por three via CDN (necesario para decodificar KTX2).
    loader.setTranscoderPath("https://unpkg.com/three@0.181.2/examples/jsm/libs/basis/");
    // Detecta soporte del renderer antes de que el loader cargue KTX2.
    loader.detectSupport(gl);
    return loader;
  }, [gl]);

  const gltf = useLoader(GLTFLoader, MODEL_URL, (loader) => {
    loader.setKTX2Loader(ktx2Loader);
  }) as unknown as GLTFResult & { scene: THREEType.Group };

  const modelScene = useMemo(() => {
    const candidate = gltf?.scene as unknown;
    if (!candidate) return null;
    if (typeof (candidate as THREE.Object3D).traverse !== "function") return null;
    return candidate as THREE.Group;
  }, [gltf]);
  const [mirrorMeshes, setMirrorMeshes] = useState<THREE.Mesh[]>([]);
  const [fanMeshes, setFanMeshes] = useState<THREE.Mesh[]>([]);
  const fanAxis = useRef(new THREE.Vector3(0, 0, 1));
  const originalWireframe = useRef(new WeakMap<THREE.Material, boolean>());
  const originalRoughness = useRef(new WeakMap<THREE.Material, number>());
  const originalColor = useRef(new WeakMap<THREE.Material, THREE.Color>());
  const originalMetalness = useRef(new WeakMap<THREE.Material, number>());
  const originalMap = useRef(new WeakMap<THREE.Material, THREE.Texture | null>());
  const originalEmissive = useRef(new WeakMap<THREE.Material, THREE.Color>());
  const originalEmissiveIntensity = useRef(new WeakMap<THREE.Material, number>());
  const originalEmissiveMap = useRef(new WeakMap<THREE.Material, THREE.Texture | null>());
  const originalMeshMaterial = useRef(new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const wireframeShadedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#646464",
        roughness: 1,
        metalness: 0,
      }),
    []
  );
  const aoOnlyPreviewMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
      }),
    []
  );
  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#f2f2f2",
        transparent: true,
        opacity: 0.82,
        depthTest: true,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const currentScene = modelScene;
    if (!currentScene || typeof currentScene.traverse !== "function") return;
    const mirrors: THREE.Mesh[] = [];
    const fans: THREE.Mesh[] = [];
    safeTraverse(currentScene, (obj) => {
      if ((obj as THREEType.Mesh).isMesh) {
        const mesh = obj as THREEType.Mesh;
        // console.log("House mesh", mesh);
        let hasGlass = false;
        let hasMirror = false;
        if (mesh.name === "Mesh087_1"  || mesh.name === "Mesh088" || mesh.name === "Mesh087" || mesh.name === "Mesh088_1") {
          const fanRoot = mesh
            fans.push(fanRoot);
        }
        if (Array.isArray(mesh.material)) {
          const materials = mesh.material;
          materials.forEach((mat, i) => {
            if (isMirrorMaterial(mat)) {
              hasMirror = true;
            } else if (isGlassMaterial(mat)) {
              hasGlass = true;
              materials[i] = glassMaterial;
              mesh.userData.cannotReceiveAO = true;
            }
          });
        } else if (mesh.material) {
          if (isMirrorMaterial(mesh.material)) {
            hasMirror = true;
          } else if (isGlassMaterial(mesh.material)) {
            hasGlass = true;
            mesh.material = glassMaterial;
            mesh.userData.cannotReceiveAO = true;
          }
        }
        if (hasMirror) {
          mesh.visible = false;
          mirrors.push(mesh);
        } else {
          mesh.castShadow = !hasGlass;
          mesh.receiveShadow = true;
        }
      }
    });
    setMirrorMeshes(mirrors);
    setFanMeshes(fans);
  }, [modelScene, glassMaterial]);

  useEffect(() => {
    const currentScene = modelScene;
    if (!currentScene || typeof currentScene.traverse !== "function") return;
    const wireframeEnabled = (wireframe || settings.wireframe) && !settings.aoOnlyMode;
    edgeMaterial.color.set(wireframeEnabled ? "#f5f5f5" : "#e6e6e6");
    edgeMaterial.opacity = wireframeEnabled ? 0.86 : 0.78;
    edgeMaterial.needsUpdate = true;

    safeTraverse(currentScene, (obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const previewMode = settings.aoOnlyMode ? "ao-only" : wireframeEnabled ? "wireframe" : "default";

      if (previewMode !== "default") {
        if (!originalMeshMaterial.current.has(mesh)) {
          originalMeshMaterial.current.set(mesh, mesh.material);
        }
        mesh.material =
          previewMode === "ao-only" ? aoOnlyPreviewMaterial : wireframeShadedMaterial;
      } else {
        const original = originalMeshMaterial.current.get(mesh);
        if (original) mesh.material = original;
      }

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((material) => {
        if (!material) return;

        const mat = material as THREE.Material & {
          wireframe?: boolean;
          roughness?: number;
          color?: THREE.Color;
          metalness?: number;
          map?: THREE.Texture | null;
          emissive?: THREE.Color;
          emissiveIntensity?: number;
          emissiveMap?: THREE.Texture | null;
        };

        if (typeof mat.wireframe === "boolean" && !originalWireframe.current.has(mat)) {
          originalWireframe.current.set(mat, mat.wireframe);
        }
        mat.wireframe = false;

        if (typeof mat.roughness === "number") {
          if (!originalRoughness.current.has(mat)) {
            originalRoughness.current.set(mat, mat.roughness);
          }
          mat.roughness = settings.aoOnlyMode ? 1 : (originalRoughness.current.get(mat) ?? mat.roughness);
        }

        if (mat.color) {
          if (!originalColor.current.has(mat)) {
            originalColor.current.set(mat, mat.color.clone());
          }
          if (previewMode === "ao-only") {
            mat.color.set("#ffffff");
          } else if (previewMode === "wireframe") {
            // "Wireframe on shaded": neutral clay shading + edge overlay.
            mat.color.set("#646464");
          } else {
            const original = originalColor.current.get(mat);
            if (original) mat.color.copy(original);
          }
        }

        if (typeof mat.metalness === "number") {
          if (!originalMetalness.current.has(mat)) {
            originalMetalness.current.set(mat, mat.metalness);
          }
          mat.metalness =
            previewMode === "default" ? (originalMetalness.current.get(mat) ?? mat.metalness) : 0;
        }

        if ("map" in mat) {
          if (!originalMap.current.has(mat)) {
            originalMap.current.set(mat, mat.map ?? null);
          }
          mat.map = previewMode === "default" ? (originalMap.current.get(mat) ?? null) : null;
        }

        if (mat.emissive) {
          if (!originalEmissive.current.has(mat)) {
            originalEmissive.current.set(mat, mat.emissive.clone());
          }
          if (previewMode !== "default") {
            mat.emissive.set("#000000");
          } else {
            const original = originalEmissive.current.get(mat);
            if (original) mat.emissive.copy(original);
          }
        }

        if (typeof mat.emissiveIntensity === "number") {
          if (!originalEmissiveIntensity.current.has(mat)) {
            originalEmissiveIntensity.current.set(mat, mat.emissiveIntensity);
          }
          mat.emissiveIntensity =
            previewMode === "default"
              ? (originalEmissiveIntensity.current.get(mat) ?? mat.emissiveIntensity)
              : 0;
        }

        if ("emissiveMap" in mat) {
          if (!originalEmissiveMap.current.has(mat)) {
            originalEmissiveMap.current.set(mat, mat.emissiveMap ?? null);
          }
          mat.emissiveMap =
            previewMode === "default" ? (originalEmissiveMap.current.get(mat) ?? null) : null;
        }

        if (previewMode !== "default") mat.roughness = 1;
        mat.needsUpdate = true;
      });

      const existingOverlay = mesh.userData.wireframeOverlay as THREE.LineSegments | undefined;
      if (wireframeEnabled && !existingOverlay && mesh.geometry) {
        const overlay = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 0.001),
          edgeMaterial
        );
        overlay.name = `${mesh.name || "mesh"}__wireframe_overlay`;
        overlay.renderOrder = 2;
        overlay.frustumCulled = false;
        overlay.raycast = () => null;
        mesh.userData.wireframeOverlay = overlay;
        mesh.add(overlay);
      } else if (existingOverlay && !wireframeEnabled) {
        mesh.remove(existingOverlay);
        (existingOverlay.geometry as THREE.BufferGeometry).dispose();
        mesh.userData.wireframeOverlay = undefined;
      }
    });
  }, [
    modelScene,
    wireframe,
    settings.wireframe,
    settings.aoOnlyMode,
    edgeMaterial,
  ]);

  useEffect(() => {
    const currentScene = modelScene;
    if (!currentScene || typeof currentScene.traverse !== "function") return;
    const wireframeMap = originalWireframe.current;
    const roughnessMap = originalRoughness.current;
    const colorMap = originalColor.current;
    const metalnessMap = originalMetalness.current;
    const mapStore = originalMap.current;
    const emissiveStore = originalEmissive.current;
    const emissiveIntensityStore = originalEmissiveIntensity.current;
    const emissiveMapStore = originalEmissiveMap.current;
    const meshMaterialStore = originalMeshMaterial.current;
    return () => {
      safeTraverse(currentScene, (obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const originalMeshMat = meshMaterialStore.get(mesh);
        if (originalMeshMat) mesh.material = originalMeshMat;
        const existingOverlay = mesh.userData.wireframeOverlay as THREE.LineSegments | undefined;
        if (existingOverlay) {
          mesh.remove(existingOverlay);
          (existingOverlay.geometry as THREE.BufferGeometry).dispose();
          mesh.userData.wireframeOverlay = undefined;
        }
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if (!material) return;
          const mat = material as THREE.Material & {
            wireframe?: boolean;
            roughness?: number;
            color?: THREE.Color;
            metalness?: number;
            map?: THREE.Texture | null;
            emissive?: THREE.Color;
            emissiveIntensity?: number;
            emissiveMap?: THREE.Texture | null;
          };
          const originalW = wireframeMap.get(mat);
          if (typeof mat.wireframe === "boolean" && typeof originalW === "boolean") mat.wireframe = originalW;
          const originalR = roughnessMap.get(mat);
          if (typeof mat.roughness === "number" && typeof originalR === "number") mat.roughness = originalR;
          const originalC = colorMap.get(mat);
          if (mat.color && originalC) mat.color.copy(originalC);
          const originalM = metalnessMap.get(mat);
          if (typeof mat.metalness === "number" && typeof originalM === "number") mat.metalness = originalM;
          if ("map" in mat) mat.map = mapStore.get(mat) ?? null;
          const originalE = emissiveStore.get(mat);
          if (mat.emissive && originalE) mat.emissive.copy(originalE);
          const originalEI = emissiveIntensityStore.get(mat);
          if (typeof mat.emissiveIntensity === "number" && typeof originalEI === "number") mat.emissiveIntensity = originalEI;
          if ("emissiveMap" in mat) mat.emissiveMap = emissiveMapStore.get(mat) ?? null;
          mat.needsUpdate = true;
        });
      });
      wireframeShadedMaterial.dispose();
      aoOnlyPreviewMaterial.dispose();
      edgeMaterial.dispose();
    };
  }, [modelScene, edgeMaterial, wireframeShadedMaterial, aoOnlyPreviewMaterial]);

  useFrame((_, delta) => {
    if (!fanMeshes.length) return;
  
    fanMeshes.forEach((fan) => {
      fan.rotateOnAxis(fanAxis.current, FAN_ROTATION_SPEED * delta);
    });
  });

  return (
    <>
      {modelScene ? <primitive object={modelScene} /> : null}
      {effectiveTier === "low" ? null : (
        mirrorMeshes.map((m) => (
          <MirrorReplica
            key={m.uuid}
            sourceMesh={m}
            parentGroupRef={parentGroupRef}
            rotationX={90}
            rotationY={0}
            rotationZ={0}
            offsetX={0}
            offsetY={0.95}
            offsetZ={-3.3}
          />
        ))
      )}
    </>
  );
}
