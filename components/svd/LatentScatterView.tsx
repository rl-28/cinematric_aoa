"use client";

import React from "react";
import { MOVIES } from "@/lib/data/movies";
import { USERS, TARGET_USER_ID } from "@/lib/data/ratings";

interface LatentScatterViewProps {
  P: number[][]; // 10 x 2
  Q: number[][]; // 13 x 2
  sk: number[];
}

export const LatentScatterView: React.FC<LatentScatterViewProps> = ({
  P,
  Q,
  sk,
}) => {
  // SVG coordinates setup
  const width = 480;
  const height = 320;
  const padding = 36;

  // Determine coordinate bounds for scaling
  let maxAbsX = 0.5;
  let maxAbsY = 0.5;

  for (const row of P) {
    maxAbsX = Math.max(maxAbsX, Math.abs(row[0] ?? 0));
    maxAbsY = Math.max(maxAbsY, Math.abs(row[1] ?? 0));
  }
  for (const row of Q) {
    maxAbsX = Math.max(maxAbsX, Math.abs(row[0] ?? 0));
    maxAbsY = Math.max(maxAbsY, Math.abs(row[1] ?? 0));
  }

  const rangeX = maxAbsX * 1.25;
  const rangeY = maxAbsY * 1.25;

  // Project mathematical (x, y) to SVG (px, py)
  const toSvgX = (x: number) =>
    padding + ((x + rangeX) / (2 * rangeX)) * (width - 2 * padding);
  const toSvgY = (y: number) =>
    height - (padding + ((y + rangeY) / (2 * rangeY)) * (height - 2 * padding));

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  const catalogMovies = MOVIES.filter((m) => !m.cold);
  const coldMovie = MOVIES.find((m) => m.cold);

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface rounded-md border border-neutral-800 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold font-sans text-sm">
            2D Latent Factor Space (k = 2)
          </span>
          <span className="text-[10px] text-muted bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            P = U₂√Σ₂ &nbsp;|&nbsp; Q = V₂√Σ₂
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-sans">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
            Sci-Fi Cluster
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Drama Cluster
          </span>
        </div>
      </div>

      {/* 2D SVG Coordinate Plane */}
      <div className="w-full flex justify-center bg-neutral-950/80 rounded border border-neutral-900 p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[480px] h-auto select-none"
        >
          {/* Grid lines */}
          <line
            x1={padding}
            y1={originY}
            x2={width - padding}
            y2={originY}
            stroke="#262626"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={originX}
            y1={padding}
            x2={originX}
            y2={height - padding}
            stroke="#262626"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Axes labels */}
          <text
            x={width - padding + 5}
            y={originY + 4}
            fill="#737373"
            fontSize="9"
            fontFamily="monospace"
          >
            Factor 1
          </text>
          <text
            x={originX - 10}
            y={padding - 8}
            fill="#737373"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="middle"
          >
            Factor 2
          </text>

          {/* Origin / Cold Start Movie (Chronopolis m14) */}
          <circle cx={originX} cy={originY} r="5" fill="#F59E0B" opacity="0.9" />
          <circle
            cx={originX}
            cy={originY}
            r="10"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={originX + 12}
            y={originY + 3}
            fill="#FBBF24"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {coldMovie?.title ?? "Cold Item"} (Q=[0,0])
          </text>

          {/* Catalog Movies Q_i (diamonds/squares) */}
          {catalogMovies.map((movie, idx) => {
            const qRow = Q[idx];
            if (!qRow) return null;
            const cx = toSvgX(qRow[0]);
            const cy = toSvgY(qRow[1]);
            const isSciFi = movie.genres.includes("Sci-Fi") || movie.genres.includes("Action");

            return (
              <g key={movie.id} className="transition-all cursor-pointer">
                <rect
                  x={cx - 3.5}
                  y={cy - 3.5}
                  width="7"
                  height="7"
                  transform={`rotate(45 ${cx} ${cy})`}
                  fill={isSciFi ? "#F87171" : "#60A5FA"}
                  stroke="#171717"
                  strokeWidth="1"
                />
                <text
                  x={cx + 6}
                  y={cy + 3}
                  fill="#A3A3A3"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {movie.title.slice(0, 8)}
                </text>
              </g>
            );
          })}

          {/* Users P_u (circles) */}
          {USERS.map((user, idx) => {
            const pRow = P[idx];
            if (!pRow) return null;
            const cx = toSvgX(pRow[0]);
            const cy = toSvgY(pRow[1]);
            const isTarget = user.id === TARGET_USER_ID;
            const isCluster1 = user.cluster === "Sci-Fi / Action";

            return (
              <g key={user.id}>
                {isTarget && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="9"
                    fill="none"
                    stroke="#E50914"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isTarget ? "5" : "3.5"}
                  fill={isTarget ? "#E50914" : isCluster1 ? "#EF4444" : "#3B82F6"}
                  stroke="#FFFFFF"
                  strokeWidth={isTarget ? "1.5" : "0.5"}
                />
                <text
                  x={cx}
                  y={cy - (isTarget ? 11 : 7)}
                  fill={isTarget ? "#E50914" : "#D4D4D4"}
                  fontSize={isTarget ? "9" : "8"}
                  fontWeight={isTarget ? "bold" : "normal"}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {user.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between text-[11px] text-muted font-sans pt-1">
        <span>* Users and items in Cluster 1 gravitate to top/right quadrant.</span>
        <span className="text-amber-400 font-medium">
          Cold items have zero ratings → Q vector is exactly [0, 0] at origin.
        </span>
      </div>
    </div>
  );
};
