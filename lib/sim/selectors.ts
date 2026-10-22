/**
 * Derived selectors for Cinemetric simulation state.
 * Pure functions decoupling rendering and filtering from store actions.
 */

import {
  ContentRecommendation,
  ContentStep,
  SvdUnrankableItem,
  SvdStep,
} from "../engines/types";
import { SimState } from "./store";

/**
 * Returns the total number of simulation ticks required to complete both traces.
 */
export function totalTicks(state: SimState): number {
  return Math.max(state.svdSteps.length, state.cbSteps.length);
}

/**
 * Normalised progress [0.0, 1.0] across all ticks.
 */
export function progress(state: SimState): number {
  const total = totalTicks(state);
  if (total <= 1) return 1.0;
  return Number((Math.min(state.tick, total - 1) / (total - 1)).toFixed(3));
}

/**
 * Current step for the SVD collaborative filtering visualizer.
 * Clamps to the last step once SVD completes.
 */
export function currentSvdStep(state: SimState): SvdStep | null {
  if (state.svdSteps.length === 0) return null;
  const idx = Math.min(state.tick, state.svdSteps.length - 1);
  return state.svdSteps[idx];
}

/**
 * Current step for the Content-Based visualizer.
 * Clamps to the last step once Content-Based completes.
 */
export function currentCbStep(state: SimState): ContentStep | null {
  if (state.cbSteps.length === 0) return null;
  const idx = Math.min(state.tick, state.cbSteps.length - 1);
  return state.cbSteps[idx];
}

/**
 * Whether the SVD visualizer has executed all its steps.
 */
export function isSvdDone(state: SimState): boolean {
  return state.svdSteps.length > 0 && state.tick >= state.svdSteps.length - 1;
}

/**
 * Whether the Content-Based visualizer has executed all its steps.
 */
export function isCbDone(state: SimState): boolean {
  return state.cbSteps.length > 0 && state.tick >= state.cbSteps.length - 1;
}

/**
 * Cumulative execution time (ms) revealed up to the current simulation tick.
 * Display time is independent of compute time: ms is the actual measured
 * compute time accumulated progressively as each stage plays.
 */
export function revealedExecMs(state: SimState, algo: "svd" | "content"): number {
  if (algo === "svd") {
    const count = Math.min(state.tick + 1, state.svdSteps.length);
    const sum = state.svdSteps.slice(0, count).reduce((acc, s) => acc + s.ms, 0);
    return Number(sum.toFixed(3));
  } else {
    const count = Math.min(state.tick + 1, state.cbSteps.length);
    const sum = state.cbSteps.slice(0, count).reduce((acc, s) => acc + s.ms, 0);
    return Number(sum.toFixed(3));
  }
}

/**
 * SVD items that cannot be ranked.
 * Revealed ONLY when SVD reaches its final 'rank' step, making the "cannot rank Chronopolis"
 * moment a synchronized highlight of the replay.
 */
export function unrankableAtTick(state: SimState): SvdUnrankableItem[] {
  const step = currentSvdStep(state);
  if (step && step.kind === "rank" && step.payload.unrankable) {
    return step.payload.unrankable;
  }
  return [];
}

/**
 * Filtered Content recommendations based on the coldStart toggle:
 *   - coldStart ON: Chronopolis (m14) is included and highlighted.
 *   - coldStart OFF: Chronopolis (m14) is hidden from the content rank list.
 * Filtered dynamically via this selector without re-running any engine.
 */
export function revealedContentRecommendations(
  state: SimState
): ContentRecommendation[] {
  const step = currentCbStep(state);
  if (!step || step.kind !== "rank") return [];

  const allRecs = step.payload.recommendations;
  if (!state.coldStart) {
    // Hide cold items when cold-start toggle is disabled
    return allRecs.filter((rec) => !rec.isCold && rec.movieId !== "m14");
  }
  return allRecs;
}

/**
 * Returns a map of all predicted cells evaluated by SVD up to the current tick.
 * Purely derived by scanning svdSteps[0..currentTick].
 */
export interface PredictedCellInfo {
  movieId: string;
  itemIdx: number;
  prediction: number;
  coldFallback?: boolean;
}

export function predictedCellsAtTick(state: SimState): Map<string, PredictedCellInfo> {
  const map = new Map<string, PredictedCellInfo>();
  if (state.svdSteps.length === 0) return map;

  const currentIdx = Math.min(state.tick, state.svdSteps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = state.svdSteps[i];
    if (s.kind === "dot_product") {
      map.set(s.payload.movieId, {
        movieId: s.payload.movieId,
        itemIdx: s.payload.itemIdx,
        prediction: s.payload.prediction,
        coldFallback: s.payload.coldFallback,
      });
    }
  }
  return map;
}

/**
 * Returns the raw matrix from the initial load step if available.
 */
export function rawMatrixAtTick(state: SimState): (number | null)[][] | null {
  if (state.svdSteps.length > 0 && state.svdSteps[0].kind === "load") {
    return state.svdSteps[0].payload.rawMatrix;
  }
  return null;
}

/**
 * Returns the baseline parameters if revealed by or before the current tick.
 */
export function baselineAtTick(
  state: SimState
): { mu: number; bu: number[]; bi: number[] } | null {
  if (state.svdSteps.length === 0) return null;
  const currentIdx = Math.min(state.tick, state.svdSteps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = state.svdSteps[i];
    if (s.kind === "baseline") {
      return s.payload;
    }
  }
  return null;
}

/**
 * Returns truncated latent factor matrices P, Q, and sk if revealed by or before the current tick.
 */
export function latentFactorsAtTick(
  state: SimState
): { P: number[][]; Q: number[][]; sk: number[] } | null {
  if (state.svdSteps.length === 0) return null;
  const currentIdx = Math.min(state.tick, state.svdSteps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = state.svdSteps[i];
    if (s.kind === "truncate") {
      return { P: s.payload.P, Q: s.payload.Q, sk: s.payload.sk };
    }
  }
  return null;
}

/**
 * Returns true if an item should be highlighted in visualizers
 * (e.g. cold-start movie Chronopolis m14 when cold-start mode is active).
 */
export function isItemHighlighted(state: SimState, movieId: string): boolean {
  return Boolean(state.coldStart && movieId === "m14");
}
