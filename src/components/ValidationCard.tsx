"use client";

import React from "react";
import { ValidationResult } from "../types/supplyChain";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";

interface ValidationCardProps {
  validationResult?: ValidationResult;
  decision?: string;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  validationResult,
  decision,
}) => {
  if (!validationResult) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {validationResult.isValid ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <ShieldX className="w-5 h-5 text-red-600" />
          )}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Supply Chain Guardrail Verification
          </h3>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            validationResult.isValid
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {validationResult.isValid ? "VERIFIED PASSED" : "VIOLATION DETECTED"}
        </span>
      </div>

      <div className="space-y-2">
        {validationResult.checks.map((check) => {
          return (
            <div
              key={check.id}
              className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                check.passed
                  ? "bg-slate-50/70 border-slate-200"
                  : check.severity === "WARNING"
                  ? "bg-amber-50/70 border-amber-200 text-amber-900"
                  : "bg-red-50/70 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-start gap-2">
                {check.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : check.severity === "WARNING" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-slate-800 block">{check.name}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {check.message}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">
                  Req: {check.expected}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold block ${
                    check.passed ? "text-slate-700" : "text-red-700"
                  }`}
                >
                  Act: {check.actual}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested correction banner if failed */}
      {!validationResult.isValid && validationResult.suggestedCorrection && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
          <span className="font-bold text-amber-900 block mb-1">
            Autonomous Feedback Loop Action: {validationResult.suggestedCorrection.action}
          </span>
          <p className="text-amber-800 text-[11px]">
            {validationResult.suggestedCorrection.reason}
          </p>
        </div>
      )}
    </div>
  );
};
