"use client";

import React from "react";
import { motion } from "framer-motion";
import { ContentComparePayload } from "@/lib/engines/types";
import { useSimStore } from "@/lib/sim/store";
import { MOVIES } from "@/lib/data/movies";

interface CompareCardProps {
  payload: ContentComparePayload;
  vocabDim?: number;
}

export const CompareCard: React.FC<CompareCardProps> = ({
  payload,
  vocabDim,
}) => {
  const store = useSimStore();
  const effectiveVocabDim =
    vocabDim ??
    store.cbResult?.vocabulary?.length ??
    store.cbStats?.vocabSize ??
    112;

  const {
    candidateId,
    title,
    dot,
    normA,
    normB,
    cosine,
    angleDeg,
    isCold,
  } = payload;

  const candidateMovie = MOVIES.find((m) => m.id === candidateId);

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-surface rounded-md border border-neutral-800 text-xs font-mono">
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted font-sans text-xs uppercase tracking-wider">Candidate</span>
          <span className="text-white font-bold text-sm font-sans">{title}</span>
          <span className="text-[10px] text-muted bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {candidateId}
          </span>
        </div>

        {isCold ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Scored from metadata alone
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-accent/20 text-accent border border-accent/40">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Cosine Similarity Match
          </span>
        )}
      </div>

      {/* Vector Math Breakdown */}
      <div className="p-3 bg-neutral-950 rounded border border-neutral-850 flex flex-col gap-2">
        <div className="text-[10px] text-muted font-sans font-semibold uppercase tracking-wider">
          Cosine Formula: &nbsp;
          <span className="text-white font-mono lowercase">
            cos(θ) = (u · v) / (||u|| ||v||)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          {/* Dot Product */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
            <span className="text-muted text-[10px]">u · v</span>
            <span className="text-neutral-500">=</span>
            <span className="font-bold text-white">{dot.toFixed(4)}</span>
          </div>

          <span className="text-neutral-500 font-bold">/</span>

          {/* Norms */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
            <span className="text-muted text-[10px]">||u||·||v||</span>
            <span className="text-neutral-500">=</span>
            <span className="font-mono text-neutral-400">
              {normA.toFixed(3)} × {normB.toFixed(3)}
            </span>
          </div>

          <span className="text-neutral-500 font-bold">=</span>

          {/* Cosine Score */}
          <motion.div
            key={`cos-${candidateId}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent/20 border border-accent/60 text-white font-bold text-sm shadow-sm shadow-accent/40"
          >
            <span className="text-accent font-sans text-xs">cos(θ) =</span>
            <span className="text-accent font-mono">{cosine.toFixed(4)}</span>
          </motion.div>

          {/* Angular Separation */}
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-700 text-amber-300 font-mono font-bold">
            <span className="text-muted text-[10px] font-sans">θ =</span>
            <span>{angleDeg.toFixed(1)}°</span>
          </div>
        </div>
      </div>

      {/* Honesty Note */}
      <div className="p-2.5 rounded bg-neutral-900/40 border border-neutral-800 text-[11px] font-sans text-neutral-400 flex items-start gap-2">
        <span className="text-blue-400 text-sm">📐</span>
        <p className="leading-relaxed">
          <strong className="text-neutral-200">Honesty Note:</strong> The angle shown (<span className="text-amber-300 font-mono">{angleDeg.toFixed(1)}°</span>) is the mathematically authentic angle in full {effectiveVocabDim}-dimensional token space. The 2D map below is a PCA projection, so the visual arc is drawn schematically — trust the payload number as the real value.
        </p>
      </div>

      {isCold && (
        <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-[11px] font-sans text-emerald-300/90 flex items-start gap-2">
          <span>✨</span>
          <p className="leading-relaxed">
            <strong>Cold-Start Resilience:</strong> Unlike SVD (which had zero latent factors and fell back to baseline), Content-Based recommendations score {title} normally based on director (<span className="font-mono text-white">{candidateMovie?.director ?? "Christopher Nolan"}</span>), cast, and {candidateMovie?.genres[0] ?? "Sci-Fi"} tags!
          </p>
        </div>
      )}
    </div>
  );
};
