/**
 * AI Purchasing Agent - Supply Chain Domain Types
 * Modeling Quick-Commerce (Dark Stores / Fulfillment Nodes)
 */

export interface Product {
  sku: string;
  name: string;
  category: "Dairy & Eggs" | "Fresh Produce" | "Beverages" | "Bakery" | "Snacks" | "Personal Care";
  unitVolumeM3: number; // Cubic meters per unit (e.g. 0.005 m³)
  unitCostUsd: number;  // Standard base cost
  sellingPriceUsd: number;
  shelfLifeDays: number;
  minSafetyStockUnits: number;
  standardOrderIncrement: number; // e.g., pack of 12 or 50
}

export interface FulfillmentNode {
  id: string; // e.g. "DS-BOG-01" (Dark Store Bogota 1)
  name: string;
  city: string;
  maxStorageCapacityM3: number;
  currentUsedStorageM3: number;
  monthlyPurchasingBudgetUsd: number;
  spentBudgetUsd: number;
}

export interface SupplierCatalogItem {
  sku: string;
  unitCostUsd: number;
  moq: number; // Minimum Order Quantity
  orderIncrement: number; // e.g., batch of 50
  leadTimeDays: number; // Delivery time in days
  maxWeeklyCapacity: number;
}

export interface Supplier {
  id: string;
  name: string;
  reliabilityScore: number; // 0.0 to 1.0 (historical fill-rate and on-time)
  paymentTermsDays: number;
  contactEmail: string;
  catalog: SupplierCatalogItem[];
}

export interface InventoryItem {
  nodeId: string;
  sku: string;
  onHandQuantity: number;
  reservedQuantity: number; // Units allocated for picking
  incomingQuantity: number; // Units from confirmed purchase orders
}

export type POStatus =
  | "RECOMMENDED"
  | "PENDING_APPROVAL"
  | "ORDERED"
  | "PARTIALLY_FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  sku: string;
  quantity: number;
  unitCostUsd: number;
  totalCostUsd: number;
  volumeM3: number;
}

export interface PurchaseOrder {
  id: string;
  nodeId: string;
  supplierId: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalCostUsd: number;
  totalVolumeM3: number;
  expectedDeliveryDate: string; // YYYY-MM-DD
  createdAt: string;
  approvedBy?: "AI_AGENT" | "HUMAN_BUYER";
  notes?: string;
  originalRecommendedQty?: number;
}

export interface DemandForecast {
  sku: string;
  nodeId: string;
  dailyDemandUnits: number;
  confidenceScore: number; // 0.0 to 1.0
  trendFactor: number; // >1 means surging, <1 means declining
  forecastHorizonDays: number;
  recentHistoricalSales7d: number[];
  promoActive: boolean;
}

export type AgentDecisionType =
  | "ACCEPT"
  | "MODIFY"
  | "REJECT"
  | "SPLIT_SUPPLIERS"
  | "ESCALATE_TO_HUMAN"
  | "INVESTIGATE_FURTHER";

export interface ValidationCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  expected: string | number;
  actual: string | number;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  checks: ValidationCheck[];
  summary: string;
  suggestedCorrection?: {
    action: "REDUCE_QUANTITY" | "SWITCH_SUPPLIER" | "SPLIT_ORDER" | "ESCALATE";
    maxAllowedQuantity?: number;
    recommendedSupplierId?: string;
    reason: string;
  };
}

export interface AgentStepTrace {
  stepNumber: number;
  timestamp: string;
  thought: string;
  toolCall?: {
    name: string;
    params: Record<string, any>;
  };
  observation?: any;
  validationResult?: ValidationResult;
}

export interface HitlTicket {
  ticketId: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sku: string;
  nodeId: string;
  scenarioTitle: string;
  reason: string;
  options: {
    id: string;
    title: string;
    description: string;
    impact: string;
  }[];
  createdAt: string;
  resolved: boolean;
  chosenOptionId?: string;
}

export interface AgentExecutionResponse {
  scenarioId: string;
  sku: string;
  nodeId: string;
  decision: AgentDecisionType;
  rationale: string;
  initialRecommendationQty: number;
  finalDecidedQty: number;
  assignedSupplierId?: string;
  secondarySupplierId?: string;
  secondarySupplierQty?: number;
  totalOrderCostUsd: number;
  totalOrderVolumeM3: number;
  validationResult: ValidationResult;
  feedbackLoopCycles: number; // Number of self-healing retries performed
  escalationTicket?: HitlTicket;
  trace: AgentStepTrace[];
  executionTimeMs: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: "SCENARIO_1" | "SCENARIO_2" | "SCENARIO_3" | "SCENARIO_4" | "CUSTOM";
  description: string;
  targetSku: string;
  targetNodeId: string;
  initialRecommendedQty: number;
  initialSupplierId: string;
  prompt: string;
  expectedDecision: AgentDecisionType;
  expectedFinalQtyMin?: number;
  expectedFinalQtyMax?: number;
  evaluationCriteria: string[];
}
