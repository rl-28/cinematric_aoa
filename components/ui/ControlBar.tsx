"use client";

import React, { useEffect, useState } from "react";
import { useSimStore, PlaybackSpeed, DatasetScale } from "@/lib/sim/store";
import { totalTicks, progress } from "@/lib/sim/selectors";

export const ControlBar: React.FC = () => {
  const store = useSimStore();
  const maxTick = Math.max(0, totalTicks(store) - 1);
  const currentProgress = progress(store);
  const isBenchmarking = store.benchmark.status === "running";

  // Hydration safety guard for any timing-dependent rendering
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
  const scales: { id: DatasetScale; label: string; sub: string }[] = [
    { id: "demo", label: "Demo", sub: "10×14" },
    { id: "100", label: "100", sub: "100×60" },
    { id: "500x300", label: "500×300", sub: "~2.5s" },
  ];

  return (
    <footer
      className="sticky bottom-0 left-0 right-0 z-30 bg-surface border-t border-neutral-800 shadow-2xl px-4 py-2.5"
      role="region"
      aria-label="Simulation Controls"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
        {/* ========================================================= */}
        {/* Left: Playback & Step Controls                            */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reset */}
          <button
            onClick={store.reset}
            aria-label="Reset simulation to tick 0 (Shortcut: R)"
            title="Reset to Tick 0 [R]"
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            ⏮ Reset
          </button>

          {/* Step Back */}
          <button
            onClick={store.stepBack}
            disabled={store.tick <= 0}
            aria-label="Step back one tick (Shortcut: Left Arrow)"
            title="Step Back [←]"
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            ◀ Back
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={store.toggle}
            aria-label={store.playing ? "Pause simulation (Shortcut: Space)" : "Play simulation (Shortcut: Space)"}
            title={store.playing ? "Pause [Space]" : "Play [Space]"}
            className={`px-4 py-1.5 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              store.playing
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30"
                : "bg-accent hover:bg-red-600 text-white shadow-accent/30"
            }`}
          >
            {store.playing ? (
              <>
                <span className="w-2 h-2 rounded-sm bg-white animate-pulse" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>Play</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={store.stepForward}
            disabled={store.tick >= maxTick}
            aria-label="Step forward one tick (Shortcut: Right Arrow)"
            title="Step Forward [→]"
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Fwd ▶
          </button>

          {/* Speed Selector */}
          <div
            className="flex items-center rounded bg-neutral-900 border border-neutral-800 p-0.5 ml-1"
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
                  className={`px-2 py-1 text-[11px] font-mono rounded-[3px] transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    active
                      ? "bg-accent text-white font-bold shadow-sm"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Center: Timeline Scrubber with Tick & Progress Indicator   */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3 w-full md:w-64 lg:w-72">
          <div className="flex flex-col w-full gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted">
              <span>
                Tick <strong className="text-white">{mounted ? store.tick : 0}</strong> of {maxTick}
              </span>
              <span className="text-accent font-semibold">
                {mounted ? Math.round(currentProgress * 100) : 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxTick}
              value={mounted ? store.tick : 0}
              onChange={(e) => store.seek(Number(e.target.value))}
              aria-label="Scrub simulation timeline"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* Right: Cold-Start Toggle & Dataset Scale Selector         */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cold-Start Toggle */}
          <div className="flex flex-col items-start">
            <button
              onClick={() => store.setColdStart(!store.coldStart)}
              role="switch"
              aria-checked={store.coldStart}
              aria-label="Inject new release with 0 ratings"
              title="Toggle injection of Chronopolis (m14) to test cold-start resilience"
              className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-medium transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                store.coldStart
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                  store.coldStart
                    ? "bg-amber-400 border-amber-300"
                    : "bg-neutral-800 border-neutral-700"
                }`}
              >
                {store.coldStart && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
              <span className="font-sans text-[11px]">Inject new release (0 ratings)</span>
            </button>
            <span className="text-[9px] text-neutral-500 pl-1 pt-0.5 max-w-[200px] truncate">
              {store.coldStart
                ? "Chronopolis (m14) injected to test cold-start"
                : "Standard catalog only; m14 excluded"}
            </span>
          </div>

          <div className="w-[1px] h-7 bg-neutral-800 hidden sm:block" />

          {/* Dataset Scale Selector (affects ONLY benchmark section) */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted font-mono uppercase">Scale:</span>
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
                      aria-label={`Dataset scale ${sc.label} (${sc.sub})`}
                      aria-pressed={active}
                      title={`Benchmark scale: ${sc.label} (${sc.sub})${sc.id === "500x300" ? " - takes ~2.5s" : ""}`}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                        active
                          ? "bg-neutral-800 text-white font-bold border border-neutral-700 shadow-sm"
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
            <span className="text-[9px] text-neutral-500 pl-1 pt-0.5">
              {isBenchmarking
                ? "Running benchmark..."
                : store.datasetScale === "500x300"
                ? "500×300 (takes ~2.5s)"
                : "Affects benchmark overlay only"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
