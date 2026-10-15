"use client";

import React, { useState } from "react";
import { SCENARIO_PRESETS } from "../data/scenarioPresets";
import { ScenarioDefinition } from "../types/supplyChain";
import { Play, Sparkles, SlidersHorizontal, Info } from "lucide-react";

interface ScenarioSelectorProps {
  activeScenarioId: string;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  onRunAgent: (params: {
    scenarioId: string;
    sku: string;
    nodeId: string;
    recommendedQty: number;
    supplierId: string;
    customPrompt?: string;
  }) => void;
  isRunning: boolean;
  selectedNodeId: string;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  activeScenarioId,
  onSelectScenario,
  onRunAgent,
  isRunning,
  selectedNodeId,
}) => {
  const activeScenario =
    SCENARIO_PRESETS.find((s) => s.id === activeScenarioId) || SCENARIO_PRESETS[0];

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customSku, setCustomSku] = useState(activeScenario.targetSku);
  const [customQty, setCustomQty] = useState(activeScenario.initialRecommendedQty);
  const [customSupplier, setCustomSupplier] = useState(activeScenario.initialSupplierId);

  const handleLaunch = () => {
    if (isCustomMode) {
      onRunAgent({
        scenarioId: "custom",
        sku: customSku,
        nodeId: selectedNodeId,
        recommendedQty: customQty,
        supplierId: customSupplier,
      });
    } else {
      onRunAgent({
        scenarioId: activeScenario.id,
        sku: activeScenario.targetSku,
        nodeId: activeScenario.targetNodeId,
        recommendedQty: activeScenario.initialRecommendedQty,
        supplierId: activeScenario.initialSupplierId,
        customPrompt: activeScenario.prompt,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Purchasing Decision Scenarios
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
              Rappi Evaluation Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a benchmark scenario from the assignment or configure custom parameters.
          </p>
        </div>

        <button
          onClick={() => setIsCustomMode(!isCustomMode)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            isCustomMode
              ? "bg-orange-50 border-orange-200 text-[#C22405]"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isCustomMode ? "Use Presets" : "Custom Parameters"}</span>
        </button>
      </div>

      {/* Preset Pills */}
      {!isCustomMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-4">
          {SCENARIO_PRESETS.map((sc, idx) => {
            const isSelected = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-orange-50/70 border-[#FF441F] ring-1 ring-[#FF441F] shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isSelected ? "text-[#C22405]" : "text-slate-500"
                  }`}>
                    Scenario {idx + 1}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    sc.expectedDecision === "MODIFY"
                      ? "bg-amber-100 text-amber-800"
                      : sc.expectedDecision === "SPLIT_SUPPLIERS"
                      ? "bg-purple-100 text-purple-800"
                      : sc.expectedDecision === "ESCALATE_TO_HUMAN"
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {sc.expectedDecision}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {sc.title.split(":")[1]?.trim() || sc.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {sc.description}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        /* Custom inputs */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target SKU</label>
            <select
              value={customSku}
              onChange={(e) => setCustomSku(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-orange-500"
            >
              <option value="ALPIN-MILK-1L">ALPIN-MILK-1L (Milk 1L)</option>
              <option value="COCA-COLA-1.5L">COCA-COLA-1.5L (Coca-Cola 1.5L)</option>
              <option value="AVO-HASS-KG">AVO-HASS-KG (Avocado Hass 1kg)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Proposed Quantity</label>
            <input
              type="number"
              value={customQty}
              onChange={(e) => setCustomQty(Number(e.target.value))}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-orange-500"
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Supplier</label>
            <select
              value={customSupplier}
              onChange={(e) => setCustomSupplier(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md p-2 outline-none focus:border-orange-500"
            >
              <option value="SUP-ALPINA-DIRECT">SUP-ALPINA-DIRECT (Factory Direct)</option>
              <option value="SUP-DISTRI-RAPID">SUP-DISTRI-RAPID (1-Day Fast Spot)</option>
              <option value="SUP-COCA-COLA-BOTTLER">SUP-COCA-COLA-BOTTLER (Bottler Direct)</option>
              <option value="SUP-AGRO-CAMPESINO">SUP-AGRO-CAMPESINO (Produce Union)</option>
            </select>
          </div>
        </div>
      )}

      {/* Description & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-700 font-medium">
              {!isCustomMode ? activeScenario.prompt : "Custom scenario simulation ready."}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
              <span>SKU: <strong className="text-slate-700">{!isCustomMode ? activeScenario.targetSku : customSku}</strong></span>
              <span>•</span>
              <span>Input Qty: <strong className="text-slate-700">{!isCustomMode ? activeScenario.initialRecommendedQty : customQty} units</strong></span>
              <span>•</span>
              <span>Expected Behavior: <strong className="text-slate-700">{!isCustomMode ? activeScenario.expectedDecision : "Autonomous"}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={isRunning}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-md transition-all shrink-0 ${
            isRunning
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#FF441F] to-[#E6310C] hover:from-[#E6310C] hover:to-[#C22405] shadow-orange-500/25 active:scale-[0.99]"
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Investigating & Validating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Execute Autonomous Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
