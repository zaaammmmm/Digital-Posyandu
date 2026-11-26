import React from "react";
import { requirePageContext } from "@/lib/auth/page-context";
import { EducationChat } from "@/components/ai/EducationChat";

export default async function ChatPage() {
  await requirePageContext(["parent", "cadre", "health_worker"]);
  return (
    <div className="space-y-5">
      <div className="posyandu-page-header">
        <div>
          <h1 className="posyandu-page-title">Tanya Edukasi Posyandu</h1>
          <p className="posyandu-page-subtitle">Jawaban hanya dari materi yang telah disahkan reviewer, lengkap dengan sumber.</p>
        </div>
      </div>
      <EducationChat />
    </div>
  );
}
