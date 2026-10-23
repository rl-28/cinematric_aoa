"use client";

import React, { useEffect, useState } from "react";
import { useSimStore } from "@/lib/sim/store";
import { revealedExecMs } from "@/lib/sim/selectors";
import { getOfflineMetrics } from "@/lib/engines/metrics";

export const MetricsOverlay: React.FC = () => {
  const store = useSimStore();
  const [mounted, setMounted] = useState(false);
  // Collapsed by default at ALL viewport sizes
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Offline precomputed defensible metrics
  const offlineMetrics = getOfflineMetrics();

  // Execution times
  const svdRevealedMs = revealedExecMs(store, "svd");
  const cbRevealedMs = revealedExecMs(store, "content");
  const svdMedianMs = offlineMetrics.svd.execMs;
  const cbMedianMs = offlineMetrics.content.execMs;

  // Memory footprints
  const svdMemoryBytes = store.svdStats?.memoryBytes ?? offlineMetrics.svd.memoryBytes;
  const cbMemoryBytes = store.cbStats?.memoryBytes ?? offlineMetrics.content.memoryBytes;
  const totalMemory = svdMemoryBytes + cbMemoryBytes || 1;
  const svdMemPercent = Math.round((svdMemoryBytes / totalMemory) * 100);
  const cbMemPercent = 100 - svdMemPercent;

  // Precision@5 (Tied at 0.40 vs 0.40)
  const svdPrecision = offlineMetrics.svd.precisionAtK;
  const cbPrecision = offlineMetrics.content.precisionAtK;

  // Cold-start resilience scores
  const svdColdScore = offlineMetrics.svd.coldStartScore; // 0.00
  const cbColdScore = offlineMetrics.content.coldStartScore; // 1.00

  // Synthetic benchmark state
  const benchmark = store.benchmark;
  const benchResult = benchmark.result;
  const isBenchmarking = benchmark.status === "running";

  // Winner determinations (lower is better for time/memory)
  const isSvdTimeWinner = svdMedianMs < cbMedianMs;
  const isCbTimeWinner = cbMedianMs < svdMedianMs;

  const isSvdMemWinner = svdMemoryBytes < cbMemoryBytes;
  const isCbMemWinner = cbMemoryBytes < svdMemoryBytes;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes.toLocaleString()} B`;
  };

  return (
    <div
      className="bg-surface border-t border-neutral-800 shadow-2xl transition-all duration-200 font-sans"
      role="region"
      aria-label="Metrics and Performance Benchmark"
    >
      {/* ========================================================= */}
      {/* Collapsible Header Bar: One-Line Summary                  */}
      {/* ========================================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse metrics overlay" : "Expand metrics overlay"}
        className="w-full flex items-center justify-between px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800/80 transition-colors border-b border-neutral-800/80 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-white tracking-wide">
            Comparison Metrics
          </span>
          <span className="text-neutral-500 font-mono">·</span>
          <span className="text-neutral-300">
            Precision@5: <strong className="font-mono text-white">Tie ({svdPrecision.toFixed(2)})</strong>
          </span>
          <span className="text-neutral-500 font-mono hidden sm:inline">·</span>
          <span className="text-neutral-400 hidden sm:inline">
            Memory: <span className="font-mono text-accent">SVD {formatBytes(svdMemoryBytes)}</span> / <span className="font-mono text-blue-400">CB {formatBytes(cbMemoryBytes)}</span>
          </span>
          <span className="text-neutral-500 font-mono hidden md:inline">·</span>
          <span className="text-neutral-400 hidden md:inline">
            Cold Start: <span className="font-mono text-blue-400">CB ({cbColdScore.toFixed(1)})</span> vs <span className="font-mono text-accent">SVD ({svdColdScore.toFixed(1)})</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ========================================================= */}
      {/* Drawer Content Body: Winner Shown by Colour Only          */}
      {/* ========================================================= */}
      {isOpen && (
        <div className="px-4 py-3 max-w-7xl mx-auto flex flex-col gap-3 text-xs animate-in fade-in duration-150">
          {/* 4 Core Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Execution Time */}
            <div className={`p-3 rounded border bg-neutral-900/60 ${isSvdTimeWinner ? "border-accent/40" : "border-neutral-800"}`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">Execution Time</span>
                <span className="text-[10px] text-muted">lower is faster</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${isSvdTimeWinner ? "text-accent" : "text-white"}`} suppressHydrationWarning>
                      {mounted ? svdRevealedMs.toFixed(2) : "0.00"} ms
                    </span>
                    <span className="text-[10px] text-muted block" suppressHydrationWarning>
                      median: {svdMedianMs.toFixed(2)} ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${isCbTimeWinner ? "text-blue-400" : "text-white"}`} suppressHydrationWarning>
                      {mounted ? cbRevealedMs.toFixed(2) : "0.00"} ms
                    </span>
                    <span className="text-[10px] text-muted block" suppressHydrationWarning>
                      median: {cbMedianMs.toFixed(2)} ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Memory Footprint */}
            <div className={`p-3 rounded border bg-neutral-900/60 ${isSvdMemWinner ? "border-accent/40" : "border-neutral-800"}`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">Memory Footprint</span>
                <span className="text-[10px] text-muted">typed allocations</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <span className={`font-mono font-bold ${isSvdMemWinner ? "text-accent" : "text-white"}`}>
                    {formatBytes(svdMemoryBytes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <span className={`font-mono font-bold ${isCbMemWinner ? "text-blue-400" : "text-white"}`}>
                    {formatBytes(cbMemoryBytes)}
                  </span>
                </div>

                <div className="w-full h-1 bg-neutral-800 rounded-full flex overflow-hidden mt-1">
                  <div className="h-full bg-accent" style={{ width: `${svdMemPercent}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${cbMemPercent}%` }} />
                </div>
              </div>
            </div>

            {/* 3. Precision@5 (Accuracy) */}
            <div className="p-3 rounded border border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">Precision@{offlineMetrics.k}</span>
                <span className="text-[10px] text-muted">held-out split</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {svdPrecision.toFixed(2)}{" "}
                    <span className="text-muted text-[10px]">({Math.round(offlineMetrics.k * svdPrecision)}/{offlineMetrics.k})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {cbPrecision.toFixed(2)}{" "}
                    <span className="text-muted text-[10px]">({Math.round(offlineMetrics.k * cbPrecision)}/{offlineMetrics.k})</span>
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 pt-0.5">
                  Equal accuracy on held-out test ratings.
                </div>
              </div>
            </div>

            {/* 4. Cold-Start Resilience */}
            <div className={`p-3 rounded border bg-neutral-900/60 ${store.coldStart ? "border-blue-500/40" : "border-neutral-800"}`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-xs font-semibold text-white">Cold-Start Resilience</span>
                <span className="text-[10px] text-muted">0-rating item</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <span className="font-mono text-neutral-400">
                    {store.coldStart ? `${svdColdScore.toFixed(2)} (baseline)` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <span className={`font-mono font-bold ${store.coldStart ? "text-blue-400" : "text-neutral-400"}`}>
                    {store.coldStart ? `${cbColdScore.toFixed(2)} (metadata)` : `${cbColdScore.toFixed(2)}`}
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 pt-0.5">
                  {store.coldStart ? "Content-Based embeds via metadata." : "Toggle in control bar to inject."}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Synthetic Scale Benchmark: Shown ONLY for 100 & 500x300   */}
          {/* ========================================================= */}
          {store.datasetScale !== "demo" && (
            <div className="p-3 bg-neutral-900/80 rounded border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-xs font-semibold text-white">
                  Synthetic Dataset Benchmark ({store.datasetScale})
                </span>
                <span className="text-[10px] text-muted">
                  {benchResult
                    ? `Content-Based: ${benchResult.contentMs.toFixed(1)} ms vs SVD: ${benchResult.svdMs.toFixed(1)} ms`
                    : "Running timed benchmark across scale..."}
                </span>
              </div>

              {isBenchmarking ? (
                <div className="py-2 text-center text-[11px] text-muted">
                  Running synthetic benchmark on {store.datasetScale} dataset...
                </div>
              ) : benchResult ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-0.5">
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-muted block">Dimensions</span>
                    <span className="font-mono text-white text-xs font-semibold">
                      {benchResult.numUsers} × {benchResult.numMovies}
                    </span>
                  </div>
                  <div className={`p-2 rounded border ${benchResult.svdMs < benchResult.contentMs ? "bg-accent/10 border-accent/40" : "bg-neutral-950/60 border-neutral-850"}`}>
                    <span className="text-[10px] text-muted block">SVD Time</span>
                    <span className={`font-mono text-xs font-bold ${benchResult.svdMs < benchResult.contentMs ? "text-accent" : "text-white"}`}>
                      {benchResult.svdMs.toFixed(2)} ms
                    </span>
                  </div>
                  <div className={`p-2 rounded border ${benchResult.contentMs < benchResult.svdMs ? "bg-blue-950/30 border-blue-800/50" : "bg-neutral-950/60 border-neutral-850"}`}>
                    <span className="text-[10px] text-muted block">Content Time</span>
                    <span className={`font-mono text-xs font-bold ${benchResult.contentMs < benchResult.svdMs ? "text-blue-400" : "text-white"}`}>
                      {benchResult.contentMs.toFixed(2)} ms
                    </span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-muted block">Takeaway</span>
                    <span className="text-neutral-200 text-[10px] leading-tight block">
                      Content scales efficiently; SVD cubic cost rises sharply.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
