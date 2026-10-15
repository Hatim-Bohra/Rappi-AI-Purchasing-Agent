"use client";

import React, { useState } from "react";
import { FullBenchmarkReport } from "../services/evaluationService";
import { ShieldCheck, CheckCircle2, XCircle, RotateCw, X, Award, BarChart3 } from "lucide-react";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunBenchmark: () => Promise<FullBenchmarkReport>;
  benchmarkReport: FullBenchmarkReport | null;
  isRunningBenchmark: boolean;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  onRunBenchmark,
  benchmarkReport,
  isRunningBenchmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  Evaluation Suite
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Rappi Assignment Matrix
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Automated Test Scenarios & Decision Quality
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Stats Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs text-slate-500">Benchmark Performance:</span>
            {benchmarkReport ? (
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-lg font-black text-slate-900">
                  {benchmarkReport.passedScenarios}/{benchmarkReport.totalScenarios} Passed
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {benchmarkReport.overallPassRatePct}% Pass Rate
                </span>
                <span className="text-xs text-slate-400">
                  Runtime: {benchmarkReport.totalExecutionTimeMs}ms
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Benchmark not yet run. Click &quot;Run Benchmark Suite&quot; to test all 5 scenarios.
              </p>
            )}
          </div>

          <button
            onClick={onRunBenchmark}
            disabled={isRunningBenchmark}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all disabled:bg-slate-300"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunningBenchmark ? "animate-spin" : ""}`} />
            <span>{isRunningBenchmark ? "Evaluating Scenarios..." : "Run Benchmark Suite"}</span>
          </button>
        </div>

        {/* Benchmark Results Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {benchmarkReport ? (
            benchmarkReport.scenarios.map((res) => (
              <div
                key={res.scenarioId}
                className={`p-4 rounded-xl border text-xs ${
                  res.passed
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-red-50/50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {res.scenarioTitle}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Expected: <strong>{res.agentResponse.decision}</strong> • Decided Qty: {res.agentResponse.finalDecidedQty} units
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border">
                    {res.score}% Score
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 my-2">
                  <strong>Agent Rationale:</strong> {res.agentResponse.rationale}
                </p>

                {/* Criteria Checks list */}
                <div className="space-y-1.5 mt-2">
                  {res.criteriaChecks.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      {c.passed ? (
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold shrink-0">✗</span>
                      )}
                      <div>
                        <span className={c.passed ? "text-slate-700" : "text-red-700 font-semibold"}>
                          {c.criterion}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {c.details}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Click &quot;Run Benchmark Suite&quot; above to execute the automated evaluation test harness.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
