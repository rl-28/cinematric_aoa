"use client";

import React from "react";
import { motion } from "framer-motion";
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

  const candidateMovie = MOVIES.find((m) => m.id === movieId);
  const year = candidateMovie?.year ?? (coldFallback ? 2026 : 2010);

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface rounded-md border border-neutral-800 text-xs font-mono">
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted font-sans text-xs uppercase tracking-wider">Candidate</span>
          <span className="text-white font-bold text-sm font-sans">{title} ({year})</span>
          <span className="text-[10px] text-muted bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {movieId}
          </span>
        </div>

        {coldFallback && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Baseline Only
          </span>
        )}
      </div>

      {/* Vectors Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* User Vector P_u */}
        <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 flex flex-col gap-1">
          <div className="flex justify-between text-neutral-400 text-[10px] font-sans">
            <span>Target User Factor (P_u)</span>
            <span className="text-accent font-semibold">Alex Chen</span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>[</span>
            <span className="text-red-400">{pRow[0]?.toFixed(3) ?? "0.000"}</span>
            <span className="text-neutral-500">,</span>
            <span className="text-red-400">{pRow[1]?.toFixed(3) ?? "0.000"}</span>
            <span>]</span>
          </div>
        </div>

        {/* Item Vector Q_i */}
        <div
          className={`p-2.5 rounded border flex flex-col gap-1 ${
            coldFallback
              ? "bg-amber-950/20 border-amber-800/40"
              : "bg-neutral-900/60 border-neutral-800"
          }`}
        >
          <div className="flex justify-between text-neutral-400 text-[10px] font-sans">
            <span>Item Factor Vector (Q_i)</span>
            <span className={coldFallback ? "text-amber-400 font-bold" : "text-blue-400 font-semibold"}>
              {title} {coldFallback ? "(Zeroed)" : ""}
            </span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>[</span>
            <span className={coldFallback ? "text-amber-400 font-black" : "text-blue-400"}>
              {coldFallback ? "0" : (qRow[0]?.toFixed(3) ?? "0.000")}
            </span>
            <span className="text-neutral-500">,</span>
            <span className={coldFallback ? "text-amber-400 font-black" : "text-blue-400"}>
              {coldFallback ? "0" : (qRow[1]?.toFixed(3) ?? "0.000")}
            </span>
            <span>]</span>
          </div>
        </div>
      </div>

      {/* Equation Breakdown Banner */}
      <div className="p-3 bg-neutral-950 rounded border border-neutral-850 flex flex-col gap-2">
        <div className="text-[10px] text-muted font-sans font-semibold uppercase tracking-wider">
          Prediction Formula: &nbsp;
          <span className="text-white font-mono lowercase">
            r̂ = bias + (P_u · Q_iᵀ)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          {/* Factor Terms */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
            <span className="text-muted">P₁·Q₁</span>
            <span className="text-neutral-500">=</span>
            <span className={`font-bold ${coldFallback ? "text-amber-400" : "text-white"}`}>
              {coldFallback ? "0" : (terms[0]?.toFixed(3) ?? "0.000")}
            </span>
          </div>

          <span className="text-neutral-500 font-bold">+</span>

          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
            <span className="text-muted">P₂·Q₂</span>
            <span className="text-neutral-500">=</span>
            <span className={`font-bold ${coldFallback ? "text-amber-400" : "text-white"}`}>
              {coldFallback ? "0" : (terms[1]?.toFixed(3) ?? "0.000")}
            </span>
          </div>

          <span className="text-neutral-500 font-bold">=</span>

          {/* Running Sum Dot Product */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-amber-300 font-bold">
            <span className="text-muted text-[10px]">Dot</span>
            <span>{coldFallback ? "0" : `${runningSum >= 0 ? "+" : ""}${runningSum.toFixed(3)}`}</span>
          </div>

          <span className="text-neutral-500 font-bold">+</span>

          {/* Baseline Bias */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
            <span className="text-muted text-[10px]">Bias</span>
            <span className="font-bold text-white">{bias.toFixed(3)}</span>
          </div>

          <span className="text-neutral-500 font-bold">=</span>

          {/* Clamped Final Prediction */}
          <motion.div
            key={movieId}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent/20 border border-accent/60 text-white font-bold text-base shadow-sm shadow-accent/40"
          >
            <span className="text-[11px] text-accent font-mono uppercase tracking-wider font-semibold">r̂ =</span>
            <span>{prediction.toFixed(2)}</span>
            <span className="text-[10px] text-neutral-400 font-normal font-sans">/ 5.0</span>
          </motion.div>
        </div>

        {/* Multi-User Simulated Cohort Predictions (Alex, Jordan, Taylor) */}
        {payload.cohortPredictions && payload.cohortPredictions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
            <span className="text-[10px] text-muted font-sans font-semibold uppercase tracking-wider">
              Simulating 3 Rows:
            </span>
            {payload.cohortPredictions.map((cp) => (
              <div
                key={cp.userIdx}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
                  cp.userIdx === 0
                    ? "bg-accent/15 border-accent/50 text-white shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300"
                }`}
              >
                <span className={cp.userIdx === 0 ? "text-accent font-bold" : "text-amber-300 font-semibold"}>
                  {cp.userName}:
                </span>
                <span className="text-white font-bold">r̂ = {cp.prediction.toFixed(2)}</span>
                <span className="text-[9px] text-neutral-500">
                  ({cp.bias.toFixed(1)} + {cp.runningSum.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {coldFallback && (
        <div className="text-[11px] font-sans text-amber-300/90 bg-amber-950/20 px-2.5 py-1.5 rounded border border-amber-800/30">
          <strong>Cold Start Isolation:</strong> No ratings exist in the matrix for {title}.
          The item latent vector Q is strictly [0, 0]. All product terms are 0, and the prediction is strictly equal to the baseline ({bias.toFixed(2)}).
        </div>
      )}
    </div>
  );
};
