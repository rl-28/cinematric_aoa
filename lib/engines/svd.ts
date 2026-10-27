/**
 * SVD Collaborative Filtering Engine.
 *
 * Implements textbook SVD reconciled with biased latent factors:
 *   1. Computes global mean μ, user bias b_u, item bias b_i.
 *   2. Centers observed ratings: A_{u,i} = r_{u,i} - (μ + b_u + b_i) (0 if missing).
 *   3. Computes truncated SVD of residual matrix via ml-matrix: A ≈ U_k Σ_k V_k^T (k=2).
 *   4. Factorizes: P = U_k √Σ_k, Q = V_k √Σ_k.
 *   5. Predicts: r̂(u,i) = μ + b_u + b_i + P_u · Q_i^T (clamped to [1.0, 5.0]).
 *   6. Handles cold-start items with zero ratings via baseline fallback (coldFallback: true).
 *   7. Emits step-by-step trace for simulation replay.
 */

import { Matrix, SingularValueDecomposition } from "ml-matrix";
import { Movie, MOVIES } from "../data/movies";
import { Rating, TARGET_USER_ID, TRAIN_RATINGS, User, USERS } from "../data/ratings";
import {
  SvdDotProductPayload,
  SvdRecommendation,
  SvdResult,
  SvdRunOutput,
  SvdStats,
  SvdStep,
} from "./types";

export function runSvd(
  ratings: Rating[] = TRAIN_RATINGS,
  k: number = 2,
  targetUserId: string = TARGET_USER_ID,
  users: User[] = USERS,
  movies: Movie[] = MOVIES
): SvdRunOutput {
  const steps: SvdStep[] = [];
  let stepId = 1;
  const startTotal = performance.now();

  const userMap = new Map(users.map((u, i) => [u.id, i]));
  // Catalog movies that have ratings (exclude cold-start movie with 0 ratings from matrix)
  const catalogMovies = movies.filter((m) => !m.cold);
  const movieMap = new Map(catalogMovies.map((m, i) => [m.id, i]));

  const numUsers = users.length;
  const numItems = catalogMovies.length;

  // ----------------------------------------------------
  // Step 1: Load raw rating matrix
  // ----------------------------------------------------
  const t0 = performance.now();
  const rawMatrix: (number | null)[][] = Array.from({ length: numUsers }, () =>
    Array.from({ length: numItems }, () => null)
  );

  for (const r of ratings) {
    const uIdx = userMap.get(r.userId);
    const mIdx = movieMap.get(r.movieId);
    if (uIdx !== undefined && mIdx !== undefined) {
      rawMatrix[uIdx][mIdx] = r.rating;
    }
  }

  steps.push({
    id: stepId++,
    kind: "load",
    label: "Load Raw User-Item Matrix",
    ms: Math.max(0.01, performance.now() - t0),
    payload: {
      rawMatrix,
      users: users.map((u) => u.name),
      movies: catalogMovies.map((m) => m.title),
    },
  });

  // ----------------------------------------------------
  // Step 2: Compute Baseline (Global mean μ, user bias b_u, item bias b_i)
  // ----------------------------------------------------
  const t1 = performance.now();
  let totalRatingSum = 0;
  let totalRatingCount = 0;

  for (let u = 0; u < numUsers; u++) {
    for (let i = 0; i < numItems; i++) {
      const val = rawMatrix[u][i];
      if (val !== null) {
        totalRatingSum += val;
        totalRatingCount++;
      }
    }
  }
  const mu = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 3.0;

  // User bias b_u
  const bu: number[] = new Array(numUsers).fill(0);
  for (let u = 0; u < numUsers; u++) {
    let diffSum = 0;
    let count = 0;
    for (let i = 0; i < numItems; i++) {
      const val = rawMatrix[u][i];
      if (val !== null) {
        diffSum += val - mu;
        count++;
      }
    }
    bu[u] = count > 0 ? diffSum / count : 0;
  }

  // Item bias b_i
  const bi: number[] = new Array(numItems).fill(0);
  for (let i = 0; i < numItems; i++) {
    let diffSum = 0;
    let count = 0;
    for (let u = 0; u < numUsers; u++) {
      const val = rawMatrix[u][i];
      if (val !== null) {
        diffSum += val - mu - bu[u];
        count++;
      }
    }
    bi[i] = count > 0 ? diffSum / count : 0;
  }

  steps.push({
    id: stepId++,
    kind: "baseline",
    label: "Compute Baseline Mean & Biases",
    ms: Math.max(0.01, performance.now() - t1),
    payload: { mu, bu, bi },
  });

  // ----------------------------------------------------
  // Step 3: Compute Centered Residual Matrix
  // ----------------------------------------------------
  const t2 = performance.now();
  const residualMatrix: number[][] = Array.from({ length: numUsers }, () =>
    new Array(numItems).fill(0)
  );

  for (let u = 0; u < numUsers; u++) {
    for (let i = 0; i < numItems; i++) {
      const val = rawMatrix[u][i];
      if (val !== null) {
        residualMatrix[u][i] = Number((val - (mu + bu[u] + bi[i])).toFixed(4));
      } else {
        residualMatrix[u][i] = 0; // missing centered at zero
      }
    }
  }

  steps.push({
    id: stepId++,
    kind: "center",
    label: "Subtract Baseline (Residual Matrix)",
    ms: Math.max(0.01, performance.now() - t2),
    payload: { residualMatrix },
  });

  // ----------------------------------------------------
  // Step 4: Decompose via Truncated SVD (ml-matrix)
  // ----------------------------------------------------
  const t3 = performance.now();
  const matrixA = new Matrix(residualMatrix);
  const svd = new SingularValueDecomposition(matrixA, { autoTranspose: true });

  const U_mat = svd.leftSingularVectors;
  const V_mat = svd.rightSingularVectors;
  const s_diag = svd.diagonal; // array of singular values

  const U_all: number[][] = U_mat.to2DArray();
  const V_all: number[][] = V_mat.to2DArray();

  steps.push({
    id: stepId++,
    kind: "decompose",
    label: "SVD Decomposition (U, Σ, V)",
    ms: Math.max(0.01, performance.now() - t3),
    payload: {
      U: U_all,
      s: s_diag,
      V: V_all,
    },
  });

  // ----------------------------------------------------
  // Step 5: Truncate to Rank k=2 and Form P, Q
  // ----------------------------------------------------
  const t4 = performance.now();
  const actualK = Math.min(k, s_diag.length, numUsers, numItems);
  const sk = s_diag.slice(0, actualK);

  const Uk: number[][] = Array.from({ length: numUsers }, (_, u) =>
    Array.from({ length: actualK }, (_, f) => U_mat.get(u, f))
  );

  const Vk: number[][] = Array.from({ length: numItems }, (_, i) =>
    Array.from({ length: actualK }, (_, f) => V_mat.get(i, f))
  );

  // Latent user factors P = U_k * sqrt(Sigma_k)
  // Latent item factors Q = V_k * sqrt(Sigma_k)
  const sqrtS = sk.map((val) => Math.sqrt(Math.max(0, val)));

  const P: number[][] = Uk.map((row) =>
    row.map((val, f) => Number((val * sqrtS[f]).toFixed(4)))
  );

  const Q: number[][] = Vk.map((row) =>
    row.map((val, f) => Number((val * sqrtS[f]).toFixed(4)))
  );

  steps.push({
    id: stepId++,
    kind: "truncate",
    label: `Truncate to Latent Rank k=${actualK}`,
    ms: Math.max(0.01, performance.now() - t4),
    payload: {
      k: actualK,
      Uk,
      sk,
      Vk,
      P,
      Q,
    },
  });

  // ----------------------------------------------------
  // Full Matrix Prediction
  // r̂(u,i) = μ + b_u + b_i + P_u · Q_i^T
  // ----------------------------------------------------
  const predictions: number[][] = Array.from({ length: numUsers }, () =>
    new Array(numItems).fill(0)
  );

  for (let u = 0; u < numUsers; u++) {
    for (let i = 0; i < numItems; i++) {
      let dot = 0;
      for (let f = 0; f < actualK; f++) {
        dot += P[u][f] * Q[i][f];
      }
      const rawPred = mu + bu[u] + bi[i] + dot;
      predictions[u][i] = Math.min(5.0, Math.max(1.0, Number(rawPred.toFixed(3))));
    }
  }

  // ----------------------------------------------------
  // Step 6: Emit dot_product steps for TARGET_USER unrated items
  // ----------------------------------------------------
  const targetUserIdx = userMap.get(targetUserId) ?? 0;
  const targetUserRatedMovieIds = new Set(
    ratings.filter((r) => r.userId === targetUserId).map((r) => r.movieId)
  );

  const candidateRecommendations: SvdRecommendation[] = [];

  // Evaluate all catalog movies + cold-start movies
  for (let mIdx = 0; mIdx < movies.length; mIdx++) {
    const movie = movies[mIdx];
    if (targetUserRatedMovieIds.has(movie.id)) {
      continue; // Skip movies the target user has already rated in train set
    }

    const tDot = performance.now();

    // Compute cohort predictions for the first 3 users (Alex, Jordan, Taylor)
    const simulatedCount = Math.min(3, users.length);
    const cohortPredictions = [];

    if (movie.cold) {
      // Cold-start movie: zero ratings, no row in Q
      // Fallback: baseline prediction = μ + b_u (+ 0 item bias)
      const baselinePred = Math.min(5.0, Math.max(1.0, Number((mu + bu[targetUserIdx]).toFixed(3))));

      for (let u = 0; u < simulatedCount; u++) {
        const uBaseline = Number((mu + bu[u]).toFixed(3));
        cohortPredictions.push({
          userIdx: u,
          userName: users[u].name.split(" ")[0],
          prediction: Math.min(5.0, Math.max(1.0, uBaseline)),
          bias: uBaseline,
          runningSum: 0,
          coldFallback: true,
        });
      }

      const payload: SvdDotProductPayload = {
        userIdx: targetUserIdx,
        itemIdx: -1,
        movieId: movie.id,
        title: movie.title,
        pRow: P[targetUserIdx],
        qRow: new Array(actualK).fill(0),
        terms: new Array(actualK).fill(0),
        runningSum: 0,
        bias: Number((mu + bu[targetUserIdx]).toFixed(3)),
        prediction: baselinePred,
        coldFallback: true,
        cohortPredictions,
      };

      steps.push({
        id: stepId++,
        kind: "dot_product",
        label: `Evaluate Unrated: ${movie.title} (Cold Fallback)`,
        ms: Math.max(0.01, performance.now() - tDot),
        payload,
      });

      candidateRecommendations.push({
        movieId: movie.id,
        title: movie.title,
        score: baselinePred,
        coldFallback: true,
      });
    } else {
      // Regular catalog movie with learned latent factor row in Q
      const catalogIdx = movieMap.get(movie.id);
      if (catalogIdx === undefined) continue;

      const pRow = P[targetUserIdx];
      const qRow = Q[catalogIdx];
      const terms: number[] = [];
      let runningSum = 0;

      for (let f = 0; f < actualK; f++) {
        const term = pRow[f] * qRow[f];
        terms.push(Number(term.toFixed(4)));
        runningSum += term;
      }

      const bias = mu + bu[targetUserIdx] + bi[catalogIdx];
      const pred = Math.min(5.0, Math.max(1.0, Number((bias + runningSum).toFixed(3))));

      for (let u = 0; u < simulatedCount; u++) {
        let uDot = 0;
        for (let f = 0; f < actualK; f++) {
          uDot += P[u][f] * qRow[f];
        }
        const uBias = mu + bu[u] + bi[catalogIdx];
        const uPred = Math.min(5.0, Math.max(1.0, Number((uBias + uDot).toFixed(3))));
        cohortPredictions.push({
          userIdx: u,
          userName: users[u].name.split(" ")[0],
          prediction: uPred,
          bias: Number(uBias.toFixed(3)),
          runningSum: Number(uDot.toFixed(4)),
          coldFallback: false,
        });
      }

      const payload: SvdDotProductPayload = {
        userIdx: targetUserIdx,
        itemIdx: catalogIdx,
        movieId: movie.id,
        title: movie.title,
        pRow,
        qRow,
        terms,
        runningSum: Number(runningSum.toFixed(4)),
        bias: Number(bias.toFixed(3)),
        prediction: pred,
        coldFallback: false,
        cohortPredictions,
      };

      steps.push({
        id: stepId++,
        kind: "dot_product",
        label: `Evaluate Unrated: ${movie.title}`,
        ms: Math.max(0.01, performance.now() - tDot),
        payload,
      });

      candidateRecommendations.push({
        movieId: movie.id,
        title: movie.title,
        score: pred,
        coldFallback: false,
      });
    }
  }

  // ----------------------------------------------------
  // Step 7: Final Rank Step (Top 5)
  // Items with coldFallback must NOT appear in the top-5 rank step.
  // Put them in rank payload as unrankable: [{ itemId, reason }] instead.
  // ----------------------------------------------------
  const tRank = performance.now();
  const rankableCandidates: SvdRecommendation[] = [];
  const unrankable: Array<{ itemId: string; title: string; reason: string }> = [];

  for (const candidate of candidateRecommendations) {
    if (candidate.coldFallback) {
      unrankable.push({
        itemId: candidate.movieId,
        title: candidate.title,
        reason: "Zero ratings in training set; item latent factor vector Q is undefined (fallback to baseline only).",
      });
    } else {
      rankableCandidates.push(candidate);
    }
  }

  rankableCandidates.sort((a, b) => b.score - a.score);
  const topRecommendations = rankableCandidates.slice(0, 5);

  steps.push({
    id: stepId++,
    kind: "rank",
    label: "Rank Top 5 Recommendations",
    ms: Math.max(0.01, performance.now() - tRank),
    payload: {
      recommendations: topRecommendations,
      unrankable,
    },
  });

  const totalExecMs = performance.now() - startTotal;

  // ----------------------------------------------------
  // Analytical Memory Calculation (in bytes)
  // Float64 (8 bytes per entry)
  // ----------------------------------------------------
  const rawBytes = numUsers * numItems * 8;
  const residualBytes = numUsers * numItems * 8;
  const biasBytes = (1 + numUsers + numItems) * 8;
  const uBytes = numUsers * numItems * 8;
  const vBytes = numItems * numItems * 8;
  const sBytes = numItems * 8;
  const pBytes = numUsers * actualK * 8;
  const qBytes = numItems * actualK * 8;
  const predBytes = numUsers * numItems * 8;

  const memoryBytes =
    rawBytes +
    residualBytes +
    biasBytes +
    uBytes +
    vBytes +
    sBytes +
    pBytes +
    qBytes +
    predBytes;

  const stats: SvdStats = {
    execMs: Number(totalExecMs.toFixed(3)),
    memoryBytes,
    userCount: numUsers,
    itemCount: numItems,
    k: actualK,
  };

  const result: SvdResult = {
    mu: Number(mu.toFixed(3)),
    bu: bu.map((b) => Number(b.toFixed(3))),
    bi: bi.map((b) => Number(b.toFixed(3))),
    s: s_diag.map((val) => Number(val.toFixed(3))),
    P,
    Q,
    predictions,
    targetUserIndex: targetUserIdx,
    userRecommendations: topRecommendations,
    unrankable,
  };

  return { steps, result, stats };
}
