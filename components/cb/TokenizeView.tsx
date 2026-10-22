"use client";

import React from "react";
import { MOVIES } from "@/lib/data/movies";

interface TokenizeViewProps {
  tokensByMovie?: Record<string, string[]>;
  vocabSize?: number;
}

export const TokenizeView: React.FC<TokenizeViewProps> = ({
  tokensByMovie = {},
  vocabSize = 112,
}) => {
  // Feature two representative movies: Chronopolis (m14 cold) and Inception (m1 rated)
  const featuredMovies = [
    { id: "m1", title: "Inception", isCold: false, desc: "Catalog Movie (Rated 5★ by Alex)" },
    { id: "m14", title: "Chronopolis", isCold: true, desc: "Cold-Start Item (0 ratings in dataset)" },
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
    return "bg-amber-950/60 text-amber-300 border-amber-800/50";
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded-md border border-neutral-800 text-xs font-mono">
      {/* Vocabulary Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold font-sans text-xs">
            Namespaced Feature Tokenization
          </span>
          <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/30 font-bold">
            {vocabSize} Unique Terms in Vocab
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-sans">
          <span className="text-blue-400">genre:</span>
          <span className="text-purple-400">dir:</span>
          <span className="text-emerald-400">cast:</span>
          <span className="text-amber-400">kw:</span>
        </div>
      </div>

      {/* Featured Movie Token Chips */}
      <div className="flex flex-col gap-3">
        {featuredMovies.map((feat) => {
          const movie = MOVIES.find((m) => m.id === feat.id);
          const tokens = tokensByMovie[feat.id] ?? [];

          return (
            <div
              key={feat.id}
              className={`p-2.5 rounded border flex flex-col gap-2 ${
                feat.isCold
                  ? "bg-amber-950/15 border-amber-800/40"
                  : "bg-neutral-900/60 border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold font-sans text-xs">
                    {feat.title}
                  </span>
                  <span className="text-[10px] text-muted font-mono bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
                    {feat.id}
                  </span>
                  {feat.isCold && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold font-sans">
                      NEW · 0 ratings
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted font-sans">{feat.desc}</span>
              </div>

              {/* Tokens Cloud */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {tokens.length > 0 ? (
                  tokens.map((tok) => (
                    <span
                      key={tok}
                      className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getNamespaceStyle(
                        tok
                      )}`}
                    >
                      {tok}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-500 text-[11px] italic">Extracting tokens...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-muted font-sans pt-1">
        * Namespacing prefixes (e.g. <code className="text-neutral-300">dir:</code> vs <code className="text-neutral-300">cast:</code>) prevent collisions across metadata fields.
      </div>
    </div>
  );
};
