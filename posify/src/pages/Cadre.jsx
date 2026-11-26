import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TLink } from '../context/Transition.jsx'
import { useAuth } from '../context/Auth.jsx'
import { useToast } from '../components/Toast.jsx'
import GrowthChart from '../components/GrowthChart.jsx'
import { Avatar, Badge, Counter, Icon } from '../components/ui.jsx'
import { activity, books, fmt, kids as seedKids, makeSeries, queue as seedQueue, recap, serviceNames } from '../data/mock.js'

const spring = { type: 'spring', stiffness: 260, damping: 20 }
const stagger = (i) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 + i * 0.08, ...spring } })
const toneOf = (id) => parseInt(id.replace(/\D/g, ''), 10) % 3

/* ================= DASHBOARD ================= */
export function CadreHome() {
  const { user } = useAuth()
  const stats = [
    { icon: 'baby', label: 'Anak terdaftar', to: 48 },
    { icon: 'plus', label: 'Kunjungan hari ini', to: 12 },
    { icon: 'clock', label: 'Menunggu verifikasi', to: 4 },
    { icon: 'info', label: 'Belum diukur bulan ini', to: 3 },
  ]
  const pending = seedQueue.filter((q) => q.status === 'pending')
  return (
    <div className="page">
      <motion.div className="greet" {...stagger(0)}>
        <div><small>Selamat pagi</small><h1>{user.person}</h1></div>
        <span className="date-chip"><Icon n="calendar" size={15} /> 26 Nov 2026</span>
      </motion.div>

      <motion.section className="day-card" {...stagger(1)}>
        <span className="hc-c c1" /><span className="hc-c c2" />
        <div><small>Kegiatan hari ini</small><h2>Posyandu Melati 3</h2><p><Icon n="pin" size={14} /> Balai RW 03 · 08.00–11.00</p></div>
        <div className="day-ring">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" className="ring-bg w" /><motion.circle cx="50" cy="50" r="42" className="ring-fg w" strokeDasharray="263.9" initial={{ strokeDashoffset: 263.9 }} animate={{ strokeDashoffset: 263.9 * (1 - 12 / 20) }} transition={{ duration: 1.4, delay: 0.4 }} /></svg>
          <strong>12<small>/20</small></strong>
        </div>
      </motion.section>

      <div className="stats">
        {stats.map((s, i) => (
          <motion.div key={s.label} className="stat" whileHover={{ y: -5 }} {...stagger(i + 2)}>
            <span className="m-ic"><Icon n={s.icon} size={20} /></span>
            <strong><Counter to={s.to} /></strong>
            <small>{s.label}</small>
          </motion.div>
        ))}
      </div>

      <div className="two">
        <motion.section className="card" {...stagger(6)}>
          <div className="card-h"><h3>Antrean verifikasi</h3><TLink to="/kader/verifikasi" soft className="link-more">Semua <Icon n="arrow" size={15} /></TLink></div>
          <ul className="rows">
            {pending.map((q, i) => (
              <motion.li key={q.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
                <Avatar name={q.kid} size={38} tone={i} />
                <div><strong>{q.kid}</strong><small>{q.reg} · {q.date}</small></div>
                {q.flags.length > 0 && <span className="flag-dot" title="Perlu diperiksa ulang"><Icon n="flag" size={14} /></span>}
              </motion.li>
            ))}
          </ul>
        </motion.section>
        <motion.section className="card" {...stagger(7)}>
          <h3>Aktivitas</h3>
          <ul className="feed">
            {activity.map((a, i) => (
              <motion.li key={a.text} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}>
                <span><Icon n={a.icon} size={16} /></span><p>{a.text}</p><small>{a.time}</small>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>

      <motion.div className="quick" {...stagger(8)}>
        <TLink to="/kader/kunjungan" soft className="btn btn-pri btn-lg"><Icon n="plus" size={20} /> Kunjungan baru</TLink>
        <TLink to="/kader/anak" soft className="btn btn-ghost btn-lg"><Icon n="search" size={20} /> Cari anak</TLink>
      </motion.div>
    </div>
  )
}

/* ================= DAFTAR ANAK ================= */
const FILTERS = [['all', 'Semua'], ['none', 'Belum diukur'], ['pending', 'Menunggu']]

export function CadreKids() {
  const toast = useToast()
  const [list, setList] = useState(seedKids)
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [open, setOpen] = useState(null)
  const [reg, setReg] = useState(false)
  const [form, setForm] = useState({ name: '', sex: 'P', guardian: '' })

  const shown = useMemo(
    () => list.filter((k) => (f === 'all' || k.status === f) && (k.name + k.reg).toLowerCase().includes(q.toLowerCase())),
    [list, q, f]
  )

  const add = () => {
    if (form.name.trim().length < 3) return toast('Isi nama anak dulu ya')
    const n = list.length + 1
    setList((l) => [{ id: `c${n + 20}`, name: form.name, sex: form.sex, age: 0, reg: `PSY-${String(170 + n).padStart(4, '0')}`, last: '—', status: 'none', w: 3.2, h: 50 }, ...l])
    setForm({ name: '', sex: 'P', guardian: '' })
    setReg(false)
    toast('Anak berhasil didaftarkan (data contoh)')
  }

  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}>
        <div><small>{list.length} anak terdaftar</small><h1>Daftar anak</h1></div>
        <button className="btn btn-pri" onClick={() => setReg(true)}><Icon n="plus" size={18} /> Daftarkan</button>
      </motion.header>

      <motion.div className="search" {...stagger(1)}>
        <Icon n="search" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor registrasi" aria-label="Cari anak" />
      </motion.div>
      <motion.div className="chips" {...stagger(2)}>
        {FILTERS.map(([k, l]) => (<button key={k} className={`chip-btn ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l}</button>))}
      </motion.div>

      <motion.ul layout className="kid-list">
        <AnimatePresence mode="popLayout">
          {shown.map((k) => (
            <motion.li key={k.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring}>
              <button className="kid" onClick={() => setOpen(k)}>
                <Avatar name={k.name} size={50} tone={toneOf(k.id)} />
                <div className="kid-tx"><strong>{k.name}</strong><small>{k.reg} · {k.age} bln · {k.sex === 'P' ? 'Perempuan' : 'Laki-laki'}</small></div>
                <Badge s={k.status} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {shown.length === 0 && <li className="empty">Tidak ada anak yang cocok.</li>}
      </motion.ul>

      <AnimatePresence>
        {open && (
          <Sheet onClose={() => setOpen(null)}>
            <div className="sheet-head">
              <Avatar name={open.name} size={64} tone={toneOf(open.id)} />
              <div><h2>{open.name}</h2><p>{open.reg} · {open.age} bulan</p></div>
            </div>
            <GrowthChart data={makeSeries(open.w, open.h, open.age)} metric="w" height={220} />
            <div className="sheet-act">
              <TLink to="/kader/kunjungan" soft className="btn btn-pri">Buat kunjungan <Icon n="arrow" size={18} /></TLink>
              <button className="btn btn-ghost" onClick={() => setOpen(null)}>Tutup</button>
            </div>
          </Sheet>
        )}
        {reg && (
          <Sheet onClose={() => setReg(false)}>
            <h2 className="sheet-t">Daftarkan anak</h2>
            <label className="field"><span>Nama anak</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap (data contoh)" /></label>
            <label className="field"><span>Nama wali</span><input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} placeholder="Ibu / Bapak / Wali" /></label>
            <div className="field"><span>Jenis kelamin</span>
              <div className="chips">{[['P', 'Perempuan'], ['L', 'Laki-laki']].map(([k, l]) => (<button key={k} className={`chip-btn ${form.sex === k ? 'on' : ''}`} onClick={() => setForm({ ...form, sex: k })}>{l}</button>))}</div>
            </div>
            <p className="tiny"><Icon n="lock" size={13} /> Wali akan menerima pemberitahuan privasi saat aktivasi akun.</p>
            <div className="sheet-act"><button className="btn btn-pri" onClick={add}>Simpan</button><button className="btn btn-ghost" onClick={() => setReg(false)}>Batal</button></div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  )
}

function Sheet({ children, onClose }) {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
        <span className="grabber" />
        <button className="icon-btn sheet-x" onClick={onClose} aria-label="Tutup"><Icon n="x" size={18} /></button>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ================= KUNJUNGAN BARU ================= */
const SERVICES = ['Imunisasi', 'Vitamin A', 'Suplemen', 'Skrining perkembangan', 'Penyuluhan']
const STEP_NAMES = ['Anak', 'Ukur', 'Layanan', 'Kirim']

function NumStep({ icon, label, unit, value, onChange, step, prev }) {
  const diff = value - prev
  return (
    <div className="numstep">
      <div className="ns-label"><Icon n={icon} size={18} /> {label}</div>
      <div className="ns-row">
        <button onClick={() => onChange(+(value - step).toFixed(1))} aria-label={`Kurangi ${label}`}><Icon n="minus" size={22} sw={3} /></button>
        <div className="ns-val">
          <AnimatePresence mode="popLayout"><motion.strong key={value} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.15 }}>{fmt(value)}</motion.strong></AnimatePresence>
          <small>{unit}</small>
        </div>
        <button onClick={() => onChange(+(value + step).toFixed(1))} aria-label={`Tambah ${label}`}><Icon n="plus" size={22} sw={3} /></button>
      </div>
      <span className="ns-diff">Sebelumnya {fmt(prev)} {unit} · {diff >= 0 ? '+' : '−'}{fmt(Math.abs(diff))}</span>
    </div>
  )
}

export function CadreVisit() {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [kid, setKid] = useState(null)
  const [w, setW] = useState(8.0)
  const [h, setH] = useState(70.0)
  const [mtype, setMtype] = useState('Berdiri')
  const [svc, setSvc] = useState([])
  const [done, setDone] = useState(null)

  const pick = (k) => { setKid(k); setW(+(k.w + 0.3).toFixed(1)); setH(+(k.h + 0.6).toFixed(1)); setStep(1) }
  const flags = []
  if (kid) {
    if (w < 1.5 || w > 25) flags.push('Berat di luar rentang teknis — periksa ulang alat/pembacaan')
    if (h < 40 || h > 125) flags.push('Tinggi di luar rentang teknis — periksa ulang alat/pembacaan')
    if (h < kid.h) flags.push('Tinggi lebih rendah dari kunjungan sebelumnya — periksa ulang')
  }
  const toggle = (s) => setSvc((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))
  const reset = () => { setStep(0); setKid(null); setSvc([]); setMtype('Berdiri'); setDone(null) }
  const send = (status) => { setDone(status); toast(status === 'draft' ? 'Disimpan sebagai draft' : 'Terkirim untuk verifikasi') }

  if (done) {
    return (
      <div className="page">
        <div className="success">
          <div className="burst">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.i key={i} initial={{ x: 0, y: 0, scale: 0 }} animate={{ x: Math.cos((i / 14) * 6.283) * 120, y: Math.sin((i / 14) * 6.283) * 120, scale: [0, 1, 0] }} transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }} style={{ background: ['#ED1566', '#F46095', '#9E1348'][i % 3] }} />
            ))}
            <svg viewBox="0 0 100 100" width="130" height="130">
              <motion.circle cx="50" cy="50" r="44" fill="#ED1566" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} style={{ transformOrigin: '50px 50px' }} />
              <motion.path d="M30 52l14 14 27-30" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
            </svg>
          </div>
          <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>Tersimpan!</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>Kunjungan {kid.name} · <Badge s={done === 'draft' ? 'draft' : 'pending'} /></motion.p>
          <motion.div className="sheet-act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <button className="btn btn-pri" onClick={reset}>Kunjungan lain</button>
            <TLink to="/kader" soft className="btn btn-ghost">Ke dashboard</TLink>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}><div><small>Langkah {step + 1} dari 4</small><h1>Kunjungan baru</h1></div></motion.header>

      <div className="vstep" aria-label="Kemajuan">
        <div className="vstep-bar"><motion.i animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} /></div>
        {STEP_NAMES.map((n, i) => (<span key={n} className={i <= step ? 'on' : ''}>{i < step ? <Icon n="check" size={14} sw={3.5} /> : i + 1}<small>{n}</small></span>))}
      </div>

      <AnimatePresence mode="wait">
        <motion.section key={step} className="card" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          {step === 0 && (
            <>
              <h3>Siapa yang datang?</h3>
              <div className="pick-grid">
                {seedKids.slice(0, 8).map((k, i) => (
                  <motion.button key={k.id} className="pick" onClick={() => pick(k)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, ...spring }} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}>
                    <Avatar name={k.name} size={52} tone={toneOf(k.id)} /><strong>{k.name.split(' ')[0]}</strong><small>{k.reg}</small>
                  </motion.button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h3>Hasil pengukuran <small className="muted">· {kid.name}</small></h3>
              <div className="chips">{['Berdiri', 'Berbaring'].map((t) => (<button key={t} className={`chip-btn ${mtype === t ? 'on' : ''}`} onClick={() => setMtype(t)}>{t}</button>))}</div>
              <div className="ns-grid">
                <NumStep icon="scale" label="Berat" unit="kg" value={w} onChange={setW} step={0.1} prev={kid.w} />
                <NumStep icon="ruler" label={mtype === 'Berdiri' ? 'Tinggi' : 'Panjang'} unit="cm" value={h} onChange={setH} step={0.1} prev={kid.h} />
              </div>
              <AnimatePresence>
                {flags.map((fl) => (
                  <motion.div key={fl} className="notice notice-fix" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Icon n="flag" size={20} /><p>{fl}. Nilai tidak diubah otomatis.</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
          {step === 2 && (
            <>
              <h3>Layanan yang diberikan</h3>
              <div className="chips">
                {SERVICES.map((s) => (<button key={s} className={`chip-btn ${svc.includes(s) ? 'on' : ''}`} onClick={() => toggle(s)} aria-pressed={svc.includes(s)}>{svc.includes(s) && <Icon n="check" size={14} sw={3} />}{s}</button>))}
              </div>
              <p className="tiny"><Icon n="info" size={13} /> Layanan dipilih manual oleh petugas, bukan ditebak dari usia.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h3>Tinjau sebelum kirim</h3>
              <ul className="review">
                <li><Avatar name={kid.name} size={36} /><span>{kid.name}</span></li>
                <li><Icon n="scale" size={18} /><span>{fmt(w)} kg</span></li>
                <li><Icon n="ruler" size={18} /><span>{fmt(h)} cm ({mtype.toLowerCase()})</span></li>
                <li><Icon n="syringe" size={18} /><span>{svc.length ? svc.join(', ') : 'Tanpa layanan tambahan'}</span></li>
                {flags.length > 0 && <li className="rv-flag"><Icon n="flag" size={18} /><span>{flags.length} penanda perlu diperiksa</span></li>}
              </ul>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      {step > 0 && (
        <div className="sheet-act sticky-act">
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}><Icon n="back" size={18} /> Kembali</button>
          {step < 3 ? (
            <button className="btn btn-pri" onClick={() => setStep(step + 1)}>Lanjut <Icon n="arrow" size={18} /></button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => send('draft')}>Simpan draft</button>
              <button className="btn btn-pri" onClick={() => send('pending')}>Kirim <Icon n="arrow" size={18} /></button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ================= VERIFIKASI ================= */
export function CadreVerify() {
  const { role } = useAuth()
  const toast = useToast()
  const can = role === 'midwife'
  const [items, setItems] = useState(seedQueue)
  const [tab, setTab] = useState('pending')
  const [rej, setRej] = useState(null)
  const [why, setWhy] = useState('')
  const tabs = [['pending', 'Menunggu'], ['verified', 'Disahkan'], ['fix', 'Perlu koreksi']]
  const shown = items.filter((i) => i.status === tab)
  const setStatus = (id, status, msg) => { setItems((l) => l.map((i) => (i.id === id ? { ...i, status } : i))); setRej(null); setWhy(''); toast(msg) }

  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}><div><small>{can ? 'Petugas berwenang' : 'Mode kader'}</small><h1>Verifikasi</h1></div></motion.header>
      {!can && (
        <motion.div className="notice" {...stagger(1)}><Icon n="lock" size={20} /><p>Hanya <b>bidan/petugas berwenang</b> yang dapat mengesahkan. Masuk sebagai Bidan untuk mencoba.</p></motion.div>
      )}
      <div className="chips">
        {tabs.map(([k, l]) => (<button key={k} className={`chip-btn ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l} <b className="cnt">{items.filter((i) => i.status === k).length}</b></button>))}
      </div>

      <ul className="vlist">
        <AnimatePresence mode="popLayout">
          {shown.map((it) => (
            <motion.li key={it.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 120, rotate: 4 }} transition={spring} className="vcard">
              <div className="vc-top"><Avatar name={it.kid} size={44} tone={toneOf(it.id)} /><div><strong>{it.kid}</strong><small>{it.reg} · {it.date} · oleh {it.by}</small></div></div>
              <div className="vc-vals">
                <div><Icon n="scale" size={16} /><b>{fmt(it.w)} kg</b><small>{it.w >= it.pw ? '+' : '−'}{fmt(Math.abs(it.w - it.pw))}</small></div>
                <div><Icon n="ruler" size={16} /><b>{fmt(it.h)} cm</b><small>{it.h >= it.ph ? '+' : '−'}{fmt(Math.abs(it.h - it.ph))}</small></div>
              </div>
              {it.flags.map((f) => (<div className="notice notice-fix" key={f}><Icon n="flag" size={18} /><p>{f}</p></div>))}
              {tab === 'pending' && (
                rej === it.id ? (
                  <div className="reject">
                    <input autoFocus value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Alasan wajib diisi" aria-label="Alasan perlu koreksi" />
                    <button className="btn btn-pri" onClick={() => (why.trim().length < 4 ? toast('Alasan wajib diisi') : setStatus(it.id, 'fix', 'Dikembalikan untuk dikoreksi'))}>Kirim</button>
                    <button className="btn btn-ghost" onClick={() => setRej(null)}>Batal</button>
                  </div>
                ) : (
                  <div className="vc-act">
                    <button className="btn btn-pri" disabled={!can} onClick={() => setStatus(it.id, 'verified', 'Catatan disahkan')}><Icon n="check" size={18} sw={3} /> Sahkan</button>
                    <button className="btn btn-ghost" disabled={!can} onClick={() => setRej(it.id)}><Icon n="flag" size={16} /> Perlu koreksi</button>
                  </div>
                )
              )}
              {tab !== 'pending' && <Badge s={it.status} />}
            </motion.li>
          ))}
        </AnimatePresence>
        {shown.length === 0 && (
          <motion.li className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Icon n="check" size={28} sw={2.5} /><br />Semua beres di sini.</motion.li>
        )}
      </ul>
    </div>
  )
}

/* ================= REKAP ================= */
export function CadreRecap() {
  const toast = useToast()
  const [per, setPer] = useState('Nov')
  const r = recap[per]
  const pct = Math.round((r.measured / r.visits) * 100)
  const max = Math.max(...r.weeks)
  const smax = Math.max(...r.services)
  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}>
        <div><small>Rekap agregat · tanpa identitas anak</small><h1>Rekap Posyandu</h1></div>
        <div className="seg">{['Okt', 'Nov'].map((p) => (<button key={p} className={per === p ? 'on' : ''} onClick={() => setPer(p)}>{per === p && <motion.span layoutId="per-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}{p} 2026</button>))}</div>
      </motion.header>

      <div className="stats">
        {[['Sasaran', r.target, 'users'], ['Kunjungan', r.visits, 'plus'], ['Pengukuran', r.measured, 'scale']].map(([l, v, ic], i) => (
          <motion.div key={l + per} className="stat" {...stagger(i + 1)}><span className="m-ic"><Icon n={ic} size={20} /></span><strong><Counter to={v} duration={0.9} /></strong><small>{l}</small></motion.div>
        ))}
        <motion.div className="stat stat-ring" {...stagger(4)}>
          <div className="ring sm"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" className="ring-bg" /><motion.circle key={per} cx="50" cy="50" r="42" className="ring-fg" strokeDasharray="263.9" initial={{ strokeDashoffset: 263.9 }} animate={{ strokeDashoffset: 263.9 * (1 - pct / 100) }} transition={{ duration: 1.2 }} /></svg><strong><Counter key={per} to={pct} duration={1} />%</strong></div>
          <small>Kelengkapan</small>
        </motion.div>
      </div>

      <div className="two">
        <motion.section className="card" {...stagger(5)}>
          <h3>Kunjungan per minggu</h3>
          <div className="vbars">{r.weeks.map((v, i) => (<div key={per + i}><motion.i initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} /><b>{v}</b><small>M{i + 1}</small></div>))}</div>
        </motion.section>
        <motion.section className="card" {...stagger(6)}>
          <h3>Layanan</h3>
          <ul className="hbars">{serviceNames.map((n, i) => (<li key={n}><span>{n}</span><div><motion.i key={per + n} initial={{ width: 0 }} animate={{ width: `${(r.services[i] / smax) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} /></div><b>{r.services[i]}</b></li>))}</ul>
        </motion.section>
      </div>

      <motion.div className="quick" {...stagger(7)}>
        <button className="btn btn-pri" onClick={() => toast('Contoh: ekspor PDF akan terhubung ke backend')}><Icon n="download" size={18} /> Ekspor PDF</button>
        <button className="btn btn-ghost" onClick={() => toast('Contoh: ekspor CSV akan terhubung ke backend')}><Icon n="download" size={18} /> Ekspor CSV</button>
      </motion.div>
    </div>
  )
}

/* ================= BUKU DIGITAL ================= */
export function CadreBooks() {
  const [id, setId] = useState(books[0].id)
  const cur = books.find((b) => b.id === id)
  return (
    <div className="page">
      <motion.header className="page-h" {...stagger(0)}><div><small>Administrasi Posyandu</small><h1>Buku digital</h1></div></motion.header>
      <div className="book-grid">
        {books.map((b, i) => (
          <motion.button key={b.id} className={`bk ${id === b.id ? 'on' : ''}`} onClick={() => setId(b.id)} {...stagger(i + 1)} whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}>
            <span className="bk-ic"><Icon n={b.icon} size={24} /></span><strong>{b.title}</strong><small>{b.count} catatan</small>
          </motion.button>
        ))}
        {['Buku Kas', 'Daftar Bantuan'].map((t) => (
          <div key={t} className="bk bk-soon"><span className="bk-ic"><Icon n="lock" size={22} /></span><strong>{t}</strong><small>Segera · perlu validasi format</small></div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.section key={id} className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
          <h3>{cur.title}</h3>
          <ul className="rows">
            {cur.rows.map((r, i) => (
              <motion.li key={r.join()} className="bk-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <strong>{r[0]}</strong><small>{r[1]}</small><span className="tag">{r[2]}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </AnimatePresence>
    </div>
  )
}
