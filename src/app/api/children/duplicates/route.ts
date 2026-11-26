import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, isAuthError } from "@/lib/auth/server";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function similarity(a: string, b: string) {
  const aa = new Set(normalize(a).split(" ").filter(Boolean));
  const bb = new Set(normalize(b).split(" ").filter(Boolean));
  if (!aa.size || !bb.size) return 0;
  const intersection = [...aa].filter(x => bb.has(x)).length;
  return intersection / new Set([...aa, ...bb]).size;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["cadre", "posyandu_admin", "health_worker"]);
  if (isAuthError(auth)) return auth;
  const name = (req.nextUrl.searchParams.get("name") || "").trim().slice(0, 100);
  const dateOfBirth = req.nextUrl.searchParams.get("dateOfBirth") || "";
  const sex = req.nextUrl.searchParams.get("sex") || "";
  if (name.length < 3) return NextResponse.json({ error: "Masukkan minimal 3 karakter nama anak." }, { status: 400 });
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return NextResponse.json({ error: "Tanggal lahir tidak valid." }, { status: 400 });
  const snap = await adminDb.collection("children").where("posyanduId", "==", auth.posyanduId).limit(500).get();
  const candidates = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .map((c: any) => {
      const nameScore = similarity(name, String(c.fullName || ""));
      const sameBirthDate = Boolean(dateOfBirth && c.dateOfBirth === dateOfBirth);
      const sameSex = Boolean(sex && c.sex === sex);
      const score = sameBirthDate && (!sex || sameSex) ? Math.max(nameScore, 0.85) : nameScore;
      return { id: c.id, fullName: String(c.fullName || ""), dateOfBirth: String(c.dateOfBirth || ""),
        registrationNumber: String(c.registrationNumber || ""), score: Math.round(score * 100),
        reasons: [nameScore >= 0.5 ? "Kemiripan nama" : "", sameBirthDate ? "Tanggal lahir sama" : "", sameBirthDate && sameSex ? "Jenis kelamin sama" : ""].filter(Boolean) };
    })
    .filter(c => c.score >= 50)
    .sort((a, b) => b.score - a.score).slice(0, 30);
  return NextResponse.json({ candidates }, { headers: { "Cache-Control": "no-store" } });
}
