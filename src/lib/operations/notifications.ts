import { adminDb } from "@/lib/firebase/admin";
import type { Role } from "@/types/verification";

export type OperationalNotice = {
  id: string; title: string; message: string; href: string;
  priority: "high" | "normal"; createdAt: string;
};

export async function getOperationalNotices(posyanduId: string, uid: string, role: Role): Promise<OperationalNotice[]> {
  const notices: OperationalNotice[] = [];
  if (role === "health_worker") {
    const snap = await adminDb.collection("visits").where("posyanduId", "==", posyanduId)
      .where("verificationStatus", "==", "pending_verification").limit(50).get();
    for (const doc of snap.docs) {
      const v = doc.data();
      notices.push({ id: `visit-${doc.id}`, title: "Verifikasi kunjungan",
        message: `Kunjungan tanggal ${String(v.visitDate || "-")} menunggu pemeriksaan.`,
        href: `/health-worker/verifications/${doc.id}`, priority: "normal", createdAt: String(v.createdAt || "") });
    }
  }
  if (role === "cadre" || role === "posyandu_admin") {
    const [corrections, immunizations, supplements] = await Promise.all([
      adminDb.collection("visits").where("posyanduId", "==", posyanduId).where("verificationStatus", "==", "needs_correction").limit(50).get(),
      adminDb.collection("immunization_events").where("posyanduId", "==", posyanduId).where("verificationStatus", "==", "rejected").limit(50).get(),
      adminDb.collection("supplement_events").where("posyanduId", "==", posyanduId).where("verificationStatus", "==", "rejected").limit(50).get(),
    ]);
    for (const d of corrections.docs) notices.push({ id: `correction-${d.id}`, title: "Kunjungan perlu diperbaiki",
      message: `Kunjungan tanggal ${String(d.data().visitDate || "-")} dikembalikan oleh tenaga kesehatan.`,
      href: "/cadre/followups", priority: "high", createdAt: String(d.data().rejectedAt || d.data().updatedAt || "") });
    for (const d of [...immunizations.docs, ...supplements.docs]) notices.push({ id: `service-${d.id}`, title: "Layanan perlu ditindaklanjuti",
      message: "Catatan imunisasi atau suplemen ditolak dan perlu ditinjau ulang.",
      href: "/cadre/followups", priority: "high", createdAt: String(d.data().updatedAt || "") });
  }
  if (role === "parent") {
    const children = await adminDb.collection("children").where("posyanduId", "==", posyanduId)
      .where("guardianUids", "array-contains", uid).limit(30).get();
    for (const child of children.docs) {
      const recent = await adminDb.collection("visits").where("posyanduId", "==", posyanduId)
        .where("childId", "==", child.id).limit(1).get();
      if (recent.empty) notices.push({ id: `child-${child.id}`, title: "Riwayat layanan belum tersedia",
        message: "Belum ada kunjungan yang tercatat untuk anak ini.", href: `/parent/children/${child.id}`,
        priority: "normal", createdAt: String(child.data().createdAt || "") });
    }
  }
  return notices.sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high")
    || b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
}
