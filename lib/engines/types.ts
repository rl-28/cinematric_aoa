/**
 * Shared trace and execution types for recommendation engines.
 */

export interface Step<K extends string = string, P = unknown> {
  id: number;
  kind: K;
  label: string;
  ms: number;
  payload: P;
}

// ==========================================
// SVD Engine Types
// ==========================================
export type SvdStepKind =
  | "load"
  | "baseline"
  | "center"
  | "decompose"
  | "truncate"
  | "dot_product"
  | "rank";

export interface SvdDotProductPayload {
  userIdx: number;
  itemIdx: number;
  movieId: string;
  title: string;
  pRow: number[];
  qRow: number[];
  terms: number[];
  runningSum: number;
  bias: number;
  prediction: number;
  coldFallback?: boolean;
}

export interface SvdRecommendation {
  movieId: string;
  title: string;
  score: number;
  coldFallback?: boolean;
}

export interface SvdUnrankableItem {
  itemId: string;
  title: string;
  reason: string;
}

export interface SvdResult {
  mu: number;
  bu: number[];
  bi: number[];
  s: number[];
  P: number[][];
  Q: number[][];
  predictions: number[][];
  targetUserIndex: number;
  userRecommendations: SvdRecommendation[];
  unrankable: SvdUnrankableItem[];
}

export interface SvdStats {
  execMs: number;
  memoryBytes: number;
  userCount: number;
  itemCount: number;
  k: number;
}

export type SvdStep =
  | Step<"load", { rawMatrix: (number | null)[][]; users: string[]; movies: string[] }>
  | Step<"baseline", { mu: number; bu: number[]; bi: number[] }>
  | Step<"center", { residualMatrix: number[][] }>
  | Step<"decompose", { U: number[][]; s: number[]; V: number[][] }>
  | Step<"truncate", { k: number; Uk: number[][]; sk: number[]; Vk: number[][]; P: number[][]; Q: number[][] }>
  | Step<"dot_product", SvdDotProductPayload>
  | Step<"rank", { recommendations: SvdRecommendation[]; unrankable?: SvdUnrankableItem[] }>;

export interface SvdRunOutput {
  steps: SvdStep[];
  result: SvdResult;
  stats: SvdStats;
}

// ==========================================
// Content-Based Engine Types
// ==========================================
export type ContentStepKind =
  | "tokenize"
  | "tfidf"
  | "profile"
  | "compare"
  | "rank";

export interface MovieCoordinate2D {
  x: number;
  y: number;
  title: string;
  genres: string[];
  isCold?: boolean;
}

export interface ContentComparePayload {
  candidateId: string;
  title: string;
  dot: number;
  normA: number;
  normB: number;
  cosine: number;
  angleDeg: number;
  isCold?: boolean;
}

export interface ContentRecommendation {
  movieId: string;
  title: string;
  score: number;
  isCold?: boolean;
}

export interface ContentResult {
  vocabulary: string[];
  tfidfMatrix: number[][];
  userProfile: number[];
  profileCoordinate2D?: { x: number; y: number };
  coordinates2D: Record<string, MovieCoordinate2D>;
  similarities: Array<{ movieId: string; score: number; isCold?: boolean }>;
  recommendations: ContentRecommendation[];
}

export interface ContentStats {
  execMs: number;
  memoryBytes: number;
  docCount: number;
  vocabSize: number;
}

export type ContentStep =
  | Step<"tokenize", { tokensByMovie: Record<string, string[]> }>
  | Step<"tfidf", { vocabulary: string[]; matrixPreview: number[][] }>
  | Step<"profile", { ratedMovieIds: string[]; weights: number[]; userProfile: number[]; profileCoordinate2D?: { x: number; y: number } }>
  | Step<"compare", ContentComparePayload>
  | Step<"rank", { recommendations: ContentRecommendation[] }>;

export interface ContentRunOutput {
  steps: ContentStep[];
  result: ContentResult;
  stats: ContentStats;
}

// ==========================================
// Metrics & Benchmark Types
// ==========================================
export interface AlgorithmMetrics {
  execMs: number;
  memoryBytes: number;
  precisionAtK: number;
  coldStartScore: number;
}

export interface MetricsResult {
  k: number;
  svd: AlgorithmMetrics;
  content: AlgorithmMetrics;
}

export interface BenchmarkResult {
  n: number;
  numUsers: number;
  numMovies: number;
  svdMs: number;
  contentMs: number;
  svdMemoryBytes: number;
  contentMemoryBytes: number;
}
