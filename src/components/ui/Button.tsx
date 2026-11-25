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
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";
  const styles = {
    primary:
      "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-800 hover:shadow-md focus-visible:ring-emerald-700/20",
    secondary:
      "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-slate-400/20",
    danger:
      "bg-rose-600 text-white shadow-sm shadow-rose-950/10 hover:bg-rose-700 focus-visible:ring-rose-600/20",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 focus-visible:ring-emerald-700/15",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
