"use client";

import { useEffect } from "react";

interface LoadedReporterProps {
  onLoaded: () => void;
}

/** Renders null; when mounted (after Suspense resolves), reports that loading is complete. */
export function LoadedReporter({ onLoaded }: LoadedReporterProps) {
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return null;
}
