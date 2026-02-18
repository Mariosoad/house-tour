'use client';

import { Canvas, extend } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { ResizeHandler } from "./RizeHandler";
import { Frameloop } from "@react-three/fiber";
import { Camera } from "three";

extend(THREE);

export type ManciniCanvasProps = {
  quality: "default" | "high";
  camera: Camera;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  children: React.ReactNode;
};

export function ManciniCanvas({ quality = "default", camera, canvas, children }: ManciniCanvasProps) {
  const rendererRef = useRef<unknown>(null);
  const [frameloop, setFrameloop] = useState<Frameloop>("never");
  return (
    <Canvas
      eventSource={canvas instanceof HTMLCanvasElement ? canvas : undefined}
      onCreated={(state) => {
        state.setSize(window.innerWidth, window.innerHeight);
      }}
      frameloop={frameloop}
      dpr={quality === "default" ? 1 : [1, 1.5]}
      camera={camera}
      shadows={"soft"}
      gl={() => {
        const renderer = new THREE.WebGPURenderer({
          canvas,
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
          stencil: false,
        });

        // Initialize WebGPU and store renderer reference
        renderer.init().then(() => setFrameloop("always"));
        rendererRef.current = renderer;
        return renderer;
      }}
    >
      {children}
      <ResizeHandler quality={quality} rendererRef={rendererRef} />
    </Canvas>
  );
}
