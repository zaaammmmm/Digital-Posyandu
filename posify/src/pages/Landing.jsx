import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { TLink } from '../context/Transition.jsx'
import { Avatar, Counter, Icon, Logo, Reveal } from '../components/ui.jsx'

const ease = [0.22, 1, 0.36, 1]

/* ---------- headline per kata ---------- */
const Words = ({ text, delay = 0, accent = false }) =>
  text.split(' ').map((w, i) => (
    <span className="w-mask" key={i}>
      <motion.span className={`w-in ${accent ? 'accent' : ''}`} initial={{ y: '118%' }} animate={{ y: 0 }} transition={{ duration: 0.85, delay: delay + i * 0.1, ease }}>
        {w}
      </motion.span>
    </span>
  ))

/* ---------- ponsel + layar ---------- */
const PhoneFrame = ({ children }) => (
  <div className="phone">
    <span className="phone-notch" />
    {children}
  </div>
)

function ScreenParent() {
  const gid = 'phg' + useId().replace(/:/g, '')
  return (
    <div className="sc">
      <div className="ph-head">
        <Avatar name="Aisyah Putri" size={36} />
        <div><b>Aisyah</b><small>18 bulan</small></div>
        <span className="ph-bell"><Icon n="bell" size={16} /></span>
      </div>
      <div className="ph-cards">
        <div className="ph-card"><Icon n="scale" size={18} /><b><Counter to={10.2} decimals={1} /> kg</b><small>↑ 0,2</small></div>
        <div className="ph-card"><Icon n="ruler" size={18} /><b><Counter to={78.4} decimals={1} /> cm</b><small>↑ 0,5</small></div>
      </div>
      <div className="ph-chart">
        <svg viewBox="0 0 200 80" preserveAspectRatio="none">
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ED1566" stopOpacity=".28" /><stop offset="1" stopColor="#ED1566" stopOpacity="0" /></linearGradient></defs>
          <motion.path d="M5,64 C30,60 45,52 70,46 S120,34 140,26 S180,14 195,8 L195,80 L5,80Z" fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} />
          <motion.path d="M5,64 C30,60 45,52 70,46 S120,34 140,26 S180,14 195,8" fill="none" stroke="#ED1566" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 1.4, ease: [0.65, 0, 0.35, 1] }} />
        </svg>
      </div>
      <div className="ph-pill"><Icon n="shield" size={15} /> Disahkan bidan</div>
    </div>
  )
}

function ScreenCadre() {
  return (
    <div className="sc">
      <div className="sc-h"><b>Kunjungan baru</b><small>Aisyah Putri · PSY-0142</small></div>
      <div className="sc-row"><Icon n="scale" size={20} /><span>Berat</span><b>10,2 kg</b></div>
      <div className="sc-row"><Icon n="ruler" size={20} /><span>Tinggi</span><b>78,4 cm</b></div>
      <div className="sc-row"><Icon n="syringe" size={20} /><span>Layanan</span><b>Vitamin A</b></div>
      <div className="sc-btn">Kirim untuk verifikasi <Icon n="arrow" size={16} /></div>
    </div>
  )
}

function ScreenMidwife() {
  return (
    <div className="sc">
      <div className="sc-h"><b>Verifikasi</b><small>1 catatan menunggu</small></div>
      <div className="sc-card">
        <div className="sc-who"><Avatar name="Aisyah Putri" size={34} /><div><b>Aisyah Putri</b><small>12 Nov 2026 · oleh Kader Rina</small></div></div>
        <div className="sc-vals"><span><Icon n="scale" size={15} /> 10,2 kg</span><span><Icon n="ruler" size={15} /> 78,4 cm</span></div>
      </div>
      <div className="sc-btn"><Icon n="check" size={16} sw={3} /> Sahkan</div>
      <div className="sc-ghost"><Icon n="flag" size={14} /> Perlu koreksi</div>
    </div>
  )
}

function Chip({ sx, sy, depth, className, children }) {
  const x = useTransform(sx, [-0.5, 0.5], [-depth, depth])
  const y = useTransform(sy, [-0.5, 0.5], [-depth, depth])
  return (
    <motion.div className={`chip ${className}`} style={{ x, y }}>
      <div className="chip-in">{children}</div>
    </motion.div>
  )
}

function Hero() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 70, damping: 16 })
  const sy = useSpring(my, { stiffness: 70, damping: 16 })
  const px = useTransform(sx, [-0.5, 0.5], [8, -8])
  const py = useTransform(sy, [-0.5, 0.5], [6, -6])
  return (
    <section
      className="hero"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
    >
      <div className="hero-copy">
        <motion.span className="pill" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Icon n="heart" size={14} /> Posyandu digital
        </motion.span>
        <h1>
          <Words text="Buku Posyandu," delay={0.2} />
          <br />
          <Words text="kini di" delay={0.5} /> <Words text="genggaman." delay={0.65} accent />
        </h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.7 }}>
          Data tumbuh kembang anak yang rapi, disahkan bidan, dan mudah dibaca keluarga.
        </motion.p>
        <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.7 }}>
          <TLink to="/masuk" className="btn btn-pri btn-lg">Coba demo <Icon n="arrow" size={20} /></TLink>
          <a href="#cara" className="btn btn-ghost btn-lg">Lihat alurnya</a>
        </motion.div>
      </div>

      <div className="hero-stage">
        <motion.div initial={{ opacity: 0, y: 70 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease }} style={{ x: px, y: py }}>
          <PhoneFrame><ScreenParent /></PhoneFrame>
        </motion.div>
        <Chip sx={sx} sy={sy} depth={26} className="chip-a"><Icon n="calendar" size={18} /><span><b>10 Des</b><small>jadwal berikutnya</small></span></Chip>
        <Chip sx={sx} sy={sy} depth={34} className="chip-b"><Icon n="check" size={18} sw={3} /><span><b>Terverifikasi</b></span></Chip>
      </div>
    </section>
  )
}

/* ---------- Alur data (scroll-linked, sticky) ---------- */
const TOUR = [
  { who: 'Kader', title: 'Mencatat kunjungan', text: 'Berat dan tinggi anak diisi langsung di Posyandu, lengkap dengan penanda bila ada angka yang janggal.', Screen: ScreenCadre },
  { who: 'Bidan', title: 'Mengesahkan', text: 'Hanya bidan yang bisa mengesahkan. Setiap koreksi meninggalkan jejak yang bisa ditelusuri.', Screen: ScreenMidwife },
  { who: 'Orang tua', title: 'Melihat hasilnya', text: 'Grafik dan ringkasan bahasa sederhana muncul setelah catatan disahkan.', Screen: ScreenParent },
]

function Tour() {
  const ref = useRef(null)
  const [i, setI] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(p, 'change', (v) => setI(Math.min(TOUR.length - 1, Math.max(0, Math.floor(v * TOUR.length)))))
  const bar = useTransform(p, [0, 1], [0.12, 1])
  const { Screen } = TOUR[i]
  return (
    <section id="cara" ref={ref} className="tour">
      <div className="tour-sticky">
        <div className="tour-copy">
          <div>
            <span className="pill">Alur data</span>
            <h2>Dari Posyandu sampai ke rumah.</h2>
          </div>
          <div className="tour-list">
            <div className="tour-bar" aria-hidden="true"><motion.i style={{ scaleY: bar }} /></div>
            {TOUR.map((t, k) => (
              <div key={t.who} className={`tour-item ${k === i ? 'on' : ''}`}>
                <small>0{k + 1} · {t.who}</small>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="tour-stage">
          <PhoneFrame>
            <AnimatePresence mode="wait">
              <motion.div key={i} className="sc-wrap" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28 }}>
                <Screen />
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </div>
    </section>
  )
}

/* ---------- Fitur ---------- */
function Features() {
  const tiles = [
    { cls: 'f-wide tile-hot', icon: 'chart', title: 'Grafik tumbuh', viz: (
      <svg viewBox="0 0 200 70" className="v-spark"><motion.path d="M6,60 C34,56 50,44 80,38 S130,26 152,18 S182,10 194,6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} /></svg>) },
    { cls: 'f-narrow', icon: 'syringe', title: 'Imunisasi', viz: (
      <div className="v-dots">{Array.from({ length: 8 }).map((_, i) => (<motion.i key={i} className={i < 6 ? 'on' : ''} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 400, damping: 14 }} />))}</div>) },
    { cls: 'f-narrow', icon: 'sparkle', title: 'Ringkasan ramah', viz: (
      <div className="v-lines">{[88, 64, 76].map((w, i) => (<motion.i key={i} initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.15, duration: 0.8, ease }} />))}</div>) },
    { cls: 'f-wide', icon: 'book', title: 'Rekap & buku digital', viz: (
      <div className="v-bars">{[40, 68, 52, 90, 74].map((h, i) => (<motion.i key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease }} />))}</div>) },
  ]
  return (
    <section id="fitur" className="sec">
      <Reveal className="sec-head"><span className="pill">Fitur</span><h2>Semua buku, satu tempat.</h2></Reveal>
      <div className="bento">
        {tiles.map((t, i) => (
          <Reveal key={t.title} delay={(i % 2) * 0.1} className={`tile ${t.cls}`}>
            <div className="tile-top"><span className="tile-ic"><Icon n={t.icon} size={22} /></span><h3>{t.title}</h3></div>
            <div className="tile-viz">{t.viz}</div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- Untuk siapa ---------- */
function Roles() {
  const roles = [
    { id: 'parent', icon: 'heart', title: 'Orang tua', pts: ['Grafik tumbuh', 'Jadwal & pengingat', 'Ringkasan mudah'] },
    { id: 'cadre', icon: 'clipboard', title: 'Kader', pts: ['Catat cepat', 'Daftar tugas', 'Rekap otomatis'] },
    { id: 'midwife', icon: 'shield', title: 'Bidan', pts: ['Tinjau catatan', 'Sahkan data', 'Jejak koreksi'] },
  ]
  return (
    <section id="untuk" className="sec">
      <Reveal className="sec-head"><span className="pill">Untuk siapa</span><h2>Satu aplikasi, tiga peran.</h2></Reveal>
      <div className="roles">
        {roles.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.12}>
            <TLink to={`/masuk?role=${r.id}`} className="role-card">
              <span className="rc-ic"><Icon n={r.icon} size={34} /></span>
              <h3>{r.title}</h3>
              <ul>{r.pts.map((p, k) => (<li key={p} style={{ '--k': k }}><Icon n="check" size={15} sw={3} />{p}</li>))}</ul>
              <span className="rc-go">Coba <Icon n="arrow" size={18} /></span>
            </TLink>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Trust() {
  const t = [
    { icon: 'shield', text: 'Bukan alat diagnosis' },
    { icon: 'check', text: 'Disahkan petugas dulu' },
    { icon: 'lock', text: 'Hanya anak Anda' },
  ]
  return (
    <Reveal className="trust">
      {t.map((x) => (<span key={x.text} className="trust-item"><Icon n={x.icon} size={18} />{x.text}</span>))}
    </Reveal>
  )
}

function CTA() {
  return (
    <section className="cta-wrap">
      <Reveal className="cta">
        <h2>Siap mencoba Posify?</h2>
        <TLink to="/masuk" className="btn btn-white btn-lg">Coba demo <Icon n="arrow" size={20} /></TLink>
      </Reveal>
    </section>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <div className="landing">
      <motion.header className={`nav ${scrolled ? 'nav-s' : ''}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.7, ease }}>
        <TLink to="/" aria-label="Posify"><Logo /></TLink>
        <nav className="nav-links" aria-label="Bagian halaman">
          <a href="#cara">Alur</a>
          <a href="#fitur">Fitur</a>
          <a href="#untuk">Peran</a>
        </nav>
        <TLink to="/masuk" className="btn btn-pri">Coba demo</TLink>
      </motion.header>
      <Hero />
      <Tour />
      <Features />
      <Roles />
      <Trust />
      <CTA />
      <footer className="footer">
        <Logo size={30} />
        <p>Prototype lomba web development. Seluruh data adalah data sintetis. Posify bukan pengganti Buku KIA maupun saran tenaga kesehatan.</p>
      </footer>
    </div>
  )
}
