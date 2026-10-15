import { NextResponse } from "next/server";
import { EvaluationService } from "@/services/evaluationService";

export async function GET() {
  try {
    const report = await EvaluationService.runFullBenchmark();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const report = await EvaluationService.runFullBenchmark();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
