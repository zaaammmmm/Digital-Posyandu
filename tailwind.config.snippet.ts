// Opsional: tambahkan ke theme.extend di tailwind.config.ts milikmu.
// Kode di src/ tidak bergantung pada file ini (token sudah ada sebagai CSS variable
// di globals.css), jadi ini hanya agar kelas seperti bg-brand-600 bisa dipakai ke depan.
import type { Config } from "tailwindcss";

const extend: NonNullable<Config["theme"]>["extend"] = {
  fontFamily: { sans: ["var(--font-poppins)", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"] },
  colors: {
    brand: { 50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 500: "#10B981", 600: "#059669", 700: "#047857" },
    surface: { canvas: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0" },
    ink: { primary: "#0F172A", secondary: "#475569", muted: "#94A3B8" },
  },
};
export default extend;
