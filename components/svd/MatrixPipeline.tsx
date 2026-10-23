"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimStore } from "@/lib/sim/store";
import {
  currentSvdStep,
  revealedExecMs,
  predictedCellsAtTick,
  baselineAtTick,
  rawMatrixAtTick,
  visibleSvdSteps,
} from "@/lib/sim/selectors";
import { MatrixGrid } from "./MatrixGrid";
import { DecompositionView } from "./DecompositionView";
import { LatentScatterView } from "./LatentScatterView";
import { DotProductHero } from "./DotProductHero";
import { RankView } from "./RankView";

export const MatrixPipeline: React.FC = () => {
  const store = useSimStore();
  const currentStep = currentSvdStep(store);
  const svdSteps = visibleSvdSteps(store);
  const execMs = revealedExecMs(store, "svd");

  // Derive pure state from store history
  const rawMatrix = rawMatrixAtTick(store) ?? [];
  const baseline = baselineAtTick(store);
  const predictedMap = predictedCellsAtTick(store);

  // Step indices
  const currentIdx = Math.min(store.tick, svdSteps.length - 1);
  const totalSvdSteps = svdSteps.length;

  // Kind color badge mapping
  const kindBadgeColors: Record<string, string> = {
    load: "bg-neutral-800 text-neutral-300 border-neutral-700",
    baseline: "bg-amber-950/40 text-amber-300 border-amber-800/50",
    center: "bg-blue-950/40 text-blue-300 border-blue-800/50",
    decompose: "bg-purple-950/40 text-purple-300 border-purple-800/50",
    truncate: "bg-indigo-950/40 text-indigo-300 border-indigo-800/50",
    dot_product: "bg-accent/20 text-accent border-accent/40",
    rank: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
  };

  const kind = currentStep?.kind ?? "load";
  const badgeStyle = kindBadgeColors[kind] ?? "bg-neutral-800 text-neutral-300";

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
      {/* ========================================================= */}
      {/* Header: Title, Kind Chip, Step Dots, Revealed Execution Ms */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-2 p-3.5 bg-surface border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h2 className="text-white font-bold font-sans text-sm tracking-wide">
              SVD Collaborative Pipeline
            </h2>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${badgeStyle}`}
            >
              {kind.replace("_", " ")}
            </span>
          </div>

          {/* Revealed Compute Time Readout */}
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 font-mono text-xs">
            <span className="text-muted text-[10px] font-sans">Time:</span>
            <span className="text-accent font-bold" suppressHydrationWarning>{execMs.toFixed(2)}</span>
            <span className="text-muted text-[10px]">ms</span>
          </div>
        </div>

        {/* Step Label & Dot Progression Indicator */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-neutral-300 font-sans truncate pr-2">
            {currentStep?.label ?? "Initializing..."}
          </span>

          {/* "step i of N" Dots */}
          <div className="flex items-center gap-1 shrink-0" title={`Step ${currentIdx + 1} of ${totalSvdSteps}`}>
            {svdSteps.map((_, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "w-3 bg-accent scale-125 shadow-sm shadow-accent"
                      : isPast
                      ? "bg-neutral-500"
                      : "bg-neutral-800"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Active Stage Body (Pure function of store.tick)          */}
      {/* ========================================================= */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        <div key={`${kind}-${currentIdx}`} className="flex flex-col gap-4">
          {/* Stage 1: Load */}
            {kind === "load" && (
              <div className="flex flex-col gap-3">
                <div className="p-2.5 rounded bg-surface border border-neutral-800 text-[11px] text-muted font-sans">
                  Observed ratings matrix ({rawMatrix.length} users × {rawMatrix[0]?.length ?? 13} catalog movies). Target user{" "}
                  <strong className="text-accent font-mono">Alex Chen</strong> is outlined in red.
                  {store.coldStart && (
                    <>
                      {" "}Column <strong className="text-amber-400 font-mono">m14 (Chronopolis)</strong> is unrated (cold-start).
                    </>
                  )}
                </div>
                <MatrixGrid mode="raw" rawMatrix={rawMatrix} showColdStart={store.coldStart} />
              </div>
            )}

            {/* Stage 2: Baseline */}
            {kind === "baseline" && currentStep && currentStep.kind === "baseline" && (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded bg-surface border border-neutral-800 flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-muted font-sans text-[11px]">
                    <span>Global Mean & Entity Biases</span>
                    <span className="text-white font-mono">
                      μ = {currentStep.payload.mu.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-neutral-300 text-xs font-sans">
                    Target User formula: &nbsp;
                    <span className="font-mono text-white">
                      r̂ = {currentStep.payload.mu.toFixed(2)} + ({currentStep.payload.bu[0]?.toFixed(2)} b_u₁) + b_i
                    </span>
                  </div>
                </div>
                <MatrixGrid
                  mode="baseline"
                  rawMatrix={rawMatrix}
                  baseline={currentStep.payload}
                  showColdStart={store.coldStart}
                />
              </div>
            )}

            {/* Stage 3: Center (Residuals) */}
            {kind === "center" && currentStep && currentStep.kind === "center" && (
              <div className="flex flex-col gap-3">
                <div className="p-2.5 rounded bg-surface border border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-neutral-300 text-[11px] font-sans">
                    Residual matrix centered: &nbsp;
                    <span className="font-mono text-white">
                      A = R - (μ + b_u + b_i)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-accent font-semibold">+ positive</span>
                    <span className="text-blue-400 font-semibold">- negative</span>
                    <span className="text-neutral-500">0 unobserved</span>
                  </div>
                </div>
                <MatrixGrid
                  mode="residual"
                  rawMatrix={rawMatrix}
                  residualMatrix={currentStep.payload.residualMatrix}
                  baseline={baseline}
                  showColdStart={store.coldStart}
                />
              </div>
            )}

            {/* Stage 4: Decompose */}
            {kind === "decompose" && currentStep && currentStep.kind === "decompose" && (
              <DecompositionView
                U={currentStep.payload.U}
                s={currentStep.payload.s}
                V={currentStep.payload.V}
              />
            )}

            {/* Stage 5: Truncate */}
            {kind === "truncate" && currentStep && currentStep.kind === "truncate" && (
              <div className="flex flex-col gap-3">
                <LatentScatterView
                  P={currentStep.payload.P}
                  Q={currentStep.payload.Q}
                  sk={currentStep.payload.sk}
                />
                <DecompositionView
                  U={currentStep.payload.Uk}
                  s={currentStep.payload.sk}
                  V={currentStep.payload.Vk}
                  truncateK={currentStep.payload.k}
                />
              </div>
            )}

            {/* Stage 6: Dot Product */}
            {kind === "dot_product" && currentStep && currentStep.kind === "dot_product" && (
              <div className="flex flex-col gap-4">
                <DotProductHero payload={currentStep.payload} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-muted font-sans px-1">
                    <span>Target Row Predictions Light Up</span>
                    <span className="text-amber-300 font-mono">
                      {predictedMap.size} unrated item(s) evaluated
                    </span>
                  </div>
                  <MatrixGrid
                    mode="predictions"
                    rawMatrix={rawMatrix}
                    predictedMap={predictedMap}
                    showColdStart={store.coldStart}
                    activeCell={{
                      userIdx: currentStep.payload.userIdx,
                      itemIdx: currentStep.payload.itemIdx,
                      movieId: currentStep.payload.movieId,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Stage 7: Rank */}
            {kind === "rank" && currentStep && currentStep.kind === "rank" && (
              <div className="flex flex-col gap-4">
                <RankView
                  recommendations={currentStep.payload.recommendations}
                  unrankable={currentStep.payload.unrankable}
                />
                <div className="flex flex-col gap-1.5 opacity-80">
                  <div className="text-[11px] text-muted font-sans px-1">
                    Final Observed & Predicted Rating Matrix
                  </div>
                  <MatrixGrid
                    mode="predictions"
                    rawMatrix={rawMatrix}
                    predictedMap={predictedMap}
                    showColdStart={store.coldStart}
                  />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
