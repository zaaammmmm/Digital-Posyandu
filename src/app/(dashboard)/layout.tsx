import React from "react";
import { requirePageSession } from "@/lib/auth/page-session";
import { DashboardNavigation, DashboardTopbar } from "@/components/layout/DashboardNavigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession();

  return (
    <div className="app-frame">
      <DashboardNavigation />
      <div className="app-workspace">
        <DashboardTopbar />
        <main className="dashboard-main">{children}</main>
        <footer className="app-footer">
          <span>Digital Posyandu</span>
          <span>Informasi layanan mengikuti catatan yang telah diverifikasi petugas.</span>
        </footer>
      </div>
    </div>
  );
}
