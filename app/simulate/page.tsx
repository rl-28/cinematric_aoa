"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSimStore } from "@/lib/sim/store";
import { useReplay } from "@/lib/sim/useReplay";
import { MatrixPipeline } from "@/components/svd/MatrixPipeline";
import { VectorGraph } from "@/components/cb/VectorGraph";
import { ControlBar } from "@/components/ui/ControlBar";
import { MetricsOverlay } from "@/components/ui/MetricsOverlay";

type ViewMode = "split" | "svd" | "cb";

export default function SimulatePage() {
  // Drive the shared clock via requestAnimationFrame
  useReplay();

  // Hydration safety guard for initial render
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-bg text-text overflow-hidden select-none">
      {/* ========================================================= */}
      {/* Top Bar: CINEMETRIC link, Lab Title, Mode Switcher, Nav   */}
      {/* ========================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2 bg-surface border-b border-neutral-800 shrink-0 z-20">
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
          <Link
            href="/"
            className="text-xs text-muted hover:text-white transition-colors ml-1 font-sans hidden sm:inline"
          >
            Back to home
          </Link>
        </div>

        {/* View Mode Switcher: Reduces cognitive overload by letting user focus on 1 algo at a time */}
        <div className="flex items-center bg-black/60 border border-neutral-800 rounded-lg p-0.5 gap-1 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 rounded-md font-sans text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Compare SVD and Content-Based side by side"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="8" height="18" rx="1" />
              <rect x="13" y="3" width="8" height="18" rx="1" />
            </svg>
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("svd")}
            className={`px-3 py-1 rounded-md font-sans text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "svd"
                ? "bg-accent text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Focus solely on SVD Matrix Pipeline and Step-by-Step Calculations"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            <span>SVD Focus</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cb")}
            className={`px-3 py-1 rounded-md font-sans text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "cb"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Focus solely on Content-Based Vector Space and Cosine Math"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
            </svg>
            <span>Content-Based Focus</span>
          </button>
        </div>

        {/* Right Section: Interactive Sandbox Link */}
        <div className="flex items-center gap-2 text-xs">
          {/* Link to Dedicated Interactive Session */}
          <Link
            href="/interactive"
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-all font-sans"
            title="Open Interactive Session to rate your own movies and simulate"
          >
            <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Interactive Sandbox</span>
            <span className="text-[10px] bg-accent/20 text-accent border border-accent/40 px-1 rounded font-mono font-normal">Custom Input</span>
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* Main Simulation View: Adaptive Layout based on ViewMode   */}
      {/* ========================================================= */}
      <main
        className={`flex-1 min-h-0 flex flex-col gap-3 p-3 overflow-y-auto lg:overflow-hidden ${
          viewMode === "split"
            ? "lg:grid lg:grid-cols-2"
            : "lg:grid lg:grid-cols-1 max-w-5xl lg:mx-auto w-full"
        }`}
      >
        {/* Left Panel: SVD Matrix Pipeline */}
        {(viewMode === "split" || viewMode === "svd") && (
          <section
            className="w-full h-[520px] lg:h-full min-h-0 flex flex-col"
            aria-label="SVD Collaborative Filtering Visualization"
          >
            <MatrixPipeline />
          </section>
        )}

        {/* Right Panel: Content-Based Vector Space Visualizer */}
        {(viewMode === "split" || viewMode === "cb") && (
          <section
            className="w-full h-[520px] lg:h-full min-h-0 flex flex-col"
            aria-label="Content-Based Vector Space Visualization"
          >
            <VectorGraph />
          </section>
        )}
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
