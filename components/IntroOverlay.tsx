"use client";

import { useEffect } from "react";

interface IntroOverlayProps {
  onStart: () => void;
  loadingPage?: boolean;
  className?: string;
}

export function IntroOverlay({ onStart, loadingPage = true, className = "" }: IntroOverlayProps) {
  useEffect(() => {
    const handleWheel = () => {
      onStart();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("wheel", handleWheel);
    };
    window.addEventListener("wheel", handleWheel);
    return cleanup;
  }, [onStart]);

  return (
    <div
      className={`intro-overlay ${className}`.trim()}
      role="dialog"
      aria-label="Pantalla de bienvenida"
    >
      <div className="intro-overlay__backdrop" aria-hidden="true" />
      <div className="intro-overlay__content">
        <div>
          <p className="intro-overlay__subtitle">THREEJS SSGI <br/> & <br/> N8A0</p>
          <br/> 
          <p className="intro-overlay__subtitle_author">By Mario Hinotroza & Rodrigo Isasmendi</p>
        </div>
        {loadingPage ? (
          <div className="intro-overlay__loading" aria-live="polite" aria-label="Cargando">
            <div className="intro-overlay__loading-spinner" aria-hidden="true" />
          </div>
        ) : (
        <div className="intro-overlay__scroll-hint" aria-hidden="true">
          <svg
            className="intro-overlay__scroll-icon"
            viewBox="0 0 24 36"
            width={32}
            height={48}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="24" rx="7" />
            <line x1="12" y1="8" x2="12" y2="14" className="scroll-wheel" />
          </svg>
          <span className="intro-overlay__scroll-text">Scroll to navigate</span>
        </div>
        )}
      </div>
    </div>
  );
}
