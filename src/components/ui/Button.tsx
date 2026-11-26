"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[9px] px-5 py-2.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50";
  const styles = {
    // CTA utama: brand-600, hover brand-700
    primary:
      "bg-[#059669] text-white shadow-sm hover:bg-[#047857] focus-visible:ring-[#059669]/25 active:bg-[#047857]",
    // Aksi kedua: putih, teks hijau, hover brand-100 (sesuai contoh "Lihat Riwayat")
    secondary:
      "border border-[#dbe5e8] bg-white text-[#047857] hover:border-[#a7f3d0] hover:bg-[#ecfdf5] focus-visible:ring-[#059669]/25",
    danger:
      "bg-[#dc2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#dc2626]/25",
    outline:
      "border border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] focus-visible:ring-[#475569]/20",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
