import { erpDb } from "../data/mockErpDatabase";
import { ValidationCheck, ValidationResult } from "../types/supplyChain";

export interface ValidatePurchaseOrderInput {
  nodeId: string;
  sku: string;
  supplierId: string;
  quantity: number;
}

export class ValidationFeedbackEngine {
  /**
   * Validates a proposed purchasing decision against all hard physical & financial constraints.
   * If any check fails, computes exact mathematical corrections for the agent's feedback loop.
   */
  public static validate(input: ValidatePurchaseOrderInput): ValidationResult {
    const { nodeId, sku, supplierId, quantity } = input;
    const checks: ValidationCheck[] = [];

    const product = erpDb.getProduct(sku);
    const node = erpDb.getNode(nodeId);
    const supplier = erpDb.getSupplier(supplierId);
    const catalogItem = supplier?.catalog.find((c) => c.sku === sku);
    const inv = erpDb.getInventory(nodeId, sku);
    const forecast = erpDb.getForecast(nodeId, sku);

    if (!product || !node || !supplier || !catalogItem || !inv) {
      return {
        isValid: false,
        checks: [
          {
            id: "DATA_INTEGRITY",
            name: "Master Data Integrity",
            passed: false,
            severity: "CRITICAL",
            expected: "Valid master entities",
            actual: "Entity missing",
            message: `Could not resolve product, node, or supplier in ERP catalog.`,
          },
        ],
        summary: "Validation halted due to missing ERP master data.",
      };
    }

    const dailyDemand = forecast ? forecast.dailyDemandUnits : 50;
    const netOnHand = inv.onHandQuantity - inv.reservedQuantity;
    const availableStorageM3 = Math.max(0, node.maxStorageCapacityM3 - node.currentUsedStorageM3);
    const remainingBudgetUsd = Math.max(0, node.monthlyPurchasingBudgetUsd - node.spentBudgetUsd);

    const proposedCostUsd = Number((quantity * catalogItem.unitCostUsd).toFixed(2));
    const proposedVolumeM3 = Number((quantity * product.unitVolumeM3).toFixed(4));

    // 1. Supplier MOQ Check
    const passedMoq = quantity >= catalogItem.moq;
    checks.push({
      id: "SUPPLIER_MOQ",
      name: "Supplier Minimum Order Quantity (MOQ)",
      passed: passedMoq,
      severity: "CRITICAL",
      expected: `>= ${catalogItem.moq} units`,
      actual: `${quantity} units`,
      message: passedMoq
        ? `Order quantity meets supplier MOQ (${catalogItem.moq}).`
        : `Order quantity (${quantity}) is below minimum order requirement (${catalogItem.moq}).`,
    });

    // 2. Storage Volume Capacity Check
    const passedStorage = proposedVolumeM3 <= availableStorageM3;
    checks.push({
      id: "STORAGE_CAPACITY",
      name: "Dark Store Volumetric Storage Capacity",
      passed: passedStorage,
      severity: "CRITICAL",
      expected: `<= ${availableStorageM3.toFixed(2)} m³`,
      actual: `${proposedVolumeM3.toFixed(2)} m³`,
      message: passedStorage
        ? `Proposed volume (${proposedVolumeM3.toFixed(2)} m³) fits within available space (${availableStorageM3.toFixed(2)} m³).`
        : `Volumetric overflow: order requires ${proposedVolumeM3.toFixed(2)} m³ but dark store only has ${availableStorageM3.toFixed(2)} m³ free.`,
    });

    // 3. Purchasing Budget Check
    const passedBudget = proposedCostUsd <= remainingBudgetUsd;
    checks.push({
      id: "PURCHASING_BUDGET",
      name: "Node Monthly Purchasing Budget",
      passed: passedBudget,
      severity: "CRITICAL",
      expected: `<= $${remainingBudgetUsd.toFixed(2)}`,
      actual: `$${proposedCostUsd.toFixed(2)}`,
      message: passedBudget
        ? `Order cost ($${proposedCostUsd.toFixed(2)}) is within budget ($${remainingBudgetUsd.toFixed(2)}).`
        : `Budget breach: order cost ($${proposedCostUsd.toFixed(2)}) exceeds remaining node budget ($${remainingBudgetUsd.toFixed(2)}).`,
    });

    // 4. Stockout Risk Before Delivery Arrival
    const demandDuringLeadTime = dailyDemand * catalogItem.leadTimeDays;
    const stockAtArrival = netOnHand - demandDuringLeadTime;
    const allSuppliers = erpDb.getSuppliersForSku(sku);
    const minLeadTime = Math.min(
      ...allSuppliers.flatMap((s) =>
        s.catalog.filter((c) => c.sku === sku).map((c) => c.leadTimeDays)
      )
    );
    const isFastestSupplier = catalogItem.leadTimeDays <= minLeadTime;
    const passedStockoutSafety = stockAtArrival >= 0;
    
    // If supplier is already the fastest possible option, treat impending stockout as an urgent WARNING
    // rather than a hard blockage, so the agent can execute the expedited replenishment!
    const stockoutSeverity = passedStockoutSafety
      ? "INFO"
      : isFastestSupplier
      ? "WARNING"
      : "CRITICAL";

    checks.push({
      id: "LEAD_TIME_STOCKOUT",
      name: "Delivery Lead Time vs Stockout Runout",
      passed: passedStockoutSafety,
      severity: stockoutSeverity,
      expected: `>= 0 units buffer`,
      actual: `${stockAtArrival} units at arrival`,
      message: passedStockoutSafety
        ? `Current stock (${netOnHand}) will satisfy demand (${demandDuringLeadTime}) across ${catalogItem.leadTimeDays}-day lead time.`
        : isFastestSupplier
        ? `Rush order priority: Store has ${(netOnHand / dailyDemand).toFixed(1)} days of coverage. Selected fastest certified supplier (${catalogItem.leadTimeDays}-day lead time) to minimize stockout gap.`
        : `Stockout imminent: Store runs out in ${(netOnHand / dailyDemand).toFixed(1)} days, but supplier takes ${catalogItem.leadTimeDays} days. Faster supplier with ${minLeadTime}-day lead time is available.`,
    });

    // 5. Overstock & Shelf-Life Risk Check
    const totalStockAfter = Math.max(0, stockAtArrival) + quantity + inv.incomingQuantity;
    const daysOfSupply = dailyDemand > 0 ? Number((totalStockAfter / dailyDemand).toFixed(1)) : 0;
    const passedShelfLife = daysOfSupply <= product.shelfLifeDays;
    checks.push({
      id: "SHELF_LIFE_OVERSTOCK",
      name: "Perishable Shelf-Life & Overstock Protection",
      passed: passedShelfLife,
      severity: passedShelfLife ? "INFO" : "WARNING",
      expected: `<= ${product.shelfLifeDays} days of supply`,
      actual: `${daysOfSupply} days of supply`,
      message: passedShelfLife
        ? `Days of supply (${daysOfSupply}d) does not exceed product shelf-life (${product.shelfLifeDays}d).`
        : `Risk of spoilage/waste: ordering ${quantity} units creates ${daysOfSupply} days of inventory for product with ${product.shelfLifeDays}-day shelf life.`,
    });

    const isValid = checks.every((c) => c.severity !== "CRITICAL" || c.passed);

    // Compute intelligent mathematical correction for the Feedback Loop
    let suggestedCorrection: ValidationResult["suggestedCorrection"] = undefined;

    if (!isValid) {
      // Calculate max units constrained by storage
      const maxUnitsByStorage = Math.floor(availableStorageM3 / product.unitVolumeM3);
      // Calculate max units constrained by budget
      const maxUnitsByBudget = Math.floor(remainingBudgetUsd / catalogItem.unitCostUsd);
      
      const maxPermissibleQty = Math.min(maxUnitsByStorage, maxUnitsByBudget);

      // Check if Deadlock: max permissible < supplier MOQ
      if (maxPermissibleQty < catalogItem.moq) {
        suggestedCorrection = {
          action: "ESCALATE",
          maxAllowedQuantity: maxPermissibleQty,
          reason: `Constraint Deadlock: Dark store can only accommodate ${maxPermissibleQty} units (due to storage/budget limits), but supplier ${supplier.name} requires a minimum order of ${catalogItem.moq} units. Requires Human Buyer intervention to authorize budget expansion or delivery split.`,
        };
      } else if (!passedStorage || !passedBudget) {
        // Round down to supplier order increment
        const increment = catalogItem.orderIncrement || 10;
        const roundedQty = Math.floor(maxPermissibleQty / increment) * increment;
        suggestedCorrection = {
          action: "REDUCE_QUANTITY",
          maxAllowedQuantity: roundedQty,
          reason: `Storage or budget ceiling reached. Reduce purchase order from ${quantity} to ${roundedQty} units to satisfy available storage (${availableStorageM3.toFixed(2)} m³) and remaining budget ($${remainingBudgetUsd.toFixed(2)}).`,
        };
      } else if (!passedStockoutSafety) {
        // Suggest fast supplier
        const altSuppliers = erpDb.getSuppliersForSku(sku).filter((s) => s.id !== supplierId);
        const fasterSupplier = altSuppliers.find((s) => {
          const item = s.catalog.find((c) => c.sku === sku);
          return item && item.leadTimeDays < catalogItem.leadTimeDays;
        });

        if (fasterSupplier) {
          suggestedCorrection = {
            action: "SWITCH_SUPPLIER",
            recommendedSupplierId: fasterSupplier.id,
            reason: `Supplier lead time (${catalogItem.leadTimeDays}d) causes a stockout. Switch to expedited supplier ${fasterSupplier.name} (lead time ${fasterSupplier.catalog[0]?.leadTimeDays}d) or split order.`,
          };
        } else {
          suggestedCorrection = {
            action: "ESCALATE",
            reason: `Imminent stockout cannot be averted autonomously. All suppliers have lead times exceeding remaining inventory runway.`,
          };
        }
      }
    }

    const failedCriticalCount = checks.filter((c) => !c.passed && c.severity === "CRITICAL").length;
    const summary = isValid
      ? `Validation PASSED: All ${checks.length} operational guardrails verified successfully.`
      : `Validation FAILED: ${failedCriticalCount} critical constraint violation(s) detected. Feedback loop triggered.`;

    return {
      isValid,
      checks,
      summary,
      suggestedCorrection,
    };
  }
}
