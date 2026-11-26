import { useEffect, useId, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'

/* ---------- Ikon (stroke) ---------- */
const P = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  baby: <><circle cx="12" cy="12.5" r="8.5" /><path d="M9 11.5h.01M15 11.5h.01" /><path d="M9 15.2c1 1.2 2 1.6 3 1.6s2-.4 3-1.6" /><path d="M12 4c0-1.4 1.2-2.2 2.4-1.8" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></>,
  syringe: <><path d="M18 2l4 4" /><path d="M17 7l3-3" /><path d="M19 9L8.5 19.5a2.1 2.1 0 0 1-3 0l-1-1a2.1 2.1 0 0 1 0-3L15 5" /><path d="M9 11l4 4" /><path d="M5 19l-3 3" /><path d="M14 4l6 6" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  flag: <><path d="M4 22V4" /><path d="M4 4h13l-2 4 2 4H4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 15c3 0 5 1.5 5 5" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5V21h16" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12h6M9 16h4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  scale: <><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M7.5 9.5a6 6 0 0 1 9 0" /><path d="M12 9.5l2-2.5" /></>,
  ruler: <><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  heart: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  download: <><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  pin: <><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  leaf: <><path d="M5 21c0-9 5-16 16-17 0 11-6 16-14 16" /><path d="M5 21c2-5 5-8 9-10" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
}

export function Icon({ n, size = 22, sw = 2, ...p }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {P[n]}
    </svg>
  )
}

/* ---------- Logo ----------
   Isi LOGO_SRC dengan path logo buatan sendiri (mis. '/logo.svg' di folder public)
   untuk mengganti logo sementara ini. */
const LOGO_SRC = null

export function Logo({ size = 38, light = false, text = true }) {
  const gid = 'lg' + useId().replace(/:/g, '')
  if (LOGO_SRC) return <img src={LOGO_SRC} height={size} alt="Posify" className="logo-img" />
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F46095" />
            <stop offset="1" stopColor="#ED1566" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="19" fill={light ? '#fff' : `url(#${gid})`} />
        <path d="M32 47S16 38 16 26a8.5 8.5 0 0 1 16-4 8.5 8.5 0 0 1 16 4c0 12-16 21-16 21z" fill={light ? '#ED1566' : '#fff'} />
      </svg>
      {text && <span className="logo-word">Posify</span>}
    </span>
  )
}

/* ---------- Counter ---------- */
export function Counter({ to, decimals = 0, suffix = '', duration = 1.3 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: setV })
    return () => c.stop()
  }, [inView, to, duration])
  return <span ref={ref}>{v.toFixed(decimals).replace('.', ',')}{suffix}</span>
}

/* ---------- Reveal on scroll ---------- */
export function Reveal({ children, delay = 0, y = 30, x = 0, className = '', ...p }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...p}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Badge status (ikon + teks, bukan warna saja) ---------- */
export const STATUS = {
  verified: { label: 'Terverifikasi', icon: 'check', cls: 'ok' },
  pending: { label: 'Menunggu Verifikasi', icon: 'clock', cls: 'wait' },
  fix: { label: 'Perlu Koreksi', icon: 'flag', cls: 'fix' },
  draft: { label: 'Draft', icon: 'edit', cls: 'draft' },
  none: { label: 'Belum diukur', icon: 'minus', cls: 'draft' },
  done: { label: 'Tercatat', icon: 'check', cls: 'ok' },
  scheduled: { label: 'Dijadwalkan', icon: 'calendar', cls: 'wait' },
  unrecorded: { label: 'Belum tercatat', icon: 'info', cls: 'fix' },
}

export function Badge({ s }) {
  const x = STATUS[s]
  return (
    <span className={`badge b-${x.cls}`}>
      <Icon n={x.icon} size={13} sw={2.6} />
      {x.label}
    </span>
  )
}

/* ---------- Avatar anak (ilustrasi sederhana) ---------- */
export function Avatar({ name = '', size = 48, tone = 0 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const tones = ['#ED1566', '#9E1348', '#F46095']
  return (
    <span className="avatar" style={{ width: size, height: size, background: tones[tone % 3], fontSize: size * 0.38 }}>
      {initials}
    </span>
  )
}

/* ---------- Latar dekoratif ---------- */
export function Blobs() {
  return (
    <div className="blobs" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      <span className="plus p1">+</span>
      <span className="plus p2">+</span>
      <span className="orbit o1" />
      <span className="orbit o2" />
    </div>
  )
}

/* ---------- Typewriter per kata ---------- */
export function Typewriter({ text, run = 0, speed = 55 }) {
  const words = text.split(' ')
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id = setInterval(() => setN((x) => (x >= words.length ? x : x + 1)), speed)
    return () => clearInterval(id)
  }, [run, text, speed, words.length])
  return (
    <p className="typed" aria-label={text}>
      <span aria-hidden="true">{words.slice(0, n).join(' ')}</span>
      {n < words.length && <span className="caret" aria-hidden="true" />}
    </p>
  )
}
