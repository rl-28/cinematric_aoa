"use client";

import React, { useEffect, useState } from "react";
import { useSimStore } from "@/lib/sim/store";
import { revealedExecMs } from "@/lib/sim/selectors";
import { getOfflineMetrics } from "@/lib/engines/metrics";

export const MetricsOverlay: React.FC = () => {
  const store = useSimStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    // On mobile devices (< 1024px), collapse by default to preserve viewport space
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false);
    }
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

  // Winners helper (Strictly better only; tie is a tie)
  // Execution time (lower is better, compare warmed median of 5)
  const timeWinner: "svd" | "cb" | "tie" =
    svdMedianMs < cbMedianMs ? "svd" : cbMedianMs < svdMedianMs ? "cb" : "tie";

  // Memory (lower is better)
  const memoryWinner: "svd" | "cb" | "tie" =
    svdMemoryBytes < cbMemoryBytes ? "svd" : cbMemoryBytes < svdMemoryBytes ? "cb" : "tie";

  // Precision@5: Strictly tie
  const precisionWinner: "tie" = "tie";

  // Cold-start winner
  const coldWinner: "cb" | "none" = store.coldStart ? "cb" : "none";

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
      className="bg-[#181818] border-t border-neutral-800 shadow-2xl transition-all duration-300 font-sans"
      role="region"
      aria-label="Metrics and Performance Benchmark"
    >
      {/* ========================================================= */}
      {/* Collapsible Header Drawer Bar                             */}
      {/* ========================================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse metrics overlay" : "Expand metrics overlay"}
        className="w-full flex items-center justify-between px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800/80 transition-colors border-b border-neutral-800/80 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-sans">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Comparison Metrics & Benchmarks
          </span>
          <span className="text-[11px] font-mono text-muted hidden sm:inline">
            Precision: <strong className="text-amber-400">Tie ({svdPrecision.toFixed(2)})</strong> · SVD vs Content-Based
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            {isOpen ? "Click to collapse" : "Click to expand"}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transform transition-transform duration-200 ${
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
      {/* Drawer Content Body                                       */}
      {/* ========================================================= */}
      {isOpen && (
        <div className="px-4 py-3.5 max-w-7xl mx-auto flex flex-col gap-4 text-xs animate-in fade-in duration-200">
          {/* Top 4 Core Metrics Rows (Grid layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Execution Time */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                timeWinner === "svd"
                  ? "bg-neutral-900/60 border-neutral-700/80"
                  : "bg-neutral-900/40 border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  Execution Time
                </span>
                <span className="text-[9px] font-mono text-muted">lower is faster</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {/* SVD */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold" suppressHydrationWarning>
                      {mounted ? svdRevealedMs.toFixed(2) : "0.00"} ms
                    </span>
                    <span className="text-[10px] text-muted block font-sans" suppressHydrationWarning>
                      this run (median: {svdMedianMs.toFixed(2)} ms)
                    </span>
                  </div>
                </div>

                {/* Content-Based */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold" suppressHydrationWarning>
                      {mounted ? cbRevealedMs.toFixed(2) : "0.00"} ms
                    </span>
                    <span className="text-[10px] text-muted block font-sans" suppressHydrationWarning>
                      this run (median: {cbMedianMs.toFixed(2)} ms)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                <span className="text-muted font-sans">Demo winner:</span>
                <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  {timeWinner === "svd" ? "SVD (faster on small dense set)" : "Content-Based"}
                </span>
              </div>
            </div>

            {/* 2. Memory Footprint */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                memoryWinner === "svd"
                  ? "bg-neutral-900/60 border-neutral-700/80"
                  : "bg-neutral-900/40 border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  Memory Footprint
                </span>
                <span className="text-[9px] font-mono text-muted">typed allocations</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {/* SVD */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <span className="text-white font-bold">{formatBytes(svdMemoryBytes)}</span>
                </div>

                {/* Content-Based */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <span className="text-white font-bold">{formatBytes(cbMemoryBytes)}</span>
                </div>

                {/* Proportional Memory Bar */}
                <div className="w-full h-1.5 bg-neutral-800 rounded-full flex overflow-hidden mt-1">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${svdMemPercent}%` }}
                    title={`SVD: ${svdMemPercent}%`}
                  />
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${cbMemPercent}%` }}
                    title={`Content: ${cbMemPercent}%`}
                  />
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                <span className="text-muted font-sans">Leaner footprint:</span>
                <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  {memoryWinner === "svd" ? `SVD (compact ${store.benchmark.cache["demo"]?.numUsers ?? 10}×${store.benchmark.cache["demo"]?.numMovies ?? 14})` : "Content-Based"}
                </span>
              </div>
            </div>

            {/* 3. Precision@5 (Defensible Tie) */}
            <div className="p-3 rounded-lg border border-amber-800/40 bg-amber-950/10 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-900/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Precision@{offlineMetrics.k} (Accuracy)
                </span>
                <span className="text-[9px] font-mono text-amber-400/80">held-out test split</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  <span className="text-white font-bold">
                    {svdPrecision.toFixed(2)}{" "}
                    <span className="text-muted text-[10px] font-sans">({Math.round(offlineMetrics.k * svdPrecision)}/{offlineMetrics.k} hits)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  <span className="text-white font-bold">
                    {cbPrecision.toFixed(2)}{" "}
                    <span className="text-muted text-[10px] font-sans">({Math.round(offlineMetrics.k * cbPrecision)}/{offlineMetrics.k} hits)</span>
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 leading-tight pt-1 font-sans">
                  Equal accuracy on held-out test ratings; different algorithmic strengths.
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-amber-900/30 flex items-center justify-between text-[10px]">
                <span className="text-muted font-sans">Evaluation result:</span>
                <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/60 uppercase tracking-wide">
                  TIE ({svdPrecision.toFixed(2)} vs {cbPrecision.toFixed(2)})
                </span>
              </div>
            </div>

            {/* 4. Cold-Start Resilience */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                store.coldStart
                  ? "bg-neutral-900/60 border-neutral-700/80"
                  : "bg-neutral-900/30 border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  Cold-Start Resilience
                </span>
                <span className="text-[9px] font-mono text-muted">0-rating item</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {/* SVD */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-neutral-300">SVD:</span>
                  </div>
                  {store.coldStart ? (
                    <span className="text-rose-400 font-bold">
                      {svdColdScore.toFixed(2)}{" "}
                      <span className="text-[10px] text-neutral-500 font-sans">(baseline only)</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[10px] font-sans italic">
                      toggle cold-start to measure
                    </span>
                  )}
                </div>

                {/* Content-Based */}
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-neutral-300">Content:</span>
                  </div>
                  {store.coldStart ? (
                    <span className="text-emerald-400 font-bold">
                      {cbColdScore.toFixed(2)}{" "}
                      <span className="text-[10px] text-neutral-500 font-sans">(metadata cosine)</span>
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px] font-sans">
                      {cbColdScore.toFixed(2)} (embeds metadata)
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-neutral-400 leading-tight pt-1 font-sans">
                  {store.coldStart
                    ? "Content-Based embeds Chronopolis via tags; SVD has no factor row."
                    : "Enable cold-start toggle in control bar to observe injection."}
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                <span className="text-muted font-sans">Winner:</span>
                {coldWinner === "cb" ? (
                  <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    Content-Based ({cbColdScore.toFixed(1)} vs {svdColdScore.toFixed(1)})
                  </span>
                ) : (
                  <span className="text-neutral-500 text-[10px] font-sans">
                    Enable toggle to evaluate
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Bottom: Synthetic Scale Benchmark Breakdown               */}
          {/* ========================================================= */}
          <div className="p-3 bg-neutral-900/80 rounded-lg border border-neutral-800 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Synthetic Dataset Scale Benchmark
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Selected:{" "}
                  {store.datasetScale === "500x300"
                    ? `${benchResult && store.datasetScale === "500x300" ? benchResult.numUsers : 500} Users × ${benchResult && store.datasetScale === "500x300" ? benchResult.numMovies : 300} Movies`
                    : store.datasetScale === "100"
                    ? `${benchResult && store.datasetScale === "100" ? benchResult.numUsers : 100} Users × ${benchResult && store.datasetScale === "100" ? benchResult.numMovies : 60} Movies`
                    : `${store.benchmark.cache["demo"]?.numUsers ?? 10} Users × ${store.benchmark.cache["demo"]?.numMovies ?? 14} Movies (Demo)`}
                </span>
              </div>
              <span className="text-[10px] text-muted font-sans">
                {benchResult
                  ? `In this synthetic benchmark (${benchResult.numUsers} users × ${benchResult.numMovies} movies), Content-Based completed in ${benchResult.contentMs.toFixed(1)} ms vs. SVD in ${benchResult.svdMs.toFixed(1)} ms.`
                  : "In this synthetic benchmark, execution times are measured across the selected scale."}
              </span>
            </div>

            {/* Benchmark Values or Skeleton */}
            {isBenchmarking ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="flex items-center gap-2 text-accent font-mono text-xs font-semibold">
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-accent"
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
                  <span>Benchmarking synthetic dataset ({store.datasetScale})...</span>
                </div>
                <div className="w-full max-w-md h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-accent animate-pulse" />
                </div>
                <span className="text-[10px] text-neutral-500">
                  Evaluating multiple timed runs to capture true warmed median ms.
                </span>
              </div>
            ) : benchResult ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Scale Dimensions */}
                <div className="p-2 rounded bg-neutral-950/40 border border-neutral-800/80 font-mono">
                  <span className="text-[10px] text-muted block font-sans">Dimensions</span>
                  <span className="text-white font-bold text-xs">
                    {benchResult.numUsers} users × {benchResult.numMovies} movies
                  </span>
                  <span className="text-[9px] text-neutral-500 block">
                    {benchResult.numUsers * benchResult.numMovies} potential cells
                  </span>
                </div>

                {/* SVD Compute */}
                <div
                  className={`p-2 rounded border font-mono ${
                    benchResult.svdMs < benchResult.contentMs
                      ? "bg-accent/10 border-accent/40"
                      : "bg-neutral-950/40 border-neutral-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-sans">SVD Compute</span>
                    {benchResult.svdMs < benchResult.contentMs && (
                      <span className="text-[9px] text-accent font-bold uppercase">Faster</span>
                    )}
                  </div>
                  <span className="text-white font-bold text-xs">
                    {benchResult.svdMs.toFixed(2)} ms
                  </span>
                  <span className="text-[9px] text-muted block">
                    Memory: {formatBytes(benchResult.svdMemoryBytes)}
                  </span>
                </div>

                {/* Content Compute */}
                <div
                  className={`p-2 rounded border font-mono ${
                    benchResult.contentMs < benchResult.svdMs
                      ? "bg-blue-950/30 border-blue-800/50"
                      : "bg-neutral-950/40 border-neutral-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-sans">Content Compute</span>
                    {benchResult.contentMs < benchResult.svdMs && (
                      <span className="text-[9px] text-blue-400 font-bold uppercase">Faster</span>
                    )}
                  </div>
                  <span className="text-white font-bold text-xs">
                    {benchResult.contentMs.toFixed(2)} ms
                  </span>
                  <span className="text-[9px] text-muted block">
                    Memory: {formatBytes(benchResult.contentMemoryBytes)}
                  </span>
                </div>

                {/* Scale Takeaway */}
                <div className="p-2 rounded bg-neutral-950/40 border border-neutral-800/80 font-sans">
                  <span className="text-[10px] text-muted block">Key Takeaway</span>
                  <span className="text-neutral-200 text-[11px] font-medium leading-tight block">
                    {benchResult.numUsers >= 100
                      ? "Content scales efficiently; SVD cubic cost rises sharply."
                      : "SVD runs fast on small dense sets; equal accuracy."}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
