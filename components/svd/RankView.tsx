"use client";

import React from "react";
import { SvdRecommendation, SvdUnrankableItem } from "@/lib/engines/types";
import { MOVIES } from "@/lib/data/movies";

interface RankViewProps {
  recommendations: SvdRecommendation[];
  unrankable?: SvdUnrankableItem[];
}

export const RankView: React.FC<RankViewProps> = ({
  recommendations,
  unrankable,
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <span className="text-white font-semibold text-xs">
          Top-{Math.min(5, recommendations.length)} SVD Recommendations
        </span>
        <span className="text-[10px] text-muted font-mono">
          Predicted Rating Rank
        </span>
      </div>

      {/* Recommendations List */}
      <div className="flex flex-col gap-1.5">
        {recommendations.slice(0, 5).map((rec, idx) => {
          const movie = MOVIES.find((m) => m.id === rec.movieId);
          const year = movie?.year ?? 2010;

          return (
            <div
              key={rec.movieId}
              className="flex items-center justify-between p-2 rounded bg-neutral-900/60 border border-neutral-800"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-xs">
                    {rec.title} ({year})
                  </span>
                  <span className="text-[10px] text-muted">
                    {movie ? movie.genres.join(", ") : rec.movieId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-mono text-accent font-bold text-xs">
                <span>★</span>
                <span>{rec.score.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unrankable Cold Item Card */}
      {unrankable && unrankable.length > 0 && (
        <div className="p-2.5 rounded bg-amber-950/15 border border-amber-800/30 flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between text-amber-400 font-semibold text-xs">
            <span>Cold-Start Isolation</span>
            <span className="font-mono text-[10px]">
              {unrankable.map((u) => `${u.title} (${MOVIES.find(m => m.id === u.itemId)?.year ?? 2026})`).join(", ")}
            </span>
          </div>
          <p className="text-neutral-300 text-[10px] leading-relaxed">
            Zero ratings exist in the matrix. Latent vector Q is [0, 0]; SVD reverted to baseline prediction only and excluded it from top-{Math.min(5, recommendations.length)}.
          </p>
        </div>
      )}
    </div>
  );
};
