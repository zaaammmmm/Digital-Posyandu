#!/usr/bin/env node
/*
 * Digital Posyandu — idempotent Firebase bootstrap seeder.
 * Safe by default: preview only. Pass --apply to write.
 * Never seeds synthetic child/clinical records or approves clinical references.
 */
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value.replace(/\\n/g, '\n');
  }
}

const cwd = process.cwd();
loadEnvFile(path.join(cwd, '.env.local'));
loadEnvFile(path.join(cwd, '.env'));
const apply = process.argv.includes('--apply');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const posyanduId = process.env.SEED_POSYANDU_ID;
if (!projectId) throw new Error('FIREBASE_ADMIN_PROJECT_ID atau NEXT_PUBLIC_FIREBASE_PROJECT_ID wajib diatur.');
if (!posyanduId) throw new Error('SEED_POSYANDU_ID wajib diatur; gunakan ID tenant internal yang stabil.');

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
let credential;
if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey) {
  credential = admin.credential.cert({
    projectId,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  });
} else {
  credential = admin.credential.applicationDefault();
}
if (!admin.apps.length) admin.initializeApp({ credential, projectId });
const db = admin.firestore();
const auth = admin.auth();
const now = new Date().toISOString();
const ops = [];

const posyandu = {
  id: posyanduId,
  name: process.env.SEED_POSYANDU_NAME || 'Posyandu Baru',
  addressArea: process.env.SEED_POSYANDU_ADDRESS_AREA || '',
  village: process.env.SEED_POSYANDU_VILLAGE || '',
  district: process.env.SEED_POSYANDU_DISTRICT || '',
  regency: process.env.SEED_POSYANDU_REGENCY || '',
  province: process.env.SEED_POSYANDU_PROVINCE || '',
  serviceSchedule: process.env.SEED_POSYANDU_SERVICE_SCHEDULE || '',
  status: 'active',
  createdAt: now,
  updatedAt: now,
  seededBy: 'digital-posyandu-bootstrap',
};
ops.push({ label: `posyandu/${posyanduId}`, run: async () => {
  const ref = db.collection('posyandu').doc(posyanduId);
  const snap = await ref.get();
  if (!snap.exists) await ref.create(posyandu);
  return snap.exists ? 'sudah ada — tidak diubah' : 'dibuat';
}});

function planAccount(kind, role, prefix, defaultDisplayName) {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email && !password) return;
  if (!email || !password) throw new Error(`${prefix}_EMAIL dan ${prefix}_PASSWORD harus diisi bersama.`);
  if (password.length < 12) throw new Error(`${prefix}_PASSWORD minimal 12 karakter.`);
  const displayName = process.env[`${prefix}_NAME`] || defaultDisplayName;
  ops.push({ label: `${kind} ${email} + membership ${posyanduId}`, run: async () => {
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
      user = await auth.createUser({ email, password, displayName, emailVerified: false, disabled: false });
    }
    const userRef = db.collection('users').doc(user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) await userRef.create({
      uid: user.uid, email: user.email || email, displayName: user.displayName || displayName,
      accountStatus: user.disabled ? 'disabled' : 'active', createdAt: now, updatedAt: now,
      seededBy: 'digital-posyandu-bootstrap',
    });
    const membershipId = `${user.uid}_${posyanduId}`;
    const membershipRef = db.collection('memberships').doc(membershipId);
    const membershipSnap = await membershipRef.get();
    if (!membershipSnap.exists) await membershipRef.create({
      userId: user.uid, posyanduId, role, scope: 'posyandu', status: 'active',
      createdBy: 'digital-posyandu-bootstrap', createdAt: now, updatedAt: now,
    });
    else if (membershipSnap.data().status !== 'active' || membershipSnap.data().role !== role) {
      throw new Error(`Membership ${membershipId} sudah ada dengan role/status berbeda; ubah melalui prosedur administrasi, bukan seeder.`);
    }
    return `Auth UID ${user.uid}; ${userSnap.exists ? 'user doc ada' : 'user doc dibuat'}; ${membershipSnap.exists ? 'membership ada' : 'membership dibuat'}`;
  }});
}

planAccount('admin', 'posyandu_admin', 'SEED_ADMIN', 'Administrator Posyandu');
planAccount('reviewer', 'content_reviewer', 'SEED_REVIEWER', 'Reviewer Konten');
// Optional operational accounts. Use real staff accounts in production; for local tests use synthetic names only.
planAccount('cadre', 'cadre', 'SEED_CADRE', 'Kader Posyandu');
planAccount('health_worker', 'health_worker', 'SEED_HEALTH_WORKER', 'Bidan / Tenaga Kesehatan');
planAccount('parent', 'parent', 'SEED_PARENT', 'Orang Tua / Wali');

function readJsonArray(fileEnv, label) {
  const filename = process.env[fileEnv];
  if (!filename) return [];
  const resolved = path.resolve(cwd, filename);
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${fileEnv} harus menunjuk JSON array: ${label}.`);
  return parsed;
}

for (const rule of readJsonArray('SEED_IMMUNIZATION_RULES_FILE', 'immunization rules')) {
  for (const field of ['id', 'vaccineCode', 'ruleDescription', 'effectiveFrom', 'officialSource', 'sourceDocumentVersion']) {
    if (typeof rule[field] !== 'string' || !rule[field].trim()) throw new Error(`Aturan imunisasi: field ${field} wajib ada.`);
  }
  ops.push({ label: `immunization_schedule_rules/${rule.id}`, run: async () => {
    const ref = db.collection('immunization_schedule_rules').doc(rule.id);
    const snap = await ref.get();
    if (snap.exists) return 'sudah ada — tidak diubah';
    await ref.create({ ...rule, status: 'draft', reviewedBy: null, approvedAt: null,
      createdAt: now, updatedAt: now, seededBy: 'digital-posyandu-bootstrap' });
    return 'dibuat sebagai draft (tidak aktif untuk pengingat produksi)';
  }});
}

for (const doc of readJsonArray('SEED_KNOWLEDGE_DOCUMENTS_FILE', 'knowledge documents')) {
  for (const field of ['id', 'title', 'text', 'sourceTitle', 'version']) {
    if (typeof doc[field] !== 'string' || !doc[field].trim()) throw new Error(`Knowledge document: field ${field} wajib ada.`);
  }
  ops.push({ label: `knowledge_documents/${doc.id}`, run: async () => {
    const ref = db.collection('knowledge_documents').doc(doc.id);
    const snap = await ref.get();
    if (snap.exists) return 'sudah ada — tidak diubah';
    await ref.create({ ...doc, status: 'pending_review', reviewedBy: null, reviewedAt: null,
      createdAt: now, seededBy: 'digital-posyandu-bootstrap' });
    return 'dibuat sebagai pending_review';
  }});
}

ops.push({ label: `_system/bootstrap`, run: async () => {
  const ref = db.collection('_system').doc('bootstrap');
  const snap = await ref.get();
  if (!snap.exists) await ref.create({
    application: 'digital-posyandu', schemaVersion: 1,
    seededAt: now,
    collectionCatalog: [
      'posyandu', 'users', 'memberships', 'children', 'guardians', 'child_guardians',
      'consent_records', 'visits', 'anthropometry_measurements', 'growth_assessments',
      'immunization_events', 'immunization_schedule_rules', 'supplement_events',
      'development_screenings', 'ai_summaries', 'education_content', 'administrative_records',
      'audit_logs', 'correction_requests', 'knowledge_documents',
    ],
    note: 'Catalog only. Clinical collections are created by validated application workflows; no synthetic patient data is seeded.',
  });
  return snap.exists ? 'sudah ada — tidak diubah' : 'dibuat';
}});

(async () => {
  console.log(`Project: ${projectId}\nTenant: ${posyanduId}\nMode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);
  for (const op of ops) {
    if (!apply) console.log(`[PLAN] ${op.label}`);
    else console.log(`[OK] ${op.label}: ${await op.run()}`);
  }
  if (!apply) console.log('\nTidak ada data yang ditulis. Jalankan ulang dengan --apply untuk menerapkan seed.');
  else console.log('\nSeed selesai. Tidak ada koleksi klinis pasien yang diisi dengan data fiktif.');
  await admin.app().delete();
})().catch(async error => {
  console.error(error);
  try { await admin.app().delete(); } catch {}
  process.exitCode = 1;
});
