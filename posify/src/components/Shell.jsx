import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'
import { TLink } from '../context/Transition.jsx'
import { useAuth } from '../context/Auth.jsx'
import { Avatar, Icon, Logo } from './ui.jsx'

const NAV = {
  parent: [
    { to: '/ortu', label: 'Beranda', icon: 'home', end: true },
    { to: '/ortu/pertumbuhan', label: 'Tumbuh', icon: 'chart' },
    { to: '/ortu/imunisasi', label: 'Imunisasi', icon: 'syringe' },
    { to: '/ortu/ringkasan', label: 'Ringkasan', icon: 'sparkle' },
    { to: '/ortu/koreksi', label: 'Koreksi', icon: 'flag' },
  ],
  cadre: [
    { to: '/kader', label: 'Dashboard', icon: 'home', end: true },
    { to: '/kader/anak', label: 'Anak', icon: 'baby' },
    { to: '/kader/kunjungan', label: 'Kunjungan', icon: 'plus' },
    { to: '/kader/verifikasi', label: 'Verifikasi', icon: 'shield' },
    { to: '/kader/rekap', label: 'Rekap', icon: 'chart' },
    { to: '/kader/buku', label: 'Buku', icon: 'book' },
  ],
}

export default function Shell({ kind }) {
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const { user, logout, role } = useAuth()
  const items = NAV[kind]
  const isActive = (i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))

  return (
    <div className="shell">
      <aside className="side">
        <TLink to="/" className="side-logo" aria-label="Posify beranda"><Logo /></TLink>
        <nav aria-label="Menu utama">
          {items.map((i) => (
            <TLink key={i.to} to={i.to} soft className={`side-link ${isActive(i) ? 'on' : ''}`} aria-current={isActive(i) ? 'page' : undefined}>
              {isActive(i) && <motion.span layoutId="side-pill" className="side-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <Icon n={i.icon} size={21} />
              <span>{i.label}</span>
            </TLink>
          ))}
        </nav>
        <div className="side-user">
          <Avatar name={user.person.replace(/^(Bu|Kader|Bidan) /, '')} size={40} />
          <div>
            <strong>{user.person}</strong>
            <small>{user.label}</small>
          </div>
          <TLink to="/" onNavigate={logout} className="icon-btn" aria-label="Keluar"><Icon n="logout" size={18} /></TLink>
        </div>
      </aside>

      <header className="topbar">
        <TLink to="/" aria-label="Posify beranda"><Logo size={32} /></TLink>
        <div className="topbar-r">
          <span className="role-chip">{user.label}</span>
          <TLink to="/" onNavigate={logout} className="icon-btn" aria-label="Keluar"><Icon n="logout" size={18} /></TLink>
        </div>
      </header>

      <main className="content">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="tabbar" aria-label="Menu utama" data-role={role}>
        {items.map((i) => (
          <TLink key={i.to} to={i.to} soft className={`tab ${isActive(i) ? 'on' : ''}`} aria-current={isActive(i) ? 'page' : undefined}>
            {isActive(i) && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <Icon n={i.icon} size={22} />
            <span>{i.label}</span>
          </TLink>
        ))}
      </nav>
    </div>
  )
}
