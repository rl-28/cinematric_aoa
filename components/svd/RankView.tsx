"use client";

import React from "react";
import { motion } from "framer-motion";
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
    <div className="flex flex-col gap-4 p-4 bg-surface rounded-md border border-neutral-800 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold font-sans text-sm">
            Top-{Math.min(5, recommendations.length)} SVD Recommendations
          </span>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="flex flex-col gap-2">
        {recommendations.slice(0, 5).map((rec, idx) => {
          const movie = MOVIES.find((m) => m.id === rec.movieId);
          const year = movie?.year ?? 2010;

          return (
            <motion.div
              key={rec.movieId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center text-[11px]">
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-white font-semibold font-sans text-xs">
                    {rec.title} ({year})
                  </span>
                  <span className="text-[10px] text-muted font-sans">
                    {movie ? `${movie.genres.join(", ")}` : rec.movieId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 font-mono text-amber-300 font-bold">
                  <span className="text-accent text-xs">★</span>
                  <span>{rec.score.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cannot Rank (Unrankable) Card */}
      {unrankable && unrankable.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 rounded-md bg-amber-950/20 border border-amber-800/40 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-amber-400 font-sans font-bold text-xs">
            <span>Cannot Rank: No Latent Factors (Cold Item)</span>
          </div>

          <div className="flex flex-col gap-1.5 font-sans text-[11px] text-neutral-300">
            {unrankable.map((item) => {
              const coldMovie = MOVIES.find((m) => m.id === item.itemId);
              return (
                <div
                  key={item.itemId}
                  className="flex flex-col p-2.5 rounded bg-neutral-950/60 border border-amber-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {item.title} ({coldMovie?.year ?? 2026})
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/50 font-mono">
                      {item.itemId}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px] mt-1.5 leading-relaxed">
                    This item has zero ratings in the user-item matrix. Its latent factor vector Q is [0, 0].
                    The algorithm reverted to baseline prediction only (μ + b_u) and excluded it from the recommendations.
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
