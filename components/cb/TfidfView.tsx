"use client";

import React from "react";
import { useSimStore } from "@/lib/sim/store";
import { MOVIES, COLD_MOVIE } from "@/lib/data/movies";

interface TfidfViewProps {
  vocabulary?: string[];
}

export const TfidfView: React.FC<TfidfViewProps> = ({ vocabulary = [] }) => {
  const store = useSimStore();
  const tfidfMatrix = store.cbResult?.tfidfMatrix ?? [];

  const catalogFirst = MOVIES.find((m) => !m.cold) ?? MOVIES[0];
  const catalogFirstIdx = MOVIES.findIndex((m) => m.id === catalogFirst.id);
  const catalogSecond = MOVIES.filter((m) => !m.cold)[1] ?? MOVIES[1];
  const catalogSecondIdx = MOVIES.findIndex((m) => m.id === catalogSecond.id);
  const coldIdx = COLD_MOVIE ? MOVIES.findIndex((m) => m.id === COLD_MOVIE.id) : -1;

  const featured = [
    {
      id: catalogFirst.id,
      title: catalogFirst.title,
      year: catalogFirst.year,
      idx: Math.max(0, catalogFirstIdx),
      isCold: false,
    },
    ...(store.coldStart && COLD_MOVIE && coldIdx >= 0
      ? [
          {
            id: COLD_MOVIE.id,
            title: COLD_MOVIE.title,
            year: COLD_MOVIE.year,
            idx: coldIdx,
            isCold: true,
          },
        ]
      : [
          {
            id: catalogSecond.id,
            title: catalogSecond.title,
            year: catalogSecond.year,
            idx: Math.max(0, catalogSecondIdx),
            isCold: false,
          },
        ]),
  ];

  const getTopTokensForMovie = (rowIdx: number) => {
    if (!tfidfMatrix[rowIdx] || vocabulary.length === 0) return [];
    const row = tfidfMatrix[rowIdx];
    const items = row
      .map((weight, vIdx) => ({ token: vocabulary[vIdx], weight }))
      .filter((item) => item.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    return items;
  };

  const getNamespaceBadge = (tok: string) => {
    if (tok.startsWith("genre:")) return { label: "genre", color: "text-blue-400" };
    if (tok.startsWith("dir:")) return { label: "dir", color: "text-purple-400" };
    if (tok.startsWith("cast:")) return { label: "cast", color: "text-emerald-400" };
    return { label: "kw", color: "text-neutral-400" };
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <span className="text-white font-semibold text-xs">
          L2-Normalized TF-IDF Feature Weights
        </span>
        <span className="text-[10px] text-muted font-mono">
          TF · IDF
        </span>
      </div>

      {/* Top tokens comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {featured.map((feat) => {
          const topTokens = getTopTokensForMovie(feat.idx);
          const maxWeight = topTokens[0]?.weight ?? 1;

          return (
            <div
              key={feat.id}
              className={`p-2 rounded border flex flex-col gap-1.5 ${
                feat.isCold
                  ? "bg-amber-950/15 border-amber-800/40"
                  : "bg-neutral-900/60 border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-xs">
                  {feat.title} ({feat.year})
                </span>
                {feat.isCold ? (
                  <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40 font-mono">
                    Cold Start
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">Liked Movie</span>
                )}
              </div>

              {/* Top Token Bars */}
              <div className="flex flex-col gap-1 pt-0.5">
                {topTokens.map(({ token, weight }) => {
                  const ns = getNamespaceBadge(token);
                  const pct = Math.min(100, (weight / maxWeight) * 100);

                  return (
                    <div key={token} className="flex items-center gap-1.5 text-[10px]">
                      <span className={`w-8 shrink-0 font-mono font-medium ${ns.color}`}>
                        {ns.label}
                      </span>
                      <span className="w-20 shrink-0 truncate text-neutral-300">
                        {token.split(":")[1]?.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 h-1.5 bg-neutral-950 rounded overflow-hidden flex items-center">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right font-mono text-neutral-400">
                        {weight.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-neutral-400">
        Rarer metadata attributes (directors, cast) receive higher TF-IDF weights than common genres.
      </div>
    </div>
  );
};
