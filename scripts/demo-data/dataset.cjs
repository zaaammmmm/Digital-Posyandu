'use strict';
/*
 * Digital Posyandu — synthetic DEMO dataset builder (pure: no I/O, no Firebase).
 *
 * Produces documents for every non-identity collection in the shapes written by the
 * application's own API routes, so each role sees realistic data after login:
 *   parent, cadre, health_worker, posyandu_admin, content_reviewer / system_admin.
 *
 * Rules this builder follows (see docs/FIRESTORE-COLLECTION-CATALOG.md):
 *  - every document id starts with "demo-" and carries seededBy = MARKER, so the
 *    seeder can sync/clean exactly its own documents and nothing else;
 *  - Z-scores are NEVER invented: growth_assessments mirror the fail-closed engine
 *    (zScore null, REFERENCE_DATA_REQUIRED);
 *  - raw measurements are synthetic and are not claimed to follow any WHO reference;
 *  - reference/education text is neutral, labelled "[DEMO]" and is not official material.
 *
 * Dates are relative to `now` so ages, "today" counters and queues stay meaningful.
 */

const MARKER = 'digital-posyandu-demo-seed';

const COLLECTIONS = [
  'guardians', 'child_guardians', 'children', 'consent_records', 'visits',
  'anthropometry_measurements', 'growth_assessments', 'immunization_events',
  'supplement_events', 'development_screenings', 'ai_summaries', 'correction_requests',
  'administrative_records', 'audit_logs', 'education_content', 'knowledge_documents',
  'immunization_schedule_rules',
];

// ---------------------------------------------------------------- date helpers (UTC strings)
const DAY_MS = 86400000;
const toDate = s => new Date(`${s}T00:00:00.000Z`);
const fmt = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => fmt(new Date(toDate(s).getTime() + n * DAY_MS));
function addMonths(s, n) {
  const d = toDate(s);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fmt(d);
}
// Same algorithm as src/lib/growth/age.ts
function ageMonthsAt(dob, at) {
  const a = toDate(dob);
  const b = toDate(at);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return months;
}
const jakartaDate = d => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
const round1 = n => Math.round(n * 10) / 10;
const pad = (n, w = 2) => String(n).padStart(w, '0');

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

// ---------------------------------------------------------------- synthetic anthropometry
// Illustrative raw values only (NOT a clinical reference). [ageMonths, kg, cm, headCm]
const ANCHORS = [
  [0, 3.3, 49.5, 34.0], [3, 5.9, 61.0, 40.5], [6, 7.5, 67.5, 43.5], [9, 8.6, 72.0, 45.0],
  [12, 9.4, 75.5, 46.0], [18, 10.8, 82.0, 47.2], [24, 12.0, 87.0, 48.0], [36, 14.0, 95.0, 49.5],
  [48, 16.0, 102.0, 50.3], [60, 18.0, 108.0, 51.0],
];
function interpolate(ageM) {
  const m = Math.max(0, Math.min(60, ageM));
  for (let i = 1; i < ANCHORS.length; i++) {
    const [a1, w1, l1, h1] = ANCHORS[i];
    if (m <= a1) {
      const [a0, w0, l0, h0] = ANCHORS[i - 1];
      const t = (m - a0) / (a1 - a0);
      return { w: w0 + (w1 - w0) * t, l: l0 + (l1 - l0) * t, h: h0 + (h1 - h0) * t };
    }
  }
  const last = ANCHORS[ANCHORS.length - 1];
  return { w: last[1], l: last[2], h: last[3] };
}
function vitals(spec, ageM, k) {
  const base = interpolate(ageM);
  const female = spec.sex === 'female';
  const f = spec.growth;
  return {
    weightKg: round1(base.w * (female ? 0.96 : 1) * f),
    lengthHeightCm: round1(base.l * (female ? 0.98 : 1) * (1 + (f - 1) * 0.4)),
    headCircumferenceCm: round1(base.h * (1 + (f - 1) * 0.2)),
    muacCm: round1(13.5 + (f - 1) * 10 + 0.1 * (5 - k)),
  };
}

// Same rules as src/lib/growth/anthropometry-validator.ts
function validateAnthropometry({ ageMonths, weightKg, lengthHeightCm, measurementType }) {
  const qualityFlags = [];
  if (weightKg <= 0 || weightKg > 60) qualityFlags.push('WEIGHT_OUT_OF_TECHNICAL_RANGE');
  if (lengthHeightCm <= 30 || lengthHeightCm > 150) qualityFlags.push('LENGTH_HEIGHT_OUT_OF_TECHNICAL_RANGE');
  if (ageMonths < 24 && measurementType !== 'recumbent_length') qualityFlags.push('AGE_UNDER_24M_EXPECTS_RECUMBENT_LENGTH');
  if (ageMonths >= 24 && measurementType !== 'standing_height') qualityFlags.push('AGE_24M_PLUS_EXPECTS_STANDING_HEIGHT');
  return { isValid: qualityFlags.length === 0, qualityFlags };
}

// Same output as src/lib/growth/growth-engine.ts (fail-closed: no Z-scores).
function growthIndicators(qualityFlags) {
  return ['WAZ', 'LAZ_HAZ', 'WLZ_WHZ'].map(indicator => ({
    indicator, zScore: null,
    classificationCode: qualityFlags.length ? 'MEASUREMENT_NEEDS_VERIFICATION' : 'REFERENCE_DATA_REQUIRED',
    referenceStandard: 'WHO_CHILD_GROWTH_STANDARDS',
    referenceVersion: 'reference-data-not-installed',
    calculationEngineVersion: 'deterministic-engine-1.1.0',
    needsVerification: true,
  }));
}

// Same template as buildFallbackSummary() in src/lib/ai/safety-guard.ts
function fallbackSummary({ visitDate, weightKg, lengthHeightCm, previousWeightKg }) {
  const diff = typeof previousWeightKg === 'number'
    ? ` Berat badan tercatat berubah ${(weightKg - previousWeightKg).toFixed(1)} kg dibandingkan kunjungan sebelumnya.` : '';
  return `Pada kunjungan tanggal ${visitDate}, berat badan anak tercatat ${weightKg} kg ` +
    `dan panjang/tinggi badan ${lengthHeightCm} cm.${diff} ` +
    'Interpretasi pertumbuhan belum tersedia karena referensi standar tervalidasi belum dikonfigurasi. ' +
    'Catatan ini merupakan sarana pemantauan berkala dan bukan diagnosis medis. ' +
    'Untuk informasi pertumbuhan lebih lanjut, silakan berkonsultasi dengan bidan atau petugas Posyandu.';
}

// ---------------------------------------------------------------- scenario definitions
// latest: scenario of the most recent visit. Parent-facing scenarios sit on the first
// children so even a tenant with a single parent account sees every workflow state.
const CHILD_SPECS = [
  { n: 1, name: 'Aisyah Putri Rahma', sex: 'female', ageM: 3, dobOff: 9, growth: 1.0, shift: 0, birthKg: 3.1,
    latest: 'pending', consent: 'granted', request: { k: 1, status: 'pending_review' } },
  { n: 2, name: 'Muhammad Rafi Pratama', sex: 'male', ageM: 8, dobOff: 15, growth: 1.02, shift: 0, birthKg: 3.4,
    latest: 'verified', consent: 'granted', request: { k: 1, status: 'accepted_pending_correction' },
    sources: true, screen: { result: 'sesuai', status: 'verified' },
    extraImm: [{ code: 'Polio', dose: '3', daysAgo: 2, status: 'pending_verification' }] },
  { n: 3, name: 'Keisha Anindita', sex: 'female', ageM: 14, dobOff: 4, growth: 0.97, shift: 6, birthKg: 2.9,
    latest: 'needs_correction', consent: 'withdrawn', request: { k: 2, status: 'rejected' },
    screen: { result: 'meragukan', status: 'verified' },
    extraImm: [{ code: 'Polio', dose: '4', daysAgo: 9, status: 'rejected' }] },
  { n: 4, name: 'Bagas Adi Nugraha', sex: 'male', ageM: 20, dobOff: 11, growth: 1.04, shift: 2, birthKg: 3.6,
    latest: 'pending_flagged', consent: 'declined', screen: { result: 'sesuai', status: 'pending_verification' },
    skipBase: ['DPT-HB-Hib lanjutan'],
    extraImm: [{ code: 'DPT-HB-Hib lanjutan', dose: null, daysAgo: 1, status: 'pending_verification' }] },
  { n: 5, name: 'Nayla Safitri', sex: 'female', ageM: 26, dobOff: 2, growth: 0.99, shift: 14, birthKg: 3.0,
    latest: 'verified', correctedK: 1, consent: 'granted', screen: { result: 'sesuai', status: 'verified' },
    extraSupp: [{ type: 'Vitamin A', daysAgo: 4, status: 'pending_verification' }] },
  { n: 6, name: 'Arkan Wijaya', sex: 'male', ageM: 33, dobOff: 18, growth: 1.01, shift: 10, birthKg: 3.3,
    latest: 'corrected_pending', consent: 'granted', screen: { result: 'meragukan', status: 'verified' },
    extraSupp: [{ type: 'Vitamin A', daysAgo: 12, status: 'rejected' }] },
  { n: 7, name: 'Zahra Kamila', sex: 'female', ageM: 42, dobOff: 7, growth: 0.96, shift: 20, birthKg: 3.2,
    latest: 'verified', status: 'needs_verification', screen: { result: 'sesuai', status: 'verified' } },
  { n: 8, name: 'Dimas Saputra', sex: 'male', ageM: 55, dobOff: 13, growth: 1.03, shift: 120, birthKg: 3.5,
    latest: 'verified', status: 'archived', maxVisits: 2 },
];

const UNLINKED_GUARDIANS = [
  { name: 'Siti Rahayu', relationship: 'ibu' }, { name: 'Budi Santoso', relationship: 'ayah' },
  { name: 'Dewi Lestari', relationship: 'ibu' }, { name: 'Agus Setiawan', relationship: 'ayah' },
  { name: 'Rina Marlina', relationship: 'ibu' },
];

// [code, dose, target age in months] — demo schedule, labelled [DEMO] in rule documents.
const IMMUNIZATION_BASE = [
  ['BCG', null, 1], ['Polio', '1', 1], ['DPT-HB-Hib', '1', 2], ['DPT-HB-Hib', '2', 3],
  ['Campak-Rubella', '1', 9], ['DPT-HB-Hib lanjutan', null, 18],
];

const VISIT_NOTES = ['', 'Anak aktif selama pengukuran.', 'Ibu membawa buku KIA.',
  'Ditimbang tanpa alas kaki dan pakaian tebal.', ''];

function pick(list, i, fallback) { return list.length ? list[i % list.length] : fallback; }

function normalizeActors(actors = {}) {
  const uids = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x) : []);
  const parents = (Array.isArray(actors.parents) ? actors.parents : [])
    .filter(p => p && typeof p.uid === 'string' && p.uid)
    .map((p, i) => ({ uid: p.uid, displayName: (p.displayName || '').trim() || `Wali Demo ${i + 1}` }));
  return {
    cadres: uids(actors.cadres), healthWorkers: uids(actors.healthWorkers),
    admins: uids(actors.admins), reviewers: uids(actors.reviewers), parents,
  };
}

// ---------------------------------------------------------------- builder
function buildDemoDataset(opts) {
  if (!opts || typeof opts.posyanduId !== 'string' || !opts.posyanduId.trim()) throw new Error('posyanduId wajib diisi.');
  const posyanduId = opts.posyanduId.trim();
  const now = opts.now instanceof Date ? opts.now : new Date();
  const nowIso = now.toISOString();
  const today = jakartaDate(now);
  const approveReference = opts.approveReference !== false;
  const encrypt = typeof opts.encrypt === 'function' ? opts.encrypt : null;
  const A = normalizeActors(opts.actors);

  const recorders = A.cadres.length ? A.cadres : A.healthWorkers;
  const verifiers = A.healthWorkers;
  const reviewerUid = pick(A.reviewers.length ? A.reviewers : A.admins, 0, 'demo-missing-reviewer');
  const adminUid = pick(A.admins.length ? A.admins : A.cadres, 0, 'demo-missing-admin');
  const hwUid = i => pick(verifiers, i, 'demo-missing-health-worker');
  const recUid = i => pick(recorders, i, 'demo-missing-cadre');

  const out = Object.fromEntries(COLLECTIONS.map(c => [c, []]));
  const add = (collection, id, data) => out[collection].push({ id, data: clean({ ...data, seededBy: MARKER }) });
  const stamp = (date, hhmm = '01:30') => {
    const iso = `${date}T${hhmm}:00.000Z`;
    return iso > nowIso ? nowIso : iso;
  };
  const audits = [];
  const audit = (actorUserId, action, resourceType, resourceId, beforeSnapshot, afterSnapshot, reason, timestamp) =>
    audits.push({ actorUserId, action, resourceType, resourceId, beforeSnapshot, afterSnapshot, reason, posyanduId, timestamp });

  // ---- parent <-> child assignment
  const P = A.parents.length;
  const linkedCount = P ? Math.min(7, 3 * P) : 0;
  const guardianUidsFor = i => {
    if (i >= linkedCount) return [];
    const uids = [A.parents[i % P].uid];
    if (i === 1 && P >= 2) uids.push(A.parents[(i + 1) % P].uid);
    return uids;
  };

  // ---- guardians (+ account-less guardians for children without parent login)
  const guardianIdByUid = new Map();
  A.parents.forEach((p, i) => {
    const id = `demo-guardian-p${pad(i + 1)}`;
    guardianIdByUid.set(p.uid, id);
    add('guardians', id, {
      posyanduId, userId: p.uid, fullName: p.displayName, relationship: 'wali',
      contactEncrypted: encrypt ? encrypt(`DEMO-KONTAK-P${pad(i + 1)}`) : null,
      createdBy: recUid(i), createdAt: stamp(addDays(today, -150), '02:00'), updatedAt: stamp(addDays(today, -150), '02:00'),
    });
  });

  const summaryRows = []; // for the CLI "who sees what" report
  const childStates = [];

  CHILD_SPECS.forEach((spec, idx) => {
    const childId = `demo-child-${pad(spec.n)}`;
    const guardianUids = guardianUidsFor(idx);
    const dob = addDays(addMonths(today, -spec.ageM), -spec.dobOff);
    const createdAt = stamp(addDays(today, -160 + spec.n), '03:00');
    add('children', childId, {
      posyanduId, registrationNumber: `DEMO-${pad(spec.n, 3)}`, fullName: spec.name, dateOfBirth: dob,
      sex: spec.sex, birthWeightKg: spec.birthKg, guardianUids, recordStatus: spec.status || 'active',
      createdAt, updatedAt: createdAt, createdBy: recUid(idx),
    });

    // guardians for this child
    const guardianDocIds = guardianUids.map(uid => guardianIdByUid.get(uid));
    if (!guardianUids.length) {
      const g = UNLINKED_GUARDIANS[idx % UNLINKED_GUARDIANS.length];
      const gid = `demo-guardian-n${pad(spec.n)}`;
      add('guardians', gid, {
        posyanduId, userId: null, fullName: g.name, relationship: g.relationship,
        contactEncrypted: encrypt ? encrypt(`DEMO-KONTAK-N${pad(spec.n)}`) : null,
        createdBy: recUid(idx), createdAt, updatedAt: createdAt,
      });
      guardianDocIds.push(gid);
    }

    // ---- consent history (ai_summary purpose) — only for children with a guardian login
    const firstVisitCandidate = addDays(today, -(spec.shift + 28 * ((spec.maxVisits || 6) - 1)));
    const consentBase = addDays(firstVisitCandidate > dob ? firstVisitCandidate : dob, -1);
    const consentIds = [];
    let withdrawnTs = null;
    let declined = false;
    if (guardianUids.length && spec.consent) {
      const guardianUid = guardianUids[0];
      const record = (seq, status, ts) => {
        const id = `demo-consent-c${pad(spec.n)}-${pad(seq)}`;
        consentIds.push(id);
        add('consent_records', id, {
          posyanduId, childId, guardianUid, capturedBy: guardianUid, purpose: 'ai_summary',
          noticeVersion: 'draft-1', consentStatus: status, capturedAt: ts,
          withdrawnAt: status === 'withdrawn' ? ts : null, createdBy: guardianUid,
        });
      };
      if (spec.consent === 'declined') { declined = true; record(1, 'declined', stamp(consentBase, '02:00')); }
      else {
        record(1, 'granted', stamp(consentBase, '02:00'));
        if (spec.consent === 'withdrawn') {
          withdrawnTs = stamp(addDays(today, -20), '03:00');
          record(2, 'withdrawn', withdrawnTs);
        }
      }
    }
    guardianDocIds.forEach((gid, gi) => {
      add('child_guardians', `demo-link-c${pad(spec.n)}-g${pad(gi + 1)}`, {
        posyanduId, childId, guardianId: gid, guardianUid: guardianUids[gi] || null,
        relationship: guardianUids.length ? 'wali' : UNLINKED_GUARDIANS[idx % UNLINKED_GUARDIANS.length].relationship,
        isPrimary: gi === 0, authorizationStatus: 'authorized', consentRecordId: consentIds[0] || null,
        createdBy: recUid(idx), createdAt, updatedAt: createdAt,
      });
    });

    // ---- visits (oldest first, numbered v01..)
    const maxVisits = spec.maxVisits || 6;
    const slots = [];
    for (let k = maxVisits - 1; k >= 0; k--) {
      const date = addDays(today, -(spec.shift + 28 * k));
      if (date >= dob && date <= today) slots.push({ k, date });
    }
    const guardianUid = guardianUids[0] || null;
    const state = { id: childId, spec, dob, guardianUids, visits: [] };
    const history = []; // verified active weights, chronological

    slots.forEach((slot, vi) => {
      const { k, date } = slot;
      const vNo = pad(vi + 1);
      const visitId = `demo-visit-c${pad(spec.n)}-v${vNo}`;
      const scenario = k === 0 ? spec.latest : (k === spec.correctedK ? 'corrected_verified' : 'verified');
      const recorder = recUid(idx + vi);
      const verifier = hwUid(idx + vi);
      const ageMonths = ageMonthsAt(dob, date);
      const truth = vitals(spec, ageMonths, k);
      const type = ageMonths >= 24 ? 'standing_height' : 'recumbent_length';
      const measuredType = scenario === 'pending_flagged' ? 'standing_height' : type;
      const createdTs = stamp(date, '01:30');
      const verifyTs = stamp(date, '04:00');
      const withOptional = (base, extra = {}) => {
        const o = { ...base, ...extra };
        if (ageMonths < 36 && (spec.n + k) % 2 === 0) o.headCircumferenceCm = truth.headCircumferenceCm;
        if (ageMonths >= 6 && (spec.n + k) % 3 === 0) o.muacCm = truth.muacCm;
        return o;
      };
      const measureBase = (weightKg, lengthHeightCm, mType, measId, status, extra = {}) => {
        const flags = validateAnthropometry({ ageMonths, weightKg, lengthHeightCm, measurementType: mType }).qualityFlags;
        return withOptional({
          visitId, childId, posyanduId, ageMonths, sex: spec.sex, weightKg, lengthHeightCm, measurementType: mType,
          measurementMethod: ageMonths < 24 ? 'Infantometer + timbangan bayi' : 'Stadiometer + timbangan injak digital',
          equipmentId: ageMonths < 24 ? 'POSY-ALAT-01' : 'POSY-ALAT-02',
          measurementUnit: { weight: 'kg', lengthHeight: 'cm', headCircumference: 'cm', muac: 'cm' },
          measurementNotes: null, qualityFlags: flags, verificationStatus: status,
          measuredAt: stamp(date, '01:35'), recordedBy: recorder, ...extra,
        });
      };
      const visitBase = (status, version, extra = {}) => ({
        childId, posyanduId, guardianUid, visitDate: date, recordedBy: recorder, verificationStatus: status,
        notes: VISIT_NOTES[(spec.n + vi) % VISIT_NOTES.length], version, createdAt: createdTs, updatedAt: createdTs, ...extra,
      });
      const pendingSnapshot = visitBase('pending_verification', 1);
      const assess = (measId, measData, ts) => growthIndicators(measData.qualityFlags).forEach(a =>
        add('growth_assessments', `demo-growth-${measId.slice('demo-meas-'.length)}-${a.indicator}`, {
          ...a, measurementId: measId, childId, posyanduId, guardianUid,
          reviewStatus: 'needs_reference_validation', calculatedAt: ts,
        }));
      const verifyAudit = (before, version, ts, who) =>
        audit(who, 'VERIFY_VISIT', 'visit', visitId, before,
          { verificationStatus: 'verified', verifiedBy: who, version }, 'Verifikasi oleh petugas berwenang', ts);

      const measId = `demo-meas-c${pad(spec.n)}-v${vNo}`;
      let finalVerified = false;
      let finalVersion = 1;
      let finalTs = verifyTs;
      let activeMeas = null;
      let status = 'pending_verification';

      if (scenario === 'verified') {
        const m = measureBase(truth.weightKg, truth.lengthHeightCm, type, measId, 'verified', { updatedAt: verifyTs });
        add('anthropometry_measurements', measId, m);
        add('visits', visitId, visitBase('verified', 2, { verifiedBy: verifier, verifiedAt: verifyTs, updatedAt: verifyTs }));
        assess(measId, m, verifyTs);
        verifyAudit(pendingSnapshot, 2, verifyTs, verifier);
        finalVerified = true; finalVersion = 2; status = 'verified'; activeMeas = m;
      } else if (scenario === 'pending' || scenario === 'pending_flagged') {
        const m = measureBase(truth.weightKg, truth.lengthHeightCm, measuredType, measId, 'pending_verification');
        add('anthropometry_measurements', measId, m);
        add('visits', visitId, visitBase('pending_verification', 1));
      } else if (scenario === 'needs_correction') {
        const reason = 'Berat badan tidak konsisten dengan kunjungan sebelumnya; mohon timbang ulang dan catat kembali.';
        const rejTs = stamp(date, '04:10');
        const m = measureBase(round1(truth.weightKg + 1.4), truth.lengthHeightCm, type, measId, 'needs_correction', { updatedAt: rejTs });
        add('anthropometry_measurements', measId, m);
        add('visits', visitId, visitBase('needs_correction', 2, {
          rejectionReason: reason, rejectedBy: verifier, rejectedAt: rejTs, updatedAt: rejTs,
        }));
        audit(verifier, 'REJECT_VISIT_VERIFICATION', 'visit', visitId, { verificationStatus: 'pending_verification' },
          { verificationStatus: 'needs_correction', version: 2 }, reason, rejTs);
        status = 'needs_correction'; finalVersion = 2;
      } else if (scenario === 'corrected_pending' || scenario === 'corrected_verified') {
        // Lifecycle: record -> verify (v2) -> correct (v3) [-> re-verify (v4)]
        const completed = scenario === 'corrected_verified';
        const lengthError = spec.n === 5; // c5: length typo, c6: weight typo
        const wrongW = lengthError ? truth.weightKg : round1(truth.weightKg + 1.0);
        const wrongL = lengthError ? round1(truth.lengthHeightCm + 5.0) : truth.lengthHeightCm;
        const oldId = measId;
        const newId = `${measId}-r1`;
        const correctDate = addDays(date, completed ? 3 : 1);
        const correctTs = stamp(correctDate, '03:00');
        const reverifyTs = stamp(correctDate, '05:00');
        const corrector = hwUid(idx + vi + 1);
        const reason = lengthError
          ? 'Koreksi panjang/tinggi badan: terdapat salah catat pada hasil ukur awal.'
          : 'Koreksi berat badan: terdapat salah baca timbangan pada hasil ukur awal.';
        const oldM = measureBase(wrongW, wrongL, type, oldId, 'verified',
          { updatedAt: verifyTs, supersededAt: correctTs, supersededBy: newId });
        const flags = [...validateAnthropometry({ ageMonths, weightKg: truth.weightKg, lengthHeightCm: truth.lengthHeightCm,
          measurementType: type }).qualityFlags, 'CORRECTED_REQUIRES_REVERIFICATION'];
        const newM = {
          ...oldM, weightKg: truth.weightKg, lengthHeightCm: truth.lengthHeightCm, measurementType: type,
          version: 3, supersedesMeasurementId: oldId, qualityFlags: flags,
          verificationStatus: completed ? 'verified' : 'pending_verification',
          measuredAt: correctTs, recordedBy: corrector,
        };
        delete newM.supersededAt; delete newM.supersededBy;
        if (completed) newM.updatedAt = reverifyTs; else delete newM.updatedAt;
        add('anthropometry_measurements', oldId, oldM);
        add('anthropometry_measurements', newId, newM);
        assess(oldId, oldM, verifyTs);
        verifyAudit(pendingSnapshot, 2, verifyTs, verifier);
        audit(corrector, 'CORRECT_VISIT_DATA', 'visit', visitId, oldM, newM, reason, correctTs);
        if (completed) {
          assess(newId, newM, reverifyTs);
          add('visits', visitId, visitBase('verified', 4, {
            verifiedBy: corrector, verifiedAt: reverifyTs, correctionReason: reason, updatedAt: reverifyTs }));
          verifyAudit({ verificationStatus: 'pending_verification', version: 3 }, 4, reverifyTs, corrector);
          finalVerified = true; finalVersion = 4; finalTs = reverifyTs; status = 'verified'; activeMeas = newM;
        } else {
          add('visits', visitId, visitBase('pending_verification', 3, {
            verifiedBy: verifier, verifiedAt: verifyTs, correctionReason: reason, updatedAt: correctTs }));
          // verifiedBy/At belong to the superseded verification; app keeps them until re-verification.
          finalVersion = 3; status = 'pending_verification';
        }
      }

      // ---- AI summary (what POST /api/visits/{id}/verify would have produced)
      if (finalVerified) {
        const prev = history.length ? history[history.length - 1] : null;
        const consentOk = !declined && !(withdrawnTs && finalTs >= withdrawnTs);
        if (consentOk) {
          const generatedAtRaw = new Date(Date.parse(finalTs) + 2 * 60000).toISOString();
          const generatedAt = generatedAtRaw > nowIso ? nowIso : generatedAtRaw;
          const withSource = spec.sources && k === 0 && approveReference;
          const text = withSource
            ? `Pada kunjungan tanggal ${date}, berat badan anak tercatat ${activeMeas.weightKg} kg dan panjang/tinggi badan ` +
              `${activeMeas.lengthHeightCm} cm. Edukasi umum: pantau berat dan panjang/tinggi badan anak setiap bulan di ` +
              'Posyandu dan catat pada buku KIA. Konsultasikan hasil pengukuran dengan bidan atau petugas Posyandu.'
            : fallbackSummary({ visitDate: date, weightKg: activeMeas.weightKg, lengthHeightCm: activeMeas.lengthHeightCm,
              previousWeightKg: prev ? prev.weightKg : null });
          add('ai_summaries', `demo-summary-c${pad(spec.n)}-v${vNo}`, {
            posyanduId, guardianUid, visitId, childId, inputRecordVersion: finalVersion,
            modelProvider: withSource ? 'demo-seed' : 'deterministic-fallback',
            modelVersion: withSource ? 'static-text-1' : 'template-1.0.0',
            promptVersion: 'visit-summary-id-v1.1',
            knowledgeSourceIds: withSource ? ['demo-knowledge-01'] : [],
            generatedText: text, safetyStatus: withSource ? 'passed' : 'fallback_template',
            reviewStatus: 'auto_checked', generatedAt,
          });
        }
        history.push({ weightKg: activeMeas.weightKg, date });
      }
      state.visits.push({ id: visitId, k, date, scenario, status, version: finalVersion, vi, verified: finalVerified });
    });

    childStates.push(state);
    summaryRows.push({ childId, name: spec.name, registrationNumber: `DEMO-${pad(spec.n, 3)}`, guardianUids });
  });

  // ---- correction requests (parent -> health worker)
  let reqNo = 0;
  childStates.forEach((st, idx) => {
    const spec = st.spec;
    const requester = st.guardianUids[0];
    const wanted = spec.request || (spec.correctedK != null ? { k: spec.correctedK, status: 'corrected' } : null);
    if (!requester || !wanted) return;
    const visit = st.visits.find(v => v.k === wanted.k);
    if (!visit) return;
    reqNo++;
    const id = `demo-correction-${pad(reqNo)}`;
    const createdAt = stamp(addDays(visit.date, 1), '08:00');
    const reviewedAt = stamp(addDays(visit.date, 2), '04:00');
    const hw = hwUid(idx);
    const reasons = {
      pending_review: 'Berat badan pada kunjungan ini sepertinya salah catat, mohon dicek ulang.',
      accepted_pending_correction: 'Panjang badan anak pada kunjungan ini tampak tidak sesuai dengan buku KIA.',
      rejected: 'Mohon diperiksa kembali hasil timbang pada kunjungan ini.',
      corrected: 'Panjang/tinggi badan pada kunjungan ini tidak sesuai dengan hasil ukur di buku KIA.',
    };
    const data = { posyanduId, visitId: visit.id, requestedBy: requester, reason: reasons[wanted.status], status: wanted.status, createdAt };
    const notes = {
      accepted_pending_correction: 'Diterima, akan dikoreksi setelah pengecekan alat ukur.',
      rejected: 'Hasil pengukuran sesuai dengan catatan timbangan saat kunjungan.',
      corrected: 'Diterima dan sudah dikoreksi melalui alur koreksi berversi.',
    };
    if (wanted.status !== 'pending_review') {
      data.reviewedBy = hw; data.reviewedAt = reviewedAt; data.reviewNote = notes[wanted.status];
      audit(hw, 'REVIEW_CORRECTION_REQUEST', 'correction_request', id, { status: 'pending_review' },
        { status: wanted.status === 'corrected' ? 'accepted_pending_correction' : wanted.status },
        notes[wanted.status], reviewedAt);
    }
    if (wanted.status === 'corrected') {
      data.correctedBy = hwUid(idx + visit.vi + 1);
      data.correctedAt = stamp(addDays(visit.date, 3), '03:00');
    }
    add('correction_requests', id, data);
  });

  // ---- immunization & supplements
  const nearestVisit = (st, date) => {
    let best = null;
    for (const v of st.visits) {
      const diff = Math.abs(toDate(v.date) - toDate(date)) / DAY_MS;
      if (diff <= 14 && (!best || diff < best.diff)) best = { id: v.id, diff };
    }
    return best ? best.id : null;
  };
  const reviewReasons = 'Tanggal atau dosis tidak sesuai dengan buku KIA; mohon periksa dan catat ulang.';
  childStates.forEach((st, idx) => {
    const spec = st.spec;
    const events = [];
    for (const [code, dose, atM] of IMMUNIZATION_BASE) {
      if ((spec.skipBase || []).includes(code)) continue;
      const date = addDays(addMonths(st.dob, atM), 5);
      if (date <= addDays(today, -1)) events.push({ code, dose, date, status: 'verified' });
    }
    for (const e of spec.extraImm || []) events.push({ code: e.code, dose: e.dose, date: addDays(today, -e.daysAgo), status: e.status });
    events.sort((a, b) => a.date.localeCompare(b.date));
    events.forEach((e, i) => {
      const id = `demo-imm-c${pad(spec.n)}-${pad(i + 1)}`;
      const createdAt = stamp(e.date, '02:30');
      const data = {
        posyanduId, childId: st.id, visitId: nearestVisit(st, e.date), vaccineCode: e.code, doseSequence: e.dose,
        administrationDate: e.date, administeredBy: recUid(idx + i), facility: i % 3 === 2 ? 'Puskesmas' : 'Posyandu',
        recordSource: 'posyandu-entry', verificationStatus: e.status, createdAt,
      };
      const ts = stamp(addDays(e.date, 1), '04:00');
      const hw = hwUid(idx + i);
      if (e.status === 'verified') {
        Object.assign(data, { verifiedBy: hw, verifiedAt: ts, updatedAt: ts });
        audit(hw, 'VERIFY_SERVICE_EVENT', 'immunization_event', id, { verificationStatus: 'pending_verification' },
          { verificationStatus: 'verified' }, 'Verifikasi oleh petugas berwenang', ts);
      } else if (e.status === 'rejected') {
        Object.assign(data, { rejectionReason: reviewReasons, rejectedBy: hw, rejectedAt: ts, updatedAt: ts });
        audit(hw, 'REJECT_SERVICE_EVENT', 'immunization_event', id, { verificationStatus: 'pending_verification' },
          { verificationStatus: 'rejected' }, reviewReasons, ts);
      }
      add('immunization_events', id, data);
    });

    const supps = [];
    const ageNow = ageMonthsAt(st.dob, today);
    const first = addDays(today, -(45 + 3 * spec.n));
    if (ageNow >= 6 && addMonths(st.dob, 6) <= first) supps.push({ type: 'Vitamin A', date: first, status: 'verified', note: 'Kegiatan rutin Posyandu' });
    const second = addDays(today, -(230 + 3 * spec.n));
    if (ageNow >= 18 && addMonths(st.dob, 6) <= second) supps.push({ type: 'Vitamin A', date: second, status: 'verified', note: null });
    for (const e of spec.extraSupp || []) supps.push({ type: e.type, date: addDays(today, -e.daysAgo), status: e.status, note: null });
    supps.sort((a, b) => a.date.localeCompare(b.date));
    supps.forEach((s, i) => {
      const id = `demo-supp-c${pad(spec.n)}-${pad(i + 1)}`;
      const data = {
        posyanduId, childId: st.id, visitId: nearestVisit(st, s.date), supplementType: s.type,
        administrationDate: s.date, recordedBy: recUid(idx + i), verificationStatus: s.status, notes: s.note,
        createdAt: stamp(s.date, '02:30'),
      };
      const ts = stamp(addDays(s.date, 1), '04:00');
      const hw = hwUid(idx + i);
      if (s.status === 'verified') {
        Object.assign(data, { verifiedBy: hw, verifiedAt: ts, updatedAt: ts });
        audit(hw, 'VERIFY_SERVICE_EVENT', 'supplement_event', id, { verificationStatus: 'pending_verification' },
          { verificationStatus: 'verified' }, 'Verifikasi oleh petugas berwenang', ts);
      } else if (s.status === 'rejected') {
        const reason = 'Tanggal pemberian bersamaan dengan catatan lain; mohon periksa dan catat ulang.';
        Object.assign(data, { rejectionReason: reason, rejectedBy: hw, rejectedAt: ts, updatedAt: ts });
        audit(hw, 'REJECT_SERVICE_EVENT', 'supplement_event', id, { verificationStatus: 'pending_verification' },
          { verificationStatus: 'rejected' }, reason, ts);
      }
      add('supplement_events', id, data);
    });

    // ---- development screening (collection exists in rules/catalog; no UI yet)
    if (spec.screen) {
      const visit = st.visits.find(v => v.k === 1) || st.visits[st.visits.length - 1];
      if (visit) {
        const doubtful = spec.screen.result === 'meragukan';
        const pendingScreen = spec.screen.status !== 'verified';
        const data = {
          posyanduId, childId: st.id, visitId: visit.id, instrumentName: 'KPSP (Kuesioner Pra Skrining Perkembangan)',
          instrumentVersion: 'demo-1', screeningDate: visit.date, result: spec.screen.result,
          followUpAction: doubtful ? 'Jadwalkan skrining ulang pada kunjungan berikutnya dan konsultasikan dengan bidan.' : null,
          performedBy: hwUid(idx), verificationStatus: spec.screen.status, createdAt: stamp(visit.date, '03:00'),
        };
        if (!pendingScreen) Object.assign(data, { verifiedBy: hwUid(idx), verifiedAt: stamp(visit.date, '04:30') });
        add('development_screenings', `demo-screen-c${pad(spec.n)}-01`, data);
      }
    }
  });

  // ---- administrative records (+ audit trail like the API)
  const adminRecords = [
    ['activity', -30, 'Jadwal Posyandu bulan lalu', 'Penimbangan, pengukuran, dan pencatatan buku KIA di balai warga.'],
    ['activity', 3, 'Jadwal Posyandu bulan ini', 'Persiapan alat, meja pendaftaran, meja 1-5, dan ruang konseling.'],
    ['attendance', -30, 'Daftar hadir kader bulan lalu', 'Kader hadir lengkap; satu kader izin.'],
    ['attendance', -2, 'Daftar hadir kader pekan ini', 'Seluruh kader hadir pada kegiatan penimbangan.'],
    ['minutes', -14, 'Notulen rapat evaluasi kegiatan', 'Evaluasi alur pendaftaran dan pembagian tugas kader; tindak lanjut disepakati.'],
    ['home_visit', -7, 'Kunjungan rumah anak DEMO-008', 'Kunjungan rumah untuk menanyakan kendala kehadiran ke Posyandu.'],
    ['inventory', -10, 'Pemeriksaan alat ukur', 'Timbangan, infantometer, stadiometer, dan pita LILA diperiksa; semua berfungsi.'],
    ['inventory', -45, 'Kalibrasi timbangan', 'Timbangan dicek pada angka nol sebelum kegiatan dimulai.'],
  ];
  adminRecords.forEach(([type, offset, title, description], i) => {
    const id = `demo-admin-${pad(i + 1)}`;
    const recordDate = addDays(today, offset);
    const creator = type === 'activity' || type === 'minutes' ? adminUid : recUid(i);
    const ts = stamp(offset > 0 ? today : recordDate, '05:00');
    const data = { type, title, recordDate, description, status: 'recorded', posyanduId, createdBy: creator, createdAt: ts, updatedAt: ts };
    add('administrative_records', id, data);
    audit(creator, 'CREATE_ADMINISTRATIVE_RECORD', 'administrative_record', id, null, data, 'Pencatatan administrasi Posyandu', ts);
  });
  {
    const from = `${today.slice(0, 8)}01`;
    const visitCount = out.visits.filter(v => v.data.visitDate >= from && v.data.visitDate <= today).length;
    audit(adminUid, 'EXPORT_AGGREGATE_REPORT', 'report', `${from}_${today}`, null, { from, to: today, visitCount },
      'Ekspor rekap agregat', stamp(addDays(today, -1), '07:00'));
  }

  // ---- audit logs: chronological, deterministic ids
  audits.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.resourceId.localeCompare(b.resourceId) || a.action.localeCompare(b.action));
  audits.forEach((entry, i) => add('audit_logs', `demo-audit-${pad(i + 1, 4)}`, entry));

  // ---- reference & education content (global collections; clearly marked demo)
  const reviewedAt = stamp(addDays(today, -60), '03:00');
  const eduNote = 'Data demo — bukan materi resmi';
  [
    ['published', 'Penimbangan rutin setiap bulan', 'penimbangan',
      'Bawa anak ke Posyandu setiap bulan agar berat dan panjang/tinggi badannya tercatat berkesinambungan pada buku KIA.'],
    ['published', 'Membawa buku KIA', 'buku-kia',
      'Bawa buku KIA pada setiap kunjungan agar catatan layanan di Posyandu dan fasilitas kesehatan tetap selaras.'],
    ['published', 'Cuci tangan pakai sabun', 'kebersihan',
      'Cuci tangan pakai sabun dengan air mengalir sebelum menyiapkan makanan dan setelah dari toilet.'],
    ['draft', 'Menyiapkan makanan pendamping (draf)', 'makanan', 'Materi masih dalam penyusunan dan belum ditinjau.'],
    ['deprecated', 'Materi lama jadwal kegiatan', 'kegiatan', 'Materi lama yang sudah tidak digunakan.'],
  ].forEach(([status, title, topic, body], i) => {
    add('education_content', `demo-edu-${pad(i + 1)}`, {
      title: `[DEMO] ${title}`, topic, body, sourceTitle: eduNote, sourceUrl: null, publisher: 'Posyandu (data demo)',
      version: 'demo-1', status, publishedAt: status === 'published' ? reviewedAt : null,
      reviewedBy: status === 'published' ? reviewerUid : null, reviewedAt: status === 'published' ? reviewedAt : null,
    });
  });

  const knowledge = [
    ['approved', '[DEMO] Teknik pengukuran panjang dan tinggi badan',
      'Ukur panjang badan dengan posisi terlentang untuk anak di bawah 24 bulan dan tinggi badan dengan posisi berdiri untuk ' +
      'anak 24 bulan ke atas. Pastikan alat ukur diletakkan rata dan dibaca sejajar dengan mata.',
      ['pengukuran', 'panjang badan', 'tinggi badan', 'tumbuh kembang', 'posyandu']],
    ['approved', '[DEMO] Menimbang anak dengan benar',
      'Pastikan timbangan berada pada angka nol sebelum digunakan. Timbang anak dengan pakaian seminimal mungkin dan catat hasil ' +
      'langsung pada buku KIA dan aplikasi.', ['timbangan', 'penimbangan', 'edukasi', 'posyandu', 'tumbuh kembang']],
    ['approved', '[DEMO] Edukasi pola makan dan pemantauan bulanan',
      'Pantau tumbuh kembang anak setiap bulan di Posyandu dan catat pada buku KIA. Pola makan beragam sesuai usia dapat ' +
      'dikonsultasikan dengan bidan atau petugas Posyandu.', ['pola makan', 'tumbuh kembang', 'edukasi', 'posyandu']],
    ['pending_review', '[DEMO] Pencatatan imunisasi pada buku KIA',
      'Catat tanggal dan jenis imunisasi pada buku KIA serta pada aplikasi setelah diverifikasi petugas kesehatan.',
      ['imunisasi', 'buku kia']],
    ['pending_review', '[DEMO] Alur rujukan ke Puskesmas',
      'Rujukan dilakukan oleh bidan atau tenaga kesehatan; kader mencatat tindak lanjut pada buku administrasi.',
      ['rujukan', 'puskesmas']],
  ];
  knowledge.forEach(([wantedStatus, title, text, keywords], i) => {
    const status = wantedStatus === 'approved' && !approveReference ? 'pending_review' : wantedStatus;
    const approved = status === 'approved';
    add('knowledge_documents', `demo-knowledge-${pad(i + 1)}`, {
      title, text, sourceTitle: eduNote, sourceUrl: null, version: 'demo-1', keywords, status,
      createdBy: reviewerUid, createdAt: stamp(addDays(today, -75 + i), '03:00'),
      reviewedBy: approved ? reviewerUid : null, reviewedAt: approved ? reviewedAt : null,
    });
  });

  const rules = [
    ['BCG', '[DEMO] BCG', 1], ['Polio', '[DEMO] Polio', 4], ['DPT-HB-Hib', '[DEMO] DPT-HB-Hib', 3],
    ['Campak-Rubella', '[DEMO] Campak-Rubella', 9], ['DPT-HB-Hib lanjutan', '[DEMO] DPT-HB-Hib lanjutan', 18],
    ['Campak-Rubella lanjutan', '[DEMO] Campak-Rubella lanjutan', 18],
  ];
  rules.forEach(([code, name, target], i) => {
    // Demo rules are never approved: illustrative schedules must not appear as
    // official clinical reminders, even when demo knowledge content is approved.
    add('immunization_schedule_rules', `demo-rule-${pad(i + 1)}`, {
      vaccineCode: code, name, targetAgeMonths: target, targetAgeOrCondition: `${target} bulan`,
      ruleDescription: `Aturan contoh untuk demo aplikasi: sasaran usia ${target} bulan.`, version: 'demo-1',
      effectiveFrom: addDays(today, -365), effectiveUntil: null,
      officialSource: 'DATA DEMO — bukan jadwal resmi', sourceDocumentVersion: 'demo-1',
      status: 'draft', reviewedBy: null, approvedBy: null, approvedAt: null,
      createdAt: stamp(addDays(today, -70), '03:00'), updatedAt: reviewedAt,
    });
  });
  add('immunization_schedule_rules', 'demo-rule-draft-01', {
    vaccineCode: 'DEMO-DRAFT', name: '[DEMO] Aturan draf', targetAgeMonths: 12, targetAgeOrCondition: '12 bulan',
    ruleDescription: 'Aturan draf yang belum ditinjau (contoh antrean reviewer).', version: 'demo-1',
    effectiveFrom: addDays(today, -30), effectiveUntil: null, officialSource: 'DATA DEMO — bukan jadwal resmi',
    sourceDocumentVersion: 'demo-1', status: 'draft', reviewedBy: null, approvedBy: null, approvedAt: null,
    createdAt: stamp(addDays(today, -30), '03:00'), updatedAt: stamp(addDays(today, -30), '03:00'),
  });
  add('immunization_schedule_rules', 'demo-rule-retired-01', {
    vaccineCode: 'DEMO-RETIRED', name: '[DEMO] Aturan lama', targetAgeMonths: 6, targetAgeOrCondition: '6 bulan',
    ruleDescription: 'Aturan lama yang sudah dinonaktifkan (contoh status retired).', version: 'demo-0',
    effectiveFrom: addDays(today, -700), effectiveUntil: addDays(today, -366), officialSource: 'DATA DEMO — bukan jadwal resmi',
    sourceDocumentVersion: 'demo-0', status: 'retired', reviewedBy: reviewerUid, approvedBy: reviewerUid,
    approvedAt: stamp(addDays(today, -700), '03:00'), createdAt: stamp(addDays(today, -700), '03:00'),
    updatedAt: stamp(addDays(today, -366), '03:00'),
  });

  const counts = Object.fromEntries(COLLECTIONS.map(c => [c, out[c].length]));
  return {
    marker: MARKER, posyanduId, today, collections: out, counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    children: summaryRows,
  };
}

module.exports = { MARKER, COLLECTIONS, buildDemoDataset, validateAnthropometry, growthIndicators, fallbackSummary, ageMonthsAt, jakartaDate };
