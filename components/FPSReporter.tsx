"use client";

/* eslint-disable */
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMetrics } from "@/lib/metricsContext";

const UPDATE_INTERVAL = 0.25;

type RendererInfoSnapshot = {
  autoReset?: boolean;
  render?: {
    calls?: number;
    triangles?: number;
  };
  memory?: {
    geometries?: number;
    textures?: number;
  };
};

export function FPSReporter({ enabled }: { enabled?: boolean }) {
  const { setFps } = useMetrics();
  const { gl } = useThree();
  const overlayEnabled = enabled ?? true;

  const panelElRef = useRef<HTMLDivElement | null>(null);
  const titleElRef = useRef<HTMLDivElement | null>(null);
  const detailsElRef = useRef<HTMLDivElement | null>(null);

  const elapsed = useRef(0);
  const frames = useRef(0);
  const totalDelta = useRef(0);

  useEffect(() => {
    if (!overlayEnabled) return;
    if (typeof document === "undefined") return;

    // We read gl.info from a useFrame callback, which runs before the actual WebGL render.
    // Disable autoReset so gl.info.render.* stays stable until we manually reset it.
    const infoObj = (gl as unknown as { info?: RendererInfoSnapshot }).info;
    if (infoObj?.render) {
      infoObj.autoReset = false;
      infoObj.render.calls = infoObj.render.calls ?? 0;
      infoObj.render.triangles = infoObj.render.triangles ?? 0;
    }

    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "3.5rem";
    panel.style.right = "1rem";
    panel.style.zIndex = "1000";
    panel.style.pointerEvents = "none";
    panel.style.fontFamily = "var(--font-lexend), sans-serif";
    panel.style.padding = "0.6rem 0.9rem";
    panel.style.borderRadius = "20px";
    panel.style.background = "rgba(32, 32, 36, 0.95)";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.alignItems = "flex-end";

    const title = document.createElement("div");
    title.style.fontSize = "0.95rem";
    title.style.fontWeight = "600";
    title.style.color = "rgba(255, 255, 255, 0.95)";
    title.style.fontVariantNumeric = "tabular-nums";

    const details = document.createElement("div");
    details.style.marginTop = "0.25rem";
    details.style.fontSize = "12px";
    details.style.color = "rgba(255, 255, 255, 0.9)";
    details.style.fontVariantNumeric = "tabular-nums";
    details.style.whiteSpace = "pre";

    panel.appendChild(title);
    panel.appendChild(details);
    document.body.appendChild(panel);

    panelElRef.current = panel;
    titleElRef.current = title;
    detailsElRef.current = details;

    return () => {
      // Best-effort restore; this is only for dev overlay usage.
      const infoObj = (gl as unknown as { info?: RendererInfoSnapshot }).info;
      if (infoObj) infoObj.autoReset = true;
      panel.remove();
      panelElRef.current = null;
      titleElRef.current = null;
      detailsElRef.current = null;
    };
  }, [overlayEnabled, gl]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    frames.current += 1;
    totalDelta.current += delta;
    if (elapsed.current >= UPDATE_INTERVAL) {
      const avgFps = frames.current / totalDelta.current;
      const avgFrameMs = (totalDelta.current / frames.current) * 1000;
      setFps(Math.round(avgFps)); // keep existing metrics context behavior

      if (overlayEnabled) {
        // WebGLRenderer.info contains render + memory stats we can use for debugging.
        const info = (gl as unknown as { info?: RendererInfoSnapshot }).info;
        const render = info?.render;
        const memory = info?.memory;

        const fpsInt = Math.round(avgFps);

        const drawCallsAccum = render?.calls ?? 0;
        const trianglesAccum = render?.triangles ?? 0;
        const avgDrawCalls = drawCallsAccum / frames.current;
        const avgTriangles = trianglesAccum / frames.current;

        const geometries = memory?.geometries ?? 0;
        const textures = memory?.textures ?? 0;

        if (titleElRef.current && detailsElRef.current) {
          titleElRef.current.textContent = `${fpsInt} FPS`;
          detailsElRef.current.textContent =
            `${avgFrameMs.toFixed(1)} ms/frame\n` +
            `DRAW CALLS ${Math.round(avgDrawCalls)}\n` +
            `TRIANGLES ${Math.round(avgTriangles)}\n` +
            `GEOMETRIES ${geometries}\n` +
            `TEXTURES ${textures}`;
        }

        // Reset counters for the next interval.
        if (render) {
          render.calls = 0;
          render.triangles = 0;
        }
      }

      elapsed.current = 0;
      frames.current = 0;
      totalDelta.current = 0;
    }
  });

  if (!overlayEnabled) return null;

  // Overlay es 2D DOM creado imperativamente en useEffect.
  return null;
}
