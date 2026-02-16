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

function timeToDisplay(t: number): { hourMin: string; ampm: string } {
  const hour = Math.floor(5 + t * 14) % 24;
  const minute = Math.floor(((5 + t * 14) % 1) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return {
    hourMin: `${h}:${minute.toString().padStart(2, "0")}`,
    ampm,
  };
}

export function LightingControls({
  timeOfDay,
  sunRotation,
  onTimeOfDayChange,
  onSunRotationChange,
}: LightingControlsProps) {
  const [preset, setPreset] = useState<string>("Brunch");
  const [open, setOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hourMinRef = useRef<HTMLSpanElement>(null);
  const ampmRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { hourMin, ampm } = timeToDisplay(timeOfDay);
      if (hourMinRef.current) hourMinRef.current.textContent = hourMin;
      if (ampmRef.current) ampmRef.current.textContent = ampm;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeOfDay]);

  const handlePresetSelect = (p: (typeof PRESETS)[0]) => {
    setPreset(p.label);
    onTimeOfDayChange(p.time);
    onSunRotationChange(p.rotation);
    setDropdownOpen(false);
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: "16px 20px 14px",
    borderRadius: 24,
    background: "rgba(32, 32, 36, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 13,
    color: "#e4e4e7",
    minWidth: 720,
    maxWidth: 720,
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir controles de iluminación"
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          padding: "10px 18px",
          borderRadius: 20,
          background: "rgba(32, 32, 36, 0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Time of day
      </button>
    );
  }

  // Posiciones de las etiquetas en % para alinear con el slider (0 = 5 AM, 1 = 9 PM)
  const timeLabels = [
    { label: "5 AM", t: 0 },
    { label: "9 AM", t: (9 - 5) / 14 },
    { label: "1 PM", t: (13 - 5) / 14 },
    { label: "5 PM", t: (17 - 5) / 14 },
    { label: "9 PM", t: 1 },
  ];
  const rotationLabels = [
    { label: "0°", v: 0 },
    { label: "90°", v: 90 },
    { label: "180°", v: 180 },
    { label: "270°", v: 270 },
    { label: "360°", v: 360 },
  ];

  return (
    <div className="lighting-controls" style={panelStyle}>
      {/* Hora + preset como un solo bloque */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexShrink: 0,
          paddingRight: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            ref={hourMinRef}
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timeToDisplay(timeOfDay).hourMin}
          </span>
          <span
            ref={ampmRef}
            style={{
              marginLeft: 4,
              alignSelf: "flex-end",
              paddingBottom: 4,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {timeToDisplay(timeOfDay).ampm}
          </span>
        </div>

        {/* Preset dropdown "Brunch" pegado a la hora */}
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {preset}
            <span style={{ fontSize: 10, opacity: 0.9 }}>▲</span>
          </button>
        {dropdownOpen && (
          <ul
            role="listbox"
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: 4,
              padding: "6px 0",
              borderRadius: 10,
              background: "rgba(28,28,32,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              listStyle: "none",
              minWidth: 120,
              zIndex: 200,
            }}
          >
            {PRESETS.map((p) => (
              <li key={p.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={preset === p.label}
                  onClick={() => handlePresetSelect(p)}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    color: preset === p.label ? "#fff" : "rgba(255,255,255,0.85)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>

      {/* TIME OF DAY slider with gradient track */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          TIME OF DAY
        </div>
        <div className="lighting-slider-wrap">
          <div
            aria-hidden
            className="lighting-track"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <div
              style={{
                height: 10,
                width: "100%",
                borderRadius: 5,
                background:
                  "linear-gradient(to right, #1e3a5f 0%, #2d5a87 18%, #6b9bb8 35%, #a8c040 50%, #c9a227 65%, #e07850 82%, #8b3a3a 100%)",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={timeOfDay}
            onChange={(e) => onTimeOfDayChange(Number(e.target.value))}
            className="lighting-range lighting-range-time"
          />
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 2,
            height: 14,
          }}
        >
          {timeLabels.map(({ label, t }) => (
            <span
              key={label}
              style={{
                position: "absolute",
                left: `${t * 100}%`,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* SUN ROTATION slider */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          SUN ROTATION
        </div>
        <div className="lighting-slider-wrap">
          <div
            aria-hidden
            className="lighting-track"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <div
              style={{
                height: 10,
                width: "100%",
                borderRadius: 5,
                background: "rgba(255,255,255,0.15)",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={sunRotation}
            onChange={(e) => onSunRotationChange(Number(e.target.value))}
            className="lighting-range lighting-range-rotation"
          />
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 2,
            height: 14,
          }}
        >
          {rotationLabels.map(({ label, v }) => (
            <span
              key={label}
              style={{
                position: "absolute",
                left: `${(v / 360) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar panel"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
