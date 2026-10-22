"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSimStore } from "@/lib/sim/store";
import {
  currentCbStep,
  revealedExecMs,
  comparedCandidatesAtTick,
  revealedContentRecommendations,
  isCbFinishedWaiting,
} from "@/lib/sim/selectors";
import { MOVIES, Movie } from "@/lib/data/movies";
import { TokenizeView } from "./TokenizeView";
import { TfidfView } from "./TfidfView";
import { CompareCard } from "./CompareCard";
import { RankListView } from "./RankListView";

export const VectorGraph: React.FC = () => {
  const store = useSimStore();
  const currentStep = currentCbStep(store);
  const cbSteps = store.cbSteps;
  const execMs = revealedExecMs(store, "cb");
  const comparedMap = comparedCandidatesAtTick(store);
  const topRecommendations = revealedContentRecommendations(store);
  const isWaitingForSvd = isCbFinishedWaiting(store);

  // Current step index clamped to cbSteps length
  const currentIdx = Math.min(store.tick, cbSteps.length - 1);
  const totalCbSteps = cbSteps.length; // 12
  const kind = currentStep?.kind ?? "tokenize";

  // Coordinates from engine
  const coordinates2D = store.cbResult?.coordinates2D ?? {};
  const profileCoord =
    coordinates2D["user_profile"] ??
    store.cbResult?.profileCoordinate2D ?? { x: 0.48, y: 0.46 };

  // SVG coordinate dimensions
  const svgWidth = 560;
  const svgHeight = 360;

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

  // Kind color badge mapping
  const kindBadgeColors: Record<string, string> = {
    tokenize: "bg-blue-950/40 text-blue-300 border-blue-800/50",
    tfidf: "bg-indigo-950/40 text-indigo-300 border-indigo-800/50",
    profile: "bg-purple-950/40 text-purple-300 border-purple-800/50",
    compare: "bg-accent/20 text-accent border-accent/40",
    rank: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
  };

  const badgeStyle = kindBadgeColors[kind] ?? "bg-neutral-800 text-neutral-300 border-neutral-700";

  // Active candidate ID for compare step
  const activeCandidateId =
    currentStep?.kind === "compare" ? currentStep.payload.candidateId : null;

  // Liked movies for profile step (Alex Chen rated >= 4: m1, m2, m3, m5)
  const isProfileActive = kind === "profile";
  const likedMovieIds = new Set(["m1", "m2", "m3", "m5"]);

  // Top-5 movie IDs for rank step
  const isRankActive = kind === "rank";
  const topRankedMovieIds = new Set(topRecommendations.slice(0, 5).map((r) => r.movieId));

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
      {/* ========================================================= */}
      {/* Header: Title, Kind Badge, Dots, Revealed Time "this run" */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-2 p-3.5 bg-surface border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-white font-bold font-sans text-sm tracking-wide">
              Content-Based Vector Space
            </h2>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${badgeStyle}`}
            >
              {kind}
            </span>

            {/* Waiting for SVD chip when CB completes at tick 11 */}
            {isWaitingForSvd && (
              <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded font-sans font-medium flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Finished · waiting for SVD
              </span>
            )}
          </div>

          {/* Revealed Execution Time labeled "this run" */}
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 font-mono text-xs">
            <span className="text-muted text-[10px] font-sans">this run:</span>
            <span className="text-accent font-bold">{execMs.toFixed(2)}</span>
            <span className="text-muted text-[10px]">ms</span>
          </div>
        </div>

        {/* Step Label & 12-Step Dot Progression */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-neutral-300 font-sans truncate pr-2">
            {currentStep?.label ?? "Initializing..."}
          </span>

          {/* 12 Dots for Content-Based */}
          <div className="flex items-center gap-1 shrink-0" title={`Step ${currentIdx + 1} of ${totalCbSteps}`}>
            {cbSteps.map((_, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "w-3 bg-blue-500 scale-125 shadow-sm shadow-blue-500"
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
      {/* Scrollable Body: Active Stage Card + 2D SVG PCA Canvas   */}
      {/* ========================================================= */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3">
        {/* Stage-Specific Detail Cards */}
        {kind === "tokenize" && currentStep && currentStep.kind === "tokenize" && (
          <TokenizeView
            tokensByMovie={currentStep.payload.tokensByMovie}
            vocabSize={store.cbResult?.vocabulary.length ?? 112}
          />
        )}

        {kind === "tfidf" && currentStep && currentStep.kind === "tfidf" && (
          <TfidfView vocabulary={currentStep.payload.vocabulary} />
        )}

        {kind === "profile" && (
          <div className="p-3 rounded bg-surface border border-neutral-800 flex flex-col gap-2 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-xs">
                Target User Taste Profile: Alex Chen
              </span>
              <span className="text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 font-mono">
                Profile = Σ(rating × vector) / ||profile||
              </span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Synthesized from 4 rated movies:{" "}
              <strong className="text-emerald-400">Inception (5★)</strong>,{" "}
              <strong className="text-emerald-400">The Matrix (5★)</strong>,{" "}
              <strong className="text-emerald-400">Interstellar (5★)</strong>, and{" "}
              <strong className="text-blue-400">The Dark Knight (4★)</strong>.
              Weighted vectors converge into Alex&apos;s taste centroid shown on the map below.
            </p>
          </div>
        )}

        {kind === "compare" && currentStep && currentStep.kind === "compare" && (
          <CompareCard
            payload={currentStep.payload}
            vocabDim={store.cbResult?.vocabulary.length ?? 112}
          />
        )}

        {kind === "rank" && (
          <RankListView
            recommendations={topRecommendations}
            coldStartActive={store.coldStart}
          />
        )}

        {/* ========================================================= */}
        {/* 2D PCA Vector Space Canvas (Always Visible Base Layer)   */}
        {/* ========================================================= */}
        <div className="p-3 bg-surface rounded-md border border-neutral-800 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold font-sans">
                2D PCA Semantic Projection
              </span>
              <span className="text-[10px] text-muted bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                14 Movies + Target Centroid
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-sans">
              <span className="flex items-center gap-1 text-[#818CF8]">
                <span className="w-2 h-2 rounded-full bg-[#818CF8]" />
                Sci-Fi
              </span>
              <span className="flex items-center gap-1 text-[#F59E0B]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                Drama
              </span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Animation
              </span>
            </div>
          </div>

          {/* SVG Map */}
          <div className="w-full flex justify-center bg-neutral-950/90 rounded border border-neutral-900 p-2 overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full max-w-[560px] h-auto"
            >
              {/* Subtle coordinate grid lines */}
              <line
                x1={20}
                y1={svgHeight / 2}
                x2={svgWidth - 20}
                y2={svgHeight / 2}
                stroke="#222"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={svgWidth / 2}
                y1={20}
                x2={svgWidth / 2}
                y2={svgHeight - 20}
                stroke="#222"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Profile Converging Arrows (Stage: Profile) */}
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
                          stroke="#A855F7"
                          strokeWidth="1.8"
                          strokeDasharray="3 3"
                        />
                        {/* Midpoint weighted marker */}
                        <circle
                          cx={(mx + px) / 2}
                          cy={(my + py) / 2}
                          r="2.5"
                          fill="#C084FC"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Vector & Schematic Angle Arc (Stage: Compare) */}
              {activeCandidateId && (
                (() => {
                  const candidateCoord = coordinates2D[activeCandidateId];
                  if (!candidateCoord) return null;
                  const px = toPxX(profileCoord.x);
                  const py = toPxY(profileCoord.y);
                  const cx = toPxX(candidateCoord.x);
                  const cy = toPxY(candidateCoord.y);

                  // Angle calculation for schematic arc
                  const dx = cx - px;
                  const dy = cy - py;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                  const arcRadius = Math.min(36, dist * 0.4);

                  // Vector line from Profile to Candidate
                  return (
                    <g key="compare-vectors">
                      {/* Line from profile to candidate */}
                      <line
                        x1={px}
                        y1={py}
                        x2={cx}
                        y2={cy}
                        stroke="#E50914"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Schematic angle arc around profile node */}
                      <circle
                        cx={px}
                        cy={py}
                        r={arcRadius}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />

                      {/* Schematic angle label */}
                      <text
                        x={(px + cx) / 2 + 10}
                        y={(py + cy) / 2 - 8}
                        fill="#FBBF24"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="bg-neutral-900"
                      >
                        θ = {currentStep?.kind === "compare" ? currentStep.payload.angleDeg : ""}°
                      </text>
                    </g>
                  );
                })()
              )}

              {/* Movie Nodes (All 14) */}
              {MOVIES.map((movie) => {
                const coord = coordinates2D[movie.id];
                if (!coord) return null;

                const cx = toPxX(coord.x);
                const cy = toPxY(coord.y);
                const genreColor = getGenreColor(movie.genres);
                const isCold = Boolean(movie.cold);
                const isCandidate = activeCandidateId === movie.id;
                const isLiked = isProfileActive && likedMovieIds.has(movie.id);
                const isTopRanked = isRankActive && topRankedMovieIds.has(movie.id);
                const comparedInfo = comparedMap.get(movie.id);

                return (
                  <g key={movie.id} className="transition-all cursor-pointer">
                    {/* Top-5 Rank Pulse Glow */}
                    {isTopRanked && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="14"
                        fill="none"
                        stroke="#E50914"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: "8s" }}
                      />
                    )}

                    {/* Active Candidate Ring */}
                    {isCandidate && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        fill="none"
                        stroke="#E50914"
                        strokeWidth="2"
                      />
                    )}

                    {/* Profile Liked Item Ring */}
                    {isLiked && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="11"
                        fill="none"
                        stroke="#A855F7"
                        strokeWidth="2"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isCold ? 7 : isCandidate ? 7 : 5.5}
                      fill={isCold ? "#F59E0B" : genreColor}
                      stroke={isCandidate ? "#FFFFFF" : isCold ? "#FBBF24" : "#171717"}
                      strokeWidth={isCandidate ? 2 : 1}
                    />

                    {/* Movie Title Label */}
                    <text
                      x={cx}
                      y={cy + 14}
                      fill={isCandidate ? "#FFFFFF" : isCold ? "#FBBF24" : "#D4D4D4"}
                      fontSize={isCandidate ? "10" : "8.5"}
                      fontWeight={isCandidate || isCold ? "bold" : "normal"}
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {movie.title.length > 12 ? movie.title.slice(0, 11) + "…" : movie.title}
                    </text>

                    {/* Cold Movie Badge: NEW · 0 ratings */}
                    {isCold && (
                      <g>
                        <rect
                          x={cx - 36}
                          y={cy - 20}
                          width="72"
                          height="13"
                          rx="3"
                          fill="#78350F"
                          stroke="#F59E0B"
                          strokeWidth="0.8"
                        />
                        <text
                          x={cx}
                          y={cy - 11}
                          fill="#FEF3C7"
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          NEW · 0 ratings
                        </text>
                      </g>
                    )}

                    {/* Previously Compared Cosine Badge */}
                    {comparedInfo && !isCandidate && (
                      <g>
                        <rect
                          x={cx + 7}
                          y={cy - 12}
                          width="34"
                          height="11"
                          rx="2"
                          fill="#171717"
                          stroke="#404040"
                          strokeWidth="0.8"
                        />
                        <text
                          x={cx + 24}
                          y={cy - 4}
                          fill="#A3A3A3"
                          fontSize="7.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
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
                  <circle
                    cx={toPxX(profileCoord.x)}
                    cy={toPxY(profileCoord.y)}
                    r="8"
                    fill="#E50914"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <circle
                    cx={toPxX(profileCoord.x)}
                    cy={toPxY(profileCoord.y)}
                    r="13"
                    fill="none"
                    stroke="#E50914"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={toPxX(profileCoord.x)}
                    y={toPxY(profileCoord.y) - 15}
                    fill="#E50914"
                    fontSize="9.5"
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

          <div className="flex justify-between text-[11px] text-muted font-sans px-1">
            <span>
              * Points are 2D PCA projections of {store.cbResult?.vocabulary.length ?? 112}-dimensional L2-normalized TF-IDF vectors.
            </span>
            <span className="text-amber-400 font-medium">
              Chronopolis (m14) is embedded directly from metadata.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
