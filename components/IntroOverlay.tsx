"use client";

import Image from "next/image";

interface IntroOverlayProps {
  onStart: () => void;
  className?: string;
}

export function IntroOverlay({ onStart, className = "" }: IntroOverlayProps) {
  return (
    <div
      className={`intro-overlay ${className}`.trim()}
      role="dialog"
      aria-label="Pantalla de bienvenida"
    >
      <div className="intro-overlay__backdrop" aria-hidden="true" />
      <div className="intro-overlay__content">
        <p className="intro-overlay__subtitle">THREEJS SSGI & N8A0 <br /> DEMO BY GEMDAM</p>
       
        <div className="intro-overlay__logo">
          <Image
            src="/logo-gemdam.png"
            alt="Gemdam"
            width={400}
            height={280}
            priority
            className="intro-overlay__logo-img"
          />
        </div>
         <button
          type="button"
          className="intro-overlay__btn"
          onClick={onStart}
          aria-label="Comenzar experiencia"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
