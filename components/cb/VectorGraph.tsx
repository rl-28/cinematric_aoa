"use client";

import React from "react";
import { useSimStore } from "@/lib/sim/store";
import {
  currentCbStep,
  revealedExecMs,
  comparedCandidatesAtTick,
  revealedContentRecommendations,
  isCbFinishedWaiting,
  visibleCbSteps,
} from "@/lib/sim/selectors";
import { MOVIES, Movie } from "@/lib/data/movies";
import { TokenizeView } from "./TokenizeView";
import { TfidfView } from "./TfidfView";
import { CompareCard } from "./CompareCard";
import { RankListView } from "./RankListView";

export const VectorGraph: React.FC = () => {
  const store = useSimStore();
  const currentStep = currentCbStep(store);
  const cbSteps = visibleCbSteps(store);
  const execMs = revealedExecMs(store, "cb");
  const comparedMap = comparedCandidatesAtTick(store);
  const topRecommendations = revealedContentRecommendations(store);
  const isWaitingForSvd = isCbFinishedWaiting(store);

  const currentIdx = Math.min(store.tick, cbSteps.length - 1);
  const totalCbSteps = cbSteps.length;
  const kind = currentStep?.kind ?? "tokenize";

  // Coordinates from engine
  const coordinates2D = store.cbResult?.coordinates2D ?? {};
  const profileCoord =
    coordinates2D["user_profile"] ??
    store.cbResult?.profileCoordinate2D ?? { x: 0.48, y: 0.46 };

  // SVG coordinate dimensions: compact to fit within panel alongside CompareCard
  const svgWidth = 540;
  const svgHeight = 280;

  const toPxX = (normX: number) => Math.round(normX * svgWidth);
  const toPxY = (normY: number) => Math.round(normY * svgHeight);

  // Genre color scheme
  const getGenreColor = (genres: string[]) => {
    const primary = genres[0] ?? "";
    switch (primary) {
      case "Sci-Fi":
        return "#818CF8"; // Indigo
      case "Action":
        return "#EF4444"; // Red
      case "Drama":
        return "#F59E0B"; // Amber
      case "Thriller":
        return "#A855F7"; // Purple
      case "Romance":
        return "#EC4899"; // Pink
      case "Animation":
        return "#10B981"; // Emerald
      default:
        return "#9CA3AF";
    }
  };

  const activeCandidateId =
    currentStep?.kind === "compare" ? currentStep.payload.candidateId : null;

  const isProfileActive = kind === "profile";
  const profileStep = store.cbSteps.find((s) => s.kind === "profile");
  const likedMovieIds = new Set(
    profileStep && profileStep.kind === "profile"
      ? profileStep.payload.ratedMovieIds
      : ["m1", "m2", "m3", "m5"]
  );

  // Helper: should we render the 2D PCA map?
  // User Requirement 1: Each step shows one focused view that fits.
  // Profile and Compare steps show the 2D vector space map!
  const showMap = kind === "profile" || kind === "compare";

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-neutral-800 rounded-lg overflow-hidden shadow-xl font-sans">
      {/* ========================================================= */}
      {/* Header: Title, Kind Badge, Step Dots, Revealed Time       */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-1.5 p-3 bg-surface border-b border-neutral-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-sm tracking-wide">
              Content-Based Vector Space
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-blue-800/50 bg-blue-950/40 text-blue-300 font-semibold">
              {kind}
            </span>

            {isWaitingForSvd && (
              <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Finished · waiting for SVD
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-mono text-xs">
            <span className="text-muted text-[10px] font-sans">this run:</span>
            <span className="text-blue-400 font-bold" suppressHydrationWarning>
              {execMs.toFixed(2)}
            </span>
            <span className="text-muted text-[10px]">ms</span>
          </div>
        </div>

        {/* Step Label & Step Progress Indicator */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-neutral-300 truncate pr-2">
            {currentStep?.label ?? "Initializing..."}
          </span>

          <div
            className="flex items-center gap-1 shrink-0"
            title={`Step ${currentIdx + 1} of ${totalCbSteps}`}
          >
            {cbSteps.map((_, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "w-3 bg-blue-500"
                      : isPast
                      ? "bg-neutral-500"
                      : "bg-neutral-800"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Panel Body: Single Focused View that Fits Without Scroll  */}
      {/* ========================================================= */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col gap-2.5 justify-start">
        {/* Stage 1: Tokenize */}
        {kind === "tokenize" && currentStep && currentStep.kind === "tokenize" && (
          <TokenizeView
            tokensByMovie={currentStep.payload.tokensByMovie}
            vocabSize={store.cbResult?.vocabulary.length ?? 112}
          />
        )}

        {/* Stage 2: TF-IDF */}
        {kind === "tfidf" && currentStep && currentStep.kind === "tfidf" && (
          <TfidfView vocabulary={currentStep.payload.vocabulary} />
        )}

        {/* Stage 3: Profile */}
        {kind === "profile" && currentStep && currentStep.kind === "profile" && (
          <div className="p-2.5 rounded bg-surface border border-neutral-800 flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">
                User Taste Profile Centroid
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Profile = Σ(rating × vector) / ||profile||
              </span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Synthesized from {currentStep.payload.ratedMovieIds.length} liked catalog movies. Weighted vectors converge into Alex&apos;s centroid node below.
            </p>
          </div>
        )}

        {/* Stage 4: Compare (Compact CompareCard + Map visible together) */}
        {kind === "compare" && currentStep && currentStep.kind === "compare" && (
          <CompareCard
            payload={currentStep.payload}
            vocabDim={store.cbResult?.vocabulary.length ?? store.cbStats?.vocabSize ?? 112}
          />
        )}

        {/* Stage 5: Rank */}
        {kind === "rank" && (
          <RankListView
            recommendations={topRecommendations}
            coldStartActive={store.coldStart}
          />
        )}

        {/* ========================================================= */}
        {/* 2D PCA Semantic Projection Map (Profile & Compare steps) */}
        {/* ========================================================= */}
        {showMap && (
          <div className="p-2.5 bg-surface rounded border border-neutral-800 flex flex-col gap-1.5 flex-1 min-h-0">
            <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-1 shrink-0">
              <span className="text-white font-semibold">
                2D PCA Semantic Projection
              </span>
              <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                  Sci-Fi
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  Drama
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Animation
                </span>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-neutral-950 rounded border border-neutral-900 p-1 overflow-hidden select-none">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full max-h-[300px]"
              >
                {/* Subtle axis guides */}
                <line
                  x1={20}
                  y1={svgHeight / 2}
                  x2={svgWidth - 20}
                  y2={svgHeight / 2}
                  stroke="#222"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <line
                  x1={svgWidth / 2}
                  y1={15}
                  x2={svgWidth / 2}
                  y2={svgHeight - 15}
                  stroke="#222"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />

                {/* Profile Converging Arrows (Profile Step) */}
                {isProfileActive && (
                  <g>
                    {["m1", "m2", "m3", "m5"].map((movieId) => {
                      const mCoord = coordinates2D[movieId];
                      if (!mCoord) return null;
                      const mx = toPxX(mCoord.x);
                      const my = toPxY(mCoord.y);
                      const px = toPxX(profileCoord.x);
                      const py = toPxY(profileCoord.y);

                      return (
                        <g key={`arrow-${movieId}`}>
                          <line
                            x1={mx}
                            y1={my}
                            x2={px}
                            y2={py}
                            stroke="#818CF8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx={(mx + px) / 2}
                            cy={(my + py) / 2}
                            r="2"
                            fill="#818CF8"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Candidate Vector & Schematic Angle Arc (Compare Step) */}
                {activeCandidateId && (
                  (() => {
                    const candidateCoord = coordinates2D[activeCandidateId];
                    if (!candidateCoord) return null;
                    const px = toPxX(profileCoord.x);
                    const py = toPxY(profileCoord.y);
                    const cx = toPxX(candidateCoord.x);
                    const cy = toPxY(candidateCoord.y);

                    const dx = cx - px;
                    const dy = cy - py;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const arcRadius = Math.min(32, dist * 0.4);

                    // Offset label along the arc angle without colliding with node labels
                    const angleRad = Math.atan2(dy, dx);
                    const pillDist = arcRadius + 18;
                    const labelX = Math.round(px + Math.cos(angleRad) * pillDist);
                    const labelY = Math.round(py + Math.sin(angleRad) * pillDist);

                    return (
                      <g key="compare-vectors">
                        {/* Vector Line */}
                        <line
                          x1={px}
                          y1={py}
                          x2={cx}
                          y2={cy}
                          stroke="#3B82F6"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        {/* Schematic angle arc around profile */}
                        <circle
                          cx={px}
                          cy={py}
                          r={arcRadius}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />

                        {/* Dedicated Pill for Angle Label (Fixes Overlapping Node Labels) */}
                        <rect
                          x={labelX - 22}
                          y={labelY - 9}
                          width="44"
                          height="16"
                          rx="3"
                          fill="#171717"
                          stroke="#F59E0B"
                          strokeWidth="0.8"
                          opacity="0.95"
                        />
                        <text
                          x={labelX}
                          y={labelY + 3}
                          fill="#FBBF24"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          θ={currentStep?.kind === "compare" ? currentStep.payload.angleDeg.toFixed(0) : ""}°
                        </text>
                      </g>
                    );
                  })()
                )}

                {/* Movie Nodes */}
                {(store.coldStart ? MOVIES : MOVIES.filter((m) => !m.cold)).map((movie) => {
                  const coord = coordinates2D[movie.id];
                  if (!coord) return null;

                  const cx = toPxX(coord.x);
                  const cy = toPxY(coord.y);
                  const genreColor = getGenreColor(movie.genres);
                  const isCold = Boolean(movie.cold);
                  const isCandidate = activeCandidateId === movie.id;
                  const isLiked = likedMovieIds.has(movie.id);
                  const comparedInfo = comparedMap.get(movie.id);

                  // Requirement 2: Label ONLY:
                  // 1) profile, 2) current candidate, 3) liked movies, 4) already-compared candidates
                  const shouldLabel = isCandidate || isLiked || Boolean(comparedInfo);

                  return (
                    <g key={movie.id} className="transition-all">
                      {/* Native tooltip for every node */}
                      <title>
                        {movie.title} ({movie.year}) - {movie.genres.join(", ")}
                        {comparedInfo ? ` | cos(θ) = ${comparedInfo.cosine.toFixed(3)}` : ""}
                      </title>

                      {/* Active Candidate Ring */}
                      {isCandidate && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="10"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                        />
                      )}

                      {/* Liked Item Ring */}
                      {isLiked && !isCandidate && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8"
                          fill="none"
                          stroke="#818CF8"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Node Dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isCandidate ? 6 : isCold ? 5.5 : 4.5}
                        fill={isCold ? "#F59E0B" : genreColor}
                        stroke={isCandidate ? "#FFFFFF" : isCold ? "#FBBF24" : "#171717"}
                        strokeWidth={isCandidate ? 1.5 : 1}
                      />

                      {/* Selective Node Label */}
                      {shouldLabel && (
                        <text
                          x={cx}
                          y={cy + 13}
                          fill={isCandidate ? "#FFFFFF" : isCold ? "#FBBF24" : "#D4D4D4"}
                          fontSize={isCandidate ? "9.5" : "8"}
                          fontWeight={isCandidate ? "bold" : "normal"}
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {movie.title.length > 11 ? movie.title.slice(0, 10) + "…" : movie.title}
                        </text>
                      )}

                      {/* Previously Compared Cosine Badge */}
                      {comparedInfo && !isCandidate && (
                        <g>
                          <rect
                            x={cx + 6}
                            y={cy - 10}
                            width="28"
                            height="10"
                            rx="2"
                            fill="#171717"
                            stroke="#404040"
                            strokeWidth="0.8"
                          />
                          <text
                            x={cx + 20}
                            y={cy - 2}
                            fill="#A3A3A3"
                            fontSize="7"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {comparedInfo.cosine.toFixed(2)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Alex's Profile Centroid Node */}
                {profileCoord && (
                  <g>
                    <title>Alex&apos;s Profile Centroid</title>
                    <circle
                      cx={toPxX(profileCoord.x)}
                      cy={toPxY(profileCoord.y)}
                      r="6.5"
                      fill="#E50914"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={toPxX(profileCoord.x)}
                      cy={toPxY(profileCoord.y)}
                      r="10"
                      fill="none"
                      stroke="#E50914"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={toPxX(profileCoord.x)}
                      y={toPxY(profileCoord.y) - 12}
                      fill="#E50914"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      Alex&apos;s Profile
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
