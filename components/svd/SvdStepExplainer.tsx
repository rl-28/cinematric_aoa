"use client";

import React from "react";
import { SvdStep } from "@/lib/engines/types";

interface SvdStepExplainerProps {
  step: SvdStep | null | undefined;
  stepIndex: number;
  totalSteps: number;
}

export const SvdStepExplainer: React.FC<SvdStepExplainerProps> = ({
  step,
  stepIndex,
  totalSteps,
}) => {
  if (!step) return null;

  const getStepDetails = () => {
    switch (step.kind) {
      case "load":
        return {
          title: "Step 1: Load Observed Ratings Matrix",
          summary: "Loading user-movie ratings table into memory (10 users × 14 items).",
          math: "Matrix R ∈ ℝ^{10 × 14}, Sparsity = 49.3% (69 rated cells, 71 missing)",
          calculation: "Collaborative filtering learns purely from observed user interactions. Missing cells (denoted by '?') represent unrated movies that our model must predict.",
          takeaway: "Notice that Chronopolis (m14) has 0 ratings across all users — a true cold-start challenge.",
        };
      case "baseline":
        return {
          title: "Step 2: Estimate Baseline Biases (μ + b_u + b_i)",
          summary: "Separating global rating tendencies and entity biases before matrix factorization.",
          math: "r̂_baseline(u, i) = μ + b_u + b_i",
          calculation: `Global Mean μ = ${step.payload?.mu?.toFixed(3) ?? "4.014"} | Target User Bias b_Alex = ${step.payload?.bu?.[0]?.toFixed(2) ?? "+0.49"}. Baseline captures general optimism/pessimism so latent factors only model pure preference interactions.`,
          takeaway: "An item bias b_i > 0 indicates movies generally rated higher than average across all users.",
        };
      case "center":
        return {
          title: "Step 3: Construct Centered Residual Matrix A",
          summary: "Subtracting baseline biases from observed ratings to isolate relative taste nuances.",
          math: "A_{u,i} = R_{u,i} - (μ + b_u + b_i)   [A_{u,i} = 0 if unrated]",
          calculation: "For Alex on Inception: R = 5.0, Baseline = 4.88 ⟹ Residual A = +0.12. By setting missing residuals to 0, SVD focuses strictly on deviations from baseline expectations.",
          takeaway: "Positive residuals mean the user liked the item more than their baseline average.",
        };
      case "decompose":
        return {
          title: "Step 4: Singular Value Decomposition (A = U Σ Vᵀ)",
          summary: "Factorizing residual matrix into user vectors (U), singular values (Σ), and item vectors (V).",
          math: "A = U · Σ · Vᵀ",
          calculation: `Singular spectrum values: Σ = [${(step.payload?.s ?? [5.527, 4.144]).map((s: number) => s.toFixed(2)).join(", ")}]. Each singular value represents the variance captured along that latent taste dimension.`,
          takeaway: "Dimension 1 corresponds broadly to Sci-Fi/Blockbuster preference, while Dimension 2 reflects Drama/Artistic preference.",
        };
      case "truncate":
        return {
          title: "Step 5: Rank-2 Truncation (k = 2 Latent Factors)",
          summary: "Compressing high-dimensional data into top 2 principal latent components.",
          math: "P = U_2 √Σ_2 ∈ ℝ^{10 × 2},   Q = V_2 √Σ_2 ∈ ℝ^{14 × 2}",
          calculation: "Low-rank approximation filters out random noise and forces collaborative filtering patterns to emerge across 2 dominant taste axes.",
          takeaway: "Users and movies now exist in the SAME 2D latent space, enabling direct geometric comparison via dot products.",
        };
      case "dot_product":
        const p1 = step.payload?.pRow?.[0]?.toFixed(3) ?? "0.000";
        const p2 = step.payload?.pRow?.[1]?.toFixed(3) ?? "0.000";
        const q1 = step.payload?.qRow?.[0]?.toFixed(3) ?? "0.000";
        const q2 = step.payload?.qRow?.[1]?.toFixed(3) ?? "0.000";
        const prod1 = step.payload?.terms?.[0]?.toFixed(3) ?? "0.000";
        const prod2 = step.payload?.terms?.[1]?.toFixed(3) ?? "0.000";
        const dot = step.payload?.runningSum?.toFixed(3) ?? "0.000";
        const bias = step.payload?.bias?.toFixed(2) ?? "0.00";
        const pred = step.payload?.prediction?.toFixed(2) ?? "0.00";
        const title = step.payload?.title ?? "Candidate";
        const isCold = step.payload?.coldFallback;

        return {
          title: `Step 6: Dot-Product Rating Prediction for ${title}`,
          summary: isCold 
            ? "Cold-start fallback: Item has no ratings, so item factor vector Q = [0, 0]."
            : `Multiplying target user factor row P_Alex by movie factor row Q_${title}.`,
          math: "r̂_{u,i} = μ + b_u + b_i + (P_u · Q_iᵀ) = Bias + (P₁·Q₁ + P₂·Q₂)",
          calculation: isCold
            ? `Factor product = 0.00. Predicted rating reverts strictly to baseline: ${bias} / 5.0 (flagged unrankable).`
            : `(${p1} × ${q1}) + (${p2} × ${q2}) = ${prod1} + ${prod2} = ${dot} (Latent Affinity) + ${bias} (Bias) = r̂ = ${pred} / 5.0`,
          takeaway: `The predicted rating ${pred} is written directly into Alex's row in the matrix grid!`,
        };
      case "rank":
        return {
          title: "Step 7: Final Top-5 Recommendation Generation",
          summary: "Sorting predicted candidate ratings and generating the final recommendations list.",
          math: "Top-5 = argmax_{i ∉ Rated} r̂(u, i)",
          calculation: "All unrated movies are ranked by predicted score. Chronopolis is excluded because it had zero collaborative ratings to learn factors from.",
          takeaway: "SVD delivers strong recommendations for movies with co-rating history, but is fundamentally blind to cold-start items.",
        };
      default:
        return {
          title: `Step: ${(step as { label?: string }).label ?? "Update"}`,
          summary: "Algorithm state update.",
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
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
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
        <div className="text-[11px] text-amber-300/90 font-semibold flex items-center gap-1.5">
          <span className="text-[10px] text-muted uppercase tracking-wider font-sans">Formula:</span>
          <span>{details.math}</span>
        </div>
        <div className="text-[11px] text-neutral-200">
          <span className="text-[10px] text-muted uppercase tracking-wider font-sans">Live Math: </span>
          <span className="text-emerald-400 font-semibold">{details.calculation}</span>
        </div>
      </div>

      {details.takeaway && (
        <div className="text-[11px] text-neutral-400 font-sans flex items-center gap-1.5 pt-0.5">
          <span className="text-accent font-bold tracking-wide uppercase text-[10px]">Intuition:</span>
          <span>{details.takeaway}</span>
        </div>
      )}
    </div>
  );
};
