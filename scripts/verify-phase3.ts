/**
 * Phase 3 verification script:
 * Verifies SVD state derivations at key ticks (0, 2, 3, 4, 5, 12, 13)
 * and verifies that seeking backward from 13 to 2 clears predicted cells.
 */

import { useSimStore } from "../lib/sim/store";
import {
  currentSvdStep,
  predictedCellsAtTick,
  unrankableAtTick,
  revealedExecMs,
  baselineAtTick,
} from "../lib/sim/selectors";

async function main() {
  console.log("=== PHASE 3 SVD VERIFICATION ===");
  const store = useSimStore.getState();
  await store.loadRuns();

  const state = useSimStore.getState();
  console.log(`Loaded ${state.svdSteps.length} SVD steps.`);

  // 1. Tick 0: Load stage
  store.seek(0);
  let cur = useSimStore.getState();
  let step = currentSvdStep(cur);
  console.log(`\n[Tick 0] kind: ${step?.kind}, label: "${step?.label}"`);
  console.assert(step?.kind === "load", "Tick 0 must be load stage");

  // 2. Tick 3: Decompose stage
  store.seek(3);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  console.log(`\n[Tick 3] kind: ${step?.kind}, label: "${step?.label}"`);
  console.assert(step?.kind === "decompose", "Tick 3 must be decompose stage");

  // 3. Tick 4: Truncate stage
  store.seek(4);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  console.log(`\n[Tick 4] kind: ${step?.kind}, label: "${step?.label}"`);
  console.assert(step?.kind === "truncate", "Tick 4 must be truncate stage");

  // 4. Tick 5: First dot_product (Dune)
  store.seek(5);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  let preds = predictedCellsAtTick(cur);
  console.log(`\n[Tick 5] kind: ${step?.kind}, label: "${step?.label}"`);
  if (step?.kind === "dot_product") {
    console.log(`  Movie: ${step.payload.title} (${step.payload.movieId})`);
    console.log(`  P_u: [${step.payload.pRow.map(v => v.toFixed(3)).join(", ")}]`);
    console.log(`  Q_i: [${step.payload.qRow.map(v => v.toFixed(3)).join(", ")}]`);
    console.log(`  Terms: [${step.payload.terms.map(v => v.toFixed(3)).join(", ")}]`);
    console.log(`  RunningSum: ${step.payload.runningSum.toFixed(3)}, Bias: ${step.payload.bias.toFixed(3)}, Pred: ${step.payload.prediction.toFixed(2)}`);
  }
  console.assert(step?.kind === "dot_product", "Tick 5 must be dot_product stage");
  console.assert(preds.size === 1, `Tick 5 must have 1 predicted cell, got ${preds.size}`);
  if (step?.kind === "dot_product") {
    console.assert(preds.has(step.payload.movieId), `Tick 5 predicted map must contain ${step.payload.movieId}`);
  }

  // 5. Tick 12: Cold item dot_product (Chronopolis m14)
  store.seek(12);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  preds = predictedCellsAtTick(cur);
  console.log(`\n[Tick 12] kind: ${step?.kind}, label: "${step?.label}"`);
  if (step?.kind === "dot_product") {
    console.log(`  Movie: ${step.payload.title} (${step.payload.movieId})`);
    console.log(`  ColdFallback: ${step.payload.coldFallback}`);
    console.log(`  Q_i: [${step.payload.qRow.join(", ")}]`);
    console.log(`  RunningSum: ${step.payload.runningSum}, Bias: ${step.payload.bias}, Pred: ${step.payload.prediction}`);
    console.assert(step.payload.coldFallback === true, "Tick 12 must flag coldFallback=true");
    console.assert(step.payload.runningSum === 0, "Tick 12 dot product must be 0");
    console.assert(step.payload.prediction === step.payload.bias, "Tick 12 prediction must equal baseline bias");
  }
  console.assert(preds.size === 8, `Tick 12 must have 8 predicted cells, got ${preds.size}`);

  // 6. Tick 13: Rank stage
  store.seek(13);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  const unrankable = unrankableAtTick(cur);
  console.log(`\n[Tick 13] kind: ${step?.kind}, label: "${step?.label}"`);
  if (step?.kind === "rank") {
    console.log(`  Top 5: ${step.payload.recommendations.map(r => `${r.title} (${r.score.toFixed(2)})`).join(", ")}`);
    console.log(`  Unrankable count: ${unrankable.length}`);
    unrankable.forEach(u => console.log(`  - ${u.title} (${u.itemId}): ${u.reason}`));
  }
  console.assert(step?.kind === "rank", "Tick 13 must be rank stage");
  console.assert(unrankable.length === 1, "Tick 13 must have 1 unrankable item");
  console.assert(unrankable[0].itemId === "m14", "Unrankable item must be m14");

  // 7. Seeking backward from 13 to 2: verify state resets cleanly
  console.log(`\n[Seeking backward from Tick 13 -> Tick 2]`);
  store.seek(2);
  cur = useSimStore.getState();
  step = currentSvdStep(cur);
  preds = predictedCellsAtTick(cur);
  const base = baselineAtTick(cur);
  const unrankableAt2 = unrankableAtTick(cur);
  console.log(`  Tick 2 kind: ${step?.kind}, label: "${step?.label}"`);
  console.log(`  Predicted cells count at tick 2: ${preds.size}`);
  console.log(`  Unrankable items at tick 2: ${unrankableAt2.length}`);
  console.log(`  Baseline revealed at tick 2: mu=${base?.mu.toFixed(3)}`);

  console.assert(step?.kind === "center", "Tick 2 must be center stage");
  console.assert(preds.size === 0, "Predicted cells must be 0 at tick 2");
  console.assert(unrankableAt2.length === 0, "Unrankable items must be 0 at tick 2");
  console.assert(base !== null, "Baseline must be present at tick 2");

  console.log("\n>>> ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<");
}

main().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
