import { SCENARIO_PRESETS } from "../data/scenarioPresets";
import { erpDb } from "../data/mockErpDatabase";
import { PurchasingAgent } from "../agent/purchasingAgent";
import { AgentExecutionResponse, ScenarioDefinition } from "../types/supplyChain";

export interface ScenarioEvaluationResult {
  scenarioId: string;
  scenarioTitle: string;
  category: string;
  passed: boolean;
  score: number; // 0 to 100
  criteriaChecks: {
    criterion: string;
    passed: boolean;
    details: string;
  }[];
  metrics: {
    decisionCorrectness: boolean;
    informationGatheringScorePct: number;
    constraintCompliancePct: number;
    validationLoopExecuted: boolean;
    feedbackLoopSelfHealed: boolean;
    executionTimeMs: number;
  };
  agentResponse: AgentExecutionResponse;
}

export interface FullBenchmarkReport {
  timestamp: string;
  totalScenarios: number;
  passedScenarios: number;
  overallPassRatePct: number;
  averageScorePct: number;
  totalExecutionTimeMs: number;
  scenarios: ScenarioEvaluationResult[];
}

export class EvaluationService {
  public static async evaluateScenario(
    scenario: ScenarioDefinition
  ): Promise<ScenarioEvaluationResult> {
    // Reset ERP state before each scenario run to ensure isolation
    erpDb.reset();

    // Special condition setup for Scenario 5: restrict node storage to simulate deadlock
    if (scenario.id === "scenario-5") {
      const node = erpDb.getNode(scenario.targetNodeId);
      if (node) {
        node.currentUsedStorageM3 = node.maxStorageCapacityM3 - 0.18; // Only 0.18 m³ free (~150 units of milk)
      }
    }

    const agentResponse = await PurchasingAgent.execute({
      scenarioId: scenario.id,
      sku: scenario.targetSku,
      nodeId: scenario.targetNodeId,
      recommendedQty: scenario.initialRecommendedQty,
      supplierId: scenario.initialSupplierId,
      customPrompt: scenario.prompt,
    });

    const criteriaChecks: ScenarioEvaluationResult["criteriaChecks"] = [];

    // Criterion 1: Decision Correctness
    const isDecisionCorrect = agentResponse.decision === scenario.expectedDecision;
    criteriaChecks.push({
      criterion: `Decision matches expected (${scenario.expectedDecision})`,
      passed: isDecisionCorrect,
      details: `Expected ${scenario.expectedDecision}, agent decided ${agentResponse.decision}`,
    });

    // Criterion 2: Quantity Alignment (if applicable)
    let isQuantityAligned = true;
    if (scenario.expectedFinalQtyMin !== undefined && scenario.expectedFinalQtyMax !== undefined) {
      isQuantityAligned =
        agentResponse.finalDecidedQty >= scenario.expectedFinalQtyMin &&
        agentResponse.finalDecidedQty <= scenario.expectedFinalQtyMax;
      criteriaChecks.push({
        criterion: `Final decided quantity within safe operational range [${scenario.expectedFinalQtyMin}, ${scenario.expectedFinalQtyMax}]`,
        passed: isQuantityAligned,
        details: `Decided quantity: ${agentResponse.finalDecidedQty} units`,
      });
    }

    // Criterion 3: Information Gathering Completeness
    const toolCallsMade = agentResponse.trace
      .filter((t) => !!t.toolCall)
      .map((t) => t.toolCall!.name);

    const requiredTools = [
      "get_inventory_status",
      "get_demand_forecast",
      "get_open_purchase_orders",
      "get_node_constraints",
      "get_supplier_catalog",
    ];
    const gatheredRequiredCount = requiredTools.filter((tool) =>
      toolCallsMade.includes(tool)
    ).length;
    const infoGatheringPct = Number(
      ((gatheredRequiredCount / requiredTools.length) * 100).toFixed(1)
    );
    const isInfoComplete = gatheredRequiredCount === requiredTools.length;

    criteriaChecks.push({
      criterion: `Comprehensive ERP information gathering (inventory, demand, open POs, constraints, suppliers)`,
      passed: isInfoComplete,
      details: `Queried ${gatheredRequiredCount}/${requiredTools.length} critical ERP information sources`,
    });

    // Criterion 4: Constraint Compliance
    const criticalViolations = agentResponse.validationResult.checks.filter(
      (c) => !c.passed && c.severity === "CRITICAL"
    );
    // In scenario-5 (deadlock), a critical violation is caught and escalated, which is correct behavior
    const isConstraintCompliant =
      scenario.id === "scenario-5"
        ? agentResponse.decision === "ESCALATE_TO_HUMAN"
        : criticalViolations.length === 0;

    criteriaChecks.push({
      criterion: `Zero unhandled physical or financial constraint breaches`,
      passed: isConstraintCompliant,
      details: isConstraintCompliant
        ? "All critical guardrails passed or appropriately escalated"
        : `${criticalViolations.length} critical guardrails breached`,
    });

    // Criterion 5: Validation Feedback Loop Execution
    const validationTrace = agentResponse.trace.filter((t) => !!t.validationResult);
    const validationExecuted = validationTrace.length > 0;
    criteriaChecks.push({
      criterion: `Independent validation gateway executed prior to commit`,
      passed: validationExecuted,
      details: `Executed ${validationTrace.length} validation passes with ${agentResponse.feedbackLoopCycles} feedback loop cycles`,
    });

    // Criterion 6: Feedback Loop Self-Healing (for Scenario 4 where initial recommendation breaches constraints)
    if (scenario.id === "scenario-4") {
      const selfHealed = agentResponse.feedbackLoopCycles > 0 && agentResponse.validationResult.isValid;
      criteriaChecks.push({
        criterion: `Automated feedback loop self-healed and re-converged on valid order parameters`,
        passed: selfHealed,
        details: selfHealed
          ? `Self-healing successfully resolved violation in ${agentResponse.feedbackLoopCycles} feedback cycle(s)`
          : `Feedback loop failed to resolve violation`,
      });
    }

    const passedChecks = criteriaChecks.filter((c) => c.passed).length;
    const score = Number(((passedChecks / criteriaChecks.length) * 100).toFixed(1));
    const passed = score >= 80;

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      category: scenario.category,
      passed,
      score,
      criteriaChecks,
      metrics: {
        decisionCorrectness: isDecisionCorrect,
        informationGatheringScorePct: infoGatheringPct,
        constraintCompliancePct: isConstraintCompliant ? 100 : 0,
        validationLoopExecuted: validationExecuted,
        feedbackLoopSelfHealed: agentResponse.feedbackLoopCycles > 0,
        executionTimeMs: agentResponse.executionTimeMs,
      },
      agentResponse,
    };
  }

  public static async runFullBenchmark(): Promise<FullBenchmarkReport> {
    const startTime = Date.now();
    const results: ScenarioEvaluationResult[] = [];

    for (const scenario of SCENARIO_PRESETS) {
      const result = await this.evaluateScenario(scenario);
      results.push(result);
    }

    const totalScenarios = results.length;
    const passedScenarios = results.filter((r) => r.passed).length;
    const overallPassRatePct = Number(((passedScenarios / totalScenarios) * 100).toFixed(1));
    const averageScorePct = Number(
      (results.reduce((acc, r) => acc + r.score, 0) / totalScenarios).toFixed(1)
    );

    return {
      timestamp: new Date().toISOString(),
      totalScenarios,
      passedScenarios,
      overallPassRatePct,
      averageScorePct,
      totalExecutionTimeMs: Date.now() - startTime,
      scenarios: results,
    };
  }
}
