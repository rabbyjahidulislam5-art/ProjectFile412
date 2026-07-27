"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

// Ease-out cubic: fast start, gentle settle — the value lands rather than stops.
function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * Animates between the previous and next value. Respects
 * `prefers-reduced-motion` by snapping straight to the target.
 */
export function useCountUp(target: number): number {
  const [displayed, setDisplayed] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    if (prefersReducedMotion || from === target) {
      fromRef.current = target;
      setDisplayed(target);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setDisplayed(from + (target - from) * easeOut(progress));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      fromRef.current = target;
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target]);

  return displayed;
}
