/**
 * Simulation Replay Store (Zustand).
 *
 * Provides a shared simulation clock and unified state machine for:
 *   - Step-by-step trace replay of SVD and Content-Based engines.
 *   - Playback controls: play, pause, toggle, reset, stepForward, stepBack, seek, setSpeed.
 *   - Cold-start toggle (highlight/hide Chronopolis m14 via selectors without re-running engines).
 *   - Asynchronous benchmark runner with scale caching (demo, 100, 500x300).
 */

import { create } from "zustand";
import { runContent } from "../engines/content";
import { scaleBenchmark } from "../engines/metrics";
import { runSvd } from "../engines/svd";
import {
  BenchmarkResult,
  ContentResult,
  ContentRunOutput,
  ContentStats,
  ContentStep,
  SvdResult,
  SvdRunOutput,
  SvdStats,
  SvdStep,
} from "../engines/types";
import { totalTicks } from "./selectors";

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
export type DatasetScale = "demo" | "100" | "500x300";

export interface BenchmarkState {
  status: "idle" | "running" | "done";
  result: BenchmarkResult | null;
  cache: Record<string, BenchmarkResult>;
}

export interface SimState {
  // Traces & Engine outputs
  svdSteps: SvdStep[];
  cbSteps: ContentStep[];
  svdResult: SvdResult | null;
  cbResult: ContentResult | null;
  svdStats: SvdStats | null;
  cbStats: ContentStats | null;

  // Shared clock & playback controls
  tick: number;
  playing: boolean;
  speed: PlaybackSpeed;

  // Visualizer modifiers
  coldStart: boolean;
  datasetScale: DatasetScale;
  benchmark: BenchmarkState;

  // Actions
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  seek: (tick: number) => void;
  setColdStart: (active: boolean) => void;
  setDatasetScale: (scale: DatasetScale) => Promise<void>;
  loadRuns: () => void;
}

// Initial demo run to populate initial store state (1 warmup run discarded, then measured run stored)
function getInitialRuns(): { svd: SvdRunOutput; content: ContentRunOutput } {
  // Warmup run to prime V8 JIT compiler
  runSvd();
  runContent();

  // Warmed run stored for replay
  const svd = runSvd();
  const content = runContent();
  return { svd, content };
}

const initialRuns = getInitialRuns();

export const useSimStore = create<SimState>((set, get) => ({
  svdSteps: initialRuns.svd.steps,
  cbSteps: initialRuns.content.steps,
  svdResult: initialRuns.svd.result,
  cbResult: initialRuns.content.result,
  svdStats: initialRuns.svd.stats,
  cbStats: initialRuns.content.stats,

  tick: 0,
  playing: false,
  speed: 1,

  coldStart: true,
  datasetScale: "demo",
  benchmark: {
    status: "idle",
    result: {
      n: 14,
      numUsers: 10,
      numMovies: 14,
      svdMs: initialRuns.svd.stats.execMs,
      contentMs: initialRuns.content.stats.execMs,
      svdMemoryBytes: initialRuns.svd.stats.memoryBytes,
      contentMemoryBytes: initialRuns.content.stats.memoryBytes,
    },
    cache: {
      demo: {
        n: 14,
        numUsers: 10,
        numMovies: 14,
        svdMs: initialRuns.svd.stats.execMs,
        contentMs: initialRuns.content.stats.execMs,
        svdMemoryBytes: initialRuns.svd.stats.memoryBytes,
        contentMemoryBytes: initialRuns.content.stats.memoryBytes,
      },
    },
  },

  play: () => {
    const state = get();
    const total = totalTicks(state);
    // If already at end, restart from tick 0
    if (state.tick >= total - 1) {
      set({ tick: 0, playing: true });
    } else {
      set({ playing: true });
    }
  },

  pause: () => {
    set({ playing: false });
  },

  toggle: () => {
    const { playing, play, pause } = get();
    if (playing) {
      pause();
    } else {
      play();
    }
  },

  reset: () => {
    set({ tick: 0, playing: false });
  },

  stepForward: () => {
    const state = get();
    const total = totalTicks(state);
    if (state.tick < total - 1) {
      const nextTick = state.tick + 1;
      const isEnd = nextTick >= total - 1;
      set({
        tick: nextTick,
        // Auto-pause upon reaching final tick
        playing: isEnd ? false : state.playing,
      });
    } else {
      set({ playing: false });
    }
  },

  stepBack: () => {
    const { tick } = get();
    if (tick > 0) {
      set({ tick: tick - 1, playing: false });
    }
  },

  setSpeed: (speed: PlaybackSpeed) => {
    set({ speed });
  },

  seek: (targetTick: number) => {
    const state = get();
    const total = totalTicks(state);
    const clamped = Math.max(0, Math.min(total - 1, targetTick));
    set({
      tick: clamped,
      playing: clamped >= total - 1 ? false : state.playing,
    });
  },

  setColdStart: (active: boolean) => {
    const currentState = get();
    const nextState = { ...currentState, coldStart: active };
    const maxTick = Math.max(0, totalTicks(nextState) - 1);
    set({
      coldStart: active,
      tick: Math.min(currentState.tick, maxTick),
      playing: currentState.tick >= maxTick ? false : currentState.playing,
    });
  },

  setDatasetScale: async (scale: DatasetScale) => {
    const { datasetScale, benchmark } = get();
    if (scale === datasetScale && benchmark.result) return;

    // Fast-path: Return cached benchmark immediately if available
    if (benchmark.cache[scale]) {
      set({
        datasetScale: scale,
        benchmark: {
          status: "done",
          result: benchmark.cache[scale],
          cache: benchmark.cache,
        },
      });
      return;
    }

    // Set running state first so UI can show spinner/skeleton
    set({
      datasetScale: scale,
      benchmark: {
        status: "running",
        result: benchmark.result,
        cache: benchmark.cache,
      },
    });

    // Yield to the event loop so the "running" state renders before heavy compute
    await new Promise((resolve) => setTimeout(resolve, 0));

    let result: BenchmarkResult;
    if (scale === "100") {
      result = scaleBenchmark(100, 60);
    } else if (scale === "500x300") {
      result = scaleBenchmark(500, 300);
    } else {
      result = benchmark.cache["demo"];
    }

    set((state) => ({
      benchmark: {
        status: "done",
        result,
        cache: {
          ...state.benchmark.cache,
          [scale]: result,
        },
      },
    }));
  },

  loadRuns: () => {
    const { svd, content } = getInitialRuns();
    const currentTick = get().tick;

    set({
      svdSteps: svd.steps,
      cbSteps: content.steps,
      svdResult: svd.result,
      cbResult: content.result,
      svdStats: svd.stats,
      cbStats: content.stats,
    });

    const total = totalTicks(get());
    set({
      tick: Math.min(currentTick, Math.max(0, total - 1)),
    });
  },
}));
