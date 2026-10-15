"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MetricsOverview } from "@/components/MetricsOverview";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { AgentTraceViewer } from "@/components/AgentTraceViewer";
import { ValidationCard } from "@/components/ValidationCard";
import { ErpStateInspector } from "@/components/ErpStateInspector";
import { HitlModal } from "@/components/HitlModal";
import { EvaluationModal } from "@/components/EvaluationModal";

import { SCENARIO_PRESETS } from "@/data/scenarioPresets";
import {
  AgentExecutionResponse,
  ScenarioDefinition,
  HitlTicket,
} from "@/types/supplyChain";
import { ErpState } from "@/data/mockErpDatabase";
import { FullBenchmarkReport } from "@/services/evaluationService";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("DS-BOG-01");
  const [activeScenarioId, setActiveScenarioId] = useState<string>("scenario-1");
  const [erpState, setErpState] = useState<ErpState | null>(null);
  const [agentResponse, setAgentResponse] = useState<AgentExecutionResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // HITL escalation modal state
  const [activeHitlTicket, setActiveHitlTicket] = useState<HitlTicket | null>(null);
  const [isSubmittingHitl, setIsSubmittingHitl] = useState<boolean>(false);

  // Benchmark Modal state
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [benchmarkReport, setBenchmarkReport] = useState<FullBenchmarkReport | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);

  // Fetch initial ERP state
  const fetchErpState = async () => {
    try {
      const res = await fetch("/api/erp/state");
      if (res.ok) {
        const data = await res.json();
        setErpState(data);
      }
    } catch (err) {
      console.error("Failed to load ERP state:", err);
    }
  };

  useEffect(() => {
    fetchErpState();
  }, []);

  // Handle Scenario selection
  const handleSelectScenario = (scenario: ScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    setSelectedNodeId(scenario.targetNodeId);
  };

  // Run Agent
  const handleRunAgent = async (params: {
    scenarioId: string;
    sku: string;
    nodeId: string;
    recommendedQty: number;
    supplierId: string;
    customPrompt?: string;
  }) => {
    setIsRunning(true);
    setAgentResponse(null);

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Execution failed with status ${res.status}`);
      }

      const data: AgentExecutionResponse = await res.json();
      setAgentResponse(data);

      // If escalation ticket was created, open HITL modal
      if (data.escalationTicket) {
        setActiveHitlTicket(data.escalationTicket);
      }

      // Refresh ERP state to reflect any new POs or mutations
      await fetchErpState();
    } catch (err: any) {
      alert(`Error executing agent: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Reset ERP
  const handleResetErp = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/erp/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      await fetchErpState();
      setAgentResponse(null);
      setActiveHitlTicket(null);
    } finally {
      setIsResetting(false);
    }
  };

  // Run Benchmark Suite
  const handleRunBenchmark = async (): Promise<FullBenchmarkReport> => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch("/api/evaluate");
      const data: FullBenchmarkReport = await res.json();
      setBenchmarkReport(data);
      await fetchErpState();
      return data;
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Handle HITL Approval
  const handleApproveHitl = async (chosenOptionId: string, comments: string) => {
    if (!activeHitlTicket) return;
    setIsSubmittingHitl(true);
    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeHitlTicket.ticketId,
          chosenOptionId,
          sku: activeHitlTicket.sku,
          nodeId: activeHitlTicket.nodeId,
          comments,
        }),
      });

      if (res.ok) {
        setActiveHitlTicket(null);
        await fetchErpState();
      }
    } finally {
      setIsSubmittingHitl(false);
    }
  };

  const activeNode = erpState?.nodes.find((n) => n.id === selectedNodeId);
  const activePOs = erpState?.purchaseOrders.filter((p) => p.nodeId === selectedNodeId) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onResetErp={handleResetErp}
        isResetting={isResetting}
        benchmarkScore={benchmarkReport ? benchmarkReport.averageScorePct : null}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Node Metrics Strip */}
        <MetricsOverview
          node={activeNode}
          openPOs={activePOs}
          inventory={erpState?.inventory || []}
        />

        {/* Scenario Selector & Launcher */}
        <ScenarioSelector
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          onRunAgent={handleRunAgent}
          isRunning={isRunning}
          selectedNodeId={selectedNodeId}
        />

        {/* Workspace Split Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: ReAct Reasoning Trace (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <AgentTraceViewer
              trace={agentResponse?.trace || []}
              isRunning={isRunning}
            />

            {/* Live Database Inspector */}
            <ErpStateInspector
              erpState={erpState}
              selectedNodeId={selectedNodeId}
            />
          </div>

          {/* Right Column: Decision, Guardrails & Impact (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Agent Decision Summary Card */}
            {agentResponse ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden relative">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#FF441F]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Autonomous Decision Outcome
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {agentResponse.executionTimeMs}ms latency
                  </span>
                </div>

                {/* Big Decision Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Verdict
                    </span>
                    <span
                      className={`text-lg font-black tracking-tight px-3 py-1 rounded-lg inline-block mt-0.5 ${
                        agentResponse.decision === "ACCEPT"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : agentResponse.decision === "MODIFY"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : agentResponse.decision === "SPLIT_SUPPLIERS"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : "bg-red-100 text-red-900 border border-red-300"
                      }`}
                    >
                      {agentResponse.decision}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Final Decided Qty
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      {agentResponse.finalDecidedQty.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-500">units</span>
                    </span>
                  </div>
                </div>

                {/* Quantity comparison bar */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Initial Recommendation: <strong>{agentResponse.initialRecommendationQty} units</strong></span>
                    <span>Final Executed: <strong>{agentResponse.finalDecidedQty} units</strong></span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-slate-400 h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (agentResponse.initialRecommendationQty /
                            Math.max(agentResponse.initialRecommendationQty, agentResponse.finalDecidedQty)) *
                            100
                        )}%`,
                      }}
                    />
                    <div
                      className="bg-orange-500 h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (agentResponse.finalDecidedQty /
                            Math.max(agentResponse.initialRecommendationQty, agentResponse.finalDecidedQty)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Cost</span>
                    <span className="text-sm font-bold text-slate-900">
                      ${agentResponse.totalOrderCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Volume Occupied</span>
                    <span className="text-sm font-bold text-slate-900">
                      {agentResponse.totalOrderVolumeM3.toFixed(2)} m³
                    </span>
                  </div>
                </div>

                {/* Rationale explanation */}
                <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-lg text-xs text-slate-700 leading-relaxed mb-2">
                  <strong className="block text-slate-900 font-bold mb-0.5">Decision Rationale:</strong>
                  {agentResponse.rationale}
                </div>

                {/* Feedback cycle counter */}
                {agentResponse.feedbackLoopCycles > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 mt-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Self-healing feedback loop resolved constraint violations in {agentResponse.feedbackLoopCycles} retry cycle(s).
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 text-xs">
                Awaiting agent execution to generate decision analysis and guardrail verification.
              </div>
            )}

            {/* Supply Chain Guardrail Verification Card */}
            <ValidationCard
              validationResult={agentResponse?.validationResult}
              decision={agentResponse?.decision}
            />
          </div>
        </div>
      </main>

      {/* Human-In-The-Loop Approval Modal */}
      {activeHitlTicket && (
        <HitlModal
          ticket={activeHitlTicket}
          onApprove={handleApproveHitl}
          onDismiss={() => setActiveHitlTicket(null)}
          isSubmitting={isSubmittingHitl}
        />
      )}

      {/* Evaluation Benchmark Modal */}
      <EvaluationModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        onRunBenchmark={handleRunBenchmark}
        benchmarkReport={benchmarkReport}
        isRunningBenchmark={isRunningBenchmark}
      />
    </div>
  );
}
