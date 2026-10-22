# CINEMETRIC — Project Brief & Architecture Specification

## 1. What the Project Is About
An interactive algorithm explainer that actually executes recommender algorithms in-browser on real numbers rather than canned mock animations.

**Core Principle:**
> Real algorithms run in the browser on a dataset → they emit a step-by-step trace → the visualizers replay that trace → the metrics come from the exact same run.

- **Decoupled Architecture**: Algorithm logic, animation, and metrics are cleanly separated.
- **Shared Simulation Clock**: SVD and Content-Based panels replay traces driven by one shared clock (Play / Pause / Speed / Step / Reset).

---

## 2. Key Mathematical & Architectural Resolutions

### A. Reconciling Textbook SVD and Latent-Factor Recommendation
- Classic Textbook SVD: $R \approx U \Sigma V^T$
- Production Biased Latent-Factor Model (Funk SVD): $\hat{r}_{ui} = \mu + b_u + b_i + P_u Q_i^T$
- **Reconciliation**:
  1. Compute and subtract baseline global mean and biases: $A_{ui} = R_{ui} - (\mu + b_u + b_i)$
  2. Perform truncated SVD on the residual matrix $A$: $A \approx U_k \Sigma_k V_k^T$
  3. Set user factors $P = U_k \sqrt{\Sigma_k}$ and item factors $Q = V_k \sqrt{\Sigma_k}$
  4. Final prediction: $\hat{r}_{ui} = \mu + b_u + b_i + P_u Q_i^T$

### B. Netflix-Style Intro & Brand Safety
- Original red **CINEMETRIC** wordmark animation.
- Custom synthesized low-boom sound created dynamically using Web Audio API (no copyright/trademark risks, click-to-trigger avoids autoplay restrictions).

### C. Timing & Dataset Scale
- High-resolution timing with `performance.now()` measured per stage.
- Scale selector: Small demo set (interactive) + synthetic benchmark set (500×300).
- Analytical memory calculation based on active typed array allocations.

### D. Defensible Metrics
- **Execution Time**: Measured per stage, accumulated as the replay plays.
- **Memory Footprint**: Bytes of data structures held (residual matrix, $U$, $\Sigma$, $V$ vs. TF-IDF matrix and user profiles).
- **Precision@K**: Evaluated on held-out test ratings (hide 20% of ratings, test top-K hits).
- **Cold-Start Resilience**: Toggle injects a new movie with 0 ratings. SVD falls back to baseline; Content-Based embeds it via metadata.

---

## 3. Architecture & File Structure

### Routes
- `/` → Landing page (Cinemetric intro, mission statement, algorithm comparison cards, Launch CTA).
- `/simulate` → 50/50 dashboard (Left: SVD Pipeline; Right: Content-Based Vector Space).

### Code Organization
- `lib/data/`
  - `movies.ts` (curated movies with metadata, genres, 1 cold-start item)
  - `ratings.ts` (fixed-seed user-item interaction matrix, 1 designated target user)
- `lib/engines/`
  - `svd.ts` (Baseline subtraction + truncated SVD via `ml-matrix` + trace emitter)
  - `content.ts` (TF-IDF vectorizer + cosine similarity + trace emitter)
  - `metrics.ts` (Execution time, memory, Precision@K, cold-start score)
- `lib/sim/`
  - `store.ts` (Zustand simulation state: `tick`, `playing`, `speed`, `stepIndex`, `scale`, `coldStartActive`)
  - `useReplay.ts` (Replay engine syncing step index with animation frames)
- `components/svd/`
  - `MatrixPipeline.tsx` (SVG/CSS matrix transformations: $R \to A \to U, \Sigma, V^T \to P, Q$)
- `components/cb/`
  - `VectorGraph.tsx` (SVG 2D/3D projection, movie vectors, angle arcs, cosine similarities)
- `components/ui/`
  - `ControlBar.tsx` (Play, pause, scrub, speed, reset, cold-start toggle)
  - `MetricsOverlay.tsx` (Live execution time, memory, precision readouts)
  - `AlgoCard.tsx` (Educational breakdown cards)
  - `NetflixIntro.tsx` (Cinemetric wordmark + Web Audio synthesizer)

### Trace Contract
```ts
export type Step<K extends string, P> = {
  id: number;
  kind: K;
  label: string;
  ms: number;
  payload: P;
};

// SVD Kinds: 'load' | 'baseline' | 'center' | 'decompose' | 'truncate' | 'dot_product' | 'rank'
// CB Kinds:  'tokenize' | 'tfidf' | 'profile' | 'compare' | 'rank'
```

---

## 4. Phase Plan
- **Phase 0**: Scaffold, design tokens, routes, folder structure *(Completed)*
- **Phase 1**: Dataset + SVD & Content engines + traces + metrics (The Brain)
- **Phase 2**: Shared simulation clock & replay store
- **Phase 3**: SVD live visualizer (left panel)
- **Phase 4**: Content-based graph visualizer (right panel)
- **Phase 5**: Dashboard shell, control bar, metrics overlay, cold-start toggle
- **Phase 6**: Landing page, intro modal, algorithm cards, Launch CTA
- **Phase 7**: Polish, QA, deployment verification
