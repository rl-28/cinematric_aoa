"use client";

import React from "react";
import { MOVIES, COLD_MOVIE } from "@/lib/data/movies";
import { useSimStore } from "@/lib/sim/store";

interface TokenizeViewProps {
  tokensByMovie?: Record<string, string[]>;
  vocabSize?: number;
}

export const TokenizeView: React.FC<TokenizeViewProps> = ({
  tokensByMovie = {},
  vocabSize,
}) => {
  const store = useSimStore();
  const coldStart = store.coldStart;

  const effectiveVocabSize =
    vocabSize ??
    store.cbResult?.vocabulary?.length ??
    store.cbStats?.vocabSize ??
    Object.keys(tokensByMovie).length;

  const catalogFirst = MOVIES.find((m) => !m.cold) ?? MOVIES[0];
  const catalogSecond = MOVIES.filter((m) => !m.cold)[1] ?? MOVIES[1];

  const featuredMovies = [
    {
      id: catalogFirst.id,
      title: catalogFirst.title,
      year: catalogFirst.year,
      isCold: false,
      desc: "Rated 5★ by Alex",
    },
    ...(coldStart && COLD_MOVIE
      ? [
          {
            id: COLD_MOVIE.id,
            title: COLD_MOVIE.title,
            year: COLD_MOVIE.year,
            isCold: true,
            desc: "0 ratings in dataset",
          },
        ]
      : [
          {
            id: catalogSecond.id,
            title: catalogSecond.title,
            year: catalogSecond.year,
            isCold: false,
            desc: "Sci-Fi Catalog item",
          },
        ]),
  ];

  const getNamespaceStyle = (token: string) => {
    if (token.startsWith("genre:")) {
      return "bg-blue-950/60 text-blue-300 border-blue-800/50";
    }
    if (token.startsWith("dir:")) {
      return "bg-purple-950/60 text-purple-300 border-purple-800/50";
    }
    if (token.startsWith("cast:")) {
      return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50";
    }
    return "bg-neutral-800 text-neutral-300 border-neutral-700";
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-xs">
            Feature Tokenization
          </span>
          <span className="text-[10px] text-muted font-mono bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
            {effectiveVocabSize} Unique Tokens
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
          <span className="text-blue-400">genre:</span>
          <span className="text-purple-400">dir:</span>
          <span className="text-emerald-400">cast:</span>
          <span className="text-neutral-400">kw:</span>
        </div>
      </div>

      {/* Featured Movies */}
      <div className="flex flex-col gap-2">
        {featuredMovies.map((feat) => {
          const tokens = tokensByMovie[feat.id] ?? [];

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
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-medium text-xs">
                    {feat.title} ({feat.year})
                  </span>
                  <span className="text-[10px] text-muted font-mono bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
                    {feat.id}
                  </span>
                  {feat.isCold && (
                    <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40 font-mono">
                      NEW · 0 ratings
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted">{feat.desc}</span>
              </div>

              {/* Tokens Cloud */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {tokens.length > 0 ? (
                  tokens.map((tok) => (
                    <span
                      key={tok}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getNamespaceStyle(
                        tok
                      )}`}
                    >
                      {tok}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-500 text-[10px] italic">Extracting tokens...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-neutral-400">
        Namespacing prefixes prevent token collisions across metadata attributes.
      </div>
    </div>
  );
};
