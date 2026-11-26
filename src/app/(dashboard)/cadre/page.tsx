import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Baby,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Plus,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminDb } from "@/lib/firebase/admin";
import { requirePageContext } from "@/lib/auth/page-context";
import { todayInJakarta } from "@/lib/data/child-lookup";

const quickLinks = [
  {
    href: "/cadre/children",
    title: "Data sasaran",
    description: "Lihat dan kelola data anak",
    icon: Baby,
  },
  {
    href: "/cadre/followups",
    title: "Tindak lanjut",
    description: "Periksa catatan yang perlu ditangani",
    icon: ClipboardCheck,
  },
  {
    href: "/cadre/administration",
    title: "Buku administrasi",
    description: "Kegiatan, kehadiran, dan notulen",
    icon: ClipboardList,
  },
  {
    href: "/cadre/guides",
    title: "Panduan kader",
    description: "Buka panduan keterampilan kader",
    icon: BookOpen,
  },
];

export default async function CadreDashboard() {
  const ctx = await requirePageContext(["cadre", "health_worker", "posyandu_admin"]);
  const visits = adminDb.collection("visits").where("posyanduId", "==", ctx.posyanduId);
  const [children, today, pending, needsCorrection, rejectedImm, rejectedSupp] = await Promise.all([
    adminDb.collection("children").where("posyanduId", "==", ctx.posyanduId).count().get(),
    visits.where("visitDate", "==", todayInJakarta()).count().get(),
    visits.where("verificationStatus", "==", "pending_verification").count().get(),
    visits.where("verificationStatus", "==", "needs_correction").count().get(),
    adminDb.collection("immunization_events").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "rejected").count().get(),
    adminDb.collection("supplement_events").where("posyanduId", "==", ctx.posyanduId)
      .where("verificationStatus", "==", "rejected").count().get(),
  ]);

  const totalChildren = children.data().count;
  const todayVisits = today.data().count;
  const pendingCount = pending.data().count;
  const followUps = needsCorrection.data().count + rejectedImm.data().count + rejectedSupp.data().count;

  return (
    <div className="cadre-dashboard">
      <header className="cadre-page-heading">
        <div>
          <p className="cadre-eyebrow">RINGKASAN POSYANDU</p>
          <h1 className="posyandu-page-title">Dashboard Kader</h1>
          <p className="posyandu-page-subtitle">
            Pantau sasaran, kunjungan, dan pekerjaan yang membutuhkan perhatian.
          </p>
        </div>
        <Link href="/cadre/children/new" className="cadre-primary-link">
          <Button><Plus size={16} strokeWidth={2.2} /> Daftarkan anak</Button>
        </Link>
      </header>

      <section className="cadre-metrics" aria-label="Ringkasan pelayanan">
        <article className="cadre-metric-card cadre-metric-featured">
          <div className="cadre-metric-topline">
            <span className="cadre-metric-icon"><UsersRound size={18} /></span>
            <span className="cadre-metric-period">Seluruh sasaran</span>
          </div>
          <div>
            <p className="cadre-metric-label">Anak terdaftar</p>
            <p className="cadre-metric-value">{totalChildren.toLocaleString("id-ID")}</p>
          </div>
          <p className="cadre-metric-foot">Total data sasaran pada Posyandu aktif</p>
        </article>

        <article className="cadre-metric-card">
          <div className="cadre-metric-topline">
            <span className="cadre-metric-icon is-green"><ClipboardCheck size={18} /></span>
            <span className="cadre-metric-period">Hari ini</span>
          </div>
          <div>
            <p className="cadre-metric-label">Kunjungan tercatat</p>
            <p className="cadre-metric-value">{todayVisits.toLocaleString("id-ID")}</p>
          </div>
          <p className="cadre-metric-foot">Catatan kunjungan hari ini</p>
        </article>

        <article className="cadre-metric-card">
          <div className="cadre-metric-topline">
            <span className="cadre-metric-icon is-amber"><ClipboardList size={18} /></span>
            <span className="cadre-metric-period">Perlu ditinjau</span>
          </div>
          <div>
            <p className="cadre-metric-label">Menunggu verifikasi</p>
            <p className="cadre-metric-value is-amber">{pendingCount.toLocaleString("id-ID")}</p>
          </div>
          <p className="cadre-metric-foot">Data kunjungan menunggu pemeriksaan</p>
        </article>

        <Link href="/cadre/followups" className="cadre-metric-card cadre-metric-link">
          <div className="cadre-metric-topline">
            <span className="cadre-metric-icon is-red"><ClipboardCheck size={18} /></span>
            <span className="cadre-metric-open"><ArrowUpRight size={16} /></span>
          </div>
          <div>
            <p className="cadre-metric-label">Tindak lanjut</p>
            <p className="cadre-metric-value is-red">{followUps.toLocaleString("id-ID")}</p>
          </div>
          <p className="cadre-metric-foot">Catatan koreksi dan penolakan</p>
        </Link>
      </section>

      <section className="cadre-quick-section" aria-labelledby="cadre-quick-title">
        <div className="cadre-section-heading">
          <div>
            <p className="cadre-eyebrow">AKSES MODUL</p>
            <h2 id="cadre-quick-title">Lanjutkan pekerjaan</h2>
            <p>Pilih modul yang ingin Anda buka.</p>
          </div>
        </div>
        <div className="cadre-quick-grid">
          {quickLinks.map(({ href, title, description, icon: Icon }) => (
            <Link href={href} className="cadre-quick-card" key={href}>
              <span className="cadre-quick-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span className="cadre-quick-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowUpRight className="cadre-quick-arrow" size={17} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
