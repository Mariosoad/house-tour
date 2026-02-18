/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useTourDebug } from "@/lib/tourDebugContext";

function fmt(n: number) {
  return n.toFixed(2);
}

export function TourDebugOverlay() {
  const debug = useTourDebug();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [info, setInfo] = useState<{ position: [number, number, number]; target: [number, number, number]; progress: number } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!debug?.enabled) return;
    const tick = () => {
      const data = debug.infoRef.current;
      if (data) setInfo(data);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [debug?.enabled, debug?.infoRef]);

  if (!debug || !mounted) return null;

  if (!debug.enabled) {
    return (
      <button
        type="button"
        onClick={() => debug.setEnabled(true)}
        style={{
          position: "fixed",
          top: 80,
          left: 12,
          zIndex: 200,
          padding: "6px 10px",
          fontFamily: "monospace",
          fontSize: 11,
          color: "#94a3b8",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Mostrar debug recorrido
      </button>
    );
  }

  if (!info) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        left: 12,
        zIndex: 200,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#fff",
        background: "rgba(0,0,0,0.75)",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.15)",
        minWidth: 280,
        userSelect: "all",
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600, color: "#a5f3fc" }}>
        Debug recorrido
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>position: </span>
        <code>[{fmt(info.position[0])}, {fmt(info.position[1])}, {fmt(info.position[2])}]</code>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>target: </span>
        <code>[{fmt(info.target[0])}, {fmt(info.target[1])}, {fmt(info.target[2])}]</code>
      </div>
      <div>
        <span style={{ color: "#94a3b8" }}>progress (t): </span>
        <code>{info.progress.toFixed(4)}</code>
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: "#64748b" }}>
        Copia estos valores para definir waypoints
      </div>
      <button
        type="button"
        onClick={() => debug.setEnabled(false)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "none",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: 14,
        }}
        aria-label="Cerrar debug"
      >
        ✕
      </button>
    </div>
  );
}
