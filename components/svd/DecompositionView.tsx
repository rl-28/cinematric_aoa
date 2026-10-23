"use client";

import React from "react";
import { motion } from "framer-motion";

interface DecompositionViewProps {
  U: number[][];
  s: number[];
  V: number[][];
  truncateK?: number;
}

export const DecompositionView: React.FC<DecompositionViewProps> = ({
  U,
  s,
  V,
  truncateK,
}) => {
  const maxSingularValue = Math.max(...s, 1);
  const rowsU = U.length; // 10
  const colsU = U[0]?.length ?? 13; // 13
  const lenS = s.length; // 13
  const rowsV = V.length; // 13
  const colsV = V[0]?.length ?? 13; // 13

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded border border-neutral-800 text-xs font-sans">
      {/* Mathematical Identity Equation Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold font-mono text-sm">
            A<sub className="text-[10px] text-muted">{rowsU}×{rowsV}</sub> ≈ U<sub className="text-[10px] text-muted">{rowsU}×{colsU}</sub> · Σ<sub className="text-[10px] text-muted">{lenS}×{lenS}</sub> · V<sup className="text-[10px] text-muted">T</sup><sub className="text-[10px] text-muted">{rowsV}×{colsV}</sub>
          </span>
        </div>
        <div className="text-muted text-[10px] font-mono">
          Rank {truncateK ? `k = ${truncateK} Truncated` : `Full Rank ${lenS}`}
        </div>
      </div>

      {/* Block Shape Diagram */}
      <div className="flex items-center justify-center gap-3 py-1 font-mono">
        {/* Matrix U */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-muted font-sans font-medium">U (User Basis)</div>
          <div
            className={`relative rounded border transition-colors flex flex-col justify-between p-1.5 ${
              truncateK ? "border-accent/80 bg-accent/10" : "border-neutral-700 bg-neutral-900/60"
            }`}
            style={{ width: "84px", height: "105px" }}
          >
            <div className="flex justify-between text-[9px] text-neutral-400">
              <span>u₁</span>
              <span>k={colsU}</span>
            </div>
            <div className="text-center text-[10px] font-bold text-white">
              {rowsU} × {colsU}
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500">
              <span>u_{rowsU}</span>
              <span className="text-accent">{truncateK ? `k=${truncateK}` : ""}</span>
            </div>
          </div>
        </div>

        <div className="text-neutral-500 text-base font-bold">×</div>

        {/* Matrix Σ */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-muted font-sans font-medium">Σ (Singular Values)</div>
          <div
            className={`relative rounded border transition-colors flex flex-col justify-between p-1.5 ${
              truncateK ? "border-amber-500/80 bg-amber-950/20" : "border-neutral-700 bg-neutral-900/60"
            }`}
            style={{ width: "95px", height: "95px" }}
          >
            <div className="flex justify-between text-[9px] text-neutral-400">
              <span className="text-amber-400 font-bold">σ₁={s[0]?.toFixed(1)}</span>
              <span>0</span>
            </div>
            <div className="text-center text-[10px] font-bold text-white">
              diag(Σ)
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500">
              <span>0</span>
              <span className="text-amber-400 font-bold">σ₂={s[1]?.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="text-neutral-500 text-base font-bold">×</div>

        {/* Matrix V^T */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-muted font-sans font-medium">Vᵀ (Item Basis)</div>
          <div
            className={`relative rounded border transition-colors flex flex-col justify-between p-1.5 ${
              truncateK ? "border-blue-500/80 bg-blue-950/20" : "border-neutral-700 bg-neutral-900/60"
            }`}
            style={{ width: "105px", height: "95px" }}
          >
            <div className="flex justify-between text-[9px] text-neutral-400">
              <span>v₁</span>
              <span>m_{colsV}</span>
            </div>
            <div className="text-center text-[10px] font-bold text-white">
              {rowsV} × {colsV}
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500">
              <span className="text-blue-400">{truncateK ? `k=${truncateK}` : ""}</span>
              <span>m₁</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Singular Values Bar Chart */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800/80">
        <div className="flex justify-between text-[11px] text-neutral-400 font-sans font-medium mb-1">
          <span>Singular Spectrum Energy Distribution (Σ)</span>
          <span className="text-muted">σ₁..σ₁₃</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
          {s.slice(0, 8).map((val, idx) => {
            const isKept = truncateK ? idx < truncateK : true;
            const pct = (val / maxSingularValue) * 100;

            return (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className={`w-6 text-[10px] font-mono ${
                    isKept ? "text-accent font-bold" : "text-neutral-600"
                  }`}
                >
                  σ{idx + 1}
                </span>
                <div className="flex-1 h-3 bg-neutral-900 rounded-sm overflow-hidden flex items-center">
                  <motion.div
                    className={`h-full rounded-sm ${
                      isKept
                        ? "bg-gradient-to-r from-accent to-red-500 shadow-sm shadow-accent/40"
                        : "bg-neutral-700/60 opacity-40"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span
                  className={`w-10 text-[10px] text-right font-mono ${
                    isKept ? "text-neutral-200" : "text-neutral-600"
                  }`}
                >
                  {val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
