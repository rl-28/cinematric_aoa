"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NetflixIntro } from "@/components/ui/NetflixIntro";
import { AlgoCard } from "@/components/ui/AlgoCard";
import { MOVIES } from "@/lib/data/movies";
import { USERS } from "@/lib/data/ratings";

function LandingPageContent() {
  const searchParams = useSearchParams();
  const introParam = searchParams.get("intro");
  const totalMovies = MOVIES.length;
  const totalUsers = USERS.length;
  const coldMovie = MOVIES.find((m) => m.cold);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Brand-safe Audio/Visual Intro Overlay (First-visit gate) */}
      <NetflixIntro introParam={introParam} />

      {/* ========================================================= */}
      {/* Top Navigation Bar                                        */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-accent font-black tracking-wider text-lg sm:text-xl font-sans hover:opacity-85 transition-opacity focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-1 shrink-0"
            >
              CINEMETRIC
            </Link>
            <span className="hidden md:inline-block text-xs font-mono text-neutral-500 border-l border-neutral-800 pl-3">
              Recommender Algorithm Lab
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            <a
              href="#mission"
              className="text-xs font-medium text-muted hover:text-white transition hidden md:inline-block"
            >
              Mission
            </a>
            <a
              href="#algorithms"
              className="text-xs font-medium text-muted hover:text-white transition hidden md:inline-block"
            >
              Algorithms
            </a>
            <a
              href="#limitations"
              className="text-xs font-medium text-muted hover:text-white transition hidden md:inline-block"
            >
              Disclosures
            </a>
            <a
              href="/simulate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-accent hover:bg-red-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(229,9,20,0.35)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shrink-0"
            >
              <span>Launch<span className="hidden xs:inline sm:inline"> Simulator</span></span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================= */}
        {/* Section 1: Hero                                           */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-neutral-800/80">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-mono font-semibold tracking-wider uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Interactive Recommender Explainer
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6 font-sans">
              Recommendation Algorithms, <br />
              <span className="text-accent underline decoration-accent/40 decoration-wavy decoration-2">
                Unmasked
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-xl text-neutral-300 font-normal leading-relaxed mb-10">
              An in-browser dual-engine laboratory contrasting Truncated SVD Collaborative Filtering with High-Dimensional Content-Based Vector Search running live math on real numbers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <a
                href="/simulate"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-accent hover:bg-red-600 text-white font-extrabold text-base tracking-wide shadow-[0_0_35px_rgba(229,9,20,0.5)] hover:shadow-[0_0_50px_rgba(229,9,20,0.75)] transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <span>Launch Simulator</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href="#algorithms"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface hover:bg-neutral-800 border border-neutral-800 text-sm font-semibold text-neutral-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <span>Explore Algorithm Differences</span>
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Spec Chips / Live Dataset Context */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs font-mono text-muted bg-surface/70 px-3.5 py-2 rounded-xl border border-neutral-800 max-w-full leading-normal">
              <span className="text-white font-semibold">{totalUsers} Users</span>
              <span className="text-neutral-700">&bull;</span>
              <span className="text-white font-semibold">{totalMovies} Movies</span>
              <span className="text-neutral-700">&bull;</span>
              <span className="text-white font-semibold">112-Token Vocabulary</span>
              <span className="text-neutral-700">&bull;</span>
              <span className="text-amber-400 font-semibold">
                1 Cold Item ({coldMovie?.title ?? "Chronopolis"})
              </span>
              <span className="text-neutral-700">&bull;</span>
              <span className="text-accent font-semibold">Pure Client-Side Math</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Section 2: Mission — Real Algorithms, Real Numbers       */}
        {/* ========================================================= */}
        <section id="mission" className="py-20 sm:py-24 border-b border-neutral-800/80 bg-surface/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-2 block">
                The Cinemetric Principle
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Real Algorithms. Real Numbers.
              </h2>
              <p className="text-neutral-300 text-base leading-relaxed">
                Most educational visualizers render pre-baked SVG keyframes or scripted animations that masquerade as computing. Cinemetric is built on an uncompromising architectural separation:
              </p>
            </div>

            {/* Architectural Execution Loop */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 relative">
              {/* Step 1 */}
              <div className="bg-surface/90 border border-neutral-800/80 rounded-xl p-5 relative">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent font-mono font-bold flex items-center justify-center mb-4 text-sm">
                  01
                </div>
                <h3 className="text-base font-bold text-white mb-2">Runs in the Browser</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Real linear algebra (`ml-matrix` Truncated SVD) and TF-IDF vector math execute client-side on actual typed matrices.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface/90 border border-neutral-800/80 rounded-xl p-5 relative">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent font-mono font-bold flex items-center justify-center mb-4 text-sm">
                  02
                </div>
                <h3 className="text-base font-bold text-white mb-2">Emits an Explicit Trace</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Every step emits an immutable mathematical payload: baseline biases, residual eigenvalues, token vectors, and true angle cosines.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface/90 border border-neutral-800/80 rounded-xl p-5 relative">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent font-mono font-bold flex items-center justify-center mb-4 text-sm">
                  03
                </div>
                <h3 className="text-base font-bold text-white mb-2">Replays via Pure Functions</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  The visualizer panels are strictly pure projections of the shared simulation clock tick. Scrubbing backwards or seeking is deterministic.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-surface/90 border border-neutral-800/80 rounded-xl p-5 relative">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent font-mono font-bold flex items-center justify-center mb-4 text-sm">
                  04
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ground-Truth Metrics</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Precision@5, memory footprint, and cold-start resilience are derived from the exact same execution run against held-out test splits.
                </p>
              </div>
            </div>

            {/* Principle quote banner */}
            <div className="mt-10 rounded-xl bg-neutral-900/60 border border-neutral-800 p-5 text-center">
              <p className="font-mono text-xs sm:text-sm text-neutral-300">
                <span className="text-accent font-bold">&ldquo;</span>Algorithms execute in-browser &rarr; emit an immutable trace &rarr; visualizers replay the trace &rarr; metrics reflect the exact same run.<span className="text-accent font-bold">&rdquo;</span>
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Section 3: Algorithm Cards (SVD vs. Content-Based)        */}
        {/* ========================================================= */}
        <section id="algorithms" className="py-20 sm:py-24 border-b border-neutral-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-2 block">
                Dual Recommender Paradigms
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Two Philosophies, One Catalog
              </h2>
              <p className="text-neutral-300 text-base leading-relaxed">
                Compare how Collaborative Filtering uncovers latent communal affinities versus how Content-Based Filtering models explicit semantic tokens.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              <AlgoCard algorithm="svd" />
              <AlgoCard algorithm="content" />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Section 4: What this demo does and doesn't show           */}
        {/* ========================================================= */}
        <section id="limitations" className="py-20 sm:py-24 border-b border-neutral-800/80 bg-surface/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-muted font-semibold mb-2 block">
                Transparency &amp; Engineering Honesty
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                What This Demo Does and Doesn&apos;t Show
              </h2>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                Educational explainers are often tempted to overclaim or obscure nuances. Here is an upfront breakdown of what Cinemetric demonstrates and the deliberate engineering boundaries in place:
              </p>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="rounded-xl bg-surface/80 border border-neutral-800/80 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent font-mono text-sm font-bold">01</div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      Curated Synthetic Demo Dataset (10 Users &times; 14 Movies)
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      The catalog is intentionally sized for transparent human comprehension. It is small enough that you can inspect every matrix residual, singular eigenvalue, and TF-IDF token bar on a single screen without pagination or black-box clipping, while remaining large enough to exercise every algebraic transformation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="rounded-xl bg-surface/80 border border-neutral-800/80 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent font-mono text-sm font-bold">02</div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      Precision@5 Is Tied (0.40 vs. 0.40) By Design
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      On the held-out test split, both algorithms achieve identical precision (2 hits out of 5 relevant recommendations). We deliberately did not massage or fudge synthetic ratings to invent an artificial &ldquo;winner.&rdquo; Equal quantitative precision on small splits highlights that identical accuracy numbers can yield completely different qualitative user experiences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="rounded-xl bg-surface/80 border border-neutral-800/80 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent font-mono text-sm font-bold">03</div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      JavaScript Engine Overhead on Micro Datasets
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      On a 10&times;14 matrix, modern V8/SpiderMonkey JIT startup overhead and typed array allocation dominate raw calculation cycles. Content-Based filtering&apos;s true asymptotic speed advantage (<code className="text-neutral-300 font-mono text-xs">O(N &middot; d)</code> vs. SVD&apos;s <code className="text-neutral-300 font-mono text-xs">O(min(m&sup2;n, mn&sup2;))</code>) only becomes obvious as catalogs scale to thousands of items.
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="rounded-xl bg-surface/80 border border-neutral-800/80 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent font-mono text-sm font-bold">04</div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      Scaling Benchmark (500 &times; 300) Pushes Browser JavaScript
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      Computing full singular value decomposition on a 500-user by 300-movie matrix inside a single main-thread browser tab takes multiple seconds. The simulator provides a scale selector specifically to demonstrate how cubic decomposition degrades relative to linear vector scoring. In Phase 7, this stress-test benchmark is isolated in a background Web Worker.
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 5 */}
              <div className="rounded-xl bg-surface/80 border border-neutral-800/80 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-accent font-mono text-sm font-bold">05</div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      Neither Algorithm Is Universally &ldquo;Better&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      Real production recommender systems at Netflix, YouTube, or Spotify never deploy SVD or Content-Based filtering in isolation. They deploy hybrid architectures: using content vectors to embed cold-start releases and new users, while deploying collaborative matrix factorization to discover serendipitous cross-genre habits as user interaction history accumulates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Call to Action Banner                                     */}
        {/* ========================================================= */}
        <section className="py-16 sm:py-20 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Ready to Explore the Live Simulation?
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Open the interactive dual-panel dashboard to scrub through every algebraic step, toggle cold-start items, and inspect real-time residual matrices.
            </p>
            <a
              href="/simulate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-accent hover:bg-red-600 text-white font-bold text-base tracking-wide shadow-[0_0_35px_rgba(229,9,20,0.5)] hover:shadow-[0_0_50px_rgba(229,9,20,0.7)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Launch Simulator</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* Section 5: Footer                                         */}
      {/* ========================================================= */}
      <footer className="w-full bg-surface/90 border-t border-neutral-800/80 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-accent font-black tracking-wider text-lg font-sans">
                CINEMETRIC
              </span>
              <p className="text-xs text-neutral-500 font-sans">
                In-browser algorithmic recommender explainer &amp; simulation laboratory.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted">
              <a
                href="/simulate"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Simulator ↗
              </a>
              <a
                href="https://github.com/rl-28/cinematric_aoa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                GitHub Repository ↗
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-3">
            <span>
              &copy; 2026 Cinemetric. Designed for educational exploration of recommender mathematics.
            </span>
            <span className="text-neutral-600">
              Brand-safe independent demonstration. Not affiliated with or endorsed by Netflix, Inc.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg text-text" />}>
      <LandingPageContent />
    </Suspense>
  );
}
