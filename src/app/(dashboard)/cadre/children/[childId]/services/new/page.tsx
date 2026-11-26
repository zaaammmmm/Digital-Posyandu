import React from "react";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { ServiceEventForm } from "@/components/forms/ServiceEventForm";

export default async function NewServiceEventPage({ params }: { params: Promise<{ childId: string }> }) {
  const ctx = await requirePageContext(["cadre", "health_worker"]);
  const { childId } = await params;
  const snap = await adminDb.collection("children").doc(childId).get();
  const child = snap.data();
  if (!snap.exists || !child || child.posyanduId !== ctx.posyanduId) notFound();

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Imunisasi &amp; Vitamin</h2>
          <p className="posyandu-page-subtitle">{String(child.fullName)} ({String(child.registrationNumber)})</p>
        </div>
      </div>
      <ServiceEventForm childId={childId} />
    </div>
  );
}
