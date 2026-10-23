"use client";

import React from "react";
import { ContentRecommendation } from "@/lib/engines/types";
import { MOVIES } from "@/lib/data/movies";

interface RankListViewProps {
  recommendations: ContentRecommendation[];
  coldStartActive: boolean;
}

export const RankListView: React.FC<RankListViewProps> = ({
  recommendations,
  coldStartActive,
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <span className="text-white font-semibold text-xs">
          Top-{Math.min(5, recommendations.length)} Content Recommendations
        </span>
        <span className="text-[10px] text-muted font-mono">
          Cosine Similarity Rank
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
              className={`flex items-center justify-between p-2 rounded border ${
                rec.isCold
                  ? "bg-amber-950/15 border-amber-800/40"
                  : "bg-neutral-900/60 border-neutral-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full font-mono font-bold flex items-center justify-center text-[10px] ${
                    rec.isCold
                      ? "bg-amber-800/80 text-amber-200"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-medium text-xs">
                      {rec.title} ({year})
                    </span>
                    {rec.isCold && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                        COLD START
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted">
                    {movie ? movie.genres.join(", ") : rec.movieId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-mono text-blue-400 font-bold text-xs">
                <span className="text-muted text-[10px] font-sans">cos =</span>
                <span>{rec.score.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {coldStartActive ? (
        <div className="text-[10px] text-neutral-300 bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800">
          Cold-Start Active: Chronopolis ranked via its Sci-Fi / Thriller metadata vector.
        </div>
      ) : (
        <div className="text-[10px] text-neutral-400 bg-neutral-900/40 px-2 py-1 rounded border border-neutral-800">
          Cold-Start OFF: Chronopolis excluded from candidate ranking.
        </div>
      )}
    </div>
  );
};
