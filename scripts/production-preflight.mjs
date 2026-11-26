const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "FIELD_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const missing = required.filter((key) => !process.env[key]?.trim());
const problems = [];
if (process.env.NODE_ENV !== "production") problems.push("NODE_ENV harus production saat menjalankan preflight rilis.");
if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
  problems.push("NEXT_PUBLIC_APP_URL harus menggunakan HTTPS.");
}
if (process.env.FIELD_ENCRYPTION_KEY && process.env.FIELD_ENCRYPTION_KEY.length < 32) {
  problems.push("FIELD_ENCRYPTION_KEY tampak terlalu pendek; gunakan secret acak yang kuat.");
}
if (missing.length) problems.push(`Environment wajib belum tersedia: ${missing.join(", ")}`);

if (problems.length) {
  console.error("PRODUCTION PREFLIGHT FAILED");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log("Production environment preflight passed. Ini bukan pengganti security, clinical, backup, atau acceptance tests.");
