"use client";

import React, { useState } from "react";
import { ErpState } from "../data/mockErpDatabase";
import { Package, Truck, Layers, FileText } from "lucide-react";

interface ErpStateInspectorProps {
  erpState: ErpState | null;
  selectedNodeId: string;
}

export const ErpStateInspector: React.FC<ErpStateInspectorProps> = ({
  erpState,
  selectedNodeId,
}) => {
  const [activeTab, setActiveTab] = useState<"inventory" | "pos" | "suppliers">("inventory");

  if (!erpState) return null;

  const filteredInventory = erpState.inventory.filter((inv) => inv.nodeId === selectedNodeId);
  const filteredPOs = erpState.purchaseOrders.filter((po) => po.nodeId === selectedNodeId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Live ERP & WMS Database Inspector
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "inventory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inventory ({filteredInventory.length})
          </button>
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "pos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Purchase Orders ({filteredPOs.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "suppliers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Suppliers ({erpState.suppliers.length})
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[300px] overflow-y-auto">
        {activeTab === "inventory" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-right">On Hand</th>
                  <th className="pb-2 text-right">Reserved</th>
                  <th className="pb-2 text-right">Incoming PO</th>
                  <th className="pb-2 text-right">Net Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const product = erpState.products.find((p) => p.sku === item.sku);
                  const net = item.onHandQuantity - item.reservedQuantity;
                  return (
                    <tr key={item.sku} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{item.sku}</td>
                      <td className="py-2.5 text-slate-600">{product?.name}</td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{item.onHandQuantity}</td>
                      <td className="py-2.5 text-right font-medium text-slate-400">-{item.reservedQuantity}</td>
                      <td className="py-2.5 text-right font-medium text-purple-600">+{item.incomingQuantity}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">{net}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "pos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">PO Number</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2 text-right">Total ($)</th>
                  <th className="pb-2 text-right">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.map((po) => {
                  const supplier = erpState.suppliers.find((s) => s.id === po.supplierId);
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{po.id}</td>
                      <td className="py-2.5 text-slate-600">{supplier?.name || po.supplierId}</td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          po.status === "ORDERED"
                            ? "bg-blue-100 text-blue-800"
                            : po.status === "PARTIALLY_FULFILLED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700">
                        {po.items.map((i) => `${i.quantity}x ${i.sku}`).join(", ")}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ${po.totalCostUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-500">
                        {po.expectedDeliveryDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {erpState.suppliers.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                    {(s.reliabilityScore * 100).toFixed(0)}% Reliable
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Terms: Net {s.paymentTermsDays} days • {s.contactEmail}</p>
                  {s.catalog.map((c) => (
                    <p key={c.sku} className="font-mono text-slate-700">
                      {c.sku}: ${c.unitCostUsd} | MOQ: {c.moq} | Lead Time: {c.leadTimeDays}d
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
