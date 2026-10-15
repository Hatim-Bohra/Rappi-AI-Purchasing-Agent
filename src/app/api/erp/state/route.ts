import { NextRequest, NextResponse } from "next/server";
import { erpDb } from "@/data/mockErpDatabase";

export async function GET() {
  return NextResponse.json(erpDb.getState());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "reset") {
      erpDb.reset();
      return NextResponse.json({ success: true, message: "ERP state reset to baseline." });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
