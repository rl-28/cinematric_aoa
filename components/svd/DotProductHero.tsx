"use client";

import React from "react";
import { SvdDotProductPayload } from "@/lib/engines/types";
import { MOVIES } from "@/lib/data/movies";

interface DotProductHeroProps {
  payload: SvdDotProductPayload;
}

export const DotProductHero: React.FC<DotProductHeroProps> = ({ payload }) => {
  const {
    title,
    movieId,
    pRow,
    qRow,
    terms,
    runningSum,
    bias,
    prediction,
    coldFallback,
  } = payload;

  const movie = MOVIES.find((m) => m.id === movieId);
  const year = movie?.year ?? (coldFallback ? 2026 : 2010);

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-xs">
            {title} ({year})
          </span>
          <span className="text-[10px] text-muted font-mono bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
            {movieId}
          </span>
        </div>

        {coldFallback ? (
          <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
            Cold Start · Baseline Only
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 font-mono">
            Latent Reconstruction (k = 2)
          </span>
        )}
      </div>

      {/* Vectors Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
        {/* User Vector P_u */}
        <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <span className="text-muted font-sans text-[10px]">User Factor (P_u):</span>
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>[</span>
            <span className="text-accent">{pRow[0]?.toFixed(3) ?? "0.000"}</span>
            <span className="text-neutral-500">,</span>
            <span className="text-accent">{pRow[1]?.toFixed(3) ?? "0.000"}</span>
            <span>]</span>
          </div>
        </div>

        {/* Item Vector Q_i */}
        <div className={`p-2 rounded border flex items-center justify-between ${coldFallback ? "bg-amber-950/20 border-amber-800/40" : "bg-neutral-900/60 border-neutral-800"}`}>
          <span className="text-muted font-sans text-[10px]">Item Factor (Q_i):</span>
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>[</span>
            <span className={coldFallback ? "text-amber-400" : "text-neutral-200"}>
              {coldFallback ? "0.000" : (qRow[0]?.toFixed(3) ?? "0.000")}
            </span>
            <span className="text-neutral-500">,</span>
            <span className={coldFallback ? "text-amber-400" : "text-neutral-200"}>
              {coldFallback ? "0.000" : (qRow[1]?.toFixed(3) ?? "0.000")}
            </span>
            <span>]</span>
          </div>
        </div>
      </div>

      {/* Equation Breakdown Banner */}
      <div className="p-2.5 bg-neutral-950 rounded border border-neutral-850 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        {/* Factor Terms */}
        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
          <span className="text-muted font-sans text-[10px]">P₁·Q₁ =</span>
          <span className="font-bold text-white">
            {coldFallback ? "0.000" : (terms[0]?.toFixed(3) ?? "0.000")}
          </span>
        </div>

        <span className="text-neutral-500">+</span>

        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
          <span className="text-muted font-sans text-[10px]">P₂·Q₂ =</span>
          <span className="font-bold text-white">
            {coldFallback ? "0.000" : (terms[1]?.toFixed(3) ?? "0.000")}
          </span>
        </div>

        <span className="text-neutral-500">+</span>

        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
          <span className="text-muted font-sans text-[10px]">Bias =</span>
          <span className="font-bold text-white">{bias.toFixed(3)}</span>
        </div>

        <span className="text-neutral-500">=</span>

        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded bg-accent/20 border border-accent/60 text-white font-bold ml-auto">
          <span className="text-accent font-sans text-[10px]">r̂ =</span>
          <span className="text-accent font-mono text-sm">{prediction.toFixed(2)}</span>
          <span className="text-[10px] text-neutral-400 font-sans font-normal">/ 5.0</span>
        </div>
      </div>

      {coldFallback ? (
        <div className="text-[10px] text-amber-300/90 bg-amber-950/20 px-2 py-1 rounded border border-amber-800/30">
          Cold start: Item vector Q is strictly [0, 0]. Prediction reverts to baseline (μ + b_u = {bias.toFixed(2)}).
        </div>
      ) : (
        <div className="text-[10px] text-neutral-400">
          Dot product reflects shared latent affinity: {runningSum >= 0 ? "+" : ""}{runningSum.toFixed(3)} added to baseline.
        </div>
      )}
    </div>
  );
};
