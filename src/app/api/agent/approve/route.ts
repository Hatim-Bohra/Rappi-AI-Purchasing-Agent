import { NextRequest, NextResponse } from "next/server";
import { PURCHASING_TOOLS } from "@/agent/tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, chosenOptionId, sku, nodeId, comments } = body;

    if (!ticketId || !chosenOptionId) {
      return NextResponse.json(
        { error: "ticketId and chosenOptionId are required" },
        { status: 400 }
      );
    }

    let poResult: any = null;

    if (chosenOptionId === "OPT_OVERRIDE_SPLIT") {
      // Split delivery: Create initial tranche of 250 units
      poResult = PURCHASING_TOOLS.create_purchase_order.execute({
        nodeId: nodeId || "DS-BOG-01",
        supplierId: "SUP-ALPINA-DIRECT",
        sku: sku || "ALPIN-MILK-1L",
        quantity: 250,
        notes: `Human Buyer Override: Tranche 1 of 2 authorized by buyer (${comments || "Split Delivery Approved"}).`,
      });
    } else if (chosenOptionId === "OPT_OVERRIDE_STORAGE") {
      // Reallocate shelf space: create 500 units order
      poResult = PURCHASING_TOOLS.create_purchase_order.execute({
        nodeId: nodeId || "DS-BOG-01",
        supplierId: "SUP-ALPINA-DIRECT",
        sku: sku || "ALPIN-MILK-1L",
        quantity: 500,
        notes: `Human Buyer Override: Temporary shelf space reallocated (${comments || "Space Override Approved"}).`,
      });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      chosenOptionId,
      resolvedAt: new Date().toISOString(),
      actionResult: poResult,
      message: `Human Buyer successfully resolved escalation ticket ${ticketId}. Action executed.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
