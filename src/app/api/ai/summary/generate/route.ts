import { NextRequest, NextResponse } from "next/server";
import { generateSafeSummary } from "@/lib/ai/summary-generator";
import { buildSafeAiPayload } from "@/lib/ai/payload-builder";

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();
    const safePayload = buildSafeAiPayload(rawPayload);
    const summary = await generateSafeSummary(safePayload);

    return NextResponse.json({
      success: true,
      summary: summary.text,
      safetyStatus: summary.safetyStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
