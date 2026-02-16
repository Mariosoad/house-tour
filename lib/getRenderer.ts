"use client";

/**
 * Returns an async factory for the Three.js WebGPURenderer.
 * Used as Canvas gl prop: gl={getWebGPURenderer}
 * Only call when useWebGPU().supported === true.
 */
export async function getWebGPURenderer(
  props: { canvas: HTMLCanvasElement | OffscreenCanvas; [key: string]: unknown }
): Promise<unknown> {
  const mod = await import("three/webgpu");
  const WebGPURenderer = (mod as unknown as Record<string, new (p: { canvas: HTMLCanvasElement }) => unknown>).WebGPURenderer;
  const raw = new WebGPURenderer(props as { canvas: HTMLCanvasElement });
  const renderer = raw as unknown as {
    init: () => Promise<void>;
    setPixelRatio: (n: number) => void;
    shadowMap: { enabled: boolean };
    toneMapping: number;
    toneMappingExposure: number;
    outputColorSpace: string;
  };
  await renderer.init();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = 4; // ACESFilmic
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = "srgb";
  return raw;
}
