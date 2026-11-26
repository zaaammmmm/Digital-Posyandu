import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { fmt } from '../data/mock.js'

const W = 640
const pad = { l: 46, r: 22, t: 22, b: 38 }

const smooth = (pts) =>
  pts.reduce((d, p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const q = pts[i - 1]
    const mx = (q[0] + p[0]) / 2
    return `${d} C${mx},${q[1]} ${mx},${p[1]} ${p[0]},${p[1]}`
  }, '')

/**
 * Grafik tren. Pita "ilustrasi" BUKAN standar WHO — hanya visual demo.
 * Interpretasi asli harus datang dari modul perhitungan tervalidasi (lihat PRD §4.1 D).
 */
export default function GrowthChart({ data, metric = 'w', height = 300 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [active, setActive] = useState(data.length - 1)
  const H = height
  const unit = metric === 'w' ? 'kg' : 'cm'
  const vals = data.map((d) => d[metric])
  const spread = metric === 'w' ? 1.4 : 4
  const lo = Math.floor(Math.min(...vals) - spread)
  const hi = Math.ceil(Math.max(...vals) + spread)
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1)
  const y = (v) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo)

  const pts = data.map((d, i) => [x(i), y(d[metric])])
  const line = smooth(pts)
  const area = `${line} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`

  // pita ilustrasi: garis tengah + selisih tetap
  const base = vals[0] - (metric === 'w' ? 0.2 : 0.8)
  const slope = (vals[vals.length - 1] - vals[0]) / (data.length - 1)
  const delta = metric === 'w' ? 1.0 : 3
  const up = data.map((_, i) => [x(i), y(base + slope * i + delta)])
  const dn = data.map((_, i) => [x(i), y(base + slope * i - delta)]).reverse()
  const band = `${smooth(up)} L${dn[0][0]},${dn[0][1]} ${smooth(dn).replace(/^M[^C]*/, '')} Z`

  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)
  const a = data[active]
  const tx = Math.min(Math.max(x(active), 80), W - 80)

  return (
    <figure className="chart" ref={ref} key={metric}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Grafik ${metric === 'w' ? 'berat badan' : 'tinggi badan'} dari ${fmt(vals[0])} ${unit} sampai ${fmt(vals[vals.length - 1])} ${unit}`}>
        <defs>
          <linearGradient id={`ga-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ED1566" stopOpacity=".28" />
            <stop offset="1" stopColor="#ED1566" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" className="axis">{t.toFixed(metric === 'w' ? 1 : 0).replace('.', ',')}</text>
          </g>
        ))}
        <motion.path d={band} className="band" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 1 }} />
        <motion.path d={area} fill={`url(#ga-${metric})`} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 1, delay: 1 }} />
        <motion.path d={line} className="line" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }} />
        {data.map((d, i) => (
          <g key={d.date}>
            <text x={x(i)} y={H - 12} textAnchor="middle" className="axis">{d.m}</text>
            <motion.circle
              cx={x(i)} cy={y(d[metric])} r={i === active ? 8 : 5.5}
              className={`dot ${i === active ? 'dot-on' : ''}`}
              initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
              style={{ transformOrigin: `${x(i)}px ${y(d[metric])}px` }}
              transition={{ delay: 0.5 + i * 0.2, type: 'spring', stiffness: 420, damping: 18 }}
              onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}
              onFocus={() => setActive(i)} tabIndex={0}
              aria-label={`${d.date}: ${fmt(d[metric])} ${unit}`}
            />
          </g>
        ))}
        <circle cx={x(active)} cy={y(a[metric])} r="14" className="pulse" />
        <g transform={`translate(${tx},${Math.max(y(a[metric]) - 52, 4)})`} className="tip">
          <rect x="-62" width="124" height="38" rx="12" />
          <text y="16" textAnchor="middle" className="tip-t">{fmt(a[metric])} {unit}</text>
          <text y="31" textAnchor="middle" className="tip-d">{a.date}</text>
        </g>
      </svg>
      <figcaption>
        <span className="key"><i className="k-line" /> Pengukuran terverifikasi</span>
        <span className="key"><i className="k-band" /> Pita ilustrasi (bukan standar WHO)</span>
      </figcaption>
    </figure>
  )
}
