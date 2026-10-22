/**
 * Phase 2 Verification Script.
 * Verifies Zustand store, shared simulation clock, derived selectors,
 * cold-start filtering, unrankable SVD payload at tick, playback controls,
 * and asynchronous benchmark scale caching.
 */

import { computeMetrics } from "../lib/engines/metrics";
import {
  currentCbStep,
  currentSvdStep,
  isCbDone,
  isSvdDone,
  progress,
  revealedContentRecommendations,
  revealedExecMs,
  totalTicks,
  unrankableAtTick,
} from "../lib/sim/selectors";
import { useSimStore } from "../lib/sim/store";

async function main() {
  console.log("=================================================================");
  console.log("             CINEMETRIC - PHASE 2 VERIFICATION                   ");
  console.log("=================================================================\n");

  const store = useSimStore.getState();
  const total = totalTicks(store);
  console.log(`Initial Store State:`);
  console.log(`  - SVD Steps Count : ${store.svdSteps.length}`);
  console.log(`  - CB Steps Count  : ${store.cbSteps.length}`);
  console.log(`  - Total Sim Ticks : ${total}`);
  console.log(`  - Initial Tick    : ${store.tick}`);
  console.log(`  - Initial Speed   : ${store.speed}x`);
  console.log(`  - Cold-Start Mode : ${store.coldStart ? "ON" : "OFF"}`);
  console.log();

  // -----------------------------------------------------------------
  // 1. Trace Simulation across all ticks (0 to total - 1)
  // -----------------------------------------------------------------
  console.log("-----------------------------------------------------------------");
  console.log("1. Simulating Shared Clock Ticks (0..N)");
  console.log("-----------------------------------------------------------------");
  console.log("Tick | Progress | SVD Step [Status]        | CB Step [Status]         | SVD ms | CB ms");
  console.log("-----+----------+--------------------------+--------------------------+--------+-------");

  for (let t = 0; t < total; t++) {
    useSimStore.getState().seek(t);
    const state = useSimStore.getState();

    const svd = currentSvdStep(state);
    const cb = currentCbStep(state);
    const svdDone = isSvdDone(state) ? "[DONE]" : "[RUN]";
    const cbDone = isCbDone(state) ? "[DONE]" : "[RUN]";

    const svdStr = `${svd?.kind.padEnd(12)} ${svdDone}`.padEnd(24);
    const cbStr = `${cb?.kind.padEnd(12)} ${cbDone}`.padEnd(24);
    const svdMsStr = revealedExecMs(state, "svd").toFixed(2).padStart(6);
    const cbMsStr = revealedExecMs(state, "content").toFixed(2).padStart(6);
    const progStr = `${(progress(state) * 100).toFixed(0)}%`.padStart(4);

    console.log(` ${t.toString().padStart(2)}  |   ${progStr}   | ${svdStr} | ${cbStr} | ${svdMsStr} | ${cbMsStr}`);

    // Check unrankable reveal when SVD reaches rank step
    if (svd?.kind === "rank") {
      const unrankable = unrankableAtTick(state);
      console.log(`     >>> [SVD Rank Reached] unrankableAtTick revealed: ${unrankable.length} item(s)`);
      unrankable.forEach((item) => {
        console.log(`         * ${item.title} (${item.itemId}): ${item.reason}`);
      });
    }
  }

  // Check consistency between revealedExecMs at final tick and computeMetrics
  const finalState = useSimStore.getState();
  const svdRevealedFinal = revealedExecMs(finalState, "svd");
  const cbRevealedFinal = revealedExecMs(finalState, "content");
  const metrics = computeMetrics(5);

  console.log("\nTiming Consistency Check (Revealed Final Tick vs computeMetrics):");
  console.log(`  - Final Tick Revealed: SVD = ${svdRevealedFinal} ms | CB = ${cbRevealedFinal} ms (SVD faster: ${svdRevealedFinal < cbRevealedFinal})`);
  console.log(`  - computeMetrics:      SVD = ${metrics.svd.execMs} ms | CB = ${metrics.content.execMs} ms (SVD faster: ${metrics.svd.execMs < metrics.content.execMs})`);
  console.log(`  - Ordering Consistent: ${ (svdRevealedFinal < cbRevealedFinal) === (metrics.svd.execMs < metrics.content.execMs) ? "YES (Consistent!)" : "NO" }`);

  // -----------------------------------------------------------------
  // 2. Cold-Start Toggle & Selector Filtering (No Engine Re-Run)
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("2. Cold-Start Toggle Selector Verification (Chronopolis m14)");
  console.log("-----------------------------------------------------------------");
  useSimStore.getState().seek(total - 1); // at rank step

  // A. coldStart ON
  useSimStore.getState().setColdStart(true);
  let recs = revealedContentRecommendations(useSimStore.getState());
  const hasColdWhenOn = recs.some((r) => r.movieId === "m14");
  console.log(`ColdStart = ON :`);
  console.log(`  - Chronopolis present in Content recommendations: ${hasColdWhenOn}`);
  console.log(`  - Content Rank #1: ${recs[0]?.title} (Score: ${recs[0]?.score.toFixed(4)})`);

  // B. coldStart OFF
  useSimStore.getState().setColdStart(false);
  recs = revealedContentRecommendations(useSimStore.getState());
  const hasColdWhenOff = recs.some((r) => r.movieId === "m14");
  console.log(`ColdStart = OFF:`);
  console.log(`  - Chronopolis present in Content recommendations: ${hasColdWhenOff} (Hidden!)`);
  console.log(`  - Content Rank #1: ${recs[0]?.title} (Score: ${recs[0]?.score.toFixed(4)})`);

  // Restore
  useSimStore.getState().setColdStart(true);

  // -----------------------------------------------------------------
  // 3. Playback Controls Verification
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("3. Playback Controls State Transitions");
  console.log("-----------------------------------------------------------------");

  // Reset
  useSimStore.getState().reset();
  console.log(`Reset: tick = ${useSimStore.getState().tick}, playing = ${useSimStore.getState().playing}`);

  // Step Forward
  useSimStore.getState().stepForward();
  useSimStore.getState().stepForward();
  console.log(`Step Forward x2: tick = ${useSimStore.getState().tick}`);

  // Step Back
  useSimStore.getState().stepBack();
  console.log(`Step Back x1: tick = ${useSimStore.getState().tick}`);

  // Seek
  useSimStore.getState().seek(7);
  console.log(`Seek to tick 7: tick = ${useSimStore.getState().tick}`);

  // Speed Change
  useSimStore.getState().setSpeed(2);
  console.log(`Set Speed 2x: speed = ${useSimStore.getState().speed}`);
  useSimStore.getState().setSpeed(4);
  console.log(`Set Speed 4x: speed = ${useSimStore.getState().speed}`);

  // Play & Auto-pause at end
  useSimStore.getState().seek(total - 1);
  useSimStore.getState().play();
  console.log(`Play at end (tick ${total - 1}): restarts to tick ${useSimStore.getState().tick}, playing = ${useSimStore.getState().playing}`);

  useSimStore.getState().seek(total - 2);
  useSimStore.getState().play();
  useSimStore.getState().stepForward();
  console.log(`Step into final tick ${total - 1}: auto-pause playing = ${useSimStore.getState().playing}`);

  // -----------------------------------------------------------------
  // 4. Asynchronous Benchmark & Cache Scaling (500x300)
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("4. Asynchronous Benchmark Scale & Cache");
  console.log("-----------------------------------------------------------------");

  console.log("Switching to scale: '100'...");
  const tStart100 = performance.now();
  await useSimStore.getState().setDatasetScale("100");
  const bench100 = useSimStore.getState().benchmark.result;
  console.log(`  - Scale 100 Status: ${useSimStore.getState().benchmark.status} (${(performance.now() - tStart100).toFixed(1)} ms)`);
  console.log(`  - SVD: ${bench100?.svdMs} ms | Content: ${bench100?.contentMs} ms`);

  console.log("Switching to scale: '500x300'...");
  const tStart500 = performance.now();
  await useSimStore.getState().setDatasetScale("500x300");
  const bench500 = useSimStore.getState().benchmark.result;
  console.log(`  - Scale 500x300 Status: ${useSimStore.getState().benchmark.status} (${(performance.now() - tStart500).toFixed(1)} ms)`);
  console.log(`  - SVD: ${bench500?.svdMs} ms | Content: ${bench500?.contentMs} ms`);
  console.log(`  - Memory: SVD ${(bench500!.svdMemoryBytes / 1024).toFixed(1)} KB | Content ${(bench500!.contentMemoryBytes / 1024).toFixed(1)} KB`);

  console.log("Testing Cache: Switching back to '100'...");
  const tCached = performance.now();
  await useSimStore.getState().setDatasetScale("100");
  console.log(`  - Cache Instant Return: ${(performance.now() - tCached).toFixed(2)} ms!`);
  console.log(`  - Result unchanged: SVD ${useSimStore.getState().benchmark.result?.svdMs} ms`);

  console.log("\n=================================================================");
  console.log("             PHASE 2 VERIFICATION COMPLETED                      ");
  console.log("=================================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
