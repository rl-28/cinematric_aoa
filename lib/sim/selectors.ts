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
import { COLD_MOVIE_ID } from "../data/movies";
import { SimState } from "./store";

/**
 * Visible SVD steps respecting the coldStart toggle.
 * When coldStart is OFF:
 *   - Drops the m14 dot_product step
 *   - Strips m14 from rank recommendations and unrankable payloads
 */
export function visibleSvdSteps(state: SimState): SvdStep[] {
  if (state.coldStart) {
    return state.svdSteps;
  }

  const result: SvdStep[] = [];
  for (const s of state.svdSteps) {
    if (s.kind === "dot_product" && s.payload.movieId === COLD_MOVIE_ID) {
      continue;
    }
    if (s.kind === "rank") {
      result.push({
        ...s,
        payload: {
          ...s.payload,
          recommendations: s.payload.recommendations.filter(
            (r) => r.movieId !== COLD_MOVIE_ID
          ),
          unrankable: s.payload.unrankable
            ? s.payload.unrankable.filter((u) => u.itemId !== COLD_MOVIE_ID)
            : [],
        },
      });
    } else {
      result.push(s);
    }
  }
  return result;
}

/**
 * Visible Content-Based steps respecting the coldStart toggle.
 * When coldStart is OFF:
 *   - Drops the m14 compare step
 *   - Strips m14 from rank recommendations
 */
export function visibleCbSteps(state: SimState): ContentStep[] {
  if (state.coldStart) {
    return state.cbSteps;
  }

  const result: ContentStep[] = [];
  for (const s of state.cbSteps) {
    if (s.kind === "compare" && s.payload.candidateId === COLD_MOVIE_ID) {
      continue;
    }
    if (s.kind === "rank") {
      result.push({
        ...s,
        payload: {
          ...s.payload,
          recommendations: s.payload.recommendations.filter(
            (r) => r.movieId !== COLD_MOVIE_ID && !r.isCold
          ),
        },
      });
    } else {
      result.push(s);
    }
  }
  return result;
}

/**
 * Returns the total number of simulation ticks required to complete both traces.
 * Respects visible step counts when cold-start toggle is disabled.
 */
export function totalTicks(state: SimState): number {
  return Math.max(visibleSvdSteps(state).length, visibleCbSteps(state).length);
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
  const steps = visibleSvdSteps(state);
  if (steps.length === 0) return null;
  const idx = Math.min(state.tick, steps.length - 1);
  return steps[idx];
}

/**
 * Current step for the Content-Based visualizer.
 * Clamps to the last step once Content-Based completes.
 */
export function currentCbStep(state: SimState): ContentStep | null {
  const steps = visibleCbSteps(state);
  if (steps.length === 0) return null;
  const idx = Math.min(state.tick, steps.length - 1);
  return steps[idx];
}

/**
 * Whether the SVD visualizer has executed all its steps.
 */
export function isSvdDone(state: SimState): boolean {
  const steps = visibleSvdSteps(state);
  return steps.length > 0 && state.tick >= steps.length - 1;
}

/**
 * Whether the Content-Based visualizer has executed all its steps.
 */
export function isCbDone(state: SimState): boolean {
  const steps = visibleCbSteps(state);
  return steps.length > 0 && state.tick >= steps.length - 1;
}

/**
 * Cumulative execution time (ms) revealed up to the current simulation tick.
 * Display time is independent of compute time: ms is the actual measured
 * compute time accumulated progressively as each stage plays.
 */
export function revealedExecMs(state: SimState, algo: "svd" | "content" | "cb"): number {
  if (algo === "svd") {
    const steps = visibleSvdSteps(state);
    const count = Math.min(state.tick + 1, steps.length);
    const sum = steps.slice(0, count).reduce((acc, s) => acc + s.ms, 0);
    return Number(sum.toFixed(3));
  } else {
    const steps = visibleCbSteps(state);
    const count = Math.min(state.tick + 1, steps.length);
    const sum = steps.slice(0, count).reduce((acc, s) => acc + s.ms, 0);
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
  return step.payload.recommendations;
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
  const steps = visibleSvdSteps(state);
  if (steps.length === 0) return map;

  const currentIdx = Math.min(state.tick, steps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = steps[i];
    if (s.kind === "dot_product") {
      map.set(s.payload.movieId, {
        userIdx: s.payload.userIdx,
        movieId: s.payload.movieId,
        itemIdx: s.payload.itemIdx,
        prediction: s.payload.prediction,
        coldFallback: s.payload.coldFallback,
      });

      if (s.payload.cohortPredictions) {
        for (const cp of s.payload.cohortPredictions) {
          map.set(`${cp.userIdx}-${s.payload.movieId}`, {
            userIdx: cp.userIdx,
            movieId: s.payload.movieId,
            itemIdx: s.payload.itemIdx,
            prediction: cp.prediction,
            coldFallback: cp.coldFallback,
          });
        }
      }
    }
  }
  return map;
}

/**
 * Returns the raw matrix from the initial load step if available.
 */
export function rawMatrixAtTick(state: SimState): (number | null)[][] | null {
  const steps = visibleSvdSteps(state);
  if (steps.length > 0 && steps[0].kind === "load") {
    return steps[0].payload.rawMatrix;
  }
  return null;
}

/**
 * Returns the baseline parameters if revealed by or before the current tick.
 */
export function baselineAtTick(
  state: SimState
): { mu: number; bu: number[]; bi: number[] } | null {
  const steps = visibleSvdSteps(state);
  if (steps.length === 0) return null;
  const currentIdx = Math.min(state.tick, steps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = steps[i];
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
  const steps = visibleSvdSteps(state);
  if (steps.length === 0) return null;
  const currentIdx = Math.min(state.tick, steps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = steps[i];
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
  return Boolean(state.coldStart && movieId === COLD_MOVIE_ID);
}

/**
 * Information for candidates evaluated by Content-Based cosine similarity up to current tick.
 */
export interface ComparedCandidateInfo {
  candidateId: string;
  title: string;
  cosine: number;
  angleDeg: number;
  dot: number;
  normA: number;
  normB: number;
  isCold?: boolean;
}

/**
 * Returns a map of unrated candidates evaluated by Content-Based engine up to current tick.
 * Derived by scanning visibleCbSteps[0..currentTick].
 */
export function comparedCandidatesAtTick(
  state: SimState
): Map<string, ComparedCandidateInfo> {
  const map = new Map<string, ComparedCandidateInfo>();
  const steps = visibleCbSteps(state);
  if (steps.length === 0) return map;

  const currentIdx = Math.min(state.tick, steps.length - 1);
  for (let i = 0; i <= currentIdx; i++) {
    const s = steps[i];
    if (s.kind === "compare") {
      map.set(s.payload.candidateId, {
        candidateId: s.payload.candidateId,
        title: s.payload.title,
        cosine: s.payload.cosine,
        angleDeg: s.payload.angleDeg,
        dot: s.payload.dot,
        normA: s.payload.normA,
        normB: s.payload.normB,
        isCold: s.payload.isCold,
      });
    }
  }
  return map;
}

/**
 * Whether the Content-Based pipeline is done and waiting for the longer SVD pipeline to finish.
 * CB has 12 steps (ticks 0..11) while SVD has 14 steps (ticks 0..13) when coldStart is ON;
 * CB has 11 steps (ticks 0..10) while SVD has 13 steps (ticks 0..12) when coldStart is OFF.
 */
export function isCbFinishedWaiting(state: SimState): boolean {
  const cbTotal = visibleCbSteps(state).length;
  const svdTotal = visibleSvdSteps(state).length;
  return (
    cbTotal > 0 &&
    state.tick >= cbTotal - 1 &&
    svdTotal > cbTotal &&
    state.tick < svdTotal - 1
  );
}
