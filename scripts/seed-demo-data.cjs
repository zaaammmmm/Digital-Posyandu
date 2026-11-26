#!/usr/bin/env node
/*
 * Digital Posyandu — DEMO data seeder (development / staging only).
 *
 * Fills every non-identity collection with SYNTHETIC records so you can log in as each
 * existing user (parent, cadre, health_worker, posyandu_admin, content_reviewer, system_admin)
 * and see populated screens. It never creates or edits Auth users, `users` or `memberships`:
 * it only READS memberships to discover which accounts exist and links data to them.
 *
 *   npm run seed:demo                    # dry run: prints the plan, writes nothing
 *   npm run seed:demo -- --apply         # writes/synchronises demo documents
 *   npm run seed:demo -- --clean --apply # removes every demo document again
 *
 * Safety: all documents have ids "demo-*" and seededBy="digital-posyandu-demo-seed"; the script only
 * ever overwrites/deletes documents carrying that marker, and aborts if an id is taken by anything else.
 * Re-running is safe: the dataset is replaced (dates are relative to "today").
 * Do NOT run against a production tenant with real children.
 */
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const { MARKER, COLLECTIONS, buildDemoDataset } = require('./demo-data/dataset.cjs');
const { createEncryptor } = require('./demo-data/field-encryption.cjs');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value.replace(/\\n/g, '\n');
  }
}

const args = process.argv.slice(2);
const hasFlag = name => args.includes(name);
const valueOf = name => {
  const hit = args.find(a => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : undefined;
};
const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

function usage() {
  console.log(`Digital Posyandu — seeder data DEMO (sintetis)

Penggunaan:  node scripts/seed-demo-data.cjs [opsi]

  (tanpa opsi)              dry run: tampilkan rencana, tidak menulis apa pun
  --apply                   tulis/sinkronkan dokumen demo
  --clean                   hapus semua dokumen demo (butuh --apply untuk benar-benar menghapus)
  --posyandu=<id>           tenant tujuan (default: SEED_POSYANDU_ID, atau otomatis bila hanya ada satu)
  --draft-reference-only    jadwal imunisasi tetap draft & knowledge base tetap pending_review
                            (tanpa katalog "approved" bergaris [DEMO])
  --allow-production        izinkan saat NODE_ENV=production (tidak disarankan)
`);
}

function initAdmin() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_ADMIN_PROJECT_ID atau NEXT_PUBLIC_FIREBASE_PROJECT_ID wajib diatur.');
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  if (!admin.apps.length) {
    if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey }), projectId });
    } else if (emulator) {
      admin.initializeApp({ projectId });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });
    }
  }
  return { projectId, emulator };
}

async function detectPosyandu(db) {
  const snap = await db.collection('memberships').limit(500).get();
  const ids = [...new Set(snap.docs.filter(d => d.data().status === 'active').map(d => d.data().posyanduId).filter(Boolean))];
  if (ids.length === 1) return ids[0];
  throw new Error(ids.length
    ? `Ditemukan beberapa Posyandu (${ids.join(', ')}). Tentukan dengan --posyandu=<id> atau SEED_POSYANDU_ID.`
    : 'Tidak ada membership aktif. Buat akun terlebih dahulu (npm run seed:firestore) atau isi SEED_POSYANDU_ID.');
}

async function discoverActors(db, posyanduId) {
  const snap = await db.collection('memberships').where('posyanduId', '==', posyanduId).get();
  const byRole = {};
  for (const doc of snap.docs) {
    const m = doc.data();
    if (m.status !== 'active' || typeof m.userId !== 'string' || !m.userId) continue;
    (byRole[m.role] ||= []).push(m.userId);
  }
  for (const list of Object.values(byRole)) list.sort();
  const allUids = [...new Set(Object.values(byRole).flat())];
  const info = new Map();
  for (const part of chunk(allUids, 100)) {
    const docs = await db.getAll(...part.map(uid => db.collection('users').doc(uid)));
    docs.forEach((d, i) => info.set(part[i], d.exists ? { email: d.data().email || null, displayName: d.data().displayName || '' } : { email: null, displayName: '' }));
  }
  const actors = {
    parents: (byRole.parent || []).map(uid => ({ uid, displayName: info.get(uid)?.displayName || '' })),
    cadres: byRole.cadre || [],
    healthWorkers: byRole.health_worker || [],
    admins: byRole.posyandu_admin || [],
    reviewers: [...(byRole.content_reviewer || []), ...(byRole.system_admin || [])],
  };
  return { actors, byRole, info };
}

async function findMarked(db, collection, posyanduId) {
  const snap = await db.collection(collection).where('seededBy', '==', MARKER).get();
  return snap.docs.filter(d => d.data().posyanduId === undefined || d.data().posyanduId === posyanduId);
}

async function assertNoCollisions(db, dataset) {
  for (const collection of COLLECTIONS) {
    const entries = dataset.collections[collection];
    for (const part of chunk(entries, 200)) {
      const existing = await db.getAll(...part.map(e => db.collection(collection).doc(e.id)));
      for (const doc of existing) {
        if (!doc.exists) continue;
        const data = doc.data();
        if (data.seededBy !== MARKER) {
          throw new Error(`${collection}/${doc.id} sudah ada dan bukan data demo; seeder berhenti agar tidak menimpa data nyata.`);
        }
        if (data.posyanduId !== undefined && data.posyanduId !== dataset.posyanduId) {
          throw new Error(`${collection}/${doc.id} adalah data demo milik tenant "${data.posyanduId}". Jalankan --clean untuk tenant tersebut terlebih dahulu.`);
        }
      }
    }
  }
}

async function commit(db, operations) {
  for (const part of chunk(operations, 400)) {
    const batch = db.batch();
    for (const op of part) {
      if (op.type === 'set') batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    }
    await batch.commit();
  }
}

function printActors(actors, warnings) {
  console.log('Akun yang ditemukan (membership aktif):');
  console.log(`  parent: ${actors.parents.length}  cadre: ${actors.cadres.length}  health_worker: ${actors.healthWorkers.length}  posyandu_admin: ${actors.admins.length}  content_reviewer/system_admin: ${actors.reviewers.length}`);
  for (const w of warnings) console.log(`  [PERINGATAN] ${w}`);
  console.log('');
}

function printLoginGuide(dataset, byRole, info, posyanduId) {
  const label = uid => {
    const i = info.get(uid) || {};
    return `${i.email || '(email tidak ditemukan)'}${i.displayName ? ` — ${i.displayName}` : ''}`;
  };
  console.log(`Panduan login (isi "Posyandu ID" = ${posyanduId} pada halaman login):`);
  const expect = {
    parent: 'anak yang tertaut, grafik, riwayat kunjungan, imunisasi, ringkasan, permintaan koreksi, privasi',
    cadre: 'daftar anak, kunjungan hari ini, tindak lanjut, buku administrasi, panduan kader',
    health_worker: 'antrean verifikasi, imunisasi/vitamin menunggu, permintaan koreksi, audit trail',
    posyandu_admin: 'audit trail, rekap CSV, daftar pengguna',
    content_reviewer: 'katalog aturan imunisasi, knowledge base, antrean peninjauan',
    system_admin: 'katalog aturan imunisasi, knowledge base, audit trail, pengguna',
  };
  for (const role of Object.keys(expect)) {
    const uids = byRole[role] || [];
    if (!uids.length) { console.log(`  ${role}: (belum ada akun)`); continue; }
    for (const uid of uids) {
      let extra = '';
      if (role === 'parent') {
        const kids = dataset.children.filter(c => c.guardianUids.includes(uid)).map(c => `${c.name} (${c.registrationNumber})`);
        extra = kids.length ? ` → ${kids.join(', ')}` : ' → (tidak ada anak tertaut)';
      }
      console.log(`  ${role}: ${label(uid)}${extra}`);
    }
    console.log(`      melihat: ${expect[role]}`);
  }
  console.log('');
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) return usage();
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
  const apply = hasFlag('--apply');
  const cleanOnly = hasFlag('--clean');
  if (process.env.NODE_ENV === 'production' && !hasFlag('--allow-production')) {
    throw new Error('NODE_ENV=production: seeder data demo ditolak. Data sintetis tidak boleh masuk lingkungan produksi (gunakan --allow-production hanya jika Anda yakin).');
  }
  const { projectId, emulator } = initAdmin();
  const db = admin.firestore();
  const posyanduId = valueOf('--posyandu') || process.env.SEED_POSYANDU_ID || await detectPosyandu(db);
  const tenant = await db.collection('posyandu').doc(posyanduId).get();
  if (!tenant.exists) throw new Error(`Posyandu "${posyanduId}" tidak ditemukan. Jalankan npm run seed:firestore terlebih dahulu.`);

  console.log(`Project: ${projectId}${emulator ? ' (Firestore emulator)' : ''}\nTenant : ${posyanduId}\nMode   : ${apply ? 'APPLY' : 'DRY RUN'}${cleanOnly ? ' (clean)' : ''}\n`);
  if (tenant.data().status !== 'active') console.log('[PERINGATAN] Posyandu ini tidak berstatus active; login akan ditolak sampai statusnya active.\n');

  if (cleanOnly) {
    const ops = [];
    for (const collection of COLLECTIONS) {
      const docs = await findMarked(db, collection, posyanduId);
      docs.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
      if (docs.length) console.log(`  ${collection}: ${docs.length} dokumen demo`);
    }
    console.log(`\nTotal dokumen demo yang ${apply ? 'dihapus' : 'akan dihapus'}: ${ops.length}`);
    if (apply) { await commit(db, ops); console.log('Selesai. users/memberships tidak disentuh.'); }
    else console.log('Tidak ada yang dihapus. Tambahkan --apply untuk menghapus.');
    return;
  }

  const { actors, byRole, info } = await discoverActors(db, posyanduId);
  const warnings = [];
  if (!actors.parents.length) warnings.push('Belum ada akun parent: anak tidak tertaut ke wali mana pun (halaman orang tua akan kosong).');
  if (!actors.cadres.length) warnings.push('Belum ada akun cadre: data dicatat atas nama pengguna placeholder.');
  if (!actors.healthWorkers.length) warnings.push('Belum ada akun health_worker: verifikasi dicatat atas nama pengguna placeholder.');
  if (!actors.admins.length) warnings.push('Belum ada akun posyandu_admin.');
  if (!actors.reviewers.length) warnings.push('Belum ada content_reviewer/system_admin: reviewer data referensi memakai pengguna placeholder.');
  printActors(actors, warnings);

  const encrypt = createEncryptor();
  if (!encrypt) console.log('[PERINGATAN] FIELD_ENCRYPTION_KEY tidak valid/kosong: kontak wali demo dibiarkan null.\n');
  const dataset = buildDemoDataset({ posyanduId, actors, encrypt, approveReference: !hasFlag('--draft-reference-only') });

  await assertNoCollisions(db, dataset);
  const stale = [];
  for (const collection of COLLECTIONS) {
    const keep = new Set(dataset.collections[collection].map(e => e.id));
    (await findMarked(db, collection, posyanduId)).filter(d => !keep.has(d.id)).forEach(d => stale.push({ collection, ref: d.ref }));
  }

  console.log('Rencana dokumen demo:');
  for (const collection of COLLECTIONS) console.log(`  ${collection.padEnd(30)} ${String(dataset.counts[collection]).padStart(4)}`);
  console.log(`  ${'TOTAL'.padEnd(30)} ${String(dataset.total).padStart(4)}   (dokumen demo usang yang dihapus: ${stale.length})\n`);

  if (!apply) {
    printLoginGuide(dataset, byRole, info, posyanduId);
    console.log('Tidak ada data yang ditulis. Jalankan ulang dengan --apply untuk menerapkan.');
    return;
  }

  const ops = [];
  for (const collection of COLLECTIONS) {
    for (const entry of dataset.collections[collection]) ops.push({ type: 'set', ref: db.collection(collection).doc(entry.id), data: entry.data });
  }
  stale.forEach(s => ops.push({ type: 'delete', ref: s.ref }));
  await commit(db, ops);
  console.log(`Selesai: ${dataset.total} dokumen ditulis, ${stale.length} dokumen demo usang dihapus.\n`);
  printLoginGuide(dataset, byRole, info, posyanduId);
  console.log('Hapus data demo kapan saja dengan: npm run seed:demo -- --clean --apply');
}

main()
  .then(async () => { try { await admin.app().delete(); } catch { /* ignore */ } })
  .catch(async error => {
    console.error(error instanceof Error ? error.message : error);
    try { await admin.app().delete(); } catch { /* ignore */ }
    process.exitCode = 1;
  });
