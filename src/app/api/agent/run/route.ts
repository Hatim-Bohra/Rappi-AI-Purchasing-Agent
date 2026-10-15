import { NextRequest, NextResponse } from "next/server";
import { PurchasingAgent } from "@/agent/purchasingAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenarioId = "custom",
      sku = "ALPIN-MILK-1L",
      nodeId = "DS-BOG-01",
      recommendedQty = 500,
      supplierId = "SUP-ALPINA-DIRECT",
      customPrompt,
    } = body;

    const response = await PurchasingAgent.execute({
      scenarioId,
      sku,
      nodeId,
      recommendedQty: Number(recommendedQty),
      supplierId,
      customPrompt,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("API /api/agent/run error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute purchasing agent" },
      { status: 500 }
    );
  }
}
