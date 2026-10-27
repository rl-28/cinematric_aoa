"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOVIES, Movie } from "@/lib/data/movies";
import { USERS, TRAIN_RATINGS, Rating, User } from "@/lib/data/ratings";
import { runSvd } from "@/lib/engines/svd";
import { runContent } from "@/lib/engines/content";
import { SvdRunOutput, ContentRunOutput, SvdRecommendation, ContentRecommendation } from "@/lib/engines/types";

export default function InteractivePlayground() {
  // State for user ratings: map from movieId -> rating (1 to 5)
  // Start empty so user can freely select ANY movies they want!
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // Filter state for movie search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");

  // Active result tab
  const [activeResultTab, setActiveResultTab] = useState<"head2head" | "svd" | "cb">("head2head");

  // Simulation execution results
  const [simResults, setSimResults] = useState<{
    svdOut: SvdRunOutput;
    cbOut: ContentRunOutput;
    userBias: number;
    userFactor: [number, number];
  } | null>(null);

  // Available unique genres
  const allGenres = useMemo(() => {
    const s = new Set<string>();
    MOVIES.forEach((m) => m.genres.forEach((g) => s.add(g)));
    return ["All", ...Array.from(s).sort()];
  }, []);

  // Filtered movies based on search & genre
  const filteredMovies = useMemo(() => {
    return MOVIES.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === "All" || m.genres.includes(selectedGenre);

      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  // Set or update rating for a movie
  const setRating = (movieId: string, rating: number) => {
    setUserRatings((prev) => ({
      ...prev,
      [movieId]: rating,
    }));
    setSimResults(null);
  };

  // Toggle selection on card click
  const toggleSelectMovie = (movieId: string) => {
    setUserRatings((prev) => {
      const copy = { ...prev };
      if (copy[movieId] !== undefined) {
        delete copy[movieId]; // Deselect
      } else {
        copy[movieId] = 5; // Select and default to 5 stars
      }
      return copy;
    });
    setSimResults(null);
  };

  // Remove rating
  const removeRating = (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUserRatings((prev) => {
      const copy = { ...prev };
      delete copy[movieId];
      return copy;
    });
    setSimResults(null);
  };

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === "scifi") {
      setUserRatings({ m1: 5, m3: 5, m2: 5, m4: 4 });
    } else if (presetName === "drama") {
      setUserRatings({ m9: 5, m7: 5, m8: 4, m10: 4 });
    } else if (presetName === "nolan") {
      setUserRatings({ m1: 5, m3: 5, m5: 5 });
    } else if (presetName === "clear") {
      setUserRatings({});
    }
    setSimResults(null);
  };

  // Run the simulation dynamically on the user's custom ratings
  const handleRunSimulation = () => {
    const ratedCount = Object.keys(userRatings).length;
    if (ratedCount === 0) return;

    const customUser: User = { 
      id: "u_custom", 
      name: "You (Custom User)", 
      cluster: "Sci-Fi / Action" 
    };

    // If all ratings are < 4, content engine requires at least 1 rating >= 4 to build profile.
    // Boost highest rated movie to at least 4 for profile weighting if needed
    const ratingsEntries = Object.entries(userRatings);
    const hasHighRating = ratingsEntries.some(([_, r]) => r >= 4);
    const adjustedRatings = { ...userRatings };
    if (!hasHighRating && ratingsEntries.length > 0) {
      // Find highest rating and boost to 4
      const [highestId] = ratingsEntries.sort((a, b) => b[1] - a[1])[0];
      adjustedRatings[highestId] = 4;
    }

    const customRatingsList: Rating[] = [
      ...TRAIN_RATINGS,
      ...Object.entries(adjustedRatings).map(([movieId, rating]) => ({
        userId: "u_custom",
        movieId,
        rating,
      })),
    ];

    // 1. Run actual SVD Engine
    const svdOut = runSvd(
      customRatingsList,
      2,
      "u_custom",
      [...USERS, customUser],
      MOVIES
    );

    // 2. Run actual Content-Based Engine
    const cbOut = runContent(MOVIES, customRatingsList, "u_custom");

    // Extract user bias & user latent vector from SVD payload
    const baselineStep = svdOut.steps.find((s) => s.kind === "baseline");
    const userBias = (baselineStep?.payload as { bu?: number[] })?.bu?.[USERS.length] ?? 0;

    const truncateStep = svdOut.steps.find((s) => s.kind === "truncate");
    const pMatrix = (truncateStep?.payload as { P?: number[][] })?.P ?? [];
    const userFactor: [number, number] = pMatrix[USERS.length]
      ? [pMatrix[USERS.length][0], pMatrix[USERS.length][1]]
      : [0, 0];

    setSimResults({
      svdOut,
      cbOut,
      userBias,
      userFactor,
    });
  };

  const selectedMovieIds = Object.keys(userRatings);
  const ratedMovieCount = selectedMovieIds.length;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#141414] border-b border-neutral-800 shrink-0 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-accent font-black tracking-wider text-base font-sans hover:opacity-80 transition-opacity"
          >
            CINEMETRIC
          </Link>
          <span className="text-neutral-700 font-mono">/</span>
          <h1 className="text-white font-bold text-sm tracking-wide">
            Interactive User Sandbox
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/simulate"
            className="text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <span>← Back to Curated Recommender Lab</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-neutral-900 via-surface to-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-950/60 text-accent border border-accent/40 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold">
                  Custom User Simulation
                </span>
                <span className="text-xs text-neutral-400">Choose Any Movies You Like</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Select Your Favorite Movies & Calculate Recommendations
              </h2>
            </div>

            {/* Quick Taste Presets */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-muted text-xs mr-1">Load Preset:</span>
              <button
                type="button"
                onClick={() => applyPreset("scifi")}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-neutral-700 cursor-pointer flex items-center gap-1.5"
              >
                <span>Sci-Fi Fan</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("drama")}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-neutral-700 cursor-pointer flex items-center gap-1.5"
              >
                <span>Drama / Romance</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("nolan")}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-neutral-700 cursor-pointer flex items-center gap-1.5"
              >
                <span>Nolan Fan</span>
              </button>
              {ratedMovieCount > 0 && (
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="bg-red-950/40 hover:bg-red-950/80 text-red-300 px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-red-900/60 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <p className="text-neutral-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Click on <strong>any movie card below</strong> to select it and choose your rating (1 to 5 stars). You can pick as many movies as you want! When ready, click <strong>Calculate Recommendations</strong> to run both Collaborative Filtering (SVD) and Content-Based Filtering on your personalized taste profile.
          </p>

          {/* Tray of Currently Selected Movies */}
          {ratedMovieCount > 0 ? (
            <div className="mt-2 pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Your Selected Movies ({ratedMovieCount}):
                </span>
                <span className="text-[11px] text-muted">Click ✕ to remove any movie</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedMovieIds.map((id) => {
                  const m = MOVIES.find((movie) => movie.id === id);
                  const rating = userRatings[id];
                  if (!m) return null;

                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-2 bg-neutral-800/90 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs shadow-sm hover:border-neutral-600 transition-all"
                    >
                      <span className="font-semibold text-white">{m.title}</span>
                      <span className="text-amber-400 font-mono font-bold">★{rating}</span>
                      <button
                        type="button"
                        onClick={(e) => removeRating(id, e)}
                        className="text-neutral-400 hover:text-red-400 font-bold ml-1 text-sm leading-none cursor-pointer p-0.5"
                        title="Remove movie"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-3 border-t border-neutral-800/80 text-xs text-neutral-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>No movies selected yet. Click any movie card in the catalog below to add it to your profile!</span>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* Section 1: Movie Catalog Search & Rating Grid             */}
        {/* ======================================================== */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Movie Catalog ({MOVIES.length} Titles Available)
              </h3>
            </div>

            {/* Search Input & Genre Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search title, director, genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1a] border border-neutral-700 text-xs text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-accent w-48 sm:w-60 placeholder-neutral-500"
              />

              <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
                {allGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenre(g)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      selectedGenre === g
                        ? "bg-accent text-white font-semibold"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Movie Cards Grid: ENTIRE CARD IS CLICKABLE AND EASY TO SELECT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredMovies.map((movie) => {
              const currentRating = userRatings[movie.id];
              const isSelected = currentRating !== undefined;

              return (
                <div
                  key={movie.id}
                  onClick={() => toggleSelectMovie(movie.id)}
                  className={`group relative flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? "bg-gradient-to-b from-neutral-900 to-neutral-900/90 border-accent shadow-lg shadow-accent/10 ring-2 ring-accent/40"
                      : "bg-[#141414] border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/40"
                  }`}
                >
                  {/* Selected Indicator Badge in Top Right */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow font-mono">
                      Selected ★{currentRating}
                    </span>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-1 pr-16">
                      <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-snug">
                        {movie.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <span>{movie.year}</span>
                      <span>&bull;</span>
                      <span className="truncate">Dir: {movie.director}</span>
                    </div>

                    {/* Genre Tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {movie.genres.map((g) => (
                        <span
                          key={g}
                          className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700/50"
                        >
                          {g}
                        </span>
                      ))}
                      {movie.cold && (
                        <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                          Cold-Start (0 Ratings)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating Selector: Click specific star or button to choose rating */}
                  <div
                    className="mt-3.5 pt-2.5 border-t border-neutral-800 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()} // Prevent card toggle when clicking stars
                  >
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {isSelected ? "Rating:" : "Click to select:"}
                    </span>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(movie.id, star)}
                          className={`text-base px-0.5 transition-transform hover:scale-125 cursor-pointer leading-none ${
                            isSelected && star <= currentRating
                              ? "text-amber-400 font-bold"
                              : "text-neutral-600 hover:text-amber-300"
                          }`}
                          title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Action Bar / Run Simulation Button */}
          <div className="sticky bottom-4 z-30 mt-3 bg-surface/95 backdrop-blur-md border border-neutral-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg font-mono transition-colors ${
                ratedMovieCount > 0
                  ? "bg-accent text-white shadow-lg shadow-accent/30"
                  : "bg-neutral-800 text-neutral-400"
              }`}>
                {ratedMovieCount}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {ratedMovieCount === 0
                    ? "Click on any movie cards above to select them"
                    : `${ratedMovieCount} movie${ratedMovieCount > 1 ? "s" : ""} selected for your custom taste profile`}
                </span>
                <span className="text-xs text-neutral-400">
                  {ratedMovieCount === 0
                    ? "Select at least 1 movie to run the simulation."
                    : "Ready! Click Calculate Recommendations to see SVD and Content-Based predictions for your exact movies."}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={ratedMovieCount === 0}
              onClick={handleRunSimulation}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center gap-2 ${
                ratedMovieCount > 0
                  ? "bg-accent hover:bg-red-600 text-white shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Calculate Recommendations for My Selection</span>
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* Section 2: Interactive Simulation Results Display        */}
        {/* ======================================================== */}
        {simResults && (
          <section className="flex flex-col gap-4 mt-2 pt-6 border-t border-neutral-800">
            {/* Results Header with Tab Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Calculated for Your Selection ({ratedMovieCount} Rated Movies)
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  Recommendation Results & Mathematical Breakdown
                </h3>
              </div>

              {/* Result Tabs */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveResultTab("head2head")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    activeResultTab === "head2head"
                      ? "bg-accent text-white shadow"
                      : "text-muted hover:text-white"
                  }`}
                >
                  Top Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab("svd")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    activeResultTab === "svd"
                      ? "bg-neutral-800 text-white shadow border border-neutral-700"
                      : "text-muted hover:text-white"
                  }`}
                >
                  SVD Matrix Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResultTab("cb")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    activeResultTab === "cb"
                      ? "bg-blue-600 text-white shadow"
                      : "text-muted hover:text-white"
                  }`}
                >
                  Content-Based Vector Math
                </button>
              </div>
            </div>

            {/* TAB 1: HEAD-TO-HEAD TOP-5 COMPARISON */}
            {activeResultTab === "head2head" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SVD Recommendations Card */}
                <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <h4 className="text-sm font-bold text-white">
                        SVD Collaborative Filtering Top-5
                      </h4>
                    </div>
                    <span className="text-[10px] text-muted font-mono">
                      Predicts Rating (1.0 - 5.0)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {simResults.svdOut.result.userRecommendations.slice(0, 5).map((rec: SvdRecommendation, idx: number) => {
                      const movieObj = MOVIES.find((m) => m.id === rec.movieId);
                      return (
                        <div
                          key={rec.movieId}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs font-bold font-mono">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">
                                {rec.title}
                              </span>
                              <span className="text-[10px] text-muted">
                                {movieObj?.genres.join(", ") ?? "Catalog Item"} &bull; Dir: {movieObj?.director}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className="text-xs font-bold text-accent font-mono">
                              ★ {rec.score.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-muted">Predicted Score</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SVD Cold-Start Callout */}
                  <div className="mt-2 p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-200/90 font-sans leading-relaxed">
                    <strong className="text-amber-400 font-semibold">Cold-Start Note:</strong> SVD excluded <em>Chronopolis (2026)</em> from recommendations because it has zero ratings in the catalog, meaning collaborative matrix factorization cannot compute an item factor vector for it.
                  </div>
                </div>

                {/* Content-Based Recommendations Card */}
                <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <h4 className="text-sm font-bold text-white">
                        Content-Based Filtering Top-5
                      </h4>
                    </div>
                    <span className="text-[10px] text-muted font-mono">
                      Cosine Match (0.0 - 1.0)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {simResults.cbOut.result.recommendations.slice(0, 5).map((rec: ContentRecommendation, idx: number) => {
                      const movieObj = MOVIES.find((m) => m.id === rec.movieId);
                      const angle = Math.acos(Math.max(-1, Math.min(1, rec.score))) * (180 / Math.PI);

                      return (
                        <div
                          key={rec.movieId}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 flex items-center justify-center text-xs font-bold font-mono">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">
                                  {rec.title}
                                </span>
                                {rec.isCold && (
                                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                                    Cold-Start Item
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted">
                                {movieObj?.genres.join(", ") ?? "Catalog Item"} &bull; Dir: {movieObj?.director}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className="text-xs font-bold text-blue-400 font-mono">
                              cos = {rec.score.toFixed(4)}
                            </span>
                            <span className="text-[9px] text-muted font-mono">
                              θ = {angle.toFixed(1)}°
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Content-Based Cold-Start Callout */}
                  <div className="mt-2 p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs text-blue-200/90 font-sans leading-relaxed">
                    <strong className="text-blue-400 font-semibold">Cold-Start Advantage:</strong> Content-Based was able to evaluate <em>Chronopolis</em> immediately from its director and genre metadata tokens, scoring it against your taste profile without needing any user ratings!
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SVD DETAILED CALCULATION FOR THIS USER */}
            {activeResultTab === "svd" && (
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      How SVD Collaborative Filtering Processed Your Ratings
                    </h4>
                    <span className="text-xs text-muted">
                      Full step-by-step mathematical breakdown for your profile
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-accent/20 text-accent px-2.5 py-1 rounded-lg border border-accent/40 font-bold">
                    User Bias b_you = {simResults.userBias >= 0 ? "+" : ""}{simResults.userBias.toFixed(3)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface border border-neutral-800 flex flex-col gap-1.5">
                    <span className="text-[10px] text-muted uppercase font-mono">1. User Bias Calculation</span>
                    <span className="text-xs font-bold text-white font-mono">
                      b_you = (1/|I|) ∑ (R_{"{you,i}"} - μ - b_i)
                    </span>
                    <span className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Computed as <strong className="text-emerald-400">{simResults.userBias.toFixed(3)}</strong>. Captures your rating tendency relative to catalog average (μ = 4.01).
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-neutral-800 flex flex-col gap-1.5">
                    <span className="text-[10px] text-muted uppercase font-mono">2. 2D Latent Factor Vector</span>
                    <span className="text-xs font-bold text-white font-mono">
                      P_you = [{simResults.userFactor[0].toFixed(3)}, {simResults.userFactor[1].toFixed(3)}]
                    </span>
                    <span className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Your taste compressed into 2 latent dimensions via low-rank SVD projection (k = 2).
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-neutral-800 flex flex-col gap-1.5">
                    <span className="text-[10px] text-muted uppercase font-mono">3. Prediction Formula</span>
                    <span className="text-xs font-bold text-white font-mono">
                      r̂ = μ + b_you + b_i + (P_you · Q_i)
                    </span>
                    <span className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Predictions combine baseline bias with the dot-product similarity to each movie factor Q_i.
                    </span>
                  </div>
                </div>

                {/* Candidate Arithmetic Table */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Candidate Dot-Product Calculations:
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border border-neutral-800 rounded-xl overflow-hidden">
                      <thead className="bg-neutral-900 text-neutral-400 text-[11px] border-b border-neutral-800">
                        <tr>
                          <th className="p-3">Candidate Movie</th>
                          <th className="p-3">Movie Factor Q_i</th>
                          <th className="p-3">Dot Product (P · Q)</th>
                          <th className="p-3">Total Bias</th>
                          <th className="p-3">Final Predicted Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80 bg-surface text-neutral-300">
                        {simResults.svdOut.result.userRecommendations.slice(0, 5).map((rec: SvdRecommendation) => {
                          const dpStep = simResults.svdOut.steps.find(
                            (s) => s.kind === "dot_product" && (s.payload as { movieId?: string }).movieId === rec.movieId
                          );
                          const payload = dpStep?.payload as { qRow?: number[]; runningSum?: number; bias?: number } | undefined;
                          const q1 = payload?.qRow?.[0]?.toFixed(3) ?? "0.000";
                          const q2 = payload?.qRow?.[1]?.toFixed(3) ?? "0.000";
                          const dot = payload?.runningSum?.toFixed(3) ?? "0.000";
                          const bias = payload?.bias?.toFixed(2) ?? "0.00";

                          return (
                            <tr key={rec.movieId} className="hover:bg-neutral-800/40">
                              <td className="p-3 font-sans font-semibold text-white">
                                {rec.title}
                              </td>
                              <td className="p-3 text-neutral-400">[{q1}, {q2}]</td>
                              <td className="p-3 text-amber-300 font-bold">{dot}</td>
                              <td className="p-3 text-neutral-300">{bias}</td>
                              <td className="p-3 text-emerald-400 font-bold">
                                ★ {rec.score.toFixed(2)} / 5.0
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTENT-BASED CALCULATION FOR THIS USER */}
            {activeResultTab === "cb" && (
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      How Content-Based Filtering Built Your Profile Vector
                    </h4>
                    <span className="text-xs text-muted">
                      TF-IDF term weighting and high-dimensional cosine angle math
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-blue-950/60 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-800 font-bold">
                    112 Dimensional Token Space
                  </span>
                </div>

                <div className="p-4 bg-surface rounded-xl border border-neutral-800 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-white">
                    High-Affinity Taste Tokens Extracted from Movies You Selected:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(userRatings).map(([movieId, r]) => {
                      const m = MOVIES.find((movie) => movie.id === movieId);
                      return m ? (
                        <div key={m.id} className="flex flex-wrap gap-1">
                          <span className="text-[10px] bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded border border-neutral-700">
                            dir:{m.director.toLowerCase().replace(/\s+/g, "_")}
                          </span>
                          {m.genres.map((g) => (
                            <span key={g} className="text-[10px] bg-blue-950/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                              genre:{g.toLowerCase()}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <span className="text-[11px] text-muted mt-1 leading-relaxed">
                    Your profile vector u is the normalized weighted centroid of these tokens. Candidate movies are scored by how closely their token vectors align with u.
                  </span>
                </div>

                {/* Candidate Cosine Angle Table */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Candidate Angular Alignment Calculations:
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border border-neutral-800 rounded-xl overflow-hidden">
                      <thead className="bg-neutral-900 text-neutral-400 text-[11px] border-b border-neutral-800">
                        <tr>
                          <th className="p-3">Candidate Movie</th>
                          <th className="p-3">Cosine Similarity cos(θ)</th>
                          <th className="p-3">True Angle θ (Degrees)</th>
                          <th className="p-3">Match Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80 bg-surface text-neutral-300">
                        {simResults.cbOut.result.recommendations.slice(0, 5).map((rec: ContentRecommendation) => {
                          const angle = Math.acos(Math.max(-1, Math.min(1, rec.score))) * (180 / Math.PI);

                          return (
                            <tr key={rec.movieId} className="hover:bg-neutral-800/40">
                              <td className="p-3 font-sans font-semibold text-white flex items-center gap-2">
                                <span>{rec.title}</span>
                                {rec.isCold && (
                                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                                    Cold-Start
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-blue-400 font-bold font-mono">
                                {rec.score.toFixed(4)}
                              </td>
                              <td className="p-3 text-amber-300 font-bold font-mono">
                                {angle.toFixed(1)}°
                              </td>
                              <td className="p-3 font-sans">
                                {rec.score > 0.3
                                  ? "High Similarity (Shared attributes)"
                                  : rec.score > 0.1
                                  ? "Moderate Affinity"
                                  : "Weak Alignment"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
