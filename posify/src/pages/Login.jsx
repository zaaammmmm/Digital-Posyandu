import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { TLink, useNav } from '../context/Transition.jsx'
import { ROLES, useAuth } from '../context/Auth.jsx'
import { Blobs, Icon, Logo } from '../components/ui.jsx'

const OPTIONS = [
  { id: 'parent', icon: 'heart', title: 'Orang Tua', desc: 'Lihat tumbuh kembang si kecil' },
  { id: 'cadre', icon: 'clipboard', title: 'Kader', desc: 'Catat kunjungan & pengukuran' },
  { id: 'midwife', icon: 'shield', title: 'Bidan', desc: 'Periksa & sahkan catatan' },
]

export default function Login() {
  const [params] = useSearchParams()
  const initial = OPTIONS.some((o) => o.id === params.get('role')) ? params.get('role') : 'parent'
  const [sel, setSel] = useState(initial)
  const { login } = useAuth()
  const { go } = useNav()

  return (
    <div className="login">
      <aside className="login-art">
        <Blobs />
        <TLink to="/" className="login-back"><Icon n="back" size={18} /> Beranda</TLink>
        <div className="login-art-in">
          <Logo light size={48} />
          <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            Tumbuh bersama,<br />tercatat rapi.
          </motion.h2>
          <div className="login-orbs" aria-hidden="true">
            {['scale', 'syringe', 'chart', 'bell'].map((n, i) => (
              <motion.span key={n} className="orb" style={{ '--i': i }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 300, damping: 14 }}>
                <Icon n={n} size={26} />
              </motion.span>
            ))}
          </div>
        </div>
      </aside>

      <section className="login-form">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="pill"><Icon n="sparkle" size={14} /> Mode demo</span>
          <h1>Masuk sebagai</h1>
          <p className="muted">Pilih peran untuk menjelajahi Posify. Semua data adalah data contoh.</p>

          <div className="role-list" role="radiogroup" aria-label="Pilih peran">
            {OPTIONS.map((o) => (
              <button key={o.id} role="radio" aria-checked={sel === o.id} className={`role-opt ${sel === o.id ? 'on' : ''}`} onClick={() => setSel(o.id)}>
                {sel === o.id && <motion.span layoutId="role-ring" className="role-ring" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="role-ic"><Icon n={o.icon} size={24} /></span>
                <span className="role-tx"><strong>{o.title}</strong><small>{o.desc}</small></span>
                <motion.span className="role-check" animate={{ scale: sel === o.id ? 1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}><Icon n="check" size={16} sw={3} /></motion.span>
              </button>
            ))}
          </div>

          <button className="btn btn-pri btn-lg full" onClick={() => { login(sel); go(ROLES[sel].home) }}>
            Masuk <Icon n="arrow" size={20} />
          </button>
          <p className="tiny"><Icon n="lock" size={13} /> Prototype lomba — tanpa kata sandi, tanpa data nyata.</p>
        </motion.div>
      </section>
    </div>
  )
}
