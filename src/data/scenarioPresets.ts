import { ScenarioDefinition } from "../types/supplyChain";

export const SCENARIO_PRESETS: ScenarioDefinition[] = [
  {
    id: "scenario-1",
    title: "Scenario 1: Purchase Recommendation Review",
    category: "SCENARIO_1",
    description:
      "Automated system recommends ordering 800 units of Whole Milk 1L. The agent must investigate on-hand inventory, open incoming POs, demand velocity, and supplier MOQ to decide whether to accept, modify, or reject.",
    targetSku: "ALPIN-MILK-1L",
    targetNodeId: "DS-BOG-01",
    initialRecommendedQty: 800,
    initialSupplierId: "SUP-ALPINA-DIRECT",
    prompt:
      "The purchasing engine recommends buying 800 units of Alpina Whole Milk 1L (ALPIN-MILK-1L) for Dark Store Chapinero (DS-BOG-01). Review all operational factors, inventory levels, incoming POs, and constraints. Determine if this should be accepted, modified, rejected, or investigated further.",
    expectedDecision: "MODIFY",
    expectedFinalQtyMin: 450,
    expectedFinalQtyMax: 550,
    evaluationCriteria: [
      "Detected existing open PO of 300 units in flight",
      "Calculated net available inventory + incoming supply",
      "Identified that 800 units causes overstock / shelf-life risk",
      "Modified order quantity to align with supplier MOQ (500 units)",
      "Passed validation checks without exceeding node storage or budget",
    ],
  },
  {
    id: "scenario-2",
    title: "Scenario 2: Supplier Cannot Fulfil Full Purchase (Partial Fill)",
    category: "SCENARIO_2",
    description:
      "Purchase Order PO-2026-0740 for 500 units was placed, but Alpina informs the system they can only supply 250 units. The agent must determine if existing stock is enough, find secondary suppliers, or split the PO to prevent stockouts.",
    targetSku: "ALPIN-MILK-1L",
    targetNodeId: "DS-BOG-01",
    initialRecommendedQty: 500,
    initialSupplierId: "SUP-ALPINA-DIRECT",
    prompt:
      "Supplier Alpina reported a 50% capacity shortfall on PO-2026-0740, fulfilling only 250 of 500 units of Milk 1L. Evaluate stockout risk at Chapinero, investigate alternative suppliers in the catalog, and determine whether to accept partial, source the remaining 250 units elsewhere, or escalate.",
    expectedDecision: "SPLIT_SUPPLIERS",
    expectedFinalQtyMin: 250,
    expectedFinalQtyMax: 250,
    evaluationCriteria: [
      "Calculated projected runout date with only 250 units",
      "Identified secondary supplier SUP-DISTRI-RAPID with 1-day lead time",
      "Accepted partial fulfillment of 250 units from primary supplier",
      "Created secondary PO for 250 units with secondary supplier",
      "Validated combined orders meet MOQ and avoid stockout",
    ],
  },
  {
    id: "scenario-3",
    title: "Scenario 3: Demand Surge / Forecast Anomaly",
    category: "SCENARIO_3",
    description:
      "Coca-Cola 1.5L demand surged 2.8x (to 135 units/day) due to an unexpected campaign. Current inventory is only 120 units. Primary bottler has a 3-day lead time. The agent must avert immediate stockout using lead-time analysis.",
    targetSku: "COCA-COLA-1.5L",
    targetNodeId: "DS-BOG-01",
    initialRecommendedQty: 200,
    initialSupplierId: "SUP-COCA-COLA-BOTTLER",
    prompt:
      "Sales of Coca-Cola 1.5L have spiked to 135 units/day against normal 45 units/day. Current stock is 120 units. System proposed ordering 200 units from the bottler (3-day lead time). Investigate the critical lead-time gap, check alternative suppliers, and update the purchasing plan to prevent a dark store stockout tomorrow.",
    expectedDecision: "MODIFY",
    expectedFinalQtyMin: 300,
    expectedFinalQtyMax: 800,
    evaluationCriteria: [
      "Detected imminent stockout within <24 hours due to 3-day lead time from bottler",
      "Identified fast 1-day supplier SUP-DISTRI-RAPID for immediate relief",
      "Adjusted total purchase quantity to match surging daily run-rate",
      "Executed PO with validation of lead-time safety window",
    ],
  },
  {
    id: "scenario-4",
    title: "Scenario 4: Multi-Constraint Violation (Storage & Budget)",
    category: "SCENARIO_4",
    description:
      "Recommendation proposes purchasing 3,500 units of Hass Avocado ($8,400, 8.75 m³). However, Dark Store Chapinero only has 3.2 m³ storage remaining and $3,600 purchasing budget. The agent must apply constraint optimization and feedback loops.",
    targetSku: "AVO-HASS-KG",
    targetNodeId: "DS-BOG-01",
    initialRecommendedQty: 3500,
    initialSupplierId: "SUP-AGRO-CAMPESINO",
    prompt:
      "System generated a bulk replenishment recommendation of 3,500 kg Hass Avocado for DS-BOG-01. Storage is strictly limited to 3.2 m³ and remaining budget is $3,600. Investigate constraints, test execution against validation guardrails, and utilize feedback loops to converge on an optimal permissible order quantity.",
    expectedDecision: "MODIFY",
    expectedFinalQtyMin: 1000,
    expectedFinalQtyMax: 1280,
    evaluationCriteria: [
      "Caught storage capacity violation (8.75 m³ > 3.2 m³ available)",
      "Caught budget limit violation ($8,400 > $3,600 available)",
      "Triggered validation feedback loop to recalculate constraint boundary",
      "Adjusted order to ~1,200 units respecting MOQ and supplier batch size",
      "Successfully validated adjusted order without human deadlock",
    ],
  },
  {
    id: "scenario-5",
    title: "Scenario 5: Constraint Deadlock & Human-In-The-Loop Escalation",
    category: "SCENARIO_4",
    description:
      "Supplier MOQ requires 500 units, but remaining node storage can only accommodate 150 units. Because no autonomous quantity can satisfy both supplier MOQ and warehouse physics, the agent safely halts and escalates to a Human Buyer.",
    targetSku: "ALPIN-MILK-1L",
    targetNodeId: "DS-BOG-01",
    initialRecommendedQty: 500,
    initialSupplierId: "SUP-ALPINA-DIRECT",
    prompt:
      "Dark store capacity is artificially restricted to 0.18 m³ (max 150 units of Milk), but the supplier strictly enforces MOQ of 500 units. Attempt to resolve, capture validation deadlock, and generate an actionable Human-in-the-Loop escalation ticket.",
    expectedDecision: "ESCALATE_TO_HUMAN",
    expectedFinalQtyMin: 0,
    expectedFinalQtyMax: 0,
    evaluationCriteria: [
      "Recognized unresolvable conflict between Supplier MOQ and Physical Storage",
      "Avoided illegal PO creation that breaches physical space",
      "Generated structured HITL ticket with multi-choice remedies",
      "Halted autonomous execution safely pending buyer sign-off",
    ],
  },
];
