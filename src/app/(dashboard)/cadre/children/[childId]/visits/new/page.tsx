import React from "react";
import { VisitForm } from "@/components/forms/VisitForm";
import { requirePageContext } from "@/lib/auth/page-context";

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const ctx = await requirePageContext(["cadre", "health_worker"]);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h2 className="posyandu-page-title">Input Kunjungan Posyandu</h2>
          <p className="posyandu-page-subtitle">ID Anak: {childId}</p>
        </div>
      </div>
      <VisitForm childId={childId} posyanduId={ctx.posyanduId} />
    </div>
  );
}
