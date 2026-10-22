"use client";

import React from "react";
import { Movie, MOVIES } from "@/lib/data/movies";
import { User, USERS, TARGET_USER_ID } from "@/lib/data/ratings";
import { PredictedCellInfo } from "@/lib/sim/selectors";

interface MatrixGridProps {
  // Mode determines what value to display in each cell
  mode: "raw" | "baseline" | "residual" | "predictions";
  rawMatrix: (number | null)[][];
  residualMatrix?: number[][];
  baseline?: { mu: number; bu: number[]; bi: number[] } | null;
  predictedMap?: Map<string, PredictedCellInfo>;
  activeCell?: { userIdx: number; itemIdx: number; movieId: string } | null;
  highlightTargetUser?: boolean;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  mode,
  rawMatrix,
  residualMatrix,
  baseline,
  predictedMap,
  activeCell,
  highlightTargetUser = true,
}) => {
  const catalogMovies = MOVIES.filter((m) => !m.cold);
  const coldMovie = MOVIES.find((m) => m.cold);

  return (
    <div className="w-full overflow-x-auto select-none font-mono text-xs">
      <div className="inline-block min-w-full">
        {/* Column Headers (Movies) */}
        <div className="flex items-end pb-1 border-b border-neutral-800">
          <div className="w-24 shrink-0 px-2 text-[10px] uppercase tracking-wider text-muted font-sans font-semibold">
            Users \ Movies
          </div>

          {/* 13 Catalog Movies */}
          {catalogMovies.map((m, colIdx) => (
            <div
              key={m.id}
              className={`w-9 shrink-0 text-center py-1 flex flex-col items-center justify-end ${
                activeCell?.itemIdx === colIdx ? "text-accent font-bold" : "text-muted"
              }`}
              title={`${m.title} (${m.year}) - ${m.genres.join(", ")}`}
            >
              <span className="text-[9px] truncate max-w-[34px]">{m.title.slice(0, 3)}</span>
              <span className="text-[8px] text-neutral-500 font-sans">m{colIdx + 1}</span>
              {/* Optional bi baseline bar in baseline mode */}
              {mode === "baseline" && baseline && (
                <div
                  className={`w-1 mt-0.5 rounded-full ${
                    baseline.bi[colIdx] >= 0 ? "bg-emerald-500" : "bg-blue-400"
                  }`}
                  style={{
                    height: `${Math.min(12, Math.max(2, Math.abs(baseline.bi[colIdx]) * 10))}px`,
                  }}
                  title={`b_i: ${baseline.bi[colIdx]?.toFixed(2)}`}
                />
              )}
            </div>
          ))}

          {/* Cold Column (m14) */}
          {coldMovie && (
            <div
              className={`w-11 shrink-0 text-center py-1 border-l border-dashed border-neutral-700/80 bg-neutral-900/40 flex flex-col items-center justify-end ${
                activeCell?.movieId === "m14" ? "text-accent font-bold" : "text-neutral-500"
              }`}
              title="Cold Start Item: 0 ratings in dataset"
            >
              <span className="text-[9px] text-amber-400 font-bold">COLD</span>
              <span className="text-[8px] text-neutral-500 font-sans">m14</span>
            </div>
          )}
        </div>

        {/* Matrix Rows (10 Users) */}
        <div className="flex flex-col divide-y divide-neutral-900/80">
          {USERS.map((user, rowIdx) => {
            const isTarget = user.id === TARGET_USER_ID;
            const isRowActive = activeCell?.userIdx === rowIdx;

            return (
              <div
                key={user.id}
                className={`flex items-center transition-colors duration-150 ${
                  isTarget && highlightTargetUser
                    ? "bg-accent/10 border-y border-accent/40"
                    : isRowActive
                    ? "bg-neutral-800/40"
                    : "hover:bg-neutral-900/40"
                }`}
              >
                {/* User Row Label */}
                <div
                  className="w-24 shrink-0 px-2 py-1 flex items-center justify-between"
                  title={`${user.name} (${user.cluster})`}
                >
                  <span
                    className={`truncate text-[11px] font-sans ${
                      isTarget ? "text-accent font-bold" : "text-neutral-300"
                    }`}
                  >
                    {user.name.split(" ")[0]}
                  </span>
                  {/* bu glyph if in baseline mode */}
                  {mode === "baseline" && baseline && (
                    <span
                      className={`text-[9px] ${
                        baseline.bu[rowIdx] >= 0 ? "text-emerald-400" : "text-blue-400"
                      }`}
                      title={`User bias b_u: ${baseline.bu[rowIdx]?.toFixed(2)}`}
                    >
                      {baseline.bu[rowIdx] >= 0 ? "+" : ""}
                      {baseline.bu[rowIdx]?.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* 13 Catalog Columns */}
                {catalogMovies.map((m, colIdx) => {
                  const rawVal = rawMatrix[rowIdx]?.[colIdx];
                  const resVal = residualMatrix?.[rowIdx]?.[colIdx];
                  const isCellActive =
                    activeCell?.userIdx === rowIdx && activeCell?.itemIdx === colIdx;
                  const predictedInfo =
                    isTarget && predictedMap ? predictedMap.get(m.id) : undefined;

                  // Render Cell content based on mode
                  let cellContent: React.ReactNode = "-";
                  let cellClass = "text-neutral-600 bg-neutral-950/20";

                  if (mode === "raw") {
                    if (rawVal !== null && rawVal !== undefined) {
                      cellContent = rawVal;
                      cellClass =
                        rawVal >= 4
                          ? "text-emerald-400 font-semibold bg-emerald-950/20"
                          : rawVal <= 2
                          ? "text-rose-400 bg-rose-950/20"
                          : "text-neutral-200 bg-neutral-800/30";
                    }
                  } else if (mode === "baseline") {
                    if (rawVal !== null && rawVal !== undefined && baseline) {
                      const basePred = baseline.mu + baseline.bu[rowIdx] + baseline.bi[colIdx];
                      cellContent = basePred.toFixed(1);
                      cellClass = "text-amber-200/90 bg-amber-950/15";
                    } else {
                      cellContent = "·";
                    }
                  } else if (mode === "residual") {
                    if (rawVal !== null && resVal !== undefined) {
                      cellContent = (resVal >= 0 ? "+" : "") + resVal.toFixed(1);
                      cellClass =
                        resVal > 0.05
                          ? "text-accent font-semibold bg-accent/15 border border-accent/30"
                          : resVal < -0.05
                          ? "text-blue-400 bg-blue-950/25 border border-blue-900/40"
                          : "text-neutral-400 bg-neutral-800/20";
                    } else {
                      cellContent = "0.0";
                      cellClass = "text-neutral-600 bg-neutral-900/20";
                    }
                  } else if (mode === "predictions") {
                    if (rawVal !== null && rawVal !== undefined) {
                      cellContent = rawVal;
                      cellClass = "text-neutral-400 bg-neutral-900/30";
                    } else if (predictedInfo) {
                      cellContent = predictedInfo.prediction.toFixed(1);
                      cellClass = isCellActive
                        ? "text-accent font-bold bg-accent/30 ring-2 ring-accent"
                        : "text-amber-300 font-medium bg-amber-950/30 border border-amber-600/40";
                    } else {
                      cellContent = "?";
                      cellClass = "text-neutral-700 bg-neutral-950/40";
                    }
                  }

                  if (isCellActive) {
                    cellClass += " ring-2 ring-accent scale-105 z-10 shadow-lg shadow-accent/20";
                  }

                  return (
                    <div
                      key={m.id}
                      className={`w-9 h-7 shrink-0 flex items-center justify-center rounded-[2px] m-[1px] transition-all duration-200 ${cellClass}`}
                      title={`User: ${user.name}, Movie: ${m.title} ${
                        rawVal !== null ? `(Rating: ${rawVal})` : "(Unrated)"
                      }`}
                    >
                      {cellContent}
                    </div>
                  );
                })}

                {/* Cold Column (m14) */}
                {coldMovie && (
                  <div
                    className={`w-11 h-7 shrink-0 border-l border-dashed border-neutral-700/80 flex items-center justify-center m-[1px] ${
                      activeCell?.userIdx === rowIdx && activeCell?.movieId === "m14"
                        ? "bg-accent/25 text-accent ring-2 ring-accent font-bold"
                        : isTarget && predictedMap?.has("m14")
                        ? "bg-amber-950/25 text-amber-400 font-medium"
                        : "bg-neutral-950/60 text-neutral-600"
                    }`}
                    title={
                      isTarget && predictedMap?.has("m14")
                        ? `Chronopolis fallback prediction: ${predictedMap.get("m14")?.prediction.toFixed(1)}`
                        : "Cold start movie: 0 observed ratings"
                    }
                  >
                    {isTarget && predictedMap?.has("m14")
                      ? predictedMap.get("m14")?.prediction.toFixed(1)
                      : "∅"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
