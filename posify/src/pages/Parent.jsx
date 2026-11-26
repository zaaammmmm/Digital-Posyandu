import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TLink } from '../context/Transition.jsx'
import { useToast } from '../components/Toast.jsx'
import GrowthChart from '../components/GrowthChart.jsx'
import { Avatar, Badge, Counter, Icon, Reveal, Typewriter } from '../components/ui.jsx'
import { child, education, fmt, nextVisit, series, summaryText, tickets as seedTickets, vaccines } from '../data/mock.js'

const spring = { type: 'spring', stiffness: 260, damping: 20 }
const stagger = (i) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 + i * 0.09, ...spring } })

function Toggle({ value, onChange }) {
  return (
    <div className="seg" role="tablist" aria-label="Jenis grafik">
      {[['w', 'Berat', 'scale'], ['h', 'Tinggi', 'ruler']].map(([k, l, ic]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {value === k && <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <Icon n={ic} size={16} /> {l}
        </button>
      ))}
    </div>
  )
}

/* ================= BERANDA ================= */
export function ParentHome() {
  const [metric, setMetric] = useState('w')
  return (
    <div className="page">
      <motion.div className="greet" {...stagger(0)}>
        <div><small>Selamat datang kembali</small><h1>Halo, Bu Sari</h1></div>
        <span className="date-chip"><Icon n="calendar" size={15} /> 26 Nov 2026</span>
      </motion.div>

      <motion.section className="hero-card" {...stagger(1)}>
        <span className="hc-c c1" /><span className="hc-c c2" />
        <Avatar name={child.name} size={68} tone={1} />
        <div className="hc-tx">
          <h2>{child.name}</h2>
          <p>{child.sex} · {child.ageLabel} · {child.reg}</p>
          <span className="hc-pos"><Icon n="pin" size={14} /> {child.posyandu}</span>
        </div>
        <Badge s="verified" />
      </motion.section>

      <div className="metrics">
        <motion.div className="metric" {...stagger(2)}>
          <span className="m-ic"><Icon n="scale" size={22} /></span>
          <small>Berat badan</small>
          <strong><Counter to={10.2} decimals={1} /> <em>kg</em></strong>
          <span className="m-delta"><Icon n="up" size={13} sw={3} /> 0,2 dari Okt</span>
        </motion.div>
        <motion.div className="metric" {...stagger(3)}>
          <span className="m-ic"><Icon n="ruler" size={22} /></span>
          <small>Tinggi badan</small>
          <strong><Counter to={78.4} decimals={1} /> <em>cm</em></strong>
          <span className="m-delta"><Icon n="up" size={13} sw={3} /> 0,5 dari Okt</span>
        </motion.div>
        <motion.div className="metric metric-cal" {...stagger(4)}>
          <div className="cal"><b>{nextVisit.month}</b><strong>{nextVisit.day}</strong></div>
          <div><small>Posyandu berikutnya</small><span className="m-place">{nextVisit.place}</span></div>
        </motion.div>
      </div>

      <motion.section className="card" {...stagger(5)}>
        <div className="card-h"><h3>Grafik tumbuh</h3><Toggle value={metric} onChange={setMetric} /></div>
        <GrowthChart data={series} metric={metric} height={260} />
        <TLink to="/ortu/pertumbuhan" soft className="link-more">Lihat riwayat lengkap <Icon n="arrow" size={16} /></TLink>
      </motion.section>

      <div className="two">
        <motion.section className="card ai-teaser" {...stagger(6)}>
          <span className="ai-ic"><Icon n="sparkle" size={26} /></span>
          <h3>Ringkasan kunjungan</h3>
          <p>Penjelasan singkat dari hasil 12 Nov, dalam bahasa sederhana.</p>
          <TLink to="/ortu/ringkasan" soft className="btn btn-pri">Baca <Icon n="arrow" size={18} /></TLink>
        </motion.section>
        <motion.section className="card note-card" {...stagger(7)}>
          <span className="ai-ic ai-ic-2"><Icon n="flag" size={24} /></span>
          <h3>Ada yang tidak sesuai?</h3>
          <p>Ajukan koreksi. Catatan resmi tidak berubah sebelum ditinjau petugas.</p>
          <TLink to="/ortu/koreksi" soft className="btn btn-ghost">Ajukan koreksi</TLink>
        </motion.section>
      </div>
    </div>
  )
}

/* ================= PERTUMBUHAN ================= */
export function ParentGrowth() {
  const [metric, setMetric] = useState('w')
  const unit = metric === 'w' ? 'kg' : 'cm'
  const rows = [...series].reverse()
  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}>
        <div><small>{child.name}</small><h1>Pertumbuhan</h1></div>
        <Toggle value={metric} onChange={setMetric} />
      </motion.header>

      <motion.section className="card" {...stagger(1)}>
        <GrowthChart data={series} metric={metric} height={320} />
        <p className="chart-text">
          {metric === 'w' ? 'Berat badan' : 'Tinggi badan'} tercatat dari <b>{fmt(series[0][metric])} {unit}</b> (Mei) menjadi <b>{fmt(series[6][metric])} {unit}</b> (Nov). Ketuk titik untuk melihat tanggal dan nilainya.
        </p>
      </motion.section>

      <motion.section className="howto" {...stagger(2)}>
        {[['check', 'Titik', 'Pengukuran yang sudah disahkan'], ['trend', 'Garis', 'Arah perubahan dari waktu ke waktu'], ['info', 'Pita', 'Ilustrasi saja, bukan standar WHO']].map(([ic, t, d]) => (
          <div key={t}><span><Icon n={ic} size={20} /></span><b>{t}</b><small>{d}</small></div>
        ))}
      </motion.section>

      <section className="card">
        <h3>Riwayat pengukuran</h3>
        <ul className="history">
          {rows.map((r, i) => (
            <motion.li key={r.date} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <span className="h-date"><Icon n="calendar" size={15} /> {r.date}</span>
              <span className="h-val"><Icon n="scale" size={15} /> {fmt(r.w)} kg</span>
              <span className="h-val"><Icon n="ruler" size={15} /> {fmt(r.h)} cm</span>
              <Badge s="verified" />
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* ================= IMUNISASI ================= */
export function ParentImmun() {
  const done = vaccines.filter((v) => v.status === 'done').length
  const pct = (done / vaccines.length) * 100
  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}>
        <div><small>{child.name}</small><h1>Imunisasi & Vitamin</h1></div>
      </motion.header>

      <motion.div className="notice" {...stagger(1)}>
        <Icon n="info" size={20} />
        <p>Daftar dan jadwal ini <b>contoh demo</b>. Jadwal asli harus dari katalog yang disahkan tenaga kesehatan.</p>
      </motion.div>

      <motion.section className="card prog-card" {...stagger(2)}>
        <div className="ring" style={{ '--p': pct }}>
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" className="ring-bg" />
            <motion.circle cx="50" cy="50" r="42" className="ring-fg" strokeDasharray="263.9" initial={{ strokeDashoffset: 263.9 }} animate={{ strokeDashoffset: 263.9 * (1 - pct / 100) }} transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          <strong><Counter to={done} /><small>/{vaccines.length}</small></strong>
        </div>
        <div>
          <h3>Sudah tercatat</h3>
          <p className="muted">“Belum tercatat” tidak berarti belum diberikan. Tanyakan ke Posyandu bila ragu.</p>
        </div>
      </motion.section>

      <ol className="timeline">
        {vaccines.map((v, i) => (
          <motion.li key={v.name} className={`tl tl-${v.status}`} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ delay: 0.05, ...spring }}>
            <span className="tl-dot">
              <Icon n={v.status === 'done' ? 'check' : v.status === 'scheduled' ? 'calendar' : 'info'} size={16} sw={3} />
            </span>
            <div className="tl-body">
              <div><strong>{v.name}</strong><small>{v.hint}</small></div>
              <div className="tl-r"><Badge s={v.status} />{v.date && <small>{v.date}</small>}</div>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

/* ================= RINGKASAN ================= */
export function ParentSummary() {
  const [run, setRun] = useState(0)
  const blocks = [
    { icon: 'clipboard', t: 'Tercatat', c: 'Berat 10,2 kg · Tinggi 78,4 cm' },
    { icon: 'trend', t: 'Perubahan', c: 'Berat +0,2 kg · Tinggi +0,5 cm' },
    { icon: 'bell', t: 'Pengingat', c: 'Posyandu 10 Des (konfirmasi dulu)' },
  ]
  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}>
        <div><small>Kunjungan 12 Nov 2026</small><h1>Ringkasan</h1></div>
        <button className="btn btn-ghost" onClick={() => setRun((r) => r + 1)}><Icon n="sparkle" size={16} /> Putar ulang</button>
      </motion.header>

      <div className="blocks">
        {blocks.map((b, i) => (
          <motion.div key={b.t} className="block" {...stagger(i + 1)}>
            <span className="b-ic"><Icon n={b.icon} size={22} /></span>
            <small>{b.t}</small>
            <strong>{b.c}</strong>
          </motion.div>
        ))}
      </div>

      <motion.section className="card ai-card" {...stagger(4)}>
        <div className="ai-top">
          <span className="ai-ic"><Icon n="sparkle" size={22} /></span>
          <div><b>Disusun otomatis</b><small>dari data yang sudah disahkan · 12 Nov 2026</small></div>
        </div>
        <Typewriter text={summaryText} run={run} />
      </motion.section>

      <motion.div className="notice" {...stagger(5)}>
        <Icon n="shield" size={20} />
        <p>Ini informasi pemantauan, <b>bukan diagnosis</b> dan bukan pengganti penilaian bidan atau tenaga kesehatan.</p>
      </motion.div>

      <h3 className="sec-t">Edukasi untuk Anda</h3>
      <div className="edu">
        {education.map((e, i) => (
          <Reveal key={e.title} delay={i * 0.1} className="edu-card">
            <span className="edu-ic"><Icon n={e.icon} size={24} /></span>
            <h4>{e.title}</h4>
            <small>{e.src}</small>
            <small className="edu-d">{e.date}</small>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ================= KOREKSI ================= */
const STEPS = ['Diajukan', 'Ditinjau', 'Selesai']
export function ParentFix() {
  const toast = useToast()
  const [list, setList] = useState(seedTickets)
  const [rec, setRec] = useState(series[5].date)
  const [reason, setReason] = useState('')

  const submit = () => {
    if (reason.trim().length < 8) return toast('Tulis alasan sedikit lebih lengkap ya')
    setList((l) => [{ id: Math.random().toString(36).slice(2), record: `Pengukuran ${rec}`, reason, step: 0 }, ...l])
    setReason('')
    toast('Permintaan terkirim ke petugas')
  }

  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}><div><small>Catatan tidak sesuai?</small><h1>Ajukan koreksi</h1></div></motion.header>
      <motion.div className="notice" {...stagger(1)}>
        <Icon n="lock" size={20} />
        <p>Catatan resmi <b>tidak berubah</b> sebelum ditinjau petugas. Riwayat lama tetap tersimpan.</p>
      </motion.div>

      <motion.section className="card" {...stagger(2)}>
        <h3>Catatan mana?</h3>
        <div className="chips">
          {series.map((s) => (
            <button key={s.date} className={`chip-btn ${rec === s.date ? 'on' : ''}`} onClick={() => setRec(s.date)}>{rec === s.date && <Icon n="check" size={14} sw={3} />}{s.date}</button>
          ))}
        </div>
        <label className="field">
          <span>Apa yang tidak sesuai?</span>
          <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: tanggal kunjungan tertulis salah" />
        </label>
        <button className="btn btn-pri" onClick={submit}>Kirim permintaan <Icon n="arrow" size={18} /></button>
      </motion.section>

      <h3 className="sec-t">Status permintaan</h3>
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.article key={t.id} layout className="ticket" initial={{ opacity: 0, y: -20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <div><strong>{t.record}</strong><p>{t.reason}</p></div>
            <ol className="stepper">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= t.step ? 'on' : ''}>
                  <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.1, ...spring }}>{i <= t.step ? <Icon n="check" size={13} sw={3.5} /> : i + 1}</motion.span>
                  <small>{s}</small>
                </li>
              ))}
            </ol>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  )
}
