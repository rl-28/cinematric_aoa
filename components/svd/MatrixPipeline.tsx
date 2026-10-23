"use client";

import React from "react";
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

  const kind = currentStep?.kind ?? "load";

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-neutral-800 rounded-lg overflow-hidden shadow-xl font-sans">
      {/* ========================================================= */}
      {/* Header: Title, Kind Badge, Step Dots, Revealed Compute Ms */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-1.5 p-3 bg-surface border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-sm tracking-wide">
              SVD Collaborative Pipeline
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-accent/40 bg-accent/15 text-accent font-semibold">
              {kind.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-mono text-xs">
            <span className="text-muted text-[10px] font-sans">Time:</span>
            <span className="text-accent font-bold" suppressHydrationWarning>
              {execMs.toFixed(2)}
            </span>
            <span className="text-muted text-[10px]">ms</span>
          </div>
        </div>

        {/* Step Label & Step Progress Indicator */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-neutral-300 truncate pr-2">
            {currentStep?.label ?? "Initializing..."}
          </span>

          <div
            className="flex items-center gap-1 shrink-0"
            title={`Step ${currentIdx + 1} of ${totalSvdSteps}`}
          >
            {svdSteps.map((_, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "w-3 bg-accent"
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
      {/* Panel Body: Single Focused View that Fits Without Scroll  */}
      {/* ========================================================= */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col justify-start">
        {/* Stage 1: Load */}
        {kind === "load" && (
          <div className="flex flex-col gap-2">
            <div className="p-2 rounded bg-surface border border-neutral-800 text-[11px] text-muted flex items-center justify-between">
              <span>
                Observed ratings matrix ({rawMatrix.length} users × {rawMatrix[0]?.length ?? 13} catalog movies).
              </span>
              <span className="text-accent font-mono text-[10px]">Target User: Alex Chen</span>
            </div>
            <MatrixGrid mode="raw" rawMatrix={rawMatrix} showColdStart={store.coldStart} />
          </div>
        )}

        {/* Stage 2: Baseline */}
        {kind === "baseline" && currentStep && currentStep.kind === "baseline" && (
          <div className="flex flex-col gap-2">
            <div className="p-2 rounded bg-surface border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-300 text-[11px]">
                Global Mean & Entity Biases: <span className="font-mono text-white">r̂ = μ + b_u + b_i</span>
              </span>
              <span className="font-mono text-white text-[10px]">
                μ = {currentStep.payload.mu.toFixed(2)}
              </span>
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
          <div className="flex flex-col gap-2">
            <div className="p-2 rounded bg-surface border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-300 text-[11px]">
                Residual matrix centered: <span className="font-mono text-white">A = R - (μ + b_u + b_i)</span>
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-accent">+ positive</span>
                <span className="text-blue-400">- negative</span>
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

        {/* Stage 5: Truncate (Focused 2D Latent Factor Space) */}
        {kind === "truncate" && currentStep && currentStep.kind === "truncate" && (
          <LatentScatterView
            P={currentStep.payload.P}
            Q={currentStep.payload.Q}
            sk={currentStep.payload.sk}
          />
        )}

        {/* Stage 6: Dot Product (Focused DotProductHero) */}
        {kind === "dot_product" && currentStep && currentStep.kind === "dot_product" && (
          <DotProductHero payload={currentStep.payload} />
        )}

        {/* Stage 7: Rank (Focused RankView) */}
        {kind === "rank" && currentStep && currentStep.kind === "rank" && (
          <RankView
            recommendations={currentStep.payload.recommendations}
            unrankable={currentStep.payload.unrankable}
          />
        )}
      </div>
    </div>
  );
};
