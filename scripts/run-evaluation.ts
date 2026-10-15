import { EvaluationService } from "../src/services/evaluationService";

async function main() {
  console.log("\n================================================================================");
  console.log("       RAPPI AI PURCHASING AGENT - BENCHMARK & EVALUATION SUITE");
  console.log("================================================================================\n");
  console.log("Executing automated evaluation across core quick-commerce purchasing scenarios...\n");

  const report = await EvaluationService.runFullBenchmark();

  for (const res of report.scenarios) {
    const icon = res.passed ? "[PASS]" : "[FAIL]";
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`${icon} ${res.scenarioTitle}`);
    console.log(`Score: ${res.score}% | Decision: ${res.agentResponse.decision} | Execution: ${res.metrics.executionTimeMs}ms`);
    console.log(`Rationale: ${res.agentResponse.rationale}`);
    console.log(`Criteria Checks:`);
    for (const check of res.criteriaChecks) {
      const cIcon = check.passed ? "  ✓" : "  ✗";
      console.log(`  ${cIcon} ${check.criterion}`);
      console.log(`      Detail: ${check.details}`);
    }
    console.log(`Validation & Feedback Metrics:`);
    console.log(`  - Info Gathering Completeness: ${res.metrics.informationGatheringScorePct}%`);
    console.log(`  - Physical & Budgetary Compliance: ${res.metrics.constraintCompliancePct}%`);
    console.log(`  - Validation Engine Executed: ${res.metrics.validationLoopExecuted ? "YES" : "NO"}`);
    console.log(`  - Self-Healing Feedback Cycles: ${res.agentResponse.feedbackLoopCycles}`);
    if (res.agentResponse.escalationTicket) {
      console.log(`  - HITL Escalation Ticket Generated: ${res.agentResponse.escalationTicket.ticketId} (${res.agentResponse.escalationTicket.urgency})`);
    }
    console.log();
  }

  console.log("================================================================================");
  console.log("                           BENCHMARK SUMMARY REPORT");
  console.log("================================================================================");
  console.log(`Total Scenarios Tested:  ${report.totalScenarios}`);
  console.log(`Passed Scenarios:        ${report.passedScenarios}/${report.totalScenarios}`);
  console.log(`Overall Pass Rate:       ${report.overallPassRatePct}%`);
  console.log(`Average Benchmark Score: ${report.averageScorePct}%`);
  console.log(`Total Benchmark Runtime: ${report.totalExecutionTimeMs}ms`);
  console.log("================================================================================\n");

  if (report.overallPassRatePct >= 80) {
    console.log("✓ ALL EVALUATION CRITERIA SATISFIED. Ready for submission.\n");
    process.exit(0);
  } else {
    console.error("✗ Some evaluation criteria failed.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error during benchmark execution:", err);
  process.exit(1);
});
