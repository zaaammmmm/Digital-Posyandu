"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Baby, BookOpen, ClipboardList, FileBarChart2, FileText,
  HeartPulse, LayoutDashboard, Menu, ShieldCheck, UsersRound, X,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match?: string;
};

const sections: { title: string; items: NavigationItem[] }[] = [
  {
    title: "Ruang kerja",
    items: [
      { label: "Dashboard kader", href: "/cadre", icon: LayoutDashboard, match: "/cadre" },
      { label: "Data anak", href: "/cadre/children", icon: Baby, match: "/cadre/children" },
      { label: "Administrasi", href: "/cadre/administration", icon: ClipboardList },
      { label: "Panduan kader", href: "/cadre/guides", icon: BookOpen },
    ],
  },
  {
    title: "Pelayanan",
    items: [
      { label: "Portal orang tua", href: "/parent", icon: HeartPulse, match: "/parent" },
      { label: "Verifikasi nakes", href: "/health-worker", icon: ShieldCheck, match: "/health-worker" },
    ],
  },
  {
    title: "Pengelolaan",
    items: [
      { label: "Administrasi sistem", href: "/admin", icon: UsersRound, match: "/admin" },
      { label: "Laporan layanan", href: "/admin/reports", icon: FileBarChart2 },
      { label: "Audit trail", href: "/admin/audit-logs", icon: FileText },
      { label: "Review konten", href: "/reviewer", icon: Activity, match: "/reviewer" },
    ],
  },
];

function isActive(pathname: string, item: NavigationItem) {
  const prefix = item.match || item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function DashboardNavigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-trigger"
        aria-label={mobileOpen ? "Tutup navigasi" : "Buka navigasi"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          className="sidebar-backdrop"
          onClick={closeMobile}
        />
      )}

      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link href="/cadre" className="sidebar-brand" onClick={closeMobile}>
          <span className="sidebar-brand-mark"><HeartPulse size={21} strokeWidth={2.2} /></span>
          <span className="sidebar-brand-copy">
            <strong>digital<span>posyandu</span></strong>
            <small>Ruang layanan kesehatan</small>
          </span>
        </Link>

        <div className="sidebar-tenant">
          <span className="tenant-avatar">DT</span>
          <span className="tenant-copy">
            <strong>Posyandu Tempak</strong>
            <small>Area kerja aktif</small>
          </span>
          <span className="tenant-status" aria-label="Aktif" />
        </div>

        <nav className="sidebar-nav" aria-label="Navigasi aplikasi">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              {section.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    aria-current={active ? "page" : undefined}
                    className={`sidebar-link ${active ? "is-active" : ""}`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    <span>{item.label}</span>
                    {active && <span className="sidebar-active-mark" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon"><Activity size={17} /></div>
          <div>
            <strong>Digitalisasi Posyandu</strong>
            <span>Catat. Pantau. Tindak lanjuti.</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function DashboardTopbar() {
  const pathname = usePathname();
  const allItems = sections.flatMap((section) => section.items);
  const activeItem = [...allItems].reverse().find((item) => isActive(pathname, item));
  const pageName = activeItem?.label || "Ruang kerja";

  return (
    <header className="app-topbar">
      <div className="topbar-heading">
        <span className="topbar-eyebrow">DIGITAL POSYANDU / RUANG KERJA</span>
        <span className="topbar-page-title">{pageName}</span>
      </div>
      <div className="topbar-actions">
        <span className="topbar-context"><span /> Layanan Posyandu</span>
        <div className="topbar-avatar" aria-label="Akun pengguna">DP</div>
        <form action="/api/auth/logout" method="post">
          <button className="topbar-logout" type="submit">Keluar</button>
        </form>
      </div>
    </header>
  );
}
