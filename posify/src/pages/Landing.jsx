import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { TLink } from '../context/Transition.jsx'
import { Avatar, Blobs, Counter, Icon, Logo, Reveal } from '../components/ui.jsx'

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

/* ---------- mockup ponsel ---------- */
function Phone() {
  return (
    <div className="phone">
      <span className="phone-notch" />
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
          <defs><linearGradient id="phg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ED1566" stopOpacity=".3" /><stop offset="1" stopColor="#ED1566" stopOpacity="0" /></linearGradient></defs>
          <motion.path d="M5,64 C30,60 45,52 70,46 S120,34 140,26 S180,14 195,8 L195,80 L5,80Z" fill="url(#phg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.8 }} />
          <motion.path d="M5,64 C30,60 45,52 70,46 S120,34 140,26 S180,14 195,8" fill="none" stroke="#ED1566" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 1.5, ease: [0.65, 0, 0.35, 1] }} />
        </svg>
      </div>
      <div className="ph-dots">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.i key={i} className={i < 6 ? 'on' : ''} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 + i * 0.07, type: 'spring', stiffness: 400, damping: 14 }} />
        ))}
      </div>
      <div className="ph-pill"><Icon n="shield" size={15} /> Disahkan bidan</div>
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
  const px = useTransform(sx, [-0.5, 0.5], [10, -10])
  const py = useTransform(sy, [-0.5, 0.5], [8, -8])
  return (
    <section
      className="hero"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
    >
      <Blobs />
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
          Catat. Pantau. Ingat. Tumbuh kembang si kecil, dalam satu aplikasi.
        </motion.p>
        <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.7 }}>
          <TLink to="/masuk" className="btn btn-pri btn-lg">Coba demo <Icon n="arrow" size={20} /></TLink>
          <a href="#cara" className="btn btn-ghost btn-lg">Lihat caranya</a>
        </motion.div>
      </div>

      <div className="hero-stage">
        <motion.div className="stage-glow" style={{ x: px, y: py }} />
        <motion.div initial={{ opacity: 0, y: 80, rotate: 6 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 0.5, duration: 1, ease }} style={{ x: px, y: py }}>
          <Phone />
        </motion.div>
        <Chip sx={sx} sy={sy} depth={26} className="chip-a"><Icon n="scale" size={18} /><span><b>10,2 kg</b><small>naik 0,2</small></span></Chip>
        <Chip sx={sx} sy={sy} depth={34} className="chip-b"><Icon n="calendar" size={18} /><span><b>10 Des</b><small>jadwal berikutnya</small></span></Chip>
        <Chip sx={sx} sy={sy} depth={18} className="chip-c"><Icon n="check" size={18} sw={3} /><span><b>Terverifikasi</b></span></Chip>
        <Chip sx={sx} sy={sy} depth={40} className="chip-d"><Icon n="heart" size={20} /></Chip>
      </div>
    </section>
  )
}

/* ---------- ribbon ---------- */
function Ribbon() {
  const items = ['Catat', 'Pantau', 'Ingat', 'Pahami', 'Tumbuh']
  const row = [...items, ...items, ...items, ...items]
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon-track">
        {[0, 1].map((k) => (
          <div className="ribbon-row" key={k}>
            {row.map((t, i) => (<span key={i}>{t}<Icon n="sparkle" size={20} /></span>))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Dari kertas ke genggaman (scroll-linked) ---------- */
function Morph() {
  const ref = useRef(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const bookO = useTransform(p, [0, 0.4, 0.58], [1, 1, 0])
  const bookR = useTransform(p, [0, 0.58], [0, -75])
  const bookS = useTransform(p, [0, 0.58], [1, 0.78])
  const bookX = useTransform(p, [0, 0.58], [0, -60])
  const painO = useTransform(p, [0.05, 0.2, 0.42], [0, 1, 0])
  const phoneO = useTransform(p, [0.4, 0.62], [0, 1])
  const phoneY = useTransform(p, [0.4, 0.75], [120, 0])
  const phoneS = useTransform(p, [0.4, 0.75], [0.78, 1])
  const gain1 = useTransform(p, [0.62, 0.74], [0, 1])
  const gain2 = useTransform(p, [0.68, 0.8], [0, 1])
  const gain3 = useTransform(p, [0.74, 0.86], [0, 1])
  const t1 = useTransform(p, [0, 0.4, 0.55], [1, 1, 0])
  const t2 = useTransform(p, [0.45, 0.65], [0, 1])
  return (
    <section id="cara" ref={ref} className="morph">
      <div className="morph-sticky">
        <div className="morph-titles">
          <motion.h2 style={{ opacity: t1 }}>Buku kertas…</motion.h2>
          <motion.h2 style={{ opacity: t2 }} className="accent-h">menjadi Posify.</motion.h2>
        </div>
        <div className="morph-stage">
          <motion.div className="book" style={{ opacity: bookO, rotateY: bookR, scale: bookS, x: bookX }}>
            <div className="book-spine" />
            <div className="book-page">
              <b>Buku Posyandu</b>
              {[70, 90, 55, 80, 65, 85].map((w, i) => (<i key={i} style={{ width: `${w}%` }} />))}
              <svg viewBox="0 0 120 40" className="scribble"><path d="M4,30 C20,6 30,36 46,18 S78,8 92,26 116,14 116,14" fill="none" stroke="#9E1348" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>
          </motion.div>
          <motion.div className="pain pain-1" style={{ opacity: painO }}><Icon n="x" size={16} sw={3} /> Tercecer</motion.div>
          <motion.div className="pain pain-2" style={{ opacity: painO }}><Icon n="x" size={16} sw={3} /> Hilang</motion.div>
          <motion.div className="pain pain-3" style={{ opacity: painO }}><Icon n="x" size={16} sw={3} /> Lupa jadwal</motion.div>

          <motion.div className="morph-phone" style={{ opacity: phoneO, y: phoneY, scale: phoneS }}>
            <Phone />
          </motion.div>
          <motion.div className="gain gain-1" style={{ opacity: gain1, scale: gain1 }}><Icon n="check" size={16} sw={3} /> Rapi</motion.div>
          <motion.div className="gain gain-2" style={{ opacity: gain2, scale: gain2 }}><Icon n="shield" size={16} /> Tersimpan</motion.div>
          <motion.div className="gain gain-3" style={{ opacity: gain3, scale: gain3 }}><Icon n="bell" size={16} /> Mengingatkan</motion.div>
        </div>
        <div className="scroll-hint" aria-hidden="true"><span /></div>
      </div>
    </section>
  )
}

/* ---------- 3 langkah ---------- */
function StepArt1() {
  return (
    <div className="art art1">
      <motion.span className="art-ic" initial={{ rotate: -20, scale: 0.6 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}><Icon n="scale" size={46} /></motion.span>
      <div className="art-num"><Counter to={10.2} decimals={1} /> <small>kg</small></div>
      <div className="art-ruler">{Array.from({ length: 14 }).map((_, i) => (<motion.i key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className={i % 5 === 0 ? 'long' : ''} />))}</div>
    </div>
  )
}
function StepArt2() {
  return (
    <div className="art art2">
      <svg viewBox="0 0 100 110" width="130" height="143">
        <motion.path d="M50 8l38 14v28c0 26-17 42-38 50-21-8-38-24-38-50V22z" fill="#FCE4EC" stroke="#ED1566" strokeWidth="5" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
        <motion.path d="M32 54l13 13 25-27" fill="none" stroke="#9E1348" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 1 }} />
      </svg>
    </div>
  )
}
function StepArt3() {
  return (
    <div className="art art3">
      <div className="mini-phone">
        <motion.i className="mp-line" initial={{ width: 0 }} whileInView={{ width: '80%' }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }} />
        <motion.i className="mp-line" initial={{ width: 0 }} whileInView={{ width: '55%' }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8 }} />
        <motion.i className="mp-line" initial={{ width: 0 }} whileInView={{ width: '68%' }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.8 }} />
        <span className="mp-heart"><Icon n="heart" size={26} /></span>
      </div>
      <span className="spark s1"><Icon n="sparkle" size={22} /></span>
      <span className="spark s2"><Icon n="sparkle" size={16} /></span>
    </div>
  )
}

function Steps() {
  const steps = [
    { n: '01', who: 'Kader', title: 'Mencatat', Art: StepArt1 },
    { n: '02', who: 'Bidan', title: 'Mengesahkan', Art: StepArt2 },
    { n: '03', who: 'Orang tua', title: 'Memahami', Art: StepArt3 },
  ]
  return (
    <section id="langkah" className="sec steps">
      <Reveal className="sec-head"><span className="pill">Cara kerja</span><h2>Tiga langkah, selesai.</h2></Reveal>
      <div className="steps-row">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.15} className="step-wrap">
            <div className="step">
              <span className="step-n">{s.n}</span>
              <s.Art />
              <small>{s.who}</small>
              <h3>{s.title}</h3>
            </div>
            {i < 2 && (
              <svg className="step-arrow" viewBox="0 0 60 24" aria-hidden="true">
                <motion.path d="M2 12h50M42 4l10 8-10 8" fill="none" stroke="#F46095" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.3, duration: 0.8 }} />
              </svg>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- Fitur (bento) ---------- */
function Features() {
  const tiles = [
    { cls: 'f-wide', icon: 'baby', title: 'Profil anak', viz: (
      <div className="v-avatars">{['Aisyah P', 'Rafif P', 'Naura A', 'Bima S', 'Kirana D'].map((n, i) => (
        <motion.span key={n} initial={{ x: -20, opacity: 0, scale: 0.5 }} whileInView={{ x: 0, opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 15 }}><Avatar name={n} size={46} tone={i} /></motion.span>
      ))}</div>) },
    { cls: 'f-tall', icon: 'chart', title: 'Grafik tumbuh', viz: (
      <svg viewBox="0 0 200 110" className="v-spark"><motion.path d="M8,92 C34,86 50,70 80,62 S130,44 152,30 S182,18 192,12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6 }} />
        {[[8, 92], [80, 62], [152, 30], [192, 12]].map(([x, y], i) => (<motion.circle key={i} cx={x} cy={y} r="6" fill="#fff" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.35 }} style={{ transformOrigin: `${x}px ${y}px` }} />))}
      </svg>) },
    { cls: '', icon: 'syringe', title: 'Imunisasi', viz: (
      <div className="v-dots">{Array.from({ length: 8 }).map((_, i) => (<motion.i key={i} className={i < 6 ? 'on' : ''} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.09, type: 'spring', stiffness: 400, damping: 12 }} />))}</div>) },
    { cls: '', icon: 'bell', title: 'Pengingat', viz: (<div className="v-bell"><span className="bell-ring"><Icon n="bell" size={40} /></span><b>10 Des</b></div>) },
    { cls: 'f-wide', icon: 'sparkle', title: 'Ringkasan ramah', viz: (
      <div className="v-lines">{[88, 64, 76].map((w, i) => (<i key={i} style={{ width: `${w}%`, animationDelay: `${i * 0.25}s` }} />))}</div>) },
    { cls: '', icon: 'book', title: 'Rekap & buku digital', viz: (
      <div className="v-bars">{[40, 68, 52, 90, 74].map((h, i) => (<motion.i key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease }} />))}</div>) },
  ]
  return (
    <section id="fitur" className="sec">
      <Reveal className="sec-head"><span className="pill">Fitur</span><h2>Semua buku, satu tempat.</h2></Reveal>
      <div className="bento">
        {tiles.map((t, i) => (
          <Reveal key={t.title} delay={(i % 3) * 0.1} className={`tile ${t.cls} ${i === 1 ? 'tile-hot' : ''}`}>
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
              <ul>{r.pts.map((p) => (<li key={p}><Icon n="check" size={15} sw={3} />{p}</li>))}</ul>
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
    { icon: 'file', text: 'Jejak koreksi tercatat' },
    { icon: 'lock', text: 'Hanya anak Anda' },
  ]
  return (
    <section className="trust">
      {t.map((x, i) => (
        <Reveal key={x.text} delay={i * 0.08} className="trust-item"><Icon n={x.icon} size={22} /><span>{x.text}</span></Reveal>
      ))}
    </section>
  )
}

function CTA() {
  return (
    <section className="cta-wrap">
      <Reveal className="cta">
        <Blobs />
        <h2>Siap catat tumbuh kembang si kecil?</h2>
        <TLink to="/masuk" className="btn btn-white btn-lg">Coba demo Posify <Icon n="arrow" size={20} /></TLink>
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
          <a href="#cara">Cara kerja</a>
          <a href="#fitur">Fitur</a>
          <a href="#untuk">Peran</a>
        </nav>
        <TLink to="/masuk" className="btn btn-pri">Coba demo</TLink>
      </motion.header>
      <Hero />
      <Ribbon />
      <Morph />
      <Steps />
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
