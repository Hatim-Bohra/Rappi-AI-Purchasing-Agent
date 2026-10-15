import { erpDb } from "../data/mockErpDatabase";
import {
  InventoryItem,
  DemandForecast,
  PurchaseOrder,
  Supplier,
  FulfillmentNode,
  HitlTicket,
} from "../types/supplyChain";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
  execute: (params: any) => Promise<any> | any;
}

export const PURCHASING_TOOLS: Record<string, ToolDefinition> = {
  get_inventory_status: {
    name: "get_inventory_status",
    description:
      "Retrieves current stock levels (on-hand, reserved, incoming POs, net available) for a specific SKU and fulfillment node.",
    parameters: {
      nodeId: "Fulfillment node identifier (e.g., DS-BOG-01)",
      sku: "Product SKU (e.g., ALPIN-MILK-1L)",
    },
    execute: ({ nodeId, sku }: { nodeId: string; sku: string }) => {
      const inv = erpDb.getInventory(nodeId, sku);
      const product = erpDb.getProduct(sku);
      if (!inv || !product) {
        return { error: `Inventory record or product not found for SKU ${sku} at node ${nodeId}` };
      }
      const netAvailable = inv.onHandQuantity - inv.reservedQuantity;
      const totalEffective = netAvailable + inv.incomingQuantity;
      return {
        sku,
        productName: product.name,
        category: product.category,
        nodeId,
        onHandQuantity: inv.onHandQuantity,
        reservedQuantity: inv.reservedQuantity,
        netAvailableQuantity: netAvailable,
        incomingQuantity: inv.incomingQuantity,
        totalEffectiveStock: totalEffective,
        minSafetyStockUnits: product.minSafetyStockUnits,
        shelfLifeDays: product.shelfLifeDays,
      };
    },
  },

  get_demand_forecast: {
    name: "get_demand_forecast",
    description:
      "Fetches projected daily sales demand, sales velocity trend factor, 7-day sales history, and promotion status for an SKU.",
    parameters: {
      nodeId: "Fulfillment node identifier",
      sku: "Product SKU",
    },
    execute: ({ nodeId, sku }: { nodeId: string; sku: string }) => {
      const forecast = erpDb.getForecast(nodeId, sku);
      if (!forecast) {
        return {
          sku,
          nodeId,
          dailyDemandUnits: 50,
          confidenceScore: 0.7,
          trendFactor: 1.0,
          promoActive: false,
          note: "Default baseline estimate (no granular forecast found)",
        };
      }
      return {
        sku: forecast.sku,
        nodeId: forecast.nodeId,
        dailyDemandUnits: forecast.dailyDemandUnits,
        confidenceScore: forecast.confidenceScore,
        trendFactor: forecast.trendFactor,
        isSurging: forecast.trendFactor > 1.3,
        promoActive: forecast.promoActive,
        recentHistoricalSales7d: forecast.recentHistoricalSales7d,
        forecastHorizonDays: forecast.forecastHorizonDays,
      };
    },
  },

  get_open_purchase_orders: {
    name: "get_open_purchase_orders",
    description:
      "Lists all pending, ordered, or partially fulfilled purchase orders currently in-flight for this node and SKU.",
    parameters: {
      nodeId: "Fulfillment node identifier",
      sku: "Optional SKU filter",
    },
    execute: ({ nodeId, sku }: { nodeId: string; sku?: string }) => {
      const openPOs = erpDb.getOpenPOs(nodeId, sku);
      return {
        count: openPOs.length,
        purchaseOrders: openPOs.map((po) => ({
          id: po.id,
          supplierId: po.supplierId,
          status: po.status,
          totalCostUsd: po.totalCostUsd,
          expectedDeliveryDate: po.expectedDeliveryDate,
          items: po.items,
          notes: po.notes,
        })),
      };
    },
  },

  get_supplier_catalog: {
    name: "get_supplier_catalog",
    description:
      "Retrieves all certified suppliers for an SKU, comparing unit cost, minimum order quantity (MOQ), order increments, lead time in days, and historical reliability rating.",
    parameters: {
      sku: "Product SKU",
    },
    execute: ({ sku }: { sku: string }) => {
      const suppliers = erpDb.getSuppliersForSku(sku);
      if (suppliers.length === 0) {
        return { error: `No suppliers found with SKU ${sku} in their catalog` };
      }
      const options = suppliers.map((s) => {
        const item = s.catalog.find((c) => c.sku === sku)!;
        return {
          supplierId: s.id,
          supplierName: s.name,
          reliabilityScore: s.reliabilityScore,
          unitCostUsd: item.unitCostUsd,
          moq: item.moq,
          orderIncrement: item.orderIncrement,
          leadTimeDays: item.leadTimeDays,
          maxWeeklyCapacity: item.maxWeeklyCapacity,
        };
      });
      // Sort by cost ascending, then lead time
      options.sort((a, b) => a.unitCostUsd - b.unitCostUsd);
      return {
        sku,
        supplierCount: options.length,
        suppliers: options,
      };
    },
  },

  get_node_constraints: {
    name: "get_node_constraints",
    description:
      "Checks warehouse storage cubic meter capacity and remaining purchasing budget for a fulfillment node.",
    parameters: {
      nodeId: "Fulfillment node identifier",
    },
    execute: ({ nodeId }: { nodeId: string }) => {
      const node = erpDb.getNode(nodeId);
      if (!node) {
        return { error: `Node ${nodeId} not found` };
      }
      const availableStorageM3 = Number(
        Math.max(0, node.maxStorageCapacityM3 - node.currentUsedStorageM3).toFixed(2)
      );
      const remainingBudgetUsd = Number(
        Math.max(0, node.monthlyPurchasingBudgetUsd - node.spentBudgetUsd).toFixed(2)
      );
      const storageUtilizationPct = Number(
        ((node.currentUsedStorageM3 / node.maxStorageCapacityM3) * 100).toFixed(1)
      );
      return {
        nodeId: node.id,
        nodeName: node.name,
        city: node.city,
        maxStorageCapacityM3: node.maxStorageCapacityM3,
        currentUsedStorageM3: node.currentUsedStorageM3,
        availableStorageM3,
        storageUtilizationPct,
        monthlyPurchasingBudgetUsd: node.monthlyPurchasingBudgetUsd,
        spentBudgetUsd: node.spentBudgetUsd,
        remainingBudgetUsd,
      };
    },
  },

  calculate_inventory_projection: {
    name: "calculate_inventory_projection",
    description:
      "Simulates inventory runout timeline, safety stock breaches, days of supply, and stockout probability given a potential purchase quantity and delivery lead time.",
    parameters: {
      nodeId: "Fulfillment node identifier",
      sku: "Product SKU",
      proposedOrderQty: "Order quantity to simulate",
      leadTimeDays: "Delivery time in days",
    },
    execute: ({
      nodeId,
      sku,
      proposedOrderQty,
      leadTimeDays,
    }: {
      nodeId: string;
      sku: string;
      proposedOrderQty: number;
      leadTimeDays: number;
    }) => {
      const inv = erpDb.getInventory(nodeId, sku);
      const forecast = erpDb.getForecast(nodeId, sku);
      const product = erpDb.getProduct(sku);

      if (!inv || !product) {
        return { error: `Data missing for SKU ${sku}` };
      }

      const dailyDemand = forecast ? forecast.dailyDemandUnits : 50;
      const netOnHand = inv.onHandQuantity - inv.reservedQuantity;
      
      // Stock before delivery arrives
      const demandDuringLeadTime = dailyDemand * leadTimeDays;
      const stockAtArrival = netOnHand - demandDuringLeadTime;
      const willStockoutBeforeArrival = stockAtArrival < 0;
      const stockoutUnitsDeficit = willStockoutBeforeArrival ? Math.abs(stockAtArrival) : 0;
      const daysUntilStockout = dailyDemand > 0 ? Number((netOnHand / dailyDemand).toFixed(1)) : 999;

      // Stock after delivery
      const stockAfterDelivery = Math.max(0, stockAtArrival) + proposedOrderQty + inv.incomingQuantity;
      const daysOfSupplyAfterDelivery = Number((stockAfterDelivery / dailyDemand).toFixed(1));
      const exceedsShelfLife = daysOfSupplyAfterDelivery > product.shelfLifeDays;

      return {
        sku,
        nodeId,
        dailyDemand,
        netOnHand,
        incomingExistingPOs: inv.incomingQuantity,
        leadTimeDays,
        demandDuringLeadTime,
        daysUntilStockout,
        willStockoutBeforeArrival,
        stockoutUnitsDeficit,
        stockAfterDelivery,
        daysOfSupplyAfterDelivery,
        shelfLifeDays: product.shelfLifeDays,
        exceedsShelfLife,
        safetyStockUnits: product.minSafetyStockUnits,
        safetyStockBreached: stockAtArrival < product.minSafetyStockUnits,
      };
    },
  },

  create_purchase_order: {
    name: "create_purchase_order",
    description:
      "Submits a new formal purchase order to a supplier after all constraint validations pass.",
    parameters: {
      nodeId: "Fulfillment node identifier",
      supplierId: "Supplier identifier",
      sku: "Product SKU",
      quantity: "Number of units to purchase",
      notes: "Audit reasoning and context for the PO",
    },
    execute: ({
      nodeId,
      supplierId,
      sku,
      quantity,
      notes,
    }: {
      nodeId: string;
      supplierId: string;
      sku: string;
      quantity: number;
      notes?: string;
    }) => {
      const product = erpDb.getProduct(sku);
      const supplier = erpDb.getSupplier(supplierId);
      if (!product || !supplier) {
        return { error: "Product or Supplier not found" };
      }
      const catalogItem = supplier.catalog.find((c) => c.sku === sku);
      if (!catalogItem) {
        return { error: `Supplier ${supplier.name} does not offer SKU ${sku}` };
      }

      const totalCostUsd = Number((quantity * catalogItem.unitCostUsd).toFixed(2));
      const totalVolumeM3 = Number((quantity * product.unitVolumeM3).toFixed(4));
      
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + catalogItem.leadTimeDays);

      const po: PurchaseOrder = {
        id: `PO-${Date.now().toString().slice(-6)}`,
        nodeId,
        supplierId,
        status: "ORDERED",
        items: [
          {
            sku,
            quantity,
            unitCostUsd: catalogItem.unitCostUsd,
            totalCostUsd,
            volumeM3: totalVolumeM3,
          },
        ],
        totalCostUsd,
        totalVolumeM3,
        expectedDeliveryDate: deliveryDate.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        approvedBy: "AI_AGENT",
        notes: notes || "Autonomous purchase order generated by AI Purchasing Agent",
        originalRecommendedQty: quantity,
      };

      erpDb.addPurchaseOrder(po);
      return {
        success: true,
        purchaseOrder: po,
        message: `PO ${po.id} successfully dispatched to ${supplier.name} for ${quantity} units ($${totalCostUsd})`,
      };
    },
  },

  modify_purchase_order: {
    name: "modify_purchase_order",
    description:
      "Updates quantity, supplier, notes, or status on an existing purchase order.",
    parameters: {
      poId: "Purchase order ID to modify",
      updates: "Key-value map of updates",
    },
    execute: ({ poId, updates }: { poId: string; updates: any }) => {
      const updated = erpDb.updatePurchaseOrder(poId, updates);
      if (!updated) {
        return { error: `PO ${poId} not found` };
      }
      return {
        success: true,
        purchaseOrder: updated,
      };
    },
  },

  split_purchase_order: {
    name: "split_purchase_order",
    description:
      "Handles partial fulfillment by updating the primary PO to the fulfilled quantity, and instantly generating a secondary PO with a backup supplier for the deficit.",
    parameters: {
      originalPoId: "Original purchase order ID",
      fulfilledQuantity: "Quantity supplied by original supplier",
      secondarySupplierId: "Supplier ID for the deficit order",
      remainingQuantity: "Deficit quantity to order",
      notes: "Reason for split order",
    },
    execute: ({
      originalPoId,
      fulfilledQuantity,
      secondarySupplierId,
      remainingQuantity,
      notes,
    }: {
      originalPoId: string;
      fulfilledQuantity: number;
      secondarySupplierId: string;
      remainingQuantity: number;
      notes?: string;
    }) => {
      // 1. Update original PO
      const originalPO = erpDb.updatePurchaseOrder(originalPoId, {
        status: "PARTIALLY_FULFILLED",
        notes: `Partial delivery accepted: ${fulfilledQuantity} units. ${notes || ""}`,
      });

      if (!originalPO) {
        return { error: `Original PO ${originalPoId} not found` };
      }

      const sku = originalPO.items[0]?.sku;
      const product = erpDb.getProduct(sku);
      const secondarySupplier = erpDb.getSupplier(secondarySupplierId);
      const secondaryCatalog = secondarySupplier?.catalog.find((c) => c.sku === sku);

      if (!secondarySupplier || !secondaryCatalog || !product) {
        return { error: "Secondary supplier or catalog item not available" };
      }

      const secondaryCost = Number((remainingQuantity * secondaryCatalog.unitCostUsd).toFixed(2));
      const secondaryVolume = Number((remainingQuantity * product.unitVolumeM3).toFixed(4));
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + secondaryCatalog.leadTimeDays);

      // 2. Create secondary PO
      const secondaryPO: PurchaseOrder = {
        id: `PO-${Date.now().toString().slice(-6)}-SPLIT`,
        nodeId: originalPO.nodeId,
        supplierId: secondarySupplierId,
        status: "ORDERED",
        items: [
          {
            sku,
            quantity: remainingQuantity,
            unitCostUsd: secondaryCatalog.unitCostUsd,
            totalCostUsd: secondaryCost,
            volumeM3: secondaryVolume,
          },
        ],
        totalCostUsd: secondaryCost,
        totalVolumeM3: secondaryVolume,
        expectedDeliveryDate: deliveryDate.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        approvedBy: "AI_AGENT",
        notes: `Split fulfillment recovery order for shortfall from ${originalPoId}`,
      };

      erpDb.addPurchaseOrder(secondaryPO);

      return {
        success: true,
        primaryPO: originalPO,
        secondaryPO,
        message: `Successfully accepted ${fulfilledQuantity} units from primary supplier and re-routed ${remainingQuantity} units to ${secondarySupplier.name}`,
      };
    },
  },

  escalate_to_human: {
    name: "escalate_to_human",
    description:
      "Freezes autonomous execution and creates a structured Human-in-the-Loop decision ticket when operational constraints cause deadlock or spend exceeds limits.",
    parameters: {
      sku: "Product SKU",
      nodeId: "Fulfillment node ID",
      scenarioTitle: "Summary title of the escalation",
      reason: "Root cause explanation of why autonomous agent cannot safely proceed",
      urgency: "LOW | MEDIUM | HIGH | CRITICAL",
      options: "Array of structured actionable solutions for the human buyer to click",
    },
    execute: (params: Omit<HitlTicket, "ticketId" | "createdAt" | "resolved">) => {
      const ticket: HitlTicket = {
        ticketId: `HITL-${Date.now().toString().slice(-5)}`,
        createdAt: new Date().toISOString(),
        resolved: false,
        ...params,
      };
      return {
        escalated: true,
        ticket,
        message: `Autonomous execution paused. Human buyer decision required: ${ticket.reason}`,
      };
    },
  },
};
