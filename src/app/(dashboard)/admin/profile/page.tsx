import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { PosyanduProfileForm } from "@/components/forms/PosyanduProfileForm";

export default async function PosyanduProfilePage() {
  const ctx = await requirePageContext(["posyandu_admin"]);
  const snap = await adminDb.collection("posyandu").doc(ctx.posyanduId).get();
  const d = snap.data() || {};
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Profil Posyandu</h2>
          <p className="posyandu-page-subtitle">Identitas, wilayah, dan jadwal pelayanan Posyandu aktif.</p>
        </div>
      </div>
      <PosyanduProfileForm initial={{
        name: text(d.name), addressArea: text(d.addressArea), village: text(d.village),
        district: text(d.district), regency: text(d.regency), province: text(d.province),
        serviceSchedule: text(d.serviceSchedule),
      }} />
    </div>
  );
}
