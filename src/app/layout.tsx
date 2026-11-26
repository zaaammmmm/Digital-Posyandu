import React from "react";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  title: "Digital Posyandu — Sistem Buku & Administrasi Terintegrasi",
  description: "Digitalisasi buku Posyandu dengan ringkasan aman dan audit trail",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
