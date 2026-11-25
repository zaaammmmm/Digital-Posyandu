import React from "react";
import "./globals.css";

export const metadata = {
  title: "Digital Posyandu — Sistem Buku & Administrasi Terintegrasi",
  description: "Digitalisasi buku Posyandu dengan ringkasan aman dan audit trail",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
