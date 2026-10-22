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
  visibleSvdSteps,
  visibleCbSteps,
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

  // A. coldStart ON
  useSimStore.getState().setColdStart(true);
  const stateOn = useSimStore.getState();
  const ticksOn = totalTicks(stateOn);
  const svdStepsOn = visibleSvdSteps(stateOn);
  const cbStepsOn = visibleCbSteps(stateOn);
  useSimStore.getState().seek(ticksOn - 1); // at final rank step (tick 13)

  let recs = revealedContentRecommendations(useSimStore.getState());
  const hasColdWhenOn = recs.some((r) => r.movieId === "m14");
  const unrankableOn = unrankableAtTick(useSimStore.getState());

  console.log(`ColdStart = ON :`);
  console.log(`  - Total Sim Ticks : ${ticksOn} (Expected: 14)`);
  console.log(`  - SVD Visible Steps: ${svdStepsOn.length} (Expected: 14)`);
  console.log(`  - CB Visible Steps : ${cbStepsOn.length} (Expected: 12)`);
  console.log(`  - Current Tick    : ${useSimStore.getState().tick} (Expected: 13)`);
  console.log(`  - Chronopolis present in Content recommendations: ${hasColdWhenOn}`);
  console.log(`  - SVD unrankable items: ${unrankableOn.length} (${unrankableOn[0]?.title})`);
  console.log(`  - Content Rank #1: ${recs[0]?.title} (Score: ${recs[0]?.score.toFixed(4)})`);

  if (ticksOn !== 14 || svdStepsOn.length !== 14 || cbStepsOn.length !== 12 || !hasColdWhenOn || unrankableOn.length !== 1) {
    throw new Error("Assertion failed for ColdStart ON state!");
  }

  // B. coldStart OFF
  // Toggle off while tick is at 13 -> must clamp tick to 12
  useSimStore.getState().setColdStart(false);
  const stateOff = useSimStore.getState();
  const ticksOff = totalTicks(stateOff);
  const svdStepsOff = visibleSvdSteps(stateOff);
  const cbStepsOff = visibleCbSteps(stateOff);
  const tickAfterToggle = stateOff.tick;

  recs = revealedContentRecommendations(stateOff);
  const hasColdWhenOff = recs.some((r) => r.movieId === "m14");
  const unrankableOff = unrankableAtTick(stateOff);

  console.log(`ColdStart = OFF:`);
  console.log(`  - Total Sim Ticks : ${ticksOff} (Expected: 13)`);
  console.log(`  - SVD Visible Steps: ${svdStepsOff.length} (Expected: 13)`);
  console.log(`  - CB Visible Steps : ${cbStepsOff.length} (Expected: 11)`);
  console.log(`  - Clamped Tick    : ${tickAfterToggle} (Expected: 12)`);
  console.log(`  - Chronopolis present in Content recommendations: ${hasColdWhenOff} (Hidden!)`);
  console.log(`  - SVD unrankable items: ${unrankableOff.length} (Expected: 0)`);
  console.log(`  - Content Rank #1: ${recs[0]?.title} (Score: ${recs[0]?.score.toFixed(4)})`);

  // Confirm m14 dot_product step removed from SVD
  const hasM14Svd = svdStepsOff.some((s) => s.kind === "dot_product" && s.payload.movieId === "m14");
  // Confirm m14 compare step removed from CB
  const hasM14Cb = cbStepsOff.some((s) => s.kind === "compare" && s.payload.candidateId === "m14");

  console.log(`  - SVD has m14 dot_product step: ${hasM14Svd} (Expected: false)`);
  console.log(`  - CB has m14 compare step: ${hasM14Cb} (Expected: false)`);

  if (ticksOff !== 13 || svdStepsOff.length !== 13 || cbStepsOff.length !== 11 || tickAfterToggle !== 12 || hasColdWhenOff || unrankableOff.length !== 0 || hasM14Svd || hasM14Cb) {
    throw new Error("Assertion failed for ColdStart OFF state!");
  }

  // C. Restore coldStart ON
  useSimStore.getState().setColdStart(true);
  console.log(`Restored ColdStart = ON (Total Ticks: ${totalTicks(useSimStore.getState())})`);

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
