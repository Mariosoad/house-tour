"use client";

import { useState, useEffect } from "react";

/**
 * Detects WebGPU support in the current browser.
 * Used to choose WebGPU renderer (with SSGI) vs WebGL fallback.
 */
export function useWebGPU(): {
  supported: boolean | null;
  checking: boolean;
} {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        if (typeof navigator === "undefined" || !navigator.gpu) {
          if (!cancelled) setSupported(false);
          return;
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          if (!cancelled) setSupported(false);
          return;
        }
        const limits = adapter.limits;
        if (!cancelled) setSupported(!!limits);
      } catch {
        if (!cancelled) setSupported(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { supported, checking };
}
