import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/audit/audit-logger";

const RECORD_TYPES = ["activity", "attendance", "minutes", "home_visit", "inventory"] as const;
type RecordType = typeof RECORD_TYPES[number];

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "health_worker", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const type = req.nextUrl.searchParams.get("type");
  if (type && !RECORD_TYPES.includes(type as RecordType)) {
    return NextResponse.json({ error: "Jenis administrasi tidak dikenal" }, { status: 400 });
  }
  let query = adminDb.collection("administrative_records")
    .where("posyanduId", "==", auth.posyanduId);
  if (type) query = query.where("type", "==", type);
  const snapshot = await query.limit(100).get();
  return NextResponse.json({ records: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    if (!RECORD_TYPES.includes(body.type as RecordType)
      || typeof body.title !== "string" || !body.title.trim()
      || !validDate(body.recordDate)) {
      return NextResponse.json({ error: "Jenis, judul, dan tanggal catatan wajib valid" }, { status: 400 });
    }
    const allowed = {
      type: body.type as RecordType,
      title: body.title.trim().slice(0, 160),
      recordDate: body.recordDate,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "",
      status: "recorded",
      posyanduId: auth.posyanduId,
      createdBy: auth.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ref = adminDb.collection("administrative_records").doc();
    await ref.create(allowed);
    await writeAuditLog({
      actorUserId: auth.uid, action: "CREATE_ADMINISTRATIVE_RECORD",
      resourceType: "administrative_record", resourceId: ref.id,
      beforeSnapshot: null, afterSnapshot: allowed, reason: "Pencatatan administrasi Posyandu",
      posyanduId: auth.posyanduId,
    });
    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Catatan administrasi gagal disimpan" }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "ID catatan wajib diisi." }, { status: 400 });
    const ref = adminDb.collection("administrative_records").doc(id);
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) throw new Error("NOT_FOUND");
      const changes: Record<string, unknown> = {};
      if (body.title !== undefined) {
        if (typeof body.title !== "string" || !body.title.trim()) throw new Error("INVALID_TITLE");
        changes.title = body.title.trim().slice(0, 160);
      }
      if (body.description !== undefined) {
        if (typeof body.description !== "string") throw new Error("INVALID_DESCRIPTION");
        changes.description = body.description.trim().slice(0, 4000);
      }
      if (body.recordDate !== undefined) {
        if (!validDate(body.recordDate)) throw new Error("INVALID_DATE");
        changes.recordDate = body.recordDate;
      }
      if (body.type !== undefined) {
        if (!RECORD_TYPES.includes(body.type as RecordType)) throw new Error("INVALID_TYPE");
        changes.type = body.type;
      }
      if (!Object.keys(changes).length) throw new Error("NO_CHANGES");
      changes.updatedAt = new Date().toISOString();
      changes.updatedBy = auth.uid;
      tx.update(ref, changes);
      await writeAuditLog({ actorUserId: auth.uid, action: "UPDATE_ADMINISTRATIVE_RECORD",
        resourceType: "administrative_record", resourceId: id, beforeSnapshot: snap.data() || null,
        afterSnapshot: { ...snap.data(), ...changes }, reason: "Pembaruan catatan administrasi",
        posyanduId: auth.posyanduId }, tx);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = { NOT_FOUND: "Catatan tidak ditemukan.", INVALID_TITLE: "Judul tidak valid.",
      INVALID_DESCRIPTION: "Keterangan tidak valid.", INVALID_DATE: "Tanggal tidak valid.", INVALID_TYPE: "Jenis tidak valid.", NO_CHANGES: "Tidak ada perubahan." };
    return NextResponse.json({ error: messages[code] || "Catatan administrasi gagal diperbarui." },
      { status: code === "NOT_FOUND" ? 404 : messages[code] ? 400 : 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ["posyandu_admin"]);
  if (isAuthError(auth)) return auth;
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "ID catatan wajib diisi." }, { status: 400 });
  try {
    await adminDb.runTransaction(async tx => {
      const ref = adminDb.collection("administrative_records").doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.posyanduId !== auth.posyanduId) throw new Error("NOT_FOUND");
      tx.delete(ref);
      await writeAuditLog({ actorUserId: auth.uid, action: "DELETE_ADMINISTRATIVE_RECORD",
        resourceType: "administrative_record", resourceId: id, beforeSnapshot: snap.data() || null,
        afterSnapshot: null, reason: "Penghapusan catatan administrasi oleh administrator",
        posyanduId: auth.posyanduId }, tx);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: code === "NOT_FOUND" ? "Catatan tidak ditemukan." : "Catatan gagal dihapus." },
      { status: code === "NOT_FOUND" ? 404 : 500 });
  }
}
