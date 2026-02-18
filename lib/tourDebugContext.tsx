"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

export type TourDebugInfo = {
  position: [number, number, number];
  target: [number, number, number];
  progress: number;
};

type TourDebugContextValue = {
  infoRef: React.MutableRefObject<TourDebugInfo | null>;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const TourDebugContext = createContext<TourDebugContextValue | null>(null);

export function TourDebugProvider({ children }: { children: React.ReactNode }) {
  const infoRef = useRef<TourDebugInfo | null>(null);
  const [enabled, setEnabled] = useState(true);
  return (
    <TourDebugContext.Provider value={{ infoRef, enabled, setEnabled }}>
      {children}
    </TourDebugContext.Provider>
  );
}

export function useTourDebug() {
  const ctx = useContext(TourDebugContext);
  return ctx;
}
