"use client";

import React from "react";
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
  const year = candidateMovie?.year ?? (isCold ? 2026 : 2010);

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Title & Metadata */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-xs">
            {title} ({year})
          </span>
          <span className="text-[10px] text-muted font-mono bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
            {candidateId}
          </span>
        </div>

        {isCold && (
          <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
            Cold Start · Scored from metadata
          </span>
        )}
      </div>

      {/* Vector Math Breakdown */}
      <div className="p-2 bg-neutral-950 rounded border border-neutral-850 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
          <span className="text-muted font-sans text-[10px]">u · v =</span>
          <span className="text-white font-bold">{dot.toFixed(4)}</span>
        </div>

        <span className="text-neutral-500">/</span>

        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-neutral-400">
          <span className="text-muted font-sans text-[10px]">||u||·||v|| =</span>
          <span>{(normA * normB).toFixed(3)}</span>
        </div>

        <span className="text-neutral-500">=</span>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/40 text-blue-300 font-bold">
          <span className="text-blue-400 font-sans text-[10px]">cos(θ) =</span>
          <span>{cosine.toFixed(4)}</span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700 text-amber-300 font-bold ml-auto">
          <span className="text-muted font-sans text-[10px]">θ =</span>
          <span>{angleDeg.toFixed(1)}°</span>
        </div>
      </div>

      {/* Compact Honesty / Dimension Note */}
      <div className="text-[10px] text-neutral-400 leading-normal">
        True angle in full <span className="font-mono text-neutral-300">{effectiveVocabDim}-dim</span> token space. The 2D map below is a PCA projection; the arc is schematic.
      </div>
    </div>
  );
};
