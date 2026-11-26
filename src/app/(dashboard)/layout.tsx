import React from "react";
import { requirePageContext, ROLE_HOME } from "@/lib/auth/page-context";
import { DashboardNavigation, DashboardTopbar } from "@/components/layout/DashboardNavigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Resolves the session and the active membership; the menu is built from that role.
  const ctx = await requirePageContext();

  return (
    <div className="app-frame">
      <DashboardNavigation role={ctx.role} homeHref={ROLE_HOME[ctx.role]} />
      <div className="app-workspace">
        <DashboardTopbar role={ctx.role} />
        <main className="dashboard-main">{children}</main>
        <footer className="app-footer">
          <span>Digital Posyandu</span>
          <span>Informasi layanan mengikuti catatan yang telah diverifikasi petugas.</span>
        </footer>
      </div>
    </div>
  );
}
