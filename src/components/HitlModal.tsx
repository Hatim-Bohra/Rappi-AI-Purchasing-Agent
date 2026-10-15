"use client";

import React, { useState } from "react";
import { HitlTicket } from "../types/supplyChain";
import { UserCheck, AlertOctagon, Check, X } from "lucide-react";

interface HitlModalProps {
  ticket: HitlTicket;
  onApprove: (chosenOptionId: string, comments: string) => void;
  onDismiss: () => void;
  isSubmitting: boolean;
}

export const HitlModal: React.FC<HitlModalProps> = ({
  ticket,
  onApprove,
  onDismiss,
  isSubmitting,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    ticket.options[0]?.id || ""
  );
  const [comments, setComments] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Human Approval Required
                </span>
                <span className="text-xs font-mono font-semibold">
                  {ticket.ticketId}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {ticket.scenarioTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 leading-relaxed">
            <strong className="block font-bold mb-1">Autonomous Deadlock Diagnosed:</strong>
            {ticket.reason}
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Buyer Resolution Strategy:
          </label>

          <div className="space-y-2.5 mb-5">
            {ticket.options.map((opt) => {
              const isChecked = selectedOption === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-orange-50/60 border-[#FF441F] ring-1 ring-[#FF441F]"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {opt.title}
                    </span>
                    <input
                      type="radio"
                      checked={isChecked}
                      onChange={() => setSelectedOption(opt.id)}
                      className="accent-[#FF441F] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mb-1.5">
                    {opt.description}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    Impact: {opt.impact}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Buyer Notes / Override Authorization:
            </label>
            <input
              type="text"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Authorized by Shift Buyer - Space reallocation confirmed"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onApprove(selectedOption, comments)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF441F] hover:bg-[#E6310C] shadow-md shadow-orange-500/20 transition-all disabled:bg-slate-300"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Executing Override..." : "Approve & Execute PO"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
