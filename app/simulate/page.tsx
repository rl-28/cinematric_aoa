"use client";

import React from "react";
import { useSimStore } from "@/lib/sim/store";
import { useReplay } from "@/lib/sim/useReplay";
import { totalTicks } from "@/lib/sim/selectors";
import { MatrixPipeline } from "@/components/svd/MatrixPipeline";
import { VectorGraph } from "@/components/cb/VectorGraph";

export default function SimulatorPage() {
  // Drive the shared clock via requestAnimationFrame
  useReplay();

  const store = useSimStore();
  const maxTick = Math.max(0, totalTicks(store) - 1);

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      {/* ========================================================= */}
      {/* Temporary Control Harness Header (Real ControlBar in Ph5) */}
      {/* ========================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-surface border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-accent font-black tracking-wider text-lg font-sans">
            CINEMETRIC
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-xs font-mono text-neutral-300">
            Phase 3 SVD Harness
          </span>
        </div>

        {/* Playback & Step Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={store.reset}
            className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            title="Reset to Tick 0"
          >
            ⏮ Reset
          </button>

          <button
            onClick={store.stepBack}
            disabled={store.tick <= 0}
            className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-neutral-200 transition-colors"
            title="Step Back 1 Tick"
          >
            ◀ Step Back
          </button>

          <button
            onClick={store.toggle}
            className={`px-4 py-1.5 rounded font-bold transition-all shadow-sm ${
              store.playing
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40"
                : "bg-accent hover:bg-red-600 text-white shadow-accent/40"
            }`}
          >
            {store.playing ? "⏸ Pause" : "▶ Play"}
          </button>

          <button
            onClick={store.stepForward}
            disabled={store.tick >= maxTick}
            className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-neutral-200 transition-colors"
            title="Step Forward 1 Tick"
          >
            Step Fwd ▶
          </button>

          {/* Speed Selector */}
          <div className="flex items-center rounded bg-neutral-900 border border-neutral-800 ml-2 overflow-hidden">
            {([0.5, 1, 2, 4] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => store.setSpeed(spd)}
                className={`px-2 py-1 text-[11px] transition-colors ${
                  store.speed === spd
                    ? "bg-accent text-white font-bold"
                    : "text-muted hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Cold-Start Toggle */}
          <button
            onClick={() => store.setColdStart(!store.coldStart)}
            className={`ml-2 px-2.5 py-1 rounded text-[11px] font-sans font-bold border transition-colors ${
              store.coldStart
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-neutral-800 text-neutral-500 border-neutral-700"
            }`}
          >
            Cold-Start: {store.coldStart ? "ON" : "OFF"}
          </button>
        </div>

        {/* Tick Scrubber */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            Tick <strong className="text-white">{store.tick}</strong> / {maxTick}
          </span>
          <input
            type="range"
            min={0}
            max={maxTick}
            value={store.tick}
            onChange={(e) => store.seek(Number(e.target.value))}
            className="w-28 accent-accent cursor-pointer"
          />
        </div>
      </header>

      {/* ========================================================= */}
      {/* 50/50 Split Dashboard Body                                */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Left Panel: SVD Matrix Pipeline (50% Width) */}
        <section className="w-full lg:w-1/2 flex flex-col h-[calc(100vh-80px)]">
          <MatrixPipeline />
        </section>

        {/* Right Panel: Content-Based Vector Space Visualizer (50% Width) */}
        <section className="w-full lg:w-1/2 flex flex-col h-[calc(100vh-80px)]">
          <VectorGraph />
        </section>
      </main>
    </div>
  );
}
