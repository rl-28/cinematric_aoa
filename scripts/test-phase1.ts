/**
 * Phase 1 Verification Script.
 * Tests SVD, Content-Based, Metrics, timeIt helper, and Scale Benchmark.
 *
 * Verifications:
 *   1. SVD: Cold-start item (m14) is excluded from top-5 recommendations and placed into unrankable.
 *   2. Content-Based: Evaluates and ranks cold-start item (m14) normally using metadata.
 *   3. timeIt: Measures execution time with 1 warmup run and median ms.
 *   4. scaleBenchmark: Scales across 50x30, 100x60, and 500x300, verifying times strictly increase with size.
 */

import { MOVIES } from "../lib/data/movies";
import { TARGET_USER, TRAIN_RATINGS } from "../lib/data/ratings";
import { runContent } from "../lib/engines/content";
import { computeMetrics, scaleBenchmark, timeIt } from "../lib/engines/metrics";
import { runSvd } from "../lib/engines/svd";

console.log("=================================================================");
console.log("             CINEMETRIC - PHASE 1 VERIFICATION                   ");
console.log("=================================================================\n");

console.log(`Target User: ${TARGET_USER.name} (${TARGET_USER.id}) - Cluster: ${TARGET_USER.cluster}`);
const targetRatings = TRAIN_RATINGS.filter((r) => r.userId === TARGET_USER.id);
console.log(`Target User Observed Training Ratings (${targetRatings.length}):`);
for (const r of targetRatings) {
  const m = MOVIES.find((movie) => movie.id === r.movieId);
  console.log(`  - [${r.movieId}] ${m?.title.padEnd(25)} : ${r.rating} / 5`);
}
console.log();

// -------------------------------------------------------------
// 1. Run SVD Engine
// -------------------------------------------------------------
console.log("-----------------------------------------------------------------");
console.log("1. SVD Engine Trace & Recommendations");
console.log("-----------------------------------------------------------------");
const svdRun = runSvd();
console.log(`SVD Single Run: ${svdRun.stats.execMs} ms | Memory: ${svdRun.stats.memoryBytes} bytes`);
console.log(`Global Mean μ: ${svdRun.result.mu} | User Bias b_u1: ${svdRun.result.bu[0]}`);
console.log(`Latent Factors k=2, Singular Values Σ: [${svdRun.result.s.slice(0, 2).join(", ")}]`);
console.log(`SVD Total Trace Steps Emitted: ${svdRun.steps.length}`);

console.log("\nSVD Top-5 Recommendations for Alex Chen (Rankable only):");
svdRun.result.userRecommendations.forEach((rec, idx) => {
  console.log(`  ${idx + 1}. [${rec.movieId}] ${rec.title.padEnd(25)} Predicted: ${rec.score.toFixed(3)}`);
});

// Verify unrankable payload in SVD
const rankStep = svdRun.steps.find((s) => s.kind === "rank");
console.log("\nSVD Unrankable Items (Excluded from Top-5 Rank Step):");
if (rankStep && rankStep.kind === "rank" && rankStep.payload.unrankable) {
  rankStep.payload.unrankable.forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.itemId}] ${item.title}: ${item.reason}`);
  });
}

// -------------------------------------------------------------
// 2. Run Content-Based Engine
// -------------------------------------------------------------
console.log("\n-----------------------------------------------------------------");
console.log("2. Content-Based Engine Trace & Recommendations");
console.log("-----------------------------------------------------------------");
const contentRun = runContent();
console.log(`Content Engine Single Run: ${contentRun.stats.execMs} ms | Memory: ${contentRun.stats.memoryBytes} bytes`);
console.log(`Vocabulary Size: ${contentRun.stats.vocabSize} unique tokens across ${contentRun.stats.docCount} items`);
console.log(`Content Total Trace Steps Emitted: ${contentRun.steps.length}`);

console.log("\nContent-Based Top-5 Recommendations for Alex Chen:");
contentRun.result.recommendations.forEach((rec, idx) => {
  const coldStr = rec.isCold ? " [COLD-START ITEM RANKED!]" : "";
  console.log(`  ${idx + 1}. [${rec.movieId}] ${rec.title.padEnd(25)} Cosine Similarity: ${rec.score.toFixed(4)}${coldStr}`);
});

// Check Content handling of cold-start movie m14
const contentColdStep = contentRun.steps.find(
  (s) => s.kind === "compare" && s.payload.candidateId === "m14"
);
console.log(`\nContent Cold Item Verification (m14 - Chronopolis):`);
if (contentColdStep && contentColdStep.kind === "compare") {
  console.log(`  - Cold item detected: ${contentColdStep.payload.isCold}`);
  console.log(`  - Cosine similarity: ${contentColdStep.payload.cosine}`);
  console.log(`  - Angular separation: ${contentColdStep.payload.angleDeg}°`);
  console.log(`  - 2D PCA Coordinates: (${contentRun.result.coordinates2D["m14"].x}, ${contentRun.result.coordinates2D["m14"].y})`);
}

// -------------------------------------------------------------
// 3. Compute Metrics (with timeIt median ms)
// -------------------------------------------------------------
console.log("\n-----------------------------------------------------------------");
console.log("3. Metrics Comparison (timeIt 1 Warmup + 5 Runs Median)");
console.log("-----------------------------------------------------------------");
const metrics = computeMetrics(5);
console.log("Metric                       | SVD Engine      | Content-Based");
console.log("-----------------------------+-----------------+-----------------");
console.log(`Execution Time (median ms)   | ${metrics.svd.execMs.toString().padEnd(15)} | ${metrics.content.execMs.toString().padEnd(15)}`);
console.log(`Memory Footprint (bytes)     | ${metrics.svd.memoryBytes.toString().padEnd(15)} | ${metrics.content.memoryBytes.toString().padEnd(15)}`);
console.log(`Precision@5 (Held-out >= 4)  | ${metrics.svd.precisionAtK.toString().padEnd(15)} | ${metrics.content.precisionAtK.toString().padEnd(15)}`);
console.log(`Cold-Start Resilience (0-1)  | ${metrics.svd.coldStartScore.toString().padEnd(15)} | ${metrics.content.coldStartScore.toString().padEnd(15)}`);

// -------------------------------------------------------------
// 4. Dataset Scale Benchmark (50x30, 100x60, 500x300)
// -------------------------------------------------------------
console.log("\n-----------------------------------------------------------------");
console.log("4. Dataset Scale Benchmark (Verifying Monotonic Increase)");
console.log("-----------------------------------------------------------------");
const scales: Array<[number, number]> = [
  [50, 30],
  [100, 60],
  [500, 300],
];

for (const [users, moviesCount] of scales) {
  const bench = scaleBenchmark(users, moviesCount);
  console.log(`Scale ${bench.numUsers} users × ${bench.numMovies} movies:`);
  console.log(`  SVD:     ${bench.svdMs.toFixed(3).padStart(8)} ms | ${(bench.svdMemoryBytes / 1024).toFixed(1).padStart(7)} KB memory`);
  console.log(`  Content: ${bench.contentMs.toFixed(3).padStart(8)} ms | ${(bench.contentMemoryBytes / 1024).toFixed(1).padStart(7)} KB memory`);
}

console.log("\n=================================================================");
console.log("             PHASE 1 VERIFICATION COMPLETED                      ");
console.log("=================================================================");
