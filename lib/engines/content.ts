/**
 * Content-Based Recommendation Engine.
 *
 * Pipeline:
 *   1. Tokenize movies using namespaced tokens (genre, director, cast, keywords).
 *   2. Compute TF-IDF vectors (manual implementation with L2 normalization).
 *   3. Build target user profile via rating-weighted average of items rated >= 4.
 *   4. For each unrated movie, compute vector dot product, norms, cosine similarity,
 *      and angle (degrees).
 *   5. Emit step-by-step trace including candidate comparison steps.
 *   6. Top-5 ranking (evaluates cold-start item normally via metadata).
 *   7. Compute 2D PCA projection via ml-matrix on TF-IDF matrix, normalized to [0, 1].
 */

import { Matrix, SingularValueDecomposition } from "ml-matrix";
import { Movie, MOVIES } from "../data/movies";
import { Rating, TARGET_USER_ID, TRAIN_RATINGS } from "../data/ratings";
import {
  ContentComparePayload,
  ContentRecommendation,
  ContentResult,
  ContentRunOutput,
  ContentStats,
  ContentStep,
  MovieCoordinate2D,
} from "./types";

export function runContent(
  movies: Movie[] = MOVIES,
  ratings: Rating[] = TRAIN_RATINGS,
  targetUserId: string = TARGET_USER_ID
): ContentRunOutput {
  const steps: ContentStep[] = [];
  let stepId = 1;
  const startTotal = performance.now();

  // ----------------------------------------------------
  // Step 1: Tokenize each movie
  // ----------------------------------------------------
  const t0 = performance.now();
  const tokensByMovie: Record<string, string[]> = {};
  const allTokensSet = new Set<string>();

  for (const m of movies) {
    const tokens: string[] = [];

    // Namespaced tokens prevent accidental collisions
    for (const g of m.genres) {
      const tok = `genre:${g.toLowerCase().trim().replace(/\s+/g, "_")}`;
      tokens.push(tok);
      allTokensSet.add(tok);
    }

    const dirTok = `dir:${m.director.toLowerCase().trim().replace(/\s+/g, "_")}`;
    tokens.push(dirTok);
    allTokensSet.add(dirTok);

    for (const actor of m.cast) {
      const actTok = `cast:${actor.toLowerCase().trim().replace(/\s+/g, "_")}`;
      tokens.push(actTok);
      allTokensSet.add(actTok);
    }

    for (const kw of m.keywords) {
      const kwTok = `kw:${kw.toLowerCase().trim().replace(/\s+/g, "_")}`;
      tokens.push(kwTok);
      allTokensSet.add(kwTok);
    }

    tokensByMovie[m.id] = tokens;
  }

  const vocabulary = Array.from(allTokensSet).sort();
  const vocabIndex = new Map(vocabulary.map((tok, idx) => [tok, idx]));
  const V = vocabulary.length;
  const N = movies.length;

  steps.push({
    id: stepId++,
    kind: "tokenize",
    label: `Extract Namespaced Tokens (${V} unique terms)`,
    ms: Math.max(0.01, performance.now() - t0),
    payload: { tokensByMovie },
  });

  // ----------------------------------------------------
  // Step 2: Compute TF-IDF Vectors + L2 Normalization
  // ----------------------------------------------------
  const t1 = performance.now();

  // Document frequency DF(t): number of movies containing term t
  const docFrequency = new Array(V).fill(0);
  for (const m of movies) {
    const uniqueTokensInMovie = new Set(tokensByMovie[m.id]);
    for (const tok of uniqueTokensInMovie) {
      const idx = vocabIndex.get(tok);
      if (idx !== undefined) {
        docFrequency[idx]++;
      }
    }
  }

  // Smooth IDF: ln((1 + N) / (1 + DF)) + 1
  const idf = docFrequency.map((df) => Math.log((1 + N) / (1 + df)) + 1);

  // Compute normalized TF-IDF for each movie
  const tfidfMatrix: number[][] = [];
  const movieVectorMap = new Map<string, number[]>();

  for (let mIdx = 0; mIdx < N; mIdx++) {
    const movie = movies[mIdx];
    const tokens = tokensByMovie[movie.id];
    const tf = new Array(V).fill(0);

    for (const tok of tokens) {
      const idx = vocabIndex.get(tok);
      if (idx !== undefined) {
        tf[idx]++;
      }
    }

    // Relative TF & unnormalized TF-IDF
    const rawVector = new Array(V).fill(0);
    const tokenCount = tokens.length || 1;
    let normSq = 0;

    for (let v = 0; v < V; v++) {
      const termFreq = tf[v] / tokenCount;
      const score = termFreq * idf[v];
      rawVector[v] = score;
      normSq += score * score;
    }

    // L2 Normalize: vector / ||vector||_2
    const norm = Math.sqrt(normSq) || 1;
    const l2Vector = rawVector.map((val) => Number((val / norm).toFixed(5)));

    tfidfMatrix.push(l2Vector);
    movieVectorMap.set(movie.id, l2Vector);
  }

  steps.push({
    id: stepId++,
    kind: "tfidf",
    label: `Compute L2-Normalized TF-IDF (${N}x${V})`,
    ms: Math.max(0.01, performance.now() - t1),
    payload: {
      vocabulary,
      matrixPreview: tfidfMatrix.slice(0, 4).map((row) => row.slice(0, 8)),
    },
  });

  // ----------------------------------------------------
  // Step 3: Compute Target User Profile (ratings >= 4)
  // ----------------------------------------------------
  const t2 = performance.now();
  const targetRatings = ratings.filter(
    (r) => r.userId === targetUserId && r.rating >= 4
  );

  const ratedMovieIds: string[] = [];
  const weights: number[] = [];
  const rawProfile = new Array(V).fill(0);

  for (const r of targetRatings) {
    const vec = movieVectorMap.get(r.movieId);
    if (!vec) continue;

    ratedMovieIds.push(r.movieId);
    weights.push(r.rating);

    for (let v = 0; v < V; v++) {
      rawProfile[v] += vec[v] * r.rating;
    }
  }

  // L2 Normalize user profile
  let profileNormSq = 0;
  for (let v = 0; v < V; v++) {
    profileNormSq += rawProfile[v] * rawProfile[v];
  }
  const profileNorm = Math.sqrt(profileNormSq) || 1;
  const userProfile = rawProfile.map((val) =>
    Number((val / profileNorm).toFixed(5))
  );

  steps.push({
    id: stepId++,
    kind: "profile",
    label: `Build User Taste Profile from ${ratedMovieIds.length} Liked Movies`,
    ms: Math.max(0.01, performance.now() - t2),
    payload: {
      ratedMovieIds,
      weights,
      userProfile,
    },
  });

  // ----------------------------------------------------
  // Step 4: Compare Unrated Movies (emit compare steps)
  // ----------------------------------------------------
  const allUserRatedIds = new Set(
    ratings.filter((r) => r.userId === targetUserId).map((r) => r.movieId)
  );

  const similarities: Array<{
    movieId: string;
    title: string;
    score: number;
    isCold?: boolean;
  }> = [];

  for (const movie of movies) {
    if (allUserRatedIds.has(movie.id)) {
      continue; // Skip movies the user already rated in train set
    }

    const tComp = performance.now();
    const movieVec = movieVectorMap.get(movie.id) ?? new Array(V).fill(0);

    // Both vectors are L2-normalized, so dot product = cosine similarity
    let dot = 0;
    let normASq = 0;
    let normBSq = 0;

    for (let v = 0; v < V; v++) {
      dot += userProfile[v] * movieVec[v];
      normASq += userProfile[v] * userProfile[v];
      normBSq += movieVec[v] * movieVec[v];
    }

    const normA = Math.sqrt(normASq) || 1;
    const normB = Math.sqrt(normBSq) || 1;
    const cosine = Math.min(1.0, Math.max(-1.0, dot / (normA * normB)));
    const angleRad = Math.acos(cosine);
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(2));

    const payload: ContentComparePayload = {
      candidateId: movie.id,
      title: movie.title,
      dot: Number(dot.toFixed(4)),
      normA: Number(normA.toFixed(4)),
      normB: Number(normB.toFixed(4)),
      cosine: Number(cosine.toFixed(4)),
      angleDeg,
      isCold: Boolean(movie.cold),
    };

    steps.push({
      id: stepId++,
      kind: "compare",
      label: `Compare Profile vs ${movie.title} (cos=${payload.cosine}, ${angleDeg}°)`,
      ms: Math.max(0.01, performance.now() - tComp),
      payload,
    });

    similarities.push({
      movieId: movie.id,
      title: movie.title,
      score: payload.cosine,
      isCold: Boolean(movie.cold),
    });
  }

  // ----------------------------------------------------
  // Step 5: Final Rank Step (Top 5)
  // ----------------------------------------------------
  const tRank = performance.now();
  similarities.sort((a, b) => b.score - a.score);
  const topRecommendations: ContentRecommendation[] = similarities
    .slice(0, 5)
    .map((s) => ({
      movieId: s.movieId,
      title: s.title,
      score: s.score,
      isCold: s.isCold,
    }));

  steps.push({
    id: stepId++,
    kind: "rank",
    label: "Rank Top 5 Content Recommendations",
    ms: Math.max(0.01, performance.now() - tRank),
    payload: {
      recommendations: topRecommendations,
    },
  });

  // ----------------------------------------------------
  // Step 6: 2D PCA Projection for Visualizer (via ml-matrix)
  // ----------------------------------------------------
  // Center TF-IDF matrix columns
  const tfidfMatrixObj = new Matrix(tfidfMatrix);
  const colMeans = tfidfMatrixObj.mean("column");
  const centeredData: number[][] = [];

  for (let r = 0; r < N; r++) {
    const row: number[] = [];
    for (let c = 0; c < V; c++) {
      row.push(tfidfMatrix[r][c] - colMeans[c]);
    }
    centeredData.push(row);
  }

  const centeredMat = new Matrix(centeredData);
  const pcaSvd = new SingularValueDecomposition(centeredMat, { autoTranspose: true });

  // Top 2 principal components: U_2 * Sigma_2
  const U_pca = pcaSvd.leftSingularVectors;
  const s_pca = pcaSvd.diagonal;

  const rawCoords: Array<{ id: string; x: number; y: number }> = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < N; i++) {
    const x = U_pca.get(i, 0) * (s_pca[0] || 1);
    const y = U_pca.get(i, 1) * (s_pca[1] || 1);
    rawCoords.push({ id: movies[i].id, x, y });

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Normalize coordinates to [0.08, 0.92] margin for pleasant SVG display
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const coordinates2D: Record<string, MovieCoordinate2D> = {};
  for (let i = 0; i < N; i++) {
    const m = movies[i];
    const raw = rawCoords[i];
    const normX = Number((0.08 + 0.84 * ((raw.x - minX) / rangeX)).toFixed(4));
    const normY = Number((0.08 + 0.84 * ((raw.y - minY) / rangeY)).toFixed(4));

    coordinates2D[m.id] = {
      x: normX,
      y: normY,
      title: m.title,
      genres: m.genres,
      isCold: Boolean(m.cold),
    };
  }

  const totalExecMs = performance.now() - startTotal;

  // Analytical memory (bytes)
  const vocabBytes = vocabulary.reduce((acc, str) => acc + str.length * 2, 0);
  const tfidfBytes = N * V * 8;
  const profileBytes = V * 8;
  const pcaBytes = N * 2 * 8;
  const memoryBytes = vocabBytes + tfidfBytes + profileBytes + pcaBytes;

  const stats: ContentStats = {
    execMs: Number(totalExecMs.toFixed(3)),
    memoryBytes,
    docCount: N,
    vocabSize: V,
  };

  const result: ContentResult = {
    vocabulary,
    tfidfMatrix,
    userProfile,
    coordinates2D,
    similarities: similarities.map((s) => ({
      movieId: s.movieId,
      score: s.score,
      isCold: s.isCold,
    })),
    recommendations: topRecommendations,
  };

  return { steps, result, stats };
}
