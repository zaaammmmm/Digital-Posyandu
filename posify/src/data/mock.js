// ⚠️ SELURUH DATA DI SINI ADALAH DATA SINTETIS UNTUK DEMO.
// Ganti dengan pemanggilan API backend saat integrasi (lihat README).

export const fmt = (n, d = 1) => Number(n).toFixed(d).replace('.', ',')

export const child = {
  id: 'c1',
  name: 'Aisyah Putri',
  sex: 'Perempuan',
  dob: '12 Mei 2025',
  ageLabel: '18 bulan',
  reg: 'PSY-0142',
  posyandu: 'Posyandu Melati 3',
}

export const series = [
  { m: 'Mei', date: '12 Mei 2026', w: 9.0, h: 74.0 },
  { m: 'Jun', date: '12 Jun 2026', w: 9.2, h: 75.1 },
  { m: 'Jul', date: '12 Jul 2026', w: 9.4, h: 76.0 },
  { m: 'Agu', date: '12 Agu 2026', w: 9.6, h: 76.8 },
  { m: 'Sep', date: '12 Sep 2026', w: 9.8, h: 77.4 },
  { m: 'Okt', date: '12 Okt 2026', w: 10.0, h: 77.9 },
  { m: 'Nov', date: '12 Nov 2026', w: 10.2, h: 78.4 },
]

export const makeSeries = (w0, h0, seed = 1) =>
  series.map((s, i) => ({
    ...s,
    w: +(w0 + i * (0.18 + (seed % 3) * 0.03)).toFixed(1),
    h: +(h0 + i * (0.8 - (seed % 4) * 0.05)).toFixed(1),
  }))

export const nextVisit = {
  day: '10',
  month: 'Des',
  year: '2026',
  place: 'Balai RW 03',
  note: 'Jadwal contoh — konfirmasi dengan Posyandu',
}

// status: done | scheduled | unrecorded  (belum tercatat ≠ belum diberikan)
export const vaccines = [
  { name: 'BCG', hint: 'Usia 0–1 bulan', status: 'done', date: '20 Mei 2025' },
  { name: 'Hepatitis B', hint: 'Usia 0–24 jam', status: 'done', date: '12 Mei 2025' },
  { name: 'Polio tetes 1', hint: 'Usia 1 bulan', status: 'done', date: '14 Jun 2025' },
  { name: 'DPT-HB-Hib 1', hint: 'Usia 2 bulan', status: 'done', date: '15 Jul 2025' },
  { name: 'DPT-HB-Hib 2', hint: 'Usia 3 bulan', status: 'done', date: '14 Agu 2025' },
  { name: 'DPT-HB-Hib 3', hint: 'Usia 4 bulan', status: 'unrecorded', date: null },
  { name: 'Campak-Rubella', hint: 'Usia 9 bulan', status: 'scheduled', date: 'Konfirmasi Posyandu' },
  { name: 'Vitamin A', hint: 'Februari & Agustus', status: 'done', date: '12 Agu 2026' },
]

export const education = [
  { icon: 'leaf', title: 'Makanan beragam sesuai usia', src: 'Buku KIA 2024 — Kemenkes (contoh)', date: 'Ditinjau Nov 2026' },
  { icon: 'heart', title: 'Pantau tumbuh kembang tiap bulan', src: 'Panduan Kader Posyandu — Kemenkes (contoh)', date: 'Ditinjau Nov 2026' },
  { icon: 'syringe', title: 'Kenali jadwal imunisasi anak', src: 'Kepmenkes HK.01.07/Menkes/1098/2024 (contoh)', date: 'Ditinjau Nov 2026' },
]

export const summaryText =
  'Pada kunjungan 12 November 2026, berat badan Aisyah tercatat 10,2 kg dan tinggi badan 78,4 cm. Dibandingkan kunjungan 12 Oktober 2026, berat badan tercatat bertambah 0,2 kg dan tinggi badan bertambah 0,5 cm. Hasil ini merupakan informasi pemantauan, bukan diagnosis. Jika ada kekhawatiran, konsultasikan dengan bidan atau tenaga kesehatan.'

export const tickets = [
  { id: 't1', record: 'Pengukuran 12 Okt 2026', reason: 'Tinggi badan sepertinya tertulis kurang tepat.', step: 1 },
]

export const kids = [
  { id: 'c1', name: 'Aisyah Putri', sex: 'P', age: 18, reg: 'PSY-0142', last: '12 Nov', status: 'verified', w: 10.2, h: 78.4 },
  { id: 'c2', name: 'Rafif Pratama', sex: 'L', age: 11, reg: 'PSY-0151', last: '12 Nov', status: 'pending', w: 7.9, h: 70.2 },
  { id: 'c3', name: 'Naura Azzahra', sex: 'P', age: 24, reg: 'PSY-0119', last: '12 Nov', status: 'pending', w: 10.4, h: 80.5 },
  { id: 'c4', name: 'Bima Saputra', sex: 'L', age: 8, reg: 'PSY-0163', last: '—', status: 'none', w: 7.0, h: 66.0 },
  { id: 'c5', name: 'Kirana Dewi', sex: 'P', age: 30, reg: 'PSY-0098', last: '12 Nov', status: 'verified', w: 11.5, h: 87.0 },
  { id: 'c6', name: 'Arka Wijaya', sex: 'L', age: 14, reg: 'PSY-0134', last: '—', status: 'none', w: 8.6, h: 72.4 },
  { id: 'c7', name: 'Zahra Nuraini', sex: 'P', age: 5, reg: 'PSY-0170', last: '12 Nov', status: 'pending', w: 6.1, h: 61.0 },
  { id: 'c8', name: 'Dimas Ardian', sex: 'L', age: 36, reg: 'PSY-0077', last: '12 Nov', status: 'verified', w: 13.0, h: 93.5 },
  { id: 'c9', name: 'Salsa Maharani', sex: 'P', age: 20, reg: 'PSY-0126', last: '—', status: 'none', w: 9.8, h: 79.0 },
  { id: 'c10', name: 'Fajar Ramadhan', sex: 'L', age: 16, reg: 'PSY-0141', last: '12 Nov', status: 'pending', w: 9.3, h: 75.3 },
]

export const queue = [
  { id: 'q1', kid: 'Rafif Pratama', reg: 'PSY-0151', date: '12 Nov 2026', w: 8.4, h: 71.0, pw: 8.1, ph: 70.2, by: 'Kader Rina', flags: [], status: 'pending' },
  { id: 'q2', kid: 'Naura Azzahra', reg: 'PSY-0119', date: '12 Nov 2026', w: 10.9, h: 79.8, pw: 10.6, ph: 80.5, by: 'Kader Rina', flags: ['Tinggi lebih rendah dari kunjungan sebelumnya — periksa ulang pengukuran'], status: 'pending' },
  { id: 'q3', kid: 'Zahra Nuraini', reg: 'PSY-0170', date: '12 Nov 2026', w: 6.5, h: 62.0, pw: 6.2, ph: 61.0, by: 'Kader Dewi', flags: [], status: 'pending' },
  { id: 'q4', kid: 'Fajar Ramadhan', reg: 'PSY-0141', date: '12 Nov 2026', w: 9.6, h: 76.1, pw: 9.4, ph: 75.2, by: 'Kader Dewi', flags: [], status: 'pending' },
  { id: 'q5', kid: 'Kirana Dewi', reg: 'PSY-0098', date: '12 Nov 2026', w: 11.9, h: 87.6, pw: 11.6, ph: 86.9, by: 'Kader Rina', flags: [], status: 'verified' },
]

export const activity = [
  { icon: 'plus', text: 'Kunjungan Rafif Pratama dicatat', time: '09.12' },
  { icon: 'shield', text: 'Catatan Kirana Dewi disahkan', time: '09.40' },
  { icon: 'baby', text: 'Anak baru didaftarkan: Bima Saputra', time: '10.05' },
  { icon: 'flag', text: 'Permintaan koreksi dari wali masuk', time: '10.31' },
]

export const recap = {
  Okt: { target: 46, visits: 38, measured: 36, weeks: [8, 12, 10, 8], services: [36, 22, 30, 14] },
  Nov: { target: 48, visits: 41, measured: 40, weeks: [9, 11, 12, 9], services: [40, 25, 33, 17] },
}
export const serviceNames = ['Penimbangan', 'Imunisasi', 'Vitamin', 'Skrining']

export const books = [
  { id: 'kegiatan', icon: 'calendar', title: 'Buku Kegiatan', count: 12, rows: [['12 Nov', 'Posyandu bulanan', 'Selesai'], ['05 Nov', 'Penyuluhan gizi', 'Selesai'], ['10 Des', 'Posyandu bulanan', 'Terjadwal']] },
  { id: 'hadir', icon: 'users', title: 'Daftar Hadir Kader', count: 5, rows: [['Kader Rina', '12 Nov', 'Hadir'], ['Kader Dewi', '12 Nov', 'Hadir'], ['Kader Tini', '12 Nov', 'Izin']] },
  { id: 'notulen', icon: 'file', title: 'Notulen', count: 7, rows: [['Rapat evaluasi Okt', '30 Okt', 'Tersimpan'], ['Persiapan imunisasi', '08 Nov', 'Tersimpan']] },
  { id: 'rumah', icon: 'pin', title: 'Kunjungan Rumah', count: 4, rows: [['Rumah Bima S. (belum diukur)', '14 Nov', 'Terjadwal'], ['Rumah Arka W.', '15 Nov', 'Terjadwal']] },
  { id: 'inventaris', icon: 'clipboard', title: 'Inventaris', count: 9, rows: [['Timbangan digital', 'Baik', '1 unit'], ['Alat ukur panjang bayi', 'Baik', '1 unit'], ['Meja pemeriksaan', 'Perlu perbaikan', '1 unit']] },
]
