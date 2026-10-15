"use client";

import React, { useState } from "react";
import { AgentStepTrace, ValidationResult } from "../types/supplyChain";
import {
  Brain,
  Wrench,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Clock,
} from "lucide-react";

interface AgentTraceViewerProps {
  trace: AgentStepTrace[];
  isRunning: boolean;
}

export const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({
  trace,
  isRunning,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  if (trace.length === 0 && !isRunning) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
          <Brain className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Agent Engine Idle
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Select one of the 4 benchmark scenarios above and click &quot;Execute Autonomous Agent&quot; to inspect the multi-step investigation, constraint reasoning, and validation feedback loop.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#FF441F]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            ReAct Execution Trace & Reasoning Log
          </h3>
          <span className="text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.2 rounded-full font-semibold">
            {trace.length} steps
          </span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>Agent Reasoning Active...</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3.5 max-h-[580px] overflow-y-auto">
        {trace.map((step) => {
          const isExpanded = !!expandedSteps[step.stepNumber];
          const hasToolCall = !!step.toolCall;
          const isFeedback = step.thought.includes("FEEDBACK LOOP") || step.thought.includes("Self-healing");
          const hasValidation = !!step.validationResult;

          return (
            <div
              key={step.stepNumber}
              className={`rounded-lg border p-3.5 transition-all ${
                isFeedback
                  ? "bg-amber-50/50 border-amber-200"
                  : hasValidation && !step.validationResult?.isValid
                  ? "bg-red-50/30 border-red-200"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isFeedback
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    Step {step.stepNumber}
                  </span>
                  {hasToolCall && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <Wrench className="w-3 h-3" />
                      {step.toolCall!.name}
                    </span>
                  )}
                  {isFeedback && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                      <RotateCcw className="w-3 h-3" />
                      Feedback Loop Auto-Correction
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Thought */}
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {step.thought}
              </p>

              {/* Collapsible Tool Call & Observation */}
              {hasToolCall && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleStep(step.stepNumber)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isExpanded ? "Hide ERP Tool Data" : "Inspect ERP Parameters & Result"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                        <span className="text-slate-400">{"// Parameters passed:"}</span>
                        <pre className="mt-1">{JSON.stringify(step.toolCall!.params, null, 2)}</pre>
                      </div>

                      {step.observation && (
                        <div className="bg-slate-900 text-emerald-300 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                          <span className="text-slate-400">{"// ERP Observation returned:"}</span>
                          <pre className="mt-1">{JSON.stringify(step.observation, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Validation Result Inline Badge */}
              {hasValidation && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <div className={`p-2.5 rounded border text-xs ${
                    step.validationResult!.isValid
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {step.validationResult!.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                      )}
                      <span>{step.validationResult!.summary}</span>
                    </div>

                    {!step.validationResult!.isValid && step.validationResult!.suggestedCorrection && (
                      <p className="text-[11px] text-red-700 mt-1 pl-5">
                        <strong>Correction Prompt:</strong> {step.validationResult!.suggestedCorrection.reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
