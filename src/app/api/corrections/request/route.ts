import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitId, requestedBy, reason } = body;

    if (!visitId || !requestedBy || !reason) {
      return NextResponse.json({ error: "Data permintaan tidak lengkap" }, { status: 400 });
    }

    const docRef = await adminDb.collection("correction_requests").add({
      visitId,
      requestedBy,
      reason,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      requestId: docRef.id,
      message: "Permintaan koreksi berhasil dikirim kepada kader/petugas.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
