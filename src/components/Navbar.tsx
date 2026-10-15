"use client";

import React from "react";
import { Sparkles, RefreshCw, CheckCircle2, ShieldCheck, PlayCircle, Store } from "lucide-react";

interface NavbarProps {
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onOpenBenchmark: () => void;
  onResetErp: () => void;
  isResetting: boolean;
  benchmarkScore: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedNodeId,
  onSelectNode,
  onOpenBenchmark,
  onResetErp,
  isResetting,
  benchmarkScore,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF441F] to-[#FF735C] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <span className="text-xl font-black tracking-tight">R</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Rappi <span className="text-[#FF441F]">AI Purchasing Agent</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-[#C22405] border border-orange-200">
                Quick-Commerce
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Autonomous ReAct Engine • Multi-Constraint Optimization • Feedback Loop
            </p>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Store Node Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Store className="w-4 h-4 text-slate-500 ml-1.5" />
            <select
              value={selectedNodeId}
              onChange={(e) => onSelectNode(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 pr-2 py-1 outline-none cursor-pointer"
            >
              <option value="DS-BOG-01">Chapinero Dark Store (Bogotá)</option>
              <option value="DS-MDE-02">El Poblado Dark Store (Medellín)</option>
            </select>
          </div>

          {/* Benchmark Evaluation Modal Trigger */}
          <button
            onClick={onOpenBenchmark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Benchmark Suite</span>
            {benchmarkScore !== null && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px]">
                {benchmarkScore}%
              </span>
            )}
          </button>

          {/* Reset ERP State */}
          <button
            onClick={onResetErp}
            disabled={isResetting}
            title="Reset Mock ERP to default state"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-orange-500" : ""}`} />
            <span className="hidden sm:inline">Reset State</span>
          </button>
        </div>
      </div>
    </header>
  );
};
