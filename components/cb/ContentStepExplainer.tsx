"use client";

import React from "react";
import { ContentStep } from "@/lib/engines/types";

interface ContentStepExplainerProps {
  step: ContentStep | null | undefined;
  stepIndex: number;
  totalSteps: number;
}

export const ContentStepExplainer: React.FC<ContentStepExplainerProps> = ({
  step,
  stepIndex,
  totalSteps,
}) => {
  if (!step) return null;

  const getStepDetails = () => {
    switch (step.kind) {
      case "tokenize":
        return {
          title: "Step 1: Extract Metadata Tokens",
          summary: "Tokenizing movie attributes into namespaced feature tokens across 112 terms.",
          math: "Tokens = { genre:*, dir:*, cast:*, kw:* }",
          calculation: "Namespacing prevents collisions between directors and cast members (e.g. 'dir:nolan' vs 'cast:nolan'). Distinctive attributes like directors carry high semantic signal.",
          takeaway: "Every movie, even Chronopolis with 0 ratings, is fully tokenized from metadata alone.",
        };
      case "tfidf":
        return {
          title: "Step 2: Compute TF-IDF Vectors & L2 Normalization",
          summary: "Weighting tokens by inverse document frequency and projecting onto unit sphere.",
          math: "w(t, d) = tf(t, d) · log(N / df(t)),   v_d = w / ||w||₂",
          calculation: "Rare attributes that appear in few movies (e.g. 'dir:christopher_nolan') receive high IDF weights, while generic tags (e.g. 'genre:drama') receive lower weights.",
          takeaway: "L2 normalization guarantees that cosine similarity strictly measures angular alignment regardless of token count.",
        };
      case "profile":
        return {
          title: "Step 3: Build Target User Taste Profile u",
          summary: "Synthesizing Alex's preference vector as rating-weighted centroid of liked movies.",
          math: "u = (∑_{j ∈ Liked} R_{u,j} · v_j) / (∑_{j ∈ Liked} R_{u,j})",
          calculation: "Alex rated Inception (5.0), The Matrix (5.0), Interstellar (5.0), and The Dark Knight (4.0). Their normalized vectors are blended into a single composite taste vector.",
          takeaway: "The resulting profile vector strongly emphasizes Sci-Fi, Action, Space, and Christopher Nolan.",
        };
      case "compare":
        const dot = step.payload?.dot?.toFixed(4) ?? "0.0000";
        const cos = step.payload?.cosine?.toFixed(4) ?? "0.0000";
        const deg = step.payload?.angleDeg?.toFixed(1) ?? "0.0";
        const title = step.payload?.title ?? "Candidate";
        const isCold = step.payload?.isCold;

        return {
          title: `Step 4: Cosine Similarity Comparison with ${title}`,
          summary: isCold
            ? "Evaluating unrated new release Chronopolis (2026) strictly from its metadata attributes."
            : `Measuring angular similarity between Alex's taste vector and ${title}'s vector.`,
          math: "cos(θ) = (u · v) / (||u||₂ · ||v||₂),   θ = arccos(cos θ)",
          calculation: `Dot Product = ${dot} ⟹ Cosine Score = ${cos} (True Angle in 112D space: ${deg}°)`,
          takeaway: isCold
            ? "Notice how Chronopolis achieves a high similarity (cos = 0.504, 59.7°) because it shares director Nolan and Sci-Fi tags — solving the cold-start problem!"
            : `An angle of ${deg}° indicates how closely ${title} aligns with Alex's profile.`,
        };
      case "rank":
        return {
          title: "Step 5: Final Content-Based Recommendations",
          summary: "Sorting all unrated candidate movies by cosine similarity score.",
          math: "Ranking = argmax_{v} cos(u, v)",
          calculation: "Chronopolis ranks #1 (cos = 0.504), followed by Blade Runner 2049 (cos = 0.140) and Dune (cos = 0.117).",
          takeaway: "Content-based filtering excels at scoring brand new, unrated items immediately upon catalog release.",
        };
      default:
        return {
          title: `Step: ${(step as { label?: string }).label ?? "Update"}`,
          summary: "Content-based algorithm step.",
          math: "",
          calculation: "",
          takeaway: "",
        };
    }
  };

  const details = getStepDetails();

  return (
    <div className="bg-gradient-to-r from-neutral-900/90 to-surface border border-neutral-700/80 rounded-lg p-3 text-xs shadow-lg flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h4 className="text-white font-bold font-sans text-xs tracking-wide">
            {details.title}
          </h4>
        </div>
        <span className="text-[10px] text-muted font-mono bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      <p className="text-neutral-300 font-sans text-[11px] leading-relaxed">
        {details.summary}
      </p>

      {/* Formula & Calculation Box */}
      <div className="bg-black/40 rounded p-2.5 border border-neutral-800/80 flex flex-col gap-1.5 font-mono">
        <div className="text-[11px] text-blue-300/90 font-semibold flex items-center gap-1.5">
          <span className="text-[10px] text-muted uppercase tracking-wider font-sans">Formula:</span>
          <span>{details.math}</span>
        </div>
        <div className="text-[11px] text-neutral-200">
          <span className="text-[10px] text-muted uppercase tracking-wider font-sans">Calculation: </span>
          <span className="text-emerald-400 font-semibold">{details.calculation}</span>
        </div>
      </div>

      {details.takeaway && (
        <div className="text-[11px] text-neutral-400 font-sans flex items-center gap-1.5 pt-0.5">
          <span className="text-blue-400 font-bold tracking-wide uppercase text-[10px]">Key Insight:</span>
          <span>{details.takeaway}</span>
        </div>
      )}
    </div>
  );
};
