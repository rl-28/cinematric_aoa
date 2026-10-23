"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/sim/store";
import { useReplay } from "@/lib/sim/useReplay";
import { TARGET_USER } from "@/lib/data/ratings";
import { MatrixPipeline } from "@/components/svd/MatrixPipeline";
import { VectorGraph } from "@/components/cb/VectorGraph";
import { ControlBar } from "@/components/ui/ControlBar";
import { MetricsOverlay } from "@/components/ui/MetricsOverlay";

export default function SimulatePage() {
  // Drive the shared clock via requestAnimationFrame
  useReplay();

  // Hydration safety guard for initial render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-bg text-text overflow-hidden select-none">
      {/* ========================================================= */}
      {/* Top Bar: CINEMETRIC link, Lab Title, Target User          */}
      {/* ========================================================= */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2 bg-surface border-b border-neutral-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Return to Cinemetric Landing Page"
            className="text-accent font-black tracking-wider text-base font-sans hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-1"
          >
            CINEMETRIC
          </Link>
          <span className="text-neutral-700 font-mono text-sm">/</span>
          <h1 className="text-white font-bold text-sm tracking-wide font-sans">
            Recommender Lab
          </h1>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
            SVD vs. Content-Based Simulation
          </span>
          <Link
            href="/"
            className="text-xs text-muted hover:text-white transition-colors ml-1 font-sans"
          >
            Back to home
          </Link>
        </div>

        {/* Target User Info & Dataset Context */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
            <span className="text-muted text-[11px] font-sans">Target User:</span>
            <span className="text-white font-mono font-semibold">
              {TARGET_USER.name.replace(" (Target)", "")}
            </span>
            <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/30 font-medium">
              Target
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* Main Simulation View: 50/50 Split on Desktop (>=1024px)   */}
      {/* Vertical Stack on Mobile (<1024px). Internal scrolling.   */}
      {/* ========================================================= */}
      <main className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-2 gap-3 p-3 overflow-y-auto lg:overflow-hidden">
        {/* Left Panel: SVD Matrix Pipeline */}
        <section
          className="w-full h-[520px] lg:h-full min-h-0 flex flex-col"
          aria-label="SVD Collaborative Filtering Visualization"
        >
          <MatrixPipeline />
        </section>

        {/* Right Panel: Content-Based Vector Space Visualizer */}
        <section
          className="w-full h-[520px] lg:h-full min-h-0 flex flex-col"
          aria-label="Content-Based Vector Space Visualization"
        >
          <VectorGraph />
        </section>
      </main>

      {/* ========================================================= */}
      {/* Metrics Overlay: Collapsible Drawer above ControlBar      */}
      {/* ========================================================= */}
      <div className="shrink-0 z-30">
        <MetricsOverlay />
      </div>

      {/* ========================================================= */}
      {/* Sticky Bottom ControlBar: Replay, Scrubber, Scale, Toggle */}
      {/* ========================================================= */}
      <ControlBar />
    </div>
  );
}
