"use client";

/**
 * WebGPU-only: Builds the post-processing pipeline with the official SSGI node (TSL)
 * and TRAA for temporal stability. Uses three/addons/tsl/display/SSGINode.js (r181).
 * Must be rendered only when WebGPU is available.
 */

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export type GIQuality = {
  sliceCount: number;
  stepCount: number;
  radius: number;
  expFactor: number;
  thickness: number;
  aoIntensity: number;
  giIntensity: number;
  useTemporalFiltering: boolean;
  resolutionScale: number;
};

const DEFAULT_QUALITY: GIQuality = {
  sliceCount: 2,
  stepCount: 8,
  radius: 8,
  expFactor: 1.5,
  thickness: 0.5,
  aoIntensity: 1,
  giIntensity: 15,
  useTemporalFiltering: true,
  resolutionScale: 1,
};

export function useGIPipeline(quality: Partial<GIQuality> = {}) {
  const { scene, camera, gl } = useThree();
  const postRef = useRef<{ render: () => void; dispose: () => void } | null>(null);
  const rafRef = useRef<number>(0);
  const qualityRef = useRef({ ...DEFAULT_QUALITY, ...quality });
  qualityRef.current = { ...DEFAULT_QUALITY, ...quality };

  useEffect(() => {
    let cancelled = false;
    const renderer = gl;
    const opts = qualityRef.current;

    async function setup() {
      const [
        webgpuModule,
        tsl,
        { ssgi },
        { traa },
      ] = await Promise.all([
        import("three/webgpu"),
        import("three/tsl"),
        import("three/addons/tsl/display/SSGINode.js"),
        import("three/addons/tsl/display/TRAANode.js"),
      ]);

      const {
        pass,
        mrt,
        output,
        diffuseColor,
        normalView,
        velocity,
        add,
        vec4,
        directionToColor,
        colorToDirection,
        sample,
      } = tsl;

      const scenePass = pass(scene, camera);
      scenePass.setMRT(
        mrt({
          output,
          diffuseColor,
          normal: directionToColor(normalView),
          velocity,
        })
      );

      const scenePassColor = scenePass.getTextureNode("output");
      const scenePassDiffuse = scenePass.getTextureNode("diffuseColor");
      const scenePassNormal = scenePass.getTextureNode("normal");
      const scenePassVelocity = scenePass.getTextureNode("velocity");
      // SSGI/TRAA expect a TextureNode with .sample(uv), not getLinearDepthNode()
      const scenePassDepth = scenePass.getTextureNode("depth");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sceneNormal = sample((uv: any) => colorToDirection(scenePassNormal.sample(uv)));

      const perspCamera = camera as import("three").PerspectiveCamera;
      const giPass = ssgi(scenePassColor, scenePassDepth, sceneNormal, perspCamera);
      giPass.sliceCount.value = opts.sliceCount;
      giPass.stepCount.value = opts.stepCount;
      giPass.radius.value = opts.radius;
      giPass.expFactor.value = opts.expFactor;
      giPass.thickness.value = opts.thickness;
      giPass.aoIntensity.value = opts.aoIntensity;
      giPass.giIntensity.value = opts.giIntensity;
      giPass.useTemporalFiltering = opts.useTemporalFiltering;

      const gi = giPass.rgb;
      const ao = giPass.a;
      const compositePass = vec4(
        add(
          scenePassColor.rgb.mul(ao),
          scenePassDiffuse.rgb.mul(gi)
        ),
        scenePassColor.a
      );

      const finalNode = opts.useTemporalFiltering
        ? (traa as (a: unknown, b: unknown, c: unknown, d: unknown) => unknown)(compositePass, scenePassDepth, scenePassVelocity, perspCamera)
        : compositePass;

      const PostProcessing = (webgpuModule as { PostProcessing?: new (r: unknown, n: unknown) => { render: () => void; dispose: () => void } }).PostProcessing;
      if (!PostProcessing) {
        console.warn("PostProcessing not found on three/webgpu");
        return;
      }
      const post = new PostProcessing(renderer, finalNode);
      postRef.current = post;

      function render() {
        if (cancelled || !postRef.current) return;
        postRef.current.render();
        rafRef.current = requestAnimationFrame(render);
      }
      rafRef.current = requestAnimationFrame(render);
    }

    setup();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (postRef.current && typeof postRef.current.dispose === "function") {
        postRef.current.dispose();
      }
      postRef.current = null;
    };
  }, [scene, camera, gl]);

  return postRef;
}

/** Renders the SSGI + TRAA pipeline when used inside a WebGPU Canvas. */
export function GIPipeline(props: { quality?: Partial<GIQuality> }) {
  useGIPipeline(props.quality ?? {});
  return null;
}
