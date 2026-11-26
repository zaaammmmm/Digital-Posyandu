"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Baby, Bell, BookOpen, ClipboardList, FileBarChart2, FileText,
  Building2, ClipboardCheck, HeartPulse, LayoutDashboard, Menu, Plus, ShieldCheck, UsersRound, X,
} from "lucide-react";

export type NavRole = "parent" | "cadre" | "health_worker" | "posyandu_admin" | "content_reviewer" | "system_admin";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match?: string;
  roles: NavRole[];
};

const sections: { title: string; items: NavigationItem[] }[] = [
  {
    title: "Ruang kerja",
    items: [
      { label: "Notifikasi", href: "/notifications", icon: Bell, match: "/notifications", roles: ["cadre", "health_worker", "posyandu_admin", "content_reviewer", "system_admin"] },
      { label: "Dashboard kader", href: "/cadre", icon: LayoutDashboard, match: "/cadre", roles: ["cadre"] },
      { label: "Data anak", href: "/cadre/children", icon: Baby, match: "/cadre/children", roles: ["cadre", "posyandu_admin"] },
      { label: "Tindak lanjut", href: "/cadre/followups", icon: ClipboardCheck, roles: ["cadre"] },
      { label: "Administrasi", href: "/cadre/administration", icon: ClipboardList, roles: ["cadre", "health_worker", "posyandu_admin"] },
      { label: "Panduan kader", href: "/cadre/guides", icon: BookOpen, roles: ["cadre", "health_worker"] },
    ],
  },
  {
    title: "Pelayanan",
    items: [
      { label: "Portal orang tua", href: "/parent", icon: HeartPulse, match: "/parent", roles: ["parent"] },
      { label: "Verifikasi nakes", href: "/health-worker", icon: ShieldCheck, match: "/health-worker", roles: ["health_worker"] },
    ],
  },
  {
    title: "Pengelolaan",
    items: [
      { label: "Administrasi sistem", href: "/admin", icon: UsersRound, match: "/admin", roles: ["posyandu_admin", "system_admin"] },
      { label: "Pengguna & peran", href: "/admin/users", icon: UsersRound, roles: ["posyandu_admin", "system_admin"] },
      { label: "Profil Posyandu", href: "/admin/profile", icon: Building2, roles: ["posyandu_admin"] },
      { label: "Laporan layanan", href: "/admin/reports", icon: FileBarChart2, roles: ["posyandu_admin", "system_admin"] },
      { label: "Audit trail", href: "/admin/audit-logs", icon: FileText, roles: ["posyandu_admin", "health_worker", "system_admin"] },
      { label: "Review konten", href: "/reviewer", icon: Activity, match: "/reviewer", roles: ["content_reviewer", "system_admin"] },
    ],
  },
];

/** Menu visible to a role. Server-side page guards remain the real enforcement. */
export function navigationFor(role: NavRole) {
  return sections
    .map(section => ({ ...section, items: section.items.filter(item => item.roles.includes(role)) }))
    .filter(section => section.items.length > 0);
}

function isActive(pathname: string, item: NavigationItem) {
  const prefix = item.match || item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function DashboardNavigation({ role, homeHref }: { role: NavRole; homeHref: string }) {
  const pathname = usePathname();
  const visibleSections = navigationFor(role);
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
        <Link href={homeHref} className="sidebar-brand" onClick={closeMobile}>
          <span className="sidebar-brand-mark"><Plus size={18} strokeWidth={3} aria-hidden="true" /></span>
          <span className="sidebar-brand-copy">Digital Posyandu</span>
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
          {visibleSections.map((section) => (
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
                    <Icon size={19} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export function DashboardTopbar({ role }: { role: NavRole }) {
  const pathname = usePathname();
  const allItems = navigationFor(role).flatMap((section) => section.items);
  const activeItem = [...allItems].reverse().find((item) => isActive(pathname, item));
  const pageName = activeItem?.label || "Ruang kerja";

  return (
    <header className="app-topbar">
      <div className="topbar-heading">
        <span className="topbar-eyebrow">RUANG KERJA</span>
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
