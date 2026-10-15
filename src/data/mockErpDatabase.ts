import {
  Product,
  FulfillmentNode,
  Supplier,
  InventoryItem,
  PurchaseOrder,
  DemandForecast,
} from "../types/supplyChain";

export interface ErpState {
  products: Product[];
  nodes: FulfillmentNode[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  demandForecasts: DemandForecast[];
}

export const INITIAL_ERP_STATE: ErpState = {
  products: [
    {
      sku: "ALPIN-MILK-1L",
      name: "Alpina Whole Milk 1L TetraPak",
      category: "Dairy & Eggs",
      unitVolumeM3: 0.0012, // 1.2 liters
      unitCostUsd: 1.10,
      sellingPriceUsd: 1.65,
      shelfLifeDays: 21,
      minSafetyStockUnits: 150,
      standardOrderIncrement: 12, // Case of 12
    },
    {
      sku: "AVO-HASS-KG",
      name: "Fresh Hass Avocado 1kg Mesh",
      category: "Fresh Produce",
      unitVolumeM3: 0.0025,
      unitCostUsd: 2.40,
      sellingPriceUsd: 3.80,
      shelfLifeDays: 7,
      minSafetyStockUnits: 80,
      standardOrderIncrement: 10,
    },
    {
      sku: "COCA-COLA-1.5L",
      name: "Coca-Cola Original 1.5L PET",
      category: "Beverages",
      unitVolumeM3: 0.0018,
      unitCostUsd: 1.25,
      sellingPriceUsd: 1.95,
      shelfLifeDays: 180,
      minSafetyStockUnits: 120,
      standardOrderIncrement: 24,
    },
    {
      sku: "EGG-SANTA-REYES-30",
      name: "Santa Reyes Fresh Eggs Pack of 30",
      category: "Dairy & Eggs",
      unitVolumeM3: 0.0065,
      unitCostUsd: 4.20,
      sellingPriceUsd: 5.90,
      shelfLifeDays: 28,
      minSafetyStockUnits: 60,
      standardOrderIncrement: 10,
    },
    {
      sku: "OAT-QUAKER-500G",
      name: "Quaker Rolled Oats 500g",
      category: "Bakery",
      unitVolumeM3: 0.0015,
      unitCostUsd: 1.45,
      sellingPriceUsd: 2.30,
      shelfLifeDays: 365,
      minSafetyStockUnits: 90,
      standardOrderIncrement: 24,
    },
  ],

  nodes: [
    {
      id: "DS-BOG-01",
      name: "Rappi Turbo Dark Store Chapinero",
      city: "Bogotá",
      maxStorageCapacityM3: 35.0, // 35 cubic meters allocated to ambient/dairy
      currentUsedStorageM3: 31.8, // Only ~3.2 m³ remaining! (~2600 units of milk)
      monthlyPurchasingBudgetUsd: 15000,
      spentBudgetUsd: 11400, // $3,600 remaining
    },
    {
      id: "DS-MDE-02",
      name: "Rappi Turbo Dark Store El Poblado",
      city: "Medellín",
      maxStorageCapacityM3: 45.0,
      currentUsedStorageM3: 28.5,
      monthlyPurchasingBudgetUsd: 20000,
      spentBudgetUsd: 12500,
    },
  ],

  suppliers: [
    {
      id: "SUP-ALPINA-DIRECT",
      name: "Alpina Dairy Direct Factory",
      reliabilityScore: 0.96,
      paymentTermsDays: 30,
      contactEmail: "pedidos@alpina.com",
      catalog: [
        {
          sku: "ALPIN-MILK-1L",
          unitCostUsd: 1.10,
          moq: 500, // High MOQ factory contract
          orderIncrement: 50,
          leadTimeDays: 2,
          maxWeeklyCapacity: 10000,
        },
      ],
    },
    {
      id: "SUP-DISTRI-RAPID",
      name: "Distribuidora Rápida Express (Secondary / Spot)",
      reliabilityScore: 0.91,
      paymentTermsDays: 15,
      contactEmail: "dispatch@distrirapid.co",
      catalog: [
        {
          sku: "ALPIN-MILK-1L",
          unitCostUsd: 1.18, // Slightly higher spot cost
          moq: 100, // Much lower MOQ
          orderIncrement: 20,
          leadTimeDays: 1, // Faster lead time: 1 day
          maxWeeklyCapacity: 2500,
        },
        {
          sku: "COCA-COLA-1.5L",
          unitCostUsd: 1.30,
          moq: 100,
          orderIncrement: 24,
          leadTimeDays: 1,
          maxWeeklyCapacity: 3000,
        },
      ],
    },
    {
      id: "SUP-COCA-COLA-BOTTLER",
      name: "Femsa Coca-Cola Bottler Direct",
      reliabilityScore: 0.98,
      paymentTermsDays: 45,
      contactEmail: "supply@femsa.com",
      catalog: [
        {
          sku: "COCA-COLA-1.5L",
          unitCostUsd: 1.20,
          moq: 400,
          orderIncrement: 48,
          leadTimeDays: 3,
          maxWeeklyCapacity: 15000,
        },
      ],
    },
    {
      id: "SUP-AGRO-CAMPESINO",
      name: "AgroCampesino Fresh Produce Union",
      reliabilityScore: 0.88,
      paymentTermsDays: 7,
      contactEmail: "ventas@agrocampesino.org",
      catalog: [
        {
          sku: "AVO-HASS-KG",
          unitCostUsd: 2.35,
          moq: 150,
          orderIncrement: 10,
          leadTimeDays: 1,
          maxWeeklyCapacity: 4000,
        },
      ],
    },
  ],

  inventory: [
    {
      nodeId: "DS-BOG-01",
      sku: "ALPIN-MILK-1L",
      onHandQuantity: 220,
      reservedQuantity: 40,
      incomingQuantity: 300, // Open PO already on the way!
    },
    {
      nodeId: "DS-BOG-01",
      sku: "COCA-COLA-1.5L",
      onHandQuantity: 140,
      reservedQuantity: 20,
      incomingQuantity: 0,
    },
    {
      nodeId: "DS-BOG-01",
      sku: "AVO-HASS-KG",
      onHandQuantity: 95,
      reservedQuantity: 15,
      incomingQuantity: 150,
    },
    {
      nodeId: "DS-MDE-02",
      sku: "ALPIN-MILK-1L",
      onHandQuantity: 340,
      reservedQuantity: 30,
      incomingQuantity: 0,
    },
  ],

  purchaseOrders: [
    {
      id: "PO-2026-0891",
      nodeId: "DS-BOG-01",
      supplierId: "SUP-ALPINA-DIRECT",
      status: "ORDERED",
      items: [
        {
          sku: "ALPIN-MILK-1L",
          quantity: 300,
          unitCostUsd: 1.10,
          totalCostUsd: 330.0,
          volumeM3: 0.36,
        },
      ],
      totalCostUsd: 330.0,
      totalVolumeM3: 0.36,
      expectedDeliveryDate: "2026-10-17",
      createdAt: "2026-10-14T10:00:00Z",
      approvedBy: "AI_AGENT",
      notes: "Routine weekly reorder (scheduled to arrive in 2 days)",
      originalRecommendedQty: 300,
    },
    {
      id: "PO-2026-0740",
      nodeId: "DS-BOG-01",
      supplierId: "SUP-ALPINA-DIRECT",
      status: "PARTIALLY_FULFILLED",
      items: [
        {
          sku: "ALPIN-MILK-1L",
          quantity: 250, // Supplier confirmed only 250 of original 500
          unitCostUsd: 1.10,
          totalCostUsd: 275.0,
          volumeM3: 0.30,
        },
      ],
      totalCostUsd: 275.0,
      totalVolumeM3: 0.30,
      expectedDeliveryDate: "2026-10-16",
      createdAt: "2026-10-15T08:00:00Z",
      notes: "Original order was 500 units; supplier reported capacity shortfall of 250 units",
      originalRecommendedQty: 500,
    },
  ],

  demandForecasts: [
    {
      sku: "ALPIN-MILK-1L",
      nodeId: "DS-BOG-01",
      dailyDemandUnits: 85, // 85 units/day
      confidenceScore: 0.94,
      trendFactor: 1.05, // Normal steady demand
      forecastHorizonDays: 14,
      recentHistoricalSales7d: [80, 84, 86, 82, 88, 85, 90],
      promoActive: false,
    },
    {
      sku: "COCA-COLA-1.5L",
      nodeId: "DS-BOG-01",
      dailyDemandUnits: 135, // Demand surged from 45 to 135 units/day due to World Cup campaign!
      confidenceScore: 0.91,
      trendFactor: 2.8, // Surging 2.8x
      forecastHorizonDays: 14,
      recentHistoricalSales7d: [50, 65, 88, 115, 130, 142, 155],
      promoActive: true,
    },
    {
      sku: "AVO-HASS-KG",
      nodeId: "DS-BOG-01",
      dailyDemandUnits: 45,
      confidenceScore: 0.89,
      trendFactor: 1.0,
      forecastHorizonDays: 7,
      recentHistoricalSales7d: [42, 45, 48, 44, 46, 43, 47],
      promoActive: false,
    },
  ],
};

// Mutable runtime ERP Database with clone and reset capability
class MockErpStore {
  private state: ErpState;

  constructor() {
    this.state = JSON.parse(JSON.stringify(INITIAL_ERP_STATE));
  }

  getState(): ErpState {
    return this.state;
  }

  reset(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_ERP_STATE));
  }

  getProduct(sku: string): Product | undefined {
    return this.state.products.find((p) => p.sku === sku);
  }

  getNode(nodeId: string): FulfillmentNode | undefined {
    return this.state.nodes.find((n) => n.id === nodeId);
  }

  getSuppliersForSku(sku: string): Supplier[] {
    return this.state.suppliers.filter((s) =>
      s.catalog.some((c) => c.sku === sku)
    );
  }

  getSupplier(supplierId: string): Supplier | undefined {
    return this.state.suppliers.find((s) => s.id === supplierId);
  }

  getInventory(nodeId: string, sku: string): InventoryItem | undefined {
    return this.state.inventory.find(
      (inv) => inv.nodeId === nodeId && inv.sku === sku
    );
  }

  getOpenPOs(nodeId: string, sku?: string): PurchaseOrder[] {
    return this.state.purchaseOrders.filter((po) => {
      const isMatchNode = po.nodeId === nodeId;
      const isOpen = ["ORDERED", "PENDING_APPROVAL", "PARTIALLY_FULFILLED"].includes(
        po.status
      );
      if (!isMatchNode || !isOpen) return false;
      if (sku) {
        return po.items.some((item) => item.sku === sku);
      }
      return true;
    });
  }

  getForecast(nodeId: string, sku: string): DemandForecast | undefined {
    return this.state.demandForecasts.find(
      (f) => f.nodeId === nodeId && f.sku === sku
    );
  }

  addPurchaseOrder(po: PurchaseOrder): void {
    this.state.purchaseOrders.unshift(po);
    // Update incoming inventory
    for (const item of po.items) {
      const inv = this.getInventory(po.nodeId, item.sku);
      if (inv) {
        inv.incomingQuantity += item.quantity;
      }
      // Update node storage & budget spend
      const node = this.getNode(po.nodeId);
      if (node) {
        node.currentUsedStorageM3 += po.totalVolumeM3;
        node.spentBudgetUsd += po.totalCostUsd;
      }
    }
  }

  updatePurchaseOrder(
    poId: string,
    updates: Partial<PurchaseOrder>
  ): PurchaseOrder | undefined {
    const poIndex = this.state.purchaseOrders.findIndex((p) => p.id === poId);
    if (poIndex === -1) return undefined;
    this.state.purchaseOrders[poIndex] = {
      ...this.state.purchaseOrders[poIndex],
      ...updates,
    };
    return this.state.purchaseOrders[poIndex];
  }
}

// Global Singleton instance for server runtime
export const erpDb = new MockErpStore();
