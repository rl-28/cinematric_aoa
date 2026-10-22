"use client";

import { useEffect, useRef } from "react";
import { useSimStore } from "./store";

/**
 * Custom React hook that drives the shared simulation clock using requestAnimationFrame.
 *
 * Characteristics:
 *   - Tick interval = 900ms / speed.
 *   - Accumulates delta time via requestAnimationFrame (not setInterval).
 *   - Auto-cleans up on unmount or pause.
 *   - Safe under React StrictMode (clean teardown and ref resets).
 */
export function useReplay(): void {
  const playing = useSimStore((s) => s.playing);
  const speed = useSimStore((s) => s.speed);
  const stepForward = useSimStore((s) => s.stepForward);

  const lastTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimeRef.current = null;
      accumulatedRef.current = 0;
      return;
    }

    // Wall-clock interval between simulation ticks (900ms / speed)
    const intervalMs = 900 / speed;

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = now - lastTimeRef.current;
        accumulatedRef.current += delta;

        // Advance simulation tick when interval threshold is crossed
        while (accumulatedRef.current >= intervalMs) {
          accumulatedRef.current -= intervalMs;
          stepForward();
        }
      }
      lastTimeRef.current = now;

      // Keep scheduling RAF if playing is still active
      if (useSimStore.getState().playing) {
        rafIdRef.current = requestAnimationFrame(loop);
      }
    };

    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimeRef.current = null;
      accumulatedRef.current = 0;
    };
  }, [playing, speed, stepForward]);
}
