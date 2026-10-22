import React from "react";
import { getOfflineMetrics } from "@/lib/engines/metrics";

interface AlgoCardProps {
  algorithm: "svd" | "content";
}

export function AlgoCard({ algorithm }: AlgoCardProps) {
  const metricsResult = getOfflineMetrics();
  const metrics = algorithm === "svd" ? metricsResult.svd : metricsResult.content;

  const isSvd = algorithm === "svd";

  return (
    <div className="flex flex-col h-full bg-surface/90 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 hover:border-neutral-700/80 transition-all duration-300 relative overflow-hidden group">
      {/* Subtle top accent edge */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isSvd ? "bg-accent" : "bg-neutral-400 group-hover:bg-white"
        } transition-colors`}
      />

      {/* Header & Badges */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span
            className={`inline-block text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded mb-2 border ${
              isSvd
                ? "bg-accent/10 border-accent/30 text-accent font-semibold"
                : "bg-neutral-800/80 border-neutral-700 text-neutral-300 font-semibold"
            }`}
          >
            {isSvd ? "Collaborative Filtering" : "Content-Based Filtering"}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isSvd ? "Truncated SVD (Matrix Factorization)" : "Vector Space Model (TF-IDF Cosine)"}
          </h3>
        </div>

        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-[10px] font-mono text-muted uppercase">Paradigm</span>
          <span className="text-xs font-mono text-neutral-300">
            {isSvd ? "Latent Factors (k=2)" : "High-Dim Sparse (112D)"}
          </span>
        </div>
      </div>

      {/* 3-Line Plain-Language Explanation */}
      <div className="space-y-1.5 text-sm text-neutral-300 leading-relaxed mb-6">
        {isSvd ? (
          <>
            <p>1. Deconstructs the collective user-item rating grid to uncover latent taste patterns.</p>
            <p>2. Compresses sparse ratings into low-dimensional orthogonal vectors capturing hidden preferences.</p>
            <p>3. Predicts unrated items via dot products between user taste and movie feature factors plus biases.</p>
          </>
        ) : (
          <>
            <p>1. Extracts descriptive tokens (genres, directors, cast, keywords) directly from catalog metadata.</p>
            <p>2. Constructs a 112-token preference profile by weighting metadata of movies the user rated highly.</p>
            <p>3. Ranks unrated movies by measuring the cosine angle between candidate vectors and the user profile.</p>
          </>
        )}
      </div>

      {/* Mathematical Formula Box */}
      <div className="mb-6 rounded-xl bg-neutral-950/80 border border-neutral-800/80 p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2 flex items-center justify-between">
          <span>Mathematical Formulation</span>
          <span className="text-neutral-500 font-sans text-[11px]">{isSvd ? "Biased SVD" : "Normalized Dot Product"}</span>
        </div>

        <div className="py-2 px-3 rounded bg-neutral-900/60 border border-neutral-800/50 text-center font-mono text-sm sm:text-base text-white tracking-wide overflow-x-auto">
          {isSvd ? (
            <span>
              r̂<sub>ui</sub> = μ + b<sub>u</sub> + b<sub>i</sub> + P<sub>u</sub> · Q<sub>i</sub><sup>T</sup>
            </span>
          ) : (
            <span>
              cos(θ) = (u · v) / (||u|| · ||v||) = ∑(u<sub>j</sub> · v<sub>j</sub>) / (√∑u<sub>j</sub><sup>2</sup> · √∑v<sub>j</sub><sup>2</sup>)
            </span>
          )}
        </div>

        {/* Mathematical Reconciliation Note */}
        <p className="mt-3 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/60 pt-2.5">
          {isSvd ? (
            <>
              <strong className="text-neutral-200">Reconciliation:</strong> Textbook SVD decomposes an exact matrix{" "}
              <code className="text-neutral-300 font-mono text-[11px]">R ≈ UΣVᵀ</code>, assuming all entries are observed. Cinemetric reconciles this for sparse ratings by first estimating global mean <code className="text-neutral-300 font-mono text-[11px]">μ</code> and user/item biases <code className="text-neutral-300 font-mono text-[11px]">b_u, b_i</code>, then performing truncated SVD (<code className="text-neutral-300 font-mono text-[11px]">k=2</code>) on the centered residual matrix <code className="text-neutral-300 font-mono text-[11px]">A = R - baseline</code> to form latent factors <code className="text-neutral-300 font-mono text-[11px]">P = U√Σ</code> and <code className="text-neutral-300 font-mono text-[11px]">Q = V√Σ</code>.
            </>
          ) : (
            <>
              <strong className="text-neutral-200">Vector Space:</strong> Evaluated in a 112-token sparse vocabulary space. TF-IDF weighting discounts common broad genres (e.g. Action) in favor of rare, distinctive identifiers (e.g. Christopher Nolan, Keanu Reeves). The normalized cosine angle yields an invariant match score in <code className="text-neutral-300 font-mono text-[11px]">[0, 1]</code>.
            </>
          )}
        </p>
      </div>

      {/* Strong At / Weak At Comparison Pair */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/60 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Strong At</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {isSvd
              ? "High serendipity. Uncovers unexpected cross-genre associations through latent user taste clustering without requiring metadata tags."
              : "Zero-day cold start resilience. Scores brand-new catalog items immediately from director, cast, and keyword tokens with zero prior ratings."}
          </p>
        </div>

        <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/60 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Weak At</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {isSvd
              ? "Cold-start blindness. Items with 0 ratings have no factor vector (Q=[0,0]) and fall back to baseline average. Heavy O(m²n) recompute cost."
              : "Filter bubble & tag reliance. Cannot recommend outside the user's historical vocabulary, and accuracy is bottlenecked by catalog tag quality."}
          </p>
        </div>
      </div>

      {/* Real Deterministic Metrics Readout */}
      <div className="mt-auto pt-4 border-t border-neutral-800/80">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2.5">
          Engine Ground-Truth Metrics (Deterministic Split)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-2.5 text-center">
            <span className="block text-[10px] font-mono text-muted mb-0.5">Precision@5</span>
            <span className="text-sm sm:text-base font-mono font-bold text-white">
              {(metrics.precisionAtK * 100).toFixed(0)}%
            </span>
            <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">test split</span>
          </div>

          <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-2.5 text-center">
            <span className="block text-[10px] font-mono text-muted mb-0.5">Memory Footprint</span>
            <span className="text-sm sm:text-base font-mono font-bold text-white">
              {metrics.memoryBytes.toLocaleString()} B
            </span>
            <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">data structures</span>
          </div>

          <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-2.5 text-center">
            <span className="block text-[10px] font-mono text-muted mb-0.5">Cold-Start Score</span>
            <span
              className={`text-sm sm:text-base font-mono font-bold ${
                metrics.coldStartScore > 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {(metrics.coldStartScore * 100).toFixed(0)}%
            </span>
            <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">
              {metrics.coldStartScore > 0 ? "personalized" : "baseline only"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
