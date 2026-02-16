"use client";

import { useEffect, useRef, useState } from "react";

export type LightingControlsProps = {
  timeOfDay: number;
  sunRotation: number;
  onTimeOfDayChange: (v: number) => void;
  onSunRotationChange: (v: number) => void;
};

const PRESETS: { label: string; time: number; rotation: number }[] = [
  { label: "Dawn", time: 0.08, rotation: 25 },
  { label: "Morning", time: 0.25, rotation: 15 },
  { label: "Brunch", time: 0.4, rotation: 0 },
  { label: "Golden", time: 0.5, rotation: -10 },
  { label: "Dusk", time: 0.85, rotation: -30 },
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
  const [preset, setPreset] = useState<string>("Brunch");
  const [collapsed, setCollapsed] = useState(false);
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

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "18px 20px",
    borderRadius: 16,
    background: "rgba(18, 18, 22, 0.82)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 13,
    color: "#e4e4e7",
    minWidth: 320,
    maxWidth: 380,
  };

  const sliderTrackGradient =
    "linear-gradient(to right, #1e3a5f 0%, #2d5a87 20%, #6b9bb8 40%, #c9a227 60%, #e07850 80%, #8b3a3a 100%)";

  return (
    <div className="lighting-controls" style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          ref={clockRef}
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeToClock(timeOfDay)}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Abrir panel" : "Cerrar panel"}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#a0a0b0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {collapsed ? "☰" : "✕"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label
              htmlFor="preset-select"
              style={{ color: "#a0a0b0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Preset
            </label>
            <select
              id="preset-select"
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
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#a0a0b0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Time of day
              </span>
              <span style={{ fontSize: 11, color: "#808090" }}>5 AM — 9 PM</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: sliderTrackGradient,
                marginBottom: 4,
                position: "relative",
              }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={timeOfDay}
              onChange={(e) => onTimeOfDayChange(Number(e.target.value))}
              style={{
                width: "100%",
                height: 20,
                marginTop: -28,
                marginBottom: 0,
                accentColor: "#c9a227",
                cursor: "pointer",
                background: "transparent",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 10, color: "#606070" }}>
              <span>5 AM</span>
              <span>1 PM</span>
              <span>5 PM</span>
              <span>9 PM</span>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#a0a0b0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Sun rotation
              </span>
              <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{Math.round(sunRotation)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={sunRotation}
              onChange={(e) => onSunRotationChange(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#c9a227",
                cursor: "pointer",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 10, color: "#606070" }}>
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
              <span>270°</span>
              <span>360°</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
