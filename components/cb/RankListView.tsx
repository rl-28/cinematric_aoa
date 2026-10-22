"use client";

import React from "react";
import { motion } from "framer-motion";
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
    <div className="flex flex-col gap-3 p-3.5 bg-surface rounded-md border border-neutral-800 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold font-sans text-sm">
            Top-{Math.min(5, recommendations.length)} Content Recommendations
          </span>
          <span className="text-[10px] text-muted bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-mono">
            Cosine Similarity Ranking
          </span>
        </div>
        <span className="text-accent text-[11px] font-sans font-semibold">
          High-Dim Token Match
        </span>
      </div>

      {/* Recommendations List */}
      <div className="flex flex-col gap-1.5">
        {recommendations.slice(0, 5).map((rec, idx) => {
          const movie = MOVIES.find((m) => m.id === rec.movieId);

          return (
            <motion.div
              key={rec.movieId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`flex items-center justify-between p-2.5 rounded border transition-colors ${
                rec.isCold
                  ? "bg-emerald-950/20 border-emerald-800/50 hover:border-emerald-700"
                  : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full font-mono font-bold flex items-center justify-center text-[11px] ${
                    rec.isCold
                      ? "bg-emerald-800 text-emerald-200"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold font-sans text-xs">
                      {rec.title}
                    </span>
                    {rec.isCold && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans font-bold">
                        COLD START
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted font-sans">
                    {movie ? `${movie.year} · ${movie.genres.join(", ")}` : rec.movieId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 font-mono text-accent font-bold">
                  <span className="text-neutral-500 text-[10px] font-sans">cos =</span>
                  <span>{rec.score.toFixed(4)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {coldStartActive ? (
        <div className="text-[11px] font-sans text-emerald-300/90 bg-emerald-950/20 px-2.5 py-1.5 rounded border border-emerald-800/30 flex items-center gap-2">
          <span>✨</span>
          <span>
            <strong>Cold-Start Active:</strong> Chronopolis successfully ranked based on its Sci-Fi / Thriller metadata vector.
          </span>
        </div>
      ) : (
        <div className="text-[11px] font-sans text-neutral-400 bg-neutral-900/40 px-2.5 py-1.5 rounded border border-neutral-800 flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            Cold-Start toggle is OFF (Chronopolis hidden from ranking via selector).
          </span>
        </div>
      )}
    </div>
  );
};
