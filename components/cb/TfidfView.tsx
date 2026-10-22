"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSimStore } from "@/lib/sim/store";

interface TfidfViewProps {
  vocabulary?: string[];
}

export const TfidfView: React.FC<TfidfViewProps> = ({ vocabulary = [] }) => {
  const store = useSimStore();
  const tfidfMatrix = store.cbResult?.tfidfMatrix ?? [];

  // Movie m1 (Inception) is index 0; m14 (Chronopolis) is index 13
  const featured = [
    { id: "m1", title: "Inception", idx: 0, isCold: false },
    { id: "m14", title: "Chronopolis", idx: 13, isCold: true },
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
    return { label: "kw", color: "text-amber-400" };
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded-md border border-neutral-800 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold font-sans text-xs">
            L2-Normalized TF-IDF Feature Weights
          </span>
          <span className="text-[10px] text-muted bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-mono">
            TF · IDF = (count/total) · (ln((1+N)/(1+DF)) + 1)
          </span>
        </div>
      </div>

      {/* Top tokens comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {featured.map((feat) => {
          const topTokens = getTopTokensForMovie(feat.idx);
          const maxWeight = topTokens[0]?.weight ?? 1;

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
                <span className="text-white font-bold font-sans text-xs">
                  {feat.title} ({feat.id})
                </span>
                {feat.isCold ? (
                  <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 font-sans font-bold">
                    Cold Start Movie
                  </span>
                ) : (
                  <span className="text-[10px] text-muted font-sans">Liked by Target</span>
                )}
              </div>

              {/* Top Token Bars */}
              <div className="flex flex-col gap-1.5 pt-1">
                {topTokens.map(({ token, weight }) => {
                  const ns = getNamespaceBadge(token);
                  const pct = Math.min(100, (weight / maxWeight) * 100);

                  return (
                    <div key={token} className="flex items-center gap-2 text-[10px]">
                      <span className={`w-8 shrink-0 font-bold ${ns.color}`}>
                        {ns.label}
                      </span>
                      <span className="w-24 shrink-0 truncate text-neutral-300 font-sans">
                        {token.split(":")[1]?.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 h-2 bg-neutral-950 rounded-sm overflow-hidden flex items-center">
                        <motion.div
                          className="h-full bg-accent rounded-sm"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.25 }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right font-mono text-neutral-300">
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

      {/* Analytical Note on Token Weights */}
      <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80 text-[11px] font-sans text-neutral-300 flex items-start gap-2">
        <span className="text-amber-400 text-sm">💡</span>
        <p className="leading-relaxed">
          <strong>Rarity Weighting:</strong> Specific directors (e.g. <span className="font-mono text-purple-300">dir:alex_garland</span>) and keywords carry substantially higher TF-IDF weight than broad categories (e.g. <span className="font-mono text-blue-300">genre:sci-fi</span>) because IDF penalizes terms that appear frequently across the catalog.
        </p>
      </div>
    </div>
  );
};
