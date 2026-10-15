"use client";

import React from "react";
import { HardDrive, DollarSign, PackageCheck, AlertTriangle } from "lucide-react";
import { FulfillmentNode, PurchaseOrder, InventoryItem } from "../types/supplyChain";

interface MetricsOverviewProps {
  node?: FulfillmentNode;
  openPOs: PurchaseOrder[];
  inventory: InventoryItem[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  node,
  openPOs,
  inventory,
}) => {
  if (!node) return null;

  const availableStorageM3 = Math.max(0, node.maxStorageCapacityM3 - node.currentUsedStorageM3);
  const storageUtilizationPct = Math.min(
    100,
    Number(((node.currentUsedStorageM3 / node.maxStorageCapacityM3) * 100).toFixed(1))
  );

  const remainingBudgetUsd = Math.max(0, node.monthlyPurchasingBudgetUsd - node.spentBudgetUsd);
  const budgetUtilizationPct = Math.min(
    100,
    Number(((node.spentBudgetUsd / node.monthlyPurchasingBudgetUsd) * 100).toFixed(1))
  );

  const totalInFlightValue = openPOs.reduce((acc, po) => acc + po.totalCostUsd, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Storage Capacity Gauge */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dark Store Storage
          </span>
          <div className={`p-1.5 rounded-lg ${storageUtilizationPct > 90 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl font-bold text-slate-900">
              {availableStorageM3.toFixed(2)} m³ <span className="text-xs font-normal text-slate-500">free</span>
            </span>
            <span className={`text-xs font-bold ${storageUtilizationPct > 90 ? "text-red-600" : "text-slate-600"}`}>
              {storageUtilizationPct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${storageUtilizationPct > 90 ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${storageUtilizationPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Total capacity: {node.maxStorageCapacityM3.toFixed(1)} m³
          </p>
        </div>
      </div>

      {/* Purchasing Budget Gauge */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Monthly Budget
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl font-bold text-slate-900">
              ${remainingBudgetUsd.toLocaleString()} <span className="text-xs font-normal text-slate-500">left</span>
            </span>
            <span className="text-xs font-bold text-slate-600">
              {budgetUtilizationPct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${budgetUtilizationPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Spent: ${node.spentBudgetUsd.toLocaleString()} of ${node.monthlyPurchasingBudgetUsd.toLocaleString()}
          </p>
        </div>
      </div>

      {/* In-Flight Open POs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Open POs in Transit
          </span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-bold text-slate-900">
            {openPOs.length} Orders
          </span>
          <p className="text-xs font-medium text-slate-600 mt-1">
            ${totalInFlightValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} committed value
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Monitored by autonomous replenishment loop
          </p>
        </div>
      </div>

      {/* Guardrail Policy Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Autonomous Guardrails
          </span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-800">5 Checks Enforced</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">MOQ</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">Storage m³</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">Budget</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">Lead Time</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">Shelf-Life</span>
          </div>
        </div>
      </div>
    </div>
  );
};
