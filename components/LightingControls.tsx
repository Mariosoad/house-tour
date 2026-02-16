"use client";

import { useEffect, useRef, useState } from "react";

export type LightingControlsProps = {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
};

const PRESETS: { label: string; time: number; rotation: number }[] = [
  { label: "Golden", time: 0.15, rotation: 45 },
  { label: "Midday", time: 0.5, rotation: 0 },
  { label: "Sunset", time: 0.85, rotation: -30 },
];

function timeToClock(t: number): string {
  const hour = Math.floor(5 + t * 14) % 24;
  const minute = Math.floor(((5 + t * 14) % 1) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export function LightingControls({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
}: LightingControlsProps) {
  const [preset, setPreset] = useState<string>("Midday");
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (clockRef.current) clockRef.current.textContent = timeToClock(timeOfDay);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeOfDay]);

  return (
    <div
      className="lighting-controls"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 100,
        padding: "14px 18px",
        borderRadius: 12,
        background: "rgba(24, 24, 28, 0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "#e4e4e7",
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 10, letterSpacing: "0.02em" }}>
        LIGHTING
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>TIME OF DAY</span>
          <span ref={clockRef}>{timeToClock(timeOfDay)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={timeOfDay}
          onChange={(e) => onTimeOfDayChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#a78bfa" }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 4 }}>SUN ROTATION</div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={sunRotation}
          onChange={(e) => onSunRotationChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#a78bfa" }}
        />
      </div>

      <div>
        <div style={{ marginBottom: 4 }}>Preset</div>
        <select
          value={preset}
          onChange={(e) => {
            const p = PRESETS.find((x) => x.label === e.target.value);
            if (p) {
              setPreset(p.label);
              onTimeOfDayChange(p.time);
              onSunRotationChange(p.rotation);
            }
          }}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)",
            color: "#e4e4e7",
            fontSize: 13,
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
