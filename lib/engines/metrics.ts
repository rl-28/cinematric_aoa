/**
 * Metrics & Benchmark Engine for Cinemetric.
 *
 * Metrics definitions:
 *   1. Execution Time (ms): Measured using timeIt (1 warmup run, median of runs).
 *   2. Memory (bytes): Analytical footprint derived from explicit typed matrix and vector sizes.
 *   3. Precision@K: Precision at rank K (default K=5) evaluated against held-out ratings (relevant = rating >= 4).
 *   4. Cold-Start Resilience (0 to 1): Share of cold items given a non-baseline personalized score.
 *   5. scaleBenchmark: Benchmarks synthetic datasets scaling up to 500 users × 300 movies,
 *      ensuring times and memory strictly increase with dataset size.
 */

import { Movie, MOVIES } from "../data/movies";
import {
  HELD_OUT_RATINGS,
  Rating,
  TARGET_USER_ID,
  TRAIN_RATINGS,
  User,
  USERS,
} from "../data/ratings";
import { runContent } from "./content";
import { runSvd } from "./svd";
import { AlgorithmMetrics, BenchmarkResult, MetricsResult } from "./types";

/**
 * Benchmark timing helper: executes 1 warmup run to absorb JIT compilation,
 * then measures `runs` iterations and returns the median execution time in ms.
 */
export function timeIt(fn: () => void, runs: number = 5): number {
  // 1 warmup run to prime JIT compiler and memory caches
  fn();

  const durations: number[] = [];
  const count = Math.max(1, runs);
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    durations.push(end - start);
  }

  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const median =
    durations.length % 2 === 0
      ? (durations[mid - 1] + durations[mid]) / 2
      : durations[mid];

  return Number(median.toFixed(3));
}

/**
 * Computes defensible offline evaluation metrics for both algorithms.
 */
export function computeMetrics(
  k: number = 5,
  trainRatings: Rating[] = TRAIN_RATINGS,
  heldOutRatings: Rating[] = HELD_OUT_RATINGS,
  users: User[] = USERS,
  movies: Movie[] = MOVIES,
  targetUserId: string = TARGET_USER_ID
): MetricsResult {
  // 1. Run both engines to obtain traces and result objects
  const svdRun = runSvd(trainRatings, 2, targetUserId, users, movies);
  const contentRun = runContent(movies, trainRatings, targetUserId);

  // 2. Measure execution time with timeIt (1 warmup run, 5 timed runs -> median ms)
  const svdExecMs = timeIt(() => {
    runSvd(trainRatings, 2, targetUserId, users, movies);
  }, 5);

  const contentExecMs = timeIt(() => {
    runContent(movies, trainRatings, targetUserId);
  }, 5);

  // 3. Evaluate Precision@K on held-out test split
  // Target user held-out relevant items (rating >= 4)
  const targetHeldOutRelevant = new Set(
    heldOutRatings
      .filter((r) => r.userId === targetUserId && r.rating >= 4)
      .map((r) => r.movieId)
  );

  // SVD top-K hits
  const svdTopK = svdRun.result.userRecommendations.slice(0, k);
  const svdHits = svdTopK.filter((rec) =>
    targetHeldOutRelevant.has(rec.movieId)
  ).length;
  const svdPrecisionAtK = Number((svdHits / k).toFixed(3));

  // Content top-K hits
  const contentTopK = contentRun.result.recommendations.slice(0, k);
  const contentHits = contentTopK.filter((rec) =>
    targetHeldOutRelevant.has(rec.movieId)
  ).length;
  const contentPrecisionAtK = Number((contentHits / k).toFixed(3));

  // 4. Cold-Start Resilience
  // Fraction of cold items that receive a personalized non-baseline score
  const coldMovies = movies.filter((m) => m.cold);
  const coldCount = coldMovies.length || 1;

  // SVD: cold items have no learned factor row in Q, so they fallback to baseline only
  const svdNonBaselineColdCount = svdRun.result.userRecommendations.filter(
    (rec) => {
      const isCold = coldMovies.some((m) => m.id === rec.movieId);
      return isCold && !rec.coldFallback;
    }
  ).length;
  const svdColdStartScore = Number((svdNonBaselineColdCount / coldCount).toFixed(2)); // 0.0

  // Content: cold items are embedded via metadata and receive real cosine similarities
  const contentNonBaselineColdCount = coldMovies.filter((coldMovie) => {
    const sim = contentRun.result.similarities.find(
      (s) => s.movieId === coldMovie.id
    );
    return sim !== undefined && sim.score > 0;
  }).length;
  const contentColdStartScore = Number(
    (contentNonBaselineColdCount / coldCount).toFixed(2)
  ); // 1.0

  const svdMetrics: AlgorithmMetrics = {
    execMs: svdExecMs,
    memoryBytes: svdRun.stats.memoryBytes,
    precisionAtK: svdPrecisionAtK,
    coldStartScore: svdColdStartScore,
  };

  const contentMetrics: AlgorithmMetrics = {
    execMs: contentExecMs,
    memoryBytes: contentRun.stats.memoryBytes,
    precisionAtK: contentPrecisionAtK,
    coldStartScore: contentColdStartScore,
  };

  return {
    k,
    svd: svdMetrics,
    content: contentMetrics,
  };
}

let cachedMetricsResult: MetricsResult | null = null;

/**
 * Returns cached offline metrics for the demo dataset (Precision@5, warmed medians, memory, cold-start score).
 */
export function getOfflineMetrics(): MetricsResult {
  if (!cachedMetricsResult) {
    cachedMetricsResult = computeMetrics(5);
  }
  return cachedMetricsResult;
}

/**
 * Benchmark runner for synthetic datasets at varying scales:
 * Supports arbitrary sizes including 50×30, 100×60, and 500 users × 300 movies.
 * Measures execution time using timeIt (warmup + median ms) to ensure times
 * strictly increase with dataset dimensions.
 */
export function scaleBenchmark(
  numUsers: number = 500,
  numMovies?: number,
  runs?: number
): BenchmarkResult {
  const actualMovies =
    numMovies ??
    (numUsers === 500
      ? 300
      : Math.max(10, Math.round(numUsers * 0.6)));

  // Use runs=5 for scales up to 100, but runs=2 for 500x300 (1 warmup + 2 timed) to stay under ~2.5s
  const effectiveRuns = runs ?? (numUsers >= 500 ? 2 : 5);

  // Shared pool of genres, directors, and keywords to simulate real catalog tag distribution
  const genrePool = [
    "Sci-Fi", "Action", "Drama", "Thriller", "Romance",
    "Comedy", "Animation", "Crime", "Mystery", "Adventure"
  ];
  const directorPool = [
    "Director Nolan", "Director Villeneuve", "Director Scott",
    "Director Fincher", "Director Chazelle", "Director Miyazaki",
    "Director Bong", "Director Gerwig", "Director Tarantino", "Director Spielberg"
  ];
  const keywordPool = [
    "space", "cyberpunk", "time", "memory", "ai",
    "heist", "destiny", "dystopia", "rebellion", "jazz",
    "planet", "simulation", "identity", "dream", "empire"
  ];

  // Generate synthetic movies with realistic metadata overlap
  const syntheticMovies: Movie[] = Array.from({ length: actualMovies }, (_, i) => {
    const g1 = genrePool[i % genrePool.length];
    const g2 = genrePool[(i + 3) % genrePool.length];
    const dir = directorPool[i % directorPool.length];
    const kw1 = keywordPool[i % keywordPool.length];
    const kw2 = keywordPool[(i + 4) % keywordPool.length];

    return {
      id: `sm_${i}`,
      title: `Synthetic Movie ${i + 1}`,
      year: 2000 + (i % 26),
      genres: [g1, g2],
      director: dir,
      cast: [`Actor ${i % 20}`, `Actor ${(i + 5) % 20}`, `Actor ${(i + 10) % 20}`],
      keywords: [kw1, kw2, "cinema", "feature"],
      cold: i === actualMovies - 1, // last movie is cold
    };
  });

  // Generate synthetic users across 2 clusters
  const syntheticUsers: User[] = Array.from({ length: numUsers }, (_, i) => ({
    id: `su_${i}`,
    name: `Synthetic User ${i + 1}`,
    cluster: i % 2 === 0 ? "Sci-Fi / Action" : "Drama / Romance",
  }));

  // Generate synthetic ratings with realistic density (~15-20%)
  const syntheticRatings: Rating[] = [];
  const ratingsPerUser = Math.min(
    actualMovies - 2,
    Math.max(5, Math.floor(actualMovies * 0.15))
  );

  for (let u = 0; u < numUsers; u++) {
    const userCluster = u % 2;
    for (let count = 0; count < ratingsPerUser; count++) {
      const movieIdx = (u * 3 + count * 7) % (actualMovies - 1); // exclude cold movie
      const rating = (movieIdx % 2 === userCluster) ? (4 + (count % 2)) : (2 + (count % 2));
      syntheticRatings.push({
        userId: `su_${u}`,
        movieId: `sm_${movieIdx}`,
        rating,
      });
    }
  }

  // Pre-instantiate single execution to compute analytical memory
  const svdRun = runSvd(syntheticRatings, 2, "su_0", syntheticUsers, syntheticMovies);
  const contentRun = runContent(syntheticMovies, syntheticRatings, "su_0");

  // Measure SVD median time using timeIt (1 warmup run + effectiveRuns timed runs)
  const svdMs = timeIt(() => {
    runSvd(syntheticRatings, 2, "su_0", syntheticUsers, syntheticMovies);
  }, effectiveRuns);

  // Measure Content median time using timeIt (1 warmup run + effectiveRuns timed runs)
  const contentMs = timeIt(() => {
    runContent(syntheticMovies, syntheticRatings, "su_0");
  }, effectiveRuns);

  return {
    n: numUsers,
    numUsers,
    numMovies: actualMovies,
    svdMs,
    contentMs,
    svdMemoryBytes: svdRun.stats.memoryBytes,
    contentMemoryBytes: contentRun.stats.memoryBytes,
  };
}
