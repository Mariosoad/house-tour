"use client";

import { createContext, useContext, useRef, useCallback, useState } from "react";

export type TourScrollContextValue = {
  /** Current progress 0..1 (wrapping for infinite). */
  progress: number;
  /** Target progress when jumping to a waypoint (smooth ease). */
  targetProgress: number | null;
  /** Set target for smooth jump (0..1). */
  setTargetProgress: (t: number | null) => void;
  /** Add delta to progress (from wheel). */
  addDelta: (delta: number) => void;
  /** Set progress (e.g. after jump animation ends). */
  setProgress: (t: number) => void;
  /** Ref for internal progress (for use in useFrame). */
  progressRef: React.MutableRefObject<number>;
  /** Ref for target progress. */
  targetProgressRef: React.MutableRefObject<number | null>;
  /** Ref con el t suavizado de la cámara (0..1), actualizado cada frame. Para sincronizar luz con cámara. */
  cameraTRef: React.MutableRefObject<number>;
};

const TourScrollContext = createContext<TourScrollContextValue | null>(null);

const SCROLL_SPEED = 0.0004;

export function TourScrollProvider({ children }: { children: React.ReactNode }) {
  const progressRef = useRef(0);
  const targetProgressRef = useRef<number | null>(null);
  const cameraTRef = useRef(0);
  const [progress, setProgressState] = useState(0);
  const [targetProgress, setTargetProgressState] = useState<number | null>(null);

  const addDelta = useCallback((delta: number) => {
    progressRef.current += delta * SCROLL_SPEED;
    progressRef.current = progressRef.current - Math.floor(progressRef.current); // fract, keep 0..1
    if (progressRef.current < 0) progressRef.current += 1;
    setProgressState(progressRef.current);
  }, []);

  const setTargetProgress = useCallback((t: number | null) => {
    targetProgressRef.current = t;
    setTargetProgressState(t);
  }, []);

  const setProgress = useCallback((t: number) => {
    const wrapped = t - Math.floor(t);
    const v = wrapped < 0 ? wrapped + 1 : wrapped;
    progressRef.current = v;
    setProgressState(v);
  }, []);

  const value: TourScrollContextValue = {
    progress,
    targetProgress,
    setTargetProgress,
    addDelta,
    setProgress,
    progressRef,
    targetProgressRef,
    cameraTRef,
  };

  return (
    <TourScrollContext.Provider value={value}>
      {children}
    </TourScrollContext.Provider>
  );
}

export function useTourScroll(): TourScrollContextValue {
  const ctx = useContext(TourScrollContext);
  if (!ctx) throw new Error("useTourScroll must be used within TourScrollProvider");
  return ctx;
}
