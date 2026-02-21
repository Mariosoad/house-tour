"use client";

import { useState, useEffect, useCallback } from "react";

function useIsFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    handler(); // initial check
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return isFullscreen;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function FullscreenButton() {
  const isFullscreen = useIsFullscreen();
  const isMobile = useIsMobile();
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof document !== "undefined" && !!document.documentElement.requestFullscreen
    );
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      // User denied or not supported
      console.warn("Fullscreen failed:", err);
    }
  }, []);

  // Solo mostrar en mobile y si el navegador soporta fullscreen
  if (!isMobile || !supported) return null;

  return (
    <button
      type="button"
      className="fullscreen-btn"
      onClick={toggle}
      aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
    >
      {isFullscreen ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  );
}
