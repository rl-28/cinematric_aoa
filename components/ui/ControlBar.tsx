"use client";

import React, { useEffect, useState } from "react";
import { useSimStore, PlaybackSpeed, DatasetScale } from "@/lib/sim/store";
import { totalTicks, progress } from "@/lib/sim/selectors";
import { COLD_MOVIE_ID } from "@/lib/data/movies";

export const ControlBar: React.FC = () => {
  const store = useSimStore();
  const maxTick = Math.max(0, totalTicks(store) - 1);
  const currentProgress = progress(store);
  const isBenchmarking = store.benchmark.status === "running";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Keyboard shortcuts: Space (play/pause), Left/Right (step), R (reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const tagName = activeEl?.tagName?.toUpperCase();
      if (
        tagName === "INPUT" ||
        tagName === "SELECT" ||
        tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        store.toggle();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        store.stepBack();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        store.stepForward();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        store.reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);

  const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];
  const demoUsers = store.benchmark.cache["demo"]?.numUsers ?? 10;
  const demoMovies = store.benchmark.cache["demo"]?.numMovies ?? 14;
  const scales: { id: DatasetScale; label: string; tooltip: string }[] = [
    { id: "demo", label: "Demo", tooltip: `Demo dataset (${demoUsers}×${demoMovies})` },
    { id: "100", label: "100", tooltip: "Synthetic benchmark (100×60)" },
    { id: "500x300", label: "500×300", tooltip: "Synthetic benchmark (500×300, takes ~2.5s)" },
  ];

  return (
    <footer
      className="sticky bottom-0 left-0 right-0 z-30 bg-surface border-t border-neutral-800 shadow-xl px-4 py-2"
      role="region"
      aria-label="Simulation Controls"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
        {/* ========================================================= */}
        {/* 1. Transport Controls                                     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Icon-only Reset */}
          <button
            onClick={store.reset}
            aria-label="Reset simulation to tick 0 (Shortcut: R)"
            title="Reset to start [R]"
            className="w-8 h-8 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-800 flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>

          {/* Step Back */}
          <button
            onClick={store.stepBack}
            disabled={store.tick <= 0}
            aria-label="Step back one tick (Shortcut: Left Arrow)"
            title="Step back [<-]"
            className="w-8 h-8 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-800 flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="17 4 7 12 17 20 17 4" />
            </svg>
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={store.toggle}
            aria-label={store.playing ? "Pause simulation (Shortcut: Space)" : "Play simulation (Shortcut: Space)"}
            title={store.playing ? "Pause [Space]" : "Play [Space]"}
            className={`px-3.5 h-8 rounded font-semibold text-xs tracking-wide flex items-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              store.playing
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-accent hover:bg-red-600 text-white"
            }`}
          >
            {store.playing ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={store.stepForward}
            disabled={store.tick >= maxTick}
            aria-label="Step forward one tick (Shortcut: Right Arrow)"
            title="Step forward [->]"
            className="w-8 h-8 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-800 flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="7 4 17 12 7 20 7 4" />
            </svg>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. Scrubber                                               */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[180px] max-w-xs">
          <span className="font-mono text-[11px] text-muted shrink-0">
            <strong className="text-white">{mounted ? store.tick : 0}</strong>/{maxTick}
          </span>
          <input
            type="range"
            min={0}
            max={maxTick}
            value={mounted ? store.tick : 0}
            onChange={(e) => store.seek(Number(e.target.value))}
            aria-label="Scrub simulation timeline"
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          />
          <span className="font-mono text-[11px] text-accent font-semibold shrink-0">
            {mounted ? Math.round(currentProgress * 100) : 0}%
          </span>
        </div>

        {/* ========================================================= */}
        {/* 3. Speed Selector                                         */}
        {/* ========================================================= */}
        <div
          className="flex items-center rounded bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
          role="group"
          aria-label="Playback speed"
        >
          {speeds.map((spd) => {
            const active = store.speed === spd;
            return (
              <button
                key={spd}
                onClick={() => store.setSpeed(spd)}
                aria-label={`Set speed to ${spd}x`}
                aria-pressed={active}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  active
                    ? "bg-accent text-white font-bold"
                    : "text-muted hover:text-white"
                }`}
              >
                {spd}x
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* 4. Cold-Start Toggle (No multi-line caption, tooltip only) */}
        {/* ========================================================= */}
        <button
          onClick={() => store.setColdStart(!store.coldStart)}
          role="switch"
          aria-checked={store.coldStart}
          aria-label="Inject new release with 0 ratings"
          title={`Inject Chronopolis (${COLD_MOVIE_ID}) with 0 ratings to test cold-start resilience`}
          className={`flex items-center gap-2 px-3 h-8 rounded border text-xs font-medium transition-all active:scale-95 shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            store.coldStart
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full flex items-center justify-center border transition-all ${
              store.coldStart
                ? "bg-amber-400 border-amber-300"
                : "bg-neutral-800 border-neutral-700"
            }`}
          >
            {store.coldStart && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
          </div>
          <span className="font-sans text-[11px]">Inject new release (0 ratings)</span>
        </button>

        {/* ========================================================= */}
        {/* 5. Dataset Scale Selector (No multi-line caption)         */}
        {/* ========================================================= */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          title="Affects synthetic benchmark section only"
        >
          <span className="text-[10px] text-muted font-sans uppercase">Scale:</span>
          <div
            className="flex items-center rounded bg-neutral-900 border border-neutral-800 p-0.5"
            role="group"
            aria-label="Dataset scale for benchmark comparison"
          >
            {scales.map((sc) => {
              const active = store.datasetScale === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => store.setDatasetScale(sc.id)}
                  disabled={isBenchmarking}
                  aria-label={`Dataset scale ${sc.label}`}
                  aria-pressed={active}
                  title={sc.tooltip}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    active
                      ? "bg-neutral-800 text-white font-bold border border-neutral-700"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {active && isBenchmarking && (
                    <svg
                      className="animate-spin h-2.5 w-2.5 text-accent"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
